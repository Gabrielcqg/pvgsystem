from __future__ import annotations

import time
import unittest

import consulta_tjsp_lote as scraper


class AnaliseHtmlTJSPTests(unittest.TestCase):
    def analisar(self, html: str) -> dict:
        return scraper.analisar_html(html, url="https://teste.local/processo")

    def test_sucesso_direto_eproc_limita_tres_movimentacoes(self) -> None:
        html = """
        <table>
          <tr><th>Evento</th><th>Data/Hora</th><th>Descrição</th><th>Usuário</th></tr>
          <tr><td>40</td><td>10/07/2026 10:00</td><td>Evento 40</td><td>U1</td></tr>
          <tr><td>39</td><td>09/07/2026 10:00</td><td>Evento 39</td><td>U2</td></tr>
          <tr><td>38</td><td>08/07/2026 10:00</td><td>Evento 38</td><td>U3</td></tr>
          <tr><td>37</td><td>07/07/2026 10:00</td><td>Evento 37</td><td>U4</td></tr>
        </table>
        """
        snapshot = self.analisar(html)

        self.assertEqual(scraper.classificar_pagina(snapshot, scraper.PORTAL_TJSP), "resultado")
        self.assertEqual(snapshot["layout"], "eproc_eventos")
        self.assertEqual([item["evento"] for item in snapshot["movements"]], ["40", "39", "38"])

    def test_pagina_intermediaria_detecta_link_do_processo(self) -> None:
        html = """
        <section class="home__lista-de-processos">
          <a class="linkProcesso" href="/cpopg/show.do?processo.codigo=ABC">
            0001810-44.2016.8.26.0068
          </a>
        </section>
        """
        snapshot = self.analisar(html)

        self.assertEqual(scraper.classificar_pagina(snapshot, scraper.PORTAL_TJSP), "pagina_intermediaria")
        self.assertTrue(snapshot["intermediateFound"])
        self.assertEqual(snapshot["intermediateLinks"][0]["text"], "0001810-44.2016.8.26.0068")

    def test_senha_necessaria_por_campo_password(self) -> None:
        html = """
        <div role="dialog" aria-label="Senha do processo">
          <label>Digite a senha do processo</label>
          <input type="password" name="senhaProcesso" id="senhaProcesso">
        </div>
        """
        snapshot = self.analisar(html)

        self.assertEqual(scraper.classificar_pagina(snapshot, scraper.PORTAL_TJSP), "senha_necessaria")
        self.assertTrue(snapshot["accessRequired"])

    def test_popup_senha_oculto_nao_sobrepoe_movimentacoes(self) -> None:
        html = """
        <div id="popupSenha" style="display: none">
          <label>Digite a senha do processo</label>
          <input type="password" name="senhaProcesso" id="senhaProcesso">
        </div>
        <table>
          <tr class="containerMovimentacao">
            <td class="dataMovimentacao">17/07/2026</td>
            <td class="descricaoMovimentacao">Movimento visível</td>
          </tr>
        </table>
        """
        snapshot = self.analisar(html)

        self.assertFalse(snapshot["accessRequired"])
        self.assertEqual(scraper.classificar_pagina(snapshot, scraper.PORTAL_TJSP), "resultado")
        self.assertEqual(snapshot["movements"][0]["descricao"], "Movimento visível")

    def test_captcha_travado_gera_status_captcha_timeout(self) -> None:
        html = """
        <main>
          <p>Aguarde a verificação do captcha antes de continuar.</p>
        </main>
        """
        snapshot = self.analisar(html)
        resultado = scraper.resultado_terminal(
            "captcha_timeout",
            "Captcha não resolvido dentro do watchdog de 10s.",
            snapshot,
            time.perf_counter(),
        )

        self.assertEqual(scraper.classificar_pagina(snapshot, scraper.PORTAL_TJSP), "captcha")
        self.assertEqual(resultado["status"], "captcha_timeout")
        self.assertEqual(resultado["quantidade_movimentacoes"], 0)

    def test_processo_nao_localizado(self) -> None:
        html = """
        <div class="mensagem">
          Processo não localizado na base pública.
        </div>
        """
        snapshot = self.analisar(html)

        self.assertEqual(scraper.classificar_pagina(snapshot, scraper.PORTAL_TJSP), "nao_localizado")

    def test_container_movimentacao_com_mais_de_tres_linhas_limita_resultado(self) -> None:
        html = """
        <table>
          <tr class="fundoClaro containerMovimentacao" style="">
            <td class="dataMovimentacao">17/07/2026</td>
            <td class="descricaoMovimentacao">Movimento 1</td>
          </tr>
          <tr class="containerMovimentacao">
            <td class="dataMovimentacao">16/07/2026</td>
            <td class="descricaoMovimentacao">Movimento 2</td>
          </tr>
          <tr class="containerMovimentacao">
            <td class="dataMovimentacao">15/07/2026</td>
            <td class="descricaoMovimentacao">Movimento 3</td>
          </tr>
          <tr class="containerMovimentacao">
            <td class="dataMovimentacao">14/07/2026</td>
            <td class="descricaoMovimentacao">Movimento 4</td>
          </tr>
        </table>
        """
        snapshot = self.analisar(html)

        self.assertEqual(snapshot["layout"], "container_movimentacao")
        self.assertEqual(len(snapshot["movements"]), scraper.MAX_MOVIMENTACOES)
        self.assertEqual(
            [item["descricao"] for item in snapshot["movements"]],
            ["Movimento 1", "Movimento 2", "Movimento 3"],
        )

    def test_tabela_generica_data_movimento_tambem_limita_tres(self) -> None:
        html = """
        <table>
          <tr><th>Data</th><th>Movimento</th></tr>
          <tr><td>17/07/2026</td><td>Movimento A</td></tr>
          <tr><td>16/07/2026</td><td>Movimento B</td></tr>
          <tr><td>15/07/2026</td><td>Movimento C</td></tr>
          <tr><td>14/07/2026</td><td>Movimento D</td></tr>
        </table>
        """
        snapshot = self.analisar(html)

        self.assertEqual(snapshot["layout"], "tabela_generica_movimentacoes")
        self.assertEqual(len(snapshot["movements"]), scraper.MAX_MOVIMENTACOES)
        self.assertEqual(snapshot["movements"][0]["descricao"], "Movimento A")

    def test_resumo_normaliza_checkpoint_antigo_com_movimentacoes_excedentes(self) -> None:
        resultado_antigo = {
            "status": "sucesso",
            "quantidade_movimentacoes": 5433,
            "movimentacoes": [{"descricao": f"Movimento {index}"} for index in range(10)],
        }

        normalizado = scraper.normalizar_resultado_movimentacoes(resultado_antigo)
        resumo = scraper.resumo([resultado_antigo])

        self.assertEqual(normalizado["quantidade_movimentacoes"], scraper.MAX_MOVIMENTACOES)
        self.assertEqual(len(normalizado["movimentacoes"]), scraper.MAX_MOVIMENTACOES)
        self.assertEqual(resumo["total_movimentacoes"], scraper.MAX_MOVIMENTACOES)


if __name__ == "__main__":
    unittest.main()
