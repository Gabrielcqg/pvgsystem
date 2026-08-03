// Maps the real FastAPI/Supabase rows (snake_case slugs) into the exact `db`
// shape the reference (PavageauApp.jsx) expects (camelCase + PT labels), and
// back again for writes. The reference views/engine are untouched; only data
// crosses this boundary.

/* ---------- enum label maps (slug <-> label) ---------- */
const STATUS = {
  proposta: "Proposta", ativo: "Ativo", aguardando_exito: "Aguardando êxito",
  encerrado: "Encerrado", sem_exito: "Sem êxito",
};
const TIPO_HON = {
  fixo_unico: "Fixo único", fixo_mensal: "Fixo mensal", fixo_parcelado: "Fixo parcelado",
  exito_puro: "Êxito puro", sucumbencia: "Sucumbência", fixo_exito: "Fixo + Êxito",
  exito_sucumbencia: "Êxito + Sucumbência", fixo_exito_sucumbencia: "Fixo + Êxito + Sucumbência",
};
const TIPO_PARC = { inicial: "Inicial", mensal: "Mensal", exito: "Êxito", sucumbencia: "Sucumbência" };
const CATEGORIA = {
  honorarios: "Honorários", consultoria: "Consultoria", custas_processuais: "Custas processuais",
  restituicao_cliente: "Restituição ao cliente", custo_fixo: "Custo fixo", impostos: "Impostos",
  marketing: "Marketing", infraestrutura: "Infraestrutura", freelancer: "Freelancer",
  pro_labore: "Pró-labore", outras_entradas: "Outras entradas", outras_saidas: "Outras saídas",
};
export const TAREFA_STATUS = {
  backlog: "Backlog",
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  aguardando: "Aguardando",
  bloqueada: "Bloqueada",
  em_revisao: "Em revisão",
  concluida: "Concluída",
};
const TAREFA_STATUS_R = {
  Backlog: "backlog",
  "A fazer": "a_fazer",
  Abertas: "a_fazer",
  Aberta: "a_fazer",
  aberta: "a_fazer",
  "Em andamento": "em_andamento",
  Aguardando: "aguardando",
  Bloqueada: "bloqueada",
  "Em revisão": "em_revisao",
  "Concluída": "concluida",
  Concluídas: "concluida",
  concluida: "concluida",
};
export const TAREFA_PRIORIDADE = { baixa: "Baixa", normal: "Normal", alta: "Alta", urgente: "Urgente" };
const TAREFA_PRIORIDADE_R = { Baixa: "baixa", Normal: "normal", Alta: "alta", Urgente: "urgente" };
const invert = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
const STATUS_R = invert(STATUS), TIPO_HON_R = invert(TIPO_HON), TIPO_PARC_R = invert(TIPO_PARC), CATEGORIA_R = invert(CATEGORIA);
const lbl = (map, v, fb = "") => map[v] ?? v ?? fb;
const slug = (map, v, fb = null) => map[v] ?? v ?? fb;
const tarefaStatusSlug = (v) => TAREFA_STATUS_R[v] || (v === "aberta" ? "a_fazer" : v) || "a_fazer";
const tarefaPrioridadeSlug = (v) => TAREFA_PRIORIDADE_R[v] || v || "normal";
const currentYear = () => new Date().getFullYear();
const monthDate = (month, year = currentYear()) => `${year}-${String(month || 1).padStart(2, "0")}-01`;

/* ---------- helpers ---------- */
const num = (v) => (v == null ? 0 : Number(v));
const ym = (s) => (s ? String(s).slice(0, 7) : "");          // 'YYYY-MM-DD' -> 'YYYY-MM'
const monthOf = (s) => (s ? Number(String(s).slice(5, 7)) : null); // date -> 1..12
const idOf = (r) => r.id ?? r.uuid ?? r.pk ?? "";

/* ---------- API row -> reference db shape ---------- */
export const toParceiro = (r) => ({ id: idOf(r), nome: r.nome });

