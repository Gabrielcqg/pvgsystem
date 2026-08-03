import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../App";
import * as A from "./adapters";

const isoLocalDate = (value = new Date()) => {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const HOJE = isoLocalDate();
const ANO = Number(HOJE.slice(0, 4));
const MES_ATUAL = HOJE.slice(0, 7);
const VAZIO = {
  parceiros: [], contratos: [], parcelas: [], lancamentos: [], custosFixos: [], tarefas: [],
  tarefaStatuses: [], tarefaContadores: {},
  processos: [], radarRun: null, radarMovs: [], radarMovsPendentes: [], radarHistorico: [], radarInerciaTasks: [], radarAutomacoes: [], configuracoes: [], auditoria: [],
  radarCounts: {},
  radarSync: { syncing: false, lastSyncAt: "", error: "" },
  indicadores: A.toIndicadores(),
  params: { caixaInicial: 0, metaCaixa: 0, metaRecorrencia: 0, recorrenciaAtual: 0 },
};
const DEFAULT_TAREFA_STATUSES = Object.entries(A.TAREFA_STATUS).map(([slug, label], index) => ({
  slug,
  label,
  ordem: (index + 1) * 10,
  grupo: slug === "concluida" ? "terminal" : slug === "bloqueada" || slug === "aguardando" ? "bloqueio" : "execucao",
  cor: "",
  terminal: slug === "concluida",
}));
const CACHE_PREFIX = "pavageau:real-db:v2:";
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const CACHE_SLICES = [
  "parceiros", "contratos", "parcelas", "lancamentos", "custosFixos",
  "tarefas", "tarefaStatuses", "tarefaContadores", "processos",
  "radarRun", "radarMovs", "radarMovsPendentes", "radarHistorico", "radarInerciaTasks", "radarAutomacoes", "radarCounts", "radarSync", "configuracoes", "auditoria", "indicadores", "params",
];

const hasCoreData = (value) => (
  ["contratos", "parcelas", "lancamentos", "custosFixos", "tarefas", "processos"]
    .some((key) => Array.isArray(value?.[key]) && value[key].length > 0)
);

const readDbCache = (key) => {
  if (!key || typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
    if (!parsed?.cachedAt || Date.now() - parsed.cachedAt > CACHE_MAX_AGE_MS) return null;
    const next = {};
    CACHE_SLICES.forEach((slice) => {
      if (Object.prototype.hasOwnProperty.call(parsed, slice)) next[slice] = parsed[slice];
    });
    return hasCoreData(next) ? next : null;
  } catch {
    return null;
  }
};

const writeDbCache = (key, value) => {
  if (!key || typeof window === "undefined" || !hasCoreData(value)) return;
  try {
    const payload = { cachedAt: Date.now() };
    CACHE_SLICES.forEach((slice) => { payload[slice] = value[slice]; });
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // localStorage can be unavailable or full; the live API path remains authoritative.
  }
};

const mergeTasksKeepingArchived = (current, freshActive) => {
  const freshIds = new Set((freshActive || []).map((row) => row.id));
  return [
    ...(freshActive || []),
    ...(current || []).filter((row) => row.archivedAt && !freshIds.has(row.id)),
  ];
};

// Optional reads, used only where "no data yet" is a valid backend state.
const safe = async (fn, fallback) => {
  try { const r = await fn(); return r ?? fallback; } catch { return fallback; }
};

const dateOfMonth = (value) => {
  if (!value) return value;
  const raw = String(value);
  return /^\d{4}-\d{2}$/.test(raw) ? `${raw}-01` : raw;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tempId = () => `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const byId = (id) => (row) => row.id === id;
const replaceRow = (rows, id, next) => rows.map((row) => (row.id === id ? next : row));
const mapRadarMovCollections = (state, mapper) => ({
  radarMovs: (state.radarMovs || []).map(mapper),
  radarMovsPendentes: (state.radarMovsPendentes || []).map(mapper),
});
const filterRadarMovCollections = (state, predicate) => ({
  radarMovs: (state.radarMovs || []).filter(predicate),
  radarMovsPendentes: (state.radarMovsPendentes || []).filter(predicate),
});
const mergeById = (current, incoming) => {
  const seen = new Set();
  const byIncoming = new Map((incoming || []).map((row) => [row.id, row]));
  const merged = (current || []).map((row) => {
    const next = byIncoming.get(row.id);
    if (!next) return row;
    seen.add(row.id);
    return { ...row, ...next };
  });
  (incoming || []).forEach((row) => {
    if (!seen.has(row.id)) merged.push(row);
  });
  return merged;
};
const upsertReplacingTemp = (rows, tempIdValue, next) => {
  let replaced = false;
  const withoutActual = rows.filter((row) => row.id !== next.id);
  const mapped = withoutActual.map((row) => {
    if (row.id !== tempIdValue) return row;
    replaced = true;
    return next;
  });
  return replaced ? mapped : [next, ...mapped.filter((row) => row.id !== tempIdValue)];
};
const taskStatusLabel = (status, fallback = "") => A.TAREFA_STATUS?.[status] || fallback || status;
const numValue = (value) => Number(value || 0);
const radarCountsFromProgress = (progress = {}) => {
  const exec = progress.execucao || {};
  const statusCounts = progress.status_counts || {};
  return {
    base_inicial: numValue(exec.total_base_inicial_criada ?? statusCounts.base_inicial_criada),
    movimentou: numValue(exec.total_com_movimentacao_nova),
    sem_novidade: numValue(exec.total_sem_movimentacao ?? statusCounts.sucesso),
    parado: numValue(progress.parados_total),
    senha: numValue(exec.total_senha_necessaria ?? statusCounts.senha_necessaria),
    nao_localizado: numValue(exec.total_nao_localizado ?? statusCounts.nao_localizado),
    nao_verificado: numValue(exec.total_erro)
      + numValue(exec.total_timeout)
      + numValue(exec.total_captcha_timeout)
      + numValue(exec.total_pagina_intermediaria)
      + numValue(exec.total_numero_invalido),
    pendente: numValue(exec.total_pendente_implementacao ?? statusCounts.pendente_implementacao),
    pendencias_analise: numValue(progress.movimentacoes_pendentes_total),
    processos_com_pendencias: numValue(progress.processos_com_pendencias_total),
    movimentacoes_total: numValue(progress.movimentacoes_novas_total),
    automacoes_pendentes: numValue(progress.automacoes_pendentes_total),
    tarefas_inercia: numValue(progress.tarefas_inercia_total),
  };
};
const uiLancamento = (l, id, parcelaId = "") => ({
  id,
  data: l.data || "",
  descricao: l.descricao || "",
  tipo: l.tipo || "entrada",
  valor: Number(l.valor || 0),
  categoria: l.categoria || "",
  forma: l.forma || "",
  pago: l.pago !== false,
  contratoId: l.contratoId || "",
  obs: l.obs || "",
  origem: parcelaId ? "parcela" : "manual",
  origemId: parcelaId || "",
  pending: true,
});

export function useRealDb() {
  const { apiFetch, session } = useAuth();
  const [db, setDb] = useState(VAZIO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = session?.access_token;
  const cacheKey = useMemo(() => {
    const userId = session?.user?.id || session?.user?.email;
    return token && userId ? `${CACHE_PREFIX}${userId}` : "";
  }, [session?.user?.email, session?.user?.id, token]);
  const busy = useRef(false);
  const pendingLoad = useRef(false);
  const initialLoadKey = useRef("");
  const hydratedCacheKey = useRef("");
  const taskMutationStamp = useRef(0);
  const supplementalTimer = useRef(null);
  const refreshTimer = useRef(null);
  const taskRefreshTimer = useRef(null);

  const get = useCallback((path, query) => apiFetch(path, { query }), [apiFetch]);

  const applyRadarResumo = useCallback((resumo) => {
    const execucao = resumo?.execucao || null;
    const resultados = resumo?.resultados || [];
    const movimentacoesAtuais = resumo?.movimentacoes_novas || [];
    const movimentacoesPendentes = resumo?.movimentacoes_pendentes || [];
    const processos = (resumo?.processos || []).map(A.toProcesso);
    const configRadarDias = resumo?.configuracoes?.radar_inercia_dias;
    setDb((prev) => {
      const configuracoes = configRadarDias === undefined
        ? prev.configuracoes
        : [
            { chave: "radar_inercia_dias", valor: configRadarDias, descricao: "Dias para alerta de inércia processual" },
            ...(prev.configuracoes || []).filter((row) => row.chave !== "radar_inercia_dias"),
          ];
      const next = {
        ...prev,
        processos: processos.length ? mergeById(prev.processos, processos) : prev.processos,
        radarRun: A.toRadarRun(execucao, resultados) || null,
        radarMovs: movimentacoesAtuais.map(A.toRadarMov),
        radarMovsPendentes: movimentacoesPendentes.map(A.toRadarMov),
        radarHistorico: (resumo?.historico || []).map(A.toRadarHist),
        radarInerciaTasks: (resumo?.tarefas_inercia || []).map(A.toTarefa),
        radarAutomacoes: (resumo?.automacoes || []).map(A.toRadarAutomacao),
        configuracoes,
        radarCounts: {
          ...(prev.radarCounts || {}),
          ...radarCountsFromProgress({
            execucao,
            movimentacoes_novas_total: movimentacoesAtuais.length,
            movimentacoes_pendentes_total: resumo?.movimentacoes_pendentes_total ?? movimentacoesPendentes.length,
            processos_com_pendencias_total: resumo?.processos_com_pendencias_total,
            automacoes_pendentes_total: (resumo?.automacoes || []).filter((row) => row.status === "aguardando_aprovacao").length,
            tarefas_inercia_total: (resumo?.tarefas_inercia || []).length,
          }),
        },
        radarSync: { syncing: false, lastSyncAt: new Date().toISOString(), error: "" },
      };
      writeDbCache(cacheKey, next);
      return next;
    });
  }, [cacheKey]);

  const loadRadarLegacy = useCallback(async () => {
    const [ultima, movs, hist, inerciaTasks, automacoes] = await Promise.all([
      safe(() => get("/radar/ultima"), null),
      safe(() => get("/radar/movimentacoes-novas", { limit: 500 }), []),
      safe(() => get("/radar/execucoes", { limit: 10 }), []),
      safe(() => get("/tarefas", { origem: "radar_inercia", include_archived: "true", limit: 500 }), []),
      safe(() => get("/radar/automacoes", { limit: 200 }), []),
    ]);
    const resultados = ultima?.id
      ? (await safe(() => get(`/radar/execucoes/${ultima.id}`), {}))?.resultados || []
      : [];
    setDb((prev) => {
      const next = {
        ...prev,
        radarRun: A.toRadarRun(ultima, resultados) || null,
        radarMovs: (movs || []).map(A.toRadarMov),
        radarMovsPendentes: (movs || []).map(A.toRadarMov),
        radarHistorico: (hist || []).map(A.toRadarHist),
        radarInerciaTasks: (inerciaTasks || []).map(A.toTarefa),
        radarAutomacoes: (automacoes || []).map(A.toRadarAutomacao),
        radarSync: { syncing: false, lastSyncAt: new Date().toISOString(), error: "" },
      };
      writeDbCache(cacheKey, next);
      return next;
    });
  }, [cacheKey, get]);

  const applyRadarProgress = useCallback((progress) => {
    const execucao = progress?.execucao || null;
    const counts = radarCountsFromProgress(progress);
    const configRadarDias = progress?.radar_inercia_dias;
    setDb((prev) => {
      const previousRun = prev.radarRun || null;
      const progressRun = execucao ? A.toRadarRun(execucao, []) : null;
      const sameRun = progressRun?.id && previousRun?.id === progressRun.id;
      const previousResults = sameRun ? previousRun.resultados || [] : [];
      const configuracoes = configRadarDias === undefined
        ? prev.configuracoes
        : [
            { chave: "radar_inercia_dias", valor: configRadarDias, descricao: "Dias para alerta de inércia processual" },
            ...(prev.configuracoes || []).filter((row) => row.chave !== "radar_inercia_dias"),
          ];
      const next = {
        ...prev,
        radarRun: progressRun ? { ...progressRun, resultados: previousResults } : previousRun,
        radarCounts: { ...(prev.radarCounts || {}), ...counts },
        configuracoes,
        radarSync: { syncing: false, lastSyncAt: new Date().toISOString(), error: "" },
      };
      writeDbCache(cacheKey, next);
      return next;
    });
    return { execucao, counts };
  }, [cacheKey]);

  const loadRadarProgress = useCallback(async (opts = {}) => {
    const { silent = true } = opts;
    if (!silent) {
      setDb((prev) => ({ ...prev, radarSync: { ...(prev.radarSync || {}), syncing: true, error: "" } }));
    }
    try {
      const progress = await get("/radar/progresso");
      return applyRadarProgress(progress);
    } catch (error) {
      if (error?.status === 404 || error?.code === "endpoint_not_found") {
        const ultima = await get("/radar/ultima");
        return applyRadarProgress({ execucao: ultima || null });
      }
      setDb((prev) => ({ ...prev, radarSync: { ...(prev.radarSync || {}), syncing: false, error: error?.message || "Não foi possível atualizar o Radar." } }));
      throw error;
    }
  }, [applyRadarProgress, get]);

  // Radar-only refresh: one compact endpoint for live counters. The fallback is
  // kept for older deployments while the Oracle API rolls forward.
  const loadRadar = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    if (!silent) {
      setDb((prev) => ({ ...prev, radarSync: { ...(prev.radarSync || {}), syncing: true, error: "" } }));
    }
    try {
      const resumo = await get("/radar/resumo", {
        historico_limit: 10,
        movimentacoes_limit: 200,
        automacoes_limit: 100,
      });
      applyRadarResumo(resumo);
    } catch (error) {
      if (error?.status === 404 || error?.code === "endpoint_not_found") {
        await loadRadarLegacy();
        return;
      }
      setDb((prev) => ({ ...prev, radarSync: { ...(prev.radarSync || {}), syncing: false, error: error?.message || "Não foi possível atualizar o Radar." } }));
      throw error;
    }
  }, [applyRadarResumo, get, loadRadarLegacy]);

  const loadConfigAudit = useCallback(async () => {
    const [configuracoes, auditoria] = await Promise.all([
      safe(() => get("/configuracoes", { limit: 500 }), []),
      safe(() => get("/auditoria", { limit: 100 }), []),
    ]);
    setDb((prev) => {
      const next = {
        ...prev,
        configuracoes: (configuracoes || []).map(A.toConfiguracao),
        auditoria: (auditoria || []).map(A.toAuditoria),
      };
      writeDbCache(cacheKey, next);
      return next;
    });
  }, [cacheKey, get]);

  const loadSupplemental = useCallback(async () => {
    await Promise.all([loadRadar(), loadConfigAudit()]);
  }, [loadRadar, loadConfigAudit]);

  const loadTasks = useCallback(async () => {
    const stamp = taskMutationStamp.current;
    const [tarefas, statuses, contadores] = await Promise.all([
      safe(() => get("/tarefas", { limit: 500, include_archived: true }), []),
      safe(() => get("/tarefas/statuses"), DEFAULT_TAREFA_STATUSES),
      safe(() => get("/tarefas/contadores"), {}),
    ]);
    if (stamp !== taskMutationStamp.current) return;
    setDb((prev) => {
      const next = {
        ...prev,
        tarefas: (tarefas || []).map(A.toTarefa),
        tarefaStatuses: (statuses || DEFAULT_TAREFA_STATUSES).map(A.toTarefaStatus),
        tarefaContadores: contadores || {},
      };
      writeDbCache(cacheKey, next);
      return next;
    });
  }, [cacheKey, get]);

  const scheduleSupplementalLoad = useCallback(() => {
    if (supplementalTimer.current) clearTimeout(supplementalTimer.current);
    supplementalTimer.current = setTimeout(() => {
      supplementalTimer.current = null;
      void loadSupplemental();
    }, 1800);
  }, [loadSupplemental]);

  const scheduleTasksLoad = useCallback((delay = 400) => {
    if (taskRefreshTimer.current) clearTimeout(taskRefreshTimer.current);
    taskRefreshTimer.current = setTimeout(() => {
      taskRefreshTimer.current = null;
      void loadTasks();
    }, delay);
  }, [loadTasks]);

  const load = useCallback(async (opts = {}) => {
    const { supplemental = true } = opts;
    if (!token) {
      setLoading(false);
      return;
    }
    if (busy.current) {
      pendingLoad.current = true;
      return;
    }
    busy.current = true; setError(null);
    try {
      const payload = await get("/bootstrap", { ano: ANO, mes: Number(MES_ATUAL.slice(5, 7)) });
      const contratos = (payload?.contratos || []).map(A.toContrato);
      const parcelas = (payload?.parcelas || []).map(A.toParcela);
      const tarefas = (payload?.tarefas || []).map(A.toTarefa);

      setDb((prev) => {
        const next = {
          ...prev,
          parceiros: (payload?.parceiros || []).map(A.toParceiro),
          contratos,
          parcelas,
          lancamentos: (payload?.lancamentos || []).map(A.toLancamento),
          custosFixos: (payload?.custos_fixos || payload?.custosFixos || []).map(A.toCustoFixo),
          tarefas: mergeTasksKeepingArchived(prev.tarefas, tarefas),
          tarefaStatuses: prev.tarefaStatuses?.length ? prev.tarefaStatuses : DEFAULT_TAREFA_STATUSES.map(A.toTarefaStatus),
          tarefaContadores: prev.tarefaContadores || {},
          processos: (payload?.processos || []).map(A.toProcesso),
          indicadores: A.toIndicadores(payload?.indicadores),
          params: A.toParams(payload?.parametros),
        };
        writeDbCache(cacheKey, next);
        return next;
      });
      // Only the initial/full load pulls the heavy supplemental data (radar,
      // configurações, auditoria). Post-mutation reconciles skip it so a save
      // never drags the 404-prone radar calls into its critical path.
      if (supplemental) {
        scheduleTasksLoad(250);
        scheduleSupplementalLoad();
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false); busy.current = false;
      if (pendingLoad.current) {
        pendingLoad.current = false;
        void load({ supplemental });
      }
    }
  }, [cacheKey, get, scheduleSupplementalLoad, scheduleTasksLoad, token]);

  useEffect(() => {
    if (!cacheKey || hydratedCacheKey.current === cacheKey) return;
    hydratedCacheKey.current = cacheKey;
    const cached = readDbCache(cacheKey);
    if (!cached) return;
    setDb((prev) => ({
      ...prev,
      ...cached,
      tarefaStatuses: cached.tarefaStatuses?.length ? cached.tarefaStatuses : prev.tarefaStatuses,
      params: { ...prev.params, ...(cached.params || {}) },
    }));
    setLoading(false);
  }, [cacheKey]);

  useEffect(() => {
    if (!token) {
      initialLoadKey.current = "";
      void load();
      return;
    }
    const key = cacheKey || token;
    if (initialLoadKey.current === key) return;
    initialLoadKey.current = key;
    void load();
  }, [cacheKey, load, token]);
  useEffect(() => () => {
    if (supplementalTimer.current) clearTimeout(supplementalTimer.current);
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    if (taskRefreshTimer.current) clearTimeout(taskRefreshTimer.current);
  }, []);

  const post = useCallback((path, body) => apiFetch(path, { method: "POST", body }), [apiFetch]);
  const patch = useCallback((path, body) => apiFetch(path, { method: "PATCH", body }), [apiFetch]);
  const del = useCallback((path, query) => apiFetch(path, { method: "DELETE", query }), [apiFetch]);
  const put = useCallback((path, body) => apiFetch(path, { method: "PUT", body }), [apiFetch]);
  const refreshSoon = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      void load({ supplemental: false });
    }, 1200);
  }, [load]);
  const refreshTasksSoon = useCallback(() => scheduleTasksLoad(250), [scheduleTasksLoad]);
  const after = async (p) => {
    await p;
    pendingLoad.current = true;
    for (let i = 0; i < 400 && busy.current; i += 1) {
      await sleep(25);
    }
    pendingLoad.current = false;
    await load();
  };

  // mutations matching the reference's signatures, wired to the real API + refetch
  const mut = useMemo(() => ({
    receberParcela: (parcelaId, mesEfetivo) =>
      (async () => {
        let previous = null;
        const optimisticId = tempId();
        setDb((prev) => {
          previous = prev;
          const parcela = prev.parcelas.find(byId(parcelaId));
          const contrato = parcela ? prev.contratos.find(byId(parcela.contratoId)) : null;
          return {
            ...prev,
            parcelas: prev.parcelas.map((p) => (p.id === parcelaId ? { ...p, recebido: true, mesEfetivo } : p)),
            lancamentos: parcela
              ? [
                  uiLancamento({
                    data: `${dateOfMonth(mesEfetivo).slice(0, 7)}-01`,
                    descricao: `Parcela ${parcela.tipo} - ${contrato?.cliente || ""}`,
                    tipo: "entrada",
                    valor: parcela.valor,
                    categoria: "Honorários",
                    contratoId: parcela.contratoId,
                    forma: "",
                    pago: true,
                  }, optimisticId, parcelaId),
                  ...prev.lancamentos,
                ]
              : prev.lancamentos,
          };
        });
        try {
          const response = await post(`/parcelas/${parcelaId}/confirmar`, { mes_recebimento: dateOfMonth(mesEfetivo), data_pagamento: null });
          const parcela = A.toParcela(response.parcela);
          const lancamento = A.toLancamento(response.lancamento);
          setDb((prev) => ({
            ...prev,
            parcelas: replaceRow(prev.parcelas, parcelaId, parcela),
            lancamentos: [lancamento, ...prev.lancamentos.filter((row) => row.id !== optimisticId && !(row.origem === "parcela" && row.origemId === parcelaId))],
          }));
          refreshSoon();
        } catch (err) {
          if (previous) setDb(previous);
          throw err;
        }
      })(),
    estornarParcela: (parcelaId) =>
      (async () => {
        let previous = null;
        setDb((prev) => {
          previous = prev;
          return {
            ...prev,
            parcelas: prev.parcelas.map((p) => (p.id === parcelaId ? { ...p, recebido: false, mesEfetivo: "" } : p)),
            lancamentos: prev.lancamentos.filter((row) => !(row.origem === "parcela" && row.origemId === parcelaId)),
          };
        });
        try {
          const parcela = A.toParcela(await post(`/parcelas/${parcelaId}/estornar`, {}));
          setDb((prev) => ({ ...prev, parcelas: replaceRow(prev.parcelas, parcelaId, parcela) }));
          refreshSoon();
        } catch (err) {
          if (previous) setDb(previous);
          throw err;
        }
      })(),
    addLancamento: async (l, parcelaId) => {
      const id = tempId();
      const optimistic = uiLancamento(l, id, parcelaId);
      setDb((prev) => ({
        ...prev,
        lancamentos: [optimistic, ...prev.lancamentos],
        parcelas: parcelaId
          ? prev.parcelas.map((p) => (p.id === parcelaId ? { ...p, recebido: true, mesEfetivo: dateOfMonth(l.data)?.slice(0, 7) || p.mesEfetivo } : p))
          : prev.parcelas,
      }));
      try {
        const response = parcelaId
          ? await post(`/parcelas/${parcelaId}/confirmar`, { mes_recebimento: dateOfMonth(l.data), data_pagamento: l.data || null })
          : await post("/lancamentos", A.lancamentoToApi(l));
        const persisted = A.toLancamento(response?.lancamento || response);
        setDb((prev) => ({
          ...prev,
          lancamentos: prev.lancamentos.map((row) => (row.id === id ? persisted : row)),
        }));
        refreshSoon();
      } catch (err) {
        setDb((prev) => ({
          ...prev,
          lancamentos: prev.lancamentos.filter((row) => row.id !== id),
          parcelas: parcelaId ? prev.parcelas.map((p) => (p.id === parcelaId ? { ...p, recebido: false, mesEfetivo: "" } : p)) : prev.parcelas,
        }));
        throw err;
      }
    },
    lancarFixo: (custoId, mes) =>
      (async () => {
        const response = await post(`/custos-fixos/${custoId}/lancar`, { competencia: dateOfMonth(mes) });
        const lancamento = A.toLancamento(response);
        setDb((prev) => ({ ...prev, lancamentos: [lancamento, ...prev.lancamentos.filter((row) => row.id !== lancamento.id)] }));
        refreshSoon();
      })(),
    fecharContrato: (contratoId, parcelas = 1, dataFechamento = MES_ATUAL, mesInicio = MES_ATUAL) =>
      (async () => {
        let previous = null;
        setDb((prev) => {
          previous = prev.contratos.find(byId(contratoId)) || null;
          return { ...prev, contratos: prev.contratos.map((row) => (row.id === contratoId ? { ...row, status: "Ativo", pending: true } : row)) };
        });
        try {
          const response = await post(`/contratos/${contratoId}/fechar`, {
            parcelas,
            mes_inicio: dateOfMonth(mesInicio),
            data_fechamento: dateOfMonth(dataFechamento),
          });
          const contrato = A.toContrato(response.contrato);
          const novasParcelas = (response.parcelas || []).map(A.toParcela);
          setDb((prev) => ({
            ...prev,
            contratos: replaceRow(prev.contratos, contratoId, contrato),
            parcelas: [
              ...novasParcelas,
              ...prev.parcelas.filter((row) => !novasParcelas.some((created) => created.id === row.id)),
            ],
          }));
          refreshSoon();
        } catch (err) {
          if (previous) setDb((prev) => ({ ...prev, contratos: replaceRow(prev.contratos, contratoId, previous) }));
          throw err;
        }
      })(),
    enviarParaTarefas: (mov) =>
      (async () => {
        const id = tempId();
        setDb((prev) => ({
          ...prev,
          ...mapRadarMovCollections(prev, (row) => (row.id === mov.id ? { ...row, virouTarefa: true, pending: true } : row)),
          tarefas: [{ id, titulo: `Verificar movimentação — ${mov.cliente || ""}`.trim(), contratoId: "", resp: "", prazo: "", status: "a_fazer", prioridade: "alta", origem: "radar", origemMovId: mov.id, processoNumero: mov.numero || "", pending: true }, ...prev.tarefas],
        }));
        try {
          const tarefa = A.toTarefa(await post(`/movimentacoes/${mov.id}/criar-tarefa`, {}));
          const linkedIds = new Set((tarefa.radarMovimentacoes || []).map((row) => row.id).filter(Boolean));
          setDb((prev) => ({
            ...prev,
            ...mapRadarMovCollections(prev, (row) => (
              row.id === mov.id || linkedIds.has(row.id)
                ? { ...row, virouTarefa: true, statusAnalise: "em_tarefa", tarefaId: tarefa.id, tarefaTitulo: tarefa.titulo, pending: false }
                : row
            )),
            tarefas: [tarefa, ...prev.tarefas.filter((row) => row.id !== id && row.origemMovId !== mov.id)],
          }));
          refreshTasksSoon();
        } catch (err) {
          setDb((prev) => ({
            ...prev,
            ...mapRadarMovCollections(prev, (row) => (row.id === mov.id ? { ...row, virouTarefa: false, pending: false } : row)),
            tarefas: prev.tarefas.filter((t) => t.id !== id),
          }));
          throw err;
        }
      })(),
    enviarTodasParaTarefas: (movs) =>
      (async () => {
        const pendentes = (movs || []).filter((mv) => !mv.virouTarefa && (mv.statusAnalise || "pendente") === "pendente");
        const grupos = Array.from(new Map(pendentes.map((mv) => [mv.processoId || mv.id, mv])).values());
        const news = grupos.map((mv) => ({ id: tempId(), titulo: `Verificar movimentação — ${mv.cliente || ""}`.trim(), contratoId: "", resp: "", prazo: "", status: "a_fazer", prioridade: "alta", origem: "radar", origemMovId: mv.id, processoNumero: mv.numero || "", pending: true }));
        setDb((prev) => ({
          ...prev,
          ...mapRadarMovCollections(prev, (row) => (pendentes.some((mv) => mv.id === row.id) ? { ...row, virouTarefa: true, pending: true } : row)),
          tarefas: [...news, ...prev.tarefas],
        }));
        const settled = await Promise.allSettled(grupos.map((mv) => post(`/movimentacoes/${mv.id}/criar-tarefa`, {})));
        const criadas = settled
          .filter((item) => item.status === "fulfilled")
          .map((item) => A.toTarefa(item.value));
        const linkedIds = new Set(criadas.flatMap((task) => (task.radarMovimentacoes || []).map((row) => row.id)).filter(Boolean));
        const failedIds = settled
          .map((item, index) => (item.status === "rejected" ? grupos[index].id : null))
          .filter(Boolean);
        const failedProcessIds = new Set(settled
          .map((item, index) => (item.status === "rejected" ? grupos[index].processoId : null))
          .filter(Boolean));
        setDb((prev) => ({
          ...prev,
          ...mapRadarMovCollections(prev, (row) => (
            pendentes.some((mv) => mv.id === row.id)
              ? {
                  ...row,
                  virouTarefa: linkedIds.has(row.id) || (!failedIds.includes(row.id) && !failedProcessIds.has(row.processoId) && row.virouTarefa),
                  statusAnalise: linkedIds.has(row.id) ? "em_tarefa" : row.statusAnalise,
                  pending: false,
                }
              : row
          )),
          tarefas: [
            ...criadas,
            ...prev.tarefas.filter((row) => !news.some((tmp) => tmp.id === row.id) && !criadas.some((task) => task.origemMovId && task.origemMovId === row.origemMovId)),
          ],
        }));
        refreshTasksSoon();
        const firstFailure = settled.find((item) => item.status === "rejected");
        if (firstFailure) throw firstFailure.reason;
      })(),
    ignorarMovimentacaoRadar: async (mov, motivo = "") => {
      setDb((prev) => ({
        ...prev,
        ...mapRadarMovCollections(prev, (row) => (row.id === mov.id ? { ...row, statusAnalise: "ignorada", pending: true } : row)),
      }));
      try {
        const updated = A.toRadarMov(await post(`/movimentacoes/${mov.id}/ignorar`, { motivo }));
        setDb((prev) => ({
          ...prev,
          ...filterRadarMovCollections({
            ...prev,
            ...mapRadarMovCollections(prev, (row) => (row.id === mov.id ? { ...row, ...updated, pending: false } : row)),
          }, (row) => row.statusAnalise !== "ignorada"),
        }));
      } catch (err) {
        setDb((prev) => ({
          ...prev,
          ...mapRadarMovCollections(prev, (row) => (row.id === mov.id ? { ...row, statusAnalise: mov.statusAnalise || "pendente", pending: false } : row)),
        }));
        throw err;
      }
    },
    rodarVerificacao: () =>
      (async () => {
        throw new Error("As consultas processuais sao executadas semanalmente pelo ambiente autorizado.");
      })(),
    rodarProcesso: (processoId) =>
      (async () => {
        void processoId;
        throw new Error("Este processo sera consultado pela proxima rodada do executor local autorizado.");
      })(),
    // Live consultations run in the external radar worker. The API/frontend only
    // read results and manage process metadata in this phase.
    atualizarRadar: (opts = {}) => loadRadar(opts),
    atualizarRadarProgresso: (opts = {}) => loadRadarProgress(opts),
    aprovarAutomacaoRadar: async (automacao, payload = {}) => {
      const previousId = automacao.id;
      setDb((prev) => ({
        ...prev,
        radarAutomacoes: prev.radarAutomacoes.map((row) => (row.id === previousId ? { ...row, status: "aprovando", pending: true, sugestao: { ...row.sugestao, ...payload } } : row)),
        ...mapRadarMovCollections(prev, (row) => (row.automacaoId === previousId ? { ...row, automacaoStatus: "aprovando", pending: true } : row)),
      }));
      try {
        const response = await post(`/radar/automacoes/${previousId}/aprovar`, payload);
        const tarefa = A.toTarefa(response?.tarefa || {});
        const execucao = response?.execucao || {};
        setDb((prev) => ({
          ...prev,
          radarAutomacoes: prev.radarAutomacoes.map((row) => (
            row.id === previousId
              ? { ...row, status: "tarefa_criada", tarefaId: tarefa.id || execucao.tarefa_id || "", tarefaTitulo: tarefa.titulo || row.tarefaTitulo, pending: false }
              : row
          )),
          ...mapRadarMovCollections(prev, (row) => (
            row.automacaoId === previousId
              ? { ...row, virouTarefa: true, automacaoStatus: "tarefa_criada", tarefaId: tarefa.id || execucao.tarefa_id || "", tarefaTitulo: tarefa.titulo || row.tarefaTitulo, pending: false }
              : row
          )),
          tarefas: tarefa.id ? [tarefa, ...prev.tarefas.filter((row) => row.id !== tarefa.id)] : prev.tarefas,
        }));
        refreshTasksSoon();
        return response;
      } catch (err) {
        setDb((prev) => ({
          ...prev,
          radarAutomacoes: prev.radarAutomacoes.map((row) => (row.id === previousId ? { ...row, status: automacao.status, pending: false } : row)),
          ...mapRadarMovCollections(prev, (row) => (row.automacaoId === previousId ? { ...row, automacaoStatus: automacao.status, pending: false } : row)),
        }));
        throw err;
      }
    },
    ignorarAutomacaoRadar: async (automacao, motivo) => {
      const previousId = automacao.id;
      setDb((prev) => ({
        ...prev,
        radarAutomacoes: prev.radarAutomacoes.map((row) => (row.id === previousId ? { ...row, status: "ignorando", pending: true } : row)),
        ...mapRadarMovCollections(prev, (row) => (row.automacaoId === previousId ? { ...row, automacaoStatus: "ignorando", pending: true } : row)),
      }));
      try {
        const execucao = await post(`/radar/automacoes/${previousId}/ignorar`, { motivo });
        setDb((prev) => ({
          ...prev,
          radarAutomacoes: prev.radarAutomacoes.map((row) => (row.id === previousId ? { ...row, status: "ignorada", motivo: execucao?.motivo || motivo, pending: false } : row)),
          ...mapRadarMovCollections(prev, (row) => (row.automacaoId === previousId ? { ...row, automacaoStatus: "ignorada", automacaoMotivo: execucao?.motivo || motivo, pending: false } : row)),
        }));
        return execucao;
      } catch (err) {
        setDb((prev) => ({
          ...prev,
          radarAutomacoes: prev.radarAutomacoes.map((row) => (row.id === previousId ? { ...row, status: automacao.status, pending: false } : row)),
          ...mapRadarMovCollections(prev, (row) => (row.automacaoId === previousId ? { ...row, automacaoStatus: automacao.status, pending: false } : row)),
        }));
        throw err;
      }
    },
    // creates (modals + secondary)
    criarContrato: async (c) => {
      const id = tempId();
      const optimistic = { ...c, id, pending: true };
      setDb((prev) => ({ ...prev, contratos: [optimistic, ...prev.contratos] }));
      try {
        const contrato = A.toContrato(await post("/contratos", A.contratoToApi(c)));
        setDb((prev) => ({ ...prev, contratos: replaceRow(prev.contratos, id, contrato) }));
        refreshSoon();
      } catch (err) {
        setDb((prev) => ({ ...prev, contratos: prev.contratos.filter((row) => row.id !== id) }));
        throw err;
      }
    },
    editarContrato: async (id, c) => {
      let previous = null;
      setDb((prev) => {
        previous = prev.contratos.find(byId(id)) || null;
        return { ...prev, contratos: prev.contratos.map((row) => (row.id === id ? { ...row, ...c, id, pending: true } : row)) };
      });
      try {
        const contrato = A.toContrato(await patch(`/contratos/${id}`, A.contratoToApi(c)));
        setDb((prev) => ({ ...prev, contratos: replaceRow(prev.contratos, id, contrato) }));
        refreshSoon();
      } catch (err) {
        if (previous) setDb((prev) => ({ ...prev, contratos: replaceRow(prev.contratos, id, previous) }));
        throw err;
      }
    },
    removerContrato: async (id) => {
      let previous = null;
      setDb((prev) => {
        previous = prev;
        return {
          ...prev,
          contratos: prev.contratos.filter((row) => row.id !== id),
          parcelas: prev.parcelas.filter((row) => row.contratoId !== id),
          lancamentos: prev.lancamentos.filter((row) => row.contratoId !== id),
          tarefas: prev.tarefas.filter((row) => row.contratoId !== id),
          processos: prev.processos.filter((row) => row.contratoId !== id),
        };
      });
      try {
        await del(`/contratos/${id}`, { cascade: true });
        refreshSoon();
      } catch (err) {
        if (previous) setDb(previous);
        throw err;
      }
    },
    criarParcela: async (p) => {
      const id = tempId();
      const optimistic = { ...p, id, recebido: false, mesEfetivo: "", pending: true };
      setDb((prev) => ({ ...prev, parcelas: [optimistic, ...prev.parcelas] }));
      try {
        const parcela = A.toParcela(await post("/parcelas", A.parcelaToApi(p)));
        setDb((prev) => ({ ...prev, parcelas: replaceRow(prev.parcelas, id, parcela) }));
        refreshSoon();
      } catch (err) {
        setDb((prev) => ({ ...prev, parcelas: prev.parcelas.filter((row) => row.id !== id) }));
        throw err;
      }
    },
    criarCusto: async (f) => {
      const id = tempId();
      const optimistic = { ...f, id, pending: true };
      setDb((prev) => ({ ...prev, custosFixos: [optimistic, ...prev.custosFixos] }));
      try {
        const custo = A.toCustoFixo(await post("/custos-fixos", A.custoToApi(f)));
        setDb((prev) => ({ ...prev, custosFixos: replaceRow(prev.custosFixos, id, custo) }));
        refreshSoon();
      } catch (err) {
        setDb((prev) => ({ ...prev, custosFixos: prev.custosFixos.filter((row) => row.id !== id) }));
        throw err;
      }
    },
    editarCusto: async (id, f) => {
      let previous = null;
      setDb((prev) => {
        previous = prev.custosFixos.find(byId(id)) || null;
        return { ...prev, custosFixos: prev.custosFixos.map((row) => (row.id === id ? { ...row, ...f, id, pending: true } : row)) };
      });
      try {
        const custo = A.toCustoFixo(await patch(`/custos-fixos/${id}`, A.custoToApi(f)));
        setDb((prev) => ({ ...prev, custosFixos: replaceRow(prev.custosFixos, id, custo) }));
        refreshSoon();
      } catch (err) {
        if (previous) setDb((prev) => ({ ...prev, custosFixos: replaceRow(prev.custosFixos, id, previous) }));
        throw err;
      }
    },
    criarTarefa: async (t) => {
      taskMutationStamp.current += 1;
      const id = tempId();
      const now = new Date().toISOString();
      const optimistic = { ...t, id, status: t.status || "a_fazer", prioridade: t.prioridade || "normal", origem: "manual", pending: true, createdAt: now, updatedAt: now };
      setDb((prev) => ({ ...prev, tarefas: [optimistic, ...prev.tarefas] }));
      try {
        const tarefa = A.toTarefa(await post("/tarefas", A.tarefaToApi(t)));
        setDb((prev) => ({ ...prev, tarefas: upsertReplacingTemp(prev.tarefas, id, tarefa) }));
        refreshTasksSoon();
      } catch (err) {
        setDb((prev) => ({ ...prev, tarefas: prev.tarefas.filter((row) => row.id !== id) }));
        throw err;
      }
    },
    editarTarefa: async (id, t) => {
      taskMutationStamp.current += 1;
      let previous = null;
      setDb((prev) => {
        previous = prev.tarefas.find(byId(id)) || null;
        return { ...prev, tarefas: prev.tarefas.map((row) => (row.id === id ? { ...row, ...t, id, pending: true } : row)) };
      });
      try {
        const tarefa = A.toTarefa(await patch(`/tarefas/${id}`, A.tarefaToApi(t)));
        setDb((prev) => ({ ...prev, tarefas: replaceRow(prev.tarefas, id, tarefa) }));
      } catch (err) {
        if (previous) setDb((prev) => ({ ...prev, tarefas: replaceRow(prev.tarefas, id, previous) }));
        throw err;
      }
    },
    alterarStatusTarefa: async (id, status, opts = {}) => {
      taskMutationStamp.current += 1;
      let previous = null;
      setDb((prev) => {
        previous = prev.tarefas.find(byId(id)) || null;
        return {
          ...prev,
          tarefas: prev.tarefas.map((row) => (
            row.id === id
              ? { ...row, status, statusLabel: taskStatusLabel(status, row.statusLabel), pending: false, syncing: true, updatedAt: new Date().toISOString() }
              : row
          )),
        };
      });
      try {
        const tarefa = A.toTarefa(await post(`/tarefas/${id}/status`, { status, force: !!opts.force }));
        setDb((prev) => ({ ...prev, tarefas: replaceRow(prev.tarefas, id, tarefa) }));
      } catch (err) {
        if (previous) setDb((prev) => ({ ...prev, tarefas: replaceRow(prev.tarefas, id, previous) }));
        throw err;
      }
    },
    concluirTarefa: async (id, opts = {}) => {
      taskMutationStamp.current += 1;
      let previous = null;
      setDb((prev) => {
        previous = prev.tarefas.find(byId(id)) || null;
        return { ...prev, tarefas: prev.tarefas.map((row) => (row.id === id ? { ...row, status: "concluida", statusLabel: taskStatusLabel("concluida", "Concluída"), pending: false, syncing: true, completedAt: row.completedAt || new Date().toISOString() } : row)) };
      });
      try {
        const response = await post(`/tarefas/${id}/concluir`, { force: !!opts.force });
        const tarefa = A.toTarefa(response);
        const proxima = response?.radar_proxima_automacao || null;
        const automacao = proxima?.execucao?.id ? A.toRadarAutomacao(proxima.execucao) : null;
        const tarefaCriada = proxima?.tarefa?.id ? A.toTarefa(proxima.tarefa) : null;
        const movimentacoesConcluidas = new Set((response?.movimentacoes_atualizadas || []).map((row) => row.id).filter(Boolean));
        setDb((prev) => {
          const updatedTasks = tarefaCriada?.id
            ? [tarefaCriada, ...replaceRow(prev.tarefas, id, tarefa).filter((row) => row.id !== tarefaCriada.id)]
            : replaceRow(prev.tarefas, id, tarefa);
          return {
            ...prev,
            tarefas: updatedTasks,
            radarAutomacoes: automacao?.id
              ? [automacao, ...prev.radarAutomacoes.filter((row) => row.id !== automacao.id)]
              : prev.radarAutomacoes,
            ...filterRadarMovCollections(
              automacao?.movimentacaoId
                ? {
                    ...prev,
                    ...mapRadarMovCollections(prev, (row) => (
                      row.id === automacao.movimentacaoId
                        ? { ...row, automacaoId: automacao.id, automacaoStatus: automacao.status, tarefaId: automacao.tarefaId || row.tarefaId, tarefaTitulo: automacao.tarefaTitulo || row.tarefaTitulo }
                        : row
                    )),
                  }
                : prev,
              (row) => !movimentacoesConcluidas.has(row.id),
            ),
          };
        });
      } catch (err) {
        if (previous) setDb((prev) => ({ ...prev, tarefas: replaceRow(prev.tarefas, id, previous) }));
        throw err;
      }
    },
    reabrirTarefa: async (id, status = "a_fazer") => {
      taskMutationStamp.current += 1;
      let previous = null;
      setDb((prev) => {
        previous = prev.tarefas.find(byId(id)) || null;
        return { ...prev, tarefas: prev.tarefas.map((row) => (row.id === id ? { ...row, status, statusLabel: taskStatusLabel(status, row.statusLabel), pending: false, syncing: true, completedAt: "" } : row)) };
      });
      try {
        const tarefa = A.toTarefa(await post(`/tarefas/${id}/reabrir`, { status }));
        setDb((prev) => ({ ...prev, tarefas: replaceRow(prev.tarefas, id, tarefa) }));
      } catch (err) {
        if (previous) setDb((prev) => ({ ...prev, tarefas: replaceRow(prev.tarefas, id, previous) }));
        throw err;
      }
    },
    arquivarTarefa: async (id) => {
      taskMutationStamp.current += 1;
      let previous = null;
      const archivedAt = new Date().toISOString();
      setDb((prev) => {
        previous = prev.tarefas.find(byId(id)) || null;
        return {
          ...prev,
          tarefas: prev.tarefas.map((row) => (
            row.id === id
              ? { ...row, archivedAt, pending: false, syncing: true, updatedAt: archivedAt }
              : row
          )),
        };
      });
      try {
        const tarefa = A.toTarefa(await post(`/tarefas/${id}/arquivar`, {}));
        setDb((prev) => ({ ...prev, tarefas: replaceRow(prev.tarefas, id, tarefa) }));
      } catch (err) {
        if (previous) setDb((prev) => ({ ...prev, tarefas: replaceRow(prev.tarefas, id, previous) }));
        throw err;
      }
    },
    removerTarefa: async (id) => {
      taskMutationStamp.current += 1;
      let previous = null;
      const archivedAt = new Date().toISOString();
      setDb((prev) => {
        previous = prev.tarefas.find(byId(id)) || null;
        return {
          ...prev,
          tarefas: prev.tarefas.map((row) => (
            row.id === id
              ? { ...row, archivedAt, pending: false, syncing: true, updatedAt: archivedAt }
              : row
          )),
        };
      });
      try {
        const tarefa = A.toTarefa(await post(`/tarefas/${id}/arquivar`, {}));
        setDb((prev) => ({ ...prev, tarefas: replaceRow(prev.tarefas, id, tarefa) }));
      } catch (err) {
        if (previous) setDb((prev) => ({ ...prev, tarefas: replaceRow(prev.tarefas, id, previous) }));
        throw err;
      }
    },
    restaurarTarefa: async (id) => {
      taskMutationStamp.current += 1;
      const tarefa = A.toTarefa(await post(`/tarefas/${id}/restaurar`, {}));
      setDb((prev) => ({ ...prev, tarefas: [tarefa, ...prev.tarefas.filter((row) => row.id !== id)] }));
    },
    excluirTarefaPermanente: async (id) => {
      taskMutationStamp.current += 1;
      let removed = null;
      setDb((prev) => {
        removed = prev.tarefas.find(byId(id)) || null;
        return { ...prev, tarefas: prev.tarefas.filter((row) => row.id !== id) };
      });
      try {
        await del(`/tarefas/${id}`, { permanent: true });
      } catch (err) {
        if (removed) setDb((prev) => ({ ...prev, tarefas: [removed, ...prev.tarefas] }));
        throw err;
      }
    },
    carregarTarefa: (id) => get(`/tarefas/${id}`),
    criarChecklistTarefa: async (tarefaId, item) => {
      taskMutationStamp.current += 1;
      await post(`/tarefas/${tarefaId}/checklist`, item);
      refreshTasksSoon();
    },
    atualizarChecklistTarefa: async (itemId, item) => {
      taskMutationStamp.current += 1;
      await patch(`/tarefas/checklist/${itemId}`, item);
      refreshTasksSoon();
    },
    removerChecklistTarefa: async (itemId) => {
      taskMutationStamp.current += 1;
      await del(`/tarefas/checklist/${itemId}`);
      refreshTasksSoon();
    },
    criarSubtarefa: async (tarefaId, sub) => {
      taskMutationStamp.current += 1;
      await post(`/tarefas/${tarefaId}/subtarefas`, sub);
      refreshTasksSoon();
    },
    atualizarSubtarefa: async (subId, sub) => {
      taskMutationStamp.current += 1;
      await patch(`/tarefas/subtarefas/${subId}`, sub);
      refreshTasksSoon();
    },
    removerSubtarefa: async (subId) => {
      taskMutationStamp.current += 1;
      await del(`/tarefas/subtarefas/${subId}`);
      refreshTasksSoon();
    },
    comentarTarefa: async (tarefaId, conteudo) => {
      taskMutationStamp.current += 1;
      await post(`/tarefas/${tarefaId}/comentarios`, { conteudo });
      refreshTasksSoon();
    },
    bulkTarefas: async (ids, action, payload = {}) => {
      taskMutationStamp.current += 1;
      const response = await post("/tarefas/bulk", { ids, action, payload });
      const atualizadas = (response?.atualizadas || []).map(A.toTarefa);
      if (atualizadas.length) {
        setDb((prev) => ({
          ...prev,
          tarefas: [
            ...atualizadas,
            ...prev.tarefas.filter((row) => !atualizadas.some((task) => task.id === row.id)),
          ],
        }));
      }
      return response;
    },
    criarProcesso: async (p) => {
      const id = tempId();
      const optimistic = { ...p, id, ativo: true, monitorar: true, pending: true };
      setDb((prev) => ({ ...prev, processos: [optimistic, ...prev.processos] }));
      try {
        const processo = A.toProcesso(await post("/processos", A.processoToApi(p)));
        setDb((prev) => ({ ...prev, processos: replaceRow(prev.processos, id, processo) }));
        refreshSoon();
      } catch (err) {
        setDb((prev) => ({ ...prev, processos: prev.processos.filter((row) => row.id !== id) }));
        throw err;
      }
    },
    editarProcesso: async (id, p) => {
      let previous = null;
      setDb((prev) => {
        previous = prev.processos.find(byId(id)) || null;
        return { ...prev, processos: prev.processos.map((row) => (row.id === id ? { ...row, ...p, id, pending: true } : row)) };
      });
      try {
        const processo = A.toProcesso(await patch(`/processos/${id}`, A.processoToApi(p)));
        setDb((prev) => ({ ...prev, processos: replaceRow(prev.processos, id, processo) }));
        refreshSoon();
      } catch (err) {
        if (previous) setDb((prev) => ({ ...prev, processos: replaceRow(prev.processos, id, previous) }));
        throw err;
      }
    },
    alterarMonitoramentoProcesso: async (p) => {
      let previous = null;
      setDb((prev) => {
        previous = prev.processos.find(byId(p.id)) || null;
        return { ...prev, processos: prev.processos.map((row) => (row.id === p.id ? { ...row, monitorar: !p.monitorar, pending: true } : row)) };
      });
      try {
        const processo = A.toProcesso(await patch(`/processos/${p.id}`, { monitorar: !p.monitorar }));
        setDb((prev) => ({ ...prev, processos: replaceRow(prev.processos, p.id, processo) }));
        refreshSoon();
      } catch (err) {
        if (previous) setDb((prev) => ({ ...prev, processos: replaceRow(prev.processos, p.id, previous) }));
        throw err;
      }
    },
    registrarSenhaProcesso: async (processoId, senha) => {
      const processo = A.toProcesso(await put(`/processos/${processoId}/senha`, { senha }));
      setDb((prev) => ({ ...prev, processos: replaceRow(prev.processos, processoId, processo) }));
      await loadRadar();
      return processo;
    },
    removerProcesso: async (id) => {
      let removed = null;
      setDb((prev) => {
        removed = prev.processos.find(byId(id)) || null;
        return { ...prev, processos: prev.processos.filter((row) => row.id !== id) };
      });
      try {
        await del(`/processos/${id}`);
        refreshSoon();
      } catch (err) {
        if (removed) setDb((prev) => ({ ...prev, processos: [removed, ...prev.processos] }));
        throw err;
      }
    },
    criarParceiro: async (nome) => {
      const id = tempId();
      const optimistic = { id, nome, pending: true };
      setDb((prev) => ({ ...prev, parceiros: [optimistic, ...prev.parceiros] }));
      try {
        const parceiro = A.toParceiro(await post("/parceiros", { nome }));
        setDb((prev) => ({ ...prev, parceiros: replaceRow(prev.parceiros, id, parceiro) }));
        refreshSoon();
      } catch (err) {
        setDb((prev) => ({ ...prev, parceiros: prev.parceiros.filter((row) => row.id !== id) }));
        throw err;
      }
    },
    removerParceiro: async (id) => {
      let removed = null;
      setDb((prev) => {
        removed = prev.parceiros.find(byId(id)) || null;
        return { ...prev, parceiros: prev.parceiros.filter((row) => row.id !== id) };
      });
      try {
        await del(`/parceiros/${id}`);
        refreshSoon();
      } catch (err) {
        if (removed) setDb((prev) => ({ ...prev, parceiros: [removed, ...prev.parceiros] }));
        throw err;
      }
    },
    removerCusto: async (id) => {
      let removed = null;
      setDb((prev) => {
        removed = prev.custosFixos.find(byId(id)) || null;
        return { ...prev, custosFixos: prev.custosFixos.filter((row) => row.id !== id) };
      });
      try {
        await del(`/custos-fixos/${id}`);
        refreshSoon();
      } catch (err) {
        if (removed) setDb((prev) => ({ ...prev, custosFixos: [removed, ...prev.custosFixos] }));
        throw err;
      }
    },
    editarLancamento: async (id, l) => {
      let previous = null;
      setDb((prev) => {
        previous = prev.lancamentos.find((row) => row.id === id) || null;
        return {
          ...prev,
          lancamentos: prev.lancamentos.map((row) => (row.id === id ? { ...row, ...uiLancamento(l, id, row.origemId), pending: true } : row)),
        };
      });
      try {
        const persisted = A.toLancamento(await patch(`/lancamentos/${id}`, A.lancamentoToApi(l)));
        setDb((prev) => ({ ...prev, lancamentos: prev.lancamentos.map((row) => (row.id === id ? persisted : row)) }));
        refreshSoon();
      } catch (err) {
        if (previous) setDb((prev) => ({ ...prev, lancamentos: prev.lancamentos.map((row) => (row.id === id ? previous : row)) }));
        throw err;
      }
    },
    removerLancamento: async (id) => {
      let removed = null;
      setDb((prev) => {
        removed = prev.lancamentos.find((row) => row.id === id) || null;
        return { ...prev, lancamentos: prev.lancamentos.filter((row) => row.id !== id) };
      });
      try {
        await del(`/lancamentos/${id}`);
        refreshSoon();
      } catch (err) {
        if (removed) setDb((prev) => ({ ...prev, lancamentos: [removed, ...prev.lancamentos] }));
        throw err;
      }
    },
    salvarParams: (p) => after(put(`/parametros/${ANO}`, A.paramsToApi(p))),
  }), [get, post, patch, del, put, load, refreshSoon, refreshTasksSoon, loadRadar, loadRadarProgress]);

  return { db, setDb, loading, error, refetch: load, mut };
}
