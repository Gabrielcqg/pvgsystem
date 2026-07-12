"""jsonschema_lite — a dependency-free JSON Schema subset validator (stdlib only).

Supports the subset used by the Autonomous System Building OS contracts:
  type (incl. list of types), required, properties, additionalProperties (bool),
  items, enum, const, pattern, minLength, maxLength, minItems, maxItems,
  minimum, maximum, anyOf, oneOf, allOf, not, $ref (to local "#/$defs/..."),
  format hints (advisory), and nullable via type list.

Returns a list of human-readable error strings (empty == valid).
This is deliberately small; it is not a conformant JSON Schema implementation,
but it is strict enough to catch structural mistakes in OS artifacts.
"""
from __future__ import annotations

import re
from typing import Any


_TYPE_CHECKS = {
    "object": lambda v: isinstance(v, dict),
    "array": lambda v: isinstance(v, list),
    "string": lambda v: isinstance(v, str),
    "integer": lambda v: isinstance(v, int) and not isinstance(v, bool),
    "number": lambda v: isinstance(v, (int, float)) and not isinstance(v, bool),
    "boolean": lambda v: isinstance(v, bool),
    "null": lambda v: v is None,
}


def _resolve_ref(ref: str, root: dict):
    if not ref.startswith("#/"):
        raise ValueError(f"only local $ref supported, got {ref}")
    node: Any = root
    for part in ref[2:].split("/"):
        part = part.replace("~1", "/").replace("~0", "~")
        node = node[part]
    return node


def validate(instance: Any, schema: dict, root: dict | None = None, path: str = "$") -> list[str]:
    root = root if root is not None else schema
    errs: list[str] = []

    if "$ref" in schema:
        target = _resolve_ref(schema["$ref"], root)
        return validate(instance, target, root, path)

    # type
    if "type" in schema:
        types = schema["type"]
        types = [types] if isinstance(types, str) else types
        if not any(_TYPE_CHECKS[t](instance) for t in types):
            errs.append(f"{path}: expected type {types}, got {type(instance).__name__}")
            return errs  # further checks unreliable on wrong type

    if "const" in schema and instance != schema["const"]:
        errs.append(f"{path}: expected const {schema['const']!r}, got {instance!r}")

    if "enum" in schema and instance not in schema["enum"]:
        errs.append(f"{path}: {instance!r} not in enum {schema['enum']}")

    if isinstance(instance, str):
        if "minLength" in schema and len(instance) < schema["minLength"]:
            errs.append(f"{path}: string shorter than minLength {schema['minLength']}")
        if "maxLength" in schema and len(instance) > schema["maxLength"]:
            errs.append(f"{path}: string longer than maxLength {schema['maxLength']}")
        if "pattern" in schema and not re.search(schema["pattern"], instance):
            errs.append(f"{path}: {instance!r} does not match pattern {schema['pattern']}")

    if isinstance(instance, (int, float)) and not isinstance(instance, bool):
        if "minimum" in schema and instance < schema["minimum"]:
            errs.append(f"{path}: {instance} < minimum {schema['minimum']}")
        if "maximum" in schema and instance > schema["maximum"]:
            errs.append(f"{path}: {instance} > maximum {schema['maximum']}")

    if isinstance(instance, list):
        if "minItems" in schema and len(instance) < schema["minItems"]:
            errs.append(f"{path}: array has {len(instance)} items < minItems {schema['minItems']}")
        if "maxItems" in schema and len(instance) > schema["maxItems"]:
            errs.append(f"{path}: array has {len(instance)} items > maxItems {schema['maxItems']}")
        if "items" in schema:
            for i, item in enumerate(instance):
                errs += validate(item, schema["items"], root, f"{path}[{i}]")
        if schema.get("uniqueItems"):
            seen = []
            for i, item in enumerate(instance):
                if item in seen:
                    errs.append(f"{path}[{i}]: duplicate item {item!r}")
                seen.append(item)

    if isinstance(instance, dict):
        props = schema.get("properties", {})
        for req in schema.get("required", []):
            if req not in instance:
                errs.append(f"{path}: missing required property '{req}'")
        for key, val in instance.items():
            if key in props:
                errs += validate(val, props[key], root, f"{path}.{key}")
            elif "patternProperties" in schema:
                matched = False
                for pat, sub in schema["patternProperties"].items():
                    if re.search(pat, key):
                        matched = True
                        errs += validate(val, sub, root, f"{path}.{key}")
                if not matched and schema.get("additionalProperties") is False:
                    errs.append(f"{path}: unexpected property '{key}'")
            elif schema.get("additionalProperties") is False:
                errs.append(f"{path}: unexpected property '{key}'")
            elif isinstance(schema.get("additionalProperties"), dict):
                errs += validate(val, schema["additionalProperties"], root, f"{path}.{key}")

    for combiner in ("allOf",):
        if combiner in schema:
            for i, sub in enumerate(schema[combiner]):
                errs += validate(instance, sub, root, path)

    if "anyOf" in schema:
        if not any(not validate(instance, sub, root, path) for sub in schema["anyOf"]):
            errs.append(f"{path}: does not match any schema in anyOf")

    if "oneOf" in schema:
        matches = sum(1 for sub in schema["oneOf"] if not validate(instance, sub, root, path))
        if matches != 1:
            errs.append(f"{path}: matched {matches} schemas in oneOf (expected exactly 1)")

    if "not" in schema:
        if not validate(instance, schema["not"], root, path):
            errs.append(f"{path}: must not match schema in 'not'")

    return errs


def validate_or_raise(instance: Any, schema: dict) -> None:
    errs = validate(instance, schema)
    if errs:
        raise ValueError("schema validation failed:\n  " + "\n  ".join(errs))