export const toContrato = (r) => ({
  id: idOf(r), cliente: r.cliente || "", parceiroId: r.parceiro_id || "",
  processo: r.numero_processo || "", tipoHonorario: lbl(TIPO_HON, r.tipo_honorario),
  pctExito: num(r.percentual_exito), pctSucumb: num(r.percentual_sucumbencia), pctQuota: num(r.percentual_quota),
  fixoTotal: num(r.honorario_fixo_total), valorCausa: num(r.valor_causa),
  status: lbl(STATUS, r.status), splitNick: r.apelido_split || "", obs: r.observacoes || "",
  dataProposta: r.data_proposta || "", dataFechamento: r.data_fechamento || "",
});

export const toParcela = (r) => ({
  id: idOf(r), contratoId: r.contrato_id || "", tipo: lbl(TIPO_PARC, r.tipo), valor: num(r.valor),
  mesEsperado: ym(r.mes_esperado), recebido: !!r.recebido, mesEfetivo: ym(r.mes_recebimento), obs: r.observacoes || "",
});

export const toLancamento = (r) => ({
  id: idOf(r), data: r.data || "", descricao: r.descricao || "", tipo: r.tipo, valor: num(r.valor),
  categoria: lbl(CATEGORIA, r.categoria), forma: r.forma_pagamento || "", pago: !!r.pago,
  contratoId: r.contrato_id || "", obs: r.observacoes || "",
  origem: r.origem === "custo_fixo" ? "fixo" : (r.origem || "manual"), origemId: r.origem_id || "",
});

export const toCustoFixo = (r) => ({
  id: idOf(r), descricao: r.descricao || "", valor: num(r.valor_mensal), diaVenc: r.dia_vencimento || 1,
  recorrente: r.recorrente !== false, mesInicio: monthOf(r.mes_inicio) || 1, mesFim: r.mes_fim ? monthOf(r.mes_fim) : null,
});

export const toParams = (r) => ({
  caixaInicial: num(r?.caixa_inicial_ano), metaCaixa: num(r?.meta_caixa_ano),
  metaRecorrencia: num(r?.meta_recorrencia_mensal), recorrenciaAtual: num(r?.recorrencia_atual),
});

export const toConfiguracao = (r) => ({
  chave: r.chave || "", valor: r.valor, descricao: r.descricao || "",
});

export const toAuditoria = (r) => ({
  id: idOf(r), usuarioId: r.usuario_id || "", entidade: r.entidade || "", entidadeId: r.entidade_id || "",
  acao: r.acao || "", criadoEm: r.criado_em || "", valorAntigo: r.valor_antigo || null, valorNovo: r.valor_novo || null,
});

export const toTarefa = (r) => ({
  id: idOf(r), titulo: r.titulo || "", descricao: r.descricao || "", contratoId: r.contrato_id || "",
  resp: r.responsavel || "", responsavelId: r.responsavel_id || "",
  prazo: r.prazo || "", dataInicio: r.data_inicio || "", status: tarefaStatusSlug(r.status),
  statusLabel: r.status_rotulo || lbl(TAREFA_STATUS, tarefaStatusSlug(r.status), "A fazer"),
  statusOrdem: num(r.status_ordem), statusGrupo: r.status_grupo || "", statusCor: r.status_cor || "",
  prioridade: tarefaPrioridadeSlug(r.prioridade), prioridadeLabel: lbl(TAREFA_PRIORIDADE, tarefaPrioridadeSlug(r.prioridade), "Normal"),
  origem: (r.origem || "").startsWith("radar") ? "radar" : (r.origem || "manual"),
  origemRaw: r.origem || "manual", origemMovId: r.movimentacao_id || "", processoId: r.processo_id || "",
  processoNumero: r.numero_processo || "", contratoCliente: r.contrato_cliente || "", processoCliente: r.processo_cliente || "",
  radarInerciaChave: r.radar_inercia_chave || "",
  radarAutomacaoId: r.radar_automacao_execucao_id || "",
  radarRegraId: r.radar_regra_id || "",
  radarRegraNome: r.radar_regra_nome || "",
  radarRegraSlug: r.radar_regra_slug || "",
  radarAutomacaoStatus: r.radar_automacao_status || "",
  radarProximaAutomacao: r.radar_proxima_automacao || null,
  proximasAutomacoes: r.proximas_automacoes || [],
  tarefaOrigemId: r.tarefa_origem_id || "",
  criadaAutomaticamente: !!r.criada_automaticamente,
  movimentacaoDescricao: r.movimentacao_descricao || "",
  movimentacaoDataHora: r.movimentacao_data_hora || "",
  movimentacaoEvento: r.movimentacao_evento || "",
  movimentacaoUsuario: r.movimentacao_usuario || "",
  estimativaMinutos: num(r.estimativa_minutos), obs: r.observacoes || "", tags: r.tags || [],
  createdAt: r.criado_em || "", updatedAt: r.atualizado_em || "", completedAt: r.completed_at || "", archivedAt: r.archived_at || "",
  checklistTotal: num(r.checklist_total), checklistConcluidos: num(r.checklist_concluidos),
  subtarefasTotal: num(r.subtarefas_total), subtarefasConcluidas: num(r.subtarefas_concluidas),
  comentariosTotal: num(r.comentarios_total), bloqueiosPendentes: num(r.bloqueios_pendentes),
  radarMovimentacoesTotal: num(r.radar_movimentacoes_total),
  radarMovimentacoes: r.radar_movimentacoes || r.movimentacoes_vinculadas || [],
  pending: !!r.pending,
});

