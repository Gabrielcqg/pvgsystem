# FRONTEND REFERENCE — PAVAGEAU SISTEMA INTEGRADO

> **Status deste documento:** especificação visual e comportamental autoritativa.
>
> O frontend existente foi aprovado e deve ser reproduzido com **fidelidade visual muito alta**. Este arquivo não é uma sugestão de redesign. Ele é a referência que o Codex deve seguir ao implementar, reorganizar, componentizar ou conectar o frontend ao backend.
>
> **Regra principal:** alterações técnicas, de arquitetura, banco, autenticação, API, roteamento ou estado não podem mudar a aparência, a densidade, a hierarquia, a paleta, a tipografia ou o comportamento visual descritos aqui.

---

## 1. OBJETIVO DA INTERFACE

A interface deve parecer um **sistema financeiro-jurídico interno, sóbrio, confiável e editorial**, e não um dashboard SaaS genérico.

A sensação visual desejada combina:

- escritório de advocacia tradicional e sofisticado;
- sistema financeiro organizado e auditável;
- leitura rápida de números e pendências;
- aparência limpa, compacta e profissional;
- contraste entre dados digitados e dados calculados;
- ausência de elementos decorativos desnecessários;
- forte consistência entre todas as telas.

O sistema deve comunicar que:

1. os dados estão conectados;
2. os números importantes são calculados automaticamente;
3. cada informação tem origem rastreável;
4. a interface reduz erro operacional;
5. o escritório não depende mais de planilhas soltas.

---

## 2. PRINCÍPIOS NÃO NEGOCIÁVEIS

### 2.1. Não transformar em um dashboard moderno genérico

Não usar:

- gradientes chamativos;
- glassmorphism;
- sombras grandes e difusas;
- cards excessivamente arredondados;
- ícones coloridos sem função;
- fundos em degradê;
- elementos flutuantes;
- ilustrações de banco de imagens;
- roxo, ciano, neon ou azul elétrico;
- layout com cards muito grandes e pouco conteúdo;
- excesso de espaço vazio;
- tipografia exclusivamente sans-serif;
- visual parecido com template padrão de Tailwind, Material UI ou shadcn sem customização.

### 2.2. Preservar a densidade

A interface é propositalmente compacta. Ela deve exibir bastante informação sem parecer apertada.

- cards usam padding entre `13px` e `17px`;
- tabelas usam linhas de aproximadamente `35px` a `40px`;
- textos auxiliares ficam entre `9px` e `11.5px`;
- títulos de cards ficam em torno de `16px`;
- títulos de página ficam em torno de `24px`;
- os gaps principais ficam entre `8px` e `12px`.

Não aumentar indiscriminadamente os espaçamentos.

### 2.3. Sem bordas arredondadas exageradas

O raio visual padrão é praticamente reto:

- botões: `2px`;
- inputs: `2px`;
- tags: `2px`;
- cards: sem border-radius ou, no máximo, `2px`;
- tooltips: `2px`;
- barras pequenas: `2px` a `3px` apenas quando necessário.

Não usar `rounded-lg`, `rounded-xl`, `rounded-2xl` ou equivalentes nos componentes principais.

### 2.4. Sombras não são parte da identidade

Cards e áreas são separados por:

- cor de fundo;
- bordas finas;
- linhas superiores;
- linhas laterais;
- contraste de tons.

Não adicionar box-shadow aos cards. A única animação com sombra é o pulso dourado temporário da cadeia de atualização.

### 2.5. O dourado é acento, não fundo dominante

O dourado deve destacar:

- subtítulos de seção;
- estado ativo especial;
- borda de foco;
- CTA de importação;
- indicadores ou projeções;
- separadores editoriais;
- informações “fora do balanço”;
- visual de campos de parâmetros.

Não preencher grandes áreas da interface com dourado.

---

## 3. DESIGN TOKENS OBRIGATÓRIOS

### 3.1. Paleta principal

Usar exatamente estes tokens como referência:

```css
:root {
  --navy: #1E2A56;
  --navy-deep: #151D3E;
  --navy-soft: #2C3B6E;
  --navy-line: #33417A;

  --gold: #C9A24D;
  --gold-soft: #E6D2A0;
  --gold-pale: #FDF7E8;

  --paper: #F5F6FA;
  --surface: #FFFFFF;
  --line: #E3E6EE;
  --ink: #1E2A56;
  --ink-soft: #79829C;

  --green: #1C7A4E;
  --red: #A8322D;
  --amber: #B07D18;

  --calculated-bg: #EEF0F6;
  --danger-soft: #FDF6F5;
  --danger-line: #F0D4D2;
  --chart-hover: #F0F2F7;
  --tag-bg: #EDF0F8;
}
```

### 3.2. Função de cada cor

| Token | Uso principal |
|---|---|
| `navy-deep` | fundo da sidebar |
| `navy` | botões primários, faixa da cadeia, linhas fortes, gráficos, títulos numéricos |
| `navy-soft` | item ativo da navegação |
| `navy-line` | separadores internos da sidebar |
| `gold` | acento de marca, foco, CTA especial, títulos auxiliares |
| `gold-soft` | texto claro sobre fundo azul-marinho |
| `gold-pale` | fundo de projeção, parâmetros e destaques sutis |
| `paper` | fundo geral da aplicação e fundos auxiliares |
| `surface` | cards, header, inputs e tabelas |
| `line` | borda padrão |
| `ink` | texto principal |
| `ink-soft` | texto secundário e rótulos |
| `green` | entradas, valores positivos, concluídos e recebido |
| `red` | saídas, atraso, erro, inadimplência e exclusão |
| `amber` | pendência, alerta e aguardando êxito |
| `calculated-bg` | células calculadas automaticamente |

### 3.3. Contraste

- texto principal sobre branco: `#1E2A56`;
- texto secundário sobre branco: `#79829C`;
- texto principal sobre sidebar: branco;
- texto secundário sobre sidebar: `#A9B2CC`, `#7C86A6` ou `#5F6A8C`;
- acento sobre sidebar: `#C9A24D` ou `#E6D2A0`;
- nunca usar cinza preto puro como texto principal;
- nunca usar preto puro `#000000`.

---

