"""Personal monitoring email for each radar run.

Best-effort: never raises into the request path. Prefers the Resend HTTP API
(reliable from a server); falls back to SMTP; skips cleanly when neither is
configured, returning a status the caller can surface to the user.
"""
from __future__ import annotations

import json
import smtplib
import ssl
import urllib.error
import urllib.request
from datetime import datetime
from email.message import EmailMessage
from email.utils import formataddr
from typing import Any

from app.config import Settings

_STATUS_LABEL = {
    "sucesso": "movimentou / verificado",
    "base_inicial_criada": "base inicial criada",
    "sem_movimentacao": "sem novidade",
    "pendente_implementacao": "aguardando scraper (TJCE/TJBA)",
    "senha_necessaria": "exige senha",
    "captcha_timeout": "captcha (timeout)",
    "timeout": "timeout",
    "nao_localizado": "não localizado",
    "numero_invalido": "número inválido",
    "erro": "erro",
}


def _recipient(settings: Settings) -> str | None:
    if settings.radar_alert_email:
        return settings.radar_alert_email.strip()
    if settings.supabase_allowed_emails:
        first = settings.supabase_allowed_emails.split(",")[0].strip()
        return first or None
    return None


def _sender(settings: Settings) -> str:
    return settings.smtp_from or "Radar Pavageau <onboarding@resend.dev>"


def _fmt_dt(value: Any) -> str:
    if isinstance(value, datetime):
        return value.strftime("%d/%m/%Y %H:%M")
    return str(value) if value else datetime.now().strftime("%d/%m/%Y %H:%M")


def render_report(execucao: Any, resultados: list[Any], *, quando: Any | None = None) -> tuple[str, str, str]:
    """Return (subject, text_body, html_body) summarising one radar run."""
    total = getattr(execucao, "total_consultados", 0)
    moveu = getattr(execucao, "total_com_movimentacao_nova", 0)
    falhas = (
        getattr(execucao, "total_erro", 0)
        + getattr(execucao, "total_timeout", 0)
        + getattr(execucao, "total_captcha_timeout", 0)
    )
    pendentes = getattr(execucao, "total_pendente_implementacao", 0)
    quando_txt = _fmt_dt(quando)

    if total == 0:
        subject = f"Radar Pavageau — {quando_txt}: nenhum processo monitorado"
    else:
        subject = f"Radar Pavageau — {quando_txt}: {total} verificados, {moveu} movimentaram, {falhas} falharam"

    linhas = []
    for r in resultados:
        linhas.append(
            {
                "numero": getattr(r, "numero_processo", ""),
                "tribunal": getattr(r, "tribunal", ""),
                "status": getattr(r, "status", ""),
                "label": _STATUS_LABEL.get(getattr(r, "status", ""), getattr(r, "status", "")),
                "qtd": getattr(r, "quantidade_movimentacoes", 0),
                "erro": getattr(r, "mensagem_erro", None),
            }
        )

    # ---- text ----
    t = [
        "Monitoramento do Radar Processual — Sistema Integrado Pavageau",
        f"Rodada: {quando_txt}",
        "",
        f"Processos verificados: {total}",
        f"Movimentaram: {moveu}",
        f"Falharam (erro/timeout/captcha): {falhas}",
        f"Aguardando scraper (TJCE/TJBA): {pendentes}",
        "",
    ]
    if total == 0:
        t.append("Nenhum processo está cadastrado para monitoramento. Adicione processos na aba Radar para que a próxima rodada tenha o que verificar.")
    else:
        t.append("Detalhe por processo:")
        for l in linhas:
            extra = f" — {l['erro']}" if l["erro"] else (f" ({l['qtd']} mov.)" if l["qtd"] else "")
            t.append(f"  • {l['numero']} [{l['tribunal']}] — {l['label']}{extra}")
    text_body = "\n".join(t)

    # ---- html ----
    def esc(s: Any) -> str:
        return (str(s) if s is not None else "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    rows_html = "".join(
        f"<tr><td style='padding:6px 10px;font-family:monospace;font-size:12px'>{esc(l['numero'])}</td>"
        f"<td style='padding:6px 10px;color:#79829C'>{esc(l['tribunal'])}</td>"
        f"<td style='padding:6px 10px'>{esc(l['label'])}"
        + (f" <span style='color:#C9A24D'>({esc(l['qtd'])})</span>" if l["qtd"] else "")
        + (f"<br><span style='color:#C0392B;font-size:12px'>{esc(l['erro'])}</span>" if l["erro"] else "")
        + "</td></tr>"
        for l in linhas
    )
    corpo = (
        "<p style='color:#1E2A56'>Nenhum processo está cadastrado para monitoramento. "
        "Adicione processos na aba <b>Radar</b> para que a próxima rodada tenha o que verificar.</p>"
        if total == 0
        else (
            "<table style='border-collapse:collapse;width:100%;font-size:13px'>"
            "<thead><tr style='text-align:left;border-bottom:2px solid #1E2A56'>"
            "<th style='padding:6px 10px'>PROCESSO</th><th style='padding:6px 10px'>TRIBUNAL</th><th style='padding:6px 10px'>RESULTADO</th>"
            f"</tr></thead><tbody>{rows_html}</tbody></table>"
        )
    )
    html_body = f"""<div style="font-family:Arial,Helvetica,sans-serif;color:#1E2A56;max-width:640px">
      <div style="background:#151D3E;color:#fff;padding:16px 20px">
        <div style="font-size:11px;letter-spacing:.18em;color:#C9A24D">SISTEMA INTEGRADO PAVAGEAU</div>
        <div style="font-size:20px;font-weight:700;margin-top:4px">Monitoramento do Radar Processual</div>
        <div style="font-size:13px;color:#C0CAE8;margin-top:2px">Rodada de {esc(quando_txt)}</div>
      </div>
      <div style="padding:18px 20px;background:#F5F6FA">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <div style="background:#fff;border:1px solid #E3E6EE;padding:10px 14px"><b style="font-size:22px">{total}</b><br><span style="font-size:11px;color:#79829C">verificados</span></div>
          <div style="background:#fff;border:1px solid #E3E6EE;padding:10px 14px"><b style="font-size:22px;color:#C9A24D">{moveu}</b><br><span style="font-size:11px;color:#79829C">movimentaram</span></div>
          <div style="background:#fff;border:1px solid #E3E6EE;padding:10px 14px"><b style="font-size:22px;color:#C0392B">{falhas}</b><br><span style="font-size:11px;color:#79829C">falharam</span></div>
          <div style="background:#fff;border:1px solid #E3E6EE;padding:10px 14px"><b style="font-size:22px;color:#B8860B">{pendentes}</b><br><span style="font-size:11px;color:#79829C">aguardando scraper</span></div>
        </div>
        <div style="margin-top:16px">{corpo}</div>
      </div>
      <div style="padding:10px 20px;font-size:11px;color:#79829C">Enviado automaticamente pelo Radar do Sistema Integrado Pavageau.</div>
    </div>"""
    return subject, text_body, html_body