export const toTarefaStatus = (r) => ({
  slug: r.slug || "", label: r.rotulo || lbl(TAREFA_STATUS, r.slug), ordem: num(r.ordem),
  grupo: r.grupo || "", cor: r.cor || "", terminal: !!r.terminal,
});

export const toProcesso = (r) => ({
  id: idOf(r), numero: r.numero || "", cliente: r.cliente || "", contratoId: r.contrato_id || "",
  areaPasta: r.area_pasta || "", numeroInterno: r.numero_interno || "",
  statusProcesso: r.status_processo || "", autor: r.autor || "", reu: r.reu || "",
  assunto: r.assunto || "", andamentoAtual: r.andamento_atual || "",
  monitorar: r.monitorar !== false, ativo: r.ativo !== false, tribunal: r.tribunal || "",
  comarca: r.comarca_vara || "", fase: r.fase_atual || "",
  ultimoAndamento: r.data_ultimo_andamento ? String(r.data_ultimo_andamento).slice(0, 10) : "",
  ultimaTentativa: r.ultima_consulta_em || "",
  ultimaConsultaStatus: r.ultima_consulta_status || "",
  ultimaConsultaInconclusiva: !!r.ultima_consulta_inconclusiva,
  pendenciasAnaliseTotal: num(r.pendencias_analise_total),
  exigeSenha: !!r.exige_senha,
  precisaSenha: !!r.exige_senha || r.ultima_consulta_status === "senha_necessaria",
  naoLocalizado: r.ultima_consulta_status === "nao_localizado",
  naoVerificado: !!r.ultima_consulta_inconclusiva || ["erro", "timeout", "captcha_timeout", "pagina_intermediaria", "numero_invalido"].includes(r.ultima_consulta_status),
});

/* radar: map an execution + its results into the reference's radarRun */
const RADAR_STATUS = (r) => {
  const rawStatus = r.statusOriginal || r.status || "";
  return r.tem_movimentacao_nova || r.novaMovimentacao || rawStatus === "com_movimentacao_nova" ? "movimentou"
  : rawStatus === "base_inicial_criada" ? "base_inicial"
  : rawStatus === "senha_necessaria" || rawStatus === "senha" ? "senha"
  : rawStatus === "nao_localizado" ? "nao_localizado"
  : rawStatus === "pendente_implementacao" || rawStatus === "pendente" ? "pendente"
  : ["erro", "timeout", "captcha_timeout", "pagina_intermediaria", "numero_invalido", "nao_verificado"].includes(rawStatus) ? "nao_verificado"
  : "sem_novidade";
};
const CONSULTA_LABEL = {
  sucesso: "Sem nova movimentação",
  base_inicial_criada: "Base inicial criada",
  senha_necessaria: "Senha necessária",
  nao_localizado: "Processo não localizado",
  pendente_implementacao: "Aguardando scraper",
  timeout: "Não foi possível verificar",
  captcha_timeout: "Não foi possível verificar",
  pagina_intermediaria: "Não foi possível verificar",
  numero_invalido: "Não foi possível verificar",
  erro: "Não foi possível verificar",
};

