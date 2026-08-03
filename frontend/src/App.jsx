import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  Banknote,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Eye,
  EyeOff,
  FileBarChart2,
  FileText,
  Gauge,
  KeyRound,
  Landmark,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Send,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { z } from "zod";

import {
  Button,
  CalculatedValue,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Field,
  IconButton,
  InlineAlert,
  PageHeader,
  RadarStatusBadge,
  Section,
  Select,
  StateBoundary,
  formatDate,
  formatDateTime,
  formatMoney,
  formatPercent,
  getErrorMessage,
  monthNames,
  shortId,
} from "./components/ui";
import PavageauApp from "./reference/PavageauApp";
import { ApiError, apiRequest } from "./lib/api";
import { frontendConfig, missingFrontendEnv } from "./lib/config";
import { supabase } from "./lib/supabase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [401, 403, 404, 409, 422].includes(error.status)) return false;
        return failureCount < 2;
      },
      staleTime: 15_000,
      refetchOnWindowFocus: false,
    },
  },
});

const AuthContext = createContext(null);

const contratoStatus = ["proposta", "ativo", "aguardando_exito", "encerrado", "cancelado"];
const tiposHonorario = ["fixo_mensal", "fixo_total", "exito", "sucumbencia", "misto"];
const parcelaTipos = ["mensal", "exito", "sucumbencia", "entrada", "outro"];
const lancamentoTipos = ["entrada", "saida"];
const categorias = ["honorarios", "custos", "impostos", "folha", "marketing", "operacional", "restituicao", "outros"];
const tarefaStatus = ["aberta", "concluida", "cancelada"];
const tarefaOrigens = ["manual", "radar_movimentacao", "radar_inercia"];
const tribunais = ["TJSP", "TJCE", "TJBA"];

function coerceFormValues(fields, values) {
  const output = {};
  fields.forEach((field) => {
    let value = values[field.name];
    if (field.type === "checkbox") {
      output[field.name] = Boolean(value);
      return;
    }
    if (typeof value === "string") value = value.trim();
    if (value === "") {
      if (field.optional) return;
      output[field.name] = value;
      return;
    }
    if (field.type === "number") {
      output[field.name] = Number(value);
      return;
    }
    if (field.type === "month" && value) {
      output[field.name] = `${value}-01`;
      return;
    }
    output[field.name] = value;
  });
  return output;
}

function monthInputValue(value) {
  return value ? String(value).slice(0, 7) : "";
}

function useUnsavedWarning(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);
}

const passwordResetRedirectPath = "/definir-nova-senha";

function hasPasswordRecoveryParams() {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  return url.searchParams.has("code") || url.searchParams.get("type") === "recovery" || url.hash.includes("access_token");
}

function authErrorTitle(error) {
  if (error instanceof ApiError && error.status === 404) return "Endpoint nao encontrado";
  if (error instanceof ApiError && error.status === 403) return "Acesso nao autorizado";
  if (error instanceof ApiError && error.status === 401) return "Sessao expirada";
  if (error instanceof ApiError && error.status === 0) return "API indisponivel";
  return "Falha de autenticacao";
}

function authErrorMessage(error) {
  const message = String(error?.message || "");
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials") || normalized.includes("invalid credentials")) {
    return "Credenciais incorretas. Confira o e-mail e a senha.";
  }
  if (normalized.includes("rate limit")) {
    return "Muitas solicitacoes recentes. Aguarde alguns minutos antes de pedir outro link de recuperacao.";
  }
  if (normalized.includes("email not confirmed")) {
    return "E-mail ainda nao confirmado. Confirme o cadastro pelo Supabase Auth antes de entrar.";
  }
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return `Login confirmado no Supabase Auth, mas a API esta indisponivel em ${frontendConfig.apiUrl}. Inicie o FastAPI ou ajuste VITE_API_URL.`;
    }
    if (error.status === 401) return "Sessao expirada ou invalida. Entre novamente.";
    if (error.status === 403) return "Usuario autenticado, mas sem autorizacao. Solicite inclusao ativa em app_members.";
    if (error.status === 404) return "Login confirmado, mas o backend nao encontrou GET /me. Atualize o container da API ou corrija VITE_API_URL.";
    if (error.status >= 500) return "Login confirmado, mas a API falhou ao consultar app_members. Verifique os logs do FastAPI.";
  }
  return message || "Nao foi possivel concluir a autenticacao.";
}

