import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from "recharts";
import { useRealDb } from "./useRealDb";
import { useAuth } from "../App";


const C = {
  navy: "#1E2A56", navyDeep: "#151D3E", navySoft: "#2C3B6E", navyLine: "#33417A",
  gold: "#8A6A16", goldSoft: "#E6D2A0", goldPale: "#FDF7E8",
  paper: "#F5F6FA", line: "#E3E6EE", ink: "#1E2A56", inkSoft: "#5D667C",
  green: "#1C7A4E", red: "#A8322D", amber: "#8A5C00", calcBg: "#EEF0F6",
};
const S = {
  display: "'Playfair Display', Georgia, serif",
  body: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

const isoLocalDate = (value = new Date()) => {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const addIsoDays = (iso, days) => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return isoLocalDate(date);
};
const addIsoMonths = (ym, months) => {
  const [year, month] = ym.split("-").map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};
const HOJE = isoLocalDate();
const ANO = Number(HOJE.slice(0, 4));
const MESES_N = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES = MESES_N.map((_, i) => `${ANO}-${String(i + 1).padStart(2, "0")}`);
const MES_ATUAL = HOJE.slice(0, 7);
const MES_ANTERIOR = addIsoMonths(MES_ATUAL, -1);
const PROXIMA_SEMANA = addIsoDays(HOJE, 7);
const PERIODO_LABEL = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
  .format(new Date(`${MES_ATUAL}-01T00:00:00`))
  .toUpperCase();
const HOJE_LABEL = HOJE.split("-").reverse().join("/");

const STATUS = ["Proposta", "Ativo", "Aguardando êxito", "Encerrado", "Sem êxito"];
const STATUS_COR = { "Proposta": C.inkSoft, "Ativo": C.navy, "Aguardando êxito": C.amber, "Encerrado": C.green, "Sem êxito": C.red };
const TIPO_HONORARIO = ["Fixo único", "Fixo mensal", "Fixo parcelado", "Êxito puro", "Sucumbência", "Fixo + Êxito", "Êxito + Sucumbência", "Fixo + Êxito + Sucumbência"];
const TIPO_PARCELA = ["Inicial", "Mensal", "Êxito", "Sucumbência"];
const CAT_ENTRADA = ["Honorários", "Consultoria", "Outras entradas"];
const CAT_SAIDA = ["Custo fixo", "Custas processuais", "Infraestrutura", "Marketing", "Freelancer", "Restituição ao cliente", "Impostos", "Pró-labore", "Outras saídas"];
const FORMAS = ["PIX", "Boleto", "Transferência", "Cartão", "Dinheiro", "GRU", "DAS"];
const TAREFA_STATUS_DEFAULT = [
  { slug: "backlog", label: "Backlog", ordem: 10, grupo: "entrada", cor: "#64748b" },
  { slug: "a_fazer", label: "A fazer", ordem: 20, grupo: "entrada", cor: C.navy },
  { slug: "em_andamento", label: "Em andamento", ordem: 30, grupo: "execucao", cor: "#2563eb" },
  { slug: "aguardando", label: "Aguardando", ordem: 40, grupo: "bloqueio", cor: C.amber },
  { slug: "bloqueada", label: "Bloqueada", ordem: 50, grupo: "bloqueio", cor: "#C2410C" },
  { slug: "em_revisao", label: "Em revisão", ordem: 60, grupo: "revisao", cor: "#6D5BA6" },
  { slug: "concluida", label: "Concluída", ordem: 70, grupo: "terminal", cor: C.green, terminal: true },
];
const TAREFA_PRIORIDADE = ["baixa", "normal", "alta", "urgente"];
const TAREFA_PRIORIDADE_LABEL = { baixa: "Baixa", normal: "Normal", alta: "Alta", urgente: "Urgente" };
const TAREFA_PRIORIDADE_COR = { baixa: C.inkSoft, normal: C.navy, alta: C.amber, urgente: C.red };

const brl = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const brl2 = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v) => `${((v || 0) * 100).toFixed(0)}%`;
const compact = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`);
const mesDe = (s) => (s || "").slice(0, 7);
const rotMes = (m) => (m ? `${MESES_N[+m.slice(5, 7) - 1]}/${m.slice(2, 4)}` : "—");
const fmtData = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : "—");
const diasDesde = (s) => {
  if (!s) return null;
  const dias = Math.floor((new Date(`${HOJE}T00:00:00`) - new Date(`${s}T00:00:00`)) / 86400000);
  return Number.isFinite(dias) ? dias : null;
};
const tarefaAtiva = (t) => !t.archivedAt && t.status !== "concluida";


/* ══════════════════════  APP  ══════════════════════ */

function AccountMenu() {
  const { me, session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const email = me?.email || session?.user?.email || "";
  const inicial = (email[0] || "?").toUpperCase();
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} className="btn" style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${C.line}`, padding: "4px 10px 4px 5px", cursor: "pointer", borderRadius: 2, fontFamily: S.body }}>
        <span style={{ width: 24, height: 24, borderRadius: 12, background: C.navy, color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>{inicial}</span>
        <span style={{ fontSize: 12, color: C.ink, maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email || "Conta"}</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50, background: "#fff", border: `1px solid ${C.line}`, minWidth: 230, borderRadius: 2 }}>
            <div style={{ padding: "11px 13px", borderBottom: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 8.5, letterSpacing: ".16em", color: C.gold, fontWeight: 600 }}>MINHA CONTA</div>
              <div style={{ fontSize: 12.5, color: C.ink, marginTop: 3, wordBreak: "break-all" }}>{email || "—"}</div>
            </div>
            <button onClick={() => { setOpen(false); signOut(); }} className="navitem" style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 13px", background: "none", border: "none", cursor: "pointer", fontFamily: S.body, fontSize: 12.5, color: C.red, fontWeight: 500 }}>Sair</button>
          </div>
        </>
      )}
    </div>
  );
}

function AppState({ title, detail }) {
  return (
    <div style={{ fontFamily: S.body, background: C.paper, minHeight: "100vh", color: C.ink, display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card" role={detail ? "alert" : "status"} style={{ background: "#fff", borderStyle: "solid", borderWidth: "3px 1px 1px", borderColor: `${detail ? C.red : C.gold} ${C.line} ${C.line}`, width: "100%", maxWidth: 560, padding: "18px 20px" }}>
        <div style={{ fontFamily: S.display, fontSize: 22, fontWeight: 700 }}>{title}</div>
        {detail && <p style={{ fontSize: 13, lineHeight: 1.6, color: C.inkSoft, margin: "8px 0 0" }}>{detail}</p>}
      </div>
    </div>
  );
}

function SkeletonBlock({ width = "100%", height = 12, style = {} }) {
  return <span className="skel" aria-hidden="true" style={{ display: "block", width, height, borderRadius: 2, ...style }} />;
}

function SkeletonText({ lines = 2 }) {
  return (
    <div style={{ display: "grid", gap: 7 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} width={i === lines - 1 ? "62%" : "100%"} height={10} />
      ))}
    </div>
  );
}