export const toRadarRun = (exec, resultados = []) => exec && ({
  id: idOf(exec), rodadaEm: exec.iniciada_em || exec.finalizada_em || "",
  processosPrevistos: num(exec.total_previstos) || resultados.length,
  processosVerificados: num(exec.total_consultados) || resultados.length,
  status: exec.status || "",
  resultados: resultados.map((r) => ({
    processoId: r.processo_id || r.processoId || "", status: RADAR_STATUS(r),
    statusOriginal: r.statusOriginal || r.status || "",
    statusLabel: r.statusLabel || CONSULTA_LABEL[r.status] || r.status || "",
    qtd: num(r.quantidade_movimentacoes ?? r.qtd), detalhe: r.mensagem_erro || r.detalhe || "",
    novaMovimentacao: !!(r.tem_movimentacao_nova || r.novaMovimentacao),
    precisaSenha: r.precisaSenha || r.status === "senha_necessaria" || r.status === "senha",
    naoLocalizado: r.naoLocalizado || r.status === "nao_localizado",
  })),
});

export const toRadarMov = (r) => ({
  id: idOf(r), execucaoId: r.execucao_id || "", processoId: r.processo_id || "", numero: r.numero_processo || "", cliente: r.cliente || "",
  tipo: r.movimentacao_tipo_nome || "Movimentação",
  data: (r.data_hora || r.criado_em || "").slice(0, 10),
  dataHora: r.data_hora || "",
  resumo: r.descricao || "",
  evento: r.evento || "",
  usuario: r.usuario || "",
  statusAnalise: r.status_analise || "pendente",
  statusAnaliseAtualizadoEm: r.status_analise_atualizado_em || "",
  tarefaPrincipalId: r.tarefa_principal_id || "",
  virouTarefa: !!r.virou_tarefa || r.status_analise === "em_tarefa" || !!r.tarefa_id || !!r.tarefa_principal_id,
  classificacaoStatus: r.classificacao_status || "",
  classificacaoMetodo: r.classificacao_metodo || "",
  classificacaoPontuacao: num(r.classificacao_pontuacao),
  classificacaoCandidatas: r.classificacao_candidatas || [],
  classificacaoDetalhes: r.classificacao_detalhes || {},
  tipoSlug: r.movimentacao_tipo_slug || "",
  regraId: r.regra_id || "",
  regraNome: r.regra_nome || "",
  regraSlug: r.regra_slug || "",
  automacaoId: r.automacao_execucao_id || "",
  automacaoStatus: r.automacao_status || "",
  automacaoGatilho: r.automacao_gatilho || r.gatilho || "",
  tarefaAnteriorId: r.tarefa_anterior_id || "",
  tarefaAnteriorTitulo: r.tarefa_anterior_titulo || "",
  sugestao: r.payload_tarefa_sugerida || {},
  aprovadoEm: r.aprovado_em || "",
  ignoradoEm: r.ignorado_em || "",
  automacaoMotivo: r.automacao_motivo || "",
  tarefaId: r.tarefa_id || "",
  tarefaTitulo: r.tarefa_titulo || "",
});