function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const client = useQueryClient();
  const memberLoadRef = useRef(null);
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberError, setMemberError] = useState(null);

  const clearSession = useCallback(async () => {
    setSession(null);
    setMe(null);
    setMemberError(null);
    client.clear();
    if (supabase) await supabase.auth.signOut();
  }, [client]);

  const loadMember = useCallback(async (nextSession) => {
    if (!nextSession?.access_token) {
      setMe(null);
      memberLoadRef.current = null;
      return null;
    }
    if (memberLoadRef.current?.token === nextSession.access_token) return memberLoadRef.current.promise;
    setMemberError(null);
    const promise = apiRequest("/me", { token: nextSession.access_token })
      .then((profile) => {
        setMe(profile);
        return profile;
      })
      .catch((error) => {
        setMemberError(error);
        throw error;
      })
      .finally(() => {
        if (memberLoadRef.current?.token === nextSession.access_token) memberLoadRef.current = null;
      });
    memberLoadRef.current = { token: nextSession.access_token, promise };
    return promise;
  }, []);

  useEffect(() => {
    let active = true;
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        const nextSession = data.session;
        setSession(nextSession);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      client.clear();
      if (nextSession) {
        setMe(null);
        setMemberError(null);
      } else {
        setMe(null);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  const apiFetch = useCallback(
    async (path, options = {}) => {
      try {
        return await apiRequest(path, { ...options, token: session?.access_token });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clearSession();
          navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
        }
        if (error instanceof ApiError && error.status === 403) {
          setMe((current) => (current ? { ...current, is_member: false } : current));
          navigate("/sem-acesso", { replace: true });
        }
        throw error;
      }
    },
    [clearSession, location.pathname, location.search, navigate, session?.access_token],
  );

  const signIn = useCallback(
    async (email, password) => {
      if (!supabase) throw new Error("Supabase Auth nao configurado");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
      setMe(null);
      setMemberError(null);
      return { is_member: true };
    },
    [],
  );

  const signOut = useCallback(async (target = "/login") => {
    const nextTarget = typeof target === "string" ? target : "/login";
    await clearSession();
    navigate(nextTarget, { replace: true });
  }, [clearSession, navigate]);

  const value = useMemo(
    () => ({
      session,
      me,
      loading,
      memberError,
      apiFetch,
      signIn,
      signOut,
      refreshMember: () => loadMember(session),
    }),
    [apiFetch, loadMember, loading, me, memberError, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext indisponivel");
  return context;
}

function useApiQuery(queryKey, path, options = {}) {
  const { apiFetch, session, me } = useAuth();
  const enabled = options.enabled !== false && Boolean(session?.access_token) && me?.is_member !== false;
  return useQuery({
    queryKey: [path, options.query || null, ...queryKey],
    queryFn: () => apiFetch(path, { query: options.query }),
    enabled,
    select: options.select,
  });
}

function useApiMutation(onSuccess) {
  const { apiFetch } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ path, method = "POST", body, query }) => apiFetch(path, { method, body, query }),
    onSuccess: async (...args) => {
      await client.invalidateQueries();
      if (onSuccess) onSuccess(...args);
    },
  });
}

function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const missing = missingFrontendEnv();
  if (missing.length) return <ConfigMissing missing={missing} />;
  if (loading) return <FullPageState title="Abrindo sistema"><p>Validando sessao e acesso.</p></FullPageState>;
  if (!session) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <Outlet />;
}

function RequireMember() {
  const { me, memberError, refreshMember } = useAuth();
  if (memberError) {
    return (
      <FullPageState title={authErrorTitle(memberError)}>
        <p>{authErrorMessage(memberError)}</p>
        <Button type="button" icon={RefreshCw} onClick={refreshMember}>
          Tentar novamente
        </Button>
      </FullPageState>
    );
  }
  if (me && !me.is_member) return <Navigate to="/sem-acesso" replace />;
  return <Outlet />;  // PavageauApp is the complete authenticated shell — no AppShell wrapper
}

