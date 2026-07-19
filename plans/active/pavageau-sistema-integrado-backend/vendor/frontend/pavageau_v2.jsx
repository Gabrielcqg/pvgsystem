import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from "recharts";

/* ══════════════════════  TOKENS  ══════════════════════ */
const C = {
  navy: "#1E2A56", navyDeep: "#151D3E", navySoft: "#2C3B6E", navyLine: "#33417A",
  gold: "#C9A24D", goldSoft: "#E6D2A0", goldPale: "#FDF7E8",
  paper: "#F5F6FA", line: "#E3E6EE", ink: "#1E2A56", inkSoft: "#79829C",
  green: "#1C7A4E", red: "#A8322D", amber: "#B07D18",
  calcBg: "#EEF0F6",
};
const S = {
  display: "'Playfair Display', Georgia, serif",
  body: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

const HOJE = "2026-07-15";
const ANO = 2026;
const MESES_N = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES = MESES_N.map((_, i) => `${ANO}-${String(i + 1).padStart(2, "0")}`);
const MES_ATUAL = "2026-07";

/* ══════════  LISTAS FECHADAS — o acento deixa de existir  ══════════ */
const STATUS = ["Proposta", "Ativo", "Aguardando êxito", "Encerrado", "Sem êxito"];
const STATUS_COR = {
  "Proposta": C.inkSoft, "Ativo": C.navy, "Aguardando êxito": C.amber,
  "Encerrado": C.green, "Sem êxito": C.red,
};
const TIPO_HONORARIO = [
  "Fixo único", "Fixo mensal", "Fixo parcelado", "Êxito puro", "Sucumbência",
  "Fixo + Êxito", "Êxito + Sucumbência", "Fixo + Êxito + Sucumbência",
];
const TIPO_PARCELA = ["Inicial", "Mensal", "Êxito", "Sucumbência"];
/* categorias exatamente como o escritório já usa nas abas mensais */
const CAT_ENTRADA = ["Honorários", "Fixo", "Consultoria", "Outro"];
const CAT_SAIDA = ["Fixo", "Custas", "Infraestrutura", "Marketing", "Freelancer", "Restituição ao cliente", "Outro"];
const CAT_DIRETAS = ["Custas", "Restituição ao cliente"];
const FORMAS = ["PIX", "Boleto", "Transferência", "Cartão", "Dinheiro", "GRU", "DAS"];

/* ══════════════════════  HELPERS  ══════════════════════ */
const brl = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const pct = (v) => `${((v || 0) * 100).toFixed(0)}%`;
const compact = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`);
const mesDe = (s) => (s || "").slice(0, 7);
const rotMes = (m) => `${MESES_N[+m.slice(5, 7) - 1]}/${m.slice(0, 4)}`;
const fmtData = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : "—");
const diasDesde = (s) => Math.floor((new Date(HOJE) - new Date(s)) / 86400000);
let _id = 0; const nid = (p) => `${p}${++_id}`;

const SEED = {"parceiros":[["P1","A&E Advogados"],["P2","Eliton Vilalta"],["P3","Gonçalves/Mello"],["P4","Instagram"],["P5","Leardini"],["P6","Pavageau"]],"contratos":[["C1","Fulano 11","P6","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.01,0.04,0.07,0,7,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C2","Fulano 12","P6","","Fixo + Êxito",0.05,0.05,0.03,7,9,"Ativo","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C3","Fulano 8","P6","","Êxito + Sucumbência",0.01,0.06,0.07,0,3,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C4","Fulano 2","P6","0000000-00.0000.8.26.0000","Êxito puro",0.02,0.07,0.01,0,10,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C5","Fulano 13","P1","","Fixo parcelado",0.1,0.1,0.1,8,0,"Ativo","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C6","Fulano 14","P1","0000000-00.0000.8.26.0000","Fixo mensal",0.1,0.06,0.05,10,0,"Ativo","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C7","Fulano 15","P1","0000000-00.0000.8.26.0000","Êxito puro",0.08,0.02,0.1,0,10,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C8","Fulano 16","P1","0000000-00.0000.8.26.0000","",0.07,0.05,0.02,2,5,"Sem êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C9","Fulano 17","P4","0000000-00.0000.8.26.0000","Sucumbência",0.07,0.1,0.05,0,9,"Encerrado","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",1],["C10","Fulano 18","P4","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.09,0.04,0.08,0,9,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C11","Fulano 19","P4","0000000-00.0000.8.26.0000","Êxito puro",0.05,0.1,0.07,0,3,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C12","Fulano 20","P4","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.06,0.04,0.05,0,1,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C13","Fulano 21","P4","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.02,0.05,0.08,0,1,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C14","Fulano 7","P4","0000000-00.0000.8.26.0000","Êxito puro",0.09,0.1,0.04,0,9,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C15","Fulano 22","P4","0000000-00.0000.8.26.0000","Êxito puro",0.06,0.1,0.07,0,8,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C16","Fulano 23","P4","0000000-00.0000.8.26.0000","Sucumbência",0.05,0.05,0.05,0,7,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C17","Fulano 24","P4","0000000-00.0000.8.26.0000","Sucumbência",0.01,0.01,0.07,0,2,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C18","Fulano 25","P4","0000000-00.0000.8.26.0000","Êxito puro",0.03,0.05,0.04,0,3,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C19","Fulano 26","P4","","Êxito puro",0.04,0.04,0.04,0,3,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C20","Fulano 27","P4","0000000-00.0000.8.26.0000","Êxito puro",0.03,0.08,0.04,0,10,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C21","Fulano 28","P4","0000000-00.0000.8.26.0000","Êxito puro",0.06,0.07,0.04,0,5,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C22","Fulano 29","P4","0000000-00.0000.8.26.0000","Fixo + Êxito + Sucumbência",0.04,0.1,0.06,4,9,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C23","Fulano 4","P4","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.03,0.07,0.1,0,7,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C24","Fulano 30","P4","","Êxito puro",0.07,0.09,0.04,0,6,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C25","Fulano 31","P4","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.09,0.07,0.09,0,5,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C26","Fulano 32","P4","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.1,0.1,0.06,0,3,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C27","Fulano 33","P4","0000000-00.0000.8.26.0000","Fixo + Êxito",0.06,0.1,0.09,3,3,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C28","Fulano 34","P4","","Êxito puro",0.04,0.05,0.02,0,9,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C29","Fulano 35","P4","0000000-00.0000.8.26.0000","Êxito puro",0.03,0.01,0.06,0,2,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C30","Fulano 36","P4","0000000-00.0000.8.26.0000","Êxito puro",0.05,0.02,0.05,0,3,"Aguardando êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C31","Fulano 37","P4","","",0.08,0.01,0.08,0,0,"Sem êxito","Detalhes do acordo (exemplo)","Detalhes do acordo (exemplo)","CONTRATOS",0],["C32","Fulano 38","P4","","",0.04,0.1,0.08,0,3,"Sem êxito","Detalhes do acordo (exemplo)","PERDEMOS","CONTRATOS",0],["C33","Fulano 9","P5","","Êxito + Sucumbência",0.03,0.09,0.06,0,8,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C34","Fulano 39","P5","0000000-00.0000.8.26.0000","Êxito puro",0.05,0.05,0.07,0,5,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C35","Fulano 40","P5","","Êxito + Sucumbência",0.03,0.02,0.02,0,2,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C36","Fulano 41","P5","","Sucumbência",0.01,0.1,0.04,0,3,"Aguardando êxito","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C37","Fulano 42","P5","","Êxito puro",0.05,0.01,0.02,0,1,"Aguardando êxito","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C38","Fulano 43","P5","0000000-00.0000.8.26.0000","Sucumbência",0.07,0.1,0.07,0,1,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C39","Fulano 44","P5","","Fixo único",0.1,0.07,0.06,4,0,"Ativo","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C40","Fulano 45","P5","","Êxito puro",0.08,0.05,0.08,0,7,"Aguardando êxito","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C41","Fulano 46","P5","","Sucumbência",0.02,0.01,0.1,0,5,"Aguardando êxito","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C42","Fulano 47","P5","","Sucumbência",0.04,0.09,0.01,0,2,"Aguardando êxito","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C43","Fulano 48","P5","0000000-00.0000.8.26.0000","Êxito puro",0.02,0.03,0.04,0,8,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C44","Fulano 49","P5","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.09,0.05,0.03,0,5,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C45","Fulano 50","P5","","Sucumbência",0.06,0.03,0.1,0,8,"Aguardando êxito","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C46","Fulano 51","P5","","Fixo + Êxito",0.03,0.1,0.07,2,7,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C47","Fulano 52","P5","0000000-00.0000.8.26.0000","Êxito puro",0.09,0.1,0.09,0,7,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C48","Fulano 53","P5","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.09,0.09,0.01,0,2,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C49","Fulano 6","P5","0000000-00.0000.8.26.0000","Sucumbência",0.01,0.03,0.05,0,8,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C50","Fulano 54","P5","","Êxito + Sucumbência",0.05,0.05,0.1,0,9,"Aguardando êxito","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C51","Fulano 55","P5","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.09,0.06,0.06,0,2,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C52","Fulano 56","P5","0000000-00.0000.8.26.0000","Êxito puro",0.06,0.03,0.07,0,2,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C53","Fulano 57","P5","0000000-00.0000.8.26.0000","Êxito puro",0.07,0.07,0.09,0,2,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C54","Fulano 58","P5","","Fixo + Êxito",0.09,0.03,0.08,1,1,"Ativo","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C55","Fulano 59","P5","","Êxito puro",0.05,0.07,0.08,0,1,"Aguardando êxito","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C56","Fulano 60","P5","0000000-00.0000.8.26.0000","Sucumbência",0.09,0.01,0.05,0,4,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C57","Fulano 61","P5","0000000-00.0000.8.26.0000","Fixo + Êxito",0.03,0.01,0.09,5,0,"Ativo","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C58","Fulano 62","P5","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.03,0.01,0.06,0,7,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C59","Fulano 63","P5","","Fixo único",0.07,0.08,0.07,9,0,"Encerrado","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C60","Fulano 64","P5","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.1,0.06,0.03,0,1,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C61","Fulano 65","P5","","Fixo + Êxito",0.1,0.06,0.01,9,9,"Ativo","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C62","Fulano 66","P5","","Sucumbência",0.04,0.01,0.04,0,1,"Aguardando êxito","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C63","Fulano 67","P3","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.08,0.08,0.03,0,9,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C64","Fulano 68","P3","","Fixo + Êxito",0.02,0.08,0.06,5,6,"Aguardando êxito","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C65","Fulano 1","P3","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.02,0.01,0.03,0,3,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C66","Fulano 69","P3","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.1,0.09,0.01,0,4,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C67","Fulano 10","P3","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.07,0.09,0.06,0,7,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C68","Fulano 70","P3","0000000-00.0000.8.26.0000","Êxito puro",0.02,0.08,0.02,0,4,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C69","Fulano 71","P3","","Fixo único",0.08,0.06,0.05,3,0,"Ativo","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C70","Fulano 5","P3","0000000-00.0000.8.26.0000","Êxito + Sucumbência",0.06,0.02,0.01,0,10,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C71","Fulano 72","P2","","Fixo mensal",0.09,0.06,0.09,10,0,"Ativo","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C72","Fulano 73","P2","","Sucumbência",0.1,0.07,0.05,0,5,"Aguardando êxito","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C73","Fulano 74","P2","","Fixo mensal",0.05,0.03,0.01,5,0,"Ativo","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C74","Fulano 75","P2","","Fixo mensal",0.08,0.1,0.03,0,0,"Ativo","-","Detalhes do acordo (exemplo)","CONTRATOS",0],["C75","Fulano 76","P5","","Fixo único",0.09,0.06,0.1,2,0,"Proposta","—","Detalhes do acordo (exemplo)","CONTRATOS",1],["C76","Fulano 3","P5","","Fixo + Êxito",0.01,0.07,0.01,3,2,"Proposta","—","Detalhes do acordo (exemplo)","CONTRATOS",1],["C77","Fulano 77","P6","","Fixo + Êxito",0.02,0.02,0.09,7,7,"Proposta","—","Nao fechou - em negociacao","CONTRATOS",1],["C78","Fulano 78","P3","","Fixo mensal",0.05,0.03,0.02,8,0,"Ativo","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C79","Fulano 79","P3","","Êxito + Sucumbência",0.06,0.03,0.07,0,1,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C80","Fulano 80","P3","","Êxito + Sucumbência",0.09,0.1,0.09,0,9,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C81","Fulano 81","P3","","Êxito + Sucumbência",0.05,0.05,0.05,0,10,"Aguardando êxito","—","Detalhes do acordo (exemplo)","CONTRATOS",0],["C82","Fulano 82","P4","0000000-00.0000.8.26.0000","",0,0,0,7,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C83","Fulano 83","P4","0000000-00.0000.8.26.0000","",0,0,0,5,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C84","Fulano 84","P4","0000000-00.0000.8.26.0000","",0,0,0,7,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C85","Fulano 85","P4","0000000-00.0000.8.26.0000","",0,0,0,7,0,"Encerrado","","Pago — valor não registrado","ENCERRADOS",0],["C86","Fulano 86","P4","0000000-00.0000.8.26.0000","",0,0,0,5,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C87","Fulano 87","P4","0000000-00.0000.8.26.0000","",0,0,0,6,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C88","Fulano 88","P4","0000000-00.0000.8.26.0000","",0,0,0,8,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C89","Fulano 89","P4","0000000-00.0000.8.26.0000","",0,0,0,10,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C90","Fulano 90","P4","0000000-00.0000.8.26.0000","",0,0,0,9,0,"Encerrado","","Pago — valor não registrado","ENCERRADOS",0],["C91","Fulano 91","P4","0000000-00.0000.8.26.0000","",0,0,0,7,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C92","Fulano 92","P4","0000000-00.0000.8.26.0000","",0,0,0,5,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C93","Fulano 93","P4","0000000-00.0000.8.26.0000","",0,0,0,1,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C94","Fulano 94","P4","0000000-00.0000.8.26.0000","",0,0,0,2,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C95","Fulano 95","P4","0000000-00.0000.8.26.0000","",0,0,0,6,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C96","Fulano 96","P6","","",0,0,0,4,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C97","Fulano 97","P6","","",0,0,0,4,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C98","Fulano 98","P6","","",0,0,0,9,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C99","Fulano 99","P1","","",0,0,0,3,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C100","Fulano 100","P1","","",0,0,0,1,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C101","Fulano 101","P1","","",0,0,0,8,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C102","Fulano 102","P1","0000000-00.0000.8.26.0000","",0,0,0,1,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C103","Fulano 103","P1","","",0,0,0,1,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C104","Fulano 104","P1","0000000-00.0000.8.26.0000","",0,0,0,2,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C105","Fulano 105","P3","","",0,0,0,10,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C106","Fulano 106","P3","","",0,0,0,6,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C107","Fulano 107","P3","","",0,0,0,9,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",0],["C108","Fulano 17","P4","","",0,0,0,9,0,"Encerrado","","Detalhes do acordo (exemplo)","ENCERRADOS",1],["C109","Fulano 77","P6","","",0,0,0,3,0,"Proposta","","Detalhes do acordo (exemplo) | Negociando | mar/2026","PENDENTES",1],["C110","Fulano 76","P5","","",0,0,0,5,0,"Proposta","","Detalhes do acordo (exemplo) | Aguardando | mar/2026","PENDENTES",1],["C111","Fulano 3","P5","","",0,0,0,1,0,"Proposta","","Detalhes do acordo (exemplo) | Aguardando | mar/2026","PENDENTES",1]],"parcelas":[["H2","C2","Inicial",10,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H5","C5","Inicial",6,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H6","C6","Inicial",5,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H8","C8","Inicial",10,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H22","C22","Inicial",4,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H27","C27","Inicial",3,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H39","C39","Inicial",2,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H46","C46","Inicial",5,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H54","C54","Inicial",8,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H57","C57","Inicial",8,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H59","C59","Inicial",10,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H61","C61","Inicial",8,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H64","C64","Inicial",4,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H69","C69","Inicial",2,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H71","C71","Inicial",8,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H73","C73","Inicial",10,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H75","C75","Inicial",3,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H76","C76","Inicial",4,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H77","C77","Inicial",10,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H78","C78","Inicial",3,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H82","C82","Inicial",7,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H83","C83","Inicial",5,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H84","C84","Inicial",7,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H85","C85","Inicial",7,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H86","C86","Inicial",5,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H87","C87","Inicial",6,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H88","C88","Inicial",8,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H89","C89","Inicial",10,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H90","C90","Inicial",9,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H91","C91","Inicial",7,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H92","C92","Inicial",5,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H93","C93","Inicial",1,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H94","C94","Inicial",2,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H95","C95","Inicial",6,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H96","C96","Inicial",4,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H97","C97","Inicial",4,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H98","C98","Inicial",9,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H99","C99","Inicial",3,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H100","C100","Inicial",1,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H101","C101","Inicial",8,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H102","C102","Inicial",1,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H103","C103","Inicial",1,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H104","C104","Inicial",2,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H105","C105","Inicial",10,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H106","C106","Inicial",6,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H107","C107","Inicial",9,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["H108","C108","Inicial",9,"2026-01",1,"2026-01","importado — recebido histórico do Excel",1],["R1","C46","Inicial",5,"2026-05",1,"2026-05","Detalhes do acordo (exemplo)",0],["R2","C46","Mensal",7,"2026-06",0,"","Detalhes do acordo (exemplo)",0],["R3","C46","Mensal",3,"2026-07",0,"","Detalhes do acordo (exemplo)",0],["R4","C46","Mensal",6,"2026-08",0,"","Detalhes do acordo (exemplo)",0],["R5","C46","Mensal",7,"2026-09",0,"","Detalhes do acordo (exemplo)",0],["R6","C46","Mensal",7,"2026-10",0,"","Detalhes do acordo (exemplo)",0],["R7","C46","Mensal",4,"2026-11",0,"","Detalhes do acordo (exemplo)",0],["R8","C46","Mensal",5,"2026-12",0,"","Detalhes do acordo (exemplo)",0],["R9","C46","Mensal",8,"2027-01",0,"","Detalhes do acordo (exemplo)",0],["R10","C2","Inicial",8,"2026-05",0,"","Detalhes do acordo (exemplo)",0],["R11","C2","Inicial",9,"2026-06",0,"","Detalhes do acordo (exemplo)",0],["R12","C2","Inicial",5,"2026-07",0,"","Detalhes do acordo (exemplo)",0],["R13","C2","Inicial",6,"2026-08",0,"","Detalhes do acordo (exemplo)",0],["R15","C57","Mensal",6,"2026-12",1,"2025-10","Detalhes do acordo (exemplo)",0],["R16","C54","Mensal",5,"2026-03",1,"","Detalhes do acordo (exemplo)",0],["R17","C54","Mensal",8,"2026-04",1,"","Detalhes do acordo (exemplo)",0],["R18","C54","Mensal",2,"2026-05",0,"","Detalhes do acordo (exemplo)",0],["R19","C54","Mensal",10,"2026-06",0,"","Detalhes do acordo (exemplo)",0],["R20","C61","Inicial",6,"2026-05",1,"2026-05","Detalhes do acordo (exemplo)",0],["R22","C71","Mensal",9,"2026-05",1,"","Detalhes do acordo (exemplo)",0],["R23","C71","Mensal",10,"2026-06",0,"","Detalhes do acordo (exemplo)",0],["R24","C71","Mensal",1,"2026-07",0,"","Detalhes do acordo (exemplo)",0],["R25","C71","Mensal",5,"2026-08",0,"","Detalhes do acordo (exemplo)",0],["R26","C73","Mensal",10,"2026-05",0,"","Detalhes do acordo (exemplo)",0],["R27","C73","Mensal",8,"2026-06",0,"","Detalhes do acordo (exemplo)",0],["R28","C73","Mensal",7,"2026-07",0,"","Detalhes do acordo (exemplo)",0],["R29","C73","Mensal",2,"2026-08",0,"","Detalhes do acordo (exemplo)",0],["R30","C74","Mensal",2,"2026-12",0,"","Contínuo",0],["R32","C5","Mensal",6,"2026-05",0,"","Detalhes do acordo (exemplo)",0],["R33","C5","Mensal",10,"2026-06",0,"","Detalhes do acordo (exemplo)",0],["R34","C5","Mensal",4,"2026-07",0,"","Detalhes do acordo (exemplo)",0],["R35","C5","Mensal",9,"2026-08",0,"","Detalhes do acordo (exemplo)",0],["R36","C5","Mensal",8,"2026-09",0,"","Detalhes do acordo (exemplo)",0],["R37","C5","Mensal",8,"2026-10",0,"","Última",0],["R39","C9","Sucumbência",7,"2026-05",1,"2026-05","Encerrado — sucumbencia recebida",0],["R40","C91","Êxito",1,"2026-05",1,"2026-05","Detalhes do acordo (exemplo)",0],["R41","C16","Sucumbência",4,"2026-05",1,"2026-05","Detalhes do acordo (exemplo)",0]],"lancamentos":[["L1","2026-01-02","Fulano 1","entrada",10,"Honorários",1,"","JAN"],["L2","2026-01-07","Fulano 2","entrada",5,"Honorários",1,"","JAN"],["L3","2026-01-08","Fulano 3","entrada",6,"Honorários",1,"","JAN"],["L4","2026-01-09","Fulano 4","entrada",10,"Honorários",1,"","JAN"],["L5","2026-01-10","Fulano 5","entrada",4,"Honorários",1,"","JAN"],["L6","2026-01-11","Fulano 3","entrada",6,"Honorários",1,"","JAN"],["L7","2026-01-12","Fulano 6","entrada",8,"Honorários",1,"","JAN"],["L8","2026-01-13","Fulano 7","entrada",2,"Honorários",1,"","JAN"],["L9","2026-01-14","Fulano 8","entrada",3,"Honorários",1,"","JAN"],["L10","2026-01-15","Fulano 9","entrada",2,"Honorários",1,"","JAN"],["L11","2026-01-16","GOOGLE ADS","saida",6,"Marketing",1,"","JAN"],["L12","2026-01-17","Fulano 10","entrada",2,"Honorários",1,"","JAN"],["L13","2026-01-18","Fulano 3","entrada",6,"Honorários",1,"","JAN"],["L14","2026-01-19","Fulano 11","entrada",4,"Honorários",1,"","JAN"],["L15","2026-01-21","Fulano 12","saida",5,"Freelancer",1,"","JAN"],["L16","2026-01-22","Fulano 13","saida",8,"Freelancer",1,"","JAN"],["L17","2026-01-23","Fulano 14","entrada",10,"Honorários",1,"","JAN"],["L18","2026-01-24","Fulano 15","saida",9,"Custas",1,"","JAN"],["L19","2026-01-25","Fulano 16","saida",2,"Custas",1,"","JAN"],["L20","2026-01-26","Fulano 17","entrada",3,"Honorários",1,"","JAN"],["L21","2026-01-27","Fulano 18","saida",4,"Freelancer",1,"","JAN"],["L22","2026-01-28","CONSULTORIA DELTA 1/3","saida",3,"Fixo",1,"","JAN"],["L23","2026-01-29","Fulano 8","entrada",8,"Honorários",1,"","JAN"],["L24","2026-01-30","Fulano 4","entrada",6,"Honorários",1,"","JAN"],["L25","2026-01-20","Condomínio Santo André","saida",2,"Fixo",1,"","JAN"],["L26","2026-02-09","Fulano 19","entrada",8,"Honorários",1,"","FEV"],["L27","2026-02-11","Fulano 20","entrada",3,"Honorários",1,"","FEV"],["L28","2026-02-08","Fulano 21","entrada",4,"Honorários",1,"","FEV"],["L29","2026-02-07","Fulano 22","entrada",2,"Honorários",1,"","FEV"],["L30","2026-02-14","Fulano 23","entrada",2,"Honorários",1,"","FEV"],["L31","2026-02-15","Fulano 24","entrada",6,"Honorários",1,"","FEV"],["L32","2026-02-16","Fulano 25","entrada",8,"Honorários",1,"","FEV"],["L33","2026-02-13","Fulano 26","saida",1,"Custas",1,"","FEV"],["L34","2026-02-17","CONSULTORIA DELTA 2/3","saida",7,"Fixo",1,"","FEV"],["L35","2026-02-20","Fulano 27","entrada",10,"Fixo",1,"","FEV"],["L36","2026-02-20","Fulano 28","entrada",4,"Honorários",1,"","FEV"],["L37","2026-02-06","Fulano 29","saida",5,"Fixo",1,"","FEV"],["L38","2026-02-05","Fulano 30","saida",3,"Infraestrutura",1,"","FEV"],["L39","2026-02-23","Fulano 31","saida",6,"Infraestrutura",1,"","FEV"],["L40","25/02/206","Fulano 27","saida",9,"Infraestrutura",1,"","FEV"],["L41","2026-03-04","Fulano 32","saida",4,"Infraestrutura",1,"","MAR"],["L42","2026-04-07","Fulano 33","saida",10,"Infraestrutura",1,"","MAR"],["L43","2026-03-09","Fulano 34","saida",7,"Infraestrutura",1,"","MAR"],["L44","2026-03-24","Fulano 35","saida",6,"Outro",1,"","MAR"],["L45","2026-03-20","CONSULTORIA DELTA 3/3","saida",7,"Infraestrutura",1,"","MAR"],["L46","2026-03-21","Fulano 36","saida",3,"Infraestrutura",1,"","MAR"],["L47","2026-03-22","Fulano 37","saida",8,"Infraestrutura",1,"","MAR"],["L48","2026-03-07","Vivo novo chip","saida",58.91,"Infraestrutura",1,"","MAR"],["L49","2026-03-03","Fulano 38","entrada",2,"Honorários",1,"","MAR"],["L50","2026-03-04","Fulano 39","entrada",7,"Honorários",1,"","MAR"],["L51","2026-03-04","Fulano 40","entrada",10,"Honorários",1,"","MAR"],["L52","2026-03-05","Fulano 21","entrada",10,"Honorários",1,"","MAR"],["L53","2026-03-06","Fulano 41","entrada",7,"Honorários",1,"","MAR"],["L54","2026-03-06","Fulano 42","saida",1,"Infraestrutura",1,"","MAR"],["L55","2026-03-10","Fulano 43","entrada",5,"Honorários",1,"","MAR"],["L56","2026-03-13","Fulano 44","entrada",4,"Honorários",1,"","MAR"],["L57","2026-03-13","Fulano 45","saida",10,"Custas",1,"","MAR"],["L58","2026-03-17","Fulano 46","entrada",7,"Honorários",1,"","MAR"],["L59","2026-03-20","Fulano 47","entrada",3,"Honorários",1,"","MAR"],["L60","2026-03-25","Fulano 48","entrada",8,"Honorários",1,"","MAR"],["L61","2026-03-26","Fulano 49","entrada",7,"Honorários",1,"","MAR"],["L62","2026-03-27","Fulano 50","entrada",8,"Honorários",1,"","MAR"],["L63","2026-03-30","Fulano 51","entrada",1,"Honorários",1,"","MAR"],["L64","2026-03-20","Fulano 52","entrada",2,"Honorários",1,"","ABR"],["L65","2026-03-05","Fulano 21","entrada",9,"Honorários",1,"","ABR"],["L66","2026-03-04","Fulano 39","entrada",3,"Honorários",1,"","ABR"],["L67","2026-04-04","Fulano 53","entrada",10,"Honorários",1,"","ABR"],["L68","2026-03-10","Fulano 43","entrada",3,"Honorários",1,"","ABR"],["L69","2026-04-20","Fulano 54","saida",10,"Custas",1,"","ABR"],["L70","2026-03-06","Fulano 55","saida",5,"Infraestrutura",1,"","ABR"],["L71","2026-04-16","Fulano 56","saida",6,"Custas",1,"","ABR"],["L72","2026-04-23","Fulano 57","entrada",6,"Honorários",1,"","ABR"],["L73","2026-04-24","Fulano 58","saida",7,"Marketing",1,"","ABR"],["L74","2026-04-25","Fulano 59","saida",2,"Marketing",1,"","ABR"],["L75","2026-03-30","Fulano 51","entrada",9,"Honorários",1,"","ABR"],["L76","2026-05-20","Fulano 60","entrada",4,"Honorários",0,"","MAI"],["L77","2026-05-05","Fulano 21","entrada",10,"Honorários",0,"","MAI"],["L78","2026-05-04","Fulano 39","entrada",7,"Honorários",1,"","MAI"],["L79","2026-05-04","Fulano 61","entrada",6,"Honorários",1,"","MAI"],["L80","2026-05-10","Fulano 43","entrada",8,"Honorários",1,"","MAI"],["L81","2026-05-30","Fulano 51","entrada",1,"Honorários",1,"","MAI"],["L82","2026-05-22","Fulano 49","entrada",10,"Honorários",1,"","MAI"],["L83","2026-05-25","Fulano 62","saida",1,"Custas",1,"","MAI"],["L84","2026-05-28","Fulano 63","entrada",9,"Fixo",1,"","MAI"],["L85","2026-05-29","Fulano 64","entrada",6,"Honorários",1,"","MAI"],["L86","2026-05-18","Fulano 65","entrada",1,"Honorários",1,"","MAI"],["L87","2026-05-19","Fulano 66","entrada",9,"Honorários",1,"","MAI"],["L88","2026-05-20","Fulano 67","entrada",3,"Honorários",1,"","MAI"],["L89","2026-06-13","Fulano 68","entrada",4,"Honorários",1,"","JUN"],["L90","2026-06-14","Fulano 21","entrada",2,"Honorários",1,"","JUN"],["L91","2026-06-15","A&E ADV - DANIEL PAES","entrada",535.28,"Honorários",1,"","JUN"],["L92","2026-06-16","Fulano 69","entrada",7,"Honorários",1,"","JUN"],["L93","2026-06-18","Fulano 51","entrada",7,"Honorários",0,"","JUN"],["L94","2026-06-19","Fulano 63","entrada",4,"Fixo",1,"","JUN"],["L95","2026-06-20","Fulano 64","entrada",8,"Honorários",0,"","JUN"],["L96","2026-06-21","Fulano 70","entrada",4,"Honorários",1,"","JUN"],["L97","2026-06-22","Fulano 71","entrada",8,"Honorários",0,"","JUN"],["L98","2026-06-16","Fulano 72","entrada",5,"Honorários",1,"","JUN"],["L99","2026-06-17","Fulano 73","saida",2,"Outro",1,"","JUN"],["L100","2026-06-19","Fulano 74","saida",7,"Custas",1,"","JUN"],["L101","2026-06-30","Fulano 75","entrada",9,"Honorários",1,"","JUN"],["L102","2026-06-30","Fulano 76","entrada",10,"Honorários",1,"","JUN"],["L103","2026-06-30","Fulano 77","entrada",9,"Honorários",1,"","JUN"],["L104","2026-06-30","Fulano 78","entrada",7,"Honorários",1,"","JUN"],["L105","2026-06-14","Fulano 21","entrada",1,"Honorários",0,"","JUL"],["L106","2026-06-15","Fulano 39","entrada",5,"Honorários",0,"","JUL"],["L107","2026-06-16","Fulano 79","entrada",7,"Honorários",1,"","JUL"],["L108","2026-06-18","Fulano 51","entrada",4,"Honorários",0,"","JUL"],["L109","2026-06-19","Fulano 63","entrada",9,"Fixo",0,"","JUL"],["L110","2026-06-21","Fulano 70","entrada",9,"Honorários",0,"","JUL"],["L111","2026-06-22","Fulano 71","entrada",10,"Honorários",0,"","JUL"],["L112","2026-07-01","Fulano 80","entrada",9,"Honorários",1,"","JUL"],["L113","2026-07-08","Fulano 81","entrada",10,"Honorários",0,"","JUL"],["L114","2026-07-09","Fulano 82","entrada",3,"Honorários",0,"","JUL"],["L115","2026-07-11","Fulano 83","entrada",3,"Honorários",0,"","JUL"],["L116","2026-07-12","Fulano 78","entrada",7,"Honorários",0,"","JUL"]],"custosFixos":[["F1","Contador",3,1,9,1,12,0],["F2","JusBrasil",5,1,5,1,12,0],["F3","ChatGPT",4,1,2,10,12,0],["F4","Hospedainfo",9,1,9,7,12,0],["F5","Hostinger",8,1,7,7,12,0],["F6","Contador",1,1,1,6,12,1],["F7","Claude",10,1,3,2,12,0],["F8","Tráfego Pago — Gestor",3,1,8,3,12,0],["F9","Tráfego Pago — Google",6,1,3,3,12,0]],"params":{"caixaInicial":6,"metaCaixa":6,"metaRecorrencia":6,"recorrenciaAtual":3},"alertas":{"tipo":27,"status":19,"dup":4,"orfa":4,"mes":2,"tipoparc":2,"fixodup":1},"detalhes":{"tipo":["Exito + Sucumbencia → Êxito + Sucumbência","Exito puro → Êxito puro","Fixo + Exito → Fixo + Êxito","Fixo unico → Fixo único","Fixo → Fixo único","Sem exito → (vazio)","Sem êxito → (vazio)","Sucumbencia → Sucumbência"],"status":["Aguardando exito → Aguardando êxito","Pendente → Proposta","Sem exito → Sem êxito"],"dup":["Fulano 17","Fulano 3","Fulano 76","Fulano 77"],"orfa":["Fulano 108","Fulano 109","Fulano 110","Fulano 111"],"mes":["Fulano 61: \"mensal\"","Fulano 75: \"mensal\""],"tipoparc":["Sucumb. → Sucumbência"],"fixodup":["Contador"]}};

/* ══════════  IMPORTAÇÃO DOS DOIS EXCEL  ══════════ */
const importado = () => ({
  parceiros: SEED.parceiros.map(([id, nome]) => ({ id, nome })),
  contratos: SEED.contratos.map(([id, cliente, parceiroId, processo, tipoHonorario, pctExito, pctSucumb, pctQuota, fixoTotal, valorCausa, status, splitNick, obs, abaOrigem, dup]) =>
    ({ id, cliente, parceiroId, processo, tipoHonorario, pctExito, pctSucumb, pctQuota, fixoTotal, valorCausa, status, splitNick, obs, abaOrigem, dup: !!dup, dataProposta: "", dataFechamento: "" })),
  parcelas: SEED.parcelas.map(([id, contratoId, tipo, valor, mesEsperado, recebido, mesEfetivo, obs, imp]) =>
    ({ id, contratoId, tipo, valor, mesEsperado, recebido: !!recebido, mesEfetivo, obs, importado: !!imp })),
  lancamentos: SEED.lancamentos.map(([id, data, descricao, tipo, valor, categoria, pago, obs, aba]) =>
    ({ id, data, descricao, tipo, valor, categoria, forma: "—", pago: !!pago, contratoId: "", obs, aba, origem: "importado", origemId: "" })),
  custosFixos: SEED.custosFixos.map(([id, descricao, valor, recorrente, diaVenc, mesInicio, mesFim, dup]) =>
    ({ id, descricao, valor, recorrente: !!recorrente, diaVenc, mesInicio, mesFim, dup: !!dup })),
  params: SEED.params,
});

/* ══════════════════════  SEMENTE DE EXEMPLO  ══════════════════════ */
const exemplo = () => {
  const pj = [
    { id: "P1", nome: "Pavageau" }, { id: "P2", nome: "Leardini" },
    { id: "P3", nome: "Instagram" }, { id: "P4", nome: "Gonçalves/Mello" },
    { id: "P5", nome: "A&E Advogados" }, { id: "P6", nome: "Eliton Vilalta" },
  ];
  const ct = [
    { id: "C1", cliente: "Construtora Aurora", parceiroId: "P1", processo: "0801122-45.2026.8.26.0100", tipoHonorario: "Fixo + Êxito", pctExito: 0.2, pctSucumb: 0, pctQuota: 0.3, fixoTotal: 45000, valorCausa: 380000, status: "Ativo", splitNick: "", obs: "Ação declaratória", dataProposta: "2026-04-02", dataFechamento: "2026-04-18" },
    { id: "C2", cliente: "Metalúrgica Brandão", parceiroId: "P2", processo: "0803344-90.2026.8.26.0100", tipoHonorario: "Êxito + Sucumbência", pctExito: 0.25, pctSucumb: 0.1, pctQuota: 0.5, fixoTotal: 0, valorCausa: 620000, status: "Ativo", splitNick: "", obs: "Trabalhista", dataProposta: "2026-06-14", dataFechamento: "2026-07-01" },
    { id: "C3", cliente: "Padaria Trigo Real", parceiroId: "P3", processo: "0801990-33.2026.8.26.0100", tipoHonorario: "Fixo parcelado", pctExito: 0, pctSucumb: 0, pctQuota: 0.4, fixoTotal: 24000, valorCausa: 0, status: "Ativo", splitNick: "ref. 118", obs: "", dataProposta: "2026-03-20", dataFechamento: "2026-04-05" },
    { id: "C4", cliente: "Transportes Vega", parceiroId: "P6", processo: "0799001-77.2025.8.26.0100", tipoHonorario: "Êxito puro", pctExito: 0.3, pctSucumb: 0, pctQuota: 0.5, fixoTotal: 0, valorCausa: 240000, status: "Aguardando êxito", splitNick: "", obs: "Sentença favorável em 1º grau", dataProposta: "2025-11-04", dataFechamento: "2025-11-20" },
    { id: "C5", cliente: "Hotel Miramar", parceiroId: "P4", processo: "", tipoHonorario: "Fixo + Êxito", pctExito: 0.2, pctSucumb: 0, pctQuota: 0.35, fixoTotal: 35000, valorCausa: 400000, status: "Proposta", splitNick: "", obs: "Aguardando decisão do cliente", dataProposta: "2026-07-06", dataFechamento: "" },
  ];
  const pc = [
    { id: "R1", contratoId: "C1", tipo: "Inicial", valor: 18000, mesEsperado: "2026-06", recebido: true, mesEfetivo: "2026-06", obs: "" },
    { id: "R2", contratoId: "C1", tipo: "Mensal", valor: 9000, mesEsperado: "2026-07", recebido: false, mesEfetivo: "", obs: "" },
    { id: "R3", contratoId: "C1", tipo: "Mensal", valor: 9000, mesEsperado: "2026-08", recebido: false, mesEfetivo: "", obs: "" },
    { id: "R4", contratoId: "C3", tipo: "Mensal", valor: 6000, mesEsperado: "2026-05", recebido: true, mesEfetivo: "2026-05", obs: "" },
    { id: "R5", contratoId: "C3", tipo: "Mensal", valor: 6000, mesEsperado: "2026-06", recebido: false, mesEfetivo: "", obs: "Cliente pediu prazo" },
    { id: "R6", contratoId: "C3", tipo: "Mensal", valor: 6000, mesEsperado: "2026-07", recebido: false, mesEfetivo: "", obs: "" },
  ];
  const lc = [
    { id: "L1", data: "2026-06-03", descricao: "Honorário inicial — Construtora Aurora", tipo: "entrada", valor: 18000, categoria: "Honorários", forma: "PIX", pago: true, contratoId: "C1", obs: "", origem: "parcela", origemId: "R1" },
    { id: "L2", data: "2026-05-28", descricao: "Parcela 1 — Padaria Trigo Real", tipo: "entrada", valor: 6000, categoria: "Honorários", forma: "Boleto", pago: true, contratoId: "C3", obs: "", origem: "parcela", origemId: "R4" },
    { id: "L3", data: "2026-07-09", descricao: "Custas de distribuição", tipo: "saida", valor: 2750, categoria: "Custas processuais", forma: "GRU", pago: true, contratoId: "C2", obs: "", origem: "manual", origemId: "" },
    { id: "L4", data: "2026-07-12", descricao: "Parecer societário", tipo: "entrada", valor: 4800, categoria: "Consultoria", forma: "PIX", pago: true, contratoId: "", obs: "", origem: "manual", origemId: "" },
    { id: "L5", data: "2026-07-10", descricao: "Devolução de diligência não usada", tipo: "saida", valor: 1900, categoria: "Restituição ao cliente", forma: "PIX", pago: true, contratoId: "C3", obs: "", origem: "manual", origemId: "" },
  ];
  const cf = [
    { id: "F1", descricao: "Contador", valor: 2600, recorrente: true, diaVenc: 9, mesInicio: 1, mesFim: 12 },
    { id: "F2", descricao: "JusBrasil", valor: 890, recorrente: true, diaVenc: 5, mesInicio: 1, mesFim: 12 },
    { id: "F3", descricao: "Claude", valor: 320, recorrente: true, diaVenc: 3, mesInicio: 2, mesFim: 12 },
    { id: "F4", descricao: "Hostinger", valor: 140, recorrente: true, diaVenc: 7, mesInicio: 7, mesFim: 12 },
    { id: "F5", descricao: "Tráfego pago — Google", valor: 4500, recorrente: true, diaVenc: 3, mesInicio: 3, mesFim: 12 },
  ];
  const tf = [
    { id: "T1", titulo: "Cobrar parcela de junho", contratoId: "C3", resp: "Financeiro", prazo: "2026-07-14", status: "aberta" },
    { id: "T2", titulo: "Reunião de fechamento", contratoId: "C5", resp: "Dra. Helena", prazo: "2026-07-17", status: "aberta" },
  ];
  return { parceiros: pj, contratos: ct, parcelas: pc, lancamentos: lc, custosFixos: cf, tarefas: tf,
    params: { caixaInicial: 84000, metaCaixa: 180000, metaRecorrencia: 15000, recorrenciaAtual: 1500 } };
};

const VAZIO = {
  parceiros: [], contratos: [], parcelas: [], lancamentos: [], custosFixos: [], tarefas: [],
  params: { caixaInicial: 0, metaCaixa: 0, metaRecorrencia: 0, recorrenciaAtual: 0 },
};

/* ══════════════════════  APP  ══════════════════════ */
export default function App() {
  const [db, setDb] = useState(VAZIO);
  const [view, setView] = useState("painel");
  const [modal, setModal] = useState(null);
  const [cadeia, setCadeia] = useState(-1);
  const [flash, setFlash] = useState(null);

  const up = (k, fn) => setDb((p) => ({ ...p, [k]: fn(p[k]) }));

  const rodar = (msg) => {
    setFlash(msg); setCadeia(0);
    [1, 2, 3].forEach((i) => setTimeout(() => setCadeia(i), i * 300));
    setTimeout(() => setCadeia(-1), 2000);
    setTimeout(() => setFlash(null), 3800);
  };

  /* ─── LIGAÇÃO 1: parcela recebida → lançamento ─── */
  const receberParcela = (parcelaId, mesEfetivo = MES_ATUAL) => {
    const p = db.parcelas.find((x) => x.id === parcelaId);
    const ct = db.contratos.find((c) => c.id === p.contratoId);
    up("parcelas", (ps) => ps.map((x) => (x.id === parcelaId ? { ...x, recebido: true, mesEfetivo } : x)));
    up("lancamentos", (ls) => [...ls, {
      id: nid("L"), data: `${mesEfetivo}-${HOJE.slice(8, 10)}`,
      descricao: `${p.tipo} — ${ct.cliente}`, tipo: "entrada", valor: p.valor,
      categoria: "Honorários", forma: "PIX", pago: true, contratoId: ct.id, obs: "",
      origem: "parcela", origemId: p.id,
    }]);
    rodar(`${p.tipo} de ${ct.cliente} recebida — lançamento criado sozinho.`);
  };

  const estornarParcela = (parcelaId) => {
    up("parcelas", (ps) => ps.map((x) => (x.id === parcelaId ? { ...x, recebido: false, mesEfetivo: "" } : x)));
    up("lancamentos", (ls) => ls.filter((l) => !(l.origem === "parcela" && l.origemId === parcelaId)));
    rodar("Recebimento estornado — o lançamento correspondente saiu do caixa.");
  };

  /* ─── LIGAÇÃO 2: custo fixo do mês → lançamento ─── */
  const lancarFixo = (custoId, mes) => {
    const cf = db.custosFixos.find((x) => x.id === custoId);
    const dia = String(Math.min(cf.diaVenc, 28)).padStart(2, "0");
    up("lancamentos", (ls) => [...ls, {
      id: nid("L"), data: `${mes}-${dia}`, descricao: cf.descricao, tipo: "saida",
      valor: cf.valor, categoria: "Custo fixo", forma: "Boleto", pago: true,
      contratoId: "", obs: "", origem: "fixo", origemId: `${custoId}:${mes}`,
    }]);
    rodar(`${cf.descricao} de ${rotMes(mes)} lançado — caixa, DRE e balanço recalculados.`);
  };

  const addLancamento = (l) => {
    up("lancamentos", (ls) => [...ls, { ...l, id: nid("L"), origem: "manual", origemId: "" }]);
    rodar(`${l.tipo === "entrada" ? "Entrada" : "Saída"} de ${brl(l.valor)} lançada — três relatórios reescritos.`);
  };

  /* ─── LIGAÇÃO 3: proposta fechada → contrato + parcelas ─── */
  const fecharContrato = (contratoId, nParc) => {
    const ct = db.contratos.find((c) => c.id === contratoId);
    up("contratos", (cs) => cs.map((c) => (c.id === contratoId ? { ...c, status: "Ativo", dataFechamento: HOJE } : c)));
    if (ct.fixoTotal > 0 && nParc > 0) {
      const valor = Math.round(ct.fixoTotal / nParc);
      const base = +MES_ATUAL.slice(5, 7);
      const novas = Array.from({ length: nParc }, (_, i) => {
        const mm = base + i;
        return {
          id: nid("R"), contratoId, tipo: i === 0 ? "Inicial" : "Mensal", valor,
          mesEsperado: `${ANO + Math.floor((mm - 1) / 12)}-${String(((mm - 1) % 12) + 1).padStart(2, "0")}`,
          recebido: false, mesEfetivo: "", obs: "",
        };
      });
      up("parcelas", (ps) => [...ps, ...novas]);
      rodar(`${ct.cliente} fechou — ${nParc} parcelas de ${brl(valor)} entraram no a receber.`);
    } else rodar(`${ct.cliente} fechou.`);
  };

  /* ═════════════  MOTOR — nada aqui é digitado  ═════════════ */
  const m = useMemo(() => {
    const { lancamentos: L, contratos: CT, parcelas: PC, custosFixos: CF, params } = db;
    const pagos = L.filter((l) => l.pago);
    const soma = (arr) => arr.reduce((s, l) => s + l.valor, 0);
    const noMes = (mes, tipo) => soma(pagos.filter((l) => mesDe(l.data) === mes && l.tipo === tipo));

    const caixa = params.caixaInicial + pagos.reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0);
    const fatAtual = noMes(MES_ATUAL, "entrada");
    const fatAnt = noMes("2026-06", "entrada");
    const gastoAtual = noMes(MES_ATUAL, "saida");

    // por contrato
    const porContrato = {};
    CT.forEach((c) => {
      const ps = PC.filter((p) => p.contratoId === c.id);
      const recebido = soma(ps.filter((p) => p.recebido));
      const exitoTotal = (c.valorCausa || 0) * (c.pctExito || 0);
      const sucumbTotal = (c.valorCausa || 0) * (c.pctSucumb || 0);
      porContrato[c.id] = {
        parcelas: ps, fixoRecebido: recebido,
        fixoPendente: Math.max((c.fixoTotal || 0) - recebido, 0),
        exitoTotal, sucumbTotal,
        exitoParceiro: exitoTotal * (c.pctQuota || 0),
        exitoEscritorio: exitoTotal * (1 - (c.pctQuota || 0)),
        sucumbParceiro: sucumbTotal * (c.pctQuota || 0),
        sucumbEscritorio: sucumbTotal * (1 - (c.pctQuota || 0)),
      };
    });
    const proj = (c) => porContrato[c.id].exitoEscritorio + porContrato[c.id].sucumbEscritorio;

    const ativos = CT.filter((c) => ["Ativo", "Aguardando êxito"].includes(c.status));
    const propostas = CT.filter((c) => c.status === "Proposta");
    const fechados = CT.filter((c) => c.dataFechamento);
    const comData = CT.filter((c) => c.dataProposta).length;
    const denom = comData || CT.length;
    const num = comData ? fechados.length : CT.filter((c) => c.status !== "Proposta").length;
    const conversao = denom ? Math.round((num / denom) * 100) : 0;
    const semDatas = !comData && CT.length > 0;
    const fechadosMes = CT.filter((c) => mesDe(c.dataFechamento) === MES_ATUAL).length;
    const propostasMes = CT.filter((c) => mesDe(c.dataProposta) === MES_ATUAL).length;

    // parcelas
    const aberto = PC.filter((p) => !p.recebido);
    const atrasadas = aberto.filter((p) => p.mesEsperado < MES_ATUAL)
      .map((p) => ({ ...p, contrato: CT.find((c) => c.id === p.contratoId) }));
    const inadimp = soma(atrasadas);
    const aReceber = soma(aberto.filter((p) => p.mesEsperado >= MES_ATUAL));
    const exitoProjEscritorio = ativos.reduce((s, c) => s + proj(c), 0);
    const exitoProjParceiro = ativos.reduce((s, c) => s + porContrato[c.id].exitoParceiro + porContrato[c.id].sucumbParceiro, 0);
    const fixoPendenteTotal = ativos.reduce((s, c) => s + porContrato[c.id].fixoPendente, 0);
    const receitaRealizada = soma(pagos.filter((l) => l.tipo === "entrada"));

    // custos fixos do mês corrente
    const mesN = +MES_ATUAL.slice(5, 7);
    const fixosDoMes = CF.filter((f) => f.recorrente && f.mesInicio <= mesN && (f.mesFim || 12) >= mesN)
      .map((f) => ({
        ...f,
        lancado: L.some((l) => l.origem === "fixo" && l.origemId === `${f.id}:${MES_ATUAL}`),
      }));
    const custoFixoMensal = CF.filter((f) => f.recorrente && f.mesInicio <= mesN && (f.mesFim || 12) >= mesN)
      .reduce((s, f) => s + f.valor, 0);

    // gastos por categoria
    const porCat = {};
    pagos.filter((l) => l.tipo === "saida" && mesDe(l.data) === MES_ATUAL)
      .forEach((l) => { porCat[l.categoria] = (porCat[l.categoria] || 0) + l.valor; });
    const gastosCat = Object.entries(porCat).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);

    // restituições
    const restit = pagos.filter((l) => l.categoria === "Restituição ao cliente" && mesDe(l.data) === MES_ATUAL);

    // DRE do mês
    const rec = fatAtual;
    const diretos = soma(pagos.filter((l) => l.tipo === "saida" && mesDe(l.data) === MES_ATUAL &&
      CAT_DIRETAS.includes(l.categoria)));
    const despOp = gastoAtual - diretos;
    const resultado = rec - diretos - despOp;
    const margem = rec ? Math.round((resultado / rec) * 100) : 0;

    // série anual
    let acc = params.caixaInicial;
    const serie = MESES.map((mm) => {
      const e = noMes(mm, "entrada"), s = noMes(mm, "saida");
      acc += e - s;
      return { mes: MESES_N[+mm.slice(5, 7) - 1], caixa: Math.round(acc), entrada: e, saida: s, resultado: e - s };
    });

    // balanço
    const previstos = soma(L.filter((l) => !l.pago && l.tipo === "saida"));
    const ativoTotal = caixa + aReceber + inadimp;
    const pl = ativoTotal - previstos;

    // saúde da meta
    const metaPct = params.metaCaixa ? Math.min(caixa / params.metaCaixa, 1) : 0;
    const mesesReserva = custoFixoMensal ? caixa / custoFixoMensal : 0;
    const pctRecorrente = fatAtual ? params.recorrenciaAtual / fatAtual : 0;

    return {
      caixa, fatAtual, fatAnt, gastoAtual, porContrato, proj, ativos, propostas,
      conversao, semDatas, fechadosMes, propostasMes, atrasadas, inadimp, aReceber,
      exitoProjEscritorio, exitoProjParceiro, fixoPendenteTotal, receitaRealizada,
      fixosDoMes, custoFixoMensal, gastosCat, restit,
      rec, diretos, despOp, resultado, margem, serie,
      previstos, ativoTotal, pl, metaPct, mesesReserva, pctRecorrente,
    };
  }, [db]);

  const vazio = !db.contratos.length && !db.lancamentos.length;

  const NAV = [
    { g: "PAINEL", itens: [{ k: "painel", n: "Painel" }] },
    { g: "CONTRATOS", itens: [{ k: "contratos", n: "Contratos" }, { k: "parcelas", n: "Parcelas" }] },
    { g: "FINANCEIRO", itens: [{ k: "lancamentos", n: "Lançamentos" }, { k: "fixos", n: "Custos fixos" }, { k: "fluxo", n: "Fluxo de caixa" }, { k: "dre", n: "DRE" }, { k: "balanco", n: "Balanço" }] },
    { g: "OPERAÇÃO", itens: [{ k: "tarefas", n: "Tarefas" }, { k: "migracao", n: "Migração" }, { k: "ajustes", n: "Ajustes" }] },
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
        @keyframes slideUp { from { opacity:0; transform: translateY(9px);} to {opacity:1; transform:none;} }
        .row:hover { background: #FAFBFD; }
        .btn:hover { filter: brightness(1.12); }
        .navitem:hover { color: #E6D2A0 !important; }
        .card { animation: slideUp .3s ease both; }
        input:focus, select:focus { outline: 2px solid ${C.gold}; outline-offset: -1px; }
        button:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* ───── SIDEBAR ───── */}
        <aside style={{ width: 210, background: C.navyDeep, color: "#fff", padding: "24px 0", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <div style={{ padding: "0 20px 20px", borderBottom: `1px solid ${C.navyLine}` }}>
            <div style={{ fontFamily: S.display, fontSize: 20, letterSpacing: ".06em", fontWeight: 700 }}>PAVAGEAU</div>
            <div style={{ fontSize: 9, letterSpacing: ".2em", color: C.gold, marginTop: 3 }}>SISTEMA INTEGRADO</div>
          </div>
          <nav style={{ padding: "14px 0", flex: 1 }}>
            {NAV.map((grupo) => (
              <div key={grupo.g} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 8.5, letterSpacing: ".2em", color: "#5F6A8C", padding: "6px 20px 3px", fontWeight: 600 }}>{grupo.g}</div>
                {grupo.itens.map((it) => {
                  const on = view === it.k;
                  return (
                    <button key={it.k} onClick={() => setView(it.k)} className="navitem" style={{
                      display: "block", width: "100%", padding: "8px 20px", textAlign: "left",
                      background: on ? C.navySoft : "transparent", border: "none",
                      borderLeft: `2px solid ${on ? C.gold : "transparent"}`,
                      color: on ? "#fff" : "#A9B2CC", fontSize: 13, fontFamily: S.body, cursor: "pointer",
                    }}>{it.n}</button>
                  );
                })}
              </div>
            ))}
          </nav>
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.navyLine}`, fontSize: 10, color: "#7C86A6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: C.green }} />
              {db.lancamentos.length} lançamentos · {db.contratos.length} contratos
            </div>
          </div>
        </aside>

        {/* ───── MAIN ───── */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <header style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: ".2em", color: C.gold, fontWeight: 600 }}>{rotMes(MES_ATUAL).toUpperCase()}</div>
              <h1 style={{ fontFamily: S.display, fontSize: 24, margin: "2px 0 0", fontWeight: 700 }}>{TITULO}</h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setModal({ t: "contrato" })} className="btn" style={btnGhost}>+ Contrato</button>
              <button onClick={() => setModal({ t: "lancamento" })} className="btn" style={btnSolid}>+ Lançamento</button>
            </div>
          </header>

          <Cadeia ativo={cadeia} flash={flash} />

          <div style={{ padding: "20px 28px 60px" }}>
            {vazio && view === "painel" ? (
              <Comeco onExemplo={() => { setDb(exemplo()); rodar("Dados de exemplo carregados."); }}
                onImportar={() => { setDb(importado()); rodar("Histórico dos dois Excel importado."); setView("migracao"); }}
                onAjustes={() => setView("ajustes")} />
            ) : (
              <>
                {view === "painel" && <Painel db={db} m={m} goto={setView} />}
                {view === "contratos" && <Contratos db={db} m={m} setModal={setModal} onFechar={fecharContrato} />}
                {view === "parcelas" && <Parcelas db={db} m={m} receber={receberParcela} estornar={estornarParcela} setModal={setModal} />}
                {view === "lancamentos" && <Lancamentos db={db} setModal={setModal} />}
                {view === "fixos" && <Fixos db={db} m={m} lancar={lancarFixo} setModal={setModal} up={up} />}
                {view === "fluxo" && <Fluxo db={db} m={m} />}
                {view === "dre" && <DRE m={m} />}
                {view === "balanco" && <Balanco m={m} db={db} />}
                {view === "tarefas" && <Tarefas db={db} up={up} setModal={setModal} />}
                {view === "migracao" && <Migracao db={db} m={m} />}
                {view === "ajustes" && <Ajustes db={db} up={up} setDb={setDb} rodar={rodar} />}
              </>
            )}
          </div>
        </main>
      </div>

      {modal?.t === "lancamento" && <MLancamento db={db} onClose={() => setModal(null)} onSave={addLancamento} />}
      {modal?.t === "contrato" && <MContrato db={db} onClose={() => setModal(null)}
        onSave={(c) => up("contratos", (cs) => [...cs, { ...c, id: nid("C") }])} />}
      {modal?.t === "parcela" && <MParcela db={db} contratoId={modal.contratoId} onClose={() => setModal(null)}
        onSave={(p) => up("parcelas", (ps) => [...ps, { ...p, id: nid("R") }])} />}
      {modal?.t === "fixo" && <MFixo onClose={() => setModal(null)}
        onSave={(f) => up("custosFixos", (fs) => [...fs, { ...f, id: nid("F") }])} />}
      {modal?.t === "tarefa" && <MTarefa db={db} onClose={() => setModal(null)}
        onSave={(t) => up("tarefas", (ts) => [...ts, { ...t, id: nid("T"), status: "aberta" }])} />}
      {modal?.t === "fecharContrato" && <MFechar contrato={db.contratos.find((c) => c.id === modal.id)}
        onClose={() => setModal(null)} onSave={(n) => { fecharContrato(modal.id, n); setModal(null); }} />}
    </div>
  );
}

