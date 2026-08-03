import { describe, expect, it } from "vitest";

import { processoToApi, toProcesso, toRadarAutomacao, toRadarMov, toRadarRun, toTarefa } from "../reference/adapters";

describe("reference adapters", () => {
  it("keeps last movement date separate from last radar attempt", () => {
    const processo = toProcesso({
      id: "p1",
      numero: "0000001-00.2026.8.26.0001",
      tribunal: "TJSP",
      data_ultimo_andamento: "2026-06-20",
      ultima_consulta_em: "2026-07-26T12:00:00Z",
    });

    expect(processo.ultimoAndamento).toBe("2026-06-20");
    expect(processo.ultimaTentativa).toBe("2026-07-26T12:00:00Z");
    expect(processoToApi(processo).data_ultimo_andamento).toBe("2026-06-20");
  });

  it("preserves radar inertia task keys for radar visualization", () => {
    const tarefa = toTarefa({
      id: "t1",
      titulo: "Acompanhar processo parado",
      origem: "radar_inercia",
      processo_id: "p1",
      numero_processo: "0000001-00.2026.8.26.0001",
      radar_inercia_chave: "radar_inercia:p1:2026-06-20:30",
    });

    expect(tarefa.origem).toBe("radar");
    expect(tarefa.origemRaw).toBe("radar_inercia");
    expect(tarefa.radarInerciaChave).toBe("radar_inercia:p1:2026-06-20:30");
  });

  it("maps radar automation fields from API responses", () => {
    const mov = toRadarMov({
      id: "m1",
      processo_id: "p1",
      numero_processo: "0000001-00.2026.8.26.0001",
      cliente: "E2E_TEST",
      data_hora: "26/07/2026 11:00:00",
      descricao: "Intimação publicada",
      evento: "Publicação",
      classificacao_status: "reconhecida",
      regra_nome: "Intimação - sugestão de análise",
      automacao_execucao_id: "ae1",
      automacao_status: "aguardando_aprovacao",
      automacao_gatilho: "tarefa_concluida",
      tarefa_anterior_id: "t0",
      tarefa_anterior_titulo: "Analisar contestação",
      payload_tarefa_sugerida: { titulo: "Analisar intimação" },
    });
    expect(mov.data).toBe("26/07/2026");
    expect(mov.evento).toBe("Publicação");
    expect(mov.classificacaoStatus).toBe("reconhecida");
    expect(mov.automacaoId).toBe("ae1");
    expect(mov.automacaoGatilho).toBe("tarefa_concluida");
    expect(mov.tarefaAnteriorTitulo).toBe("Analisar contestação");
    expect(mov.sugestao.titulo).toBe("Analisar intimação");

    const automacao = toRadarAutomacao({
      id: "ae1",
      status: "aguardando_aprovacao",
      movimentacao_id: "m1",
      processo_id: "p1",
      regra_nome: "Intimação - sugestão de análise",
      gatilho: "tarefa_concluida",
      tarefa_anterior_id: "t0",
      tarefa_anterior_titulo: "Analisar contestação",
      payload_tarefa_sugerida: { titulo: "Analisar intimação" },
      movimentacao_data_hora: "26/07/2026 11:00:00",
      numero_processo: "0000001-00.2026.8.26.0001",
    });
    expect(automacao.status).toBe("aguardando_aprovacao");
    expect(automacao.numero).toBe("0000001-00.2026.8.26.0001");
    expect(automacao.sugestao.titulo).toBe("Analisar intimação");
    expect(automacao.gatilho).toBe("tarefa_concluida");
    expect(automacao.tarefaAnteriorId).toBe("t0");
  });

  it("keeps radar result process ids and statuses when results are already adapted", () => {
    const execucao = { id: "run1", status: "concluida", total_previstos: 2, total_consultados: 2 };
    const primeiroMapeamento = toRadarRun(execucao, [
      { processo_id: "p1", status: "sucesso", tem_movimentacao_nova: false },
      { processo_id: "p2", status: "captcha_timeout", mensagem_erro: "Captcha pendente" },
    ]);

    const remapeado = toRadarRun(execucao, primeiroMapeamento.resultados);

    expect(remapeado.resultados).toEqual([
      expect.objectContaining({ processoId: "p1", status: "sem_novidade" }),
      expect.objectContaining({ processoId: "p2", status: "nao_verificado", detalhe: "Captcha pendente" }),
    ]);
  });

  it("maps radar generated task metadata for Kanban cards", () => {
    const tarefa = toTarefa({
      id: "t1",
      titulo: "Analisar intimação",
      origem: "radar_movimentacao",
      processo_id: "p1",
      movimentacao_id: "m1",
      radar_automacao_execucao_id: "ae1",
      radar_regra_id: "r1",
      radar_regra_nome: "Intimação - sugestão de análise",
      radar_proxima_automacao: { execucao: { id: "ae2", status: "aguardando_aprovacao" } },
      criada_automaticamente: true,
      movimentacao_data_hora: "26/07/2026 11:00:00",
      movimentacao_descricao: "Intimação publicada",
    });
    expect(tarefa.origem).toBe("radar");
    expect(tarefa.criadaAutomaticamente).toBe(true);
    expect(tarefa.radarAutomacaoId).toBe("ae1");
    expect(tarefa.radarRegraNome).toContain("Intimação");
    expect(tarefa.radarProximaAutomacao.execucao.id).toBe("ae2");
    expect(tarefa.movimentacaoDescricao).toBe("Intimação publicada");
  });
});
