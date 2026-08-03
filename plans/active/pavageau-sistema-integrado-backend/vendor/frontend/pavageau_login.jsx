import React, { useState } from "react";

/* ══════════════════════  TOKENS — herdados do sistema  ══════════════════════ */
const C = {
  navy: "#1E2A56", navyDeep: "#151D3E", navySoft: "#2C3B6E", navyLine: "#33417A",
  gold: "#C9A24D", goldSoft: "#E6D2A0", goldPale: "#FDF7E8",
  paper: "#F5F6FA", line: "#E3E6EE", ink: "#1E2A56", inkSoft: "#79829C",
  green: "#1C7A4E", red: "#A8322D",
};
const S = {
  display: "'Playfair Display', Georgia, serif",
  body: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

/* ícones dos três pilares — os mesmos do slide da visão */
const IcFinanceiro = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>);
const IcContratos = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>);
const IcRadar = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>);
const IcRaio = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>);

export default function App() {
  const [tela, setTela] = useState("login"); // login | recuperar | enviado

  return (
    <div style={{ fontFamily: S.body, minHeight: "100vh", display: "flex", color: C.ink, background: C.paper }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideUp { from { opacity:0; transform: translateY(12px);} to {opacity:1; transform:none;} }
        @keyframes fadeIn { from { opacity:0;} to {opacity:1;} }
        @keyframes floatY { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-9px);} }
        @keyframes drawLine { from { stroke-dashoffset: 300;} to { stroke-dashoffset: 0;} }
        @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(201,162,77,.45);} 100% { box-shadow: 0 0 0 22px rgba(201,162,77,0);} }
        .btnPrimary:hover { filter: brightness(1.1); }
        .btnPrimary:active { transform: translateY(1px); }
        .linkGold:hover { color: ${C.gold} !important; }
        input:focus { outline: none; border-color: ${C.navy} !important; box-shadow: 0 0 0 3px rgba(30,42,86,.09); }
        .field:focus-within label { color: ${C.navy}; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
        @media (max-width: 900px) { .vitrine { display: none !important; } }
      `}</style>

      {/* ─────────────  PAINEL ESQUERDO — a vitrine da marca  ───────────── */}
      <aside className="vitrine" style={{
        width: "46%", maxWidth: 620, background: C.navyDeep, color: "#fff",
        position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
        padding: "56px 54px",
      }}>
        {/* textura de fundo: círculos concêntricos dourados, discretos */}
        <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: .5 }}>
          <defs>
            <radialGradient id="glow" cx="70%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#2C3B6E" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#151D3E" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="600" height="800" fill="url(#glow)" />
          {[120, 200, 280, 360, 440].map((r, i) => (
            <circle key={r} cx="470" cy="180" r={r} fill="none" stroke={C.navyLine} strokeWidth="1"
              strokeDasharray={i % 2 ? "3 7" : "none"} opacity={0.5 - i * 0.06} />
          ))}
        </svg>

        {/* marca */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: S.display, fontSize: 30, letterSpacing: ".06em", fontWeight: 700 }}>PAVAGEAU</div>
          <div style={{ fontSize: 10.5, letterSpacing: ".26em", color: C.gold, marginTop: 6 }}>ADVOGADOS · SISTEMA INTEGRADO</div>
        </div>

        {/* miolo: o "sistema integrado" com os três pilares */}
        <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ position: "relative", height: 230, marginBottom: 44 }}>
            {/* linha pontilhada ligando os pilares ao núcleo */}
            <svg viewBox="0 0 460 230" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <line x1="60" y1="90" x2="230" y2="90" stroke={C.navyLine} strokeWidth="1.5" strokeDasharray="4 6"
                style={{ strokeDashoffset: 300, animation: "drawLine 1.2s ease .3s forwards" }} />
              <line x1="230" y1="90" x2="400" y2="90" stroke={C.navyLine} strokeWidth="1.5" strokeDasharray="4 6"
                style={{ strokeDashoffset: 300, animation: "drawLine 1.2s ease .5s forwards" }} />
              <line x1="230" y1="90" x2="230" y2="185" stroke={C.navyLine} strokeWidth="1.5" strokeDasharray="4 6"
                style={{ strokeDashoffset: 300, animation: "drawLine 1.2s ease .7s forwards" }} />
            </svg>

            {/* núcleo branco com o raio */}
            <div style={{
              position: "absolute", left: "calc(50% - 44px)", top: 46, width: 88, height: 88, borderRadius: "50%",
              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              color: C.navy, animation: "pulseRing 3s ease-out infinite, fadeIn .8s ease", zIndex: 3,
            }}>
              <IcRaio width={34} height={34} />
            </div>

            {/* pilar esquerdo — Financeiro */}
            <Pilar x="calc(13% - 30px)" y={60} icon={<IcFinanceiro width={26} height={26} />} delay=".2s" />
            {/* pilar direito — Radar */}
            <Pilar x="calc(87% - 30px)" y={60} icon={<IcRadar width={26} height={26} />} delay=".4s" />
            {/* pilar inferior — Contratos */}
            <Pilar x="calc(50% - 30px)" y={155} icon={<IcContratos width={24} height={24} />} delay=".6s" />
          </div>

          <h1 style={{ fontFamily: S.display, fontSize: 34, fontWeight: 700, lineHeight: 1.15, margin: 0, maxWidth: 440 }}>
            Uma plataforma única<br />para todo o escritório
          </h1>
          <p style={{ fontSize: 14.5, color: "#A9B2CC", lineHeight: 1.7, marginTop: 18, maxWidth: 400 }}>
            Financeiro, contratos e radar processual num só lugar. Um lançamento vira relatório,
            um contrato vira receita, um andamento vira tarefa — sozinhos.
          </p>

          {/* três legendas */}
          <div style={{ display: "flex", gap: 26, marginTop: 32 }}>
            {[["Financeiro", "Fluxo · DRE · Balanço"], ["Contratos", "Ciclo do cliente"], ["Radar", "Andamentos · Tarefas"]].map(([t, s]) => (
              <div key={t}>
                <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: ".04em" }}>{t}</div>
                <div style={{ fontSize: 10.5, color: "#7C86A6", marginTop: 2 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2, fontSize: 10.5, color: "#5F6A8C", letterSpacing: ".08em" }}>
          PAVAGEAU ADVOGADOS · ACESSO RESTRITO
        </div>
      </aside>

      {/* ─────────────  PAINEL DIREITO — o formulário  ───────────── */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 384 }}>
          {/* marca compacta (aparece quando a vitrine some, no mobile) */}
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "50%", background: C.navy, color: "#fff", marginBottom: 14 }}>
              <IcRaio width={22} height={22} />
            </div>
            <div style={{ fontFamily: S.display, fontSize: 20, fontWeight: 700, letterSpacing: ".04em" }}>PAVAGEAU</div>
            <div style={{ fontSize: 9, letterSpacing: ".22em", color: C.gold, marginTop: 3 }}>SISTEMA INTEGRADO</div>
          </div>

          {tela === "login" && <Login goRecuperar={() => setTela("recuperar")} />}
          {tela === "recuperar" && <Recuperar goLogin={() => setTela("login")} goEnviado={() => setTela("enviado")} />}
          {tela === "enviado" && <Enviado goLogin={() => setTela("login")} goRecuperar={() => setTela("recuperar")} />}

          <div style={{ textAlign: "center", marginTop: 34, fontSize: 10.5, color: C.inkSoft, lineHeight: 1.7 }}>
            Acesso exclusivo da equipe Pavageau Advogados.<br />
            Protegido por autenticação e criptografia.
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────  LOGIN  ───────────────────────── */
function Login({ goRecuperar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setErro("");
    if (!email || !senha) { setErro("Preencha e-mail e senha para continuar."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErro("Digite um e-mail válido."); return; }
    setLoading(true);
    setTimeout(() => setLoading(false), 1400); // simulação
  };

  return (
    <div style={{ animation: "slideUp .4s ease" }}>
      <Eyebrow>ACESSO AO SISTEMA</Eyebrow>
      <Titulo>Bom te ver de volta</Titulo>
      <Sub>Entre com suas credenciais do escritório.</Sub>

      {erro && <Erro>{erro}</Erro>}

      <div style={{ marginTop: 22 }}>
        <Campo label="E-MAIL" onEnter={submit}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@pavageau.adv.br" style={input} autoFocus />
        </Campo>

        <div style={{ height: 16 }} />

        <Campo label="SENHA" onEnter={submit}
          acao={<button onClick={goRecuperar} className="linkGold" style={linkMini}>Esqueci a senha</button>}>
          <div style={{ position: "relative" }}>
            <input type={ver ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••" style={{ ...input, paddingRight: 44 }} />
            <button onClick={() => setVer(!ver)} type="button" aria-label={ver ? "Ocultar senha" : "Mostrar senha"}
              style={olhoBtn}>{ver ? <OlhoFechado /> : <Olho />}</button>
          </div>
        </Campo>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, cursor: "pointer", fontSize: 12.5, color: C.inkSoft, userSelect: "none" }}>
          <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)}
            style={{ accentColor: C.navy, width: 15, height: 15, cursor: "pointer" }} />
          Manter conectado neste dispositivo
        </label>

        <button onClick={submit} disabled={loading} className="btnPrimary" style={{ ...botao, marginTop: 22, opacity: loading ? .8 : 1 }}>
          {loading ? <Spinner /> : "Entrar"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────  RECUPERAR  ───────────────────────── */
function Recuperar({ goLogin, goEnviado }) {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setErro("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErro("Digite um e-mail válido para receber o link."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); goEnviado(); }, 1400);
  };

  return (
    <div style={{ animation: "slideUp .4s ease" }}>
      <button onClick={goLogin} className="linkGold" style={{ ...voltar }}>
        <Seta /> Voltar ao acesso
      </button>
      <Eyebrow>RECUPERAÇÃO DE ACESSO</Eyebrow>
      <Titulo>Esqueceu a senha?</Titulo>
      <Sub>Informe seu e-mail e enviaremos um link seguro para você criar uma nova senha.</Sub>

      {erro && <Erro>{erro}</Erro>}

      <div style={{ marginTop: 22 }}>
        <Campo label="E-MAIL DO ESCRITÓRIO" onEnter={submit}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@pavageau.adv.br" style={input} autoFocus />
        </Campo>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 18, background: C.goldPale, border: `1px solid ${C.gold}44`, padding: "11px 13px", borderRadius: 4 }}>
          <div style={{ color: C.gold, flexShrink: 0, marginTop: 1 }}><Escudo /></div>
          <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.6 }}>
            O link expira em 30 minutos e só pode ser usado uma vez. Por segurança, não informamos se um e-mail está ou não cadastrado.
          </div>
        </div>

        <button onClick={submit} disabled={loading} className="btnPrimary" style={{ ...botao, marginTop: 22, opacity: loading ? .8 : 1 }}>
          {loading ? <Spinner /> : "Enviar link de recuperação"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────  ENVIADO (confirmação)  ───────────────────────── */
function Enviado({ goLogin, goRecuperar }) {
  return (
    <div style={{ animation: "slideUp .4s ease", textAlign: "center" }}>
      <div style={{
        width: 66, height: 66, borderRadius: "50%", background: C.navy, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "6px auto 20px",
        animation: "pulseRing 2.4s ease-out infinite",
      }}>
        <Envelope />
      </div>
      <Eyebrow center>LINK ENVIADO</Eyebrow>
      <Titulo center>Verifique seu e-mail</Titulo>
      <Sub center>
        Se houver uma conta associada a esse endereço, você receberá em instantes um link para redefinir a senha.
        Não esqueça de olhar a caixa de spam.
      </Sub>

      <button onClick={goLogin} className="btnPrimary" style={{ ...botao, marginTop: 26 }}>Voltar ao acesso</button>
      <button onClick={goRecuperar} className="linkGold" style={{ ...linkTexto, marginTop: 16 }}>
        Não recebeu? Tentar outro e-mail
      </button>
    </div>
  );
}

/* ─────────────────────────  ÁTOMOS  ───────────────────────── */
const Pilar = ({ x, y, icon, delay }) => (
  <div style={{
    position: "absolute", left: x, top: y, width: 60, height: 60, borderRadius: "50%",
    background: C.navySoft, border: `1px solid ${C.navyLine}`, color: C.goldSoft,
    display: "flex", alignItems: "center", justifyContent: "center",
    animation: `fadeIn .8s ease ${delay} both, floatY 5s ease-in-out ${delay} infinite`,
  }}>{icon}</div>
);

const Eyebrow = ({ children, center }) => (
  <div style={{ fontSize: 9.5, letterSpacing: ".2em", color: C.gold, fontWeight: 600, textAlign: center ? "center" : "left" }}>{children}</div>
);
const Titulo = ({ children, center }) => (
  <h2 style={{ fontFamily: S.display, fontSize: 27, fontWeight: 700, margin: "7px 0 0", textAlign: center ? "center" : "left", lineHeight: 1.2 }}>{children}</h2>
);
const Sub = ({ children, center }) => (
  <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6, margin: "8px 0 0", textAlign: center ? "center" : "left" }}>{children}</p>
);

function Campo({ label, acao, children, onEnter }) {
  return (
    <div className="field" onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter(); }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <label style={{ fontSize: 9.5, letterSpacing: ".1em", color: C.inkSoft, fontWeight: 600, transition: "color .15s" }}>{label}</label>
        {acao}
      </div>
      {children}
    </div>
  );
}

const Erro = ({ children }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#FBEDEC", border: `1px solid ${C.red}33`, color: C.red, padding: "10px 12px", borderRadius: 4, fontSize: 12.5, marginTop: 20, animation: "fadeIn .25s ease" }}>
    <span style={{ flexShrink: 0, fontWeight: 700 }}>!</span>{children}
  </div>
);

function Spinner() {
  return (
    <span style={{ display: "inline-block", width: 17, height: 17, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

const Olho = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>);
const OlhoFechado = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>);
const Seta = () => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>);
const Escudo = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>);
const Envelope = () => (<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>);

/* estilos compartilhados */
const input = { width: "100%", padding: "11px 13px", border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 13.5, fontFamily: S.body, color: C.ink, background: "#fff", transition: "border-color .15s, box-shadow .15s" };
const botao = { width: "100%", padding: "12px", background: C.navy, color: "#fff", border: "none", borderRadius: 4, fontSize: 14, fontWeight: 600, fontFamily: S.body, cursor: "pointer", letterSpacing: ".02em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "filter .15s, transform .05s" };
const olhoBtn = { position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.inkSoft, cursor: "pointer", padding: 8, display: "flex", alignItems: "center" };
const linkMini = { background: "none", border: "none", color: C.inkSoft, fontSize: 11.5, cursor: "pointer", fontFamily: S.body, fontWeight: 600, padding: 0, transition: "color .15s" };
const linkTexto = { display: "block", width: "100%", background: "none", border: "none", color: C.inkSoft, fontSize: 12.5, cursor: "pointer", fontFamily: S.body, fontWeight: 600, transition: "color .15s" };
const voltar = { display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.inkSoft, fontSize: 12, cursor: "pointer", fontFamily: S.body, fontWeight: 600, padding: 0, marginBottom: 20, transition: "color .15s" };