/* ══════════════  A CADEIA  ══════════════ */
function Cadeia({ ativo, flash }) {
  const etapas = ["Lançamento", "Fluxo de caixa", "DRE", "Balanço"];
  return (
    <div style={{ background: C.navy, padding: "8px 28px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minHeight: 40 }}>
      <span style={{ fontSize: 8.5, letterSpacing: ".18em", color: "#8B96BC", fontWeight: 600 }}>CADEIA</span>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {etapas.map((e, i) => (
          <React.Fragment key={e}>
            <span style={{
              fontSize: 10.5, padding: "3px 9px", borderRadius: 2,
              background: ativo === i ? C.gold : "transparent",
              color: ativo === i ? C.navyDeep : ativo > i ? C.goldSoft : "#7A85AB",
              fontWeight: ativo === i ? 600 : 400,
              border: `1px solid ${ativo >= i && ativo >= 0 ? C.gold : "#3B4778"}`,
              animation: ativo === i ? "pulseGold .6s ease-out" : "none", transition: "all .2s",
            }}>{e}</span>
            {i < 3 && <span style={{ color: ativo > i ? C.gold : "#4A5588", fontSize: 11 }}>→</span>}
          </React.Fragment>
        ))}
      </div>
      {flash && <span style={{ fontSize: 11, color: C.goldSoft, animation: "slideUp .3s ease" }}>{flash}</span>}
    </div>
  );
}

/* ══════════════  COMEÇO (estado vazio)  ══════════════ */
function Comeco({ onExemplo, onImportar, onAjustes }) {
  return (
    <div className="card" style={{ background: "#fff", border: `1px solid ${C.line}`, padding: "40px 36px", maxWidth: 720 }}>
      <div style={{ fontSize: 9, letterSpacing: ".2em", color: C.gold, fontWeight: 600 }}>SISTEMA VAZIO</div>
      <h2 style={{ fontFamily: S.display, fontSize: 30, margin: "8px 0 10px", fontWeight: 700 }}>
        Do zero, e desta vez tudo conversa
      </h2>
      <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.7, maxWidth: 560 }}>
        Nenhum número aqui é digitado duas vezes. Você preenche <b style={{ color: C.ink }}>contratos</b>,{" "}
        <b style={{ color: C.ink }}>parcelas</b>, <b style={{ color: C.ink }}>lançamentos</b> e{" "}
        <b style={{ color: C.ink }}>custos fixos</b>. Caixa, DRE, balanço, projeções e inadimplência
        são calculados — e não têm campo para digitar.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, margin: "28px 0" }}>
        <div style={{ borderLeft: `2px solid ${C.gold}`, paddingLeft: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: ".14em", color: C.gold, fontWeight: 600 }}>VOCÊ PREENCHE</div>
          <ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 12.5, lineHeight: 2, color: C.ink }}>
            <li>Parâmetros e custos fixos</li>
            <li>Contratos e parceiros</li>
            <li>Parcelas esperadas</li>
            <li>Lançamentos avulsos</li>
          </ul>
        </div>
        <div style={{ borderLeft: `2px solid ${C.line}`, paddingLeft: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: ".14em", color: C.inkSoft, fontWeight: 600 }}>🔒 O SISTEMA CALCULA</div>
          <ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 12.5, lineHeight: 2, color: C.inkSoft }}>
            <li>Caixa, DRE e balanço</li>
            <li>Fixo pendente e a receber</li>
            <li>Êxito projetado (seu e do parceiro)</li>
            <li>Inadimplência e conversão</li>
          </ul>
        </div>
      </div>

      <div style={{ display: "flex", gap: 9 }}>
        <button onClick={onImportar} className="btn" style={{ ...btnSolid, background: C.gold, color: C.navyDeep, fontWeight: 600 }}>
          Importar o histórico dos dois Excel
        </button>
        <button onClick={onAjustes} className="btn" style={btnGhost}>Configurar do zero</button>
        <button onClick={onExemplo} className="btn" style={btnGhost}>Dados de exemplo</button>
      </div>
    </div>
  );
}