def _send_resend(settings: Settings, to: str, subject: str, text: str, html: str) -> dict[str, Any]:
    payload = json.dumps(
        {"from": _sender(settings), "to": [to], "subject": subject, "text": text, "html": html}
    ).encode()
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        method="POST",
        headers={"Authorization": f"Bearer {settings.resend_api_key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        body = resp.read().decode()
    return {"status": "sent", "via": "resend", "destinatario": to, "assunto": subject, "id": json.loads(body or "{}").get("id")}


def _send_smtp(settings: Settings, to: str, subject: str, text: str, html: str) -> dict[str, Any]:
    if not settings.smtp_host:
        return {"status": "skipped", "motivo": "SMTP_HOST nao configurado"}
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = _sender(settings)
    msg["To"] = to
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    port = settings.smtp_port or 587
    if port == 465:
        with smtplib.SMTP_SSL(settings.smtp_host, port, context=ssl.create_default_context(), timeout=20) as s:
            if settings.smtp_username:
                s.login(settings.smtp_username, settings.smtp_password or "")
            s.send_message(msg)
    else:
        with smtplib.SMTP(settings.smtp_host, port, timeout=20) as s:
            s.ehlo()
            if port != 25:
                s.starttls(context=ssl.create_default_context())
                s.ehlo()
            if settings.smtp_username:
                s.login(settings.smtp_username, settings.smtp_password or "")
            s.send_message(msg)
    return {"status": "sent", "via": "smtp", "destinatario": to, "assunto": subject}


def enviar_relatorio_radar(settings: Settings, execucao: Any, resultados: list[Any], *, quando: Any | None = None) -> dict[str, Any]:
    """Send the run report. Returns a status dict; never raises."""
    to = _recipient(settings)
    subject, text, html = render_report(execucao, resultados, quando=quando)
    if not to:
        return {"status": "skipped", "motivo": "nenhum destinatario (defina RADAR_ALERT_EMAIL ou SUPABASE_ALLOWED_EMAILS)"}
    try:
        if settings.resend_api_key:
            return _send_resend(settings, to, subject, text, html)
        if settings.smtp_host:
            return _send_smtp(settings, to, subject, text, html)
        return {
            "status": "skipped",
            "motivo": "email nao configurado — defina RESEND_API_KEY (recomendado) ou SMTP_HOST/PORT/USERNAME/PASSWORD/FROM no .env",
            "destinatario": to,
            "assunto": subject,
        }
    except (urllib.error.URLError, smtplib.SMTPException, OSError, ValueError) as exc:  # pragma: no cover - network
        return {"status": "error", "motivo": str(exc), "destinatario": to, "assunto": subject}
