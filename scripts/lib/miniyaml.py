"""miniyaml — a dependency-free YAML subset loader/dumper (Python stdlib only).

The Autonomous System Building OS must validate its own YAML artifacts without
requiring PyYAML (which cannot always be installed, e.g. PEP-668 environments).

Supported subset (sufficient for every YAML file authored by this OS):
  * block mappings and block sequences with 2-space indentation
  * nested mappings / sequences
  * scalars: str, int, float, bool (true/false/yes/no), null (null/~/empty)
  * quoted strings ('...' and "..."), preserving special chars
  * inline flow sequences  [a, b, c]
  * inline flow mappings    {a: 1, b: 2}
  * block literal/folded scalars ( | and > ) with indentation
  * '#' comments and '---' document markers
  * '- key: value' compact mapping-in-sequence entries

It is intentionally strict and small. Unknown / unsupported constructs raise
MiniYAMLError with a line number so authoring mistakes surface loudly.
"""
from __future__ import annotations

import re
from typing import Any


class MiniYAMLError(ValueError):
    pass


_TRUE = {"true", "yes", "on"}
_FALSE = {"false", "no", "off"}
_NULL = {"null", "~", ""}


def _strip_comment(line: str) -> str:
    """Remove a trailing unquoted '#' comment."""
    out = []
    in_s = in_d = False
    i = 0
    while i < len(line):
        c = line[i]
        if c == "'" and not in_d:
            in_s = not in_s
        elif c == '"' and not in_s:
            in_d = not in_d
        elif c == "#" and not in_s and not in_d:
            if i == 0 or line[i - 1] in " \t":
                break
        out.append(c)
        i += 1
    return "".join(out).rstrip()


def _unescape_double(s: str) -> str:
    out, i = [], 0
    while i < len(s):
        c = s[i]
        if c == "\\" and i + 1 < len(s):
            nxt = s[i + 1]
            out.append({"n": "\n", "t": "\t", "r": "\r", '"': '"', "\\": "\\"}.get(nxt, nxt))
            i += 2
            continue
        out.append(c)
        i += 1
    return "".join(out)


def _parse_scalar(tok: str) -> Any:
    tok = tok.strip()
    if len(tok) >= 2 and tok[0] == tok[-1] and tok[0] == '"':
        return _unescape_double(tok[1:-1])
    if len(tok) >= 2 and tok[0] == tok[-1] and tok[0] == "'":
        return tok[1:-1].replace("''", "'")
    if tok.startswith("[") and tok.endswith("]"):
        return _parse_flow_seq(tok)
    if tok.startswith("{") and tok.endswith("}"):
        return _parse_flow_map(tok)
    low = tok.lower()
    if low in _NULL:
        return None
    if low in _TRUE:
        return True
    if low in _FALSE:
        return False
    if re.fullmatch(r"[-+]?\d+", tok):
        return int(tok)
    if re.fullmatch(r"[-+]?(\d+\.\d*|\.\d+|\d+)([eE][-+]?\d+)?", tok) and (
        "." in tok or "e" in low
    ):
        try:
            return float(tok)
        except ValueError:
            return tok
    return tok


def _split_flow(body: str) -> list[str]:
    parts, depth, cur, in_s, in_d = [], 0, [], False, False
    for c in body:
        if c == "'" and not in_d:
            in_s = not in_s
        elif c == '"' and not in_s:
            in_d = not in_d
        if not in_s and not in_d:
            if c in "[{":
                depth += 1
            elif c in "]}":
                depth -= 1
            elif c == "," and depth == 0:
                parts.append("".join(cur))
                cur = []
                continue
        cur.append(c)
    if "".join(cur).strip():
        parts.append("".join(cur))
    return parts


def _parse_flow_seq(tok: str) -> list:
    body = tok[1:-1].strip()
    if not body:
        return []
    return [_parse_scalar(p.strip()) for p in _split_flow(body)]


def _parse_flow_map(tok: str) -> dict:
    body = tok[1:-1].strip()
    out: dict = {}
    if not body:
        return out
    for p in _split_flow(body):
        if ":" not in p:
            raise MiniYAMLError(f"bad flow map entry: {p!r}")
        k, v = p.split(":", 1)
        out[_parse_scalar(k.strip())] = _parse_scalar(v.strip())
    return out


class _Line:
    __slots__ = ("indent", "text", "no")

    def __init__(self, indent: int, text: str, no: int):
        self.indent = indent
        self.text = text
        self.no = no


def _tokenize(text: str) -> list[_Line]:
    lines: list[_Line] = []
    for i, raw in enumerate(text.splitlines(), 1):
        if raw.strip() in ("---", "..."):
            continue
        stripped = _strip_comment(raw)
        if not stripped.strip():
            continue
        indent = len(stripped) - len(stripped.lstrip(" "))
        lines.append(_Line(indent, stripped.strip(), i))
    return lines


def loads(text: str) -> Any:
    lines = _tokenize(text)
    if not lines:
        return None
    value, idx = _parse_block(lines, 0, lines[0].indent)
    if idx != len(lines):
        raise MiniYAMLError(
            f"line {lines[idx].no}: unexpected indentation / trailing content"
        )
    return value


def _parse_block(lines: list[_Line], idx: int, indent: int):
    if lines[idx].text.startswith("- "):
        return _parse_seq(lines, idx, indent)
    return _parse_map(lines, idx, indent)