function SkeletonKpis({ count = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 9, marginBottom: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ background: "#fff", border: `1px solid ${C.line}`, borderLeft: `3px solid ${i === 1 ? C.gold : C.navy}`, padding: "11px 13px", minHeight: 86 }}>
          <SkeletonBlock width="42%" height={9} />
          <SkeletonBlock width="68%" height={25} style={{ marginTop: 9 }} />
          <SkeletonBlock width="78%" height={9} style={{ marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}

function SkeletonTable({ rows = 7 }) {
  return (
    <div className="card" style={{ background: "#fff", border: `1px solid ${C.line}`, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, marginBottom: 14 }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <SkeletonBlock width="52%" height={19} />
          <SkeletonBlock width="74%" height={9} style={{ marginTop: 8 }} />
        </div>
        <SkeletonBlock width={110} height={28} />
      </div>
      <div style={{ display: "grid", gap: 0, borderTop: `1px solid ${C.line}` }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr .8fr .7fr", gap: 16, padding: "12px 0", borderBottom: `1px solid ${C.line}` }}>
            <SkeletonBlock height={11} width={i % 2 ? "72%" : "86%"} />
            <SkeletonBlock height={11} width="70%" />
            <SkeletonBlock height={11} width="58%" />
            <SkeletonBlock height={11} width="50%" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="card" style={{ background: "#fff", border: `1px solid ${C.line}`, padding: 14, minHeight: 255 }}>
      <SkeletonBlock width="44%" height={19} />
      <SkeletonBlock width="68%" height={9} style={{ marginTop: 8 }} />
      <div style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 12, alignItems: "end", marginTop: 22, height: 168 }}>
        <div style={{ display: "grid", gap: 17 }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} width={26} height={8} />)}
        </div>
        <div style={{ height: "100%", display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 10, alignItems: "end", borderLeft: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, paddingLeft: 12 }}>
          {[42, 70, 54, 88, 63, 76, 48, 82].map((h, i) => (
            <SkeletonBlock key={i} height={`${h}%`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonKanban() {
  return (
    <div className="card" style={{ background: "#fff", border: `1px solid ${C.line}`, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12, alignItems: "center" }}>
        <div>
          <SkeletonBlock width={180} height={19} />
          <SkeletonBlock width={260} height={9} style={{ marginTop: 8 }} />
        </div>
        <SkeletonBlock width={118} height={28} />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} width={i === 0 ? 170 : 105} height={30} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: C.paper, border: `1px solid ${C.line}`, minHeight: 370, padding: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <SkeletonBlock width="50%" height={13} />
              <SkeletonBlock width={24} height={13} />
            </div>
            {Array.from({ length: i === 0 ? 3 : 2 }).map((__, j) => (
              <div key={j} style={{ background: "#fff", border: `1px solid ${C.line}`, padding: 10, marginBottom: 8 }}>
                <SkeletonBlock width="88%" height={13} />
                <SkeletonText lines={2} />
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <SkeletonBlock width={52} height={18} />
                  <SkeletonBlock width={64} height={18} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewSkeleton({ view }) {
  if (view === "tarefas") {
    return (
      <div role="status" aria-label="Carregando tarefas">
        <SkeletonKpis count={4} />
        <SkeletonKanban />
      </div>
    );
  }
  if (["fluxo", "dre", "balanco", "painel"].includes(view)) {
    return (
      <div role="status" aria-label="Carregando indicadores">
        <SkeletonKpis count={4} />
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(280px,1fr)", gap: 9, marginBottom: 9 }}>
          <SkeletonChart />
          <SkeletonTable rows={4} />
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }
  if (view === "radar") {
    return (
      <div role="status" aria-label="Carregando radar processual">
        <SkeletonKpis count={5} />
        <SkeletonTable rows={8} />
      </div>
    );
  }
  return (
    <div role="status" aria-label="Carregando dados">
      <SkeletonKpis count={4} />
      <SkeletonTable rows={8} />
    </div>
  );
}

export default function App() {
  const { db, setDb, mut, loading, error } = useRealDb();
  const [view, setView] = useState("painel");
  const [modal, setModal] = useState(null);
  const [cadeia, setCadeia] = useState(-1);
  const [flash, setFlash] = useState(null);
  const cadeiaTimers = useRef([]);

  useEffect(() => () => {
    cadeiaTimers.current.forEach((timer) => clearTimeout(timer));
  }, []);

  const rodar = (msg) => {
    cadeiaTimers.current.forEach((timer) => clearTimeout(timer));
    cadeiaTimers.current = [];
    setFlash(msg);
    setCadeia(0);
    cadeiaTimers.current = [
      setTimeout(() => setCadeia(1), 55),
      setTimeout(() => setCadeia(2), 110),
      setTimeout(() => setCadeia(3), 165),
      setTimeout(() => setCadeia(-1), 620),
      setTimeout(() => setFlash(null), 1800),
    ];
  };
  // Mutations are optimistic (the row updates before the request resolves), so
  // feedback fires immediately by default. Only the few non-optimistic actions
  // (custo fixo, radar, parâmetros) pass { instant: false } to wait for the server.
  const runAction = async (promise, success, options = {}) => {
    const instant = options.instant !== false;
    if (instant) rodar(success);
    try {
      await promise;
      if (!instant) rodar(success);
    } catch (err) {
      rodar(err?.message || "Nao foi possivel concluir a acao. Verifique a API e tente novamente.");
    }
  };

  /* mutações — conectadas ao banco real via useRealDb, com estado otimista nas ações de alta frequência */
  const receberParcela = (parcelaId, mesEfetivo = MES_ATUAL) => runAction(mut.receberParcela(parcelaId, mesEfetivo), "Parcela confirmada — entrada criada no caixa.");
  const estornarParcela = (parcelaId) => runAction(mut.estornarParcela(parcelaId), "Confirmação desfeita — a entrada saiu do caixa junto.");
  const addLancamento = (l, parcelaId) => runAction(
    mut.addLancamento(l, parcelaId),
    parcelaId ? "Entrada lançada e parcela quitada — de uma vez." : `${l.tipo === "entrada" ? "Entrada" : "Saída"} avulsa lançada.`,
    { instant: true },
  );
  const lancarFixo = (custoId, mes) => runAction(mut.lancarFixo(custoId, mes), "Custo fixo lançado — caixa, DRE e balanço recalculados.", { instant: false });
  const fecharContrato = (contratoId, parcelas = 1) => runAction(mut.fecharContrato(contratoId, parcelas, HOJE, MES_ATUAL), "Contrato marcado como ativo e parcelas previstas atualizadas.");
  const enviarParaTarefas = (mov) => runAction(mut.enviarParaTarefas(mov), "Movimentação enviada para as tarefas.");
  const enviarTodasParaTarefas = () => runAction(mut.enviarTodasParaTarefas(db.radarMovsPendentes || db.radarMovs), "Movimentações enviadas para as tarefas.");
  const atualizarRadar = async () => {
    rodar("Atualizando resultados do radar…");
    try {
      await mut.atualizarRadar();
      rodar("Resultados do radar atualizados.");
    } catch (err) {
      rodar(err?.message || "Não foi possível atualizar o radar.");
    }
  };

  /* ═══════════  MOTOR  ═══════════ */
  const m = useMemo(() => {
    const { lancamentos: L, contratos: CT, parcelas: PC, custosFixos: CF, params } = db;
    const pagos = L.filter((l) => l.pago);
    const soma = (a) => a.reduce((s, x) => s + x.valor, 0);
    const noMes = (mes, tipo) => soma(pagos.filter((l) => mesDe(l.data) === mes && l.tipo === tipo));

    const caixa = params.caixaInicial + pagos.reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0);
    const fatAtual = noMes(MES_ATUAL, "entrada");
    const fatAnt = noMes(MES_ANTERIOR, "entrada");
    const gastoAtual = noMes(MES_ATUAL, "saida");

    const porContrato = {};
    CT.forEach((c) => {
      const ps = PC.filter((p) => p.contratoId === c.id);
      const receb = soma(ps.filter((p) => p.recebido));
      const eT = (c.valorCausa || 0) * (c.pctExito || 0);
      const sT = (c.valorCausa || 0) * (c.pctSucumb || 0);
      const q = c.pctQuota || 0;
      porContrato[c.id] = { parcelas: ps, fixoRecebido: receb, fixoPendente: Math.max((c.fixoTotal || 0) - receb, 0),
        exitoTotal: eT, sucumbTotal: sT, exitoParceiro: eT * q, exitoEscritorio: eT * (1 - q),
        sucumbParceiro: sT * q, sucumbEscritorio: sT * (1 - q) };
    });

    const ativos = CT.filter((c) => ["Ativo", "Aguardando êxito"].includes(c.status));
    const propostas = CT.filter((c) => c.status === "Proposta");
    const comProposta = CT.filter((c) => c.dataProposta);
    const fechados = CT.filter((c) => c.dataFechamento);
    const conversao = comProposta.length ? Math.round((fechados.length / comProposta.length) * 100) : 0;
    const fechadosMes = CT.filter((c) => mesDe(c.dataFechamento) === MES_ATUAL).length;
    const propostasMes = CT.filter((c) => mesDe(c.dataProposta) === MES_ATUAL).length;

    const aberto = PC.filter((p) => !p.recebido);
    const atrasadas = aberto.filter((p) => p.mesEsperado && p.mesEsperado < MES_ATUAL)
      .map((p) => ({ ...p, contrato: CT.find((c) => c.id === p.contratoId) }));
    const inadimp = soma(atrasadas);
    const aReceber = soma(aberto.filter((p) => p.mesEsperado >= MES_ATUAL));
    const exitoProjEscritorio = ativos.reduce((s, c) => s + porContrato[c.id].exitoEscritorio + porContrato[c.id].sucumbEscritorio, 0);
    const exitoProjParceiro = ativos.reduce((s, c) => s + porContrato[c.id].exitoParceiro + porContrato[c.id].sucumbParceiro, 0);
    const fixoPendenteTotal = ativos.reduce((s, c) => s + porContrato[c.id].fixoPendente, 0);
    const receitaRealizada = soma(pagos.filter((l) => l.tipo === "entrada"));

    const mesN = +MES_ATUAL.slice(5, 7);
    const vigentes = CF.filter((f) => f.recorrente && f.mesInicio <= mesN && (f.mesFim || 12) >= mesN);
    const fixosDoMes = vigentes.map((f) => ({ ...f, lancado: L.some((l) => l.origem === "fixo" && l.origemId === `${f.id}:${MES_ATUAL}`) }));
    const custoFixoMensal = vigentes.reduce((s, f) => s + f.valor, 0);

    const porCat = {};
    pagos.filter((l) => l.tipo === "saida" && mesDe(l.data) === MES_ATUAL)
      .forEach((l) => { porCat[l.categoria] = (porCat[l.categoria] || 0) + l.valor; });
    const gastosCat = Object.entries(porCat).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
    const restit = pagos.filter((l) => l.categoria === "Restituição ao cliente" && mesDe(l.data) === MES_ATUAL);

    const rec = fatAtual;
    const diretos = soma(pagos.filter((l) => l.tipo === "saida" && mesDe(l.data) === MES_ATUAL && ["Custas processuais", "Restituição ao cliente"].includes(l.categoria)));
    const despOp = gastoAtual - diretos;
    const resultado = rec - diretos - despOp;
    const margem = rec ? Math.round((resultado / rec) * 100) : 0;

    let acc = params.caixaInicial;
    const serie = MESES.map((mm) => {
      const e = noMes(mm, "entrada"), s = noMes(mm, "saida");
      acc += e - s;
      return { mes: MESES_N[+mm.slice(5, 7) - 1], caixa: +acc.toFixed(2), entrada: e, saida: s, resultado: e - s };
    });

    const previstos = soma(L.filter((l) => !l.pago && l.tipo === "saida"));
    const aPagarPendente = L.filter((l) => !l.pago);
    const ativoTotal = caixa + aReceber + inadimp;
    const pl = ativoTotal - previstos;

    // por parceiro — ninguém fica de fora
    const porParceiro = db.parceiros.map((p) => {
      const cs = CT.filter((c) => c.parceiroId === p.id);
      const at = cs.filter((c) => ["Ativo", "Aguardando êxito"].includes(c.status));
      const en = cs.filter((c) => c.status === "Encerrado");
      const realizada = en.reduce((s, c) => s + (porContrato[c.id]?.fixoRecebido || c.fixoTotal || 0), 0);
      return { ...p, total: cs.length, ativos: at.length, encerrados: en.length,
        realizada, ticket: en.length ? realizada / en.length : 0,
        proj: at.reduce((s, c) => s + porContrato[c.id].exitoEscritorio + porContrato[c.id].sucumbEscritorio, 0) };
    }).sort((a, b) => b.total - a.total);
    const semParceiro = CT.filter((c) => !c.parceiroId).length;

    const indicadores = db.indicadores || {};
    const painelOficial = indicadores.painel?.[0] || null;
    const dreOficial = indicadores.dreMensal?.[0] || null;
    const balancoOficial = indicadores.balanco?.[0] || null;
    const analiseOficial = indicadores.analise || null;
    const fluxoOficial = indicadores.fluxoMensal || [];
    const gastosOficiais = indicadores.gastosCategoria || [];
    const serieOficial = fluxoOficial.length
      ? MESES.map((mm, index) => {
        const row = fluxoOficial.find((item) => item.mes === index + 1);
        return row ? {
          mes: MESES_N[index],
          caixa: row.saldoAcumulado,
          entrada: row.entradasPagas,
          saida: row.saidasPagas,
          resultado: row.resultadoMes,
        } : serie[index];
      })
      : serie;
    const inadimplenciaOficial = balancoOficial?.aReceberVencido ?? painelOficial?.inadimplencia ?? inadimp;
    const aReceberOficial = balancoOficial?.aReceberAVencer
      ?? (painelOficial ? Math.max((painelOficial.aReceberTotal || 0) - inadimplenciaOficial, 0) : aReceber);
    const receitaOficial = analiseOficial?.faturamento ?? dreOficial?.receita ?? fatAtual;
    const diretosOficiais = dreOficial?.custosDiretos ?? diretos;
    const despOpOficial = dreOficial?.despesasOperacionais ?? despOp;
    const resultadoOficial = dreOficial?.resultado ?? resultado;
    const margemOficial = dreOficial ? Math.round((dreOficial.margem <= 1 ? dreOficial.margem * 100 : dreOficial.margem)) : margem;
    const caixaOficial = painelOficial?.caixaAtual ?? balancoOficial?.caixa ?? caixa;
    const ativoOficial = balancoOficial?.ativo ?? ativoTotal;
    const passivoOficial = balancoOficial?.passivo ?? previstos;
    const plOficial = balancoOficial?.patrimonioLiquido ?? pl;

    return { caixa: caixaOficial, fatAtual: receitaOficial, fatAnt, gastoAtual: diretosOficiais + despOpOficial, porContrato, ativos, propostas,
      conversao: painelOficial?.taxaConversao != null ? Math.round(painelOficial.taxaConversao * 100) : conversao,
      fechadosMes: analiseOficial?.clientesFechados ?? fechadosMes, propostasMes, atrasadas, inadimp: inadimplenciaOficial, aReceber: aReceberOficial,
      exitoProjEscritorio: painelOficial ? painelOficial.exitoProjetadoEscritorio + painelOficial.sucumbenciaProjetada : exitoProjEscritorio,
      exitoProjParceiro: painelOficial?.exitoProjetadoParceiro ?? exitoProjParceiro,
      fixoPendenteTotal, receitaRealizada, fixosDoMes, custoFixoMensal: painelOficial?.custoFixoMensal ?? custoFixoMensal,
      gastosCat: gastosOficiais.length ? gastosOficiais : gastosCat, restit,
      rec: dreOficial?.receita ?? rec, diretos: diretosOficiais, despOp: despOpOficial, resultado: resultadoOficial, margem: margemOficial,
      serie: serieOficial, previstos: passivoOficial, aPagarPendente, ativoTotal: ativoOficial, pl: plOficial,
      metaPct: painelOficial?.percentualMetaCaixa ?? (params.metaCaixa ? Math.min(caixaOficial / params.metaCaixa, 1) : 0),
      mesesReserva: painelOficial?.mesesReserva ?? (custoFixoMensal ? caixaOficial / custoFixoMensal : 0),
      pctRecorrente: painelOficial?.percentualReceitaRecorrente ?? (fatAtual ? params.recorrenciaAtual / fatAtual : 0),
      porParceiro, semParceiro };
  }, [db]);

  const hasData = db.contratos.length || db.parcelas.length || db.lancamentos.length || db.custosFixos.length || db.tarefas.length || db.processos.length;
  if (error && !hasData) return <AppState title="API indisponível" detail={error?.message || "Nao foi possivel carregar os dados pela FastAPI."} />;

  const NAV = [
    { g: "PAINEL", itens: [{ k: "painel", n: "Painel" }, { k: "importacao", n: "Importação" }] },
    { g: "CONTRATOS", itens: [{ k: "contratos", n: "Contratos" }, { k: "parcelas", n: "Parcelas" }, { k: "parceiros", n: "Parceiros" }] },
    { g: "RADAR", itens: [{ k: "radar", n: "Radar processual" }] },
    { g: "FINANCEIRO", itens: [{ k: "lancamentos", n: "Lançamentos" }, { k: "fixos", n: "Custos fixos" }, { k: "fluxo", n: "Fluxo de caixa" }, { k: "dre", n: "DRE" }, { k: "balanco", n: "Balanço" }] },
    { g: "OPERAÇÃO", itens: [{ k: "tarefas", n: "Tarefas" }, { k: "ajustes", n: "Ajustes" }, { k: "auditoria", n: "Auditoria" }] },
  ];
  const TITULO = NAV.flatMap((g) => g.itens).find((i) => i.k === view)?.n || "";

  return (
    <div style={{ fontFamily: S.body, background: C.paper, minHeight: "100vh", color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #C9CEDC; border-radius: 4px; }
        @keyframes pulseGold { 0% { box-shadow: 0 0 0 0 rgba(201,162,77,.6);} 100% { box-shadow: 0 0 0 13px rgba(201,162,77,0);} }
        @keyframes slideUp { from { transform: translateY(5px);} to {transform:none;} }
        @keyframes shimmerSkeleton { 0% { background-position: -260px 0; } 100% { background-position: 260px 0; } }
        .row:hover { background: #FAFBFD; }
        .btn:hover { filter: brightness(1.12); }
        .navitem:hover { color: #E6D2A0 !important; }
        .card { animation: slideUp .14s ease both; }
        .skel {
          background-color: #E9EDF5;
          background-image: linear-gradient(90deg, #E9EDF5 0%, #F8FAFD 45%, #E9EDF5 90%);
          background-size: 260px 100%;
          animation: shimmerSkeleton 1.05s ease-in-out infinite;
        }
        input:focus, select:focus { outline: 2px solid ${C.gold}; outline-offset: -1px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } .skel { background-image: none; } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside style={{ width: 200, background: C.navyDeep, color: "#fff", padding: "22px 0", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <div style={{ padding: "0 18px 18px", borderBottom: `1px solid ${C.navyLine}` }}>
            <div style={{ fontFamily: S.display, fontSize: 19, letterSpacing: ".06em", fontWeight: 700 }}>PAVAGEAU</div>
            <div style={{ fontSize: 8.5, letterSpacing: ".2em", color: C.goldSoft, marginTop: 3 }}>SISTEMA INTEGRADO</div>
          </div>
          <nav style={{ padding: "12px 0", flex: 1 }}>
            {NAV.map((grupo) => (
              <div key={grupo.g} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, letterSpacing: ".2em", color: "#A7B2D6", padding: "6px 18px 2px", fontWeight: 600 }}>{grupo.g}</div>
                {grupo.itens.map((it) => {
                  const on = view === it.k;
                  return (
                    <button key={it.k} onClick={() => setView(it.k)} className="navitem" style={{
                      display: "block", width: "100%", padding: "7px 18px", textAlign: "left",
                      background: on ? C.navySoft : "transparent", border: "none",
                      borderLeft: `2px solid ${on ? C.gold : "transparent"}`,
                      color: on ? "#fff" : "#C0CAE8", fontSize: 12.5, fontFamily: S.body, cursor: "pointer",
                    }}>{it.n}</button>
                  );
                })}
              </div>
            ))}
          </nav>
          <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.navyLine}`, fontSize: 9.5, color: "#C0CAE8", lineHeight: 1.6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: C.green }} />
              sistema conectado
            </div>
            {loading && !hasData ? (
              <div style={{ display: "grid", gap: 5, marginTop: 7 }}>
                <SkeletonBlock width="82%" height={8} />
                <SkeletonBlock width="62%" height={8} />
              </div>
            ) : <>{db.contratos.length} contratos · {db.parcelas.length} parcelas<br />{db.lancamentos.length} lançamentos</>}
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          <header style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "15px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
            <div>
              <div style={{ fontSize: 8.5, letterSpacing: ".2em", color: C.gold, fontWeight: 600 }}>{PERIODO_LABEL}</div>
              <h1 style={{ fontFamily: S.display, fontSize: 23, margin: "2px 0 0", fontWeight: 700 }}>{TITULO}</h1>
            </div>
            <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <button onClick={() => setModal({ t: "contrato" })} className="btn" style={btnGhost}>+ Contrato</button>
              <button onClick={() => setModal({ t: "lancamento" })} className="btn" style={btnSolid}>+ Entrada / Saída</button>
              <AccountMenu />
            </div>
          </header>

          <Cadeia ativo={cadeia} flash={flash} />

          {error && hasData && (
            <div role="alert" style={{ background: "#FDF6F5", color: C.red, borderBottom: `1px solid #F0D4D2`, padding: "9px 26px", fontSize: 12 }}>
              {error?.message || "Nao foi possivel atualizar os dados pela API."}
            </div>
          )}


          <div style={{ padding: "18px 26px 60px" }}>
            {loading && !hasData ? (
              <ViewSkeleton view={view} />
            ) : (
              <>
                {view === "painel" && <Painel db={db} m={m} goto={setView} />}
                {view === "importacao" && <Importacao db={db} m={m} />}
                {view === "contratos" && <Contratos db={db} m={m} setModal={setModal} mut={mut} runAction={runAction} />}
                {view === "parcelas" && <Parcelas db={db} m={m} receber={receberParcela} estornar={estornarParcela} />}
                {view === "parceiros" && <Parceiros db={db} m={m} mut={mut} runAction={runAction} />}
                {view === "lancamentos" && <Lancamentos db={db} setModal={setModal} mut={mut} runAction={runAction} />}
                {view === "fixos" && <Fixos db={db} m={m} lancar={lancarFixo} setModal={setModal} mut={mut} runAction={runAction} />}
                {view === "fluxo" && <Fluxo db={db} m={m} />}
                {view === "dre" && <DRE m={m} />}
                {view === "balanco" && <Balanco m={m} />}
                {view === "radar" && <Radar db={db} mut={mut} runAction={runAction} setModal={setModal} enviarParaTarefas={enviarParaTarefas} enviarTodas={enviarTodasParaTarefas} atualizarRadar={atualizarRadar} />}
                {view === "tarefas" && <Tarefas db={db} mut={mut} runAction={runAction} setModal={setModal} />}
                {view === "ajustes" && <Ajustes db={db} setDb={setDb} mut={mut} runAction={runAction} />}
                {view === "auditoria" && <Auditoria db={db} />}
              </>
            )}
          </div>
        </main>
      </div>

      {modal?.t === "lancamento" && <MLancamento db={db} initial={modal.lancamento} onClose={() => setModal(null)} onSave={(l, parcelaId) => modal.lancamento ? runAction(mut.editarLancamento(modal.lancamento.id, l), "Lançamento atualizado.", { instant: true }) : addLancamento(l, parcelaId)} />}
      {modal?.t === "contrato" && <MContrato db={db} initial={modal.contrato} onClose={() => setModal(null)} onSave={(c) => modal.contrato ? runAction(mut.editarContrato(modal.contrato.id, c), "Contrato atualizado.") : runAction(mut.criarContrato(c), "Contrato criado e persistido.")} />}
      {modal?.t === "parcela" && <MParcela db={db} contratoId={modal.contratoId} onClose={() => setModal(null)} onSave={(p) => runAction(mut.criarParcela(p), "Parcela criada e persistida.")} />}
      {modal?.t === "fixo" && <MFixo initial={modal.custo} onClose={() => setModal(null)} onSave={(f) => modal.custo ? runAction(mut.editarCusto(modal.custo.id, f), "Custo fixo atualizado.") : runAction(mut.criarCusto(f), "Custo fixo criado e persistido.")} />}
      {modal?.t === "tarefa" && <MTarefa db={db} mut={mut} runAction={runAction} initial={modal.tarefa} onClose={() => setModal(null)} onSave={(t) => modal.tarefa ? runAction(mut.editarTarefa(modal.tarefa.id, t), "Tarefa atualizada.") : runAction(mut.criarTarefa(t), "Tarefa criada e persistida.")} />}
      {modal?.t === "fecharContrato" && <MFechar contrato={db.contratos.find((c) => c.id === modal.id)} onClose={() => setModal(null)} onSave={(n) => { fecharContrato(modal.id, n); setModal(null); }} />}
      {modal?.t === "processo" && <MProcesso db={db} initial={modal.processo} onClose={() => setModal(null)} onSave={(p) => modal.processo ? runAction(mut.editarProcesso(modal.processo.id, p), "Processo atualizado.") : runAction(mut.criarProcesso(p), "Processo criado e persistido.")} />}
      {modal?.t === "senhaProcesso" && <MSenhaProcesso processo={modal.processo} onClose={() => setModal(null)} onSave={(senha) => runAction(mut.registrarSenhaProcesso(modal.processo.id, senha), "Senha processual salva para a próxima rodada.")} />}
      {modal?.t === "aprovarAutomacao" && <MAprovarAutomacao automacao={modal.automacao} onClose={() => setModal(null)} onSave={(payload) => runAction(mut.aprovarAutomacaoRadar(modal.automacao, payload), "Sugestão aprovada e tarefa criada.")} />}
      {modal?.t === "ignorarAutomacao" && <MIgnorarAutomacao automacao={modal.automacao} onClose={() => setModal(null)} onSave={(motivo) => runAction(mut.ignorarAutomacaoRadar(modal.automacao, motivo), "Sugestão ignorada.")} />}
    </div>
  );
}

/* ══════════  CADEIA  ══════════ */
function Cadeia({ ativo, flash }) {
  const et = ["Lançamento", "Fluxo de caixa", "DRE", "Balanço"];
  return (
    <div style={{ background: C.navy, padding: "7px 26px", display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap", minHeight: 38 }}>
      <span style={{ fontSize: 8, letterSpacing: ".18em", color: "#C0CAE8", fontWeight: 600 }}>CADEIA</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {et.map((e, i) => (
          <React.Fragment key={e}>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 2,
              background: ativo === i ? C.gold : "transparent",
              color: ativo === i ? C.navyDeep : ativo > i ? C.goldSoft : "#C0CAE8",
              fontWeight: ativo === i ? 600 : 400,
              border: `1px solid ${ativo >= i && ativo >= 0 ? C.gold : "#3B4778"}`,
              animation: ativo === i ? "pulseGold .6s ease-out" : "none", transition: "all .2s" }}>{e}</span>
            {i < 3 && <span style={{ color: ativo > i ? C.goldSoft : "#A7B2D6", fontSize: 10 }}>→</span>}
          </React.Fragment>
        ))}
      </div>
      {flash && <span style={{ fontSize: 10.5, color: C.goldSoft, animation: "slideUp .3s ease" }}>{flash}</span>}
    </div>
  );
}

/* ══════════  IMPORTAÇÃO  ══════════ */
function Importacao({ db, m }) {
  const orfaos = db.contratos.filter((c) => (c.obs || "").startsWith("⚠"));
  const conserto = [
    ["Status", "7 grafias → 5", "'Aguardando êxito' e 'Aguardando exito' passam a ser o mesmo status."],
    ["Tipo de honorário", "15 grafias → 8", "'Êxito puro'/'Exito puro', 'Fixo + Exito'/'Fixo + Êxito' e variações viram categorias únicas."],
    ["Parceiros", `${db.parceiros.length} cadastrados`, "Todo parceiro com contrato aparece no painel e pode ser reconciliado."],
    ["Clientes órfãos", `${orfaos.length} recuperados`, "Contratos com parcelas, mas sem linha completa, ficam visíveis no sistema."],
    ["Caixa", "recalculado", "Caixa atual, DRE e balanço são derivados dos lançamentos persistidos."],
    ["Custos fixos", "vigência com fim", "Cada custo tem início, fim opcional e bloqueio contra duplicidade por competência."],
  ];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9, marginBottom: 12 }}>
        <KPI r="Contratos" v={db.contratos.length} n="contratos versionados" c={C.navy} />
        <KPI r="Parcelas" v={db.parcelas.length} n="recebidas e pendentes" c={C.gold} />
        <KPI r="Lançamentos" v={db.lancamentos.length} n="entradas e saídas" c={C.green} />
        <KPI r="Custos fixos" v={db.custosFixos.length} n="recorrências" c={C.amber} />
        <KPI r="Parceiros" v={db.parceiros.length} n="origens" c={C.navy} />
      </div>

      <Card t="O que a importação consertou" s="Cada linha é uma regra de normalização aplicada antes dos cálculos.">
        <table style={tbl}>
          <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
            {["Campo", "Antes → depois", "O que estava acontecendo"].map((h) => <th key={h} style={{ ...th, textAlign: "left" }}>{h.toUpperCase()}</th>)}
          </tr></thead>
          <tbody>
            {conserto.map(([a, b, c]) => (
              <tr key={a} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                <td style={{ ...td, fontWeight: 600, whiteSpace: "nowrap" }}>{a}</td>
                <td style={{ ...td, fontFamily: S.mono, fontSize: 11.5, color: C.amber, fontWeight: 600, whiteSpace: "nowrap" }}>{b}</td>
                <td style={{ ...td, color: C.inkSoft, fontSize: 12 }}>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {orfaos.length > 0 && (
        <>
          <div style={{ height: 12 }} />
          <Card t="Clientes que estavam invisíveis" s="Entraram na visão financeira e contratual do sistema.">
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
              {orfaos.map((c) => (
                <div key={c.id} style={{ border: `1px solid ${C.gold}`, background: C.goldPale, padding: "9px 12px", minWidth: 150 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.cliente}</div>
                  <div style={{ fontSize: 10.5, color: C.inkSoft }}>
                    {m.porContrato[c.id]?.parcelas.length || 0} parcelas · {brl2(c.fixoTotal)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <div style={{ height: 12 }} />
      <Card t="Origem de cada tabela" s="De onde cada informação vem e o que é calculado automaticamente.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20, marginTop: 12 }}>
          <div>
            <Titulo t="Importado ou preenchido" />
            {[["Contratos", "contratos"], ["Parcelas", "parcelas"], ["Lançamentos", "lançamentos"], ["Custos fixos", "configuração recorrente"], ["Parâmetros", "configuração anual"], ["Parceiros", "origem/parceria"]].map(([a, b]) => (
              <Linha key={a} l={a} v={<span style={{ fontSize: 11, color: C.inkSoft, fontFamily: S.body }}>{b}</span>} />
            ))}
          </div>
          <div>
            <Titulo t="Agora calculado" />
            {["Caixa anterior e atual", "Fixo recebido e pendente", "Êxito e sucumbência projetados", "Inadimplência", "Conversão e ticket médio", "DRE, balanço e margem"].map((x) => (
              <Linha key={x} l={<span style={{ color: C.inkSoft }}>{x}</span>} v={<span style={{ color: C.green, fontSize: 11 }}>calculado</span>} />
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}


/* ══════════  PAINEL  ══════════ */
function Painel({ db, m, goto }) {
  const delta = m.fatAnt ? Math.round(((m.fatAtual - m.fatAnt) / m.fatAnt) * 100) : 0;
  const abertas = db.tarefas.filter(tarefaAtiva);
  const statusList = db.tarefaStatuses?.length ? db.tarefaStatuses : TAREFA_STATUS_DEFAULT;
  const statusMap = Object.fromEntries(statusList.map((s) => [s.slug, s]));
  const stMeta = (t) => statusMap[t.status] || { label: t.statusLabel || "A fazer", cor: t.statusCor || C.navy };
  const tarefasFoco = [...abertas].sort((a, b) => String(a.prazo || "9999-99-99").localeCompare(String(b.prazo || "9999-99-99"))).slice(0, 3);
  const prazoInfo = (prazo) => {
    if (!prazo) return { txt: "sem prazo", cor: C.inkSoft };
    if (prazo < HOJE) return { txt: `${diasDesde(prazo)}d`, cor: C.red };
    if (prazo === HOJE) return { txt: "hoje", cor: C.amber };
    return { txt: fmtData(prazo), cor: C.inkSoft };
  };
  return (
    <>
      <Faixa n="Como estou" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 9, marginBottom: 24 }}>
        <KPI r="Caixa hoje" v={brl2(m.caixa)} n={`${pct(m.metaPct)} da meta de ${brl2(db.params.metaCaixa)}`} c={C.navy} />
        <KPI r="Faturamento do mês" v={brl2(m.fatAtual)} n={m.fatAnt ? `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}% vs ${brl2(m.fatAnt)}` : "sem período anterior"} c={delta >= 0 ? C.green : C.red} />
        <KPI r="A receber" v={brl2(m.aReceber)} n={`+ ${brl2(m.exitoProjEscritorio)} projetado`} c={C.gold} />
        <KPI r="Inadimplência" v={brl2(m.inadimp)} n={`${m.atrasadas.length} parcelas em atraso`} c={m.inadimp ? C.red : C.green} d={!!m.inadimp} />
      </div>

      {db.radarRun && (() => {
        const res = db.radarRun.resultados;
        const mov = res.filter((r) => r.status === "movimentou").length;
        const fal = res.filter((r) => r.status === "falhou").length;
        const pend = (db.radarMovsPendentes || db.radarMovs || []).filter((mv) => !db.tarefas.some((t) => t.origemMovId === mv.id)).length;
        return (
          <div onClick={() => goto("radar")} className="card" style={{ cursor: "pointer", background: "#fff", border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.gold}`, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 8.5, letterSpacing: ".16em", color: C.gold, fontWeight: 600 }}>RADAR PROCESSUAL · ÚLTIMA RODADA</div>
              <div style={{ fontSize: 12.5, color: C.ink, marginTop: 3 }}>
                <b>{mov}</b> processos movimentaram, <b>{fal}</b> falharam de {db.radarRun.processosVerificados} verificados
              </div>
            </div>
            {pend > 0 && <span style={{ fontFamily: S.mono, fontSize: 11, fontWeight: 600, color: C.navyDeep, background: C.goldSoft, padding: "5px 10px", borderRadius: 2 }}>{pend} para virar tarefa →</span>}
          </div>
        );
      })()}

      <Faixa n="O que exige ação hoje" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 24, alignItems: "stretch" }}>
        <Card t="Parcelas em atraso" a={{ t: "Ver parcelas", f: () => goto("parcelas") }}>
          <div style={{ minHeight: 138, marginTop: 4 }}>
            {m.atrasadas.slice(0, 3).map((p) => (
              <div key={p.id} className="row" style={linhaFlex}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.contrato?.cliente || "—"}</div>
                  <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 2 }}>{p.tipo || "Parcela"} · esperada em {rotMes(p.mesEsperado)}</div>
                </div>
                <span style={{ fontFamily: S.mono, fontSize: 12.5, fontWeight: 600, color: C.red, whiteSpace: "nowrap", marginLeft: 8 }}>{brl2(p.valor)}</span>
              </div>
            ))}
            {!m.atrasadas.length && <Vazio t="Nenhuma parcela em atraso." />}
          </div>
          {m.atrasadas.length > 3 && <Rodape>+ {m.atrasadas.length - 3} outras · {brl2(m.inadimp)} no total</Rodape>}
        </Card>
        <Card t="Tarefas" a={{ t: "Ver todas", f: () => goto("tarefas") }}>
          <div style={{ minHeight: 138, marginTop: 4 }}>
            {tarefasFoco.map((t) => {
              const st = stMeta(t);
              const pz = prazoInfo(t.prazo);
              return (
                <div key={t.id} className="row" style={linhaFlex}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.titulo || "Tarefa sem título"}</div>
                    <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 3, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <Tag c={st.cor}>{st.label}</Tag>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.contratoCliente || t.processoCliente || (t.processoNumero ? `Proc. ${t.processoNumero}` : "Sem contrato")}</span>
                    </div>
                  </div>
                  <span style={{ fontFamily: S.mono, fontSize: 10, fontWeight: 600, color: pz.cor, whiteSpace: "nowrap", marginLeft: 8 }}>{pz.txt}</span>
                </div>
              );
            })}
            {!abertas.length && <Vazio t="Nenhuma tarefa pendente." />}
          </div>
          {abertas.length > 3 && <Rodape>+ {abertas.length - 3} tarefas abertas</Rodape>}
        </Card>
      </div>

      <Faixa n="Análises do mês — recalculadas a cada lançamento" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 9 }}>
        <Card t="Gastos e categorias" s="Cada despesa classificada">
          {m.gastosCat.length ? (<>
            <div style={{ height: 185, marginTop: 6 }}>
              <ResponsiveContainer>
                <BarChart data={m.gastosCat} layout="vertical" margin={{ left: 4, right: 24 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="nome" width={122} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: C.ink, fontFamily: S.body }} />
                  <Tooltip formatter={(v) => brl2(v)} cursor={{ fill: "#F0F2F7" }} contentStyle={tipStyle} />
                  <Bar dataKey="valor" radius={[0, 2, 2, 0]} barSize={12}>
                    {m.gastosCat.map((g, i) => <Cell key={i} fill={g.nome === "Restituição ao cliente" ? C.gold : C.navy} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Rodape>Total <b style={{ fontFamily: S.mono }}>{brl2(m.gastoAtual)}</b> · maior peso: <b>{m.gastosCat[0]?.nome}</b></Rodape>
          </>) : <Vazio t="Nenhuma movimentação financeira neste período." />}
        </Card>
        <Card t="Clientes fechados" s="Quantas propostas viraram contrato">
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, margin: "12px 0 6px" }}>
            <span style={{ fontFamily: S.display, fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{m.conversao}%</span>
            <span style={{ fontSize: 12, color: C.inkSoft }}>de conversão</span>
          </div>
          <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: C.line, margin: "8px 0 12px" }}>
            <div style={{ width: `${m.conversao}%`, background: C.navy }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, textAlign: "center" }}>
            <Mini n={m.ativos.length} l="contratos ativos" />
            <Mini n={db.contratos.filter((c) => c.status === "Encerrado").length} l="encerrados" c={C.green} />
            <Mini n={m.propostas.length} l="propostas em aberto" c={C.gold} />
          </div>
          <Rodape>Em aberto: {m.propostas.map((c) => c.cliente).join(" · ") || "—"}</Rodape>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 24 }}>
        <Card t="Restituições" s="Valores pagos ao processo a devolver ao cliente">
          <div style={{ fontFamily: S.display, fontSize: 30, fontWeight: 700, margin: "10px 0 10px" }}>
            {brl2(m.restit.reduce((s, l) => s + l.valor, 0))}
          </div>
          {m.restit.map((l) => (
            <div key={l.id} className="row" style={{ ...linhaFlex, fontSize: 12 }}>
              <span>{l.descricao}</span>
              <span style={{ fontFamily: S.mono, fontWeight: 600 }}>{brl2(l.valor)}</span>
            </div>
          ))}
          {!m.restit.length && <Vazio t="Nenhuma restituição neste período." />}
        </Card>
        <Card t="Inadimplência" s="Parcelas em atraso, evidenciadas automaticamente">
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, margin: "10px 0 12px" }}>
            <span style={{ fontFamily: S.display, fontSize: 30, fontWeight: 700, color: m.inadimp ? C.red : C.green }}>{brl2(m.inadimp)}</span>
            <span style={{ fontSize: 11, color: C.inkSoft }}>{(m.inadimp / (m.aReceber + m.inadimp || 1) * 100).toFixed(1)}% da carteira</span>
          </div>
          {m.atrasadas.slice(0, 5).map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${C.line}` }}>
              <span>{p.contrato?.cliente} · {p.tipo} · {rotMes(p.mesEsperado)}</span>
              <span style={{ fontFamily: S.mono, fontWeight: 600 }}>{brl2(p.valor)}</span>
            </div>
          ))}
          {m.atrasadas.length > 5 && <Rodape>+ {m.atrasadas.length - 5} outras parcelas em atraso</Rodape>}
          {!m.atrasadas.length && <Vazio t="Nenhuma parcela em atraso." />}
        </Card>
      </div>

      <Faixa n="Para onde vou" />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 9 }}>
        <Card t={`Caixa — ${ANO}`} s="Saldo encadeado de janeiro a dezembro.">
          <div style={{ height: 205, marginTop: 8 }}>
            <ResponsiveContainer>
              <LineChart data={m.serie}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: C.line }} tick={{ fontSize: 10, fill: C.inkSoft, fontFamily: S.body }} />
                <YAxis tickFormatter={compact} tickLine={false} axisLine={false} tick={{ fontSize: 9.5, fill: C.inkSoft, fontFamily: S.mono }} />
                <Tooltip formatter={(v) => brl2(v)} contentStyle={tipStyle} />
                <Line type="monotone" dataKey="caixa" stroke={C.navy} strokeWidth={2.5} dot={{ r: 2.5, fill: C.navy }} activeDot={{ r: 5, fill: C.gold }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card t="Saúde" s="Indicadores do escritório">
          <div style={{ marginTop: 8 }}>
            <Linha l="Custo fixo mensal" v={brl2(m.custoFixoMensal)} />
            <Linha l="Meses de reserva" v={m.mesesReserva.toFixed(1)} />
            <Linha l="Recorrência atual" v={brl2(db.params.recorrenciaAtual)} />
            <Linha l="% receita recorrente" v={pct(m.pctRecorrente)} />
            <Linha l="Falta para a meta" v={brl2(Math.max(db.params.metaCaixa - m.caixa, 0))} forte />
          </div>
          <Rodape>Todos seguem o mês corrente — nenhum travado em janeiro ou junho.</Rodape>
        </Card>
      </div>
    </>
  );
}

/* ══════════  PARCEIROS  ══════════ */
function Parceiros({ db, m, mut, runAction }) {
  const [novo, setNovo] = useState("");
  const adicionar = () => {
    const nome = novo.trim();
    if (!nome) return;
    runAction(mut.criarParceiro(nome), "Parceiro adicionado e persistido.");
    setNovo("");
  };
  return (
    <Card t="Clientes por origem — conversão e receita" s="Lista fechada. Todo contrato tem um parceiro, e todo parceiro aparece aqui.">
      <table style={tbl}>
        <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
          {["Parceiro", "Contratos", "Ativos", "Encerrados", "Ticket médio", "Receita realizada", "Projetado", ""].map((h, i) => (
            <th key={h + i} style={{ ...th, textAlign: i > 0 && i < 7 ? "right" : "left" }}>{h.toUpperCase()}</th>
          ))}
        </tr></thead>
        <tbody>
          {m.porParceiro.map((p) => (
            <tr key={p.id} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
              <td style={{ ...td, fontWeight: 600 }}>{p.nome}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: S.mono }}>{p.total}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.navy }}>{p.ativos}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.green }}>{p.encerrados}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: S.mono }}>{p.encerrados ? brl2(p.ticket) : "—"}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600, color: C.green }}>{brl2(p.realizada)}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.amber }}>{brl2(p.proj)}</td>
              <td style={{ ...td, textAlign: "right" }}>
                {!p.total && <button onClick={() => runAction(mut.removerParceiro(p.id), "Parceiro removido.")} style={linkBtn}>remover</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 6, marginTop: 14, maxWidth: 380 }}>
        <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Novo parceiro / origem" style={{ ...campo, flex: 1 }} />
        <button className="btn" style={btnSolid} disabled={!novo.trim()}
          onClick={adicionar}>Adicionar</button>
      </div>
      <Rodape>
        {m.semParceiro > 0 ? <>⚠ {m.semParceiro} contratos sem parceiro definido. </> : null}
        Todo contrato tem um parceiro, e todo parceiro aparece aqui.
        Nenhum parceiro fica de fora do painel.
      </Rodape>
    </Card>
  );
}

/* ══════════  CONTRATOS  ══════════ */
function Contratos({ db, m, setModal, mut, runAction }) {
  const [f, setF] = useState("todos");
  const [q, setQ] = useState("");
  const [n, setN] = useState(12);
  const lista = db.contratos
    .filter((c) => (f === "todos" || c.status === f) && (!q || c.cliente.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <Card t="Ciclo do cliente" s="Uma tabela, cinco status. Sem recortar e colar entre abas.">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUS.length},1fr)`, gap: 7, marginTop: 12 }}>
          {STATUS.map((s) => {
            const g = db.contratos.filter((c) => c.status === s);
            return (
              <button key={s} onClick={() => { setF(f === s ? "todos" : s); setN(12); }} style={{
                background: f === s ? C.paper : "#fff",
                borderStyle: "solid",
                borderWidth: "2.5px 1px 1px",
                borderColor: `${STATUS_COR[s]} ${f === s ? STATUS_COR[s] : C.line} ${f === s ? STATUS_COR[s] : C.line}`,
                padding: "9px 11px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: S.body,
              }}>
                <div style={{ fontSize: 9, letterSpacing: ".06em", color: STATUS_COR[s], fontWeight: 600 }}>{s.toUpperCase()}</div>
                <div style={{ fontFamily: S.display, fontSize: 22, fontWeight: 700, marginTop: 2 }}>{g.length}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 9px" }}>
        <Faixa n={`${lista.length} contratos${f !== "todos" ? ` · ${f}` : ""}`} />
        <input value={q} onChange={(e) => { setQ(e.target.value); setN(12); }} placeholder="Buscar cliente…" style={{ ...campo, width: 180 }} />
        <button onClick={() => setModal({ t: "contrato" })} className="btn" style={{ ...btnGhost, whiteSpace: "nowrap" }}>+ Contrato</button>
      </div>

      {lista.slice(0, n).map((c) => {
        const d = m.porContrato[c.id];
        const parceiro = db.parceiros.find((p) => p.id === c.parceiroId);
        const alerta = (c.obs || "").startsWith("⚠");
        return (
          <div key={c.id} className="card" style={{ background: "#fff", border: `1px solid ${alerta ? C.gold : C.line}`, borderLeft: `2.5px solid ${STATUS_COR[c.status]}`, padding: "13px 15px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: S.display, fontSize: 16, fontWeight: 700 }}>{c.cliente}</span>
                  <Tag c={STATUS_COR[c.status]}>{c.status}</Tag>
                  <Tag c={C.inkSoft}>{c.tipoHonorario}</Tag>
                  {parceiro && <Tag c={C.gold}>{parceiro.nome}</Tag>}
                </div>
                <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 2, fontFamily: S.mono }}>
                  {c.processo || "sem processo"}{c.splitNick && ` · split ${c.splitNick}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                <button onClick={() => setModal({ t: "parcela", contratoId: c.id })} className="btn" style={btnGhost}>+ Parcela</button>
                <button onClick={() => setModal({ t: "contrato", contrato: c })} className="btn" style={btnGhost}>Editar</button>
                {c.status === "Proposta" && <button onClick={() => setModal({ t: "fecharContrato", id: c.id })} className="btn" style={btnGold}>Registrar fechamento</button>}
                <button onClick={() => runAction(mut.removerContrato(c.id), "Contrato removido.")} style={linkBtn}>remover</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(118px,1fr))", gap: 1, marginTop: 11, background: C.line, border: `1px solid ${C.line}` }}>
              <Cel l="Fixo total" v={brl2(c.fixoTotal)} />
              <Cel l="Fixo recebido" v={brl2(d.fixoRecebido)} calc c={C.green} />
              <Cel l="Fixo pendente" v={brl2(d.fixoPendente)} calc c={C.amber} />
              <Cel l="Valor da causa" v={brl2(c.valorCausa)} />
              <Cel l="Parcelas" v={`${d.parcelas.filter((p) => p.recebido).length}/${d.parcelas.length}`} calc />
            </div>

            {(c.pctExito > 0 || c.pctSucumb > 0) && c.valorCausa > 0 && (
              <div style={{ marginTop: 10, background: C.paper, border: `1px solid ${C.line}`, padding: "9px 11px" }}>
                <div style={{ fontSize: 8.5, letterSpacing: ".12em", color: C.inkSoft, fontWeight: 600, marginBottom: 6 }}>
                  PROJEÇÃO · QUOTA DO PARCEIRO {pct(c.pctQuota)}
                </div>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead><tr style={{ color: C.inkSoft, fontSize: 9 }}>
                    <th style={thL}></th><th style={thR}>TOTAL</th><th style={thR}>PARCEIRO</th>
                    <th style={{ ...thR, color: C.navy }}>ESCRITÓRIO</th>
                  </tr></thead>
                  <tbody>
                    {c.pctExito > 0 && (
                      <tr style={{ borderTop: `1px solid ${C.line}` }}>
                        <td style={tdL}>Êxito · {pct(c.pctExito)}</td>
                        <td style={tdR}>{brl2(d.exitoTotal)}</td>
                        <td style={{ ...tdR, color: C.inkSoft }}>{brl2(d.exitoParceiro)}</td>
                        <td style={{ ...tdR, color: C.navy, fontWeight: 600 }}>{brl2(d.exitoEscritorio)}</td>
                      </tr>
                    )}
                    {c.pctSucumb > 0 && (
                      <tr style={{ borderTop: `1px solid ${C.line}` }}>
                        <td style={tdL}>Sucumbência · {pct(c.pctSucumb)}</td>
                        <td style={tdR}>{brl2(d.sucumbTotal)}</td>
                        <td style={{ ...tdR, color: C.inkSoft }}>{brl2(d.sucumbParceiro)}</td>
                        <td style={{ ...tdR, color: C.navy, fontWeight: 600 }}>{brl2(d.sucumbEscritorio)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {c.obs && <div style={{ fontSize: 11, color: alerta ? C.amber : C.inkSoft, marginTop: 9, fontStyle: alerta ? "normal" : "italic", fontWeight: alerta ? 600 : 400 }}>{c.obs}</div>}
          </div>
        );
      })}
      {n < lista.length && (
        <button onClick={() => setN(n + 20)} className="btn" style={{ ...btnGhost, width: "100%", padding: "11px" }}>
          Ver mais {Math.min(20, lista.length - n)} · restam {lista.length - n}
        </button>
      )}
      {!lista.length && <Card t=""><Vazio t="Nenhum contrato com esse filtro." /></Card>}
    </>
  );
}

/* ══════════  PARCELAS  ══════════ */
function Parcelas({ db, m, receber, estornar }) {
  const [f, setF] = useState("aberto");
  const lista = db.parcelas
    .map((p) => ({ ...p, contrato: db.contratos.find((c) => c.id === p.contratoId) }))
    .filter((p) => (f === "aberto" ? !p.recebido : f === "recebido" ? p.recebido : true))
    .sort((a, b) => (a.mesEsperado || "").localeCompare(b.mesEsperado || ""));
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 9, marginBottom: 11 }}>
        <KPI r="A receber" v={brl2(m.aReceber)} n="parcelas futuras" c={C.gold} />
        <KPI r="Em atraso" v={brl2(m.inadimp)} n={`${m.atrasadas.length} parcelas`} c={m.inadimp ? C.red : C.green} />
        <KPI r="Fixo pendente" v={brl2(m.fixoPendenteTotal)} n="contratos ativos" c={C.navy} />
        <KPI r="Receita realizada" v={brl2(m.receitaRealizada)} n="entrou no caixa" c={C.green} />
      </div>
      <Card t="Parcelas" s="É aqui que os dois mundos se tocam: confirmar o recebimento cria a entrada.">
        <div style={{ display: "flex", gap: 5, margin: "11px 0 4px" }}>
          {[["aberto", "Em aberto"], ["recebido", "Recebidas"], ["todas", "Todas"]].map(([k, n]) => (
            <button key={k} onClick={() => setF(k)} className="btn" style={chip(f === k)}>{n}</button>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={tbl}>
            <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
              {["Cliente", "Parceiro", "Tipo", "Mês esperado", "Valor", "Recebido?", "Mês efetivo", "Obs", ""].map((h, i) => (
                <th key={h + i} style={{ ...th, textAlign: h === "Valor" ? "right" : "left" }}>{h.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {lista.map((p) => {
                const atras = !p.recebido && p.mesEsperado < MES_ATUAL;
                return (
                  <tr key={p.id} className="row" style={{ borderBottom: `1px solid ${C.line}`, background: atras ? "#FDF6F5" : "transparent" }}>
                    <td style={{ ...td, fontWeight: 500 }}>{p.contrato?.cliente || "—"}</td>
                    <td style={{ ...td, color: C.inkSoft, fontSize: 11.5 }}>{db.parceiros.find((x) => x.id === p.contrato?.parceiroId)?.nome || "—"}</td>
                    <td style={td}><Tag c={C.navy}>{p.tipo}</Tag></td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: atras ? C.red : C.inkSoft, fontWeight: atras ? 600 : 400 }}>{rotMes(p.mesEsperado)}{atras && " ⚠"}</td>
                    <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600 }}>{brl2(p.valor)}</td>
                    <td style={td}><span style={{ fontSize: 11, fontWeight: 600, color: p.recebido ? C.green : atras ? C.red : C.amber }}>{p.recebido ? "✓ Sim" : "Não"}</span></td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: C.inkSoft }}>{p.mesEfetivo ? rotMes(p.mesEfetivo) : "—"}</td>
                    <td style={{ ...td, fontSize: 10.5, color: C.inkSoft, maxWidth: 140 }}>{p.obs || "—"}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      {p.recebido
                        ? <button onClick={() => estornar(p.id)} style={linkBtn}>estornar</button>
                        : <button onClick={() => receber(p.id)} className="btn" style={{ ...btnSolid, padding: "4px 10px", fontSize: 11, background: atras ? C.red : C.navy, whiteSpace: "nowrap" }}>Confirmar recebimento</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Rodape>
          <b>Confirmar recebimento</b> gera a entrada no caixa automaticamente. <b>Estornar</b> desfaz os dois.
          Se o dinheiro chegou por outro caminho, você também pode lançar a entrada direto em{" "}
          <b>Entrada / Saída</b> e vincular a parcela por lá — o efeito é o mesmo.
        </Rodape>
      </Card>
    </>
  );
}

/* ══════════  LANÇAMENTOS  ══════════ */
const ORIGEM_TAG = { manual: { t: "avulso", c: C.inkSoft }, parcela: { t: "↳ PARCELA", c: C.navy }, fixo: { t: "↳ CUSTO FIXO", c: C.amber } };
function Lancamentos({ db, setModal, mut, runAction }) {
  const [f, setF] = useState("todos");
  const [n, setN] = useState(30);
  const lista = [...db.lancamentos].filter((l) => f === "todos" || l.tipo === f || (f === "pendente" && !l.pago))
    .sort((a, b) => b.data.localeCompare(a.data));
  return (
    <Card t="Entradas e saídas" s="O único lugar onde se digita dinheiro. Vem de contrato ou de qualquer outro lugar."
      a={{ t: "+ Nova entrada / saída", f: () => setModal({ t: "lancamento" }) }}>
      <div style={{ display: "flex", gap: 5, margin: "11px 0 4px" }}>
        {[["todos", "Todos"], ["entrada", "Entradas"], ["saida", "Saídas"], ["pendente", "Pendentes"]].map(([k, x]) => (
          <button key={k} onClick={() => { setF(k); setN(30); }} className="btn" style={chip(f === k)}>{x}</button>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={tbl}>
          <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
            {["Data", "Descrição / cliente", "Categoria", "Contrato", "Forma", "Pago", "Origem", "Valor", ""].map((h) => (
              <th key={h} style={{ ...th, textAlign: h === "Valor" ? "right" : "left" }}>{h.toUpperCase()}</th>
            ))}
          </tr></thead>
          <tbody>
            {lista.slice(0, n).map((l) => {
              const o = ORIGEM_TAG[l.origem] || ORIGEM_TAG.manual;
              return (
                <tr key={l.id} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: C.inkSoft }}>{fmtData(l.data)}</td>
                  <td style={{ ...td, fontWeight: 500 }}>{l.descricao}</td>
                  <td style={{ ...td, color: C.inkSoft, fontSize: 11.5 }}>{l.categoria}</td>
                  <td style={{ ...td, fontSize: 11.5 }}>{db.contratos.find((c) => c.id === l.contratoId)?.cliente || <span style={{ color: C.inkSoft }}>—</span>}</td>
                  <td style={{ ...td, color: C.inkSoft, fontSize: 11 }}>{l.forma}</td>
                  <td style={td}><span style={{ fontSize: 10.5, fontWeight: 600, color: l.pago ? C.green : C.amber }}>{l.pago ? "SIM" : "PENDENTE"}</span></td>
                  <td style={td}>
                    <span style={{ fontSize: 8.5, color: o.c, background: l.origem === "manual" ? "transparent" : "#EDF0F8", padding: l.origem === "manual" ? 0 : "2px 5px", fontWeight: 600, letterSpacing: ".04em", whiteSpace: "nowrap" }}>{o.t}</span>
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600, color: l.tipo === "entrada" ? C.green : C.red, whiteSpace: "nowrap" }}>
                    {l.tipo === "entrada" ? "+" : "−"} {brl2(l.valor)}
                  </td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                    {l.origem === "manual" && <button onClick={() => setModal({ t: "lancamento", lancamento: l })} style={linkBtn}>editar</button>}
                    {l.origem === "manual" && <button onClick={() => runAction(mut.removerLancamento(l.id), "Lançamento removido.")} style={{ ...linkBtn, marginLeft: 8 }}>remover</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {n < lista.length && (
        <button onClick={() => setN(n + 40)} className="btn" style={{ ...btnGhost, width: "100%", padding: "9px", marginTop: 10 }}>
          Ver mais · restam {lista.length - n}
        </button>
      )}
      <Rodape>
        A coluna <b>origem</b> é a memória do sistema: <b>↳ PARCELA</b> nasceu de um contrato, <b>↳ CUSTO FIXO</b> do cadastro,{" "}
        <b>avulso</b> foi digitado aqui. Todo número sabe de onde veio — era exatamente isso que faltava
        quando alguém digitava por cima de uma fórmula.
      </Rodape>
    </Card>
  );
}

/* ══════════  CUSTOS FIXOS  ══════════ */
function Fixos({ db, m, lancar, setModal, mut, runAction }) {
  return (
    <>
      <Card t={`Custos fixos de ${rotMes(MES_ATUAL)}`} s="Cadastre uma vez — o sistema propaga por toda a vigência.">
        {!m.fixosDoMes.length ? <Vazio t="Nenhum custo fixo vigente neste mês." /> : (
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 11 }}>
            {m.fixosDoMes.map((f) => (
              <div key={f.id} style={{ border: `1px solid ${f.lancado ? C.line : C.gold}`, background: f.lancado ? C.paper : "#fff", padding: "9px 12px", minWidth: 158 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{f.descricao}</div>
                <div style={{ fontSize: 10, color: C.inkSoft }}>vence dia {f.diaVenc}</div>
                <div style={{ fontFamily: S.mono, fontSize: 14, fontWeight: 600, color: f.lancado ? C.inkSoft : C.red, margin: "3px 0 5px", textDecoration: f.lancado ? "line-through" : "none" }}>{brl2(f.valor)}</div>
                {f.lancado ? <div style={{ fontSize: 9, color: C.green, fontWeight: 600 }}>✓ LANÇADO NO MÊS</div>
                  : <button onClick={() => lancar(f.id, MES_ATUAL)} className="btn" style={{ ...btnSolid, padding: "4px 9px", fontSize: 10.5, width: "100%" }}>Lançar no caixa</button>}
              </div>
            ))}
          </div>
        )}
        <Rodape>Custo fixo mensal vigente: <b style={{ fontFamily: S.mono }}>{brl2(m.custoFixoMensal)}</b> · o sistema recusa lançar o mesmo custo duas vezes no mesmo mês.</Rodape>
      </Card>
      <div style={{ height: 11 }} />
      <Card t="Cadastro de custos fixos" s="Custos fixos recorrentes do escritório" a={{ t: "+ Novo custo fixo", f: () => setModal({ t: "fixo" }) }}>
        <table style={tbl}>
          <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
            {["Descrição", "Valor mensal", "Recorrente?", "Dia venc.", "Vigência", ""].map((h) => (
              <th key={h} style={{ ...th, textAlign: h === "Valor mensal" ? "right" : "left" }}>{h.toUpperCase()}</th>
            ))}
          </tr></thead>
          <tbody>
            {db.custosFixos.map((f) => (
              <tr key={f.id} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                <td style={{ ...td, fontWeight: 500 }}>{f.descricao}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600, color: C.red }}>{brl2(f.valor)}</td>
                <td style={td}><span style={{ fontSize: 10.5, fontWeight: 600, color: f.recorrente ? C.green : C.inkSoft }}>{f.recorrente ? "SIM" : "NÃO"}</span></td>
                <td style={{ ...td, fontFamily: S.mono, color: C.inkSoft }}>{f.diaVenc}</td>
                <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: C.inkSoft }}>{MESES_N[f.mesInicio - 1]} → {MESES_N[(f.mesFim || 12) - 1]}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button onClick={() => setModal({ t: "fixo", custo: f })} style={linkBtn}>editar</button>
                  <button onClick={() => runAction(mut.removerCusto(f.id), "Custo fixo removido.")} style={{ ...linkBtn, marginLeft: 8 }}>remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Rodape>Cadastros duplicados aparecem aqui — e podem ser corrigidos.</Rodape>
      </Card>
    </>
  );
}

/* ══════════  FLUXO  ══════════ */
function Fluxo({ db, m }) {
  const doMes = db.lancamentos.filter((l) => l.pago && mesDe(l.data) === MES_ATUAL).sort((a, b) => a.data.localeCompare(b.data));
  const anterior = db.params.caixaInicial + db.lancamentos.filter((l) => l.pago && l.data < MES_ATUAL + "-01")
    .reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0);
  let saldo = anterior;
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", gap: 9, marginBottom: 11 }}>
        <KPI r="Caixa anterior" v={brl2(anterior)} n={`fechamento de ${rotMes(MES_ANTERIOR)}`} c={C.navy} />
        <KPI r="Entradas do mês" v={brl2(m.fatAtual)} n="realizadas" c={C.green} />
        <KPI r="Saídas do mês" v={brl2(m.gastoAtual)} n="realizadas" c={C.red} />
        <KPI r="Caixa atual" v={brl2(m.caixa)} n="🔒 calculado — não há campo" c={C.gold} d />
      </div>
      <Card t={`Movimentação de ${rotMes(MES_ATUAL)}`} s="Saldo recalculado linha a linha">
        {!doMes.length ? <Vazio t="Nenhuma movimentação neste mês." /> : (
          <table style={tbl}>
            <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
              {["Data", "Movimento", "Entrada", "Saída", "Saldo"].map((h, i) => (
                <th key={h} style={{ ...th, textAlign: i > 1 ? "right" : "left" }}>{h.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {doMes.map((l) => {
                saldo += l.tipo === "entrada" ? l.valor : -l.valor;
                return (
                  <tr key={l.id} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: C.inkSoft }}>{fmtData(l.data)}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 500 }}>{l.descricao}</div>
                      <div style={{ fontSize: 10.5, color: C.inkSoft }}>{l.categoria}</div>
                    </td>
                    <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.green, fontWeight: 600 }}>{l.tipo === "entrada" ? brl2(l.valor) : ""}</td>
                    <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.red, fontWeight: 600 }}>{l.tipo === "saida" ? brl2(l.valor) : ""}</td>
                    <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600 }}>{brl2(saldo)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      <div style={{ height: 11 }} />
      <Card t={`Ano de ${ANO}`} s="A corrente do caixa, de jan a dez — sem um único número digitado no meio">
        <table style={tbl}>
          <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
            {["Mês", "Entradas", "Saídas", "Resultado", "Caixa"].map((h, i) => (
              <th key={h} style={{ ...th, textAlign: i ? "right" : "left" }}>{h.toUpperCase()}</th>
            ))}
          </tr></thead>
          <tbody>
            {m.serie.map((s, i) => (
              <tr key={s.mes} className="row" style={{ borderBottom: `1px solid ${C.line}`, background: MESES[i] === MES_ATUAL ? C.goldPale : "transparent" }}>
                <td style={{ ...td, fontWeight: MESES[i] === MES_ATUAL ? 600 : 400, textTransform: "capitalize" }}>{s.mes}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.green }}>{s.entrada ? brl2(s.entrada) : "—"}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.red }}>{s.saida ? brl2(s.saida) : "—"}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: s.resultado >= 0 ? C.green : C.red }}>{s.resultado ? brl2(s.resultado) : "—"}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600 }}>{brl2(s.caixa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Rodape>O saldo é sempre calculado — nunca digitado por cima.</Rodape>
      </Card>
    </>
  );
}

/* ══════════  DRE  ══════════ */
function DRE({ m }) {
  const linhas = [["Receita de honorários", m.rec, ""], ["(−) Custas e restituições", -m.diretos, ""],
    ["= Resultado bruto", m.rec - m.diretos, "sub"], ["(−) Despesas operacionais", -m.despOp, ""],
    ["= Resultado do período", m.resultado, "total"]];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 9 }}>
      <Card t={`DRE — ${rotMes(MES_ATUAL)}`} s="Receita, custos e margem do período">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 10 }}>
          <tbody>
            {linhas.map(([n, v, tipo]) => (
              <tr key={n} style={{ borderBottom: tipo === "total" ? "none" : `1px solid ${C.line}`,
                borderTop: tipo === "total" ? `1.5px solid ${C.navy}` : "none",
                background: tipo === "total" ? C.paper : "transparent" }}>
                <td style={{ padding: tipo === "total" ? "12px 8px" : "9px 8px", fontWeight: tipo ? 600 : 400, fontFamily: tipo === "total" ? S.display : S.body, fontSize: tipo === "total" ? 15 : 13 }}>{n}</td>
                <td style={{ padding: "9px 8px", textAlign: "right", fontFamily: S.mono, fontWeight: 600, fontSize: tipo === "total" ? 15 : 13, color: v < 0 ? C.red : tipo === "total" ? (v >= 0 ? C.green : C.red) : C.ink }}>{brl2(Math.abs(v))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card t="Margem do mês" s="Quanto sobra de cada real que entra">
        <div style={{ textAlign: "center", padding: "22px 0 14px" }}>
          <div style={{ fontFamily: S.display, fontSize: 54, fontWeight: 700, lineHeight: 1, color: m.margem >= 20 ? C.green : m.margem >= 0 ? C.amber : C.red }}>{m.margem}%</div>
          <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 5 }}>{brl2(m.resultado)} sobre {brl2(m.rec)}</div>
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 11 }}>
          <Linha l="Receita" v={brl2(m.rec)} />
          <Linha l="Custos diretos" v={brl2(m.diretos)} />
          <Linha l="Despesas operacionais" v={brl2(m.despOp)} />
          <Linha l="Resultado" v={brl2(m.resultado)} forte />
        </div>
      </Card>
    </div>
  );
}

/* ══════════  BALANÇO  ══════════ */
function Balanco({ m }) {
  return (
    <Card t="Balanço patrimonial" s={`Posição consolidada do escritório — ${HOJE_LABEL}`}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 12 }}>
        <div>
          <Titulo t="ATIVO" />
          <Linha l="Caixa e equivalentes" v={brl2(m.caixa)} />
          <Linha l="Contas a receber (parcelas)" v={brl2(m.aReceber + m.inadimp)} />
          <Linha l="Total do ativo" v={brl2(m.ativoTotal)} forte topo />
          <div style={{ marginTop: 16, background: C.goldPale, borderLeft: `2px solid ${C.gold}`, padding: "10px 12px" }}>
            <div style={{ fontSize: 8.5, letterSpacing: ".1em", color: C.amber, fontWeight: 600 }}>FORA DO BALANÇO</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 12 }}>
              <span>Projetado — escritório</span><span style={{ fontFamily: S.mono, fontWeight: 600 }}>{brl2(m.exitoProjEscritorio)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 12, color: C.inkSoft }}>
              <span>Projetado — parceiros</span><span style={{ fontFamily: S.mono }}>{brl2(m.exitoProjParceiro)}</span>
            </div>
            <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 5, lineHeight: 1.5 }}>
              Expectativa, não receita. E a parte do parceiro nunca é sua.
            </div>
          </div>
        </div>
        <div>
          <Titulo t="PASSIVO E PATRIMÔNIO" />
          <Linha l={`Obrigações previstas (${m.aPagarPendente.length})`} v={brl2(m.previstos)} />
          <Linha l="Total do passivo" v={brl2(m.previstos)} forte topo />
          <div style={{ height: 14 }} />
          <Titulo t="PATRIMÔNIO LÍQUIDO" />
          <Linha l="Patrimônio líquido" v={brl2(m.pl)} forte />
          <div style={{ background: C.navy, color: "#fff", padding: "14px 13px", marginTop: 14 }}>
            <div style={{ fontSize: 8.5, letterSpacing: ".14em", color: C.goldSoft, fontWeight: 600 }}>CONFERÊNCIA</div>
            <div style={{ fontFamily: S.mono, fontSize: 12, marginTop: 5 }}>{brl2(m.ativoTotal)} = {brl2(m.previstos)} + {brl2(m.pl)}</div>
            <div style={{ fontSize: 10.5, color: "#C0CAE8", marginTop: 5 }}>Fecha sozinho porque nada é digitado duas vezes.</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ══════════  TAREFAS  ══════════ */