export const toRadarAutomacao = (r) => ({
  id: idOf(r), status: r.status || "", movimentacaoId: r.movimentacao_id || "", processoId: r.processo_id || "",
  regraId: r.regra_id || "", regraSlug: r.regra_slug || "", regraNome: r.regra_nome || "",
  tipoSlug: r.movimentacao_tipo_slug || "", tipoNome: r.movimentacao_tipo_nome || "",
  gatilho: r.gatilho || "", tarefaAnteriorId: r.tarefa_anterior_id || "", tarefaAnteriorTitulo: r.tarefa_anterior_titulo || "",
  requerAprovacao: !!r.requer_aprovacao, criaTarefa: !!r.cria_tarefa,
  sugestao: r.payload_tarefa_sugerida || {}, motivo: r.motivo || "",
  aprovadoEm: r.aprovado_em || "", ignoradoEm: r.ignorado_em || "",
  tarefaId: r.tarefa_id || "", tarefaTitulo: r.tarefa_titulo || "",
  movimentacaoDescricao: r.movimentacao_descricao || "", movimentacaoEvento: r.movimentacao_evento || "",
  movimentacaoUsuario: r.movimentacao_usuario || "", movimentacaoDataHora: r.movimentacao_data_hora || "",
  numero: r.numero_processo || "", cliente: r.cliente || "", tribunal: r.tribunal || "",
  areaPasta: r.area_pasta || "", assunto: r.assunto || "", fase: r.fase_atual || "",
  createdAt: r.criado_em || "", updatedAt: r.atualizado_em || "",
});

export const toRadarHist = (e) => ({
  data: (e.iniciada_em || "").slice(0, 10), previstos: num(e.total_previstos), verificados: num(e.total_consultados),
  movimentaram: num(e.total_com_movimentacao_nova),
  semMovimentacao: num(e.total_sem_movimentacao), bases: num(e.total_base_inicial_criada),
  senha: num(e.total_senha_necessaria), naoLocalizados: num(e.total_nao_localizado),
  naoVerificados: num(e.total_erro) + num(e.total_timeout) + num(e.total_captcha_timeout) + num(e.total_pagina_intermediaria) + num(e.total_numero_invalido),
  falharam: num(e.total_erro) + num(e.total_timeout) + num(e.total_captcha_timeout) + num(e.total_senha_necessaria) + num(e.total_nao_localizado),
});

export const toIndicadores = (payload = {}) => {
  const painel = (payload.painel || []).map((r) => ({
    ano: num(r.ano), mesReferencia: num(r.mes_referencia), caixaAtual: num(r.caixa_atual),
    mesesReserva: num(r.meses_reserva), custoFixoMensal: num(r.custo_fixo_mensal),
    percentualReceitaRecorrente: num(r.percentual_receita_recorrente),
    percentualMetaCaixa: num(r.percentual_meta_caixa), percentualMetaRecorrencia: num(r.percentual_meta_recorrencia),
    aReceberTotal: num(r.a_receber_total), inadimplencia: num(r.inadimplencia), taxaConversao: num(r.taxa_conversao),
    exitoProjetadoEscritorio: num(r.exito_projetado_escritorio), exitoProjetadoParceiro: num(r.exito_projetado_parceiro),
    sucumbenciaProjetada: num(r.sucumbencia_projetada),
  }));
  const fluxoMensal = (payload.fluxo_mensal || []).map((r) => ({
    ano: num(r.ano), mes: num(r.mes), entradasPagas: num(r.entradas_pagas), saidasPagas: num(r.saidas_pagas),
    resultadoMes: num(r.resultado_mes), saldoAcumulado: num(r.saldo_acumulado),
  }));
  const dreMensal = (payload.dre_mensal || []).map((r) => ({
    ano: num(r.ano), mes: num(r.mes), receita: num(r.receita), custosDiretos: num(r.custos_diretos),
    despesasOperacionais: num(r.despesas_operacionais), resultado: num(r.resultado), margem: num(r.margem),
  }));
  const balanco = (payload.balanco || []).map((r) => ({
    ano: num(r.ano), mes: num(r.mes), caixa: num(r.caixa), aReceberTotal: num(r.a_receber_total),
    aReceberVencido: num(r.a_receber_vencido), aReceberAVencer: num(r.a_receber_a_vencer),
    ativo: num(r.ativo), passivo: num(r.passivo), patrimonioLiquido: num(r.patrimonio_liquido),
  }));
  const analise = payload.analise_mensal ? {
    ano: num(payload.analise_mensal.ano), mes: num(payload.analise_mensal.mes),
    faturamento: num(payload.analise_mensal.faturamento), clientesFechados: num(payload.analise_mensal.clientes_fechados),
    restituicoes: num(payload.analise_mensal.restituicoes), inadimplencia: num(payload.analise_mensal.inadimplencia),
  } : null;
  const gastosCategoria = (payload.gastos_categoria || []).map((r) => ({
    ano: num(r.ano), mes: num(r.mes), nome: lbl(CATEGORIA, r.categoria, r.categoria), categoria: r.categoria,
    valor: num(r.total),
  }));
  return { painel, fluxoMensal, dreMensal, balanco, analise, gastosCategoria };
};

