from __future__ import annotations

from decimal import Decimal

import pytest


@pytest.mark.calc
def test_calc_07_materialized_reports_match_from_scratch(clean_db) -> None:
    with clean_db.cursor() as cur:
        cur.execute("INSERT INTO parametros (ano, caixa_inicial_ano, meta_caixa_ano, meta_recorrencia_mensal, recorrencia_atual) VALUES (2026, 1000, 2000, 500, 250)")
        cur.execute("SELECT id FROM parceiros WHERE nome = 'Pavageau'")
        parceiro_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO contratos (
              cliente, parceiro_id, status, tipo_honorario, percentual_exito,
              percentual_sucumbencia, percentual_quota, valor_causa, data_proposta, data_fechamento
            ) VALUES ('Cliente A', %s, 'ativo', 'fixo_exito_sucumbencia', 0.30, 0.10, 0.40, 10000, '2026-01-10', '2026-01-20')
            RETURNING id
            """,
            (parceiro_id,),
        )
        contrato_id = cur.fetchone()[0]
        cur.execute(
            "INSERT INTO parcelas (contrato_id, tipo, valor, mes_esperado) VALUES (%s, 'mensal', 500, '2026-01-01')",
            (contrato_id,),
        )
        cur.execute(
            """
            INSERT INTO lancamentos (data, descricao, tipo, valor, categoria, pago, contrato_id)
            VALUES
              ('2026-01-05', 'Entrada', 'entrada', 1200, 'honorarios', true, %s),
              ('2026-01-06', 'Custas', 'saida', 200, 'custas_processuais', true, %s),
              ('2026-01-07', 'Infra aberta', 'saida', 100, 'infraestrutura', false, %s)
            """,
            (contrato_id, contrato_id, contrato_id),
        )
        cur.execute("INSERT INTO custos_fixos (descricao, valor_mensal, recorrente, mes_inicio) VALUES ('Contador', 300, true, '2026-01-01')")
        cur.execute("SELECT private.recalcular_mes(2026::smallint, 1::smallint)")

        cur.execute("SELECT entradas_pagas, saidas_pagas, resultado_mes, saldo_acumulado FROM ind_fluxo_mensal WHERE ano=2026 AND mes=1")
        assert cur.fetchone() == (Decimal("1200.00"), Decimal("200.00"), Decimal("1000.00"), Decimal("2000.00"))

        cur.execute("SELECT receita, custos_diretos, despesas_operacionais, resultado, margem FROM ind_dre_mensal WHERE ano=2026 AND mes=1")
        assert cur.fetchone() == (Decimal("1200.00"), Decimal("200.00"), Decimal("0.00"), Decimal("1000.00"), Decimal("0.8333"))

        cur.execute("SELECT caixa, a_receber_total, a_receber_vencido, ativo, passivo, patrimonio_liquido FROM ind_balanco WHERE ano=2026 AND mes=1")
        assert cur.fetchone() == (
            Decimal("2000.00"),
            Decimal("500.00"),
            Decimal("500.00"),
            Decimal("2500.00"),
            Decimal("100.00"),
            Decimal("2400.00"),
        )

        cur.execute("SELECT faturamento, clientes_fechados, inadimplencia FROM ind_analise_mensal WHERE ano=2026 AND mes=1")
        assert cur.fetchone() == (Decimal("1200.00"), 1, Decimal("500.00"))


@pytest.mark.calc
def test_calc_19_refresh_painel_uses_explicit_reference_month(clean_db) -> None:
    with clean_db.cursor() as cur:
        cur.execute("INSERT INTO parametros (ano, caixa_inicial_ano, meta_caixa_ano, meta_recorrencia_mensal, recorrencia_atual) VALUES (2026, 1000, 2000, 500, 250)")
        cur.execute("INSERT INTO lancamentos (data, descricao, tipo, valor, categoria, pago) VALUES ('2026-02-10', 'Entrada', 'entrada', 1000, 'honorarios', true)")
        cur.execute("INSERT INTO custos_fixos (descricao, valor_mensal, recorrente, mes_inicio) VALUES ('Contador', 250, true, '2026-01-01')")
        cur.execute("SELECT private.recalcular_mes(2026::smallint, 1::smallint)")
        cur.execute("SELECT private.refresh_painel(2026::smallint, 2::smallint)")
        cur.execute("SELECT mes_referencia, caixa_atual, custo_fixo_mensal, meses_reserva, percentual_meta_caixa, percentual_meta_recorrencia FROM ind_painel WHERE ano=2026")
        row = cur.fetchone()

    assert row == (
        2,
        Decimal("2000.00"),
        Decimal("250.00"),
        Decimal("8.00"),
        Decimal("1.0000"),
        Decimal("0.5000"),
    )