## 4. TIPOGRAFIA

### 4.1. Famílias

```css
--font-display: "Playfair Display", Georgia, serif;
--font-body: "IBM Plex Sans", system-ui, sans-serif;
--font-mono: "IBM Plex Mono", monospace;
```

Carregar pelo Google Fonts ou via assets locais do projeto:

- Playfair Display: pesos `500` e `700`;
- IBM Plex Sans: pesos `400`, `500` e `600`;
- IBM Plex Mono: pesos `400`, `500` e `600`.

### 4.2. Papel de cada fonte

**Playfair Display**

- marca “PAVAGEAU”;
- título principal da página;
- título de cards;
- valores grandes de KPI;
- números editoriais de destaque;
- títulos de modais.

**IBM Plex Sans**

- navegação;
- labels;
- textos explicativos;
- botões;
- tabelas;
- formulários;
- mensagens do sistema.

**IBM Plex Mono**

- valores monetários em tabelas;
- datas;
- número de processo;
- percentuais técnicos;
- saldos e totais;
- contagens técnicas;
- conferências contábeis.

### 4.3. Escala tipográfica

| Elemento | Tamanho | Peso | Fonte |
|---|---:|---:|---|
| Marca na sidebar | `20px` | `700` | Display |
| Título da página | `24px` | `700` | Display |
| Título grande do estado vazio | `30px` | `700` | Display |
| Título do laudo | `26px` | `700` | Display |
| Título do modal | `19px` | `700` | Display |
| Título do card | `16px` | `700` | Display |
| Nome do cliente no contrato | `17px` | `700` | Display |
| Valor do KPI | `25px` | `700` | Display |
| Valor editorial médio | `30px` a `44px` | `700` | Display |
| Margem em destaque | `58px` | `700` | Display |
| Texto padrão | `12.5px` a `13.5px` | `400` | Body |
| Texto secundário | `10.5px` a `11.5px` | `400` | Body |
| Label uppercase | `8.5px` a `9.5px` | `600` | Body |
| Valor monetário em tabela | `11.5px` a `13.5px` | `600` | Mono |

### 4.4. Letras maiúsculas e tracking

Labels de seção devem usar:

```css
font-size: 8.5px a 9.5px;
font-weight: 600;
letter-spacing: 0.10em a 0.20em;
text-transform: uppercase;
```

O tracking alto é parte importante do visual editorial.

---

## 5. ESTRUTURA GLOBAL DA APLICAÇÃO

### 5.1. Canvas geral

```css
body/app {
  min-height: 100vh;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
}
```

A aplicação é dividida horizontalmente em:

1. sidebar fixa de `210px`;
2. área principal flexível.

```css
.app-shell {
  display: flex;
  min-height: 100vh;
}
```

### 5.2. Sidebar

Dimensões e comportamento:

```css
.sidebar {
  width: 210px;
  min-width: 210px;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  background: var(--navy-deep);
  color: #fff;
}
```

A sidebar nunca deve parecer um drawer flutuante no desktop.

#### Cabeçalho da sidebar

- padding horizontal: `20px`;
- padding inferior: `20px`;
- borda inferior: `1px solid navy-line`;
- “PAVAGEAU” em Playfair Display, `20px`, bold, tracking `.06em`;
- “SISTEMA INTEGRADO” em `9px`, tracking `.2em`, dourado;
- distância entre marca e subtítulo: `3px`.

#### Grupos de navegação

Grupos obrigatórios:

- PAINEL
- CONTRATOS
- FINANCEIRO
- OPERAÇÃO

Rótulo de grupo:

- `8.5px`;
- tracking `.2em`;
- cor `#5F6A8C`;
- peso `600`;
- padding `6px 20px 3px`.

Item de navegação:

```css
.nav-item {
  width: 100%;
  display: block;
  padding: 8px 20px;
  text-align: left;
  border: 0;
  border-left: 2px solid transparent;
  background: transparent;
  color: #A9B2CC;
  font-size: 13px;
}
```

Item ativo:

```css
.nav-item[aria-current="page"] {
  background: var(--navy-soft);
  border-left-color: var(--gold);
  color: #fff;
}
```

Hover:

- texto vira `gold-soft`;
- não criar fundo novo no hover;
- não deslocar item;
- sem escala.

#### Rodapé da sidebar

- fixado no fim pelo `flex: 1` do nav;
- borda superior `1px solid navy-line`;
- padding `14px 20px`;
- texto `10px`, cor `#7C86A6`;
- ponto de status verde com `5px` de diâmetro;
- texto mostra contagem de lançamentos e contratos.

### 5.3. Área principal

```css
.main {
  flex: 1;
  min-width: 0;
}
```

O `min-width: 0` é obrigatório para evitar overflow causado por tabelas e gráficos.

### 5.4. Header principal

```css
.page-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #fff;
  border-bottom: 1px solid var(--line);
  padding: 16px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
```

Lado esquerdo:

- mês atual em uppercase, dourado, `9px`, tracking `.2em`, peso `600`;
- título da tela em Playfair Display, `24px`, peso `700`;
- margem entre eyebrow e título: `2px`.

Lado direito:

- dois botões lado a lado;
- gap `8px`;
- primeiro ghost “+ Contrato”;
- segundo primário “+ Lançamento”.

### 5.5. Conteúdo principal

```css
.page-content {
  padding: 20px 28px 60px;
}
```

Não centralizar toda a aplicação em container estreito. O conteúdo deve usar a largura disponível.

---

## 6. FAIXA “CADEIA”

A faixa da cadeia fica imediatamente abaixo do header, em todas as telas.

```css
.chain-bar {
  min-height: 40px;
  padding: 8px 28px;
  background: var(--navy);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
```

### 6.1. Conteúdo

- label inicial: “CADEIA”;
- etapas: “Lançamento”, “Fluxo de caixa”, “DRE”, “Balanço”;
- setas `→` entre etapas;
- mensagem temporária ao final.

### 6.2. Estados das etapas

Estado inativo:

- fundo transparente;
- texto `#7A85AB`;
- borda `#3B4778`.

Estado já percorrido:

- texto `gold-soft`;
- borda dourada.

Estado ativo:

- fundo dourado;
- texto `navy-deep`;
- peso `600`;
- animação de pulso dourado;
- padding `3px 9px`;
- tamanho `10.5px`;
- radius `2px`.

### 6.3. Animação

```css
@keyframes pulseGold {
  0% { box-shadow: 0 0 0 0 rgba(201, 162, 77, .6); }
  100% { box-shadow: 0 0 0 13px rgba(201, 162, 77, 0); }
}
```

A cadeia deve ser usada como feedback visual após ações que alteram relatórios. Ela não deve ficar animando continuamente.

---

## 7. SISTEMA DE ESPAÇAMENTO

Usar a seguinte escala como referência:

```css
--space-1: 3px;
--space-2: 5px;
--space-3: 7px;
--space-4: 8px;
--space-5: 9px;
--space-6: 10px;
--space-7: 11px;
--space-8: 12px;
--space-9: 13px;
--space-10: 14px;
--space-11: 15px;
--space-12: 16px;
--space-13: 17px;
--space-14: 18px;
--space-15: 20px;
--space-16: 22px;
--space-17: 24px;
--space-18: 28px;
```

Padrões principais:

- gap entre cards irmãos: `10px`;
- margem entre blocos grandes: `22px` a `26px`;
- padding de card: `15px 17px`;
- padding de KPI: `13px 15px`;
- padding de célula de tabela: `8px 9px` ou `9px 9px`;
- gap de formulário: `11px`;
- gap entre botões: `8px` ou `9px`.

---

## 8. COMPONENTES BASE

## 8.1. Card padrão

```css
.card {
  background: #fff;
  border: 1px solid var(--line);
  padding: 15px 17px;
  border-radius: 0;
}
```

Cabeçalho do card:

- título em Playfair Display, `16px`, peso `700`;
- subtítulo em `11.5px`, cor `ink-soft`, margem superior `2px`;
- ação textual alinhada à direita;
- ação usa link sublinhado, `11px`, peso `600`.

Não adicionar sombra.

## 8.2. KPI

Estrutura:

- card branco;
- borda padrão;
- linha superior de `2.5px` na cor semântica;
- padding `13px 15px`;
- label uppercase `9.5px`, tracking `.1em`;
- valor em Playfair Display `25px`, peso `700`;
- legenda `10.5px`, cor secundária.

Quando o KPI exige atenção, a borda externa inteira também pode receber a cor semântica.

## 8.3. Faixa de seção

Componente usado para dividir grupos de conteúdo:

- texto uppercase;
- `9px`;
- tracking `.18em`;
- cor `ink-soft`;
- linha horizontal de `1px` preenchendo o restante;
- gap `10px`;
- margin-bottom `10px`.

Exemplos:

- COMO ESTOU
- O QUE EXIGE AÇÃO HOJE
- ANÁLISES DO MÊS — RECALCULADAS A CADA LANÇAMENTO
- PARA ONDE VOU

## 8.4. Tags

```css
.tag {
  font-size: 9px;
  letter-spacing: .06em;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 6px;
  border: 1px solid color-mix(in srgb, currentColor 27%, transparent);
  border-radius: 2px;
  white-space: nowrap;
  background: transparent;
}
```

Tags não devem parecer pills grandes.

## 8.5. Botão primário

```css
.button-primary {
  background: var(--navy);
  color: #fff;
  border: none;
  padding: 9px 17px;
  font-size: 12.5px;
  font-weight: 500;
  border-radius: 2px;
}
```

## 8.6. Botão ghost

```css
.button-ghost {
  background: #fff;
  color: var(--ink);
  border: 1px solid var(--line);
  padding: 9px 15px;
  font-size: 12.5px;
  border-radius: 2px;
}
```

## 8.7. Botão dourado

```css
.button-gold {
  background: var(--gold);
  color: var(--navy-deep);
  border: none;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 2px;
}
```

## 8.8. Link de ação

```css
.link-action {
  background: transparent;
  border: 0;
  color: var(--navy);
  font-size: 11px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: 0;
}
```

## 8.9. Chips de filtro

Inativo:

- fundo branco;
- borda `line`;
- texto `ink-soft`.

Ativo:

- fundo `navy`;
- borda `navy`;
- texto branco.

Dimensões:

- padding `5px 12px`;
- font-size `11.5px`;
- radius `2px`.

## 8.10. Inputs e selects

```css
.field {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 2px;
  background: #fff;
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 12.5px;
}
```

Foco:

```css
.field:focus {
  outline: 2px solid var(--gold);
  outline-offset: -1px;
}
```

Labels:

- `9px`;
- uppercase;
- tracking `.1em`;
- peso `600`;
- cor `ink-soft`;
- margin-bottom `4px`.

Campos monetários, datas, percentuais e processos devem usar IBM Plex Mono.

## 8.11. Campo de parâmetro ou valor estrutural

Campos que representam parâmetros importantes usam:

- fundo `gold-pale`;
- borda dourada;
- valor em mono;
- peso `600`.

Isso é usado, por exemplo, em:

- caixa inicial;
- meta de caixa;
- meta de recorrência;
- recorrência atual;
- valor da causa no cadastro do contrato.

## 8.12. Nota explicativa

```css
.note {
  background: var(--paper);
  border-left: 2px solid var(--gold);
  padding: 9px 12px;
  margin-top: 14px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-soft);
}
```

## 8.13. Rodapé de card

- borda superior `1px solid line`;
- margin-top `12px`;
- padding-top `9px`;
- font-size `11px`;
- line-height `1.6`;
- cor `ink-soft`.

## 8.14. Estado vazio

```css
.empty-state {
  padding: 26px 0;
  text-align: center;
  font-size: 12.5px;
  color: var(--ink-soft);
}
```

Não usar ilustração grande no estado vazio de cards.

---

## 9. TABELAS

### 9.1. Estrutura

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  margin-top: 8px;
}
```

Tabelas largas devem ficar dentro de container com `overflow-x: auto`.

### 9.2. Cabeçalho

- borda inferior forte: `1.5px solid navy`;
- texto uppercase;
- font-size `9px`;
- tracking `.11em`;
- peso `600`;
- cor `ink-soft`;
- padding `8px 9px`.

### 9.3. Corpo

- padding de célula `9px`;
- borda inferior `1px solid line`;
- hover da linha: `#FAFBFD`;
- valores monetários alinhados à direita;
- números monetários usam mono;
- entradas em verde;
- saídas em vermelho;
- texto secundário em `ink-soft`.