/* ---------- reference db shape -> API body (writes) ---------- */
export const contratoToApi = (c) => ({
  cliente: c.cliente, parceiro_id: c.parceiroId || null, numero_processo: c.processo || null,
  status: slug(STATUS_R, c.status, "proposta"), tipo_honorario: slug(TIPO_HON_R, c.tipoHonorario, "fixo_unico"),
  percentual_exito: num(c.pctExito), percentual_sucumbencia: num(c.pctSucumb), percentual_quota: num(c.pctQuota),
  honorario_fixo_total: num(c.fixoTotal), valor_causa: num(c.valorCausa),
  apelido_split: c.splitNick || null, observacoes: c.obs || null,
  data_proposta: c.dataProposta || null, data_fechamento: c.dataFechamento || null,
});

export const parcelaToApi = (p) => ({
  contrato_id: p.contratoId, tipo: slug(TIPO_PARC_R, p.tipo, "mensal"), valor: num(p.valor),
  mes_esperado: p.mesEsperado ? `${p.mesEsperado}-01` : null, observacoes: p.obs || null,
});

export const lancamentoToApi = (l, parcelaId) => ({
  data: l.data, descricao: l.descricao, tipo: l.tipo, valor: num(l.valor),
  categoria: slug(CATEGORIA_R, l.categoria, "outras_saidas"), forma_pagamento: l.forma || null,
  pago: l.pago !== false, contrato_id: l.contratoId || null,
  ...(parcelaId ? { parcela_id: parcelaId } : {}),
});

export const custoToApi = (f) => ({
  descricao: f.descricao, valor_mensal: num(f.valor), dia_vencimento: f.diaVenc || null,
  recorrente: f.recorrente !== false,
  mes_inicio: monthDate(f.mesInicio),
  mes_fim: f.mesFim ? monthDate(f.mesFim) : null,
});

export const tarefaToApi = (t) => ({
  titulo: t.titulo, descricao: t.descricao || null, contrato_id: t.contratoId || null,
  responsavel: t.resp || null, responsavel_id: t.responsavelId || null,
  prazo: t.prazo || null, data_inicio: t.dataInicio || null,
  status: tarefaStatusSlug(t.status), prioridade: tarefaPrioridadeSlug(t.prioridade),
  processo_id: t.processoId || null, numero_processo: t.processoNumero || null,
  estimativa_minutos: t.estimativaMinutos === "" || t.estimativaMinutos == null ? null : num(t.estimativaMinutos), observacoes: t.obs || null,
  tags: Array.isArray(t.tags) ? t.tags : [],
  origem: t.origemRaw || "manual",
});

export const processoToApi = (p) => ({
  area_pasta: p.areaPasta || null, numero_interno: p.numeroInterno || null,
  numero: p.numero, cliente: p.cliente || null, contrato_id: p.contratoId || null,
  status_processo: p.statusProcesso || null, autor: p.autor || null, reu: p.reu || null,
  assunto: p.assunto || null, andamento_atual: p.andamentoAtual || null,
  data_ultimo_andamento: p.ultimoAndamento || null,
  tribunal: p.tribunal || "TJSP", comarca_vara: p.comarca || null, fase_atual: p.fase || null,
  ativo: p.ativo !== false, monitorar: p.monitorar !== false,
});

export const paramsToApi = (p) => ({
  caixa_inicial_ano: num(p.caixaInicial), meta_caixa_ano: num(p.metaCaixa),
  meta_recorrencia_mensal: num(p.metaRecorrencia), recorrencia_atual: num(p.recorrenciaAtual),
});