def _parse_seq(lines: list[_Line], idx: int, indent: int):
    seq: list = []
    while idx < len(lines) and lines[idx].indent == indent and lines[idx].text.startswith("- "):
        content = lines[idx].text[2:].strip()
        if content == "":
            idx += 1
            if idx < len(lines) and lines[idx].indent > indent:
                val, idx = _parse_block(lines, idx, lines[idx].indent)
                seq.append(val)
            else:
                seq.append(None)
        elif ":" in content and not (content.startswith(("[", "{", "'", '"'))) and _looks_like_map_entry(content):
            # compact mapping in sequence:  - key: value
            item_indent = lines[idx].indent + 2
            synth = _Line(item_indent, content, lines[idx].no)
            saved = lines[idx]
            lines[idx] = synth
            val, idx = _parse_map(lines, idx, item_indent, first_key_line=saved)
            seq.append(val)
        else:
            seq.append(_parse_scalar(content))
            idx += 1
    return seq, idx


def _looks_like_map_entry(content: str) -> bool:
    # heuristics: "key:" or "key: value" where key has no spaces before colon issue
    m = re.match(r"^[^:'\"\[\]{}]+:(\s|$)", content)
    return bool(m)


def _parse_map(lines: list[_Line], idx: int, indent: int, first_key_line=None):
    mapping: dict = {}
    # handle a synthesized first line (compact seq mapping) already at lines[idx]
    while idx < len(lines) and lines[idx].indent == indent and not lines[idx].text.startswith("- "):
        line = lines[idx]
        text = line.text
        if ":" not in text:
            raise MiniYAMLError(f"line {line.no}: expected 'key: value', got {text!r}")
        key, _, rest = text.partition(":")
        key = _parse_scalar(key.strip())
        rest = rest.strip()
        if rest == "":
            idx += 1
            if idx < len(lines) and lines[idx].indent > indent:
                child_indent = lines[idx].indent
                val, idx = _parse_block(lines, idx, child_indent)
                mapping[key] = val
            else:
                mapping[key] = None
        elif rest in ("|", ">", "|-", ">-", "|+", ">+"):
            block_val, idx = _parse_block_scalar(lines, idx + 1, indent, rest)
            mapping[key] = block_val
        else:
            mapping[key] = _parse_scalar(rest)
            idx += 1
    return mapping, idx


def _parse_block_scalar(lines: list[_Line], idx: int, parent_indent: int, style: str):
    collected: list[str] = []
    block_indent = None
    while idx < len(lines) and lines[idx].indent > parent_indent:
        if block_indent is None:
            block_indent = lines[idx].indent
        pad = " " * (lines[idx].indent - block_indent)
        collected.append(pad + lines[idx].text)
        idx += 1
    if style.startswith(">"):
        text = " ".join(collected)
    else:
        text = "\n".join(collected)
    if style.endswith("-"):
        text = text.rstrip("\n")
    return text, idx


# ---------------------------------------------------------------------------
# Dumper (canonical block style) — used when the OS emits YAML mirrors.
# ---------------------------------------------------------------------------
def _needs_quote(s: str) -> bool:
    if s == "":
        return True
    if s.lower() in _TRUE | _FALSE | _NULL:
        return True
    if re.fullmatch(r"[-+]?\d+(\.\d+)?", s):
        return True
    if any(c in s for c in "\n\t\r"):
        return True
    return bool(re.search(r"[:#\[\]{},&*!|>'\"%@`]", s)) or s[0] in " -?" or s[-1] == " "


def _dump_scalar(v: Any) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v)
    if _needs_quote(s):
        esc = (
            s.replace("\\", "\\\\")
            .replace('"', '\\"')
            .replace("\n", "\\n")
            .replace("\t", "\\t")
            .replace("\r", "\\r")
        )
        return '"' + esc + '"'
    return s


def dumps(obj: Any, indent: int = 0) -> str:
    pad = "  " * indent
    lines: list[str] = []
    if isinstance(obj, dict):
        if not obj:
            return pad + "{}\n"
        for k, v in obj.items():
            if isinstance(v, (dict, list)) and v:
                lines.append(f"{pad}{k}:")
                lines.append(dumps(v, indent + 1).rstrip("\n"))
            elif isinstance(v, (dict, list)):
                lines.append(f"{pad}{k}: " + ("{}" if isinstance(v, dict) else "[]"))
            else:
                lines.append(f"{pad}{k}: {_dump_scalar(v)}")
    elif isinstance(obj, list):
        if not obj:
            return pad + "[]\n"
        for item in obj:
            if isinstance(item, dict) and item:
                inner = dumps(item, indent + 1)
                inner_lines = inner.rstrip("\n").split("\n")
                first = inner_lines[0].lstrip()
                lines.append(f"{pad}- {first}")
                for extra in inner_lines[1:]:
                    lines.append(extra)
            elif isinstance(item, list) and item:
                inner = dumps(item, indent + 1).rstrip("\n")
                lines.append(f"{pad}-")
                lines.append(inner)
            else:
                lines.append(f"{pad}- {_dump_scalar(item)}")
    else:
        return pad + _dump_scalar(obj) + "\n"
    return "\n".join(lines) + "\n"


def load_file(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as fh:
        return loads(fh.read())


if __name__ == "__main__":
    import json
    import sys

    for p in sys.argv[1:]:
        print(f"# {p}")
        print(json.dumps(load_file(p), indent=2, default=str))