### 9.4. Linha de alerta

Parcelas ou tarefas atrasadas:

- fundo `#FDF6F5`;
- borda ou texto vermelho;
- sem animação agressiva;
- pode exibir `⚠` ao lado do mês.

### 9.5. Linha do mês atual

Na tabela anual de fluxo:

- fundo `gold-pale`;
- nome do mês em peso `600`.

---

## 10. DIFERENCIAÇÃO ENTRE DADO DIGITADO E DADO CALCULADO

Essa diferenciação é parte central da experiência.

### 10.1. Dado digitado

- fundo branco;
- sem cadeado;
- aparência padrão;
- valor normalmente em mono quando numérico.

### 10.2. Dado calculado

- fundo `calculated-bg`;
- pequeno ícone `🔒` antes do label;
- label uppercase `8.5px`;
- valor em mono `13.5px`, peso `600`;
- pode usar verde, âmbar ou azul conforme o significado.

### 10.3. Regra de conteúdo

Sempre que possível, explicar que o campo é calculado:

- “🔒 calculado — não há campo”;
- “o sistema calcula”;
- “prévia calculada”;
- “recalculado a cada lançamento”.

O cadeado não é apenas decoração: ele comunica que o usuário não deve editar aquele número.

---

## 11. GRÁFICOS

Biblioteca de referência: Recharts.

### 11.1. Gráfico de gastos por categoria

- gráfico de barras horizontal;
- altura aproximada: `190px`;
- eixo X oculto;
- eixo Y com nomes das categorias;
- largura do eixo Y: `126px`;
- barra: `13px` de altura;
- cor padrão das barras: `navy`;
- categoria “Restituição ao cliente”: dourado;
- radius apenas na extremidade direita: `[0, 2, 2, 0]`;
- cursor do tooltip: `#F0F2F7`;
- tooltip branco com borda fina e radius `2px`.

### 11.2. Gráfico de caixa anual

- line chart;
- altura aproximada: `210px`;
- linha `navy`, largura `2.5px`;
- pontos com raio `2.5px`;
- ponto ativo dourado com raio `5px`;
- grid horizontal tracejado `2 4`;
- sem grid vertical;
- eixo Y em mono e valores compactos;
- eixo X com abreviações dos meses em minúsculas;
- sem preenchimento de área;
- sem gradiente.

### 11.3. Regras gerais

- gráficos devem parecer parte do sistema, não widgets externos;
- não usar legendas grandes;
- não usar cores arco-íris;
- não usar donuts decorativos;
- tooltip segue tipografia IBM Plex Sans;
- valores do tooltip são formatados em BRL.

---

## 12. MODAIS