/* ══════════════  PAINEL  ══════════════ */
function Painel({ db, m, goto }) {
  const delta = m.fatAnt ? Math.round(((m.fatAtual - m.fatAnt) / m.fatAnt) * 100) : 0;
  const abertas = db.tarefas.filter((t) => t.status === "aberta");
  const urgentes = abertas.filter((t) => t.prazo <= HOJE);

  return (
    <>
      <Faixa n="Como estou" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10, marginBottom: 26 }}>
        <KPI r="Caixa hoje" v={brl(m.caixa)} n={`${pct(m.metaPct)} da meta de ${brl(db.params.metaCaixa)}`} c={C.navy} />
        <KPI r="Faturamento do mês" v={brl(m.fatAtual)} n={m.fatAnt ? `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}% vs ${brl(m.fatAnt)}` : "sem base anterior"} c={delta >= 0 ? C.green : C.red} />
        <KPI r="A receber" v={brl(m.aReceber)} n={`+ ${brl(m.exitoProjEscritorio)} projetado (seu)`} c={C.gold} />
        <KPI r="Inadimplência" v={brl(m.inadimp)} n={`${m.atrasadas.length} parcela${m.atrasadas.length !== 1 ? "s" : ""} em atraso`} c={m.inadimp ? C.red : C.green} d={!!m.inadimp} />
      </div>

      <Faixa n="O que exige ação hoje" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 26 }}>
        <Card t="Parcelas em atraso" a={{ t: "Ver parcelas", f: () => goto("parcelas") }}>
          {m.atrasadas.map((p) => (
            <div key={p.id} className="row" style={linhaFlex}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.contrato?.cliente}</div>
                <div style={{ fontSize: 11, color: C.inkSoft }}>{p.tipo} · esperada em {rotMes(p.mesEsperado)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: S.mono, fontSize: 13, fontWeight: 600 }}>{brl(p.valor)}</div>
                <div style={{ fontSize: 10, color: C.red, fontWeight: 600 }}>em aberto</div>
              </div>
            </div>
          ))}
          {!m.atrasadas.length && <Vazio t="Carteira em dia." />}
        </Card>
        <Card t="Tarefas" a={{ t: "Ver todas", f: () => goto("tarefas") }}>
          {urgentes.map((t) => (
            <div key={t.id} className="row" style={linhaFlex}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.titulo}</div>
                <div style={{ fontSize: 11, color: C.inkSoft }}>
                  {db.contratos.find((c) => c.id === t.contratoId)?.cliente || "—"} · {t.resp}
                </div>
              </div>
              <span style={{ fontFamily: S.mono, fontSize: 10.5, fontWeight: 600, color: t.prazo < HOJE ? C.red : C.amber }}>
                {t.prazo < HOJE ? `${diasDesde(t.prazo)}d atraso` : "hoje"}
              </span>
            </div>
          ))}
          {!urgentes.length && <Vazio t="Nada vencendo hoje." />}
        </Card>
      </div>

      <Faixa n="Análises do mês — recalculadas a cada lançamento" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Card t="Gastos e categorias" s="Cada despesa classificada">
          {m.gastosCat.length ? (
            <>
              <div style={{ height: 190, marginTop: 6 }}>
                <ResponsiveContainer>
                  <BarChart data={m.gastosCat} layout="vertical" margin={{ left: 4, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="nome" width={126} tickLine={false} axisLine={false} tick={{ fontSize: 10.5, fill: C.ink, fontFamily: S.body }} />
                    <Tooltip formatter={(v) => brl(v)} cursor={{ fill: "#F0F2F7" }} contentStyle={tipStyle} />
                    <Bar dataKey="valor" radius={[0, 2, 2, 0]} barSize={13}>
                      {m.gastosCat.map((g, i) => <Cell key={i} fill={g.nome === "Restituição ao cliente" ? C.gold : C.navy} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Rodape>Total <b style={{ fontFamily: S.mono }}>{brl(m.gastoAtual)}</b> · maior peso: <b>{m.gastosCat[0]?.nome}</b></Rodape>
            </>
          ) : <Vazio t="Nenhuma saída lançada neste mês." />}
        </Card>

        <Card t="Clientes fechados" s="Quantas propostas viraram contrato">
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, margin: "14px 0 6px" }}>
            <span style={{ fontFamily: S.display, fontSize: 44, fontWeight: 700, lineHeight: 1 }}>{m.conversao || 0}%</span>
            <span style={{ fontSize: 12, color: C.inkSoft }}>de conversão</span>
          </div>
          <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: C.line, margin: "10px 0 14px" }}>
            <div style={{ width: `${m.conversao || 0}%`, background: C.navy }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, textAlign: "center" }}>
            <Mini n={m.propostasMes} l="propostas no mês" />
            <Mini n={m.fechadosMes} l="fechados no mês" c={C.green} />
            <Mini n={m.propostas.length} l="propostas em aberto" c={C.gold} />
          </div>
          <Rodape>Em aberto: {m.propostas.map((c) => c.cliente).join(" · ") || "—"}</Rodape>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 26 }}>
        <Card t="Restituições" s="Valores pagos ao processo a devolver ao cliente">
          <div style={{ fontFamily: S.display, fontSize: 32, fontWeight: 700, margin: "10px 0 12px" }}>
            {brl(m.restit.reduce((s, l) => s + l.valor, 0))}
          </div>
          {m.restit.map((l) => (
            <div key={l.id} className="row" style={{ ...linhaFlex, fontSize: 12.5 }}>
              <div>
                <div style={{ fontWeight: 500 }}>{db.contratos.find((c) => c.id === l.contratoId)?.cliente || "—"}</div>
                <div style={{ fontSize: 11, color: C.inkSoft }}>{l.descricao}</div>
              </div>
              <span style={{ fontFamily: S.mono, fontWeight: 600 }}>{brl(l.valor)}</span>
            </div>
          ))}
          {!m.restit.length && <Vazio t="Nenhuma restituição neste mês." />}
        </Card>

        <Card t="Inadimplência" s="Parcelas em atraso, evidenciadas automaticamente">
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, margin: "10px 0 14px" }}>
            <span style={{ fontFamily: S.display, fontSize: 32, fontWeight: 700, color: m.inadimp ? C.red : C.green }}>{brl(m.inadimp)}</span>
            <span style={{ fontSize: 11.5, color: C.inkSoft }}>
              {(m.inadimp / (m.aReceber + m.inadimp || 1) * 100).toFixed(1)}% da carteira
            </span>
          </div>
          {m.atrasadas.map((p) => (
            <div key={p.id} style={{ marginBottom: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                <span style={{ fontWeight: 500 }}>{p.contrato?.cliente} · {p.tipo}</span>
                <span style={{ fontFamily: S.mono, fontWeight: 600 }}>{brl(p.valor)}</span>
              </div>
              <div style={{ fontSize: 10.5, color: C.inkSoft }}>esperada em {rotMes(p.mesEsperado)}{p.obs && ` — ${p.obs}`}</div>
            </div>
          ))}
          {!m.atrasadas.length && <Vazio t="Carteira em dia." />}
        </Card>
      </div>

      <Faixa n="Para onde vou" />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
        <Card t={`Caixa — ${ANO}`} s="A única forma de ver o problema antes de ele chegar">
          <div style={{ height: 210, marginTop: 8 }}>
            <ResponsiveContainer>
              <LineChart data={m.serie}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: C.line }} tick={{ fontSize: 10.5, fill: C.inkSoft, fontFamily: S.body }} />
                <YAxis tickFormatter={compact} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: C.inkSoft, fontFamily: S.mono }} />
                <Tooltip formatter={(v) => brl(v)} contentStyle={tipStyle} />
                <Line type="monotone" dataKey="caixa" stroke={C.navy} strokeWidth={2.5} dot={{ r: 2.5, fill: C.navy }} activeDot={{ r: 5, fill: C.gold }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card t="Saúde" s="Os números que a planilha travava">
          <div style={{ marginTop: 10 }}>
            <Linha l="Custo fixo mensal" v={brl(m.custoFixoMensal)} />
            <Linha l="Meses de reserva" v={m.mesesReserva.toFixed(1)} />
            <Linha l="Recorrência atual" v={brl(db.params.recorrenciaAtual)} />
            <Linha l="% receita recorrente" v={pct(m.pctRecorrente)} />
            <Linha l="Falta para a meta" v={brl(Math.max(db.params.metaCaixa - m.caixa, 0))} forte />
          </div>
          <Rodape>Todos seguem o mês corrente — nenhum está travado em janeiro.</Rodape>
        </Card>
      </div>
    </>
  );
}

