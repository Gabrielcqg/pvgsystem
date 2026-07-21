from __future__ import annotations

import uuid

import pytest


@pytest.mark.security
def test_sec_02_auditoria_is_insert_only(clean_db) -> None:
    with clean_db.cursor() as cur:
        cur.execute("INSERT INTO auditoria (entidade, acao, valor_novo) VALUES ('teste', 'criar', '{\"ok\": true}') RETURNING id")
        audit_id = cur.fetchone()[0]
        with pytest.raises(Exception, match="auditoria is insert-only"):
            cur.execute("UPDATE auditoria SET acao = 'editar' WHERE id = %s", (audit_id,))
        with pytest.raises(Exception, match="auditoria is insert-only"):
            cur.execute("DELETE FROM auditoria WHERE id = %s", (audit_id,))


@pytest.mark.security
def test_sec_07_radar_worker_permissions_and_isolation(clean_db) -> None:
    processo_id = uuid.uuid4()
    with clean_db.cursor() as cur:
        cur.execute(
            "INSERT INTO processos (id, numero, tribunal) VALUES (%s, '0000000-00.2026.8.26.0001', 'TJSP')",
            (processo_id,),
        )
        cur.execute("SET ROLE radar_worker")
        cur.execute("SELECT valor FROM configuracoes WHERE chave = 'radar_cron'")
        assert cur.fetchone()[0] == "0 3 * * 1"
        cur.execute("INSERT INTO execucoes_radar (origem) VALUES ('agendada') RETURNING id")
        execucao_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO resultados_consulta (execucao_id, processo_id, numero_processo, tribunal, status)
            VALUES (%s, %s, '0000000-00.2026.8.26.0001', 'TJSP', 'sucesso')
            RETURNING id
            """,
            (execucao_id, processo_id),
        )
        resultado_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO movimentacoes_novas (execucao_id, processo_id, resultado_id, chave, descricao)
            VALUES (%s, %s, %s, 'abc', 'Movimento')
            """,
            (execucao_id, processo_id, resultado_id),
        )
        cur.execute(
            """
            UPDATE processos
            SET chaves_movimentacoes = ARRAY['abc'],
                data_ultimo_andamento = '2026-07-01',
                ultima_consulta_status = 'sucesso',
                ultima_consulta_em = now(),
                ultima_consulta_inconclusiva = false
            WHERE id = %s
            """,
            (processo_id,),
        )
        cur.execute(
            "INSERT INTO tarefas (titulo, origem, processo_id, numero_processo) VALUES ('Inercia', 'radar_inercia', %s, '0000000-00.2026.8.26.0001')",
            (processo_id,),
        )
        cur.execute("INSERT INTO auditoria (entidade, acao) VALUES ('radar', 'executar')")

        with pytest.raises(Exception, match="permission denied"):
            cur.execute("SELECT count(*) FROM lancamentos")
        with pytest.raises(Exception, match="permission denied"):
            cur.execute("SELECT count(*) FROM ind_painel")
        with pytest.raises(Exception, match="permission denied"):
            cur.execute("SELECT count(*) FROM auth.users")
        with pytest.raises(Exception, match="permission denied"):
            cur.execute("UPDATE processos SET senha_ref = 'vault:00000000-0000-0000-0000-000000000000' WHERE id = %s", (processo_id,))
        with pytest.raises(Exception):
            cur.execute("INSERT INTO tarefas (titulo, origem) VALUES ('Manual proibida', 'manual')")

        cur.execute("RESET ROLE")