### 12.1. Overlay

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(21, 29, 62, .55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
```

### 12.2. Container

```css
.modal-panel {
  width: 100%;
  max-width: 600px;
  max-height: 92vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 0;
}
```

### 12.3. Cabeçalho do modal

- fundo `navy`;
- texto branco;
- padding `15px 20px`;
- sticky no topo do modal;
- eyebrow dourado, `9px`, tracking `.18em`;
- título em Playfair Display `19px`, peso `700`.

### 12.4. Corpo

- padding `18px 20px`;
- formulário em grid de duas colunas;
- gap `11px`;
- campos marcados `full` ocupam as duas colunas.

### 12.5. Rodapé de ações

- alinhado à direita;
- gap `8px`;
- margin-top `18px`;
- botão cancelar ghost;
- botão salvar primário;
- estado disabled usa fundo `#C3C9D8` e cursor `not-allowed`.

### 12.6. Fechamento

- clicar no overlay fecha;
- clicar dentro não fecha;
- botão Cancelar fecha;
- tecla Esc deve fechar na implementação real;
- foco deve ficar preso dentro do modal;
- após fechar, foco volta ao elemento que abriu.

---

## 13. ANIMAÇÕES E INTERAÇÕES

### 13.1. Entrada de cards

```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(9px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.card {
  animation: slideUp .3s ease both;
}
```

### 13.2. Hover de botão

```css
.button:hover {
  filter: brightness(1.12);
}
```

Não usar `transform: scale()`.

### 13.3. Foco

- inputs/selects: outline dourado interno;
- botões: outline dourado externo;
- foco visível nunca deve ser removido.

### 13.4. Movimento reduzido

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 14. MAPA DE NAVEGAÇÃO

A navegação deve manter esta estrutura e esta ordem:

```text
PAINEL
└── Painel

CONTRATOS
├── Contratos
└── Parcelas

FINANCEIRO
├── Lançamentos
├── Custos fixos
├── Fluxo de caixa
├── DRE
└── Balanço

OPERAÇÃO
├── Tarefas
├── Migração
└── Ajustes
```

Não mover “Migração” para configurações. Ela faz parte da operação e do diagnóstico inicial.

---

## 15. ESPECIFICAÇÃO POR TELA

# 15.1. Painel — estado vazio

Quando não existem contratos nem lançamentos, o Painel exibe um único card de introdução.

### Container

- largura máxima: `720px`;
- fundo branco;
- borda padrão;
- padding `40px 36px`;
- alinhado à esquerda do conteúdo, não centralizado na tela.

### Conteúdo

1. eyebrow “SISTEMA VAZIO”;
2. título “Do zero, e desta vez tudo conversa”;
3. parágrafo explicativo com largura máxima `560px`, `13.5px`, line-height `1.7`;
4. grid de duas colunas;
5. bloco “VOCÊ PREENCHE” com borda esquerda dourada;
6. bloco “🔒 O SISTEMA CALCULA” com borda esquerda cinza;
7. três botões em linha.

### CTA principal

“Importar o histórico dos dois Excel”:

- fundo dourado;
- texto `navy-deep`;
- peso `600`.

A ordem dos botões deve ser:

1. Importar histórico;
2. Configurar do zero;
3. Dados de exemplo.

# 15.2. Painel — com dados

A tela é organizada em cinco blocos.

## Bloco A — “Como estou”

Grid responsivo:

```css
grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
gap: 10px;
margin-bottom: 26px;
```

KPIs:

1. Caixa hoje;
2. Faturamento do mês;
3. A receber;
4. Inadimplência.

Sem trocar a ordem.

## Bloco B — “O que exige ação hoje”

Grid de duas colunas iguais:

- Parcelas em atraso;
- Tarefas.

Cada card lista itens em linhas compactas, com valor ou prazo alinhado à direita.

## Bloco C — “Análises do mês”

Primeira linha:

- Gastos e categorias;
- Clientes fechados.

Segunda linha:

- Restituições;
- Inadimplência.

### Clientes fechados

- percentual de conversão em Playfair Display `44px`;
- barra horizontal de progresso com altura `6px`;
- três mini indicadores;
- rodapé com propostas em aberto.

## Bloco D — “Para onde vou”

Grid `2fr 1fr`:

- gráfico de caixa anual;
- card “Saúde”.

Card Saúde deve listar:

- custo fixo mensal;
- meses de reserva;
- recorrência atual;
- percentual de receita recorrente;
- falta para a meta.

# 15.3. Contratos

## Cabeçalho “Ciclo do cliente”

Um card contém cinco filtros de status, em cinco colunas:

1. Proposta;
2. Ativo;
3. Aguardando êxito;
4. Encerrado;
5. Sem êxito.

Cada bloco tem:

- borda superior de `2.5px` na cor do status;
- label uppercase;
- número em Playfair Display `24px`;
- fundo branco;
- quando selecionado, fundo `paper` e borda colorida.

### Cores dos status

| Status | Cor |
|---|---|
| Proposta | `ink-soft` |
| Ativo | `navy` |
| Aguardando êxito | `amber` |
| Encerrado | `green` |
| Sem êxito | `red` |

## Lista de contratos

Cada contrato é um card próprio:

- fundo branco;
- borda padrão;
- borda esquerda `2.5px` com a cor do status;
- padding `15px 17px`;
- margin-bottom `9px`.

### Cabeçalho do contrato

- nome do cliente em Display `17px`;
- tags de status, tipo, parceiro, aba de origem e duplicidade;
- processo em mono `11px`;
- “sem processo distribuído” quando vazio;
- botão dourado “Registrar fechamento” apenas para propostas.

### Faixa de números

Grid auto-fit com mínimo `128px`:

1. Fixo total — digitado;
2. Fixo recebido — calculado, verde;
3. Fixo pendente — calculado, âmbar;
4. Valor da causa — digitado.

O grid usa gap de `1px` com fundo `line`, criando divisórias finas.

### Projeção

Exibir quando houver êxito ou sucumbência.

- fundo `paper`;
- borda padrão;
- padding `11px 13px`;
- label “PROJEÇÃO · QUOTA DO PARCEIRO X%”;
- tabela com colunas Total, Parceiro e Escritório;
- Escritório em azul-marinho e peso `600`;
- Parceiro em texto secundário.

### Parcelas do contrato

- label “PARCELAS”;
- contador recebidas/total em mono;
- barra de progresso de `3px`;
- ação “+ parcela”;
- não exibir esse bloco para propostas.

# 15.4. Parcelas

## KPIs superiores

1. A receber;
2. Em atraso;
3. Fixo pendente;
4. Receita realizada.

## Card principal

- título “Parcelas”;
- subtítulo explicando que registrar recebimento cria lançamento;
- filtros: Em aberto, Recebidas, Todas;
- tabela completa.

### Colunas

1. Cliente;
2. Parceiro;
3. Tipo;
4. Mês esperado;
5. Valor;
6. Recebido?;
7. Mês efetivo;
8. Obs;
9. Ação.

### Estados

Parcela atrasada:

- fundo danger-soft;
- mês esperado em vermelho;
- peso `600`;
- símbolo `⚠`.

Recebida:

- “✓ Sim” verde;
- ação “estornar” como link sublinhado.

Não recebida:

- “Não” em âmbar ou vermelho;
- botão “Registrar recebimento”;
- botão vermelho quando atrasada;
- botão azul-marinho quando dentro do prazo.

# 15.5. Lançamentos

Card único com:

- título “Lançamentos”;
- subtítulo “O único lugar onde se digita dinheiro. O resto se calcula.”;
- ação “+ Novo lançamento”;
- chips Todos, Entradas, Saídas;
- tabela.

### Colunas

1. Data;
2. Descrição;
3. Categoria;
4. Cliente;
5. Forma;
6. Pago;
7. Origem;
8. Valor.

### Origem

| Origem | Texto | Cor |
|---|---|---|
| manual | manual | ink-soft |
| parcela | ↳ PARCELA | navy |
| fixo | ↳ CUSTO FIXO | amber |
| importado | ↳ EXCEL | gold |

Origem não manual recebe:

- fundo `#EDF0F8`;
- padding `2px 6px`;
- tamanho `9px`;
- peso `600`.

### Valor

- entrada: prefixo `+`, verde;
- saída: prefixo `−`, vermelho;
- alinhamento à direita;
- fonte mono;
- peso `600`.

# 15.6. Custos fixos

A tela possui dois cards.

## Card A — Custos fixos do mês atual

Cada custo vigente vira um bloco compacto:

- display flex com wrap;
- gap `8px`;
- largura mínima `168px`;
- padding `10px 13px`.

Não lançado:

- borda dourada;
- fundo branco;
- valor vermelho;
- botão azul “Lançar no caixa”.

Já lançado:

- borda cinza;
- fundo `paper`;
- valor secundário riscado;
- label verde “✓ LANÇADO NO MÊS”.

## Card B — Cadastro de custos fixos

Tabela com:

1. Descrição;
2. Valor mensal;
3. Recorrente?;
4. Dia venc.;
5. Vigência;
6. Remover.

# 15.7. Fluxo de caixa

## KPIs

1. Caixa anterior;
2. Entradas do mês;
3. Saídas do mês;
4. Caixa atual.

O KPI “Caixa atual” deve ser destacado e informar “🔒 calculado — não há campo”.

## Card “Movimentação do mês”

Tabela:

1. Data;
2. Movimento;
3. Entrada;
4. Saída;
5. Saldo.

O saldo é recalculado linha a linha.

## Card “Ano de 2026”

Tabela:

1. Mês;
2. Entradas;
3. Saídas;
4. Resultado;
5. Caixa.

Mês atual recebe fundo `gold-pale`.

# 15.8. DRE

Layout desktop em duas colunas:

```css
grid-template-columns: 1.4fr 1fr;
gap: 10px;
```

## Card esquerdo

Tabela da DRE:

1. Receita de honorários;
2. (−) Custas processuais e restituições;
3. = Resultado bruto;
4. (−) Despesas operacionais;
5. = Resultado do período.

A última linha:

- borda superior forte;
- fundo `paper`;
- label em Display `15px`;
- valor em mono `16px`;
- resultado positivo verde;
- resultado negativo vermelho.

## Card direito

- título “Margem do mês”;
- margem centralizada em Display `58px`;
- verde se `>= 20%`;
- âmbar se entre `0%` e `19%`;
- vermelho se negativa;
- abaixo, resumo por linhas.

# 15.9. Balanço

Card único com duas colunas e gap `24px`.

## Coluna esquerda — Ativo

- título editorial “ATIVO”;
- caixa e equivalentes;
- contas a receber;
- total do ativo;
- box “FORA DO BALANÇO”.

### Box fora do balanço

- fundo `gold-pale`;
- borda esquerda dourada de `2px`;
- padding `11px 13px`;
- mostra êxito projetado do escritório e parceiros;
- inclui explicação de que expectativa não é receita.

## Coluna direita — Passivo e patrimônio

- obrigações previstas;
- total do passivo;
- patrimônio líquido;
- box de conferência azul-marinho.

### Box de conferência

- fundo `navy`;
- texto branco;
- padding `15px 14px`;
- label dourado-claro;
- equação em mono;
- explicação em `#A9B2CC`.

# 15.10. Tarefas

Layout em duas colunas:

- Abertas;
- Concluídas.

Cada tarefa:

- card interno com borda fina;
- borda esquerda `2.5px`;
- checkbox no início;
- conteúdo ao centro;
- prazo à direita em mono.

Tarefa atrasada:

- fundo danger-soft;
- borda danger-line;
- borda esquerda vermelha;
- prazo vermelho.

Tarefa concluída:

- texto riscado;
- cor secundária;
- borda esquerda verde.

# 15.11. Migração

Essa tela tem personalidade própria, mas continua dentro do mesmo sistema.

## Hero do laudo

- fundo `navy`;
- texto branco;
- padding `22px 24px`;
- margin-bottom `12px`;
- eyebrow dourado “LAUDO DA IMPORTAÇÃO”;
- título em Display `26px`;
- parágrafo `12.5px`, cor `#B9C1D9`, line-height `1.7`, max-width `640px`.

## KPIs de importação

- contratos;
- parcelas;
- lançamentos;
- custos fixos;
- parceiros.

## Achados

Cada achado é um card horizontal:

- borda padrão;
- borda esquerda colorida `2.5px`;
- padding `13px 16px`;
- número grande em Display `30px`;
- título `13.5px`, peso `600`;
- descrição `11.5px`;
- detalhes técnicos como tags mono compactas.

## Cards de divergência

Grid de duas colunas:

- “Os dois arquivos discordam”;
- “Campos que faltam”.

## De-para

Tabela de mapeamento com três colunas:

1. Arquivo · aba;
2. Campos;
3. Virou.

# 15.12. Ajustes

Layout desktop:

```css
grid-template-columns: 1.2fr 1fr;
gap: 10px;
```

## Parâmetros do escritório

Cada linha:

- texto e ajuda à esquerda;
- input numérico de `150px` à direita;
- input com fundo `gold-pale` e borda dourada;
- valor mono e peso `600`.

## Parceiros / origens

- lista em linhas compactas;
- contagem de contratos em mono;
- ação remover;
- input + botão Adicionar;
- rodapé com ações textuais para zerar, importar e carregar exemplo.

A ação “Zerar o sistema” deve ser vermelha.

---

## 16. FORMULÁRIOS E MODAIS ESPECÍFICOS

# 16.1. Novo lançamento

Eyebrow: “ENTRADA ÚNICA DE DADO”.

No topo, seletor segmentado Entrada/Saída:

- borda externa padrão;
- duas metades iguais;
- ativo Entrada: verde;
- ativo Saída: vermelho;
- inativo: fundo branco, texto secundário.

Campos:

- data;
- valor;
- descrição / cliente;
- categoria;
- contrato / cliente;
- forma;
- pago?;
- observações.

Nota final explica que o lançamento atualiza fluxo, DRE e balanço.

# 16.2. Novo contrato

Campos:

- cliente;
- parceiro / origem;
- status;
- processo;
- tipo de honorário;
- fixo total;
- valor da causa;
- percentual de êxito;
- percentual de sucumbência;
- quota do parceiro;
- split nick;
- data da proposta;
- observações.

Quando a projeção de êxito for maior que zero, exibir box “🔒 PRÉVIA CALCULADA”.

# 16.3. Nova parcela

Campos:

- tipo;
- valor;
- mês esperado;
- observações.

Não mostrar campo “recebido”. O recebimento acontece apenas na tela Parcelas.

# 16.4. Novo custo fixo

Campos:

- descrição;
- valor mensal;
- dia do vencimento;
- recorrente?;
- mês de início;
- mês final.

# 16.5. Nova tarefa

Campos:

- tarefa;
- contrato;
- responsável;
- prazo.

# 16.6. Fechar proposta

Eyebrow: “PROPOSTA → CONTRATO”.

Quando há honorário fixo:

- input de quantidade de parcelas;
- nota dinâmica com quantidade, valor por parcela e mês inicial.

Quando não há fixo:

- apenas nota explicativa;
- nenhuma parcela gerada automaticamente.

---

## 17. TOM DE VOZ DA INTERFACE

O texto da interface é direto, explicativo e seguro.

Características:

- frases curtas;
- linguagem de operação real;
- sem jargão de produto digital;
- explica a consequência da ação;
- reforça automação e rastreabilidade;
- evita mensagens vagas como “Sucesso!” sem contexto.

Exemplos de padrão:

- “Entrada de R$ X lançada — três relatórios reescritos.”
- “Recebimento estornado — o lançamento correspondente saiu do caixa.”
- “Custo lançado — caixa, DRE e balanço recalculados.”
- “Marcar recebido gera o lançamento de entrada automaticamente.”

Evitar:

- “Awesome!”;
- “Tudo pronto!”;
- “Operação realizada com sucesso” sem dizer o que mudou;
- linguagem excessivamente informal;
- emojis em excesso.

Emojis são usados apenas como reforço funcional pontual: `🔒`, `⚠`, `✓`, `↳`, `→`.

---

## 18. RESPONSIVIDADE

A referência principal é desktop. A versão desktop deve ser implementada primeiro e validada visualmente antes das adaptações.

### 18.1. Desktop largo — `>= 1200px`

- sidebar `210px`;
- header e cadeia com padding horizontal `28px`;
- conteúdo com padding `20px 28px 60px`;
- grids conforme especificado;
- tabelas ocupam a largura disponível.

### 18.2. Desktop compacto / tablet — `768px a 1199px`

- sidebar pode permanecer com `190px` a `210px` enquanto houver espaço;
- grids de duas colunas podem quebrar para uma coluna quando o card ficar menor que aproximadamente `360px`;
- grid de status de contratos pode virar `repeat(auto-fit, minmax(140px, 1fr))`;
- tabelas devem rolar horizontalmente;
- não reduzir texto abaixo dos tamanhos mínimos especificados.

### 18.3. Mobile — `< 768px`

A adaptação mobile pode mudar a estrutura, mas não a identidade.

Regras:

- sidebar vira drawer ou painel lateral acionado por botão;
- header permanece branco e sticky;
- título da página continua em Playfair Display;
- cadeia pode rolar horizontalmente;
- conteúdo usa padding lateral `14px` a `16px`;
- grids viram uma coluna;
- formulários viram uma coluna;
- modais podem ocupar quase toda a tela;
- cards mantêm bordas retas e densidade;
- tabelas permanecem tabelas com scroll horizontal, não converter automaticamente tudo em cards;
- botões do header podem compactar, mas manter ações “Contrato” e “Lançamento”.

### 18.4. O que não pode ocorrer no mobile

- trocar toda a interface por bottom navigation colorida;
- usar cards arredondados grandes;
- remover informações importantes das tabelas;
- esconder a cadeia permanentemente;
- alterar a paleta;
- mudar a tipografia.

---

## 19. ACESSIBILIDADE

Implementação mínima obrigatória:

- contraste AA para textos e controles;
- navegação por teclado completa;
- `aria-current="page"` no item ativo;
- `aria-label` em botões apenas com símbolo;
- labels reais associados aos inputs;
- foco visível dourado;
- modal com focus trap;
- fechar modal com Esc;
- ordem de tabulação lógica;
- tabelas com `thead`, `tbody`, `th` e `scope`;
- status não comunicados apenas pela cor;
- gráficos com descrição textual ou resumo acessível;
- respeitar `prefers-reduced-motion`;
- não usar placeholder como único label.

---

## 20. SCROLLBAR

No WebKit:

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background: #C9CEDC;
  border-radius: 4px;
}
```

A scrollbar deve ser discreta.

---

## 21. ARQUITETURA DE COMPONENTES RECOMENDADA

A implementação pode ser reorganizada, desde que o visual permaneça igual.

```text
src/
├── app/
│   ├── layout/
│   │   ├── AppShell
│   │   ├── Sidebar
│   │   ├── PageHeader
│   │   └── CalculationChain
│   ├── components/
│   │   ├── Card
│   │   ├── KPI
│   │   ├── SectionDivider
│   │   ├── StatusTag
│   │   ├── DataTable
│   │   ├── Field
│   │   ├── Note
│   │   ├── CardFooter
│   │   ├── EmptyState
│   │   ├── ModalShell
│   │   ├── CalculatedCell
│   │   └── FilterChip
│   ├── pages/
│   │   ├── DashboardPage
│   │   ├── ContractsPage
│   │   ├── InstallmentsPage
│   │   ├── TransactionsPage
│   │   ├── FixedCostsPage
│   │   ├── CashFlowPage
│   │   ├── DrePage
│   │   ├── BalanceSheetPage
│   │   ├── TasksPage
│   │   ├── MigrationPage
│   │   └── SettingsPage
│   ├── modals/
│   │   ├── NewTransactionModal
│   │   ├── NewContractModal
│   │   ├── NewInstallmentModal
│   │   ├── NewFixedCostModal
│   │   ├── NewTaskModal
│   │   └── CloseProposalModal
│   ├── charts/
│   │   ├── SpendingByCategoryChart
│   │   └── AnnualCashChart
│   └── styles/
│       ├── tokens.css
│       ├── globals.css
│       └── components.css
```

### 21.1. Regra para bibliotecas de UI

Pode usar biblioteca de primitives para acessibilidade, mas não pode aceitar o estilo visual padrão da biblioteca.

Se usar shadcn/Radix/Headless UI:

- remover radius padrão;
- remover sombras padrão;
- substituir cores;
- substituir tipografia;
- reproduzir paddings e tamanhos deste documento;
- não deixar aparência reconhecível de template.

---

## 22. ESTADO, DADOS E FEEDBACK

O estado visual deve reagir imediatamente às ações.

Fluxos importantes:

1. registrar parcela recebida;
2. criar lançamento correspondente;
3. animar cadeia Lançamento → Fluxo → DRE → Balanço;
4. atualizar KPIs e relatórios;
5. exibir mensagem específica.

Outros fluxos:

- estornar parcela remove o lançamento relacionado;
- lançar custo fixo marca o bloco como lançado;
- fechar proposta altera status e pode gerar parcelas;
- concluir tarefa move entre colunas;
- alterar parâmetros recalcula indicadores.

Mesmo que o backend seja assíncrono, usar estado otimista somente quando seguro. Em erro, reverter e explicar o que não foi salvo.

---

## 23. ESTADOS DE CARREGAMENTO

O frontend original não usa skeletons, mas a versão conectada ao backend precisará deles.

Regras para novos estados de loading:

- skeleton sem radius grande;
- fundo entre `paper` e `line`;
- manter altura exata do componente final;
- sem shimmer chamativo;
- usar animação muito suave ou estática;
- não bloquear a sidebar;
- em tabela, usar linhas skeleton compactas;
- em botão de salvar, manter largura e trocar texto por “Salvando…”;
- não abrir toast genérico para cada carregamento.

---

## 24. ESTADOS DE ERRO

Erros devem seguir a mesma linguagem visual.

### Erro inline

- texto `11px` a `12px`;
- cor vermelha;
- borda esquerda vermelha ou campo com borda vermelha;
- mensagem específica.

### Erro de tela

- card branco;
- borda padrão;
- borda esquerda vermelha;
- título editorial;
- explicação curta;
- ação de tentar novamente.

Não usar modal de erro para falhas simples de campo.

---

## 25. CRITÉRIOS DE FIDELIDADE VISUAL

A implementação só deve ser considerada pronta quando cumprir todos estes pontos.

### Shell

- [ ] Sidebar tem exatamente a sensação de largura e densidade da referência.
- [ ] Fundo da sidebar é `#151D3E`.
- [ ] Item ativo tem fundo `#2C3B6E` e linha esquerda dourada.
- [ ] Header é branco, sticky e compacto.
- [ ] Cadeia azul-marinho aparece abaixo do header.