function Tarefas({ db, mut, runAction, setModal }) {
  const { me, session } = useAuth();
  const meuEmail = (me?.email || session?.user?.email || "").toLowerCase();
  const statuses = [...(db.tarefaStatuses?.length ? db.tarefaStatuses : TAREFA_STATUS_DEFAULT)].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const statusMap = Object.fromEntries(statuses.map((s) => [s.slug, s]));
  const [visao, setVisao] = useState("todas");
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fPrioridade, setFPrioridade] = useState("");
  const [fResp, setFResp] = useState("");
  const [sort, setSort] = useState("prazo");
  const [paginaQuadros, setPaginaQuadros] = useState(0);
  const [focoStatus, setFocoStatus] = useState("");
  const [dragOverStatus, setDragOverStatus] = useState("");
  const [selecionadas, setSelecionadas] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("a_fazer");
  const allTasks = db.tarefas || [];
  const activeTasks = allTasks.filter((t) => !t.archivedAt);
  const archivedTasks = allTasks.filter((t) => !!t.archivedAt);
  const responsaveis = Array.from(new Set(allTasks.map((t) => t.resp).filter(Boolean))).sort();
  const normal = visao === "arquivadas" ? archivedTasks : activeTasks;
  const matchesVisao = (t, next = visao) => {
    if (next === "minhas") return !meuEmail || (t.resp || "").toLowerCase() === meuEmail;
    if (next === "atrasadas") return tarefaAtiva(t) && t.prazo && t.prazo < HOJE;
    if (next === "hoje") return tarefaAtiva(t) && t.prazo === HOJE;
    if (next === "proximas") return tarefaAtiva(t) && t.prazo > HOJE && t.prazo <= PROXIMA_SEMANA;
    if (next === "bloqueadas") return !t.archivedAt && (t.status === "bloqueada" || t.bloqueiosPendentes > 0);
    if (next === "concluidas") return !t.archivedAt && t.status === "concluida";
    if (next === "radar_inercia") return !t.archivedAt && t.origemRaw === "radar_inercia";
    return true;
  };
  const prioridadePeso = { urgente: 1, alta: 2, normal: 3, baixa: 4 };
  const tarefas = normal
    .filter((t) => matchesVisao(t))
    .filter((t) => !fStatus || t.status === fStatus)
    .filter((t) => !fPrioridade || t.prioridade === fPrioridade)
    .filter((t) => !fResp || t.resp === fResp)
    .filter((t) => !q || [t.titulo, t.descricao, t.resp, t.processoNumero, t.contratoCliente, t.processoCliente].join(" ").toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      if (sort === "prioridade") return (prioridadePeso[a.prioridade] || 9) - (prioridadePeso[b.prioridade] || 9);
      if (sort === "atualizacao") return (b.updatedAt || "").localeCompare(a.updatedAt || "");
      if (sort === "responsavel") return (a.resp || "").localeCompare(b.resp || "");
      return (a.prazo || "9999-12-31").localeCompare(b.prazo || "9999-12-31");
    });
  const totalPaginasQuadros = Math.max(1, Math.ceil(statuses.length / 4));
  useEffect(() => {
    setPaginaQuadros((pagina) => Math.min(pagina, totalPaginasQuadros - 1));
  }, [totalPaginasQuadros]);
  const quadrosVisiveis = focoStatus
    ? statuses.filter((s) => s.slug === focoStatus)
    : statuses.slice(paginaQuadros * 4, paginaQuadros * 4 + 4);
  const tarefasPorStatus = Object.fromEntries(statuses.map((s) => [s.slug, tarefas.filter((t) => t.status === s.slug)]));
  const localCounts = {
    todas: activeTasks.length,
    minhas: activeTasks.filter((t) => !meuEmail || (t.resp || "").toLowerCase() === meuEmail).length,
    atrasadas: activeTasks.filter((t) => tarefaAtiva(t) && t.prazo && t.prazo < HOJE).length,
    hoje: activeTasks.filter((t) => tarefaAtiva(t) && t.prazo === HOJE).length,
    proximas: activeTasks.filter((t) => tarefaAtiva(t) && t.prazo > HOJE && t.prazo <= PROXIMA_SEMANA).length,
    bloqueadas: activeTasks.filter((t) => t.status === "bloqueada" || t.bloqueiosPendentes > 0).length,
    concluidas: activeTasks.filter((t) => t.status === "concluida").length,
    radarInercia: activeTasks.filter((t) => t.origemRaw === "radar_inercia").length,
    arquivadas: archivedTasks.length,
  };
  const inicioQuadros = paginaQuadros * 4 + 1;
  const fimQuadros = Math.min(statuses.length, paginaQuadros * 4 + quadrosVisiveis.length);
  const focoLabel = statusMap[focoStatus]?.label || "";
  const gridQuadros = focoStatus ? "minmax(0, 1fr)" : "repeat(auto-fit, minmax(min(230px, 100%), 1fr))";
  const idsVisiveis = new Set(tarefas.map((t) => t.id));
  const toggleSel = (id) => setSelecionadas((xs) => xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]);
  const limparSel = () => setSelecionadas((xs) => xs.filter((id) => idsVisiveis.has(id)));
  useEffect(limparSel, [visao, q, fStatus, fPrioridade, fResp]);
  const limparFiltrosTarefa = () => {
    setQ("");
    setFStatus("");
    setFPrioridade("");
    setFResp("");
    setSelecionadas([]);
  };
  const focarStatus = (status) => {
    const index = statuses.findIndex((s) => s.slug === status);
    if (index < 0) return;
    setFocoStatus(status);
    setPaginaQuadros(Math.floor(index / 4));
  };
  const focarPrimeiroStatusDaVisao = (next, preferStatus = "") => {
    const source = next === "arquivadas" ? archivedTasks : activeTasks;
    if (preferStatus && source.some((t) => t.status === preferStatus && matchesVisao(t, next))) {
      focarStatus(preferStatus);
      return;
    }
    const first = statuses.find((s) => source.some((t) => t.status === s.slug && matchesVisao(t, next)));
    if (first) focarStatus(first.slug);
    else {
      setFocoStatus("");
      setPaginaQuadros(0);
    }
  };
  const selecionarVisao = (next) => {
    setVisao(next);
    limparFiltrosTarefa();
    if (next === "concluidas") {
      focarStatus("concluida");
      return;
    }
    if (next === "bloqueadas") {
      focarStatus("bloqueada");
      return;
    }
    if (next === "radar_inercia") {
      focarStatus("backlog");
      return;
    }
    if (next === "arquivadas" || next === "atrasadas" || next === "hoje" || next === "proximas") {
      focarPrimeiroStatusDaVisao(next, focoStatus);
      return;
    }
    setFocoStatus("");
    setPaginaQuadros(0);
  };
  const mudarFiltroStatus = (status) => {
    setVisao("todas");
    setFStatus(status);
    if (!status) {
      setFocoStatus("");
      return;
    }
    const index = statuses.findIndex((s) => s.slug === status);
    if (index >= 0) {
      setFocoStatus(status);
      setPaginaQuadros(Math.floor(index / 4));
    }
  };
  const concluir = (t) => {
    const pendentes = (t.checklistTotal - t.checklistConcluidos) + (t.subtarefasTotal - t.subtarefasConcluidas) + (t.bloqueiosPendentes || 0);
    const force = pendentes > 0 ? window.confirm(`Esta tarefa ainda possui ${pendentes} pendência(s). Confirmar conclusão mesmo assim?`) : false;
    if (pendentes > 0 && !force) return;
    setVisao("concluidas");
    focarStatus("concluida");
    runAction(mut.concluirTarefa(t.id, { force }), "Tarefa concluída.");
  };
  const toggle = (t) => {
    if (t.status === "concluida") {
      setVisao("todas");
      focarStatus("a_fazer");
      runAction(mut.reabrirTarefa(t.id, "a_fazer"), "Tarefa reaberta.");
    }
    else concluir(t);
  };
  const mover = (t, status, opts = {}) => {
    if (t.status === status) return;
    if (opts.focus !== false) {
      setVisao(status === "concluida" ? "concluidas" : "todas");
      focarStatus(status);
    }
    runAction(mut.alterarStatusTarefa(t.id, status), "Status atualizado.");
  };
  const soltarNoQuadro = (event, status) => {
    event.preventDefault();
    setDragOverStatus("");
    const id = event.dataTransfer.getData("text/plain");
    const tarefa = db.tarefas.find((row) => row.id === id);
    if (tarefa) mover(tarefa, status, { focus: false });
  };
  const acaoMassa = (action, payload = {}) => {
    if (!selecionadas.length) return;
    runAction(mut.bulkTarefas(selecionadas, action, payload), "Tarefas atualizadas.");
    setSelecionadas([]);
  };
  const chipViews = [
    ["todas", "Todas", localCounts.todas],
    ["minhas", "Minhas tarefas", localCounts.minhas],
    ["atrasadas", "Atrasadas", localCounts.atrasadas],
    ["hoje", "Para hoje", localCounts.hoje],
    ["proximas", "Próximas", localCounts.proximas],
    ["bloqueadas", "Bloqueadas", localCounts.bloqueadas],
    ["concluidas", "Concluídas", localCounts.concluidas],
    ["radar_inercia", "Radar / Inércia", localCounts.radarInercia],
    ["arquivadas", "Arquivadas", localCounts.arquivadas],
  ];
  const KpiFiltro = ({ id, r, v, n, c }) => {
    const selected = visao === id;
    return (
      <button
        type="button"
        aria-label={`Filtrar por ${r.toLowerCase()}`}
        aria-pressed={selected}
        onClick={() => selecionarVisao(id)}
        className="card"
        style={{
          background: selected ? C.navy : "#fff",
          color: selected ? "#fff" : C.ink,
          borderStyle: "solid",
          borderWidth: 1,
          borderColor: selected ? C.navy : C.line,
          borderTopWidth: 2.5,
          borderTopColor: c,
          padding: "12px 14px",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: S.body,
        }}
      >
        <div style={{ fontSize: 9, letterSpacing: ".1em", color: selected ? C.goldSoft : C.inkSoft, fontWeight: 600 }}>{r.toUpperCase()}</div>
        <div style={{ fontFamily: S.display, fontSize: 23, fontWeight: 700, margin: "4px 0 2px", color: selected ? "#fff" : c }}>{v}</div>
        <div style={{ fontSize: 10, color: selected ? "#DDE3F5" : C.inkSoft }}>{n}</div>
      </button>
    );
  };
  const TaskCard = ({ t, dense = false }) => {
    const meta = statusMap[t.status] || {};
    const atras = tarefaAtiva(t) && t.prazo && t.prazo < HOJE;
    const progresso = t.checklistTotal ? `${t.checklistConcluidos}/${t.checklistTotal}` : "";
    return (
      <div className="row" draggable={!t.archivedAt} onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", t.id); }} onDragEnd={() => setDragOverStatus("")}
        style={{
          borderStyle: "solid",
          borderWidth: 1,
          borderColor: atras ? "#F0D4D2" : C.line,
          borderLeftWidth: 3,
          borderLeftColor: atras ? C.red : (meta.cor || TAREFA_PRIORIDADE_COR[t.prioridade] || C.navy),
          padding: dense ? "8px 9px" : "10px 11px",
          marginBottom: 7,
          background: t.pending ? C.goldPale : atras ? "#FDF6F5" : "#fff",
          display: "grid",
          gap: 7,
        }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <input
            aria-label={t.status === "concluida" ? `Reabrir tarefa ${t.titulo}` : `Concluir tarefa ${t.titulo}`}
            type="checkbox"
            checked={t.status === "concluida"}
            onChange={() => toggle(t)}
            style={{ accentColor: C.navy, width: 14, height: 14, marginTop: 2, cursor: "pointer" }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {t.origem === "radar" && <span style={{ fontSize: 8.5, color: C.gold, background: C.goldPale, padding: "1px 5px", borderRadius: 2, fontWeight: 600, letterSpacing: ".04em" }}>{t.origemRaw === "radar_inercia" ? "RADAR / INÉRCIA" : "RADAR"}</span>}
              {t.criadaAutomaticamente && <span style={{ fontSize: 8.5, color: C.green, background: "#EEF8F0", padding: "1px 5px", borderRadius: 2, fontWeight: 600, letterSpacing: ".04em" }}>AUTO</span>}
              {t.syncing && <span style={{ fontSize: 8.5, color: C.inkSoft, background: C.paper, padding: "1px 5px", borderRadius: 2, fontWeight: 600, letterSpacing: ".04em" }}>SALVANDO</span>}
              {t.bloqueiosPendentes > 0 && <Tag c={C.red}>bloqueada</Tag>}
              <Tag c={TAREFA_PRIORIDADE_COR[t.prioridade] || C.navy}>{TAREFA_PRIORIDADE_LABEL[t.prioridade] || "Normal"}</Tag>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4, textDecoration: t.status === "concluida" ? "line-through" : "none", color: t.status === "concluida" ? C.inkSoft : C.ink }}>{t.titulo}</div>
            <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 2 }}>
              {t.contratoCliente || db.contratos.find((c) => c.id === t.contratoId)?.cliente || t.processoCliente || "Sem vínculo"} · {t.resp || "sem responsável"}
              {t.processoNumero && <span style={{ fontFamily: S.mono }}> · {t.processoNumero}</span>}
            </div>
            {t.radarRegraNome && <div style={{ fontSize: 10.5, color: C.gold, marginTop: 2 }}>regra: {t.radarRegraNome}</div>}
            {t.origem === "radar" && t.radarMovimentacoesTotal > 1 && (
              <div style={{ fontSize: 10.5, color: C.red, marginTop: 2 }}>{t.radarMovimentacoesTotal} movimentações vinculadas</div>
            )}
          </div>
          <input aria-label={`Selecionar ${t.titulo}`} type="checkbox" checked={selecionadas.includes(t.id)} onChange={() => toggleSel(t.id)} style={{ accentColor: C.gold, width: 14, height: 14, marginTop: 2 }} />
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: S.mono, fontSize: 10, fontWeight: 600, color: atras ? C.red : C.inkSoft }}>{fmtData(t.prazo)}</span>
            {progresso && <span style={{ fontSize: 10.5, color: C.inkSoft }}>checklist {progresso}</span>}
            {t.subtarefasTotal > 0 && <span style={{ fontSize: 10.5, color: C.inkSoft }}>subtarefas {t.subtarefasConcluidas}/{t.subtarefasTotal}</span>}
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
            <select aria-label={`Status de ${t.titulo}`} value={t.status} onChange={(e) => mover(t, e.target.value)} style={{ ...campo, width: 132, padding: "5px 7px", fontSize: 11 }}>
              {statuses.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
            </select>
            <button onClick={() => setModal({ t: "tarefa", tarefa: t })} style={linkBtn}>editar</button>
            {!t.archivedAt && <button onClick={() => runAction(mut.arquivarTarefa(t.id), "Tarefa arquivada.")} style={linkBtn}>arquivar</button>}
            {t.archivedAt && <button onClick={() => runAction(mut.restaurarTarefa(t.id), "Tarefa restaurada.")} style={linkBtn}>restaurar</button>}
            {t.archivedAt && <button onClick={() => window.confirm("Excluir permanentemente esta tarefa?") && runAction(mut.excluirTarefaPermanente(t.id), "Tarefa excluída permanentemente.")} style={{ ...linkBtn, color: C.red }}>excluir</button>}
            {!t.archivedAt && <button onClick={() => runAction(mut.removerTarefa(t.id), "Tarefa arquivada.")} style={linkBtn}>remover</button>}
          </div>
        </div>
      </div>
    );
  };
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 9, marginBottom: 12 }}>
        <KpiFiltro id="todas" r="Ativas" v={localCounts.todas} n="fora do arquivo" c={C.navy} />
        <KpiFiltro id="atrasadas" r="Atrasadas" v={localCounts.atrasadas} n="prazo vencido" c={C.red} />
        <KpiFiltro id="bloqueadas" r="Bloqueadas" v={localCounts.bloqueadas} n="exigem destrave" c={C.amber} />
        <KpiFiltro id="concluidas" r="Concluídas" v={localCounts.concluidas} n="mantidas no histórico" c={C.green} />
      </div>
      <Card t="Tarefas" s="Operação jurídica em fluxo: radar, contratos, prazos, responsáveis e histórico no mesmo lugar."
        a={{ t: "+ Nova tarefa", f: () => setModal({ t: "tarefa" }) }}>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "12px 0" }}>
          {chipViews.map(([k, n, count]) => (
            <button key={k} onClick={() => selecionarVisao(k)} className="btn" style={{ background: visao === k ? C.navy : "#fff", color: visao === k ? "#fff" : C.ink, border: `1px solid ${visao === k ? C.navy : C.line}`, padding: "7px 9px", fontSize: 11.5, fontWeight: 600, fontFamily: S.body, cursor: "pointer", borderRadius: 2 }}>
              {n} <span style={{ fontFamily: S.mono, opacity: .75 }}>{count}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 12 }}>
          <input aria-label="Buscar tarefas por título, processo ou cliente" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tarefa, processo, cliente…" style={campo} />
          <select aria-label="Filtrar tarefas por status" value={fStatus} onChange={(e) => mudarFiltroStatus(e.target.value)} style={campo}><option value="">Todos os status</option>{statuses.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}</select>
          <select aria-label="Filtrar tarefas por prioridade" value={fPrioridade} onChange={(e) => setFPrioridade(e.target.value)} style={campo}><option value="">Prioridade</option>{TAREFA_PRIORIDADE.map((p) => <option key={p} value={p}>{TAREFA_PRIORIDADE_LABEL[p]}</option>)}</select>
          <select aria-label="Filtrar tarefas por responsável" value={fResp} onChange={(e) => setFResp(e.target.value)} style={campo}><option value="">Responsável</option>{responsaveis.map((r) => <option key={r}>{r}</option>)}</select>
          <select aria-label="Ordenar tarefas" value={sort} onChange={(e) => setSort(e.target.value)} style={campo}><option value="prazo">Ordenar por prazo</option><option value="prioridade">Ordenar por prioridade</option><option value="atualizacao">Ordenar por atualização</option><option value="responsavel">Ordenar por responsável</option></select>
          <button onClick={() => { limparFiltrosTarefa(); setFocoStatus(""); setPaginaQuadros(0); }} className="btn" style={btnGhost}>Limpar filtros</button>
        </div>
        {!!selecionadas.length && (
          <div style={{ background: C.goldPale, border: `1px solid ${C.goldSoft}`, padding: 9, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ fontFamily: S.mono, fontSize: 11, fontWeight: 700 }}>{selecionadas.length} selecionada(s)</span>
            <select aria-label="Status para ação em massa" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} style={{ ...campo, maxWidth: 170 }}>{statuses.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}</select>
            <button onClick={() => acaoMassa("alterar_status", { status: bulkStatus })} className="btn" style={btnSolid}>Alterar status</button>
            <button onClick={() => acaoMassa("concluir", { force: true })} className="btn" style={btnGhost}>Concluir</button>
            <button onClick={() => acaoMassa("arquivar")} className="btn" style={btnGhost}>Arquivar</button>
            {visao === "arquivadas" && <button onClick={() => acaoMassa("restaurar")} className="btn" style={btnGhost}>Restaurar</button>}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 9 }}>
          <div>
            <div style={{ fontSize: 8.5, letterSpacing: ".14em", color: C.inkSoft, fontWeight: 700 }}>KANBAN</div>
            <div style={{ fontSize: 12, color: C.ink }}>
              {focoStatus ? `Foco em ${focoLabel}` : `Quadros ${inicioQuadros}-${fimQuadros} de ${statuses.length}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {focoStatus ? (
              <button onClick={() => setFocoStatus("")} className="btn" style={btnGhost}>Sair do foco</button>
            ) : (
              <>
                <button onClick={() => setPaginaQuadros((p) => Math.max(0, p - 1))} disabled={paginaQuadros === 0} className="btn" style={{ ...btnGhost, opacity: paginaQuadros === 0 ? .45 : 1, cursor: paginaQuadros === 0 ? "not-allowed" : "pointer" }}>Anteriores</button>
                <button onClick={() => setPaginaQuadros((p) => Math.min(totalPaginasQuadros - 1, p + 1))} disabled={paginaQuadros >= totalPaginasQuadros - 1} className="btn" style={{ ...btnGhost, opacity: paginaQuadros >= totalPaginasQuadros - 1 ? .45 : 1, cursor: paginaQuadros >= totalPaginasQuadros - 1 ? "not-allowed" : "pointer" }}>Próximos</button>
              </>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: gridQuadros, gap: 9, alignItems: "stretch" }}>
          {quadrosVisiveis.map((s) => {
            const col = tarefasPorStatus[s.slug] || [];
            const focado = focoStatus === s.slug;
            const alvo = dragOverStatus === s.slug;
            return (
              <div
                key={s.slug}
                role="region"
                aria-label={`Quadro ${s.label}`}
                data-task-status={s.slug}
                onDragEnter={() => setDragOverStatus(s.slug)}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setDragOverStatus("");
                }}
                onDrop={(e) => soltarNoQuadro(e, s.slug)}
                style={{
                  background: alvo ? "#fff" : C.paper,
                  borderStyle: "solid",
                  borderWidth: "3px 1px 1px",
                  borderColor: `${s.cor || C.navy} ${alvo ? (s.cor || C.navy) : C.line} ${alvo ? (s.cor || C.navy) : C.line}`,
                  boxShadow: alvo ? `0 0 0 2px ${(s.cor || C.navy)}22 inset` : "none",
                  padding: focado ? 12 : 9,
                  minHeight: focado ? 420 : 180,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 9 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{s.label}</div>
                    {focado && <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 2 }}>Modo foco ativo</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontFamily: S.mono, fontSize: 10.5, color: C.inkSoft }}>{col.length}</span>
                    <button onClick={() => setFocoStatus(focado ? "" : s.slug)} style={linkBtn}>{focado ? "sair" : "foco"}</button>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {col.map((t) => <TaskCard key={t.id} t={t} dense />)}
                  {!col.length && <Vazio t="Sem tarefas neste status." />}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

/* ══════════  AJUSTES  ══════════ */
function Ajustes({ db, setDb, mut, runAction }) {
  const setP = (k, v) => setDb((p) => ({ ...p, params: { ...p.params, [k]: Number(v) || 0 } }));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
      <Card t="Parâmetros do escritório" s="Editados aqui, e só aqui." a={{ t: "Salvar parametros", f: () => runAction(mut.salvarParams(db.params), "Parâmetros salvos e auditados.", { instant: false }) }}>
        <div style={{ display: "grid", gap: 11, marginTop: 12 }}>
          {[["caixaInicial", "Caixa inicial do ano", `Saldo real em 01/01/${ANO}`],
            ["metaCaixa", `Meta de caixa ${ANO}`, "Única meta: até 31/dez"],
            ["metaRecorrencia", "Meta de recorrência mensal", "Objetivo de receita previsível"],
            ["recorrenciaAtual", "Recorrência atual", "Atualize quando mudar"]].map(([k, l, h]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{l}</div>
                <div style={{ fontSize: 10.5, color: C.inkSoft }}>{h}</div>
              </div>
              <input aria-label={l} type="number" value={db.params[k]} onChange={(e) => setP(k, e.target.value)}
                style={{ ...campo, width: 130, fontFamily: S.mono, fontWeight: 600, textAlign: "right", background: C.goldPale, borderColor: C.gold }} />
            </div>
          ))}
        </div>
        <Rodape>Fundo dourado = os únicos parâmetros digitados do sistema. Troque pelos valores reais e todo o resto se recalcula.</Rodape>
      </Card>
      <Card t="Dados" s="O que está carregado agora">
        <div style={{ marginTop: 10 }}>
          <Linha l="Contratos" v={db.contratos.length} />
          <Linha l="Parcelas" v={db.parcelas.length} />
          <Linha l="Lançamentos" v={db.lancamentos.length} />
          <Linha l="Custos fixos" v={db.custosFixos.length} />
          <Linha l="Parceiros" v={db.parceiros.length} />
          <Linha l="Configurações" v={db.configuracoes.length} />
          <Linha l="Tarefas" v={db.tarefas.length} forte />
        </div>
      </Card>
    </div>
  );
}

/* ══════════  AUDITORIA  ══════════ */
function Auditoria({ db }) {
  const [entidade, setEntidade] = useState("");
  const [acao, setAcao] = useState("");
  const entidades = Array.from(new Set((db.auditoria || []).map((a) => a.entidade).filter(Boolean))).sort();
  const acoes = Array.from(new Set((db.auditoria || []).map((a) => a.acao).filter(Boolean))).sort();
  const lista = (db.auditoria || [])
    .filter((a) => (!entidade || a.entidade === entidade) && (!acao || a.acao === acao))
    .slice(0, 80);
  const resumoMudanca = (a) => {
    const antigo = a.valorAntigo && typeof a.valorAntigo === "object" ? Object.keys(a.valorAntigo).length : 0;
    const novo = a.valorNovo && typeof a.valorNovo === "object" ? Object.keys(a.valorNovo).length : 0;
    if (a.acao === "excluir") return "registro removido";
    if (a.acao === "criar") return `${novo || 1} campos gravados`;
    if (a.acao === "salvar") return `${novo || 1} parâmetros salvos`;
    if (a.acao === "atualizar") return `${novo || antigo || 1} campos atualizados`;
    return "operação registrada";
  };
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 9, marginBottom: 12 }}>
        <KPI r="Eventos" v={(db.auditoria || []).length} n="últimos registros" c={C.navy} />
        <KPI r="Entidades" v={entidades.length} n="com histórico" c={C.gold} />
        <KPI r="Ações" v={acoes.length} n="tipos auditados" c={C.green} />
      </div>
      <Card t="Auditoria" s="Registro somente leitura das alterações persistidas.">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
          <select aria-label="Filtrar auditoria por entidade" value={entidade} onChange={(e) => setEntidade(e.target.value)} style={{ ...campo, maxWidth: 220 }}>
            <option value="">Todas as entidades</option>
            {entidades.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <select aria-label="Filtrar auditoria por ação" value={acao} onChange={(e) => setAcao(e.target.value)} style={{ ...campo, maxWidth: 220 }}>
            <option value="">Todas as ações</option>
            {acoes.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        {!lista.length ? <Vazio t="Nenhum registro de auditoria para estes filtros." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={tbl}>
              <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
                {["Quando", "Entidade", "Ação", "Registro", "Resumo"].map((h) => <th key={h} style={{ ...th, textAlign: "left" }}>{h.toUpperCase()}</th>)}
              </tr></thead>
              <tbody>
                {lista.map((a) => (
                  <tr key={a.id} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11, whiteSpace: "nowrap" }}>{a.criadoEm ? new Date(a.criadoEm).toLocaleString("pt-BR") : "—"}</td>
                    <td style={{ ...td, fontWeight: 500 }}>{a.entidade || "—"}</td>
                    <td style={td}><Tag c={a.acao === "excluir" ? C.red : C.navy}>{a.acao || "—"}</Tag></td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 10.5, color: C.inkSoft }}>{a.entidadeId || "—"}</td>
                    <td style={{ ...td, color: C.inkSoft }}>{resumoMudanca(a)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Rodape>Valores antigos e novos permanecem no banco; a interface mostra um resumo para evitar despejar JSON bruto na tela.</Rodape>
      </Card>
    </>
  );
}

/* ══════════  RADAR PROCESSUAL  ══════════ */
const RADAR_COR = { pendencias: C.red, base_inicial: C.navy, movimentou: C.gold, sem_novidade: C.green, parado: C.amber, senha: C.amber, nao_localizado: C.red, nao_verificado: C.red, pendente: C.inkSoft };
const RADAR_ROTULO = { pendencias: "Pendências de análise", base_inicial: "Base inicial", movimentou: "Nova movimentação", sem_novidade: "Sem novidade", parado: "Parado +30 dias", senha: "Senha necessária", nao_localizado: "Não localizado", nao_verificado: "Não verificado", pendente: "Aguardando scraper" };
const AUTO_ROTULO = {
  aguardando_aprovacao: "aguardando aprovação",
  tarefa_criada: "tarefa criada",
  ignorada: "ignorada",
  sem_tarefa: "classificada sem tarefa",
  erro: "erro na automação",
  aprovando: "aprovando",
  ignorando: "ignorando",
};

function Radar({ db, mut, runAction, setModal, enviarParaTarefas, enviarTodas, atualizarRadar }) {
  const [aba, setAba] = useState("movimentou");
  const [procBusca, setProcBusca] = useState("");
  const [procTribunal, setProcTribunal] = useState("");
  const [procStatus, setProcStatus] = useState("");
  const [procArea, setProcArea] = useState("");
  const semRun = !db.radarRun;
  const run = db.radarRun || { id: "sem-run", rodadaEm: `${HOJE}T00:00:00`, processosVerificados: 0, resultados: [] };
  const movs = db.radarMovs || [];
  const movsPendentesFila = db.radarMovsPendentes || [];
  const hist = db.radarHistorico || [];
  const radarSync = db.radarSync || {};
  const liveCounts = db.radarCounts || {};
  const rodadaEmAndamento = run.status === "em_andamento";
  const runResultadosCount = run.resultados?.length || 0;
  const progressoRadar = run.processosPrevistos ? Math.min(100, Math.round((run.processosVerificados / run.processosPrevistos) * 100)) : 0;
  const syncLabel = radarSync.syncing
    ? "atualizando agora"
    : radarSync.lastSyncAt
      ? `atualizado ${new Date(radarSync.lastSyncAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
      : "atualização automática ativa";
  const inerciaDias = Number(db.configuracoes?.find((c) => c.chave === "radar_inercia_dias")?.valor || 30);
  const tarefaStatusMap = Object.fromEntries([...(db.tarefaStatuses?.length ? db.tarefaStatuses : TAREFA_STATUS_DEFAULT)].map((s) => [s.slug, s]));

  const resultadoDe = (pid) => run.resultados.find((r) => r.processoId === pid);
  const proc = (pid) => db.processos.find((p) => p.id === pid);
  const radarEstados = ["pendencias", "base_inicial", "movimentou", "sem_novidade", "parado", "senha", "nao_localizado", "nao_verificado", "pendente"];
  const cont = Object.fromEntries(radarEstados.map((status) => [status, 0]));
  run.resultados.forEach((r) => { cont[r.status] = (cont[r.status] || 0) + 1; });
  radarEstados.forEach((status) => {
    if (liveCounts[status] !== undefined) cont[status] = Number(liveCounts[status] || 0);
  });
  const movsPendentesAnalise = movsPendentesFila.filter((mv) => ["pendente", "em_tarefa"].includes(mv.statusAnalise || "pendente"));
  cont.pendencias = liveCounts.pendencias_analise !== undefined ? Number(liveCounts.pendencias_analise || 0) : movsPendentesAnalise.length;
  const pendenciasCount = Number(cont.pendencias || 0);
  const totalMovs = liveCounts.movimentacoes_total !== undefined ? Number(liveCounts.movimentacoes_total || 0) : movs.length;
  const rodadaData = run.rodadaEm.slice(0, 10);
  const jaTarefa = (mvId) => [...movs, ...movsPendentesFila].some((mv) => mv.id === mvId && (mv.virouTarefa || mv.tarefaId)) || db.tarefas.some((t) => t.origemMovId === mvId);
  const movsPendentes = movsPendentesAnalise.filter((mv) => (mv.statusAnalise || "pendente") === "pendente" && !jaTarefa(mv.id) && !mv.automacaoId);
  const movsDaRodadaAtual = movs.filter((mv) => mv.execucaoId === run.id);
  const pendenciasPorProcesso = Array.from(movsPendentesAnalise.reduce((map, mv) => {
    const key = mv.processoId || mv.numero || mv.id;
    const current = map.get(key) || { processoId: mv.processoId, numero: mv.numero, cliente: mv.cliente, movimentos: [] };
    current.movimentos.push(mv);
    map.set(key, current);
    return map;
  }, new Map()).values()).sort((a, b) => b.movimentos.length - a.movimentos.length || (a.numero || "").localeCompare(b.numero || ""));
  const tarefasInercia = [
    ...(db.radarInerciaTasks || []),
    ...(db.tarefas || []).filter((t) => t.origemRaw === "radar_inercia"),
  ].filter((task, index, all) => all.findIndex((row) => row.id === task.id) === index);
  const tarefaInerciaDe = (pid) => tarefasInercia.find((t) => t.processoId === pid);
  const sugestoesPendentes = (db.radarAutomacoes || []).filter((a) => a.status === "aguardando_aprovacao");
  const sugestaoDe = (automationId) => sugestoesPendentes.find((a) => a.id === automationId);
  const diasParado = (p) => diasDesde(p.ultimoAndamento);
  const resultadoOperacional = (p) => {
    const r = resultadoDe(p.id);
    if (r) return { texto: RADAR_ROTULO[r.status] || r.statusLabel || r.status, cor: RADAR_COR[r.status] || C.inkSoft };
    if (!p.monitorar) return { texto: "Monitoramento desativado", cor: C.inkSoft };
    if (p.precisaSenha) return { texto: "Senha necessária", cor: C.amber };
    if (p.naoLocalizado) return { texto: "Processo não localizado", cor: C.red };
    if (p.naoVerificado) return { texto: "Não foi possível verificar", cor: C.red };
    return { texto: "Aguardando primeira rodada", cor: C.inkSoft };
  };
  const normalizarBusca = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const processoTextoBusca = (p) => normalizarBusca([
    p.numero, p.numeroInterno, p.areaPasta, p.statusProcesso, p.autor, p.reu,
    p.comarca, p.assunto, p.andamentoAtual, p.tribunal,
  ].join(" "));
  const areasProcessos = Array.from(new Set(db.processos.map((p) => p.areaPasta).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const statusProcessos = Array.from(new Set(db.processos.map((p) => p.statusProcesso).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const tribunaisProcessos = Array.from(new Set(db.processos.map((p) => p.tribunal).filter(Boolean))).sort();
  const processosFiltrados = db.processos.filter((p) => {
    if (procBusca && !processoTextoBusca(p).includes(normalizarBusca(procBusca))) return false;
    if (procTribunal && p.tribunal !== procTribunal) return false;
    if (procStatus && p.statusProcesso !== procStatus) return false;
    if (procArea && p.areaPasta !== procArea) return false;
    return true;
  });
  const limparFiltrosProcessos = () => {
    setProcBusca("");
    setProcTribunal("");
    setProcStatus("");
    setProcArea("");
  };

  useEffect(() => {
    let active = true;
    let timer = null;
    let inFlight = false;
    const nextDelay = () => (run.status === "em_andamento" || semRun ? 900 : 1000);
    const tick = async () => {
      if (!active) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        timer = setTimeout(tick, 5000);
        return;
      }
      if (inFlight) {
        timer = setTimeout(tick, 900);
        return;
      }
      inFlight = true;
      try {
        const progress = await mut.atualizarRadarProgresso({ silent: true });
        const progressRunId = progress?.execucao?.id || "";
        const progressConsultados = Number(progress?.execucao?.total_consultados || 0);
        const runMudou = progressRunId && progressRunId !== run.id;
        const detalhesAtrasados = progressRunId && progressRunId === run.id && progressConsultados > runResultadosCount;
        const rodadaTerminou = run.status === "em_andamento" && progress?.execucao?.status && progress.execucao.status !== "em_andamento";
        const pendenciasMudaram = progress?.movimentacoes_pendentes_total !== undefined && Number(progress.movimentacoes_pendentes_total || 0) !== pendenciasCount;
        if (runMudou || detalhesAtrasados || rodadaTerminou || pendenciasMudaram) {
          await mut.atualizarRadar({ silent: true });
        }
      } catch {
        // The manual Atualizar button keeps the visible error path. Live polling
        // should never cover the screen or clear the numbers already visible.
      } finally {
        inFlight = false;
        if (active) timer = setTimeout(tick, nextDelay());
      }
    };
    timer = setTimeout(tick, run.status === "em_andamento" || semRun ? 400 : 700);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [mut, pendenciasCount, run.id, run.status, runResultadosCount, semRun]);

  // processos parados há mais de 30 dias (régua de inércia)
  const parados = db.processos.filter((p) => p.monitorar && p.ativo && (diasParado(p) || 0) > inerciaDias)
    .sort((a, b) => a.ultimoAndamento.localeCompare(b.ultimoAndamento));
  cont.parado = liveCounts.parado !== undefined ? Number(liveCounts.parado || 0) : parados.length;

  // lista da aba atual
  const listaProc = aba === "parado" ? [] : run.resultados.filter((r) => r.status === aba)
    .map((r) => ({ ...r, p: proc(r.processoId) }))
    .filter((r) => r.p);
  const listaDetalhesPendente = aba !== "parado" && Number(cont[aba] || 0) > 0 && !listaProc.length;

  return (
    <>
      {/* faixa de execução */}
      {db.processos.length === 0 ? (
        <Card t="Radar processual" s="Nenhum processo cadastrado para monitorar."
          a={{ t: "+ Adicionar processo", f: () => setModal({ t: "processo" }) }}>
          <Vazio t="O radar consulta os processos cadastrados na lista abaixo. Adicione o primeiro processo (número CNJ + tribunal) e a próxima verificação já terá o que consultar. Sem processos cadastrados, rodar o radar não traz resultados — foi por isso que a rodada não mostrou nada." />
        </Card>
      ) : semRun ? (
        <Card t="Radar processual" s="Nenhuma verificação registrada ainda." a={{ t: "Atualizar", f: atualizarRadar }}>
          <Vazio t="As consultas processuais são executadas semanalmente pelo ambiente autorizado. Depois da primeira rodada local, os resultados aparecerão aqui automaticamente." />
        </Card>
      ) : (
        <div className="card" style={{ background: C.navy, color: "#fff", padding: "15px 18px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 8.5, letterSpacing: ".18em", color: C.goldSoft, fontWeight: 600 }}>ÚLTIMA VERIFICAÇÃO DO RADAR</div>
            <div style={{ fontFamily: S.display, fontSize: 20, fontWeight: 700, marginTop: 2 }}>
              {new Date(rodadaData).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </div>
            <div style={{ fontSize: 11.5, color: "#C0CAE8", marginTop: 3 }}>
              {run.processosVerificados} de {run.processosPrevistos || run.processosVerificados} processos processados · executor local autorizado
            </div>
            <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ width: 170, height: 5, background: "rgba(255,255,255,.18)", overflow: "hidden" }}>
                <div style={{ width: `${progressoRadar}%`, height: "100%", background: rodadaEmAndamento ? C.goldSoft : C.gold, transition: "width .18s ease-out" }} />
              </div>
              <span style={{ fontSize: 10.5, color: radarSync.error ? "#FFD7D5" : "#C0CAE8" }}>
                {rodadaEmAndamento ? `rodada em andamento · ${progressoRadar}% · ${syncLabel}` : syncLabel}
                {radarSync.error ? " · falha na atualização automática" : ""}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button onClick={enviarTodas} disabled={!movsPendentes.length} className="btn" style={{ ...btnGold, opacity: movsPendentes.length ? 1 : .5, cursor: movsPendentes.length ? "pointer" : "not-allowed" }}>
              Enviar {movsPendentes.length || ""} movimentações às tarefas
            </button>
            <button onClick={atualizarRadar} className="btn" style={{ background: "#fff", color: C.navy, border: "none", padding: "8px 15px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: S.body, borderRadius: 2 }}>
              ↻ Atualizar
            </button>
          </div>
        </div>
      )}

      {/* resultados possíveis */}
      <Faixa n="O resultado da rodada — cada processo cai em uma situação" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 12 }}>
        {radarEstados.map((st) => (
          <button key={st} onClick={() => setAba(st)} style={{
            background: aba === st ? "#fff" : "#FBFBFD",
            borderStyle: "solid",
            borderWidth: "3px 1px 1px",
            borderColor: `${RADAR_COR[st]} ${aba === st ? RADAR_COR[st] : C.line} ${aba === st ? RADAR_COR[st] : C.line}`,
            padding: "14px 16px",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: S.body,
          }}>
            <div style={{ fontSize: 9.5, letterSpacing: ".1em", color: RADAR_COR[st], fontWeight: 600 }}>{RADAR_ROTULO[st].toUpperCase()}</div>
            <div style={{ fontFamily: S.display, fontSize: 34, fontWeight: 700, margin: "4px 0 1px" }}>{cont[st]}</div>
            <div style={{ fontSize: 10.5, color: C.inkSoft }}>
              {st === "pendencias" && `${liveCounts.processos_com_pendencias || pendenciasPorProcesso.length} processos aguardando análise`}
              {st === "base_inicial" && "primeira base salva"}
              {st === "movimentou" && `${totalMovs} movimentos da última rodada`}
              {st === "sem_novidade" && "nada mudou desde a última rodada"}
              {st === "parado" && `último andamento acima de ${inerciaDias} dias`}
              {st === "senha" && "cadastre a senha do processo"}
              {st === "nao_localizado" && "corrija ou revise o número"}
              {st === "nao_verificado" && "falha técnica ou página inesperada"}
              {st === "pendente" && "TJCE/TJBA aguardam scraper"}
            </div>
          </button>
        ))}
      </div>

      <Card t={`Sugestões aguardando aprovação (${sugestoesPendentes.length})`} s="Movimentações reconhecidas por regra técnica. O advogado aprova, edita ou ignora antes de criar a tarefa.">
        {!sugestoesPendentes.length ? <Vazio t="Nenhuma sugestão aguardando aprovação." /> : (
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {sugestoesPendentes.slice(0, 8).map((a) => (
              <div key={a.id} className="row" style={{ border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.gold}`, padding: 11, display: "grid", gap: 7 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <Tag c={C.gold}>{a.tipoNome || "movimentação reconhecida"}</Tag>
                  {a.gatilho === "tarefa_concluida" && <Tag c={C.green}>próxima etapa</Tag>}
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{a.regraNome}</span>
                  <span style={{ fontFamily: S.mono, color: C.inkSoft, fontSize: 10.5 }}>{a.numero}</span>
                </div>
                <div style={{ fontSize: 12.5, color: C.ink }}>{a.sugestao?.titulo || "Tarefa sugerida pelo Radar Processual"}</div>
                <div style={{ fontSize: 11, color: C.inkSoft, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span>{a.cliente || "sem cliente"}</span>
                  <span>{a.movimentacaoDataHora ? `movimentação em ${fmtData(String(a.movimentacaoDataHora).slice(0, 10))}` : "sem data da movimentação"}</span>
                  {a.tarefaAnteriorTitulo && <span>após concluir: {a.tarefaAnteriorTitulo}</span>}
                  <span>{AUTO_ROTULO[a.status] || a.status}</span>
                </div>
                <div style={{ display: "flex", gap: 7, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button onClick={() => setModal({ t: "ignorarAutomacao", automacao: a })} className="btn" style={{ ...btnGhost, padding: "6px 11px", fontSize: 11 }}>Ignorar</button>
                  <button onClick={() => setModal({ t: "aprovarAutomacao", automacao: a })} className="btn" style={{ ...btnSolid, padding: "6px 11px", fontSize: 11 }}>Aprovar / editar</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Rodape>As regras iniciais são técnicas e exigem aprovação humana. Nenhuma orientação jurídica sensível é aplicada automaticamente nesta etapa.</Rodape>
      </Card>

      {/* ── PENDÊNCIAS PERSISTENTES ── */}
      {aba === "pendencias" && (
        <Card t={`Pendências de análise (${cont.pendencias})`} s="Movimentações novas continuam aqui até virarem tarefa, serem concluídas ou ignoradas. A fila não depende da última rodada.">
          {!pendenciasPorProcesso.length ? <Vazio t="Nenhuma movimentação pendente de análise." /> : (
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {pendenciasPorProcesso.map((grupo) => {
                const processo = proc(grupo.processoId) || {};
                const podeCriar = grupo.movimentos.some((mv) => (mv.statusAnalise || "pendente") === "pendente" && !jaTarefa(mv.id) && !mv.automacaoId);
                const primeiraPendente = grupo.movimentos.find((mv) => (mv.statusAnalise || "pendente") === "pendente" && !jaTarefa(mv.id) && !mv.automacaoId);
                return (
                  <div key={grupo.processoId || grupo.numero} className="row" style={{ border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.red}`, padding: 12, display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{processo.cliente || grupo.cliente || processo.autor || "Processo sem cliente"}</div>
                        <div style={{ fontFamily: S.mono, fontSize: 10.5, color: C.inkSoft }}>{grupo.numero || processo.numero} · {processo.tribunal || "—"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                        <Tag c={C.red}>{grupo.movimentos.length} pendência(s)</Tag>
                        {podeCriar && (
                          <button onClick={() => enviarParaTarefas(primeiraPendente)} className="btn" style={{ ...btnSolid, padding: "6px 11px", fontSize: 11 }}>
                            Criar tarefa do processo
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: 7 }}>
                      {grupo.movimentos.map((mv) => {
                        const status = mv.statusAnalise || "pendente";
                        return (
                          <div key={mv.id} style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "8px 9px", display: "grid", gap: 4 }}>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                              <Tag c={status === "em_tarefa" ? C.gold : C.red}>{status === "em_tarefa" ? "em tarefa" : "pendente"}</Tag>
                              {mv.tarefaTitulo && <span style={{ fontSize: 10.5, color: C.green }}>tarefa: {mv.tarefaTitulo}</span>}
                              {mv.automacaoStatus === "aguardando_aprovacao" && <Tag c={C.amber}>aguardando aprovação</Tag>}
                              <span style={{ fontFamily: S.mono, fontSize: 10, color: C.inkSoft }}>{mv.data ? fmtData(mv.data) : "sem data"}</span>
                            </div>
                            <div style={{ fontSize: 12.2, color: C.ink }}>{mv.resumo || "Movimentação sem descrição"}</div>
                            {status === "pendente" && !mv.automacaoId && !mv.tarefaId && (
                              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button onClick={() => runAction(mut.ignorarMovimentacaoRadar(mv), "Movimentação ignorada.")} style={{ ...linkBtn, color: C.inkSoft }}>ignorar</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Rodape>“Sem novidade nesta execução” não encerra pendências antigas. Elas permanecem nesta fila até uma ação explícita.</Rodape>
        </Card>
      )}

      {/* ── MOVIMENTOU: o feed que vira tarefa ── */}
      {aba === "movimentou" && (
        <Card t="Movimentações detectadas" s="Cada uma pode virar tarefa no módulo interno — é a costura entre o radar e a operação."
          a={movsPendentes.length ? { t: `Enviar todas (${movsPendentes.length})`, f: enviarTodas } : null}>
          {!movsDaRodadaAtual.length ? <Vazio t="Nenhum processo movimentou nesta rodada." /> : (
            <div style={{ marginTop: 10 }}>
              {movsDaRodadaAtual.map((mv) => {
                const enviado = jaTarefa(mv.id);
                const sugestao = sugestaoDe(mv.automacaoId);
                return (
                  <div key={mv.id} className="row" style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ width: 3, alignSelf: "stretch", background: C.gold, borderRadius: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{mv.cliente}</span>
                        <Tag c={C.navy}>{mv.tipo}</Tag>
                        {mv.regraNome && <Tag c={C.gold}>{mv.regraNome}</Tag>}
                        {mv.classificacaoStatus === "ambigua" && <Tag c={C.amber}>ambígua</Tag>}
                        {mv.classificacaoStatus === "nao_reconhecida" && <Tag c={C.inkSoft}>sem regra conhecida</Tag>}
                        {mv.automacaoGatilho === "tarefa_concluida" && <Tag c={C.green}>próxima etapa</Tag>}
                        {mv.automacaoStatus && <Tag c={mv.automacaoStatus === "tarefa_criada" ? C.green : mv.automacaoStatus === "ignorada" ? C.inkSoft : C.amber}>{AUTO_ROTULO[mv.automacaoStatus] || mv.automacaoStatus}</Tag>}
                        <span style={{ fontFamily: S.mono, fontSize: 10.5, color: C.inkSoft }}>{mv.numero}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: C.ink, marginTop: 3 }}>{mv.resumo}</div>
                      <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 2 }}>
                        movimentação em {fmtData(mv.data)}{mv.evento ? ` · evento ${mv.evento}` : ""}{mv.usuario ? ` · ${mv.usuario}` : ""}
                      </div>
                      {mv.tarefaTitulo && <div style={{ fontSize: 10.5, color: C.green, marginTop: 2 }}>tarefa vinculada: {mv.tarefaTitulo}</div>}
                      {mv.tarefaAnteriorTitulo && <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 2 }}>próxima etapa após: {mv.tarefaAnteriorTitulo}</div>}
                    </div>
                    {sugestao
                      ? <button onClick={() => setModal({ t: "aprovarAutomacao", automacao: sugestao })} className="btn" style={{ ...btnSolid, padding: "6px 12px", fontSize: 11.5, whiteSpace: "nowrap", alignSelf: "center" }}>Aprovar tarefa</button>
                      : enviado
                      ? <span style={{ fontSize: 10.5, color: C.green, fontWeight: 600, whiteSpace: "nowrap", alignSelf: "center" }}>✓ já é tarefa</span>
                      : <button onClick={() => enviarParaTarefas(mv)} className="btn" style={{ ...btnSolid, padding: "6px 12px", fontSize: 11.5, whiteSpace: "nowrap", alignSelf: "center" }}>→ Criar tarefa</button>}
                  </div>
                );
              })}
            </div>
          )}
          <Rodape>
            Todo processo que movimenta precisa de olho humano. O radar detecta; <b>"Criar tarefa"</b> joga para o backlog interno —
            que é a mesma aba de <b>Tarefas</b> do sistema. Nada vive numa ferramenta paralela.
          </Rodape>
        </Card>
      )}

      {/* ── BASE INICIAL / SEM NOVIDADE ── */}
      {["base_inicial", "sem_novidade"].includes(aba) && (
        <Card
          t={aba === "base_inicial" ? "Bases iniciais criadas" : "Processos sem novidade"}
          s={aba === "base_inicial" ? "Primeira consulta concluída: a base foi salva e não gera alerta." : "Verificados nesta rodada, nada mudou. Ficam de olho para a próxima."}
        >
          {listaDetalhesPendente ? <Vazio t="Atualizando a lista detalhada desta rodada..." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={tbl}>
              <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
                {["Cliente", "Processo", "Tribunal", "Fase atual", "Último andamento"].map((h) => <th key={h} style={{ ...th, textAlign: "left" }}>{h.toUpperCase()}</th>)}
              </tr></thead>
              <tbody>
                {listaProc.map((r) => {
                  const pendencias = movsPendentesAnalise.filter((mv) => mv.processoId === r.processoId).length || r.p.pendenciasAnaliseTotal || 0;
                  return (
                    <tr key={r.processoId} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <td style={{ ...td, fontWeight: 500 }}>
                        {r.p.cliente}
                        {pendencias > 0 && <div style={{ marginTop: 4 }}><Tag c={C.red}>{pendencias} pendência(s) de análise</Tag></div>}
                      </td>
                      <td style={{ ...td, fontFamily: S.mono, fontSize: 11 }}>{r.p.numero}</td>
                      <td style={{ ...td, color: C.inkSoft }}>{r.p.tribunal} · {r.p.comarca}</td>
                      <td style={td}><Tag c={C.inkSoft}>{r.p.fase}</Tag></td>
                      <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: r.p.ultimoAndamento && diasDesde(r.p.ultimoAndamento) > 30 ? C.amber : C.inkSoft }}>
                        {r.p.ultimoAndamento ? `${fmtData(r.p.ultimoAndamento)} · ${diasDesde(r.p.ultimoAndamento)}d` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </Card>
      )}

      {/* ── INÉRCIA PROCESSUAL ── */}
      {aba === "parado" && (
        <Card t={`Processos parados há mais de ${inerciaDias} dias`} s="A tarefa automática nasce no backlog e fica vinculada ao processo.">
          {!parados.length ? <Vazio t={`Nenhum processo ultrapassou ${inerciaDias} dias sem movimentação.`} /> : (
            <div style={{ overflowX: "auto" }}>
              <table style={tbl}>
                <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
                  {["Cliente", "Processo", "Último andamento", "Dias", "Última consulta", "Resultado técnico", "Tarefa automática"].map((h) => <th key={h} style={{ ...th, textAlign: "left" }}>{h.toUpperCase()}</th>)}
                </tr></thead>
                <tbody>
                  {parados.map((p) => {
                    const dias = diasParado(p);
                    const status = resultadoOperacional(p);
                    const tarefa = tarefaInerciaDe(p.id);
                    const tarefaTexto = tarefa
                      ? tarefa.archivedAt ? "arquivada"
                        : tarefa.status === "concluida" ? "concluída"
                          : tarefa.status === "backlog" ? "no backlog"
                            : tarefaStatusMap[tarefa.status]?.label || "criada"
                      : "aguardando próxima rodada";
                    return (
                      <tr key={p.id} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                        <td style={{ ...td, fontWeight: 500 }}>{p.cliente || p.autor || "—"}</td>
                        <td style={{ ...td, fontFamily: S.mono, fontSize: 11 }}>{p.numero}</td>
                        <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: C.inkSoft }}>{p.ultimoAndamento ? fmtData(p.ultimoAndamento) : "—"}</td>
                        <td style={{ ...td, fontFamily: S.mono, fontSize: 11.5, fontWeight: 700, color: C.amber }}>{dias}d</td>
                        <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: C.inkSoft }}>{p.ultimaTentativa ? new Date(p.ultimaTentativa).toLocaleDateString("pt-BR") : "—"}</td>
                        <td style={{ ...td, color: status.cor, fontSize: 11.5, fontWeight: 600 }}>{dias} dias sem movimentação — última consulta com {status.texto.toLowerCase()}</td>
                        <td style={td}><Tag c={tarefa ? C.green : C.inkSoft}>{tarefaTexto}</Tag></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Rodape>A inércia é calculada pelo último andamento conhecido. Falhas técnicas permanecem visíveis junto da contagem de dias.</Rodape>
        </Card>
      )}

      {/* ── AGUARDANDO SCRAPER ── */}
      {aba === "pendente" && (
        <Card t="Tribunais aguardando scraper" s="TJCE e TJBA ficam pendentes de implementação e não interrompem o radar dos demais processos.">
          {!listaProc.length ? <Vazio t="Nenhum processo aguardando scraper nesta rodada." /> : (
            <div style={{ marginTop: 10 }}>
              {listaProc.map((r) => (
                <div key={r.processoId} className="row" style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ width: 26, height: 26, borderRadius: 13, background: C.goldPale, color: C.amber, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>…</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.p.cliente} <span style={{ fontFamily: S.mono, fontSize: 10.5, color: C.inkSoft, fontWeight: 400 }}>· {r.p.numero}</span></div>
                    <div style={{ fontSize: 11.5, color: C.amber, marginTop: 2 }}>Aguardando scraper para {r.p.tribunal}. O restante da rodada continua válido.</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Rodape>TJSP continua pela implementação validada; TJCE/TJBA permanecem como pendentes planejados até nova versão.</Rodape>
        </Card>
      )}

      {/* ── REVISÃO OPERACIONAL ── */}
      {["senha", "nao_localizado", "nao_verificado"].includes(aba) && (
        <Card
          t={aba === "senha" ? "Processos que exigem senha" : aba === "nao_localizado" ? "Processos não localizados" : "Processos que não puderam ser verificados"}
          s={aba === "senha" ? "Cadastre a senha uma vez; o executor local usará na próxima rodada." : aba === "nao_localizado" ? "O número ou tribunal precisa ser revisado, mas o processo permanece cadastrado." : "Falha técnica, timeout, captcha ou página inesperada. A próxima rodada tentará novamente."}
        >
          {!listaProc.length ? <Vazio t={listaDetalhesPendente ? "Atualizando a lista detalhada desta rodada..." : "Nenhum processo nesta situação na última rodada."} /> : (
            <div style={{ marginTop: 10 }}>
              {listaProc.map((r) => (
                <div key={r.processoId} className="row" style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ width: 26, height: 26, borderRadius: 13, background: "#FBEDEC", color: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>!</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.p.cliente} <span style={{ fontFamily: S.mono, fontSize: 10.5, color: C.inkSoft, fontWeight: 400 }}>· {r.p.numero}</span></div>
                    <div style={{ fontSize: 11.5, color: aba === "senha" ? C.amber : C.red, marginTop: 2 }}>{r.detalhe || r.statusLabel || RADAR_ROTULO[r.status]}</div>
                  </div>
                  {aba === "senha" && (
                    <button onClick={() => setModal({ t: "senhaProcesso", processo: r.p })} className="btn" style={{ ...btnGhost, padding: "5px 11px", fontSize: 11, whiteSpace: "nowrap" }}>
                      Cadastrar senha
                    </button>
                  )}
                  <button onClick={() => setModal({ t: "processo", processo: r.p })} className="btn" style={{ ...btnGhost, padding: "5px 11px", fontSize: 11, whiteSpace: "nowrap" }}>
                    Revisar processo
                  </button>
                </div>
              ))}
            </div>
          )}
          <Rodape>
            Uma verificação inconclusiva <b>não remove</b> o processo do radar. Ela fica registrada para o usuário corrigir senha, número,
            tribunal ou manter o processo para a próxima rodada.
          </Rodape>
        </Card>
      )}

      {/* régua de inércia + tendência */}
      <div style={{ height: 12 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Card t={`Parados há mais de ${inerciaDias} dias`} s="A régua de inércia — o que exige acompanhamento ativo">
          {!parados.length ? <Vazio t={`Nenhum processo parado além de ${inerciaDias} dias.`} /> : (
            <div style={{ marginTop: 8 }}>
              {parados.slice(0, 7).map((p) => {
                const tarefa = tarefaInerciaDe(p.id);
                return (
                  <div key={p.id} className="row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.cliente || p.autor || "—"}</div>
                      <div style={{ fontSize: 10.5, color: C.inkSoft, fontFamily: S.mono }}>{p.numero} · {p.fase || p.statusProcesso || "—"}</div>
                      <div style={{ fontSize: 10.5, color: tarefa ? C.green : C.inkSoft, marginTop: 2 }}>{tarefa ? "tarefa automática vinculada" : "tarefa será criada na próxima rodada"}</div>
                    </div>
                    <span style={{ fontFamily: S.mono, fontSize: 11.5, fontWeight: 600, color: C.amber, whiteSpace: "nowrap" }}>{diasParado(p)}d parado</span>
                  </div>
                );
              })}
              {parados.length > 7 && <Rodape>+ {parados.length - 7} outros parados há mais de {inerciaDias} dias</Rodape>}
            </div>
          )}
        </Card>

        <Card t="Movimentações por semana" s="Quantas cada rodada encontrou — e quantas falharam">
          <div style={{ height: 190, marginTop: 8 }}>
            <ResponsiveContainer>
              <BarChart data={hist.map((h) => ({ sem: fmtData(h.data), movimentaram: h.movimentaram, falharam: h.falharam }))}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false} />
                <XAxis dataKey="sem" tickLine={false} axisLine={{ stroke: C.line }} tick={{ fontSize: 10, fill: C.inkSoft, fontFamily: S.mono }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: C.inkSoft, fontFamily: S.mono }} allowDecimals={false} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="movimentaram" name="Movimentaram" fill={C.gold} radius={[2, 2, 0, 0]} barSize={14} />
                <Bar dataKey="falharam" name="Falharam" fill={C.red} radius={[2, 2, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* cadastro dos processos monitorados */}
      <div style={{ height: 12 }} />
      <Card t={`Processos monitorados (${processosFiltrados.length}/${db.processos.length})`} s="A lista que a automação varre toda semana"
        a={{ t: "+ Adicionar processo", f: () => setModal({ t: "processo" }) }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(210px,1.4fr) repeat(3,minmax(150px,1fr)) auto", gap: 8, margin: "12px 0" }}>
          <input
            aria-label="Buscar processo por CNJ, parte, vara ou assunto"
            value={procBusca}
            onChange={(e) => setProcBusca(e.target.value)}
            placeholder="Buscar CNJ, parte, vara, assunto..."
            style={campo}
          />
          <select aria-label="Filtrar processos por tribunal" value={procTribunal} onChange={(e) => setProcTribunal(e.target.value)} style={campo}>
            <option value="">Todos os tribunais</option>
            {tribunaisProcessos.map((tribunal) => <option key={tribunal} value={tribunal}>{tribunal}</option>)}
          </select>
          <select aria-label="Filtrar processos por status" value={procStatus} onChange={(e) => setProcStatus(e.target.value)} style={campo}>
            <option value="">Todos os status</option>
            {statusProcessos.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select aria-label="Filtrar processos por área ou pasta" value={procArea} onChange={(e) => setProcArea(e.target.value)} style={campo}>
            <option value="">Todas as áreas/pastas</option>
            {areasProcessos.map((area) => <option key={area} value={area}>{area}</option>)}
          </select>
          <button onClick={limparFiltrosProcessos} className="btn" style={btnGhost}>Limpar</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={tbl}>
            <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
              {["Área/Pasta", "Nº", "Partes", "Processo", "Tribunal", "Status / andamento", "Último andamento", "Dias sem mov.", "Última tentativa", "Resultado radar", "Monitorar", ""].map((h, i) => (
                <th key={h + i} style={{ ...th, textAlign: "left" }}>{h.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {processosFiltrados.map((p) => {
                const r = resultadoDe(p.id);
                return (
                  <tr key={p.id} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ ...td, fontWeight: 500 }}>{p.areaPasta || "—"}</td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11 }}>{p.numeroInterno || "—"}</td>
                    <td style={{ ...td, minWidth: 170 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.autor || p.cliente || "—"}</div>
                      <div style={{ fontSize: 10.5, color: C.inkSoft }}>{p.reu ? `x ${p.reu}` : p.cliente ? "cliente/vínculo" : "sem partes"}</div>
                    </td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11 }}>{p.numero}</td>
                    <td style={{ ...td, color: C.inkSoft, fontSize: 11.5 }}>{p.tribunal} · {p.comarca}</td>
                    <td style={{ ...td, minWidth: 180 }}>
                      <Tag c={p.statusProcesso ? C.navy : C.inkSoft}>{p.statusProcesso || p.fase || "—"}</Tag>
                      <div style={{ marginTop: 4, fontSize: 10.5, color: C.inkSoft, maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.andamentoAtual || p.assunto || "—"}
                      </div>
                    </td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: (diasParado(p) || 0) > inerciaDias ? C.amber : C.inkSoft }}>
                      {p.ultimoAndamento ? fmtData(p.ultimoAndamento) : "—"}
                    </td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: (diasParado(p) || 0) > inerciaDias ? C.amber : C.inkSoft, fontWeight: (diasParado(p) || 0) > inerciaDias ? 700 : 400 }}>
                      {diasParado(p) == null ? "—" : `${diasParado(p)}d`}
                    </td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: p.ultimaConsultaInconclusiva ? C.amber : C.inkSoft }}>
                      {p.ultimaTentativa ? new Date(p.ultimaTentativa).toLocaleDateString("pt-BR") : "—"}
                    </td>
	                    <td style={td}>
	                      {r ? <span style={{ fontSize: 10.5, fontWeight: 600, color: RADAR_COR[r.status] }}>{RADAR_ROTULO[r.status]}{r.status === "movimentou" ? ` (${r.qtd})` : ""}</span>
	                        : !p.monitorar ? <span style={{ fontSize: 10.5, color: C.inkSoft }}>Monitoramento desativado</span>
	                        : p.precisaSenha ? <span style={{ fontSize: 10.5, fontWeight: 600, color: C.amber }}>Senha necessária</span>
	                        : p.naoLocalizado ? <span style={{ fontSize: 10.5, fontWeight: 600, color: C.red }}>Processo não localizado</span>
	                        : p.naoVerificado ? <span style={{ fontSize: 10.5, fontWeight: 600, color: C.red }}>Não foi possível verificar</span>
	                        : <span style={{ fontSize: 10.5, color: C.inkSoft }}>Aguardando primeira rodada</span>}
	                      {tarefaInerciaDe(p.id) && <div style={{ fontSize: 10, color: C.green, marginTop: 3 }}>tarefa de inércia vinculada</div>}
	                    </td>
                    <td style={td}>
                      <button onClick={() => runAction(mut.alterarMonitoramentoProcesso(p), p.monitorar ? "Monitoramento pausado." : "Monitoramento ativado.")}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: p.monitorar ? C.green : C.inkSoft, fontFamily: S.body }}>
                        {p.monitorar ? "● ativo" : "○ pausado"}
                      </button>
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <button onClick={() => setModal({ t: "senhaProcesso", processo: p })} style={linkBtn}>senha</button>
                      <button onClick={() => setModal({ t: "processo", processo: p })} style={{ ...linkBtn, marginLeft: 8 }}>editar</button>
                      <button onClick={() => runAction(mut.removerProcesso(p.id), "Processo removido.")} style={{ ...linkBtn, marginLeft: 8 }}>remover</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!processosFiltrados.length && <Vazio t="Nenhum processo encontrado para estes filtros." />}
        <Rodape>
          É esta lista que o executor local percorre. Adicionar um processo aqui o deixa disponível para a próxima rodada semanal autorizada.
          O frontend acompanha os resultados, mas não inicia o navegador nesta etapa.
        </Rodape>
      </Card>
    </>
  );
}

/* ══════════  MODAIS  ══════════ */
function Shell({ titulo, eyebrow, onClose, children, onSave, ok, salvar = "Salvar" }) {
  const dialogRef = useRef(null);
  const titleId = React.useId();

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const previousFocus = document.activeElement;
    const focusableSelector = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll(focusableSelector))
        .filter((node) => !node.hasAttribute("disabled") && node.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.cancelAnimationFrame(frame);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(21,29,62,.55)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", width: "100%", maxWidth: 600, maxHeight: "92vh", overflowY: "auto", animation: "slideUp .14s ease" }}
      >
        <div style={{ background: C.navy, color: "#fff", padding: "14px 19px", position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ fontSize: 8.5, letterSpacing: ".18em", color: C.goldSoft, fontWeight: 600 }}>{eyebrow}</div>
          <div id={titleId} style={{ fontFamily: S.display, fontSize: 18, fontWeight: 700, marginTop: 2 }}>{titulo}</div>
        </div>
        <div style={{ padding: "17px 19px" }}>
          {children}
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={onClose} className="btn" style={btnGhost}>Cancelar</button>
            <button onClick={onSave} disabled={!ok} className="btn" style={{ ...btnSolid, background: ok ? C.navy : "#C3C9D8", cursor: ok ? "pointer" : "not-allowed" }}>{salvar}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── entrada/saída: livre, com a OPÇÃO de quitar uma parcela ── */
function MLancamento({ db, initial, onClose, onSave }) {
  const [tipo, setTipo] = useState(initial?.tipo || "entrada");
  const [parcelaId, setParcelaId] = useState("");
  const [f, setF] = useState({
    data: initial?.data || HOJE,
    descricao: initial?.descricao || "",
    valor: initial?.valor || "",
    categoria: initial?.categoria || "",
    forma: initial?.forma || "PIX",
    pago: initial?.pago ?? true,
    contratoId: initial?.contratoId || "",
    obs: initial?.obs || "",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const cats = tipo === "entrada" ? CAT_ENTRADA : CAT_SAIDA;
  const abertas = db.parcelas.filter((p) => !p.recebido && (!f.contratoId || p.contratoId === f.contratoId))
    .map((p) => ({ ...p, cliente: db.contratos.find((c) => c.id === p.contratoId)?.cliente }));
  const ok = f.descricao && f.valor > 0 && f.categoria;

  const escolherParcela = (id) => {
    setParcelaId(id);
    if (!id) return;
    const p = db.parcelas.find((x) => x.id === id);
    const ct = db.contratos.find((c) => c.id === p.contratoId);
    setF((s) => ({ ...s, valor: p.valor, descricao: `${p.tipo} — ${ct?.cliente}`, categoria: "Honorários", contratoId: p.contratoId, pago: true }));
  };

  return (
    <Shell eyebrow="ENTRADA ÚNICA DE DADO" titulo={initial ? "Editar entrada / saída" : "Nova entrada / saída"} onClose={onClose} ok={ok}
      salvar={initial ? "Atualizar lançamento" : parcelaId ? "Salvar e quitar parcela" : "Salvar lançamento"}
      onSave={() => { onSave({ ...f, tipo, valor: Number(f.valor) }, parcelaId); onClose(); }}>
      <div style={{ display: "flex", marginBottom: 14, border: `1px solid ${C.line}` }}>
        {[["entrada", "Entrada", C.green], ["saida", "Saída", C.red]].map(([k, n, cor]) => (
          <button key={k} onClick={() => { setTipo(k); set("categoria", ""); setParcelaId(""); }} className="btn" style={{
            flex: 1, padding: "9px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            fontFamily: S.body, background: tipo === k ? cor : "#fff", color: tipo === k ? "#fff" : C.inkSoft,
          }}>{n}</button>
        ))}
      </div>

      {tipo === "entrada" && !initial && (
        <div style={{ background: parcelaId ? C.goldPale : C.paper, border: `1px solid ${parcelaId ? C.gold : C.line}`, padding: "11px 12px", marginBottom: 14 }}>
          <div style={{ fontSize: 8.5, letterSpacing: ".12em", color: parcelaId ? C.amber : C.inkSoft, fontWeight: 600, marginBottom: 5 }}>
            ESTA ENTRADA QUITA UMA PARCELA?
          </div>
          <select value={parcelaId} onChange={(e) => escolherParcela(e.target.value)} style={campo}>
            <option value="">Não — é dinheiro de outro lugar</option>
            {abertas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.cliente} · {p.tipo} · {rotMes(p.mesEsperado)} · {brl2(p.valor)}
                {p.mesEsperado < MES_ATUAL ? " ⚠ atrasada" : ""}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 6, lineHeight: 1.5 }}>
            {parcelaId
              ? <>Ao salvar, a parcela é marcada como <b>recebida</b> e a entrada cai no caixa — <b>de uma vez só</b>.</>
              : <>Deixe em "não" para consultoria, reembolso, aporte ou qualquer entrada que não venha de contrato.</>}
          </div>
        </div>
      )}

      <Grid>
        <F l="DATA"><input type="date" value={f.data} onChange={(e) => set("data", e.target.value)} style={campo} /></F>
        <F l="VALOR (R$)"><input type="number" step="0.01" placeholder="0,00" value={f.valor} onChange={(e) => set("valor", e.target.value)} style={{ ...campo, fontFamily: S.mono, fontWeight: 600 }} /></F>
        <F l="DESCRIÇÃO / CLIENTE" full><input value={f.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex.: Honorário inicial — Cliente X" style={campo} /></F>
        <F l="CATEGORIA" full>
          <select value={f.categoria} onChange={(e) => set("categoria", e.target.value)} style={campo}>
            <option value="">Selecione</option>{cats.map((c) => <option key={c}>{c}</option>)}
          </select>
        </F>
        <F l="CONTRATO / CLIENTE">
          <select value={f.contratoId} onChange={(e) => { set("contratoId", e.target.value); setParcelaId(""); }} style={campo} disabled={!!parcelaId}>
            <option value="">Sem vínculo</option>
            {db.contratos.map((c) => <option key={c.id} value={c.id}>{c.cliente}</option>)}
          </select>
        </F>
        <F l="FORMA"><select value={f.forma} onChange={(e) => set("forma", e.target.value)} style={campo}>{FORMAS.map((x) => <option key={x}>{x}</option>)}</select></F>
        <F l="PAGO / EFETIVADO?">
          <select value={f.pago ? "1" : "0"} onChange={(e) => set("pago", e.target.value === "1")} style={campo} disabled={!!parcelaId}>
            <option value="1">Sim — entrou/saiu do caixa</option>
            <option value="0">Pendente — ainda não caiu</option>
          </select>
        </F>
        <F l="OBSERVAÇÕES"><input value={f.obs} onChange={(e) => set("obs", e.target.value)} style={campo} /></F>
      </Grid>
      <Nota>
        Se <b>Pago = Sim</b>, entra no caixa agora. Se <b>Pendente</b>, vai para as obrigações do balanço e não mexe no caixa —
        é o mesmo "SIM / PENDENTE" da coluna PAGO das suas abas mensais, só que valendo para os dois lados.
      </Nota>
    </Shell>
  );
}

function MContrato({ db, initial, onClose, onSave }) {
  const [f, setF] = useState(initial || { cliente: "", parceiroId: "", processo: "", tipoHonorario: "", pctExito: 0, pctSucumb: 0, pctQuota: 0, fixoTotal: 0, valorCausa: 0, status: "Proposta", splitNick: "", obs: "", dataProposta: HOJE, dataFechamento: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const ok = f.cliente && f.tipoHonorario;
  const ex = (f.valorCausa || 0) * (f.pctExito || 0);
  return (
    <Shell eyebrow="CADASTRO" titulo={initial ? "Editar contrato" : "Novo contrato"} onClose={onClose} ok={ok} salvar={initial ? "Atualizar contrato" : "Salvar contrato"} onSave={() => { onSave(f); onClose(); }}>
      <Grid>
        <F l="CLIENTE" full><input value={f.cliente} onChange={(e) => set("cliente", e.target.value)} style={campo} /></F>
        <F l="PARCEIRO / ORIGEM">
          <select value={f.parceiroId} onChange={(e) => set("parceiroId", e.target.value)} style={campo}>
            <option value="">Sem parceiro</option>{db.parceiros.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </F>
        <F l="STATUS"><select value={f.status} onChange={(e) => set("status", e.target.value)} style={campo}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select></F>
        <F l="PROCESSO" full><input value={f.processo} onChange={(e) => set("processo", e.target.value)} placeholder="0000000-00.0000.8.26.0000" style={{ ...campo, fontFamily: S.mono, fontSize: 12 }} /></F>
        <F l="TIPO DE HONORÁRIO" full>
          <select value={f.tipoHonorario} onChange={(e) => set("tipoHonorario", e.target.value)} style={campo}>
            <option value="">Selecione</option>{TIPO_HONORARIO.map((t) => <option key={t}>{t}</option>)}
          </select>
        </F>
        <F l="FIXO TOTAL (R$)"><input type="number" step="0.01" value={f.fixoTotal} onChange={(e) => set("fixoTotal", Number(e.target.value))} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="VALOR DA CAUSA (R$)"><input type="number" step="0.01" value={f.valorCausa} onChange={(e) => set("valorCausa", Number(e.target.value))} style={{ ...campo, fontFamily: S.mono, background: C.goldPale, borderColor: C.gold }} /></F>
        <F l="% ÊXITO"><input type="number" value={Math.round(f.pctExito * 100)} onChange={(e) => set("pctExito", Number(e.target.value) / 100)} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="% SUCUMBÊNCIA"><input type="number" value={Math.round(f.pctSucumb * 100)} onChange={(e) => set("pctSucumb", Number(e.target.value) / 100)} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="% QUOTA — FATIA DO PARCEIRO" full><input type="number" value={Math.round(f.pctQuota * 100)} onChange={(e) => set("pctQuota", Number(e.target.value) / 100)} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="SPLIT NICK"><input value={f.splitNick} onChange={(e) => set("splitNick", e.target.value)} style={campo} /></F>
        <F l="DATA DA PROPOSTA"><input type="date" value={f.dataProposta} onChange={(e) => set("dataProposta", e.target.value)} style={campo} /></F>
        <F l="OBSERVAÇÕES" full><input value={f.obs} onChange={(e) => set("obs", e.target.value)} style={campo} /></F>
      </Grid>
      {ex > 0 && (
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "9px 11px", marginTop: 12, fontSize: 12 }}>
          <div style={{ fontSize: 8.5, letterSpacing: ".12em", color: C.inkSoft, fontWeight: 600, marginBottom: 5 }}>🔒 PRÉVIA CALCULADA</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Êxito total</span><b style={{ fontFamily: S.mono }}>{brl2(ex)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: C.inkSoft }}><span>Parceiro ({pct(f.pctQuota)})</span><span style={{ fontFamily: S.mono }}>{brl2(ex * f.pctQuota)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: C.navy, fontWeight: 600 }}><span>Escritório ({pct(1 - f.pctQuota)})</span><span style={{ fontFamily: S.mono }}>{brl2(ex * (1 - f.pctQuota))}</span></div>
        </div>
      )}
    </Shell>
  );
}

function MParcela({ db, contratoId, onClose, onSave }) {
  const ct = db.contratos.find((c) => c.id === contratoId);
  const [f, setF] = useState({ contratoId, tipo: "Mensal", valor: "", mesEsperado: MES_ATUAL, recebido: false, mesEfetivo: "", obs: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Shell eyebrow={(ct?.cliente || "").toUpperCase()} titulo="Nova parcela" onClose={onClose} ok={f.valor > 0 && f.mesEsperado}
      salvar="Salvar parcela" onSave={() => { onSave({ ...f, valor: Number(f.valor) }); onClose(); }}>
      <Grid>
        <F l="TIPO"><select value={f.tipo} onChange={(e) => set("tipo", e.target.value)} style={campo}>{TIPO_PARCELA.map((t) => <option key={t}>{t}</option>)}</select></F>
        <F l="VALOR (R$)"><input type="number" step="0.01" value={f.valor} onChange={(e) => set("valor", e.target.value)} style={{ ...campo, fontFamily: S.mono, fontWeight: 600 }} /></F>
        <F l="MÊS ESPERADO" full>
          <select value={f.mesEsperado} onChange={(e) => set("mesEsperado", e.target.value)} style={campo}>
            {MESES.map((m) => <option key={m} value={m}>{rotMes(m)}</option>)}
          </select>
        </F>
        <F l="OBSERVAÇÕES" full><input value={f.obs} onChange={(e) => set("obs", e.target.value)} style={campo} /></F>
      </Grid>
      <Nota>Não há campo "recebido" aqui — a confirmação acontece em <b>Parcelas</b> ou pelo lançamento de entrada. Nos dois casos, o efeito é o mesmo.</Nota>
    </Shell>
  );
}

function MFixo({ initial, onClose, onSave }) {
  const [f, setF] = useState(initial || { descricao: "", valor: "", recorrente: true, diaVenc: 5, mesInicio: 1, mesFim: 12 });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Shell eyebrow="CADASTRE UMA VEZ" titulo={initial ? "Editar custo fixo" : "Novo custo fixo"} onClose={onClose} ok={f.descricao && f.valor > 0} salvar={initial ? "Atualizar custo fixo" : "Salvar custo fixo"}
      onSave={() => { onSave({ ...f, valor: Number(f.valor), diaVenc: Number(f.diaVenc), mesInicio: Number(f.mesInicio), mesFim: Number(f.mesFim) }); onClose(); }}>
      <Grid>
        <F l="DESCRIÇÃO" full><input value={f.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex.: Contador" style={campo} /></F>
        <F l="VALOR MENSAL (R$)"><input type="number" step="0.01" value={f.valor} onChange={(e) => set("valor", e.target.value)} style={{ ...campo, fontFamily: S.mono, fontWeight: 600 }} /></F>
        <F l="DIA DO VENCIMENTO"><input type="number" min="1" max="28" value={f.diaVenc} onChange={(e) => set("diaVenc", e.target.value)} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="RECORRENTE?">
          <select value={f.recorrente ? "1" : "0"} onChange={(e) => set("recorrente", e.target.value === "1")} style={campo}>
            <option value="1">Sim — todo mês da vigência</option><option value="0">Não</option>
          </select>
        </F>
        <F l="MÊS DE INÍCIO"><select value={f.mesInicio} onChange={(e) => set("mesInicio", e.target.value)} style={campo}>{MESES_N.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></F>
        <F l="MÊS FINAL" full><select value={f.mesFim} onChange={(e) => set("mesFim", e.target.value)} style={campo}>{MESES_N.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></F>
      </Grid>
      <Nota>Defina o mês final para que a vigência do custo tenha fim.</Nota>
    </Shell>
  );
}

function MTarefa({ db, mut, runAction, initial, onClose, onSave }) {
  const [f, setF] = useState(initial || { titulo: "", descricao: "", contratoId: "", processoId: "", processoNumero: "", resp: "", prioridade: "normal", status: "a_fazer", dataInicio: HOJE, prazo: HOJE, estimativaMinutos: "", tags: [], obs: "" });
  const [detail, setDetail] = useState(null);
  const [novoChecklist, setNovoChecklist] = useState("");
  const [novaSub, setNovaSub] = useState("");
  const [novoComentario, setNovoComentario] = useState("");
  const statuses = db.tarefaStatuses?.length ? db.tarefaStatuses : TAREFA_STATUS_DEFAULT;
  useEffect(() => {
    let active = true;
    if (!initial?.id || !mut.carregarTarefa) return undefined;
    mut.carregarTarefa(initial.id).then((row) => { if (active) setDetail(row); }).catch(() => {});
    return () => { active = false; };
  }, [initial?.id]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const salvar = () => {
    const tags = Array.isArray(f.tags) ? f.tags : String(f.tags || "").split(",").map((x) => x.trim()).filter(Boolean);
    onSave({ ...f, tags, estimativaMinutos: f.estimativaMinutos === "" ? "" : Number(f.estimativaMinutos) });
    onClose();
  };
  const atualizarDetalhe = () => {
    if (!initial?.id || !mut.carregarTarefa) return;
    mut.carregarTarefa(initial.id).then(setDetail).catch(() => {});
  };
  const checklist = detail?.checklist || [];
  const subtarefas = detail?.subtarefas || [];
  const comentarios = detail?.comentarios || [];
  const historico = detail?.historico || [];
  const radarMovimentacoes = detail?.radarMovimentacoes || initial?.radarMovimentacoes || [];
  const proximaAtual = initial?.radarProximaAutomacao?.execucao || null;
  const proximasAutomacoes = Array.from(new Map([
    ...(detail?.proximas_automacoes || []),
    ...(proximaAtual ? [proximaAtual] : []),
  ].filter(Boolean).map((row) => [row.id, row])).values());
  return (
    <Shell eyebrow="OPERAÇÃO" titulo={initial ? "Editar tarefa" : "Nova tarefa"} onClose={onClose} ok={!!f.titulo} salvar={initial ? "Atualizar tarefa" : "Salvar tarefa"} onSave={salvar}>
      <Grid>
        <F l="TÍTULO DA TAREFA" full><input value={f.titulo} onChange={(e) => set("titulo", e.target.value)} style={campo} /></F>
        <F l="DESCRIÇÃO" full><textarea value={f.descricao || ""} onChange={(e) => set("descricao", e.target.value)} style={{ ...campo, minHeight: 78, resize: "vertical" }} /></F>
        <F l="CONTRATO">
          <select value={f.contratoId} onChange={(e) => set("contratoId", e.target.value)} style={campo}>
            <option value="">Sem vínculo</option>{db.contratos.map((c) => <option key={c.id} value={c.id}>{c.cliente}</option>)}
          </select>
        </F>
        <F l="PROCESSO">
          <select value={f.processoId || ""} onChange={(e) => {
            const p = db.processos.find((row) => row.id === e.target.value);
            setF((prev) => ({ ...prev, processoId: e.target.value, processoNumero: p?.numero || prev.processoNumero || "" }));
          }} style={campo}>
            <option value="">Sem processo</option>{db.processos.map((p) => <option key={p.id} value={p.id}>{p.numero} · {p.cliente || "sem cliente"}</option>)}
          </select>
        </F>
        <F l="RESPONSÁVEL"><input value={f.resp} onChange={(e) => set("resp", e.target.value)} style={campo} /></F>
        <F l="STATUS"><select value={f.status || "a_fazer"} onChange={(e) => set("status", e.target.value)} style={campo}>{statuses.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}</select></F>
        <F l="PRIORIDADE"><select value={f.prioridade || "normal"} onChange={(e) => set("prioridade", e.target.value)} style={campo}>{TAREFA_PRIORIDADE.map((p) => <option key={p} value={p}>{TAREFA_PRIORIDADE_LABEL[p]}</option>)}</select></F>
        <F l="DATA DE INÍCIO"><input type="date" value={f.dataInicio || ""} onChange={(e) => set("dataInicio", e.target.value)} style={campo} /></F>
        <F l="PRAZO"><input type="date" value={f.prazo || ""} onChange={(e) => set("prazo", e.target.value)} style={campo} /></F>
        <F l="Nº DO PROCESSO"><input value={f.processoNumero || ""} onChange={(e) => set("processoNumero", e.target.value)} style={{ ...campo, fontFamily: S.mono, fontSize: 12 }} /></F>
        <F l="ESFORÇO (MIN)"><input type="number" min="0" value={f.estimativaMinutos ?? ""} onChange={(e) => set("estimativaMinutos", e.target.value)} style={campo} /></F>
        <F l="TAGS" full><input value={Array.isArray(f.tags) ? f.tags.join(", ") : (f.tags || "")} onChange={(e) => set("tags", e.target.value)} placeholder="prazo, cliente, petição" style={campo} /></F>
        <F l="OBSERVAÇÕES" full><textarea value={f.obs || ""} onChange={(e) => set("obs", e.target.value)} style={{ ...campo, minHeight: 64, resize: "vertical" }} /></F>
      </Grid>
      {initial?.origem === "radar" && (initial?.radarRegraNome || initial?.movimentacaoDescricao || initial?.criadaAutomaticamente) && (
        <div style={{ border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.gold}`, padding: 11, marginTop: 12 }}>
          <Titulo t="ORIGEM RADAR PROCESSUAL" />
          <div style={{ fontSize: 11.5, color: C.inkSoft, display: "grid", gap: 4 }}>
            {initial.criadaAutomaticamente && <span>tarefa criada automaticamente após aprovação da automação</span>}
            {initial.radarRegraNome && <span>regra: <b style={{ color: C.ink }}>{initial.radarRegraNome}</b></span>}
            {initial.movimentacaoDataHora && <span>data da movimentação: {fmtData(String(initial.movimentacaoDataHora).slice(0, 10))}</span>}
            {initial.movimentacaoEvento && <span>evento: {initial.movimentacaoEvento}</span>}
            {initial.movimentacaoDescricao && <span>movimentação: {initial.movimentacaoDescricao}</span>}
          </div>
          {radarMovimentacoes.length > 1 && (
            <div style={{ marginTop: 9, display: "grid", gap: 5 }}>
              <Titulo t={`${radarMovimentacoes.length} MOVIMENTAÇÕES VINCULADAS`} />
              {radarMovimentacoes.slice(0, 6).map((mv) => (
                <div key={mv.id} style={{ background: C.paper, border: `1px solid ${C.line}`, padding: 7, fontSize: 11.2, color: C.ink }}>
                  <span style={{ fontFamily: S.mono, color: C.inkSoft }}>{String(mv.data_hora || mv.dataHora || mv.criado_em || "").slice(0, 10) || "sem data"}</span> · {mv.descricao || mv.resumo || "Movimentação sem descrição"}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {!!proximasAutomacoes.length && (
        <div style={{ border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.green}`, padding: 11, marginTop: 12 }}>
          <Titulo t="PRÓXIMA ETAPA" />
          <div style={{ display: "grid", gap: 7 }}>
            {proximasAutomacoes.map((auto) => (
              <div key={auto.id} style={{ fontSize: 11.5, color: C.inkSoft, display: "grid", gap: 3 }}>
                <span><b style={{ color: C.ink }}>{auto.payload_tarefa_sugerida?.titulo || auto.tarefa_titulo || "Tarefa sugerida"}</b></span>
                <span>regra: {auto.regra_nome || auto.regraNome || "sem regra"} · {AUTO_ROTULO[auto.status] || auto.status}</span>
                {auto.tarefa_titulo && <span>tarefa criada: {auto.tarefa_titulo}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {initial?.id && (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <div style={{ border: `1px solid ${C.line}`, padding: 11 }}>
            <Titulo t={`CHECKLIST ${checklist.filter((i) => i.concluido).length}/${checklist.length}`} />
            {checklist.map((item) => (
              <label key={item.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, padding: "6px 0", borderBottom: `1px solid ${C.line}` }}>
                <input type="checkbox" checked={!!item.concluido} onChange={() => runAction(mut.atualizarChecklistTarefa(item.id, { concluido: !item.concluido }).then(atualizarDetalhe), "Checklist atualizado.")} />
                <span style={{ flex: 1, textDecoration: item.concluido ? "line-through" : "none" }}>{item.titulo}</span>
                <button onClick={() => runAction(mut.removerChecklistTarefa(item.id).then(atualizarDetalhe), "Item removido.")} style={linkBtn}>remover</button>
              </label>
            ))}
            <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
              <input aria-label="Novo item de checklist" value={novoChecklist} onChange={(e) => setNovoChecklist(e.target.value)} placeholder="Novo item" style={campo} />
              <button disabled={!novoChecklist.trim()} onClick={() => runAction(mut.criarChecklistTarefa(initial.id, { titulo: novoChecklist }).then(() => { setNovoChecklist(""); atualizarDetalhe(); }), "Item criado.")} className="btn" style={btnSolid}>Adicionar</button>
            </div>
          </div>
          <div style={{ border: `1px solid ${C.line}`, padding: 11 }}>
            <Titulo t={`SUBTAREFAS ${subtarefas.filter((i) => i.status === "concluida").length}/${subtarefas.length}`} />
            {subtarefas.map((sub) => (
              <div key={sub.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, padding: "6px 0", borderBottom: `1px solid ${C.line}` }}>
                <input aria-label={sub.status === "concluida" ? `Reabrir subtarefa ${sub.titulo}` : `Concluir subtarefa ${sub.titulo}`} type="checkbox" checked={sub.status === "concluida"} onChange={() => runAction(mut.atualizarSubtarefa(sub.id, { status: sub.status === "concluida" ? "a_fazer" : "concluida" }).then(atualizarDetalhe), "Subtarefa atualizada.")} />
                <span style={{ flex: 1 }}>{sub.titulo}</span>
                <Tag c={TAREFA_PRIORIDADE_COR[sub.prioridade] || C.navy}>{TAREFA_PRIORIDADE_LABEL[sub.prioridade] || "Normal"}</Tag>
                <button onClick={() => runAction(mut.removerSubtarefa(sub.id).then(atualizarDetalhe), "Subtarefa removida.")} style={linkBtn}>remover</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
              <input aria-label="Nova subtarefa" value={novaSub} onChange={(e) => setNovaSub(e.target.value)} placeholder="Nova subtarefa" style={campo} />
              <button disabled={!novaSub.trim()} onClick={() => runAction(mut.criarSubtarefa(initial.id, { titulo: novaSub, prioridade: "normal" }).then(() => { setNovaSub(""); atualizarDetalhe(); }), "Subtarefa criada.")} className="btn" style={btnSolid}>Adicionar</button>
            </div>
          </div>
          <div style={{ border: `1px solid ${C.line}`, padding: 11 }}>
            <Titulo t="COMENTÁRIOS" />
            {comentarios.map((c) => <div key={c.id} style={{ fontSize: 12, borderBottom: `1px solid ${C.line}`, padding: "7px 0" }}><div>{c.conteudo}</div><div style={{ fontSize: 10.5, color: C.inkSoft }}>{c.criado_em ? new Date(c.criado_em).toLocaleString("pt-BR") : ""}</div></div>)}
            <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
              <input aria-label="Novo comentário" value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)} placeholder="Novo comentário" style={campo} />
              <button disabled={!novoComentario.trim()} onClick={() => runAction(mut.comentarTarefa(initial.id, novoComentario).then(() => { setNovoComentario(""); atualizarDetalhe(); }), "Comentário salvo.")} className="btn" style={btnSolid}>Comentar</button>
            </div>
          </div>
          <div style={{ border: `1px solid ${C.line}`, padding: 11 }}>
            <Titulo t="HISTÓRICO" />
            {!historico.length ? <Vazio t="Histórico será gerado nas próximas ações." /> : historico.slice(0, 8).map((h) => (
              <div key={h.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11.5, padding: "5px 0", borderBottom: `1px solid ${C.line}` }}>
                <span>{h.evento}</span><span style={{ fontFamily: S.mono, color: C.inkSoft }}>{h.criado_em ? new Date(h.criado_em).toLocaleString("pt-BR") : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}

function MAprovarAutomacao({ automacao, onClose, onSave }) {
  const sugestao = automacao?.sugestao || {};
  const [f, setF] = useState({
    titulo: sugestao.titulo || "Tarefa sugerida pelo Radar Processual",
    descricao: sugestao.descricao || "",
    prazo: sugestao.prazo || "",
    prioridade: sugestao.prioridade || "alta",
    responsavel: sugestao.responsavel || "",
  });
  if (!automacao) return null;
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const ok = f.titulo.trim() && f.descricao.trim();
  return (
    <Shell
      eyebrow="RADAR PROCESSUAL"
      titulo="Aprovar tarefa sugerida"
      onClose={onClose}
      ok={ok}
      salvar="Criar tarefa"
      onSave={() => { onSave({ ...f, titulo: f.titulo.trim(), descricao: f.descricao.trim() }); onClose(); }}
    >
      <Grid>
        <F l="PROCESSO" full><input value={automacao.numero || ""} readOnly style={{ ...campo, fontFamily: S.mono, fontSize: 12, background: C.paper }} /></F>
        <F l="REGRA" full><input value={automacao.regraNome || ""} readOnly style={{ ...campo, background: C.paper }} /></F>
        <F l="TÍTULO DA TAREFA" full><input value={f.titulo} onChange={(e) => set("titulo", e.target.value)} style={campo} /></F>
        <F l="DESCRIÇÃO" full><textarea value={f.descricao} onChange={(e) => set("descricao", e.target.value)} style={{ ...campo, minHeight: 96, resize: "vertical" }} /></F>
        <F l="PRAZO"><input type="date" value={f.prazo || ""} onChange={(e) => set("prazo", e.target.value)} style={campo} /></F>
        <F l="PRIORIDADE"><select value={f.prioridade} onChange={(e) => set("prioridade", e.target.value)} style={campo}>{TAREFA_PRIORIDADE.map((p) => <option key={p} value={p}>{TAREFA_PRIORIDADE_LABEL[p]}</option>)}</select></F>
        <F l="RESPONSÁVEL" full><input value={f.responsavel || ""} onChange={(e) => set("responsavel", e.target.value)} style={campo} /></F>
      </Grid>
      <Nota>Esta aprovação cria uma tarefa no Kanban vinculada ao processo, à movimentação e à regra. A regra técnica não substitui revisão jurídica.</Nota>
    </Shell>
  );
}

function MIgnorarAutomacao({ automacao, onClose, onSave }) {
  const [motivo, setMotivo] = useState("");
  if (!automacao) return null;
  return (
    <Shell
      eyebrow="RADAR PROCESSUAL"
      titulo="Ignorar sugestão"
      onClose={onClose}
      ok={motivo.trim().length >= 3}
      salvar="Ignorar sugestão"
      onSave={() => { onSave(motivo.trim()); onClose(); }}
    >
      <Grid>
        <F l="PROCESSO" full><input value={automacao.numero || ""} readOnly style={{ ...campo, fontFamily: S.mono, fontSize: 12, background: C.paper }} /></F>
        <F l="REGRA" full><input value={automacao.regraNome || ""} readOnly style={{ ...campo, background: C.paper }} /></F>
        <F l="MOTIVO" full><textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ ...campo, minHeight: 86, resize: "vertical" }} /></F>
      </Grid>
      <Nota>Ignorar não apaga a movimentação nem o processo. Apenas registra que esta sugestão não deve criar tarefa.</Nota>
    </Shell>
  );
}

const TRIBUNAIS_OPC = ["TJSP", "TJCE", "TJBA"];
const FASES_OPC = ["Petição inicial", "Citação", "Contestação", "Réplica", "Saneamento", "Instrução", "Sentença", "Recurso", "Cumprimento de sentença", "Execução"];
function MProcesso({ db, initial, onClose, onSave }) {
  const [f, setF] = useState(initial || {
    areaPasta: "", numeroInterno: "", numero: "", contratoId: "", cliente: "", tribunal: "TJSP",
    statusProcesso: "", autor: "", reu: "", comarca: "", assunto: "", andamentoAtual: "",
    fase: "Petição inicial", ativo: true, ultimoAndamento: HOJE, monitorar: true,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const ok = f.numero && f.tribunal;
  const vincular = (cid) => {
    const c = db.contratos.find((x) => x.id === cid);
    setF((s) => ({ ...s, contratoId: cid, cliente: c ? c.cliente : s.cliente, numero: c?.processo && c.processo !== "0000000-00.0000.8.26.0000" ? c.processo : s.numero }));
  };
  return (
    <Shell eyebrow="RADAR PROCESSUAL" titulo={initial ? "Editar processo" : "Adicionar processo ao radar"} onClose={onClose} ok={ok} salvar={initial ? "Atualizar processo" : "Adicionar ao radar"}
      onSave={() => { onSave({ ...f }); onClose(); }}>
      <Grid>
        <F l="ÁREA / PASTA"><input value={f.areaPasta || ""} onChange={(e) => set("areaPasta", e.target.value)} style={campo} /></F>
        <F l="Nº INTERNO"><input value={f.numeroInterno || ""} onChange={(e) => set("numeroInterno", e.target.value)} style={{ ...campo, fontFamily: S.mono, fontSize: 12 }} /></F>
        <F l="VINCULAR A UM CONTRATO" full>
          <select value={f.contratoId} onChange={(e) => vincular(e.target.value)} style={campo}>
            <option value="">Sem contrato (processo avulso)</option>
            {db.contratos.map((c) => <option key={c.id} value={c.id}>{c.cliente}</option>)}
          </select>
        </F>
        <F l="PROCESSO (Nº CNJ)" full><input value={f.numero} onChange={(e) => set("numero", e.target.value)} placeholder="0000000-00.0000.8.26.0000" style={{ ...campo, fontFamily: S.mono, fontSize: 12 }} /></F>
        <F l="TRIBUNAL"><select value={f.tribunal} onChange={(e) => set("tribunal", e.target.value)} style={campo}>{TRIBUNAIS_OPC.map((t) => <option key={t}>{t}</option>)}</select></F>
        <F l="STATUS"><input value={f.statusProcesso || ""} onChange={(e) => set("statusProcesso", e.target.value)} placeholder="Ex.: ativo, suspenso, encerrado" style={campo} /></F>
        <F l="AUTOR"><input value={f.autor || ""} onChange={(e) => set("autor", e.target.value)} style={campo} /></F>
        <F l="RÉU"><input value={f.reu || ""} onChange={(e) => set("reu", e.target.value)} style={campo} /></F>
        <F l="VARA / JUÍZO" full><input value={f.comarca} onChange={(e) => set("comarca", e.target.value)} style={campo} /></F>
        <F l="ASSUNTO" full><input value={f.assunto || ""} onChange={(e) => set("assunto", e.target.value)} style={campo} /></F>
        <F l="ANDAMENTO ATUAL" full><textarea value={f.andamentoAtual || ""} onChange={(e) => set("andamentoAtual", e.target.value)} style={{ ...campo, minHeight: 72, resize: "vertical" }} /></F>
        <F l="CLIENTE / VÍNCULO" full><input value={f.cliente} onChange={(e) => set("cliente", e.target.value)} placeholder="Opcional; pode vir do contrato vinculado" style={campo} /></F>
        <F l="FASE ATUAL"><select value={f.fase} onChange={(e) => set("fase", e.target.value)} style={campo}>{FASES_OPC.map((x) => <option key={x}>{x}</option>)}</select></F>
        <F l="ÚLTIMO ANDAMENTO CONHECIDO"><input type="date" value={f.ultimoAndamento} onChange={(e) => set("ultimoAndamento", e.target.value)} style={campo} /></F>
      </Grid>
      <Nota>Os campos da antiga planilha ficam no cadastro do processo. O radar usa o <b>Processo (Nº CNJ)</b>, o <b>Tribunal</b> e a base de movimentações salvas para monitorar novas atualizações.</Nota>
    </Shell>
  );
}

function MSenhaProcesso({ processo, onClose, onSave }) {
  const [senha, setSenha] = useState("");
  if (!processo) return null;
  return (
    <Shell
      eyebrow="SEGREDO DO PROCESSO"
      titulo="Cadastrar senha processual"
      onClose={onClose}
      ok={senha.trim().length > 0}
      salvar="Salvar senha"
      onSave={() => { onSave(senha); onClose(); }}
    >
      <Grid>
        <F l="PROCESSO" full><input value={processo.numero || ""} readOnly style={{ ...campo, fontFamily: S.mono, fontSize: 12, background: C.paper }} /></F>
        <F l="CLIENTE" full><input value={processo.cliente || ""} readOnly style={{ ...campo, background: C.paper }} /></F>
        <F l="SENHA DO PROCESSO" full>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" style={campo} />
        </F>
      </Grid>
      <Nota>
        A senha fica armazenada no cofre privado do banco e será usada somente pelo executor do radar na próxima rodada. O valor não volta para a tela.
      </Nota>
    </Shell>
  );
}

function MFechar({ contrato, onClose, onSave }) {
  const [n, setN] = useState(contrato?.tipoHonorario === "Fixo único" ? 1 : 4);
  if (!contrato) return null;
  return (
    <Shell eyebrow="PROPOSTA → CONTRATO" titulo={`Fechar ${contrato.cliente}`} onClose={onClose} ok salvar="Registrar fechamento" onSave={() => onSave(Number(n))}>
      {contrato.fixoTotal > 0 ? (<>
        <Grid><F l="PARCELAS DO FIXO" full><input type="number" min="1" max="24" value={n} onChange={(e) => setN(e.target.value)} style={{ ...campo, fontFamily: S.mono, fontWeight: 600 }} /></F></Grid>
        <Nota>{n} parcelas de <b>{brl2(contrato.fixoTotal / (n || 1))}</b>, a partir de {rotMes(MES_ATUAL)}. Entram no <b>a receber</b> na hora — e cada confirmação vira uma entrada.</Nota>
      </>) : <Nota>Contrato sem honorário fixo. Nenhuma parcela será gerada — as de êxito você cadastra quando o valor se definir.</Nota>}
    </Shell>
  );
}

/* ══════════  ÁTOMOS  ══════════ */
const btnSolid = { background: C.navy, color: "#fff", border: "none", padding: "8px 15px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: S.body, borderRadius: 2 };
const btnGhost = { background: "#fff", color: C.ink, border: `1px solid ${C.line}`, padding: "8px 13px", fontSize: 12, cursor: "pointer", fontFamily: S.body, borderRadius: 2 };
const btnGold = { background: C.gold, color: "#fff", border: "none", padding: "8px 13px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: S.body, borderRadius: 2 };
const linkBtn = { background: "none", border: "none", color: C.navy, fontSize: 11, cursor: "pointer", fontFamily: S.body, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2, padding: 0 };
const campo = { width: "100%", padding: "8px 10px", border: `1px solid ${C.line}`, fontSize: 12.5, fontFamily: S.body, borderRadius: 2, background: "#fff", color: C.ink };
const tbl = { width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginTop: 8 };
const th = { padding: "7px 8px", fontSize: 8.5, letterSpacing: ".11em", color: C.inkSoft, fontWeight: 600 };
const td = { padding: "8px 8px" };
const thL = { textAlign: "left", padding: "0 4px 4px", fontWeight: 600 };
const thR = { textAlign: "right", padding: "0 4px 4px", fontWeight: 600 };
const tdL = { padding: "5px 4px", color: C.inkSoft };
const tdR = { padding: "5px 4px", textAlign: "right", fontFamily: S.mono };
const linhaFlex = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.line}` };
const tipStyle = { fontFamily: S.body, fontSize: 12, borderRadius: 2, border: `1px solid ${C.line}` };
const chip = (on) => ({ padding: "5px 11px", fontSize: 11, cursor: "pointer", borderRadius: 2, fontFamily: S.body, border: `1px solid ${on ? C.navy : C.line}`, background: on ? C.navy : "#fff", color: on ? "#fff" : C.inkSoft });

const Grid = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>;
const F = ({ l, full, children }) => {
  const generatedId = React.useId();
  const childId = React.isValidElement(children) ? (children.props.id || `field-${generatedId}`) : undefined;
  const control = React.isValidElement(children)
    ? React.cloneElement(children, {
      id: childId,
      "aria-label": children.props["aria-label"] || l,
    })
    : children;
  return (
    <div style={full ? { gridColumn: "1 / -1" } : {}}>
      <label htmlFor={childId} style={{ fontSize: 8.5, letterSpacing: ".1em", color: C.inkSoft, fontWeight: 600, display: "block", marginBottom: 4 }}>{l}</label>
      {control}
    </div>
  );
};
const Nota = ({ children }) => <div style={{ background: C.paper, borderLeft: `2px solid ${C.gold}`, padding: "9px 11px", marginTop: 12, fontSize: 11, color: C.inkSoft, lineHeight: 1.6 }}>{children}</div>;
const Faixa = ({ n }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9, flex: 1 }}>
    <span style={{ fontSize: 8.5, letterSpacing: ".18em", color: C.inkSoft, fontWeight: 600, whiteSpace: "nowrap" }}>{n.toUpperCase()}</span>
    <div style={{ flex: 1, height: 1, background: C.line }} />
  </div>
);
const KPI = ({ r, v, n, c, d }) => (
  <div className="card" style={{ background: "#fff", borderStyle: "solid", borderWidth: "2.5px 1px 1px", borderColor: `${c} ${d ? c : C.line} ${d ? c : C.line}`, padding: "12px 14px" }}>
    <div style={{ fontSize: 9, letterSpacing: ".1em", color: C.inkSoft, fontWeight: 600 }}>{r.toUpperCase()}</div>
    <div style={{ fontFamily: S.display, fontSize: 23, fontWeight: 700, margin: "4px 0 2px", color: c }}>{v}</div>
    <div style={{ fontSize: 10, color: C.inkSoft }}>{n}</div>
  </div>
);
const Card = ({ t, s, a, children }) => (
  <div className="card" style={{ background: "#fff", border: `1px solid ${C.line}`, padding: "14px 16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
      <div>
        {t && <div style={{ fontFamily: S.display, fontSize: 15.5, fontWeight: 700 }}>{t}</div>}
        {s && <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>{s}</div>}
      </div>
      {a && <button onClick={a.f} style={linkBtn}>{a.t}</button>}
    </div>
    {children}
  </div>
);
const Cel = ({ l, v, calc, c = C.ink }) => (
  <div style={{ background: calc ? C.calcBg : "#fff", padding: "8px 10px" }}>
    <div style={{ fontSize: 8, letterSpacing: ".08em", color: C.inkSoft, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
      {calc && <span style={{ fontSize: 7.5 }}>🔒</span>}{l.toUpperCase()}
    </div>
    <div style={{ fontFamily: S.mono, fontSize: 12.5, fontWeight: 600, color: c, marginTop: 2 }}>{v}</div>
  </div>
);
const Tag = ({ c, children }) => (
  <span style={{ fontSize: 8.5, letterSpacing: ".05em", fontWeight: 600, color: c, border: `1px solid ${c}45`, padding: "2px 5px", borderRadius: 2, whiteSpace: "nowrap" }}>
    {String(children).toUpperCase()}
  </span>
);
const Mini = ({ n, l, c = C.navy }) => (
  <div style={{ background: C.paper, padding: "7px 4px" }}>
    <div style={{ fontFamily: S.display, fontSize: 19, fontWeight: 700, color: c }}>{n}</div>
    <div style={{ fontSize: 9, color: C.inkSoft, lineHeight: 1.3 }}>{l}</div>
  </div>
);
const Linha = ({ l, v, forte, topo }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0",
    borderTop: topo ? `1.5px solid ${C.navy}` : "none", borderBottom: forte ? "none" : `1px solid ${C.line}`,
    fontWeight: forte ? 600 : 400, fontSize: forte ? 13 : 12 }}>
    <span>{l}</span><span style={{ fontFamily: S.mono, fontWeight: 600 }}>{v}</span>
  </div>
);
const Titulo = ({ t }) => (
  <div style={{ fontSize: 8.5, letterSpacing: ".16em", color: C.gold, fontWeight: 700, paddingBottom: 5, borderBottom: `1.5px solid ${C.navy}`, marginBottom: 3 }}>{t}</div>
);
const Rodape = ({ children }) => <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 11, paddingTop: 8, fontSize: 10.5, color: C.inkSoft, lineHeight: 1.6 }}>{children}</div>;
const Vazio = ({ t }) => <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: C.inkSoft }}>{t}</div>;