/* ══════════════  CONTRATOS  ══════════════ */
function Contratos({ db, m, setModal, onFechar }) {
  const [f, setF] = useState("todos");
  const lista = db.contratos.filter((c) => f === "todos" || c.status === f);

  return (
    <>
      <Card t="Ciclo do cliente" s="Uma tabela, cinco status. Nada de recortar e colar entre abas.">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUS.length},1fr)`, gap: 8, marginTop: 12 }}>
          {STATUS.map((s) => {
            const g = db.contratos.filter((c) => c.status === s);
            return (
              <button key={s} onClick={() => setF(f === s ? "todos" : s)} style={{
                background: f === s ? C.paper : "#fff", borderTop: `2.5px solid ${STATUS_COR[s]}`,
                border: `1px solid ${f === s ? STATUS_COR[s] : C.line}`, borderTopWidth: 2.5,
                padding: "10px 12px", cursor: "pointer", textAlign: "left", fontFamily: S.body,
              }}>
                <div style={{ fontSize: 9.5, letterSpacing: ".07em", color: STATUS_COR[s], fontWeight: 600 }}>{s.toUpperCase()}</div>
                <div style={{ fontFamily: S.display, fontSize: 24, fontWeight: 700, margin: "3px 0 0" }}>{g.length}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 10px" }}>
        <Faixa n={f === "todos" ? "Todos os contratos" : f} />
        <button onClick={() => setModal({ t: "contrato" })} className="btn" style={{ ...btnGhost, marginLeft: 12, whiteSpace: "nowrap" }}>+ Contrato</button>
      </div>

      {!lista.length && <Card t=""><Vazio t="Nenhum contrato aqui. Cadastre o primeiro pelo botão acima." /></Card>}

      {lista.map((c) => {
        const d = m.porContrato[c.id];
        const parceiro = db.parceiros.find((p) => p.id === c.parceiroId);
        return (
          <div key={c.id} className="card" style={{ background: "#fff", border: `1px solid ${C.line}`, borderLeft: `2.5px solid ${STATUS_COR[c.status]}`, padding: "15px 17px", marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: S.display, fontSize: 17, fontWeight: 700 }}>{c.cliente}</span>
                  <Tag c={STATUS_COR[c.status]}>{c.status}</Tag>
                  <Tag c={C.inkSoft}>{c.tipoHonorario}</Tag>
                  {parceiro && <Tag c={C.gold}>{parceiro.nome}</Tag>}
                  {c.abaOrigem && <Tag c={C.inkSoft}>aba {c.abaOrigem}</Tag>}
                  {c.dup && <Tag c={C.red}>cliente duplicado</Tag>}
                </div>
                <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 3, fontFamily: S.mono }}>
                  {c.processo || "sem processo distribuído"}
                  {c.splitNick && ` · split ${c.splitNick}`}
                </div>
              </div>
              {c.status === "Proposta" && (
                <button onClick={() => setModal({ t: "fecharContrato", id: c.id })} className="btn" style={{ ...btnGold, alignSelf: "flex-start" }}>
                  Registrar fechamento
                </button>
              )}
            </div>

            {/* ── números: digitado vs calculado ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(128px,1fr))", gap: 1, marginTop: 13, background: C.line, border: `1px solid ${C.line}` }}>
              <Cel l="Fixo total" v={brl(c.fixoTotal)} />
              <Cel l="Fixo recebido" v={brl(d.fixoRecebido)} calc c={C.green} />
              <Cel l="Fixo pendente" v={brl(d.fixoPendente)} calc c={C.amber} />
              <Cel l="Valor da causa" v={brl(c.valorCausa)} />
            </div>

            {(c.pctExito > 0 || c.pctSucumb > 0) && (
              <div style={{ marginTop: 11, background: C.paper, border: `1px solid ${C.line}`, padding: "11px 13px" }}>
                <div style={{ fontSize: 9, letterSpacing: ".13em", color: C.inkSoft, fontWeight: 600, marginBottom: 8 }}>
                  PROJEÇÃO · QUOTA DO PARCEIRO {pct(c.pctQuota)}
                </div>
                <table style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: C.inkSoft, fontSize: 9.5, letterSpacing: ".08em" }}>
                      <th style={thL}></th><th style={thR}>TOTAL</th>
                      <th style={thR}>PARCEIRO ({pct(c.pctQuota)})</th>
                      <th style={{ ...thR, color: C.navy }}>ESCRITÓRIO ({pct(1 - c.pctQuota)})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.pctExito > 0 && (
                      <tr style={{ borderTop: `1px solid ${C.line}` }}>
                        <td style={tdL}>Êxito · {pct(c.pctExito)} da causa</td>
                        <td style={tdR}>{brl(d.exitoTotal)}</td>
                        <td style={{ ...tdR, color: C.inkSoft }}>{brl(d.exitoParceiro)}</td>
                        <td style={{ ...tdR, color: C.navy, fontWeight: 600 }}>{brl(d.exitoEscritorio)}</td>
                      </tr>
                    )}
                    {c.pctSucumb > 0 && (
                      <tr style={{ borderTop: `1px solid ${C.line}` }}>
                        <td style={tdL}>Sucumbência · {pct(c.pctSucumb)}</td>
                        <td style={tdR}>{brl(d.sucumbTotal)}</td>
                        <td style={{ ...tdR, color: C.inkSoft }}>{brl(d.sucumbParceiro)}</td>
                        <td style={{ ...tdR, color: C.navy, fontWeight: 600 }}>{brl(d.sucumbEscritorio)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── parcelas ── */}
            {c.status !== "Proposta" && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <span style={{ fontSize: 9, letterSpacing: ".13em", color: C.inkSoft, fontWeight: 600 }}>PARCELAS</span>
                  <span style={{ fontFamily: S.mono, fontSize: 10.5, color: C.inkSoft }}>
                    {d.parcelas.filter((p) => p.recebido).length}/{d.parcelas.length}
                  </span>
                  <div style={{ flex: 1, height: 3, background: C.line }}>
                    <div style={{ width: `${d.parcelas.length ? (d.parcelas.filter((p) => p.recebido).length / d.parcelas.length) * 100 : 0}%`, height: "100%", background: C.navy }} />
                  </div>
                  <button onClick={() => setModal({ t: "parcela", contratoId: c.id })} style={linkBtn}>+ parcela</button>
                </div>
                {!d.parcelas.length && <div style={{ fontSize: 11.5, color: C.inkSoft }}>Nenhuma parcela cadastrada.</div>}
              </div>
            )}
            {c.obs && <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 10, fontStyle: "italic" }}>{c.obs}</div>}
          </div>
        );
      })}
    </>
  );
}

/* ══════════════  PARCELAS  ══════════════ */
function Parcelas({ db, m, receber, estornar, setModal }) {
  const [f, setF] = useState("aberto");
  const lista = db.parcelas
    .map((p) => ({ ...p, contrato: db.contratos.find((c) => c.id === p.contratoId) }))
    .filter((p) => (f === "aberto" ? !p.recebido : f === "recebido" ? p.recebido : true))
    .sort((a, b) => (a.mesEsperado || "").localeCompare(b.mesEsperado || ""));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 12 }}>
        <KPI r="A receber" v={brl(m.aReceber)} n="parcelas futuras em aberto" c={C.gold} />
        <KPI r="Em atraso" v={brl(m.inadimp)} n={`${m.atrasadas.length} parcelas`} c={m.inadimp ? C.red : C.green} />
        <KPI r="Fixo pendente" v={brl(m.fixoPendenteTotal)} n="contratos ativos" c={C.navy} />
        <KPI r="Receita realizada" v={brl(m.receitaRealizada)} n="tudo que entrou no caixa" c={C.green} />
      </div>

      <Card t="Parcelas" s="É aqui que os dois mundos se tocam: marcar recebido cria o lançamento.">
        <div style={{ display: "flex", gap: 6, margin: "12px 0 4px" }}>
          {[["aberto", "Em aberto"], ["recebido", "Recebidas"], ["todas", "Todas"]].map(([k, n]) => (
            <button key={k} onClick={() => setF(k)} className="btn" style={chip(f === k)}>{n}</button>
          ))}
        </div>
        {!lista.length ? <Vazio t="Nenhuma parcela. Cadastre pelo contrato." /> : (
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
                      <td style={{ ...td, fontWeight: 500 }}>{p.contrato?.cliente}</td>
                      <td style={{ ...td, color: C.inkSoft }}>{db.parceiros.find((x) => x.id === p.contrato?.parceiroId)?.nome || "—"}</td>
                      <td style={td}><Tag c={C.navy}>{p.tipo}</Tag></td>
                      <td style={{ ...td, fontFamily: S.mono, fontSize: 11.5, color: atras ? C.red : C.inkSoft, fontWeight: atras ? 600 : 400 }}>
                        {rotMes(p.mesEsperado)}{atras && " ⚠"}
                      </td>
                      <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600 }}>{brl(p.valor)}</td>
                      <td style={td}>
                        {p.recebido
                          ? <span style={{ color: C.green, fontWeight: 600, fontSize: 11.5 }}>✓ Sim</span>
                          : <span style={{ color: atras ? C.red : C.amber, fontWeight: 600, fontSize: 11.5 }}>Não</span>}
                      </td>
                      <td style={{ ...td, fontFamily: S.mono, fontSize: 11.5, color: C.inkSoft }}>{p.mesEfetivo ? rotMes(p.mesEfetivo) : "—"}</td>
                      <td style={{ ...td, fontSize: 11, color: C.inkSoft, maxWidth: 150 }}>{p.obs || "—"}</td>
                      <td style={{ ...td, textAlign: "right" }}>
                        {p.recebido
                          ? <button onClick={() => estornar(p.id)} style={linkBtn}>estornar</button>
                          : <button onClick={() => receber(p.id)} className="btn" style={{ ...btnSolid, padding: "5px 11px", fontSize: 11.5, background: atras ? C.red : C.navy }}>Registrar recebimento</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Rodape>
          Marcar <b>recebido</b> gera o lançamento de entrada automaticamente — o mesmo dado, uma digitação só.
          Estornar desfaz os dois.
        </Rodape>
      </Card>
    </>
  );
}

/* ══════════════  LANÇAMENTOS  ══════════════ */
const ORIGEM_TAG = {
  manual: { t: "manual", c: C.inkSoft },
  parcela: { t: "↳ PARCELA", c: C.navy },
  fixo: { t: "↳ CUSTO FIXO", c: C.amber },
  importado: { t: "↳ EXCEL", c: C.gold },
};
function Lancamentos({ db, setModal }) {
  const [f, setF] = useState("todos");
  const lista = [...db.lancamentos]
    .filter((l) => f === "todos" || l.tipo === f)
    .sort((a, b) => b.data.localeCompare(a.data));

  return (
    <Card t="Lançamentos" s="O único lugar onde se digita dinheiro. O resto se calcula."
      a={{ t: "+ Novo lançamento", f: () => setModal({ t: "lancamento" }) }}>
      <div style={{ display: "flex", gap: 6, margin: "12px 0 4px" }}>
        {[["todos", "Todos"], ["entrada", "Entradas"], ["saida", "Saídas"]].map(([k, n]) => (
          <button key={k} onClick={() => setF(k)} className="btn" style={chip(f === k)}>{n}</button>
        ))}
      </div>
      {!lista.length ? <Vazio t="Nenhum lançamento ainda." /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={tbl}>
            <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
              {["Data", "Descrição", "Categoria", "Cliente", "Forma", "Pago", "Origem", "Valor"].map((h) => (
                <th key={h} style={{ ...th, textAlign: h === "Valor" ? "right" : "left" }}>{h.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {lista.map((l) => {
                const o = ORIGEM_TAG[l.origem];
                return (
                  <tr key={l.id} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11.5, color: C.inkSoft }}>{fmtData(l.data)}</td>
                    <td style={{ ...td, fontWeight: 500 }}>{l.descricao}</td>
                    <td style={{ ...td, color: C.inkSoft }}>{l.categoria}</td>
                    <td style={td}>{db.contratos.find((c) => c.id === l.contratoId)?.cliente || "—"}</td>
                    <td style={{ ...td, color: C.inkSoft, fontSize: 11.5 }}>{l.forma}</td>
                    <td style={td}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: l.pago ? C.green : C.amber }}>
                        {l.pago ? "SIM" : "PENDENTE"}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: 9, color: o.c, background: l.origem === "manual" ? "transparent" : "#EDF0F8", padding: l.origem === "manual" ? 0 : "2px 6px", fontWeight: 600, letterSpacing: ".04em" }}>
                        {o.t}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600, color: l.tipo === "entrada" ? C.green : C.red, whiteSpace: "nowrap" }}>
                      {l.tipo === "entrada" ? "+" : "−"} {brl(l.valor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Rodape>
        A coluna <b>origem</b> é a memória do sistema: todo número sabe de onde veio.
        Era exatamente isso que faltava quando alguém digitava por cima de uma fórmula.
      </Rodape>
    </Card>
  );
}

/* ══════════════  CUSTOS FIXOS  ══════════════ */
function Fixos({ db, m, lancar, setModal, up }) {
  return (
    <>
      <Card t={`Custos fixos de ${rotMes(MES_ATUAL)}`} s="Cadastre uma vez — o sistema propaga para cada mês da vigência.">
        {!m.fixosDoMes.length ? <Vazio t="Nenhum custo fixo vigente neste mês." /> : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {m.fixosDoMes.map((f) => (
              <div key={f.id} style={{
                border: `1px solid ${f.lancado ? C.line : C.gold}`, background: f.lancado ? C.paper : "#fff",
                padding: "10px 13px", minWidth: 168,
              }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{f.descricao}</div>
                <div style={{ fontSize: 10.5, color: C.inkSoft }}>vence dia {f.diaVenc}</div>
                <div style={{ fontFamily: S.mono, fontSize: 15, fontWeight: 600, color: f.lancado ? C.inkSoft : C.red, margin: "4px 0 6px", textDecoration: f.lancado ? "line-through" : "none" }}>
                  {brl(f.valor)}
                </div>
                {f.lancado
                  ? <div style={{ fontSize: 9.5, color: C.green, fontWeight: 600 }}>✓ LANÇADO NO MÊS</div>
                  : <button onClick={() => lancar(f.id, MES_ATUAL)} className="btn" style={{ ...btnSolid, padding: "4px 10px", fontSize: 11, width: "100%" }}>Lançar no caixa</button>}
              </div>
            ))}
          </div>
        )}
        <Rodape>Custo fixo mensal vigente: <b style={{ fontFamily: S.mono }}>{brl(m.custoFixoMensal)}</b> · o sistema não deixa lançar duas vezes o mesmo custo no mesmo mês.</Rodape>
      </Card>

      <div style={{ height: 12 }} />

      <Card t="Cadastro de custos fixos" a={{ t: "+ Novo custo fixo", f: () => setModal({ t: "fixo" }) }}>
        {!db.custosFixos.length ? <Vazio t="Nenhum custo fixo cadastrado." /> : (
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
                  <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600, color: C.red }}>{brl(f.valor)}</td>
                  <td style={td}><span style={{ fontSize: 11, fontWeight: 600, color: f.recorrente ? C.green : C.inkSoft }}>{f.recorrente ? "SIM" : "NÃO"}</span></td>
                  <td style={{ ...td, fontFamily: S.mono, color: C.inkSoft }}>{f.diaVenc}</td>
                  <td style={{ ...td, fontFamily: S.mono, fontSize: 11.5, color: C.inkSoft }}>{MESES_N[f.mesInicio - 1]} → {MESES_N[(f.mesFim || 12) - 1]}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button onClick={() => up("custosFixos", (fs) => fs.filter((x) => x.id !== f.id))} style={linkBtn}>remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

/* ══════════════  FLUXO  ══════════════ */
function Fluxo({ db, m }) {
  const doMes = db.lancamentos.filter((l) => l.pago && mesDe(l.data) === MES_ATUAL).sort((a, b) => a.data.localeCompare(b.data));
  const anterior = db.params.caixaInicial + db.lancamentos
    .filter((l) => l.pago && l.data < MES_ATUAL + "-01")
    .reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0);
  let saldo = anterior;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10, marginBottom: 12 }}>
        <KPI r="Caixa anterior" v={brl(anterior)} n="fechamento do mês passado" c={C.navy} />
        <KPI r="Entradas do mês" v={brl(m.fatAtual)} n="realizadas" c={C.green} />
        <KPI r="Saídas do mês" v={brl(m.gastoAtual)} n="realizadas" c={C.red} />
        <KPI r="Caixa atual" v={brl(m.caixa)} n="🔒 calculado — não há campo" c={C.gold} d />
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
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11.5, color: C.inkSoft }}>{fmtData(l.data)}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 500 }}>{l.descricao}</div>
                      <div style={{ fontSize: 11, color: C.inkSoft }}>{l.categoria}</div>
                    </td>
                    <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.green, fontWeight: 600 }}>{l.tipo === "entrada" ? brl(l.valor) : ""}</td>
                    <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.red, fontWeight: 600 }}>{l.tipo === "saida" ? brl(l.valor) : ""}</td>
                    <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600 }}>{brl(saldo)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <div style={{ height: 12 }} />
      <Card t={`Ano de ${ANO}`} s="Caixa encadeado — sem constante digitada no meio da corrente">
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
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.green }}>{s.entrada ? brl(s.entrada) : "—"}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.red }}>{s.saida ? brl(s.saida) : "—"}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: s.resultado >= 0 ? C.green : C.red }}>{s.resultado ? brl(s.resultado) : "—"}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600 }}>{brl(s.caixa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/* ══════════════  DRE  ══════════════ */
function DRE({ m }) {
  const linhas = [
    ["Receita de honorários", m.rec, ""],
    ["(−) Custas processuais e restituições", -m.diretos, ""],
    ["= Resultado bruto", m.rec - m.diretos, "sub"],
    ["(−) Despesas operacionais", -m.despOp, ""],
    ["= Resultado do período", m.resultado, "total"],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
      <Card t={`DRE — ${rotMes(MES_ATUAL)}`} s="Receita, custos e margem do período">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, marginTop: 10 }}>
          <tbody>
            {linhas.map(([n, v, tipo]) => (
              <tr key={n} style={{
                borderBottom: tipo === "total" ? "none" : `1px solid ${C.line}`,
                borderTop: tipo === "total" ? `1.5px solid ${C.navy}` : "none",
                background: tipo === "total" ? C.paper : "transparent",
              }}>
                <td style={{ padding: tipo === "total" ? "12px 8px" : "9px 8px", fontWeight: tipo ? 600 : 400, fontFamily: tipo === "total" ? S.display : S.body, fontSize: tipo === "total" ? 15 : 13.5 }}>{n}</td>
                <td style={{ padding: "9px 8px", textAlign: "right", fontFamily: S.mono, fontWeight: 600, fontSize: tipo === "total" ? 16 : 13.5, color: v < 0 ? C.red : tipo === "total" ? (v >= 0 ? C.green : C.red) : C.ink }}>
                  {brl(Math.abs(v))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card t="Margem do mês" s="Quanto sobra de cada real que entra">
        <div style={{ textAlign: "center", padding: "24px 0 16px" }}>
          <div style={{ fontFamily: S.display, fontSize: 58, fontWeight: 700, lineHeight: 1, color: m.margem >= 20 ? C.green : m.margem >= 0 ? C.amber : C.red }}>
            {m.margem}%
          </div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 5 }}>{brl(m.resultado)} sobre {brl(m.rec)}</div>
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
          <Linha l="Receita" v={brl(m.rec)} />
          <Linha l="Custos diretos" v={brl(m.diretos)} />
          <Linha l="Despesas operacionais" v={brl(m.despOp)} />
          <Linha l="Resultado" v={brl(m.resultado)} forte />
        </div>
      </Card>
    </div>
  );
}

/* ══════════════  BALANÇO  ══════════════ */
function Balanco({ m, db }) {
  return (
    <Card t="Balanço patrimonial" s={`Posição consolidada do escritório — ${HOJE.split("-").reverse().join("/")}`}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 12 }}>
        <div>
          <Titulo t="ATIVO" />
          <Linha l="Caixa e equivalentes" v={brl(m.caixa)} />
          <Linha l="Contas a receber (parcelas)" v={brl(m.aReceber + m.inadimp)} />
          <Linha l="Total do ativo" v={brl(m.ativoTotal)} forte topo />
          <div style={{ marginTop: 18, background: C.goldPale, borderLeft: `2px solid ${C.gold}`, padding: "11px 13px" }}>
            <div style={{ fontSize: 9, letterSpacing: ".1em", color: C.amber, fontWeight: 600 }}>FORA DO BALANÇO</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 12.5 }}>
              <span>Êxito projetado — escritório</span>
              <span style={{ fontFamily: S.mono, fontWeight: 600 }}>{brl(m.exitoProjEscritorio)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 12.5, color: C.inkSoft }}>
              <span>Êxito projetado — parceiros</span>
              <span style={{ fontFamily: S.mono }}>{brl(m.exitoProjParceiro)}</span>
            </div>
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 6, lineHeight: 1.5 }}>
              Expectativa, não receita. Só entra no ativo quando o êxito se realiza — e a parte do parceiro nunca é sua.
            </div>
          </div>
        </div>
        <div>
          <Titulo t="PASSIVO E PATRIMÔNIO" />
          <Linha l="Obrigações previstas" v={brl(m.previstos)} />
          <Linha l="Total do passivo" v={brl(m.previstos)} forte topo />
          <div style={{ height: 16 }} />
          <Titulo t="PATRIMÔNIO LÍQUIDO" />
          <Linha l="Patrimônio líquido" v={brl(m.pl)} forte />
          <div style={{ background: C.navy, color: "#fff", padding: "15px 14px", marginTop: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: ".14em", color: C.goldSoft, fontWeight: 600 }}>CONFERÊNCIA</div>
            <div style={{ fontFamily: S.mono, fontSize: 12.5, marginTop: 5 }}>
              {brl(m.ativoTotal)} = {brl(m.previstos)} + {brl(m.pl)}
            </div>
            <div style={{ fontSize: 11, color: "#A9B2CC", marginTop: 5 }}>Fecha sozinho porque nada é digitado duas vezes.</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ══════════════  TAREFAS  ══════════════ */
function Tarefas({ db, up, setModal }) {
  const cols = [{ k: "aberta", n: "Abertas", c: C.navy }, { k: "concluida", n: "Concluídas", c: C.green }];
  const toggle = (id) => up("tarefas", (ts) => ts.map((t) => t.id === id ? { ...t, status: t.status === "aberta" ? "concluida" : "aberta" } : t));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {cols.map((col) => (
        <Card key={col.k} t={col.n} s={col.k === "aberta" ? "O que precisa da mão do advogado" : "Histórico"}
          a={col.k === "aberta" ? { t: "+ Nova tarefa", f: () => setModal({ t: "tarefa" }) } : null}>
          <div style={{ marginTop: 10 }}>
            {db.tarefas.filter((t) => t.status === col.k).map((t) => {
              const atras = col.k === "aberta" && t.prazo < HOJE;
              return (
                <div key={t.id} className="row" style={{
                  border: `1px solid ${atras ? "#F0D4D2" : C.line}`, borderLeft: `2.5px solid ${atras ? C.red : col.c}`,
                  padding: "10px 12px", marginBottom: 7, background: atras ? "#FDF6F5" : "#fff",
                  display: "flex", gap: 9, alignItems: "flex-start",
                }}>
                  <input type="checkbox" checked={col.k === "concluida"} onChange={() => toggle(t.id)}
                    style={{ accentColor: C.navy, width: 15, height: 15, marginTop: 2, cursor: "pointer" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, textDecoration: col.k === "concluida" ? "line-through" : "none", color: col.k === "concluida" ? C.inkSoft : C.ink }}>{t.titulo}</div>
                    <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
                      {db.contratos.find((c) => c.id === t.contratoId)?.cliente || "—"} · {t.resp}
                    </div>
                  </div>
                  <span style={{ fontFamily: S.mono, fontSize: 10.5, fontWeight: 600, color: atras ? C.red : C.inkSoft }}>{fmtData(t.prazo)}</span>
                </div>
              );
            })}
            {!db.tarefas.filter((t) => t.status === col.k).length && <Vazio t={col.k === "aberta" ? "Nenhuma tarefa aberta." : "Nada concluído ainda."} />}
          </div>
        </Card>
      ))}
    </div>
  );
}


/* ══════════════  MIGRAÇÃO — o laudo da importação  ══════════════ */
function Migracao({ db, m }) {
  const A = SEED.alertas, D = SEED.detalhes;
  const porAba = {};
  db.contratos.forEach((c) => { porAba[c.abaOrigem || "—"] = (porAba[c.abaOrigem || "—"] || 0) + 1; });
  const recebidoParcelas = db.parcelas.filter((p) => p.recebido).reduce((s, p) => s + p.valor, 0);
  const entradasLanc = db.lancamentos.filter((l) => l.pago && l.tipo === "entrada").reduce((s, l) => s + l.valor, 0);
  const gap = Math.abs(recebidoParcelas - entradasLanc);

  const achados = [
    { n: A.tipo || 0, t: "tipos de honorário normalizados", d: "15 grafias viraram 8 tipos reais", l: D.tipo, c: C.amber },
    { n: A.status || 0, t: "status normalizados", d: "8 grafias viraram 5 status", l: D.status, c: C.amber },
    { n: A.dup || 0, t: "clientes em mais de uma aba", d: "o mesmo cliente cadastrado duas vezes", l: D.dup, c: C.red },
    { n: A.orfa || 0, t: "parcelas órfãs", d: "cliente na aba MENSAIS sem contrato em lugar nenhum", l: D.orfa, c: C.red },
    { n: A.mes || 0, t: 'parcelas com mês inválido', d: '"mensal" não é um mês — joguei em dez/2026', l: D.mes, c: C.red },
    { n: A.fixodup || 0, t: "custo fixo duplicado", d: "cadastrado duas vezes no CONFIG — cobra dobrado todo mês", l: D.fixodup, c: C.red },
    { n: A.tipoparc || 0, t: "tipos de parcela normalizados", d: '"Sucumb." → "Sucumbência"', l: D.tipoparc, c: C.amber },
  ].filter((x) => x.n > 0);

  return (
    <>
      <div style={{ background: C.navy, color: "#fff", padding: "22px 24px", marginBottom: 12 }}>
        <div style={{ fontSize: 9, letterSpacing: ".2em", color: C.gold, fontWeight: 600 }}>LAUDO DA IMPORTAÇÃO</div>
        <h2 style={{ fontFamily: S.display, fontSize: 26, margin: "6px 0 8px", fontWeight: 700 }}>
          Os dois Excel entraram — e trouxeram o que estava escondido
        </h2>
        <p style={{ fontSize: 12.5, color: "#B9C1D9", lineHeight: 1.7, maxWidth: 640, margin: 0 }}>
          Nada foi jogado fora. Tudo que não encaixou está listado abaixo, com nome e sobrenome.
          Os valores vêm dos arquivos <b style={{ color: "#fff" }}>_MODELO</b> — nomes e cifras são fictícios; a estrutura e o volume são reais.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 22 }}>
        <KPI r="Contratos" v={db.contratos.length} n={Object.entries(porAba).map(([k, v]) => `${v} de ${k}`).join(" · ")} c={C.navy} />
        <KPI r="Parcelas" v={db.parcelas.length} n="aba MENSAIS + fixo recebido" c={C.navy} />
        <KPI r="Lançamentos" v={db.lancamentos.length} n="12 abas mensais unificadas" c={C.navy} />
        <KPI r="Custos fixos" v={db.custosFixos.length} n="do CONFIG" c={C.navy} />
        <KPI r="Parceiros" v={db.parceiros.length} n="todos, inclusive o esquecido" c={C.gold} />
      </div>

      <Faixa n="O que precisou de conserto para caber" />
      <div style={{ display: "grid", gap: 8, marginBottom: 22 }}>
        {achados.map((a) => (
          <div key={a.t} className="card" style={{ background: "#fff", border: `1px solid ${C.line}`, borderLeft: `2.5px solid ${a.c}`, padding: "13px 16px" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ fontFamily: S.display, fontSize: 30, fontWeight: 700, color: a.c, minWidth: 40, lineHeight: 1 }}>{a.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.t}</div>
                <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 1 }}>{a.d}</div>
                {a.l && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                    {a.l.map((x) => (
                      <span key={x} style={{ fontFamily: S.mono, fontSize: 10, background: C.paper, border: `1px solid ${C.line}`, padding: "2px 6px", color: C.inkSoft }}>{x}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Faixa n="O que os arquivos não sabem responder" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
        <Card t="Os dois arquivos discordam" s="Mesmo dinheiro, dois lugares, dois números">
          <div style={{ marginTop: 12 }}>
            <Linha l="Recebido — segundo Contratos" v={brl(recebidoParcelas)} />
            <Linha l="Entradas — segundo Fluxo de caixa" v={brl(entradasLanc)} />
            <Linha l="Diferença" v={brl(gap)} forte topo />
          </div>
          <Rodape>
            Não é erro meu: os arquivos nunca foram conciliados. No sistema isso não acontece de novo —
            recebimento e lançamento passam a ser <b>o mesmo registro</b>.
          </Rodape>
        </Card>

        <Card t="Campos que faltam" s="Coisas que você quer medir e nunca teve onde anotar">
          <div style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.9 }}>
            <div>📅 <b>Data da proposta e do fechamento</b> — não existem em nenhuma aba. Sem elas, "clientes fechados no mês" não tem como ser calculado{m.semDatas ? " (o painel está usando status como aproximação)" : ""}.</div>
            <div>↩️ <b>Restituições</b> — não há categoria para isso. O indicador que você pediu não tem fonte: nasce zerado e só enche daqui pra frente.</div>
            <div>💰 <b>Parâmetros</b> — caixa inicial e metas vieram do MODELO ({brl(db.params.caixaInicial)}, {brl(db.params.metaCaixa)}). Precisam dos números reais em Ajustes.</div>
          </div>
        </Card>
      </div>

      <Faixa n="Para onde cada campo foi" />
      <Card t="De-para" s="Nenhum campo do Excel se perdeu">
        <table style={tbl}>
          <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
            {["Arquivo · aba", "Campos", "Virou"].map((h) => <th key={h} style={{ ...th, textAlign: "left" }}>{h.toUpperCase()}</th>)}
          </tr></thead>
          <tbody>
            {[
              ["Fluxo · CONFIG (topo)", "Caixa inicial · Meta 2026 · Meta recorrência · Recorrência atual", "Ajustes → Parâmetros"],
              ["Fluxo · CONFIG (tabela)", "Descrição · Valor · Recorrente? · Dia venc. · Mês início", "Custos fixos (+ mês final, que não existia)"],
              ["Fluxo · JAN…DEZ", "Descrição/Cliente · Valor · Data · Categoria · Pago · Obs", "Lançamentos — uma tabela só"],
              ["Fluxo · JAN…DEZ (cabeçalho)", "Caixa anterior · Caixa atual", "🔒 calculado — deixou de ter campo"],
              ["Fluxo · DASHBOARD", "Entradas · Saídas · Resultado · Caixa real · Pendentes", "🔒 Painel e Fluxo de caixa"],
              ["Contratos · CONTRATOS", "Cliente · Parceiro · Processo · Tipo · %Êxito · %Sucumb · %Quota · Fixo total · Val. causa · Status · Split Nick · Obs", "Contratos"],
              ["Contratos · CONTRATOS", "Fixo recebido · Fixo pendente · Êxito proj. · Sucumb. proj. · Total proj.", "🔒 calculado a partir das parcelas"],
              ["Contratos · PENDENTES", "Cliente · Parceiro · Proposta · Valor est. · Status · Data", "Contratos com status Proposta"],
              ["Contratos · ENCERRADOS", "Cliente · Parceiro · Processo · Recebido · Obs", "Contratos com status Encerrado"],
              ["Contratos · MENSAIS", "Cliente · Tipo · Valor · Mês esperado · Recebido? · Mês efetivo · Obs", "Parcelas"],
              ["Contratos · MENSAIS", "Acum. recebido · colunas técnicas N,O,P,Q", "🔒 calculado — as colunas de MATCH sumiram"],
              ["Contratos · DASHBOARD", "Potencial por parceiro · Top 10 · Conversão", "🔒 Painel"],
            ].map(([a, b, c]) => (
              <tr key={a + b} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: C.inkSoft, whiteSpace: "nowrap" }}>{a}</td>
                <td style={{ ...td, fontSize: 11.5 }}>{b}</td>
                <td style={{ ...td, fontSize: 11.5, fontWeight: 600, color: c.startsWith("🔒") ? C.inkSoft : C.navy }}>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Rodape>
          <b>13 campos que você digitava viraram cálculo.</b> É por isso que a conta fecha sozinha agora.
        </Rodape>
      </Card>
    </>
  );
}

/* ══════════════  AJUSTES  ══════════════ */
function Ajustes({ db, up, setDb, rodar }) {
  const [novo, setNovo] = useState("");
  const setP = (k, v) => setDb((p) => ({ ...p, params: { ...p.params, [k]: Number(v) || 0 } }));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>
      <Card t="Parâmetros do escritório" s="Editados aqui, e só aqui.">
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {[["caixaInicial", "Caixa inicial do ano", "Saldo real em 01/01"],
            ["metaCaixa", "Meta de caixa do ano", "Única meta: até 31/dez"],
            ["metaRecorrencia", "Meta de recorrência mensal", "Objetivo de receita previsível"],
            ["recorrenciaAtual", "Recorrência atual", "Atualize quando mudar"]].map(([k, l, h]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{l}</div>
                <div style={{ fontSize: 11, color: C.inkSoft }}>{h}</div>
              </div>
              <input type="number" value={db.params[k]} onChange={(e) => setP(k, e.target.value)}
                style={{ ...campo, width: 150, fontFamily: S.mono, fontWeight: 600, textAlign: "right", background: C.goldPale, borderColor: C.gold }} />
            </div>
          ))}
        </div>
        <Rodape>Campos com fundo dourado são os únicos parâmetros digitados do sistema.</Rodape>
      </Card>

      <Card t="Parceiros / origens" s="Lista fechada — nenhum parceiro fica órfão do painel.">
        <div style={{ marginTop: 12 }}>
          {db.parceiros.map((p) => (
            <div key={p.id} className="row" style={{ ...linhaFlex, padding: "8px 0" }}>
              <span style={{ fontSize: 13 }}>{p.nome}</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.inkSoft, fontFamily: S.mono }}>
                  {db.contratos.filter((c) => c.parceiroId === p.id).length} contratos
                </span>
                <button onClick={() => up("parceiros", (ps) => ps.filter((x) => x.id !== p.id))} style={linkBtn}>remover</button>
              </div>
            </div>
          ))}
          {!db.parceiros.length && <Vazio t="Nenhum parceiro cadastrado." />}
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Nome do parceiro" style={{ ...campo, flex: 1 }} />
            <button className="btn" style={btnSolid} disabled={!novo.trim()}
              onClick={() => { up("parceiros", (ps) => [...ps, { id: nid("P"), nome: novo.trim() }]); setNovo(""); }}>
              Adicionar
            </button>
          </div>
        </div>
        <Rodape>
          <button onClick={() => { setDb(VAZIO); rodar("Sistema zerado."); }} style={{ ...linkBtn, color: C.red }}>
            Zerar o sistema
          </button>
          {" · "}
          <button onClick={() => { setDb(importado()); rodar("Histórico dos dois Excel importado."); }} style={linkBtn}>
            Importar histórico dos Excel
          </button>
          {" · "}
          <button onClick={() => { setDb(exemplo()); rodar("Dados de exemplo carregados."); }} style={linkBtn}>
            Carregar exemplo
          </button>
        </Rodape>
      </Card>
    </div>
  );
}

/* ══════════════  MODAIS  ══════════════ */
function Shell({ titulo, eyebrow, onClose, children, onSave, ok, salvar = "Salvar" }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(21,29,62,.55)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 600, maxHeight: "92vh", overflowY: "auto", animation: "slideUp .25s ease" }}>
        <div style={{ background: C.navy, color: "#fff", padding: "15px 20px", position: "sticky", top: 0 }}>
          <div style={{ fontSize: 9, letterSpacing: ".18em", color: C.gold, fontWeight: 600 }}>{eyebrow}</div>
          <div style={{ fontFamily: S.display, fontSize: 19, fontWeight: 700, marginTop: 2 }}>{titulo}</div>
        </div>
        <div style={{ padding: "18px 20px" }}>
          {children}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
            <button onClick={onClose} className="btn" style={btnGhost}>Cancelar</button>
            <button onClick={onSave} disabled={!ok} className="btn" style={{ ...btnSolid, background: ok ? C.navy : "#C3C9D8", cursor: ok ? "pointer" : "not-allowed" }}>{salvar}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MLancamento({ db, onClose, onSave }) {
  const [tipo, setTipo] = useState("saida");
  const [f, setF] = useState({ data: HOJE, descricao: "", valor: "", categoria: "", forma: "PIX", pago: true, contratoId: "", obs: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const cats = tipo === "entrada" ? CAT_ENTRADA : CAT_SAIDA;
  const ok = f.descricao && f.valor > 0 && f.categoria;
  return (
    <Shell eyebrow="ENTRADA ÚNICA DE DADO" titulo="Novo lançamento" onClose={onClose} ok={ok} salvar="Salvar lançamento"
      onSave={() => { onSave({ ...f, tipo, valor: Number(f.valor) }); onClose(); }}>
      <div style={{ display: "flex", marginBottom: 16, border: `1px solid ${C.line}` }}>
        {[["entrada", "Entrada", C.green], ["saida", "Saída", C.red]].map(([k, n, cor]) => (
          <button key={k} onClick={() => { setTipo(k); set("categoria", ""); }} className="btn" style={{
            flex: 1, padding: "9px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            fontFamily: S.body, background: tipo === k ? cor : "#fff", color: tipo === k ? "#fff" : C.inkSoft,
          }}>{n}</button>
        ))}
      </div>
      <Grid>
        <F l="DATA"><input type="date" value={f.data} onChange={(e) => set("data", e.target.value)} style={campo} /></F>
        <F l="VALOR (R$)"><input type="number" placeholder="0" value={f.valor} onChange={(e) => set("valor", e.target.value)} style={{ ...campo, fontFamily: S.mono, fontWeight: 600 }} /></F>
        <F l="DESCRIÇÃO / CLIENTE" full><input value={f.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex.: Honorário inicial — Cliente X" style={campo} /></F>
        <F l="CATEGORIA" full>
          <select value={f.categoria} onChange={(e) => set("categoria", e.target.value)} style={campo}>
            <option value="">Selecione</option>{cats.map((c) => <option key={c}>{c}</option>)}
          </select>
        </F>
        <F l="CONTRATO / CLIENTE">
          <select value={f.contratoId} onChange={(e) => set("contratoId", e.target.value)} style={campo}>
            <option value="">Sem vínculo</option>
            {db.contratos.map((c) => <option key={c.id} value={c.id}>{c.cliente}</option>)}
          </select>
        </F>
        <F l="FORMA"><select value={f.forma} onChange={(e) => set("forma", e.target.value)} style={campo}>{FORMAS.map((x) => <option key={x}>{x}</option>)}</select></F>
        <F l="PAGO?">
          <select value={f.pago ? "1" : "0"} onChange={(e) => set("pago", e.target.value === "1")} style={campo}>
            <option value="1">Sim — entrou/saiu do caixa</option>
            <option value="0">Pendente — ainda não</option>
          </select>
        </F>
        <F l="OBSERVAÇÕES"><input value={f.obs} onChange={(e) => set("obs", e.target.value)} style={campo} /></F>
      </Grid>
      <Nota>Ao salvar, este lançamento atualiza <b>fluxo de caixa</b>, <b>DRE</b> e <b>balanço</b> ao mesmo tempo. Você não digita em nenhum outro lugar.</Nota>
    </Shell>
  );
}

function MContrato({ db, onClose, onSave }) {
  const [f, setF] = useState({
    cliente: "", parceiroId: "", processo: "", tipoHonorario: "", pctExito: 0, pctSucumb: 0,
    pctQuota: 0, fixoTotal: 0, valorCausa: 0, status: "Proposta", splitNick: "", obs: "",
    dataProposta: HOJE, dataFechamento: "",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const ok = f.cliente && f.tipoHonorario;
  const exito = (f.valorCausa || 0) * (f.pctExito || 0);
  return (
    <Shell eyebrow="CADASTRO" titulo="Novo contrato" onClose={onClose} ok={ok} salvar="Salvar contrato"
      onSave={() => { onSave(f); onClose(); }}>
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
        <F l="FIXO TOTAL (R$)"><input type="number" value={f.fixoTotal} onChange={(e) => set("fixoTotal", Number(e.target.value))} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="VALOR DA CAUSA (R$)"><input type="number" value={f.valorCausa} onChange={(e) => set("valorCausa", Number(e.target.value))} style={{ ...campo, fontFamily: S.mono, background: C.goldPale, borderColor: C.gold }} /></F>
        <F l="% ÊXITO"><input type="number" step="1" value={Math.round(f.pctExito * 100)} onChange={(e) => set("pctExito", Number(e.target.value) / 100)} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="% SUCUMBÊNCIA"><input type="number" step="1" value={Math.round(f.pctSucumb * 100)} onChange={(e) => set("pctSucumb", Number(e.target.value) / 100)} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="% QUOTA — FATIA DO PARCEIRO" full>
          <input type="number" step="1" value={Math.round(f.pctQuota * 100)} onChange={(e) => set("pctQuota", Number(e.target.value) / 100)} style={{ ...campo, fontFamily: S.mono }} />
        </F>
        <F l="SPLIT NICK"><input value={f.splitNick} onChange={(e) => set("splitNick", e.target.value)} style={campo} /></F>
        <F l="DATA DA PROPOSTA"><input type="date" value={f.dataProposta} onChange={(e) => set("dataProposta", e.target.value)} style={campo} /></F>
        <F l="OBSERVAÇÕES" full><input value={f.obs} onChange={(e) => set("obs", e.target.value)} style={campo} /></F>
      </Grid>
      {exito > 0 && (
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "10px 12px", marginTop: 14, fontSize: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: ".12em", color: C.inkSoft, fontWeight: 600, marginBottom: 6 }}>🔒 PRÉVIA CALCULADA</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Êxito total</span><b style={{ fontFamily: S.mono }}>{brl(exito)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: C.inkSoft }}><span>Parceiro ({pct(f.pctQuota)})</span><span style={{ fontFamily: S.mono }}>{brl(exito * f.pctQuota)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: C.navy, fontWeight: 600 }}><span>Escritório ({pct(1 - f.pctQuota)})</span><span style={{ fontFamily: S.mono }}>{brl(exito * (1 - f.pctQuota))}</span></div>
        </div>
      )}
    </Shell>
  );
}

function MParcela({ db, contratoId, onClose, onSave }) {
  const ct = db.contratos.find((c) => c.id === contratoId);
  const [f, setF] = useState({ contratoId, tipo: "Mensal", valor: "", mesEsperado: MES_ATUAL, recebido: false, mesEfetivo: "", obs: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const ok = f.valor > 0 && f.mesEsperado;
  return (
    <Shell eyebrow={ct?.cliente?.toUpperCase()} titulo="Nova parcela" onClose={onClose} ok={ok} salvar="Salvar parcela"
      onSave={() => { onSave({ ...f, valor: Number(f.valor) }); onClose(); }}>
      <Grid>
        <F l="TIPO"><select value={f.tipo} onChange={(e) => set("tipo", e.target.value)} style={campo}>{TIPO_PARCELA.map((t) => <option key={t}>{t}</option>)}</select></F>
        <F l="VALOR (R$)"><input type="number" value={f.valor} onChange={(e) => set("valor", e.target.value)} style={{ ...campo, fontFamily: S.mono, fontWeight: 600 }} /></F>
        <F l="MÊS ESPERADO" full>
          <select value={f.mesEsperado} onChange={(e) => set("mesEsperado", e.target.value)} style={campo}>
            {MESES.map((m) => <option key={m} value={m}>{rotMes(m)}</option>)}
          </select>
        </F>
        <F l="OBSERVAÇÕES" full><input value={f.obs} onChange={(e) => set("obs", e.target.value)} style={campo} /></F>
      </Grid>
      <Nota>Não existe campo "recebido" aqui. Você marca o recebimento na tela de <b>Parcelas</b> — e é esse clique que cria o lançamento no caixa.</Nota>
    </Shell>
  );
}

function MFixo({ onClose, onSave }) {
  const [f, setF] = useState({ descricao: "", valor: "", recorrente: true, diaVenc: 5, mesInicio: 1, mesFim: 12 });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const ok = f.descricao && f.valor > 0;
  return (
    <Shell eyebrow="CADASTRE UMA VEZ" titulo="Novo custo fixo" onClose={onClose} ok={ok} salvar="Salvar custo fixo"
      onSave={() => { onSave({ ...f, valor: Number(f.valor), diaVenc: Number(f.diaVenc), mesInicio: Number(f.mesInicio), mesFim: Number(f.mesFim) }); onClose(); }}>
      <Grid>
        <F l="DESCRIÇÃO" full><input value={f.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex.: Contador" style={campo} /></F>
        <F l="VALOR MENSAL (R$)"><input type="number" value={f.valor} onChange={(e) => set("valor", e.target.value)} style={{ ...campo, fontFamily: S.mono, fontWeight: 600 }} /></F>
        <F l="DIA DO VENCIMENTO"><input type="number" min="1" max="28" value={f.diaVenc} onChange={(e) => set("diaVenc", e.target.value)} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="RECORRENTE?">
          <select value={f.recorrente ? "1" : "0"} onChange={(e) => set("recorrente", e.target.value === "1")} style={campo}>
            <option value="1">Sim — todo mês da vigência</option><option value="0">Não</option>
          </select>
        </F>
        <F l="MÊS DE INÍCIO"><select value={f.mesInicio} onChange={(e) => set("mesInicio", e.target.value)} style={campo}>{MESES_N.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></F>
        <F l="MÊS FINAL" full><select value={f.mesFim} onChange={(e) => set("mesFim", e.target.value)} style={campo}>{MESES_N.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></F>
      </Grid>
      <Nota>A planilha só tinha "mês início" — o custo nunca terminava. Aqui a vigência tem fim.</Nota>
    </Shell>
  );
}

function MTarefa({ db, onClose, onSave }) {
  const [f, setF] = useState({ titulo: "", contratoId: "", resp: "", prazo: HOJE });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Shell eyebrow="OPERAÇÃO" titulo="Nova tarefa" onClose={onClose} ok={!!f.titulo} salvar="Salvar tarefa"
      onSave={() => { onSave(f); onClose(); }}>
      <Grid>
        <F l="TAREFA" full><input value={f.titulo} onChange={(e) => set("titulo", e.target.value)} style={campo} /></F>
        <F l="CONTRATO">
          <select value={f.contratoId} onChange={(e) => set("contratoId", e.target.value)} style={campo}>
            <option value="">Sem vínculo</option>{db.contratos.map((c) => <option key={c.id} value={c.id}>{c.cliente}</option>)}
          </select>
        </F>
        <F l="RESPONSÁVEL"><input value={f.resp} onChange={(e) => set("resp", e.target.value)} style={campo} /></F>
        <F l="PRAZO" full><input type="date" value={f.prazo} onChange={(e) => set("prazo", e.target.value)} style={campo} /></F>
      </Grid>
    </Shell>
  );
}

function MFechar({ contrato, onClose, onSave }) {
  const [n, setN] = useState(4);
  if (!contrato) return null;
  return (
    <Shell eyebrow="PROPOSTA → CONTRATO" titulo={`Fechar ${contrato.cliente}`} onClose={onClose} ok salvar="Registrar fechamento"
      onSave={() => onSave(Number(n))}>
      {contrato.fixoTotal > 0 ? (
        <>
          <Grid>
            <F l="PARCELAS DO FIXO" full><input type="number" min="1" max="24" value={n} onChange={(e) => setN(e.target.value)} style={{ ...campo, fontFamily: S.mono, fontWeight: 600 }} /></F>
          </Grid>
          <Nota>
            {n} parcelas de <b>{brl(Math.round(contrato.fixoTotal / (n || 1)))}</b>, a partir de {rotMes(MES_ATUAL)}.
            Entram no <b>a receber</b> na hora — e cada recebimento vira um lançamento.
          </Nota>
        </>
      ) : <Nota>Contrato sem honorário fixo. Nenhuma parcela será gerada — as de êxito você cadastra quando o valor se definir.</Nota>}
    </Shell>
  );
}

/* ══════════════  ÁTOMOS  ══════════════ */
const btnSolid = { background: C.navy, color: "#fff", border: "none", padding: "9px 17px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: S.body, borderRadius: 2 };
const btnGhost = { background: "#fff", color: C.ink, border: `1px solid ${C.line}`, padding: "9px 15px", fontSize: 12.5, cursor: "pointer", fontFamily: S.body, borderRadius: 2 };
const btnGold = { background: C.gold, color: C.navyDeep, border: "none", padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: S.body, borderRadius: 2 };
const linkBtn = { background: "none", border: "none", color: C.navy, fontSize: 11, cursor: "pointer", fontFamily: S.body, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2, padding: 0 };
const campo = { width: "100%", padding: "8px 10px", border: `1px solid ${C.line}`, fontSize: 12.5, fontFamily: S.body, borderRadius: 2, background: "#fff", color: C.ink };
const tbl = { width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginTop: 8 };
const th = { padding: "8px 9px", fontSize: 9, letterSpacing: ".11em", color: C.inkSoft, fontWeight: 600 };
const td = { padding: "9px 9px" };
const thL = { textAlign: "left", padding: "0 4px 5px", fontWeight: 600 };
const thR = { textAlign: "right", padding: "0 4px 5px", fontWeight: 600 };
const tdL = { padding: "6px 4px", color: C.inkSoft };
const tdR = { padding: "6px 4px", textAlign: "right", fontFamily: S.mono };
const linhaFlex = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.line}` };
const tipStyle = { fontFamily: S.body, fontSize: 12, borderRadius: 2, border: `1px solid ${C.line}` };
const chip = (on) => ({ padding: "5px 12px", fontSize: 11.5, cursor: "pointer", borderRadius: 2, fontFamily: S.body, border: `1px solid ${on ? C.navy : C.line}`, background: on ? C.navy : "#fff", color: on ? "#fff" : C.inkSoft });