function FullPageState({ title, children }) {
  return (
    <section className="full-page-state" role="status" aria-live="polite">
      <div>
        <Activity size={26} aria-hidden="true" />
        <h1>{title}</h1>
        {children}
      </div>
    </section>
  );
}

function ConfigMissing({ missing }) {
  return (
    <main className="auth-page">
      <section className="auth-panel" role="alert">
        <ShieldAlert size={30} aria-hidden="true" />
        <h1>Configuracao pendente</h1>
        <p>Defina as variaveis publicas do frontend antes de iniciar a aplicacao.</p>
        <ul className="plain-list">
          {missing.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function AuthLayout({ children }) {
  const pillars = [
    { label: "Financeiro", detail: "Fluxo, DRE e balanco", icon: CircleDollarSign },
    { label: "Contratos", detail: "Ciclo do cliente", icon: FileText },
    { label: "Radar", detail: "Andamentos e tarefas", icon: Activity },
  ];
  return (
    <main className="auth-shell">
      <aside className="auth-brand-panel" aria-label="Sistema Integrado Pavageau">
        <div className="auth-brand-rings" aria-hidden="true" />
        <div className="auth-brand-logo">
          <strong>PAVAGEAU</strong>
          <span>ADVOGADOS - SISTEMA INTEGRADO</span>
        </div>
        <div className="auth-system-map" aria-hidden="true">
          <div className="auth-map-line horizontal" />
          <div className="auth-map-line vertical" />
          <div className="auth-core">
            <KeyRound size={32} aria-hidden="true" />
          </div>
          {pillars.map(({ label, icon: Icon }, index) => (
            <div key={label} className={`auth-pillar auth-pillar-${index + 1}`}>
              <Icon size={24} aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className="auth-brand-copy">
          <h1>Uma plataforma unica para todo o escritorio</h1>
          <p>Financeiro, contratos e radar processual reunidos em uma operacao autenticada e rastreavel.</p>
          <div className="auth-brand-grid">
            {pillars.map(({ label, detail }) => (
              <div key={label}>
                <strong>{label}</strong>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="auth-brand-footer">PAVAGEAU ADVOGADOS - ACESSO RESTRITO</p>
      </aside>
      <section className="auth-form-side">
        <div className="auth-mobile-logo" aria-hidden="true">
          <KeyRound size={20} />
          <strong>PAVAGEAU</strong>
          <span>SISTEMA INTEGRADO</span>
        </div>
        {children}
        <p className="auth-footnote">Acesso exclusivo da equipe Pavageau Advogados.</p>
      </section>
    </main>
  );
}

function AuthTextField({ id, label, icon: Icon, action, children }) {
  return (
    <div className="auth-field">
      <div className="auth-field-heading">
        <label htmlFor={id}>{label}</label>
        {action}
      </div>
      <div className="auth-input-wrap">
        {Icon ? <Icon size={17} aria-hidden="true" /> : null}
        {children}
      </div>
    </div>
  );
}

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState } = useForm({ defaultValues: { email: "", password: "", remember: true } });

  const submit = handleSubmit(async (values) => {
    setFormError("");
    try {
      const profile = await signIn(values.email, values.password);
      if (profile?.is_member) {
        navigate(searchParams.get("redirect") || "/", { replace: true });
      }
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  });

  return (
    <AuthLayout>
      <form className="auth-panel auth-card" onSubmit={submit} noValidate>
        <div className="auth-card-header">
          <p className="eyebrow">ACESSO AO SISTEMA</p>
          <h1>Bom te ver de volta</h1>
          <p>Entre com as credenciais do escritorio para continuar.</p>
        </div>
        {searchParams.get("senha") === "atualizada" ? <InlineAlert>Senha atualizada. Entre novamente para abrir uma nova sessao.</InlineAlert> : null}
        {formError ? <InlineAlert type="danger">{formError}</InlineAlert> : null}
        <div className="auth-fields">
          <AuthTextField id="login-email" label="E-MAIL" icon={Mail}>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              aria-label="Email"
              placeholder="voce@pavageau.adv.br"
              {...register("email", { required: true })}
            />
          </AuthTextField>
          <AuthTextField
            id="login-password"
            label="SENHA"
            icon={KeyRound}
            action={
              <Link to="/redefinir-senha" className="auth-inline-link">
                Esqueci a senha
              </Link>
            }
          >
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              aria-label="Senha"
              placeholder="********"
              {...register("password", { required: true })}
            />
            <button
              type="button"
              className="auth-password-toggle"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </AuthTextField>
          <label className="auth-remember">
            <input type="checkbox" {...register("remember")} />
            <span>Manter conectado neste dispositivo</span>
          </label>
        </div>
        <Button type="submit" icon={KeyRound} loading={formState.isSubmitting} className="auth-submit">
          Entrar
        </Button>
        <div className="auth-security-note">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Supabase Auth valida a identidade; a API FastAPI valida app_members antes de abrir os dados.</span>
        </div>
      </form>
    </AuthLayout>
  );
}

function PasswordResetRequestPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const { register, handleSubmit, formState } = useForm({ defaultValues: { email: "" } });

  useEffect(() => {
    if (session && hasPasswordRecoveryParams()) navigate(passwordResetRedirectPath, { replace: true });
  }, [navigate, session]);

  const submit = handleSubmit(async (values) => {
    setNotice("");
    setError("");
    try {
      if (!supabase) throw new Error("Supabase Auth nao configurado");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}${passwordResetRedirectPath}`,
      });
      if (resetError) throw resetError;
      setNotice("Se o e-mail existir, enviaremos um link seguro para definir uma nova senha.");
    } catch (submitError) {
      setError(authErrorMessage(submitError));
    }
  });

  return (
    <AuthLayout>
      <form className="auth-panel auth-card" onSubmit={submit} noValidate>
        <Link to="/login" className="auth-back-link">
          <ArrowLeft size={15} aria-hidden="true" />
          Voltar ao acesso
        </Link>
        <div className="auth-card-header">
          <p className="eyebrow">RECUPERACAO DE ACESSO</p>
          <h1>Esqueceu a senha?</h1>
          <p>Informe o e-mail do escritorio para receber o link de redefinicao.</p>
        </div>
        {notice ? <InlineAlert>{notice}</InlineAlert> : null}
        {error ? <InlineAlert type="danger">{error}</InlineAlert> : null}
        <AuthTextField id="reset-email" label="E-MAIL DO ESCRITORIO" icon={Mail}>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            required
            aria-label="Email"
            placeholder="voce@pavageau.adv.br"
            {...register("email", { required: true })}
          />
        </AuthTextField>
        <div className="auth-security-note highlighted">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Por seguranca, a resposta nao revela se o e-mail esta cadastrado.</span>
        </div>
        <Button type="submit" icon={Send} loading={formState.isSubmitting} className="auth-submit">
          Enviar link de recuperacao
        </Button>
      </form>
    </AuthLayout>
  );
}

function PasswordUpdatePage({ mode }) {
  const { session, loading, signOut } = useAuth();
  const [linkPending, setLinkPending] = useState(() => hasPasswordRecoveryParams());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, handleSubmit, watch, formState } = useForm({ defaultValues: { password: "", confirmPassword: "" } });
  const title = mode === "invite" ? "Definir senha" : "Definir nova senha";

  useEffect(() => {
    if (session) {
      setLinkPending(false);
      return undefined;
    }
    if (!linkPending) return undefined;
    const timer = window.setTimeout(() => setLinkPending(false), 3500);
    return () => window.clearTimeout(timer);
  }, [linkPending, session]);

  const submit = handleSubmit(async (values) => {
    setNotice("");
    setError("");
    try {
      if (!supabase) throw new Error("Supabase Auth nao configurado");
      if (!session) throw new Error("Abra o link de redefinicao recebido por e-mail antes de criar a nova senha.");
      if (!values.password || values.password.length < 8) throw new Error("Use pelo menos 8 caracteres.");
      if (values.password !== values.confirmPassword) throw new Error("As senhas digitadas nao coincidem.");
      const { error: updateError } = await supabase.auth.updateUser({ password: values.password });
      if (updateError) throw updateError;
      setNotice("Senha atualizada com sucesso.");
      await signOut("/login?senha=atualizada");
    } catch (submitError) {
      setError(authErrorMessage(submitError));
    }
  });

  return (
    <AuthLayout>
      <form className="auth-panel auth-card" onSubmit={submit} noValidate>
        <Link to="/login" className="auth-back-link">
          <ArrowLeft size={15} aria-hidden="true" />
          Voltar ao acesso
        </Link>
        <div className="auth-card-header">
          <p className="eyebrow">SEGURANCA DA CONTA</p>
          <h1>{title}</h1>
          <p>Use uma senha nova com no minimo 8 caracteres.</p>
        </div>
        {loading || (!session && linkPending) ? <InlineAlert>Validando o link seguro recebido por e-mail.</InlineAlert> : null}
        {!loading && !session && !linkPending ? (
          <>
            <InlineAlert type="danger">Link expirado ou ausente. Solicite uma nova redefinicao de senha.</InlineAlert>
            <Link to="/redefinir-senha" className="button button-primary">
              Solicitar novo link
            </Link>
          </>
        ) : null}
        {session ? (
          <>
            {notice ? <InlineAlert>{notice}</InlineAlert> : null}
            {error ? <InlineAlert type="danger">{error}</InlineAlert> : null}
            <div className="auth-fields">
              <AuthTextField id="new-password" label="NOVA SENHA" icon={KeyRound}>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  aria-label="Nova senha"
                  placeholder="********"
                  {...register("password", { required: true })}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </AuthTextField>
              <AuthTextField id="confirm-password" label="CONFIRMAR SENHA" icon={ShieldCheck}>
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  aria-label="Confirmar senha"
                  placeholder="********"
                  {...register("confirmPassword", { required: true })}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={showConfirm ? "Ocultar confirmacao" : "Mostrar confirmacao"}
                  onClick={() => setShowConfirm((current) => !current)}
                >
                  {showConfirm ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </AuthTextField>
            </div>
            <Button type="submit" icon={Save} loading={formState.isSubmitting} disabled={watch("password")?.length > 0 && watch("password").length < 8} className="auth-submit">
              Salvar senha
            </Button>
          </>
        ) : null}
      </form>
    </AuthLayout>
  );
}

function NotAuthorizedPage() {
  const { me, session, signOut } = useAuth();
  const email = me?.email || session?.user?.email;
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <ShieldAlert size={30} aria-hidden="true" />
        <h1>Sem acesso</h1>
        <p>Seu login esta autenticado, mas nao esta ativo em app_members.</p>
        <p className="muted">{email}</p>
        <Button type="button" icon={LogOut} onClick={signOut}>
          Sair
        </Button>
      </section>
    </main>
  );
}

function usePeriod() {
  const [params, setParams] = useSearchParams();
  const now = new Date();
  const ano = Number(params.get("ano") || window.localStorage.getItem("pvg_ano") || now.getFullYear());
  const mes = Number(params.get("mes") || window.localStorage.getItem("pvg_mes") || now.getMonth() + 1);
  const update = (next) => {
    const merged = { ano, mes, ...next };
    window.localStorage.setItem("pvg_ano", String(merged.ano));
    window.localStorage.setItem("pvg_mes", String(merged.mes));
    setParams((current) => {
      current.set("ano", String(merged.ano));
      current.set("mes", String(merged.mes));
      return current;
    });
  };
  return { ano, mes, update };
}

function NotFoundPage() {
  return (
    <FullPageState title="Pagina nao encontrada">
      <Link to="/" className="button button-primary">
        Voltar ao painel
      </Link>
    </FullPageState>
  );
}

function RoutesTree() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/definir-senha" element={<PasswordUpdatePage mode="invite" />} />
      <Route path="/redefinir-senha" element={<PasswordResetRequestPage />} />
      <Route path={passwordResetRedirectPath} element={<PasswordUpdatePage mode="reset" />} />
      <Route path="/sem-acesso" element={<NotAuthorizedPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<RequireMember />}>
          <Route path="/*" element={<PavageauApp />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RoutesTree />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
