import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Eye,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { ApiError } from "../lib/api";

export const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function formatMoney(value) {
  const number = Number(value || 0);
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatPercent(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${(Number(value) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

export function shortId(value) {
  return value ? String(value).slice(0, 8) : "-";
}

export function getErrorMessage(error) {
  if (error instanceof ApiError) return error.message;
  return error?.message || "Nao foi possivel carregar os dados";
}

export function Button({ children, variant = "primary", icon: Icon, loading = false, className = "", ...props }) {
  return (
    <button className={`button button-${variant} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 size={16} className="spin" aria-hidden="true" /> : Icon ? <Icon size={16} aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function IconButton({ label, icon: Icon, variant = "ghost", loading = false, ...props }) {
  return (
    <button className={`icon-button button-${variant}`} aria-label={label} title={label} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
    </button>
  );
}

export function PageHeader({ title, eyebrow, actions, children }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {children ? <p className="page-subtitle">{children}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function Section({ title, actions, children, className = "" }) {
  return (
    <section className={`section ${className}`}>
      {(title || actions) && (
        <div className="section-header">
          {title ? <h2>{title}</h2> : <span />}
          {actions ? <div className="section-actions">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title = "Sem dados", children, action }) {
  return (
    <div className="empty-state">
      <CircleDashed size={26} aria-hidden="true" />
      <strong>{title}</strong>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

export function InlineAlert({ type = "info", children }) {
  const Icon = type === "danger" ? XCircle : type === "warning" ? AlertTriangle : ShieldAlert;
  return (
    <div className={`inline-alert ${type}`} role={type === "danger" ? "alert" : "status"}>
      <Icon size={17} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function StateBoundary({ query, loadingTitle = "Carregando", emptyTitle, emptyDetail, children }) {
  if (query.isLoading) {
    return (
      <div className="skeleton-panel" aria-busy="true">
        <div className="skeleton-line wide" />
        <div className="skeleton-grid">
          <div />
          <div />
          <div />
        </div>
        <span className="sr-only">{loadingTitle}</span>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="error-panel" role="alert">
        <AlertTriangle size={22} aria-hidden="true" />
        <strong>{getErrorMessage(query.error)}</strong>
        <Button type="button" variant="secondary" icon={RefreshCw} onClick={() => query.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }
  const data = query.data;
  const empty = Array.isArray(data) ? data.length === 0 : data === null || data === undefined;
  if (empty) {
    return <EmptyState title={emptyTitle}>{emptyDetail}</EmptyState>;
  }
  return children(data);
}

export function DataTable({ columns, rows, getRowLink, actions, emptyTitle = "Nenhum registro" }) {
  if (!rows?.length) {
    return <EmptyState title={emptyTitle}>Crie um registro ou ajuste os filtros para continuar.</EmptyState>;
  }
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {actions ? <th aria-label="Acoes" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id || row.chave || `${row.ano}-${row.mes}`}>
              {columns.map((column) => (
                <td key={column.key} data-label={column.label}>
                  {column.render ? column.render(row) : row[column.key] ?? "-"}
                </td>
              ))}
              {actions ? <td className="row-actions">{actions(row)}</td> : null}
              {getRowLink ? (
                <td className="row-link" aria-hidden="true">
                  <a tabIndex={-1} href={getRowLink(row)}>
                    <Eye size={14} />
                  </a>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CalculatedValue({ label, value, kind = "money", origin, recalculatedAt, stale = false }) {
  const rendered =
    kind === "percent" ? formatPercent(value) : kind === "number" ? Number(value || 0).toLocaleString("pt-BR") : formatMoney(value);
  return (
    <div className="calculated-value" title={origin || "Valor calculado no backend"}>
      <div className="calculated-label">
        <span>{label}</span>
        {stale ? <em>atualizando</em> : null}
      </div>
      <strong>{rendered}</strong>
      <small>Recalculado em {formatDateTime(recalculatedAt)}</small>
    </div>
  );
}

const radarLabels = {
  sucesso: ["Sucesso", "ok"],
  sem_movimentacao: ["Sem movimentacao", "neutral"],
  com_movimentacao_nova: ["Movimentacao nova", "warn"],
  senha_necessaria: ["Exige senha", "warn"],
  captcha_timeout: ["Captcha", "danger"],
  timeout: ["Timeout", "danger"],
  erro: ["Erro", "danger"],
  pendente_implementacao: ["Aguardando scraper", "pending"],
  base_inicial_criada: ["Base inicial", "ok"],
  numero_invalido: ["Numero invalido", "danger"],
  pagina_intermediaria: ["Pagina intermediaria", "warn"],
};

export function RadarStatusBadge({ status }) {
  const [label, tone] = radarLabels[status] || [status || "Sem consulta", "neutral"];
  const Icon = status === "senha_necessaria" ? KeyRound : tone === "ok" ? CheckCircle2 : tone === "danger" ? XCircle : Clock3;
  return (
    <span className={`status-badge ${tone}`}>
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirmar", danger = false, onConfirm, onCancel, loading = false }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children, error }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error ? <small role="alert">{error}</small> : null}
    </label>
  );
}

export function Select({ children, ...props }) {
  return <select {...props}>{children}</select>;
}