const Grid = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>{children}</div>;
const F = ({ l, full, children }) => (
  <div style={full ? { gridColumn: "1 / -1" } : {}}>
    <label style={{ fontSize: 9, letterSpacing: ".1em", color: C.inkSoft, fontWeight: 600, display: "block", marginBottom: 4 }}>{l}</label>
    {children}
  </div>
);
const Nota = ({ children }) => (
  <div style={{ background: C.paper, borderLeft: `2px solid ${C.gold}`, padding: "9px 12px", marginTop: 14, fontSize: 11.5, color: C.inkSoft, lineHeight: 1.6 }}>{children}</div>
);
const Faixa = ({ n }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flex: 1 }}>
    <span style={{ fontSize: 9, letterSpacing: ".18em", color: C.inkSoft, fontWeight: 600, whiteSpace: "nowrap" }}>{n.toUpperCase()}</span>
    <div style={{ flex: 1, height: 1, background: C.line }} />
  </div>
);
const KPI = ({ r, v, n, c, d }) => (
  <div className="card" style={{ background: "#fff", border: `1px solid ${d ? c : C.line}`, borderTop: `2.5px solid ${c}`, padding: "13px 15px" }}>
    <div style={{ fontSize: 9.5, letterSpacing: ".1em", color: C.inkSoft, fontWeight: 600 }}>{r.toUpperCase()}</div>
    <div style={{ fontFamily: S.display, fontSize: 25, fontWeight: 700, margin: "5px 0 2px", color: c }}>{v}</div>
    <div style={{ fontSize: 10.5, color: C.inkSoft }}>{n}</div>
  </div>
);
const Card = ({ t, s, a, children }) => (
  <div className="card" style={{ background: "#fff", border: `1px solid ${C.line}`, padding: "15px 17px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
      <div>
        {t && <div style={{ fontFamily: S.display, fontSize: 16, fontWeight: 700 }}>{t}</div>}
        {s && <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>{s}</div>}
      </div>
      {a && <button onClick={a.f} style={linkBtn}>{a.t}</button>}
    </div>
    {children}
  </div>
);
const Cel = ({ l, v, calc, c = C.ink }) => (
  <div style={{ background: calc ? C.calcBg : "#fff", padding: "9px 11px" }}>
    <div style={{ fontSize: 8.5, letterSpacing: ".08em", color: C.inkSoft, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
      {calc && <span style={{ fontSize: 8 }}>🔒</span>}{l.toUpperCase()}
    </div>
    <div style={{ fontFamily: S.mono, fontSize: 13.5, fontWeight: 600, color: c, marginTop: 2 }}>{v}</div>
  </div>
);
const Tag = ({ c, children }) => (
  <span style={{ fontSize: 9, letterSpacing: ".06em", fontWeight: 600, color: c, border: `1px solid ${c}45`, padding: "2px 6px", borderRadius: 2, whiteSpace: "nowrap" }}>
    {String(children).toUpperCase()}
  </span>
);
const Mini = ({ n, l, c = C.navy }) => (
  <div style={{ background: C.paper, padding: "8px 5px" }}>
    <div style={{ fontFamily: S.display, fontSize: 20, fontWeight: 700, color: c }}>{n}</div>
    <div style={{ fontSize: 9.5, color: C.inkSoft, lineHeight: 1.3 }}>{l}</div>
  </div>
);
const Linha = ({ l, v, forte, topo }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", padding: "7px 0",
    borderTop: topo ? `1.5px solid ${C.navy}` : "none",
    borderBottom: forte ? "none" : `1px solid ${C.line}`,
    fontWeight: forte ? 600 : 400, fontSize: forte ? 13.5 : 12.5,
  }}>
    <span>{l}</span><span style={{ fontFamily: S.mono, fontWeight: 600 }}>{v}</span>
  </div>
);
const Titulo = ({ t }) => (
  <div style={{ fontSize: 9, letterSpacing: ".16em", color: C.gold, fontWeight: 700, paddingBottom: 6, borderBottom: `1.5px solid ${C.navy}`, marginBottom: 3 }}>{t}</div>
);
const Rodape = ({ children }) => (
  <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 12, paddingTop: 9, fontSize: 11, color: C.inkSoft, lineHeight: 1.6 }}>{children}</div>
);
const Vazio = ({ t }) => (
  <div style={{ padding: "26px 0", textAlign: "center", fontSize: 12.5, color: C.inkSoft }}>{t}</div>
);