### Tipografia

- [ ] Playfair Display aparece em títulos e números grandes.
- [ ] IBM Plex Sans aparece no corpo.
- [ ] IBM Plex Mono aparece em valores, datas e números técnicos.
- [ ] Labels uppercase têm tracking alto.

### Componentes

- [ ] Cards não têm sombra grande.
- [ ] Cards não têm radius grande.
- [ ] Botões têm radius de aproximadamente `2px`.
- [ ] Tabelas têm cabeçalho compacto e linha azul forte.
- [ ] Tags são pequenas e retangulares.
- [ ] Dados calculados têm fundo cinza-azulado e cadeado.

### Cores

- [ ] Dourado é usado apenas como acento.
- [ ] Entradas são verdes.
- [ ] Saídas e atrasos são vermelhos.
- [ ] Pendências são âmbar.
- [ ] Texto principal é azul-marinho, não preto.

### Layout

- [ ] Painel mantém a ordem exata das seções.
- [ ] Contratos mantêm o card detalhado com projeção e parcelas.
- [ ] Parcelas e lançamentos permanecem tabelas.
- [ ] DRE usa layout 1.4fr/1fr no desktop.
- [ ] Balanço usa duas colunas com box de conferência.
- [ ] Ajustes usa 1.2fr/1fr no desktop.

### Interações

- [ ] Hover de linha é sutil.
- [ ] Foco é dourado.
- [ ] Modal fecha com overlay, botão e Esc.
- [ ] Cadeia anima após ações financeiras.
- [ ] Movimento reduzido é respeitado.

---

## 26. TESTE VISUAL OBRIGATÓRIO

Antes de concluir a implementação:

1. executar a aplicação na largura `1440px`;
2. comparar lado a lado com o frontend de referência;
3. validar sidebar, header e cadeia primeiro;
4. validar tipografia e paleta;
5. validar Painel completo;
6. validar Contratos e Parcelas;
7. validar tabelas financeiras;
8. validar modais;
9. validar larguras `1024px`, `768px` e `390px`;
10. corrigir diferenças de spacing superiores a aproximadamente `2px` nos elementos principais.

Usar screenshot regression ou Playwright visual comparison quando possível.

Sugestão de rotas/estados para screenshots:

```text
/painel?state=empty
/painel?state=example
/contratos?filter=all
/parcelas?filter=open
/lancamentos?filter=all
/custos-fixos
/fluxo-caixa
/dre
/balanco
/tarefas
/migracao
/ajustes
```

Capturar também todos os modais abertos.

---

## 27. PROIBIÇÕES EXPRESSAS PARA O CODEX

O Codex não deve:

- “melhorar” o design por iniciativa própria;
- substituir a Playfair Display por Inter;
- trocar IBM Plex por fonte padrão;
- aumentar border-radius;
- adicionar sombras em cards;
- remover a faixa da cadeia;
- transformar tabelas em cards no desktop;
- mudar a sidebar para navegação superior;
- alterar a ordem das telas;
- alterar a ordem dos KPIs;
- alterar as cores semânticas;
- reduzir a densidade;
- ocultar informações para “simplificar”;
- usar ícones de biblioteca em todos os itens apenas para decorar;
- trocar textos explicativos por tooltips invisíveis;
- remover a diferenciação entre calculado e digitado;
- usar componentes padrão sem customização;
- criar um visual genérico de CRM;
- inventar novos padrões visuais sem necessidade funcional.

---

## 28. REGRA DE DECISÃO EM CASO DE CONFLITO

Se houver conflito entre:

1. convenção de uma biblioteca;
2. preferência automática do framework;
3. sugestão de IA;
4. este documento;
5. o JSX de referência aprovado;

seguir esta prioridade:

```text
1. JSX de referência aprovado
2. Este FRONTEND_REFERENCE.md
3. Requisitos funcionais do sistema
4. Acessibilidade
5. Convenções da biblioteca/framework
```

A acessibilidade deve ser adicionada sem descaracterizar o visual.

---

## 29. RESUMO EXECUTIVO PARA IMPLEMENTAÇÃO

Reproduzir um sistema desktop-first com:

- sidebar fixa de `210px` em azul-marinho profundo;
- marca editorial em Playfair Display;
- header branco sticky;
- faixa azul “CADEIA” com feedback dourado;
- fundo geral cinza muito claro;
- cards brancos com borda fina e sem sombra;
- títulos serifados;
- labels pequenos em uppercase e tracking alto;
- números técnicos em fonte mono;
- dourado usado apenas como acento;
- tabelas compactas e profissionais;
- status semânticos consistentes;
- dados calculados claramente travados;
- modais retos e compactos;
- interações sutis;
- nenhuma aparência genérica de template.

**Resultado esperado:** ao abrir a nova implementação, alguém que conheça o frontend atual deve reconhecer imediatamente a mesma interface, e não apenas “algo inspirado nela”.
