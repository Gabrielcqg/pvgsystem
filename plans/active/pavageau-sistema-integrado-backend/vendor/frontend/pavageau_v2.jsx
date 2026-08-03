import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from "recharts";

/* ══════════  HISTÓRICO IMPORTADO DAS DUAS PLANILHAS  ══════════
   Extraído de PAVAGEAU_ADVOGADOS_FLUXO_CAIXA_2026_MODELO.xlsx
   e PAVAGEAU_Contratos_v7_MODELO.xlsx — os valores vêm mascarados
   no arquivo modelo (faixa 1–10). A estrutura é real.            */
const SEED = {"parceiros":[{"id":"P1","nome":"Pavageau"},{"id":"P2","nome":"A&E Advogados"},{"id":"P3","nome":"Instagram"},{"id":"P4","nome":"Leardini"},{"id":"P5","nome":"Gonçalves/Mello"},{"id":"P6","nome":"Eliton Vilalta"}],"contratos":[{"id":"C1","cliente":"Fulano 11","parceiroId":"P1","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.01,"pctSucumb":0.04,"pctQuota":0.07,"fixoTotal":0,"valorCausa":7.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C2","cliente":"Fulano 12","parceiroId":"P1","processo":"","tipoHonorario":"Fixo + Êxito","pctExito":0.05,"pctSucumb":0.05,"pctQuota":0.03,"fixoTotal":7.0,"valorCausa":9.0,"status":"Ativo","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C3","cliente":"Fulano 8","parceiroId":"P1","processo":"","tipoHonorario":"Êxito + Sucumbência","pctExito":0.01,"pctSucumb":0.06,"pctQuota":0.07,"fixoTotal":0,"valorCausa":3.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C4","cliente":"Fulano 2","parceiroId":"P1","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.02,"pctSucumb":0.07,"pctQuota":0.01,"fixoTotal":0,"valorCausa":10.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C5","cliente":"Fulano 13","parceiroId":"P2","processo":"","tipoHonorario":"Fixo parcelado","pctExito":0.1,"pctSucumb":0.1,"pctQuota":0.1,"fixoTotal":8.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C6","cliente":"Fulano 14","parceiroId":"P2","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo mensal","pctExito":0.1,"pctSucumb":0.06,"pctQuota":0.05,"fixoTotal":10.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C7","cliente":"Fulano 15","parceiroId":"P2","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.08,"pctSucumb":0.02,"pctQuota":0.1,"fixoTotal":0,"valorCausa":10.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C8","cliente":"Fulano 16","parceiroId":"P2","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.07,"pctSucumb":0.05,"pctQuota":0.02,"fixoTotal":2.0,"valorCausa":5.0,"status":"Sem êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C9","cliente":"Fulano 17","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Sucumbência","pctExito":0.07,"pctSucumb":0.1,"pctQuota":0.05,"fixoTotal":7.0,"valorCausa":9.0,"status":"Encerrado","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C10","cliente":"Fulano 18","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.09,"pctSucumb":0.04,"pctQuota":0.08,"fixoTotal":0,"valorCausa":9.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C11","cliente":"Fulano 19","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.05,"pctSucumb":0.1,"pctQuota":0.07,"fixoTotal":0,"valorCausa":3.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C12","cliente":"Fulano 20","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.06,"pctSucumb":0.04,"pctQuota":0.05,"fixoTotal":0,"valorCausa":1.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C13","cliente":"Fulano 21","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.02,"pctSucumb":0.05,"pctQuota":0.08,"fixoTotal":0,"valorCausa":1.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C14","cliente":"Fulano 7","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.09,"pctSucumb":0.1,"pctQuota":0.04,"fixoTotal":0,"valorCausa":9.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C15","cliente":"Fulano 22","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.06,"pctSucumb":0.1,"pctQuota":0.07,"fixoTotal":0,"valorCausa":8.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C16","cliente":"Fulano 23","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Sucumbência","pctExito":0.05,"pctSucumb":0.05,"pctQuota":0.05,"fixoTotal":4.0,"valorCausa":7.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C17","cliente":"Fulano 24","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Sucumbência","pctExito":0.01,"pctSucumb":0.01,"pctQuota":0.07,"fixoTotal":0,"valorCausa":2.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C18","cliente":"Fulano 25","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.03,"pctSucumb":0.05,"pctQuota":0.04,"fixoTotal":0,"valorCausa":3.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C19","cliente":"Fulano 26","parceiroId":"P3","processo":"","tipoHonorario":"Êxito puro","pctExito":0.04,"pctSucumb":0.04,"pctQuota":0.04,"fixoTotal":0,"valorCausa":3.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C20","cliente":"Fulano 27","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.03,"pctSucumb":0.08,"pctQuota":0.04,"fixoTotal":0,"valorCausa":10.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C21","cliente":"Fulano 28","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.06,"pctSucumb":0.07,"pctQuota":0.04,"fixoTotal":0,"valorCausa":5.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C22","cliente":"Fulano 29","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo + Êxito + Sucumbência","pctExito":0.04,"pctSucumb":0.1,"pctQuota":0.06,"fixoTotal":4.0,"valorCausa":9.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C23","cliente":"Fulano 4","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.03,"pctSucumb":0.07,"pctQuota":0.1,"fixoTotal":0,"valorCausa":7.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C24","cliente":"Fulano 30","parceiroId":"P3","processo":"","tipoHonorario":"Êxito puro","pctExito":0.07,"pctSucumb":0.09,"pctQuota":0.04,"fixoTotal":0,"valorCausa":6.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C25","cliente":"Fulano 31","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.09,"pctSucumb":0.07,"pctQuota":0.09,"fixoTotal":0,"valorCausa":5.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C26","cliente":"Fulano 32","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.1,"pctSucumb":0.1,"pctQuota":0.06,"fixoTotal":0,"valorCausa":3.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C27","cliente":"Fulano 33","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo + Êxito","pctExito":0.06,"pctSucumb":0.1,"pctQuota":0.09,"fixoTotal":3.0,"valorCausa":3.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C28","cliente":"Fulano 34","parceiroId":"P3","processo":"","tipoHonorario":"Êxito puro","pctExito":0.04,"pctSucumb":0.05,"pctQuota":0.02,"fixoTotal":0,"valorCausa":9.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C29","cliente":"Fulano 35","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.03,"pctSucumb":0.01,"pctQuota":0.06,"fixoTotal":0,"valorCausa":2.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C30","cliente":"Fulano 36","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.05,"pctSucumb":0.02,"pctQuota":0.05,"fixoTotal":0,"valorCausa":3.0,"status":"Aguardando êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C31","cliente":"Fulano 37","parceiroId":"P3","processo":"","tipoHonorario":"Êxito puro","pctExito":0.08,"pctSucumb":0.01,"pctQuota":0.08,"fixoTotal":0,"valorCausa":0,"status":"Sem êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C32","cliente":"Fulano 38","parceiroId":"P3","processo":"","tipoHonorario":"Êxito puro","pctExito":0.04,"pctSucumb":0.1,"pctQuota":0.08,"fixoTotal":0,"valorCausa":3.0,"status":"Sem êxito","splitNick":"Detalhes do acordo (exemplo)","obs":"PERDEMOS","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C33","cliente":"Fulano 9","parceiroId":"P4","processo":"","tipoHonorario":"Êxito + Sucumbência","pctExito":0.03,"pctSucumb":0.09,"pctQuota":0.06,"fixoTotal":0,"valorCausa":8.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C34","cliente":"Fulano 39","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.05,"pctSucumb":0.05,"pctQuota":0.07,"fixoTotal":0,"valorCausa":5.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C35","cliente":"Fulano 40","parceiroId":"P4","processo":"","tipoHonorario":"Êxito + Sucumbência","pctExito":0.03,"pctSucumb":0.02,"pctQuota":0.02,"fixoTotal":0,"valorCausa":2.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C36","cliente":"Fulano 41","parceiroId":"P4","processo":"","tipoHonorario":"Sucumbência","pctExito":0.01,"pctSucumb":0.1,"pctQuota":0.04,"fixoTotal":0,"valorCausa":3.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C37","cliente":"Fulano 42","parceiroId":"P4","processo":"","tipoHonorario":"Êxito puro","pctExito":0.05,"pctSucumb":0.01,"pctQuota":0.02,"fixoTotal":0,"valorCausa":1.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C38","cliente":"Fulano 43","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Sucumbência","pctExito":0.07,"pctSucumb":0.1,"pctQuota":0.07,"fixoTotal":0,"valorCausa":1.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C39","cliente":"Fulano 44","parceiroId":"P4","processo":"","tipoHonorario":"Fixo único","pctExito":0.1,"pctSucumb":0.07,"pctQuota":0.06,"fixoTotal":4.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C40","cliente":"Fulano 45","parceiroId":"P4","processo":"","tipoHonorario":"Êxito puro","pctExito":0.08,"pctSucumb":0.05,"pctQuota":0.08,"fixoTotal":0,"valorCausa":7.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C41","cliente":"Fulano 46","parceiroId":"P4","processo":"","tipoHonorario":"Sucumbência","pctExito":0.02,"pctSucumb":0.01,"pctQuota":0.1,"fixoTotal":0,"valorCausa":5.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C42","cliente":"Fulano 47","parceiroId":"P4","processo":"","tipoHonorario":"Sucumbência","pctExito":0.04,"pctSucumb":0.09,"pctQuota":0.01,"fixoTotal":0,"valorCausa":2.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C43","cliente":"Fulano 48","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.02,"pctSucumb":0.03,"pctQuota":0.04,"fixoTotal":0,"valorCausa":8.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C44","cliente":"Fulano 49","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.09,"pctSucumb":0.05,"pctQuota":0.03,"fixoTotal":0,"valorCausa":5.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C45","cliente":"Fulano 50","parceiroId":"P4","processo":"","tipoHonorario":"Sucumbência","pctExito":0.06,"pctSucumb":0.03,"pctQuota":0.1,"fixoTotal":0,"valorCausa":8.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C46","cliente":"Fulano 51","parceiroId":"P4","processo":"","tipoHonorario":"Fixo + Êxito","pctExito":0.03,"pctSucumb":0.1,"pctQuota":0.07,"fixoTotal":2.0,"valorCausa":7.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C47","cliente":"Fulano 52","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.09,"pctSucumb":0.1,"pctQuota":0.09,"fixoTotal":0,"valorCausa":7.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C48","cliente":"Fulano 53","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.09,"pctSucumb":0.09,"pctQuota":0.01,"fixoTotal":0,"valorCausa":2.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C49","cliente":"Fulano 6","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Sucumbência","pctExito":0.01,"pctSucumb":0.03,"pctQuota":0.05,"fixoTotal":0,"valorCausa":8.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C50","cliente":"Fulano 54","parceiroId":"P4","processo":"","tipoHonorario":"Êxito + Sucumbência","pctExito":0.05,"pctSucumb":0.05,"pctQuota":0.1,"fixoTotal":0,"valorCausa":9.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C51","cliente":"Fulano 55","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.09,"pctSucumb":0.06,"pctQuota":0.06,"fixoTotal":0,"valorCausa":2.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C52","cliente":"Fulano 56","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.06,"pctSucumb":0.03,"pctQuota":0.07,"fixoTotal":0,"valorCausa":2.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C53","cliente":"Fulano 57","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.07,"pctSucumb":0.07,"pctQuota":0.09,"fixoTotal":0,"valorCausa":2.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C54","cliente":"Fulano 58","parceiroId":"P4","processo":"","tipoHonorario":"Fixo + Êxito","pctExito":0.09,"pctSucumb":0.03,"pctQuota":0.08,"fixoTotal":1.0,"valorCausa":1.0,"status":"Ativo","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C55","cliente":"Fulano 59","parceiroId":"P4","processo":"","tipoHonorario":"Êxito puro","pctExito":0.05,"pctSucumb":0.07,"pctQuota":0.08,"fixoTotal":0,"valorCausa":1.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C56","cliente":"Fulano 60","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Sucumbência","pctExito":0.09,"pctSucumb":0.01,"pctQuota":0.05,"fixoTotal":0,"valorCausa":4.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C57","cliente":"Fulano 61","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo + Êxito","pctExito":0.03,"pctSucumb":0.01,"pctQuota":0.09,"fixoTotal":5.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C58","cliente":"Fulano 62","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.03,"pctSucumb":0.01,"pctQuota":0.06,"fixoTotal":0,"valorCausa":7.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C59","cliente":"Fulano 63","parceiroId":"P4","processo":"","tipoHonorario":"Fixo único","pctExito":0.07,"pctSucumb":0.08,"pctQuota":0.07,"fixoTotal":9.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C60","cliente":"Fulano 64","parceiroId":"P4","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.1,"pctSucumb":0.06,"pctQuota":0.03,"fixoTotal":0,"valorCausa":1.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C61","cliente":"Fulano 65","parceiroId":"P4","processo":"","tipoHonorario":"Fixo + Êxito","pctExito":0.1,"pctSucumb":0.06,"pctQuota":0.01,"fixoTotal":9.0,"valorCausa":9.0,"status":"Ativo","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C62","cliente":"Fulano 66","parceiroId":"P4","processo":"","tipoHonorario":"Sucumbência","pctExito":0.04,"pctSucumb":0.01,"pctQuota":0.04,"fixoTotal":0,"valorCausa":1.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C63","cliente":"Fulano 67","parceiroId":"P5","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.08,"pctSucumb":0.08,"pctQuota":0.03,"fixoTotal":0,"valorCausa":9.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C64","cliente":"Fulano 68","parceiroId":"P5","processo":"","tipoHonorario":"Fixo + Êxito","pctExito":0.02,"pctSucumb":0.08,"pctQuota":0.06,"fixoTotal":5.0,"valorCausa":6.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C65","cliente":"Fulano 1","parceiroId":"P5","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.02,"pctSucumb":0.01,"pctQuota":0.03,"fixoTotal":0,"valorCausa":3.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C66","cliente":"Fulano 69","parceiroId":"P5","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.1,"pctSucumb":0.09,"pctQuota":0.01,"fixoTotal":0,"valorCausa":4.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C67","cliente":"Fulano 10","parceiroId":"P5","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.07,"pctSucumb":0.09,"pctQuota":0.06,"fixoTotal":0,"valorCausa":7.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C68","cliente":"Fulano 70","parceiroId":"P5","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito puro","pctExito":0.02,"pctSucumb":0.08,"pctQuota":0.02,"fixoTotal":0,"valorCausa":4.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C69","cliente":"Fulano 71","parceiroId":"P5","processo":"","tipoHonorario":"Fixo único","pctExito":0.08,"pctSucumb":0.06,"pctQuota":0.05,"fixoTotal":3.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C70","cliente":"Fulano 5","parceiroId":"P5","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Êxito + Sucumbência","pctExito":0.06,"pctSucumb":0.02,"pctQuota":0.01,"fixoTotal":0,"valorCausa":10.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C71","cliente":"Fulano 72","parceiroId":"P6","processo":"","tipoHonorario":"Fixo mensal","pctExito":0.09,"pctSucumb":0.06,"pctQuota":0.09,"fixoTotal":10.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C72","cliente":"Fulano 73","parceiroId":"P6","processo":"","tipoHonorario":"Sucumbência","pctExito":0.1,"pctSucumb":0.07,"pctQuota":0.05,"fixoTotal":0,"valorCausa":5.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C73","cliente":"Fulano 74","parceiroId":"P6","processo":"","tipoHonorario":"Fixo mensal","pctExito":0.05,"pctSucumb":0.03,"pctQuota":0.01,"fixoTotal":5.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C74","cliente":"Fulano 75","parceiroId":"P6","processo":"","tipoHonorario":"Fixo mensal","pctExito":0.08,"pctSucumb":0.1,"pctQuota":0.03,"fixoTotal":2.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C75","cliente":"Fulano 76","parceiroId":"P4","processo":"","tipoHonorario":"Fixo único","pctExito":0.09,"pctSucumb":0.06,"pctQuota":0.1,"fixoTotal":2.0,"valorCausa":0,"status":"Proposta","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":""},{"id":"C76","cliente":"Fulano 3","parceiroId":"P4","processo":"","tipoHonorario":"Fixo + Êxito","pctExito":0.01,"pctSucumb":0.07,"pctQuota":0.01,"fixoTotal":3.0,"valorCausa":2.0,"status":"Proposta","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":""},{"id":"C77","cliente":"Fulano 77","parceiroId":"P1","processo":"","tipoHonorario":"Fixo + Êxito","pctExito":0.02,"pctSucumb":0.02,"pctQuota":0.09,"fixoTotal":7.0,"valorCausa":7.0,"status":"Proposta","splitNick":"","obs":"Nao fechou - em negociacao","dataProposta":"2026-01-15","dataFechamento":""},{"id":"C78","cliente":"Fulano 78","parceiroId":"P5","processo":"","tipoHonorario":"Fixo mensal","pctExito":0.05,"pctSucumb":0.03,"pctQuota":0.02,"fixoTotal":8.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C79","cliente":"Fulano 79","parceiroId":"P5","processo":"","tipoHonorario":"Êxito + Sucumbência","pctExito":0.06,"pctSucumb":0.03,"pctQuota":0.07,"fixoTotal":0,"valorCausa":1.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C80","cliente":"Fulano 80","parceiroId":"P5","processo":"","tipoHonorario":"Êxito + Sucumbência","pctExito":0.09,"pctSucumb":0.1,"pctQuota":0.09,"fixoTotal":0,"valorCausa":9.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C81","cliente":"Fulano 81","parceiroId":"P5","processo":"","tipoHonorario":"Êxito + Sucumbência","pctExito":0.05,"pctSucumb":0.05,"pctQuota":0.05,"fixoTotal":0,"valorCausa":10.0,"status":"Aguardando êxito","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2026-01-15","dataFechamento":"2026-02-01"},{"id":"C82","cliente":"Fulano 82","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":7.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C83","cliente":"Fulano 83","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":5.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C84","cliente":"Fulano 84","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":7.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C85","cliente":"Fulano 85","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":7.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Pago — valor não registrado","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C86","cliente":"Fulano 86","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":5.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C87","cliente":"Fulano 87","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":6.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C88","cliente":"Fulano 88","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":8.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C89","cliente":"Fulano 89","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":10.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C90","cliente":"Fulano 90","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":9.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Pago — valor não registrado","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C91","cliente":"Fulano 91","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":7.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C92","cliente":"Fulano 92","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":5.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C93","cliente":"Fulano 93","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":1.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C94","cliente":"Fulano 94","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":2.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C95","cliente":"Fulano 95","parceiroId":"P3","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":6.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C96","cliente":"Fulano 96","parceiroId":"P1","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":4.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C97","cliente":"Fulano 97","parceiroId":"P1","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":4.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C98","cliente":"Fulano 98","parceiroId":"P1","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":9.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C99","cliente":"Fulano 99","parceiroId":"P2","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":3.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C100","cliente":"Fulano 100","parceiroId":"P2","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":1.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C101","cliente":"Fulano 101","parceiroId":"P2","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":8.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C102","cliente":"Fulano 102","parceiroId":"P2","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":1.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C103","cliente":"Fulano 103","parceiroId":"P2","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":1.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C104","cliente":"Fulano 104","parceiroId":"P2","processo":"0000000-00.0000.8.26.0000","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":2.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C105","cliente":"Fulano 105","parceiroId":"P5","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":10.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C106","cliente":"Fulano 106","parceiroId":"P5","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":6.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C107","cliente":"Fulano 107","parceiroId":"P5","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":9.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C108","cliente":"Fulano 17","parceiroId":"P3","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":9.0,"valorCausa":0,"status":"Encerrado","splitNick":"","obs":"Detalhes do acordo (exemplo)","dataProposta":"2025-11-01","dataFechamento":"2025-12-01"},{"id":"C109","cliente":"Fulano 77","parceiroId":"P1","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":3.0,"valorCausa":0,"status":"Proposta","splitNick":"","obs":"Detalhes do acordo (exemplo) · Negociando","dataProposta":"2026-03-15","dataFechamento":""},{"id":"C110","cliente":"Fulano 76","parceiroId":"P4","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":5.0,"valorCausa":0,"status":"Proposta","splitNick":"","obs":"Detalhes do acordo (exemplo) · Aguardando","dataProposta":"2026-03-15","dataFechamento":""},{"id":"C111","cliente":"Fulano 3","parceiroId":"P4","processo":"","tipoHonorario":"Fixo único","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":1.0,"valorCausa":0,"status":"Proposta","splitNick":"","obs":"Detalhes do acordo (exemplo) · Aguardando","dataProposta":"2026-03-15","dataFechamento":""},{"id":"C112","cliente":"Fulano 108","parceiroId":"P2","processo":"","tipoHonorario":"Fixo mensal","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":2.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"⚠ Recuperado da aba MENSAIS — tinha parcelas mas nenhuma linha em CONTRATOS.","dataProposta":"2026-02-01","dataFechamento":"2026-02-15"},{"id":"C113","cliente":"Fulano 109","parceiroId":"P5","processo":"","tipoHonorario":"Fixo mensal","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":5.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"⚠ Recuperado da aba MENSAIS — tinha parcelas mas nenhuma linha em CONTRATOS.","dataProposta":"2026-02-01","dataFechamento":"2026-02-15"},{"id":"C114","cliente":"Fulano 110","parceiroId":"P5","processo":"","tipoHonorario":"Fixo mensal","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":2.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"⚠ Recuperado da aba MENSAIS — tinha parcelas mas nenhuma linha em CONTRATOS.","dataProposta":"2026-02-01","dataFechamento":"2026-02-15"},{"id":"C115","cliente":"Fulano 111","parceiroId":"P5","processo":"","tipoHonorario":"Fixo mensal","pctExito":0,"pctSucumb":0,"pctQuota":0,"fixoTotal":7.0,"valorCausa":0,"status":"Ativo","splitNick":"","obs":"⚠ Recuperado da aba MENSAIS — tinha parcelas mas nenhuma linha em CONTRATOS.","dataProposta":"2026-02-01","dataFechamento":"2026-02-15"}],"parcelas":[{"id":"R1","contratoId":"C46","tipo":"Inicial","valor":5.0,"mesEsperado":"2026-05","recebido":true,"mesEfetivo":"2026-05","obs":""},{"id":"R2","contratoId":"C46","tipo":"Mensal","valor":7.0,"mesEsperado":"2026-06","recebido":false,"mesEfetivo":"","obs":""},{"id":"R3","contratoId":"C46","tipo":"Mensal","valor":3.0,"mesEsperado":"2026-07","recebido":false,"mesEfetivo":"","obs":""},{"id":"R4","contratoId":"C46","tipo":"Mensal","valor":6.0,"mesEsperado":"2026-08","recebido":false,"mesEfetivo":"","obs":""},{"id":"R5","contratoId":"C46","tipo":"Mensal","valor":7.0,"mesEsperado":"2026-09","recebido":false,"mesEfetivo":"","obs":""},{"id":"R6","contratoId":"C46","tipo":"Mensal","valor":7.0,"mesEsperado":"2026-10","recebido":false,"mesEfetivo":"","obs":""},{"id":"R7","contratoId":"C46","tipo":"Mensal","valor":4.0,"mesEsperado":"2026-11","recebido":false,"mesEfetivo":"","obs":""},{"id":"R8","contratoId":"C46","tipo":"Mensal","valor":5.0,"mesEsperado":"2026-12","recebido":false,"mesEfetivo":"","obs":""},{"id":"R9","contratoId":"C46","tipo":"Mensal","valor":8.0,"mesEsperado":"2027-01","recebido":false,"mesEfetivo":"","obs":""},{"id":"R10","contratoId":"C2","tipo":"Inicial","valor":8.0,"mesEsperado":"2026-05","recebido":false,"mesEfetivo":"","obs":"Detalhes do acordo (exemplo)"},{"id":"R11","contratoId":"C2","tipo":"Inicial","valor":9.0,"mesEsperado":"2026-06","recebido":false,"mesEfetivo":"","obs":""},{"id":"R12","contratoId":"C2","tipo":"Inicial","valor":5.0,"mesEsperado":"2026-07","recebido":false,"mesEfetivo":"","obs":""},{"id":"R13","contratoId":"C2","tipo":"Inicial","valor":6.0,"mesEsperado":"2026-08","recebido":false,"mesEfetivo":"","obs":""},{"id":"R14","contratoId":"C57","tipo":"Mensal","valor":6.0,"mesEsperado":"2026-06","recebido":true,"mesEfetivo":"2025-10","obs":"Detalhes do acordo (exemplo)"},{"id":"R15","contratoId":"C54","tipo":"Mensal","valor":5.0,"mesEsperado":"2026-03","recebido":true,"mesEfetivo":"","obs":"Detalhes do acordo (exemplo)"},{"id":"R16","contratoId":"C54","tipo":"Mensal","valor":8.0,"mesEsperado":"2026-04","recebido":true,"mesEfetivo":"","obs":""},{"id":"R17","contratoId":"C54","tipo":"Mensal","valor":2.0,"mesEsperado":"2026-05","recebido":false,"mesEfetivo":"","obs":""},{"id":"R18","contratoId":"C54","tipo":"Mensal","valor":10.0,"mesEsperado":"2026-06","recebido":false,"mesEfetivo":"","obs":""},{"id":"R19","contratoId":"C61","tipo":"Inicial","valor":6.0,"mesEsperado":"2026-05","recebido":true,"mesEfetivo":"2026-05","obs":"Detalhes do acordo (exemplo)"},{"id":"R20","contratoId":"C71","tipo":"Mensal","valor":9.0,"mesEsperado":"2026-05","recebido":true,"mesEfetivo":"","obs":"Detalhes do acordo (exemplo)"},{"id":"R21","contratoId":"C71","tipo":"Mensal","valor":10.0,"mesEsperado":"2026-06","recebido":false,"mesEfetivo":"","obs":""},{"id":"R22","contratoId":"C71","tipo":"Mensal","valor":1.0,"mesEsperado":"2026-07","recebido":false,"mesEfetivo":"","obs":""},{"id":"R23","contratoId":"C71","tipo":"Mensal","valor":5.0,"mesEsperado":"2026-08","recebido":false,"mesEfetivo":"","obs":""},{"id":"R24","contratoId":"C73","tipo":"Mensal","valor":10.0,"mesEsperado":"2026-05","recebido":false,"mesEfetivo":"","obs":"Detalhes do acordo (exemplo)"},{"id":"R25","contratoId":"C73","tipo":"Mensal","valor":8.0,"mesEsperado":"2026-06","recebido":false,"mesEfetivo":"","obs":""},{"id":"R26","contratoId":"C73","tipo":"Mensal","valor":7.0,"mesEsperado":"2026-07","recebido":false,"mesEfetivo":"","obs":""},{"id":"R27","contratoId":"C73","tipo":"Mensal","valor":2.0,"mesEsperado":"2026-08","recebido":false,"mesEfetivo":"","obs":""},{"id":"R28","contratoId":"C74","tipo":"Mensal","valor":2.0,"mesEsperado":"2026-06","recebido":false,"mesEfetivo":"","obs":"Contínuo"},{"id":"R29","contratoId":"C5","tipo":"Mensal","valor":6.0,"mesEsperado":"2026-05","recebido":false,"mesEfetivo":"","obs":"Detalhes do acordo (exemplo)"},{"id":"R30","contratoId":"C5","tipo":"Mensal","valor":10.0,"mesEsperado":"2026-06","recebido":false,"mesEfetivo":"","obs":""},{"id":"R31","contratoId":"C5","tipo":"Mensal","valor":4.0,"mesEsperado":"2026-07","recebido":false,"mesEfetivo":"","obs":""},{"id":"R32","contratoId":"C5","tipo":"Mensal","valor":9.0,"mesEsperado":"2026-08","recebido":false,"mesEfetivo":"","obs":""},{"id":"R33","contratoId":"C5","tipo":"Mensal","valor":8.0,"mesEsperado":"2026-09","recebido":false,"mesEfetivo":"","obs":""},{"id":"R34","contratoId":"C5","tipo":"Mensal","valor":8.0,"mesEsperado":"2026-10","recebido":false,"mesEfetivo":"","obs":"Última"},{"id":"R35","contratoId":"C9","tipo":"Sucumbência","valor":7.0,"mesEsperado":"2026-05","recebido":true,"mesEfetivo":"2026-05","obs":"Encerrado — sucumbencia recebida"},{"id":"R36","contratoId":"C91","tipo":"Êxito","valor":1.0,"mesEsperado":"2026-05","recebido":true,"mesEfetivo":"2026-05","obs":"Detalhes do acordo (exemplo)"},{"id":"R37","contratoId":"C16","tipo":"Sucumbência","valor":4.0,"mesEsperado":"2026-05","recebido":true,"mesEfetivo":"2026-05","obs":"Detalhes do acordo (exemplo)"},{"id":"RX1","contratoId":"C112","tipo":"Mensal","valor":2.0,"mesEsperado":"2026-06","recebido":true,"mesEfetivo":"2026-01","obs":"Detalhes do acordo (exemplo)"},{"id":"RX2","contratoId":"C113","tipo":"Inicial","valor":5.0,"mesEsperado":"2026-05","recebido":true,"mesEfetivo":"2026-05","obs":""},{"id":"RX3","contratoId":"C114","tipo":"Inicial","valor":2.0,"mesEsperado":"2026-05","recebido":false,"mesEfetivo":"","obs":"Único"},{"id":"RX4","contratoId":"C115","tipo":"Mensal","valor":7.0,"mesEsperado":"2026-06","recebido":false,"mesEfetivo":"","obs":"Recorrente sem data fixa — atualizar RECEBIDO? todo mês"}],"custosFixos":[{"id":"F1","descricao":"Contador","valor":3.0,"recorrente":true,"diaVenc":9,"mesInicio":1,"mesFim":12},{"id":"F2","descricao":"JusBrasil","valor":5.0,"recorrente":true,"diaVenc":5,"mesInicio":1,"mesFim":12},{"id":"F3","descricao":"ChatGPT","valor":4.0,"recorrente":true,"diaVenc":2,"mesInicio":10,"mesFim":12},{"id":"F4","descricao":"Hospedainfo","valor":9.0,"recorrente":true,"diaVenc":9,"mesInicio":7,"mesFim":12},{"id":"F5","descricao":"Hostinger","valor":8.0,"recorrente":true,"diaVenc":7,"mesInicio":7,"mesFim":12},{"id":"F6","descricao":"Contador","valor":1.0,"recorrente":true,"diaVenc":1,"mesInicio":6,"mesFim":12},{"id":"F7","descricao":"Claude","valor":10.0,"recorrente":true,"diaVenc":3,"mesInicio":2,"mesFim":12},{"id":"F8","descricao":"Tráfego Pago — Gestor","valor":3.0,"recorrente":true,"diaVenc":8,"mesInicio":3,"mesFim":12},{"id":"F9","descricao":"Tráfego Pago — Google","valor":6.0,"recorrente":true,"diaVenc":3,"mesInicio":3,"mesFim":12}],"lancamentos":[{"id":"L1","data":"2026-01-02","descricao":"Fulano 1","tipo":"entrada","valor":10.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C65","obs":"","origem":"manual","origemId":""},{"id":"L2","data":"2026-01-07","descricao":"Fulano 2","tipo":"entrada","valor":5.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C4","obs":"","origem":"manual","origemId":""},{"id":"L3","data":"2026-01-08","descricao":"Fulano 3","tipo":"entrada","valor":6.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C76","obs":"","origem":"manual","origemId":""},{"id":"L4","data":"2026-01-09","descricao":"Fulano 4","tipo":"entrada","valor":10.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C23","obs":"","origem":"manual","origemId":""},{"id":"L5","data":"2026-01-10","descricao":"Fulano 5","tipo":"entrada","valor":4.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C70","obs":"","origem":"manual","origemId":""},{"id":"L6","data":"2026-01-11","descricao":"Fulano 3","tipo":"entrada","valor":6.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C76","obs":"","origem":"manual","origemId":""},{"id":"L7","data":"2026-01-12","descricao":"Fulano 6","tipo":"entrada","valor":8.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C49","obs":"","origem":"manual","origemId":""},{"id":"L8","data":"2026-01-13","descricao":"Fulano 7","tipo":"entrada","valor":2.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C14","obs":"","origem":"manual","origemId":""},{"id":"L9","data":"2026-01-14","descricao":"Fulano 8","tipo":"entrada","valor":3.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C3","obs":"","origem":"manual","origemId":""},{"id":"L10","data":"2026-01-15","descricao":"Fulano 9","tipo":"entrada","valor":2.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C33","obs":"","origem":"manual","origemId":""},{"id":"L11","data":"2026-01-16","descricao":"GOOGLE ADS","tipo":"saida","valor":6.0,"categoria":"Marketing","forma":"PIX","pago":true,"contratoId":"","obs":"","origem":"manual","origemId":""},{"id":"L12","data":"2026-01-17","descricao":"Fulano 10","tipo":"entrada","valor":2.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C67","obs":"","origem":"manual","origemId":""},{"id":"L13","data":"2026-01-18","descricao":"Fulano 3","tipo":"entrada","valor":6.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C76","obs":"","origem":"manual","origemId":""},{"id":"L14","data":"2026-01-19","descricao":"Fulano 11","tipo":"entrada","valor":4.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C1","obs":"","origem":"manual","origemId":""},{"id":"L15","data":"2026-01-21","descricao":"Fulano 12","tipo":"saida","valor":5.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C2","obs":"","origem":"manual","origemId":""},{"id":"L16","data":"2026-01-22","descricao":"Fulano 13","tipo":"saida","valor":8.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C5","obs":"","origem":"manual","origemId":""},{"id":"L17","data":"2026-01-23","descricao":"Fulano 14","tipo":"entrada","valor":10.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C6","obs":"","origem":"manual","origemId":""},{"id":"L18","data":"2026-01-24","descricao":"Fulano 15","tipo":"saida","valor":9.0,"categoria":"Custas processuais","forma":"PIX","pago":true,"contratoId":"C7","obs":"","origem":"manual","origemId":""},{"id":"L19","data":"2026-01-25","descricao":"Fulano 16","tipo":"saida","valor":2.0,"categoria":"Custas processuais","forma":"PIX","pago":true,"contratoId":"C8","obs":"","origem":"manual","origemId":""},{"id":"L20","data":"2026-01-26","descricao":"Fulano 17","tipo":"entrada","valor":3.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C9","obs":"","origem":"manual","origemId":""},{"id":"L21","data":"2026-01-27","descricao":"Fulano 18","tipo":"saida","valor":4.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C10","obs":"","origem":"manual","origemId":""},{"id":"L22","data":"2026-01-28","descricao":"CONSULTORIA DELTA 1/3","tipo":"saida","valor":3.0,"categoria":"Custo fixo","forma":"PIX","pago":true,"contratoId":"","obs":"","origem":"manual","origemId":""},{"id":"L23","data":"2026-01-29","descricao":"Fulano 8","tipo":"entrada","valor":8.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C3","obs":"","origem":"manual","origemId":""},{"id":"L24","data":"2026-01-30","descricao":"Fulano 4","tipo":"entrada","valor":6.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C23","obs":"","origem":"manual","origemId":""},{"id":"L25","data":"2026-01-20","descricao":"Condomínio Santo André","tipo":"saida","valor":2.0,"categoria":"Custo fixo","forma":"PIX","pago":true,"contratoId":"","obs":"","origem":"manual","origemId":""},{"id":"L26","data":"2026-02-09","descricao":"Fulano 19","tipo":"entrada","valor":8.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C11","obs":"","origem":"manual","origemId":""},{"id":"L27","data":"2026-02-11","descricao":"Fulano 20","tipo":"entrada","valor":3.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C12","obs":"","origem":"manual","origemId":""},{"id":"L28","data":"2026-02-08","descricao":"Fulano 21","tipo":"entrada","valor":4.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C13","obs":"","origem":"manual","origemId":""},{"id":"L29","data":"2026-02-07","descricao":"Fulano 22","tipo":"entrada","valor":2.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C15","obs":"","origem":"manual","origemId":""},{"id":"L30","data":"2026-02-14","descricao":"Fulano 23","tipo":"entrada","valor":2.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C16","obs":"","origem":"manual","origemId":""},{"id":"L31","data":"2026-02-15","descricao":"Fulano 24","tipo":"entrada","valor":6.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C17","obs":"","origem":"manual","origemId":""},{"id":"L32","data":"2026-02-16","descricao":"Fulano 25","tipo":"entrada","valor":8.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C18","obs":"","origem":"manual","origemId":""},{"id":"L33","data":"2026-02-13","descricao":"Fulano 26","tipo":"saida","valor":1.0,"categoria":"Custas processuais","forma":"PIX","pago":true,"contratoId":"C19","obs":"","origem":"manual","origemId":""},{"id":"L34","data":"2026-02-17","descricao":"CONSULTORIA DELTA 2/3","tipo":"saida","valor":7.0,"categoria":"Custo fixo","forma":"PIX","pago":true,"contratoId":"","obs":"","origem":"manual","origemId":""},{"id":"L35","data":"2026-02-20","descricao":"Fulano 27","tipo":"saida","valor":10.0,"categoria":"Custo fixo","forma":"PIX","pago":true,"contratoId":"C20","obs":"","origem":"manual","origemId":""},{"id":"L36","data":"2026-02-20","descricao":"Fulano 28","tipo":"entrada","valor":4.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C21","obs":"","origem":"manual","origemId":""},{"id":"L37","data":"2026-02-06","descricao":"Fulano 29","tipo":"saida","valor":5.0,"categoria":"Custo fixo","forma":"PIX","pago":true,"contratoId":"C22","obs":"","origem":"manual","origemId":""},{"id":"L38","data":"2026-02-05","descricao":"Fulano 30","tipo":"saida","valor":3.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C24","obs":"","origem":"manual","origemId":""},{"id":"L39","data":"2026-02-23","descricao":"Fulano 31","tipo":"saida","valor":6.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C25","obs":"","origem":"manual","origemId":""},{"id":"L40","data":"2026-02-15","descricao":"Fulano 27","tipo":"saida","valor":9.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C20","obs":"","origem":"manual","origemId":""},{"id":"L41","data":"2026-03-04","descricao":"Fulano 32","tipo":"saida","valor":4.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C26","obs":"","origem":"manual","origemId":""},{"id":"L42","data":"2026-04-07","descricao":"Fulano 33","tipo":"saida","valor":10.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C27","obs":"","origem":"manual","origemId":""},{"id":"L43","data":"2026-03-09","descricao":"Fulano 34","tipo":"saida","valor":7.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C28","obs":"","origem":"manual","origemId":""},{"id":"L44","data":"2026-03-24","descricao":"Fulano 35","tipo":"saida","valor":6.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C29","obs":"","origem":"manual","origemId":""},{"id":"L45","data":"2026-03-20","descricao":"CONSULTORIA DELTA 3/3","tipo":"saida","valor":7.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"","obs":"","origem":"manual","origemId":""},{"id":"L46","data":"2026-03-21","descricao":"Fulano 36","tipo":"saida","valor":3.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C30","obs":"","origem":"manual","origemId":""},{"id":"L47","data":"2026-03-22","descricao":"Fulano 37","tipo":"saida","valor":8.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C31","obs":"","origem":"manual","origemId":""},{"id":"L48","data":"2026-03-07","descricao":"Vivo novo chip","tipo":"saida","valor":58.91,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"","obs":"","origem":"manual","origemId":""},{"id":"L49","data":"2026-03-03","descricao":"Fulano 38","tipo":"entrada","valor":2.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C32","obs":"","origem":"manual","origemId":""},{"id":"L50","data":"2026-03-04","descricao":"Fulano 39","tipo":"entrada","valor":7.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C34","obs":"","origem":"manual","origemId":""},{"id":"L51","data":"2026-03-04","descricao":"Fulano 40","tipo":"entrada","valor":10.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C35","obs":"","origem":"manual","origemId":""},{"id":"L52","data":"2026-03-05","descricao":"Fulano 21","tipo":"entrada","valor":10.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C13","obs":"","origem":"manual","origemId":""},{"id":"L53","data":"2026-03-06","descricao":"Fulano 41","tipo":"entrada","valor":7.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C36","obs":"","origem":"manual","origemId":""},{"id":"L54","data":"2026-03-06","descricao":"Fulano 42","tipo":"saida","valor":1.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C37","obs":"","origem":"manual","origemId":""},{"id":"L55","data":"2026-03-10","descricao":"Fulano 43","tipo":"entrada","valor":5.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C38","obs":"","origem":"manual","origemId":""},{"id":"L56","data":"2026-03-13","descricao":"Fulano 44","tipo":"entrada","valor":4.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C39","obs":"","origem":"manual","origemId":""},{"id":"L57","data":"2026-03-13","descricao":"Fulano 45","tipo":"saida","valor":10.0,"categoria":"Custas processuais","forma":"PIX","pago":true,"contratoId":"C40","obs":"","origem":"manual","origemId":""},{"id":"L58","data":"2026-03-17","descricao":"Fulano 46","tipo":"entrada","valor":7.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C41","obs":"","origem":"manual","origemId":""},{"id":"L59","data":"2026-03-20","descricao":"Fulano 47","tipo":"entrada","valor":3.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C42","obs":"","origem":"manual","origemId":""},{"id":"L60","data":"2026-03-25","descricao":"Fulano 48","tipo":"entrada","valor":8.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C43","obs":"","origem":"manual","origemId":""},{"id":"L61","data":"2026-03-26","descricao":"Fulano 49","tipo":"entrada","valor":7.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C44","obs":"","origem":"manual","origemId":""},{"id":"L62","data":"2026-03-27","descricao":"Fulano 50","tipo":"entrada","valor":8.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C45","obs":"","origem":"manual","origemId":""},{"id":"L63","data":"2026-03-30","descricao":"Fulano 51","tipo":"entrada","valor":1.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C46","obs":"","origem":"manual","origemId":""},{"id":"L64","data":"2026-03-20","descricao":"Fulano 52","tipo":"entrada","valor":2.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C47","obs":"","origem":"manual","origemId":""},{"id":"L65","data":"2026-03-05","descricao":"Fulano 21","tipo":"entrada","valor":9.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C13","obs":"","origem":"manual","origemId":""},{"id":"L66","data":"2026-03-04","descricao":"Fulano 39","tipo":"entrada","valor":3.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C34","obs":"","origem":"manual","origemId":""},{"id":"L67","data":"2026-04-04","descricao":"Fulano 53","tipo":"entrada","valor":10.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C48","obs":"","origem":"manual","origemId":""},{"id":"L68","data":"2026-03-10","descricao":"Fulano 43","tipo":"entrada","valor":3.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C38","obs":"","origem":"manual","origemId":""},{"id":"L69","data":"2026-04-20","descricao":"Fulano 54","tipo":"saida","valor":10.0,"categoria":"Custas processuais","forma":"PIX","pago":true,"contratoId":"C50","obs":"","origem":"manual","origemId":""},{"id":"L70","data":"2026-03-06","descricao":"Fulano 55","tipo":"saida","valor":5.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C51","obs":"","origem":"manual","origemId":""},{"id":"L71","data":"2026-04-16","descricao":"Fulano 56","tipo":"saida","valor":6.0,"categoria":"Custas processuais","forma":"PIX","pago":true,"contratoId":"C52","obs":"","origem":"manual","origemId":""},{"id":"L72","data":"2026-04-23","descricao":"Fulano 57","tipo":"entrada","valor":6.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C53","obs":"","origem":"manual","origemId":""},{"id":"L73","data":"2026-04-24","descricao":"Fulano 58","tipo":"saida","valor":7.0,"categoria":"Marketing","forma":"PIX","pago":true,"contratoId":"C54","obs":"","origem":"manual","origemId":""},{"id":"L74","data":"2026-04-25","descricao":"Fulano 59","tipo":"saida","valor":2.0,"categoria":"Marketing","forma":"PIX","pago":true,"contratoId":"C55","obs":"","origem":"manual","origemId":""},{"id":"L75","data":"2026-03-30","descricao":"Fulano 51","tipo":"entrada","valor":9.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C46","obs":"","origem":"manual","origemId":""},{"id":"L76","data":"2026-05-20","descricao":"Fulano 60","tipo":"entrada","valor":4.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C56","obs":"","origem":"manual","origemId":""},{"id":"L77","data":"2026-05-05","descricao":"Fulano 21","tipo":"entrada","valor":10.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C13","obs":"","origem":"manual","origemId":""},{"id":"L78","data":"2026-05-04","descricao":"Fulano 39","tipo":"entrada","valor":7.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C34","obs":"","origem":"manual","origemId":""},{"id":"L79","data":"2026-05-04","descricao":"Fulano 61","tipo":"entrada","valor":6.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C57","obs":"","origem":"manual","origemId":""},{"id":"L80","data":"2026-05-10","descricao":"Fulano 43","tipo":"entrada","valor":8.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C38","obs":"","origem":"manual","origemId":""},{"id":"L81","data":"2026-05-30","descricao":"Fulano 51","tipo":"entrada","valor":1.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C46","obs":"","origem":"manual","origemId":""},{"id":"L82","data":"2026-05-22","descricao":"Fulano 49","tipo":"entrada","valor":10.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C44","obs":"","origem":"manual","origemId":""},{"id":"L83","data":"2026-05-25","descricao":"Fulano 62","tipo":"saida","valor":1.0,"categoria":"Custas processuais","forma":"PIX","pago":true,"contratoId":"C58","obs":"","origem":"manual","origemId":""},{"id":"L84","data":"2026-05-28","descricao":"Fulano 63","tipo":"saida","valor":9.0,"categoria":"Custo fixo","forma":"PIX","pago":true,"contratoId":"C59","obs":"","origem":"manual","origemId":""},{"id":"L85","data":"2026-05-29","descricao":"Fulano 64","tipo":"entrada","valor":6.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C60","obs":"","origem":"manual","origemId":""},{"id":"L86","data":"2026-05-18","descricao":"Fulano 65","tipo":"entrada","valor":1.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C61","obs":"","origem":"manual","origemId":""},{"id":"L87","data":"2026-05-19","descricao":"Fulano 66","tipo":"entrada","valor":9.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C62","obs":"","origem":"manual","origemId":""},{"id":"L88","data":"2026-05-20","descricao":"Fulano 67","tipo":"entrada","valor":3.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C63","obs":"","origem":"manual","origemId":""},{"id":"L89","data":"2026-06-13","descricao":"Fulano 68","tipo":"entrada","valor":4.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C64","obs":"","origem":"manual","origemId":""},{"id":"L90","data":"2026-06-14","descricao":"Fulano 21","tipo":"entrada","valor":2.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C13","obs":"","origem":"manual","origemId":""},{"id":"L91","data":"2026-06-15","descricao":"A&E ADV - DANIEL PAES","tipo":"entrada","valor":535.28,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"","obs":"","origem":"manual","origemId":""},{"id":"L92","data":"2026-06-16","descricao":"Fulano 69","tipo":"entrada","valor":7.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C66","obs":"","origem":"manual","origemId":""},{"id":"L93","data":"2026-06-18","descricao":"Fulano 51","tipo":"entrada","valor":7.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C46","obs":"","origem":"manual","origemId":""},{"id":"L94","data":"2026-06-19","descricao":"Fulano 63","tipo":"saida","valor":4.0,"categoria":"Custo fixo","forma":"PIX","pago":true,"contratoId":"C59","obs":"","origem":"manual","origemId":""},{"id":"L95","data":"2026-06-20","descricao":"Fulano 64","tipo":"entrada","valor":8.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C60","obs":"","origem":"manual","origemId":""},{"id":"L96","data":"2026-06-21","descricao":"Fulano 70","tipo":"entrada","valor":4.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C68","obs":"","origem":"manual","origemId":""},{"id":"L97","data":"2026-06-22","descricao":"Fulano 71","tipo":"entrada","valor":8.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C69","obs":"","origem":"manual","origemId":""},{"id":"L98","data":"2026-06-16","descricao":"Fulano 72","tipo":"entrada","valor":5.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C71","obs":"","origem":"manual","origemId":""},{"id":"L99","data":"2026-06-17","descricao":"Fulano 73","tipo":"saida","valor":2.0,"categoria":"Outras saídas","forma":"PIX","pago":true,"contratoId":"C72","obs":"","origem":"manual","origemId":""},{"id":"L100","data":"2026-06-19","descricao":"Fulano 74","tipo":"saida","valor":7.0,"categoria":"Custas processuais","forma":"PIX","pago":true,"contratoId":"C73","obs":"","origem":"manual","origemId":""},{"id":"L101","data":"2026-06-30","descricao":"Fulano 75","tipo":"entrada","valor":9.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C74","obs":"","origem":"manual","origemId":""},{"id":"L102","data":"2026-06-30","descricao":"Fulano 76","tipo":"entrada","valor":10.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C75","obs":"","origem":"manual","origemId":""},{"id":"L103","data":"2026-06-30","descricao":"Fulano 77","tipo":"entrada","valor":9.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C77","obs":"","origem":"manual","origemId":""},{"id":"L104","data":"2026-06-30","descricao":"Fulano 78","tipo":"entrada","valor":7.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C78","obs":"","origem":"manual","origemId":""},{"id":"L105","data":"2026-06-14","descricao":"Fulano 21","tipo":"entrada","valor":1.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C13","obs":"","origem":"manual","origemId":""},{"id":"L106","data":"2026-06-15","descricao":"Fulano 39","tipo":"entrada","valor":5.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C34","obs":"","origem":"manual","origemId":""},{"id":"L107","data":"2026-06-16","descricao":"Fulano 79","tipo":"entrada","valor":7.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C79","obs":"","origem":"manual","origemId":""},{"id":"L108","data":"2026-06-18","descricao":"Fulano 51","tipo":"entrada","valor":4.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C46","obs":"","origem":"manual","origemId":""},{"id":"L109","data":"2026-06-19","descricao":"Fulano 63","tipo":"saida","valor":9.0,"categoria":"Custo fixo","forma":"PIX","pago":false,"contratoId":"C59","obs":"","origem":"manual","origemId":""},{"id":"L110","data":"2026-06-21","descricao":"Fulano 70","tipo":"entrada","valor":9.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C68","obs":"","origem":"manual","origemId":""},{"id":"L111","data":"2026-06-22","descricao":"Fulano 71","tipo":"entrada","valor":10.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C69","obs":"","origem":"manual","origemId":""},{"id":"L112","data":"2026-07-01","descricao":"Fulano 80","tipo":"entrada","valor":9.0,"categoria":"Honorários","forma":"PIX","pago":true,"contratoId":"C80","obs":"","origem":"manual","origemId":""},{"id":"L113","data":"2026-07-08","descricao":"Fulano 81","tipo":"entrada","valor":10.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C81","obs":"","origem":"manual","origemId":""},{"id":"L114","data":"2026-07-09","descricao":"Fulano 82","tipo":"entrada","valor":3.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C82","obs":"","origem":"manual","origemId":""},{"id":"L115","data":"2026-07-11","descricao":"Fulano 83","tipo":"entrada","valor":3.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C83","obs":"","origem":"manual","origemId":""},{"id":"L116","data":"2026-07-12","descricao":"Fulano 78","tipo":"entrada","valor":7.0,"categoria":"Honorários","forma":"PIX","pago":false,"contratoId":"C78","obs":"","origem":"manual","origemId":""}],"params":{"caixaInicial":6.0,"metaCaixa":6.0,"metaRecorrencia":6.0,"recorrenciaAtual":3.0},"processos":[{"id":"PR1","numero":"3530829-60.2026.8.26.0667","contratoId":"C1","cliente":"Fulano 11","tribunal":"TJSP","comarca":"Americana","fase":"Cumprimento de sentença","ativo":true,"ultimoAndamento":"2026-06-27","monitorar":true},{"id":"PR2","numero":"7135241-84.2026.8.26.0060","contratoId":"C4","cliente":"Fulano 2","tribunal":"TRT-2","comarca":"São Paulo","fase":"Petição inicial","ativo":true,"ultimoAndamento":"2026-07-11","monitorar":true},{"id":"PR3","numero":"8275367-63.2026.8.26.0072","contratoId":"C6","cliente":"Fulano 14","tribunal":"TJSP","comarca":"Americana","fase":"Cumprimento de sentença","ativo":true,"ultimoAndamento":"2026-07-11","monitorar":true},{"id":"PR4","numero":"1991709-82.2026.8.26.0127","contratoId":"C7","cliente":"Fulano 15","tribunal":"TJSP","comarca":"Limeira","fase":"Execução","ativo":true,"ultimoAndamento":"2026-06-20","monitorar":true},{"id":"PR5","numero":"7655194-16.2026.8.26.0227","contratoId":"C10","cliente":"Fulano 18","tribunal":"TJSP","comarca":"Piracicaba","fase":"Contestação","ativo":true,"ultimoAndamento":"2026-07-13","monitorar":true},{"id":"PR6","numero":"8031986-28.2026.8.26.0554","contratoId":"C11","cliente":"Fulano 19","tribunal":"TJSP","comarca":"Piracicaba","fase":"Saneamento","ativo":true,"ultimoAndamento":"2026-07-03","monitorar":true},{"id":"PR7","numero":"4032085-23.2026.8.26.0596","contratoId":"C12","cliente":"Fulano 20","tribunal":"TRT-2","comarca":"Limeira","fase":"Réplica","ativo":true,"ultimoAndamento":"2026-06-04","monitorar":true},{"id":"PR8","numero":"2634613-80.2026.8.26.0730","contratoId":"C13","cliente":"Fulano 21","tribunal":"TJSP","comarca":"Piracicaba","fase":"Petição inicial","ativo":true,"ultimoAndamento":"2026-06-27","monitorar":true},{"id":"PR9","numero":"4455413-73.2026.8.26.0697","contratoId":"C14","cliente":"Fulano 7","tribunal":"TRT-2","comarca":"Santo André","fase":"Instrução","ativo":true,"ultimoAndamento":"2026-05-21","monitorar":true},{"id":"PR10","numero":"8603172-56.2026.8.26.0307","contratoId":"C15","cliente":"Fulano 22","tribunal":"TJSP","comarca":"São Paulo","fase":"Réplica","ativo":true,"ultimoAndamento":"2026-06-12","monitorar":true},{"id":"PR11","numero":"6037344-77.2026.8.26.0507","contratoId":"C16","cliente":"Fulano 23","tribunal":"TJSP","comarca":"Limeira","fase":"Recurso","ativo":true,"ultimoAndamento":"2026-07-11","monitorar":true},{"id":"PR12","numero":"2228106-25.2026.8.26.0525","contratoId":"C17","cliente":"Fulano 24","tribunal":"TJMG","comarca":"São Paulo","fase":"Instrução","ativo":true,"ultimoAndamento":"2026-07-03","monitorar":true},{"id":"PR13","numero":"9203439-63.2026.8.26.0041","contratoId":"C18","cliente":"Fulano 25","tribunal":"TJPR","comarca":"Americana","fase":"Cumprimento de sentença","ativo":true,"ultimoAndamento":"2026-07-09","monitorar":true},{"id":"PR14","numero":"6263809-53.2026.8.26.0712","contratoId":"C20","cliente":"Fulano 27","tribunal":"TJSP","comarca":"Piracicaba","fase":"Recurso","ativo":true,"ultimoAndamento":"2026-05-21","monitorar":true},{"id":"PR15","numero":"8653855-18.2026.8.26.0861","contratoId":"C21","cliente":"Fulano 28","tribunal":"TJSP","comarca":"Campinas","fase":"Recurso","ativo":true,"ultimoAndamento":"2026-05-21","monitorar":true},{"id":"PR16","numero":"2090518-17.2026.8.26.0749","contratoId":"C22","cliente":"Fulano 29","tribunal":"TJPR","comarca":"Campinas","fase":"Execução","ativo":true,"ultimoAndamento":"2026-05-06","monitorar":true},{"id":"PR17","numero":"8476611-46.2026.8.26.0734","contratoId":"C23","cliente":"Fulano 4","tribunal":"TJMG","comarca":"Limeira","fase":"Instrução","ativo":true,"ultimoAndamento":"2026-05-06","monitorar":true},{"id":"PR18","numero":"8745961-55.2026.8.26.0173","contratoId":"C25","cliente":"Fulano 31","tribunal":"TRT-2","comarca":"Americana","fase":"Recurso","ativo":true,"ultimoAndamento":"2026-07-13","monitorar":true},{"id":"PR19","numero":"4660918-46.2026.8.26.0133","contratoId":"C26","cliente":"Fulano 32","tribunal":"TJPR","comarca":"São Paulo","fase":"Sentença","ativo":true,"ultimoAndamento":"2026-07-13","monitorar":true},{"id":"PR20","numero":"9330000-20.2026.8.26.0171","contratoId":"C27","cliente":"Fulano 33","tribunal":"TJMG","comarca":"Santo André","fase":"Cumprimento de sentença","ativo":true,"ultimoAndamento":"2026-06-20","monitorar":true},{"id":"PR21","numero":"3297239-65.2026.8.26.0885","contratoId":"C29","cliente":"Fulano 35","tribunal":"TRT-2","comarca":"Campinas","fase":"Sentença","ativo":true,"ultimoAndamento":"2026-07-03","monitorar":true},{"id":"PR22","numero":"7382745-39.2026.8.26.0155","contratoId":"C30","cliente":"Fulano 36","tribunal":"TJSP","comarca":"São Paulo","fase":"Contestação","ativo":true,"ultimoAndamento":"2026-06-27","monitorar":true},{"id":"PR23","numero":"4914729-11.2026.8.26.0497","contratoId":"C34","cliente":"Fulano 39","tribunal":"TRT-2","comarca":"São Paulo","fase":"Saneamento","ativo":true,"ultimoAndamento":"2026-07-06","monitorar":true},{"id":"PR24","numero":"1068679-28.2026.8.26.0430","contratoId":"C38","cliente":"Fulano 43","tribunal":"TRT-2","comarca":"Campinas","fase":"Execução","ativo":true,"ultimoAndamento":"2026-07-03","monitorar":true},{"id":"PR25","numero":"6345416-26.2026.8.26.0708","contratoId":"C43","cliente":"Fulano 48","tribunal":"TRT-2","comarca":"Piracicaba","fase":"Petição inicial","ativo":true,"ultimoAndamento":"2026-05-21","monitorar":true},{"id":"PR26","numero":"7583025-60.2026.8.26.0409","contratoId":"C44","cliente":"Fulano 49","tribunal":"TJMG","comarca":"Americana","fase":"Recurso","ativo":true,"ultimoAndamento":"2026-06-12","monitorar":true},{"id":"PR27","numero":"7718312-17.2026.8.26.0196","contratoId":"C47","cliente":"Fulano 52","tribunal":"TJSP","comarca":"São Paulo","fase":"Recurso","ativo":true,"ultimoAndamento":"2026-05-06","monitorar":true},{"id":"PR28","numero":"2844290-53.2026.8.26.0616","contratoId":"C48","cliente":"Fulano 53","tribunal":"TJSP","comarca":"Americana","fase":"Petição inicial","ativo":true,"ultimoAndamento":"2026-07-09","monitorar":true},{"id":"PR29","numero":"3537804-78.2026.8.26.0104","contratoId":"C49","cliente":"Fulano 6","tribunal":"TJSP","comarca":"Piracicaba","fase":"Petição inicial","ativo":true,"ultimoAndamento":"2026-05-21","monitorar":true},{"id":"PR30","numero":"4488867-88.2026.8.26.0386","contratoId":"C51","cliente":"Fulano 55","tribunal":"TJSP","comarca":"Limeira","fase":"Saneamento","ativo":true,"ultimoAndamento":"2026-07-11","monitorar":true},{"id":"PR31","numero":"7109648-70.2026.8.26.0126","contratoId":"C52","cliente":"Fulano 56","tribunal":"TJSP","comarca":"Santo André","fase":"Recurso","ativo":true,"ultimoAndamento":"2026-06-27","monitorar":true},{"id":"PR32","numero":"9117398-49.2026.8.26.0088","contratoId":"C53","cliente":"Fulano 57","tribunal":"TJSP","comarca":"Americana","fase":"Instrução","ativo":true,"ultimoAndamento":"2026-06-12","monitorar":true},{"id":"PR33","numero":"9029943-98.2026.8.26.0166","contratoId":"C56","cliente":"Fulano 60","tribunal":"TRT-2","comarca":"Americana","fase":"Réplica","ativo":true,"ultimoAndamento":"2026-07-03","monitorar":true},{"id":"PR34","numero":"7069199-28.2026.8.26.0707","contratoId":"C57","cliente":"Fulano 61","tribunal":"TRT-2","comarca":"Americana","fase":"Cumprimento de sentença","ativo":true,"ultimoAndamento":"2026-06-04","monitorar":true},{"id":"PR35","numero":"2526903-99.2026.8.26.0866","contratoId":"C58","cliente":"Fulano 62","tribunal":"TJSP","comarca":"Piracicaba","fase":"Instrução","ativo":true,"ultimoAndamento":"2026-07-03","monitorar":true},{"id":"PR36","numero":"6967591-38.2026.8.26.0546","contratoId":"C60","cliente":"Fulano 64","tribunal":"TRT-2","comarca":"Piracicaba","fase":"Instrução","ativo":true,"ultimoAndamento":"2026-07-09","monitorar":true},{"id":"PR37","numero":"4742018-88.2026.8.26.0831","contratoId":"C63","cliente":"Fulano 67","tribunal":"TJSP","comarca":"São Paulo","fase":"Sentença","ativo":true,"ultimoAndamento":"2026-05-06","monitorar":true},{"id":"PR38","numero":"4354067-76.2026.8.26.0505","contratoId":"C65","cliente":"Fulano 1","tribunal":"TJSP","comarca":"Limeira","fase":"Petição inicial","ativo":true,"ultimoAndamento":"2026-07-06","monitorar":true},{"id":"PR39","numero":"5687865-70.2026.8.26.0266","contratoId":"C66","cliente":"Fulano 69","tribunal":"TJSP","comarca":"Limeira","fase":"Execução","ativo":true,"ultimoAndamento":"2026-07-13","monitorar":true},{"id":"PR40","numero":"8503235-54.2026.8.26.0374","contratoId":"C67","cliente":"Fulano 10","tribunal":"TJSP","comarca":"São Paulo","fase":"Citação","ativo":true,"ultimoAndamento":"2026-06-27","monitorar":true},{"id":"PR41","numero":"4805841-70.2026.8.26.0202","contratoId":"","cliente":"Cliente avulso 1","tribunal":"TJSP","comarca":"São Paulo","fase":"Recurso","ativo":true,"ultimoAndamento":"2026-07-12","monitorar":true},{"id":"PR42","numero":"9044229-93.2026.8.26.0353","contratoId":"","cliente":"Cliente avulso 2","tribunal":"TJPR","comarca":"Americana","fase":"Citação","ativo":true,"ultimoAndamento":"2026-05-31","monitorar":true},{"id":"PR43","numero":"4344024-71.2026.8.26.0183","contratoId":"","cliente":"Cliente avulso 3","tribunal":"TJMG","comarca":"Limeira","fase":"Instrução","ativo":true,"ultimoAndamento":"2026-07-12","monitorar":true},{"id":"PR44","numero":"7641067-69.2026.8.26.0412","contratoId":"","cliente":"Cliente avulso 4","tribunal":"TJPR","comarca":"Americana","fase":"Contestação","ativo":true,"ultimoAndamento":"2026-07-07","monitorar":true},{"id":"PR45","numero":"3131350-13.2026.8.26.0155","contratoId":"","cliente":"Cliente avulso 5","tribunal":"TRT-2","comarca":"Santo André","fase":"Contestação","ativo":true,"ultimoAndamento":"2026-05-31","monitorar":true},{"id":"PR46","numero":"6878862-29.2026.8.26.0562","contratoId":"","cliente":"Cliente avulso 6","tribunal":"TRT-2","comarca":"São Paulo","fase":"Petição inicial","ativo":true,"ultimoAndamento":"2026-07-12","monitorar":true}],"radarRun":{"id":"RUN1","rodadaEm":"2026-07-15T06:00:00","processosVerificados":46,"resultados":[{"processoId":"PR1","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR2","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR3","status":"movimentou","qtd":3,"detalhe":""},{"processoId":"PR4","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR5","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR6","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR7","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR8","status":"movimentou","qtd":3,"detalhe":""},{"processoId":"PR9","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR10","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR11","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR12","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR13","status":"movimentou","qtd":1,"detalhe":""},{"processoId":"PR14","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR15","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR16","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR17","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR18","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR19","status":"movimentou","qtd":2,"detalhe":""},{"processoId":"PR20","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR21","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR22","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR23","status":"falhou","qtd":0,"detalhe":"Número não encontrado no sistema"},{"processoId":"PR24","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR25","status":"falhou","qtd":0,"detalhe":"Sessão expirada"},{"processoId":"PR26","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR27","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR28","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR29","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR30","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR31","status":"falhou","qtd":0,"detalhe":"Sessão expirada"},{"processoId":"PR32","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR33","status":"falhou","qtd":0,"detalhe":"Site do tribunal fora do ar"},{"processoId":"PR34","status":"falhou","qtd":0,"detalhe":"CAPTCHA não resolvido"},{"processoId":"PR35","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR36","status":"movimentou","qtd":1,"detalhe":""},{"processoId":"PR37","status":"movimentou","qtd":1,"detalhe":""},{"processoId":"PR38","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR39","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR40","status":"falhou","qtd":0,"detalhe":"CAPTCHA não resolvido"},{"processoId":"PR41","status":"falhou","qtd":0,"detalhe":"Site do tribunal fora do ar"},{"processoId":"PR42","status":"movimentou","qtd":1,"detalhe":""},{"processoId":"PR43","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR44","status":"sem_novidade","qtd":0,"detalhe":""},{"processoId":"PR45","status":"falhou","qtd":0,"detalhe":"CAPTCHA não resolvido"},{"processoId":"PR46","status":"movimentou","qtd":2,"detalhe":""}]},"radarMovs":[{"id":"MV1","processoId":"PR3","numero":"8275367-63.2026.8.26.0072","cliente":"Fulano 14","tipo":"Despacho","data":"2026-07-13","resumo":"Designada audiência de conciliação"},{"id":"MV2","processoId":"PR3","numero":"8275367-63.2026.8.26.0072","cliente":"Fulano 14","tipo":"Publicação de intimação","data":"2026-07-15","resumo":"Sentença de procedência parcial"},{"id":"MV3","processoId":"PR3","numero":"8275367-63.2026.8.26.0072","cliente":"Fulano 14","tipo":"Publicação de intimação","data":"2026-07-14","resumo":"Designada audiência de conciliação"},{"id":"MV4","processoId":"PR8","numero":"2634613-80.2026.8.26.0730","cliente":"Fulano 21","tipo":"Audiência designada","data":"2026-07-13","resumo":"Certidão de decurso de prazo"},{"id":"MV5","processoId":"PR8","numero":"2634613-80.2026.8.26.0730","cliente":"Fulano 21","tipo":"Certidão","data":"2026-07-14","resumo":"Decisão: defiro a produção de prova pericial"},{"id":"MV6","processoId":"PR8","numero":"2634613-80.2026.8.26.0730","cliente":"Fulano 21","tipo":"Certidão","data":"2026-07-12","resumo":"Intimação para manifestação em 15 dias"},{"id":"MV7","processoId":"PR13","numero":"9203439-63.2026.8.26.0041","cliente":"Fulano 25","tipo":"Juntada de documento","data":"2026-07-12","resumo":"Juntada de petição da parte contrária"},{"id":"MV8","processoId":"PR19","numero":"4660918-46.2026.8.26.0133","cliente":"Fulano 32","tipo":"Juntada de petição","data":"2026-07-14","resumo":"Designada audiência de conciliação"},{"id":"MV9","processoId":"PR19","numero":"4660918-46.2026.8.26.0133","cliente":"Fulano 32","tipo":"Conclusos para decisão","data":"2026-07-15","resumo":"Juntada de petição da parte contrária"},{"id":"MV10","processoId":"PR36","numero":"6967591-38.2026.8.26.0546","cliente":"Fulano 64","tipo":"Juntada de contestação","data":"2026-07-13","resumo":"Despacho: manifestem-se as partes"},{"id":"MV11","processoId":"PR37","numero":"4742018-88.2026.8.26.0831","cliente":"Fulano 67","tipo":"Juntada de contestação","data":"2026-07-15","resumo":"Designada audiência de conciliação"},{"id":"MV12","processoId":"PR42","numero":"9044229-93.2026.8.26.0353","cliente":"Cliente avulso 2","tipo":"Juntada de documento","data":"2026-07-14","resumo":"Juntada de petição da parte contrária"},{"id":"MV13","processoId":"PR46","numero":"6878862-29.2026.8.26.0562","cliente":"Cliente avulso 6","tipo":"Certidão","data":"2026-07-13","resumo":"Despacho: manifestem-se as partes"},{"id":"MV14","processoId":"PR46","numero":"6878862-29.2026.8.26.0562","cliente":"Cliente avulso 6","tipo":"Juntada de contestação","data":"2026-07-14","resumo":"Despacho: manifestem-se as partes"}],"radarHistorico":[{"data":"2026-06-03","verificados":44,"movimentaram":7,"falharam":2},{"data":"2026-06-10","verificados":46,"movimentaram":11,"falharam":4},{"data":"2026-06-17","verificados":43,"movimentaram":13,"falharam":0},{"data":"2026-06-24","verificados":43,"movimentaram":11,"falharam":4},{"data":"2026-07-01","verificados":44,"movimentaram":14,"falharam":0},{"data":"2026-07-08","verificados":46,"movimentaram":9,"falharam":0},{"data":"2026-07-15","verificados":46,"movimentaram":8,"falharam":8}]};

const C = {
  navy: "#1E2A56", navyDeep: "#151D3E", navySoft: "#2C3B6E", navyLine: "#33417A",
  gold: "#C9A24D", goldSoft: "#E6D2A0", goldPale: "#FDF7E8",
  paper: "#F5F6FA", line: "#E3E6EE", ink: "#1E2A56", inkSoft: "#79829C",
  green: "#1C7A4E", red: "#A8322D", amber: "#B07D18", calcBg: "#EEF0F6",
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

const STATUS = ["Proposta", "Ativo", "Aguardando êxito", "Encerrado", "Sem êxito"];
const STATUS_COR = { "Proposta": C.inkSoft, "Ativo": C.navy, "Aguardando êxito": C.amber, "Encerrado": C.green, "Sem êxito": C.red };
const TIPO_HONORARIO = ["Fixo único", "Fixo mensal", "Fixo parcelado", "Êxito puro", "Sucumbência", "Fixo + Êxito", "Êxito + Sucumbência", "Fixo + Êxito + Sucumbência"];
const TIPO_PARCELA = ["Inicial", "Mensal", "Êxito", "Sucumbência"];
const CAT_ENTRADA = ["Honorários", "Consultoria", "Outras entradas"];
const CAT_SAIDA = ["Custo fixo", "Custas processuais", "Infraestrutura", "Marketing", "Freelancer", "Restituição ao cliente", "Impostos", "Pró-labore", "Outras saídas"];
const FORMAS = ["PIX", "Boleto", "Transferência", "Cartão", "Dinheiro", "GRU", "DAS"];

const brl = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const brl2 = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v) => `${((v || 0) * 100).toFixed(0)}%`;
const compact = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`);
const mesDe = (s) => (s || "").slice(0, 7);
const rotMes = (m) => (m ? `${MESES_N[+m.slice(5, 7) - 1]}/${m.slice(2, 4)}` : "—");
const fmtData = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : "—");
const diasDesde = (s) => Math.floor((new Date(HOJE) - new Date(s)) / 86400000);
let _id = 9000; const nid = (p) => `${p}${++_id}`;

const VAZIO = { parceiros: [], contratos: [], parcelas: [], lancamentos: [], custosFixos: [], tarefas: [], params: { caixaInicial: 0, metaCaixa: 0, metaRecorrencia: 0, recorrenciaAtual: 0 } };
const importado = () => ({
  ...SEED, tarefas: [],
  processos: SEED.processos || [], radarRun: SEED.radarRun || null,
  radarMovs: SEED.radarMovs || [], radarHistorico: SEED.radarHistorico || [],
});

/* ══════════════════════  APP  ══════════════════════ */
export default function App() {
  const [db, setDb] = useState(importado());
  const [view, setView] = useState("painel");
  const [modal, setModal] = useState(null);
  const [cadeia, setCadeia] = useState(-1);
  const [flash, setFlash] = useState(null);
  const [banner, setBanner] = useState(true);

  const up = (k, fn) => setDb((p) => ({ ...p, [k]: fn(p[k]) }));
  const rodar = (msg) => {
    setFlash(msg); setCadeia(0);
    [1, 2, 3].forEach((i) => setTimeout(() => setCadeia(i), i * 300));
    setTimeout(() => setCadeia(-1), 2000);
    setTimeout(() => setFlash(null), 4000);
  };

  /* ── SENTIDO A: parcela confirmada → lançamento nasce ── */
  const receberParcela = (parcelaId, mesEfetivo = MES_ATUAL) => {
    const p = db.parcelas.find((x) => x.id === parcelaId);
    const ct = db.contratos.find((c) => c.id === p.contratoId);
    up("parcelas", (ps) => ps.map((x) => (x.id === parcelaId ? { ...x, recebido: true, mesEfetivo } : x)));
    up("lancamentos", (ls) => [...ls, {
      id: nid("L"), data: `${mesEfetivo}-15`, descricao: `${p.tipo} — ${ct?.cliente}`,
      tipo: "entrada", valor: p.valor, categoria: "Honorários", forma: "PIX", pago: true,
      contratoId: p.contratoId, obs: "", origem: "parcela", origemId: p.id,
    }]);
    rodar(`${p.tipo} de ${ct?.cliente} confirmada — entrada criada sozinha no caixa.`);
  };
  const estornarParcela = (parcelaId) => {
    up("parcelas", (ps) => ps.map((x) => (x.id === parcelaId ? { ...x, recebido: false, mesEfetivo: "" } : x)));
    up("lancamentos", (ls) => ls.filter((l) => !(l.origem === "parcela" && l.origemId === parcelaId)));
    rodar("Confirmação desfeita — a entrada saiu do caixa junto.");
  };

  /* ── SENTIDO B: lançamento avulso, podendo (ou não) quitar uma parcela ── */
  const addLancamento = (l, parcelaId) => {
    const novo = { ...l, id: nid("L"), origem: parcelaId ? "parcela" : "manual", origemId: parcelaId || "" };
    up("lancamentos", (ls) => [...ls, novo]);
    if (parcelaId) {
      up("parcelas", (ps) => ps.map((x) => (x.id === parcelaId ? { ...x, recebido: true, mesEfetivo: mesDe(l.data) } : x)));
      rodar(`Entrada lançada e a parcela vinculada foi dada como recebida — nos dois lugares, de uma vez.`);
    } else {
      rodar(`${l.tipo === "entrada" ? "Entrada" : "Saída"} avulsa de ${brl(l.valor)} — sem vínculo com contrato.`);
    }
  };

  /* ── custo fixo do mês → lançamento ── */
  const lancarFixo = (custoId, mes) => {
    const cf = db.custosFixos.find((x) => x.id === custoId);
    up("lancamentos", (ls) => [...ls, {
      id: nid("L"), data: `${mes}-${String(Math.min(cf.diaVenc, 28)).padStart(2, "0")}`,
      descricao: cf.descricao, tipo: "saida", valor: cf.valor, categoria: "Custo fixo",
      forma: "Boleto", pago: true, contratoId: "", obs: "", origem: "fixo", origemId: `${custoId}:${mes}`,
    }]);
    rodar(`${cf.descricao} de ${rotMes(mes)} lançado — caixa, DRE e balanço recalculados.`);
  };

  const fecharContrato = (contratoId, nParc) => {
    const ct = db.contratos.find((c) => c.id === contratoId);
    up("contratos", (cs) => cs.map((c) => (c.id === contratoId ? { ...c, status: "Ativo", dataFechamento: HOJE } : c)));
    if (ct.fixoTotal > 0 && nParc > 0) {
      const valor = +(ct.fixoTotal / nParc).toFixed(2);
      const base = +MES_ATUAL.slice(5, 7);
      const novas = Array.from({ length: nParc }, (_, i) => {
        const mm = base + i;
        return { id: nid("R"), contratoId, tipo: i === 0 ? "Inicial" : "Mensal", valor,
          mesEsperado: `${ANO + Math.floor((mm - 1) / 12)}-${String(((mm - 1) % 12) + 1).padStart(2, "0")}`,
          recebido: false, mesEfetivo: "", obs: "" };
      });
      up("parcelas", (ps) => [...ps, ...novas]);
      rodar(`${ct.cliente} fechou — ${nParc} parcelas entraram no a receber.`);
    } else rodar(`${ct.cliente} fechou.`);
  };

  /* ── RADAR: uma movimentação vira tarefa no "ClickUp" interno ── */
  const enviarParaTarefas = (mov) => {
    const jaExiste = db.tarefas.some((t) => t.origemMovId === mov.id);
    if (jaExiste) { rodar("Essa movimentação já virou tarefa."); return; }
    up("tarefas", (ts) => [...ts, {
      id: nid("T"),
      titulo: `Analisar: ${mov.tipo} — ${mov.resumo}`,
      contratoId: db.processos.find((p) => p.id === mov.processoId)?.contratoId || "",
      resp: "", prazo: HOJE, status: "aberta",
      origem: "radar", origemMovId: mov.id, processoNumero: mov.numero,
    }]);
    rodar(`Movimentação de ${mov.cliente} enviada para as tarefas do ClickUp interno.`);
  };

  /* manda TODAS as movimentações novas de uma vez */
  const enviarTodasParaTarefas = () => {
    const pendentes = (db.radarMovs || []).filter((mv) => !db.tarefas.some((t) => t.origemMovId === mv.id));
    if (!pendentes.length) { rodar("Todas as movimentações já viraram tarefa."); return; }
    up("tarefas", (ts) => [...ts, ...pendentes.map((mov) => ({
      id: nid("T"),
      titulo: `Analisar: ${mov.tipo} — ${mov.resumo}`,
      contratoId: db.processos.find((p) => p.id === mov.processoId)?.contratoId || "",
      resp: "", prazo: HOJE, status: "aberta",
      origem: "radar", origemMovId: mov.id, processoNumero: mov.numero,
    }))]);
    rodar(`${pendentes.length} movimentações viraram tarefa de uma vez.`);
  };

  /* simula rodar a automação de novo — redistribui os resultados */
  const rodarVerificacao = () => {
    const procs = db.processos.filter((p) => p.monitorar && p.ativo);
    const tiposMov = ["Juntada de petição", "Decisão interlocutória", "Despacho", "Publicação de intimação", "Audiência designada", "Sentença proferida"];
    const resumos = ["Intimação para manifestação em 15 dias", "Juntada de petição da parte contrária", "Decisão: defiro prova pericial", "Designada audiência", "Sentença de procedência parcial", "Certidão de decurso de prazo"];
    const falhas = ["Timeout na consulta ao tribunal", "CAPTCHA não resolvido", "Site do tribunal fora do ar", "Sessão expirada"];
    const resultados = [], movs = [];
    let k = 0;
    procs.forEach((p) => {
      const r = Math.random();
      if (r < 0.28) {
        const n = 1 + Math.floor(Math.random() * 2);
        for (let x = 0; x < n; x++) {
          k++;
          movs.push({ id: nid("MV"), processoId: p.id, numero: p.numero, cliente: p.cliente,
            tipo: tiposMov[Math.floor(Math.random() * tiposMov.length)], data: HOJE,
            resumo: resumos[Math.floor(Math.random() * resumos.length)] });
        }
        resultados.push({ processoId: p.id, status: "movimentou", qtd: n, detalhe: "" });
      } else if (r < 0.88) {
        resultados.push({ processoId: p.id, status: "sem_novidade", qtd: 0, detalhe: "" });
      } else {
        resultados.push({ processoId: p.id, status: "falhou", qtd: 0, detalhe: falhas[Math.floor(Math.random() * falhas.length)] });
      }
    });
    const mov = resultados.filter((r) => r.status === "movimentou").length;
    const fal = resultados.filter((r) => r.status === "falhou").length;
    setDb((prev) => ({
      ...prev,
      radarRun: { id: nid("RUN"), rodadaEm: HOJE + "T06:00:00", processosVerificados: procs.length, resultados },
      radarMovs: movs,
      radarHistorico: [...(prev.radarHistorico || []), { data: HOJE, verificados: procs.length, movimentaram: mov, falharam: fal }].slice(-10),
    }));
    rodar(`Verificação concluída: ${mov} com movimentação, ${fal} falharam.`);
  };

  /* ═══════════  MOTOR  ═══════════ */
  const m = useMemo(() => {
    const { lancamentos: L, contratos: CT, parcelas: PC, custosFixos: CF, params } = db;
    const pagos = L.filter((l) => l.pago);
    const soma = (a) => a.reduce((s, x) => s + x.valor, 0);
    const noMes = (mes, tipo) => soma(pagos.filter((l) => mesDe(l.data) === mes && l.tipo === tipo));

    const caixa = params.caixaInicial + pagos.reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0);
    const fatAtual = noMes(MES_ATUAL, "entrada");
    const fatAnt = noMes("2026-06", "entrada");
    const gastoAtual = noMes(MES_ATUAL, "saida");

    const porContrato = {};
    CT.forEach((c) => {
      const ps = PC.filter((p) => p.contratoId === c.id);
      const receb = soma(ps.filter((p) => p.recebido));
      const eT = (c.valorCausa || 0) * (c.pctExito || 0);
      const sT = (c.valorCausa || 0) * (c.pctSucumb || 0);
      const q = c.pctQuota || 0;
      porContrato[c.id] = { parcelas: ps, fixoRecebido: receb, fixoPendente: Math.max((c.fixoTotal || 0) - receb, 0),
        exitoTotal: eT, sucumbTotal: sT, exitoParceiro: eT * q, exitoEscritorio: eT * (1 - q),
        sucumbParceiro: sT * q, sucumbEscritorio: sT * (1 - q) };
    });

    const ativos = CT.filter((c) => ["Ativo", "Aguardando êxito"].includes(c.status));
    const propostas = CT.filter((c) => c.status === "Proposta");
    const comProposta = CT.filter((c) => c.dataProposta);
    const fechados = CT.filter((c) => c.dataFechamento);
    const conversao = comProposta.length ? Math.round((fechados.length / comProposta.length) * 100) : 0;
    const fechadosMes = CT.filter((c) => mesDe(c.dataFechamento) === MES_ATUAL).length;
    const propostasMes = CT.filter((c) => mesDe(c.dataProposta) === MES_ATUAL).length;

    const aberto = PC.filter((p) => !p.recebido);
    const atrasadas = aberto.filter((p) => p.mesEsperado && p.mesEsperado < MES_ATUAL)
      .map((p) => ({ ...p, contrato: CT.find((c) => c.id === p.contratoId) }));
    const inadimp = soma(atrasadas);
    const aReceber = soma(aberto.filter((p) => p.mesEsperado >= MES_ATUAL));
    const exitoProjEscritorio = ativos.reduce((s, c) => s + porContrato[c.id].exitoEscritorio + porContrato[c.id].sucumbEscritorio, 0);
    const exitoProjParceiro = ativos.reduce((s, c) => s + porContrato[c.id].exitoParceiro + porContrato[c.id].sucumbParceiro, 0);
    const fixoPendenteTotal = ativos.reduce((s, c) => s + porContrato[c.id].fixoPendente, 0);
    const receitaRealizada = soma(pagos.filter((l) => l.tipo === "entrada"));

    const mesN = +MES_ATUAL.slice(5, 7);
    const vigentes = CF.filter((f) => f.recorrente && f.mesInicio <= mesN && (f.mesFim || 12) >= mesN);
    const fixosDoMes = vigentes.map((f) => ({ ...f, lancado: L.some((l) => l.origem === "fixo" && l.origemId === `${f.id}:${MES_ATUAL}`) }));
    const custoFixoMensal = vigentes.reduce((s, f) => s + f.valor, 0);

    const porCat = {};
    pagos.filter((l) => l.tipo === "saida" && mesDe(l.data) === MES_ATUAL)
      .forEach((l) => { porCat[l.categoria] = (porCat[l.categoria] || 0) + l.valor; });
    const gastosCat = Object.entries(porCat).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
    const restit = pagos.filter((l) => l.categoria === "Restituição ao cliente" && mesDe(l.data) === MES_ATUAL);

    const rec = fatAtual;
    const diretos = soma(pagos.filter((l) => l.tipo === "saida" && mesDe(l.data) === MES_ATUAL && ["Custas processuais", "Restituição ao cliente"].includes(l.categoria)));
    const despOp = gastoAtual - diretos;
    const resultado = rec - diretos - despOp;
    const margem = rec ? Math.round((resultado / rec) * 100) : 0;

    let acc = params.caixaInicial;
    const serie = MESES.map((mm) => {
      const e = noMes(mm, "entrada"), s = noMes(mm, "saida");
      acc += e - s;
      return { mes: MESES_N[+mm.slice(5, 7) - 1], caixa: +acc.toFixed(2), entrada: e, saida: s, resultado: e - s };
    });

    const previstos = soma(L.filter((l) => !l.pago && l.tipo === "saida"));
    const aPagarPendente = L.filter((l) => !l.pago);
    const ativoTotal = caixa + aReceber + inadimp;
    const pl = ativoTotal - previstos;

    // por parceiro — ninguém fica de fora
    const porParceiro = db.parceiros.map((p) => {
      const cs = CT.filter((c) => c.parceiroId === p.id);
      const at = cs.filter((c) => ["Ativo", "Aguardando êxito"].includes(c.status));
      const en = cs.filter((c) => c.status === "Encerrado");
      const realizada = en.reduce((s, c) => s + (porContrato[c.id]?.fixoRecebido || c.fixoTotal || 0), 0);
      return { ...p, total: cs.length, ativos: at.length, encerrados: en.length,
        realizada, ticket: en.length ? realizada / en.length : 0,
        proj: at.reduce((s, c) => s + porContrato[c.id].exitoEscritorio + porContrato[c.id].sucumbEscritorio, 0) };
    }).sort((a, b) => b.total - a.total);
    const semParceiro = CT.filter((c) => !c.parceiroId).length;

    return { caixa, fatAtual, fatAnt, gastoAtual, porContrato, ativos, propostas, conversao,
      fechadosMes, propostasMes, atrasadas, inadimp, aReceber, exitoProjEscritorio, exitoProjParceiro,
      fixoPendenteTotal, receitaRealizada, fixosDoMes, custoFixoMensal, gastosCat, restit,
      rec, diretos, despOp, resultado, margem, serie, previstos, aPagarPendente, ativoTotal, pl,
      metaPct: params.metaCaixa ? Math.min(caixa / params.metaCaixa, 1) : 0,
      mesesReserva: custoFixoMensal ? caixa / custoFixoMensal : 0,
      pctRecorrente: fatAtual ? params.recorrenciaAtual / fatAtual : 0,
      porParceiro, semParceiro };
  }, [db]);

  const NAV = [
    { g: "PAINEL", itens: [{ k: "painel", n: "Painel" }, { k: "importacao", n: "Importação" }] },
    { g: "CONTRATOS", itens: [{ k: "contratos", n: "Contratos" }, { k: "parcelas", n: "Parcelas" }, { k: "parceiros", n: "Parceiros" }] },
    { g: "RADAR", itens: [{ k: "radar", n: "Radar processual" }] },
    { g: "FINANCEIRO", itens: [{ k: "lancamentos", n: "Lançamentos" }, { k: "fixos", n: "Custos fixos" }, { k: "fluxo", n: "Fluxo de caixa" }, { k: "dre", n: "DRE" }, { k: "balanco", n: "Balanço" }] },
    { g: "OPERAÇÃO", itens: [{ k: "tarefas", n: "Tarefas" }, { k: "ajustes", n: "Ajustes" }] },
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
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside style={{ width: 200, background: C.navyDeep, color: "#fff", padding: "22px 0", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <div style={{ padding: "0 18px 18px", borderBottom: `1px solid ${C.navyLine}` }}>
            <div style={{ fontFamily: S.display, fontSize: 19, letterSpacing: ".06em", fontWeight: 700 }}>PAVAGEAU</div>
            <div style={{ fontSize: 8.5, letterSpacing: ".2em", color: C.gold, marginTop: 3 }}>SISTEMA INTEGRADO</div>
          </div>
          <nav style={{ padding: "12px 0", flex: 1 }}>
            {NAV.map((grupo) => (
              <div key={grupo.g} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, letterSpacing: ".2em", color: "#5F6A8C", padding: "6px 18px 2px", fontWeight: 600 }}>{grupo.g}</div>
                {grupo.itens.map((it) => {
                  const on = view === it.k;
                  return (
                    <button key={it.k} onClick={() => setView(it.k)} className="navitem" style={{
                      display: "block", width: "100%", padding: "7px 18px", textAlign: "left",
                      background: on ? C.navySoft : "transparent", border: "none",
                      borderLeft: `2px solid ${on ? C.gold : "transparent"}`,
                      color: on ? "#fff" : "#A9B2CC", fontSize: 12.5, fontFamily: S.body, cursor: "pointer",
                    }}>{it.n}</button>
                  );
                })}
              </div>
            ))}
          </nav>
          <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.navyLine}`, fontSize: 9.5, color: "#7C86A6", lineHeight: 1.6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: C.green }} />
              histórico importado
            </div>
            {db.contratos.length} contratos · {db.parcelas.length} parcelas<br />{db.lancamentos.length} lançamentos
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          <header style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "15px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
            <div>
              <div style={{ fontSize: 8.5, letterSpacing: ".2em", color: C.gold, fontWeight: 600 }}>JULHO DE 2026</div>
              <h1 style={{ fontFamily: S.display, fontSize: 23, margin: "2px 0 0", fontWeight: 700 }}>{TITULO}</h1>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <button onClick={() => setModal({ t: "contrato" })} className="btn" style={btnGhost}>+ Contrato</button>
              <button onClick={() => setModal({ t: "lancamento" })} className="btn" style={btnSolid}>+ Entrada / Saída</button>
            </div>
          </header>

          <Cadeia ativo={cadeia} flash={flash} />

          {banner && (
            <div style={{ background: C.goldPale, borderBottom: `1px solid ${C.gold}55`, padding: "9px 26px", display: "flex", alignItems: "center", gap: 10, fontSize: 11.5 }}>
              <span style={{ color: C.amber, fontWeight: 600, fontSize: 9, letterSpacing: ".12em" }}>MODELO</span>
              <span style={{ color: C.ink, flex: 1 }}>
                Estrutura real das suas planilhas. <b>Os valores em R$ vêm mascarados no arquivo modelo</b> (faixa 1–10) —
                por isso os números parecem pequenos. Troque pelo arquivo real e tudo se recalcula.
              </span>
              <button onClick={() => setView("importacao")} style={linkBtn}>ver o que foi importado</button>
              <button onClick={() => setBanner(false)} style={{ ...linkBtn, color: C.inkSoft }}>fechar</button>
            </div>
          )}

          <div style={{ padding: "18px 26px 60px" }}>
            {view === "painel" && <Painel db={db} m={m} goto={setView} />}
            {view === "importacao" && <Importacao db={db} m={m} />}
            {view === "contratos" && <Contratos db={db} m={m} setModal={setModal} />}
            {view === "parcelas" && <Parcelas db={db} m={m} receber={receberParcela} estornar={estornarParcela} />}
            {view === "parceiros" && <Parceiros db={db} m={m} up={up} />}
            {view === "lancamentos" && <Lancamentos db={db} setModal={setModal} />}
            {view === "fixos" && <Fixos db={db} m={m} lancar={lancarFixo} setModal={setModal} up={up} />}
            {view === "fluxo" && <Fluxo db={db} m={m} />}
            {view === "dre" && <DRE m={m} />}
            {view === "balanco" && <Balanco m={m} />}
            {view === "radar" && <Radar db={db} up={up} setModal={setModal} enviarParaTarefas={enviarParaTarefas} enviarTodas={enviarTodasParaTarefas} rodarVerificacao={rodarVerificacao} />}
            {view === "tarefas" && <Tarefas db={db} up={up} setModal={setModal} />}
            {view === "ajustes" && <Ajustes db={db} up={up} setDb={setDb} rodar={rodar} />}
          </div>
        </main>
      </div>

      {modal?.t === "lancamento" && <MLancamento db={db} onClose={() => setModal(null)} onSave={addLancamento} />}
      {modal?.t === "contrato" && <MContrato db={db} onClose={() => setModal(null)} onSave={(c) => up("contratos", (cs) => [...cs, { ...c, id: nid("C") }])} />}
      {modal?.t === "parcela" && <MParcela db={db} contratoId={modal.contratoId} onClose={() => setModal(null)} onSave={(p) => up("parcelas", (ps) => [...ps, { ...p, id: nid("R") }])} />}
      {modal?.t === "fixo" && <MFixo onClose={() => setModal(null)} onSave={(f) => up("custosFixos", (fs) => [...fs, { ...f, id: nid("F") }])} />}
      {modal?.t === "tarefa" && <MTarefa db={db} onClose={() => setModal(null)} onSave={(t) => up("tarefas", (ts) => [...ts, { ...t, id: nid("T"), status: "aberta" }])} />}
      {modal?.t === "fecharContrato" && <MFechar contrato={db.contratos.find((c) => c.id === modal.id)} onClose={() => setModal(null)} onSave={(n) => { fecharContrato(modal.id, n); setModal(null); }} />}
      {modal?.t === "processo" && <MProcesso db={db} onClose={() => setModal(null)} onSave={(p) => up("processos", (ps) => [...ps, { ...p, id: nid("PR") }])} />}
    </div>
  );
}

/* ══════════  CADEIA  ══════════ */
function Cadeia({ ativo, flash }) {
  const et = ["Lançamento", "Fluxo de caixa", "DRE", "Balanço"];
  return (
    <div style={{ background: C.navy, padding: "7px 26px", display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap", minHeight: 38 }}>
      <span style={{ fontSize: 8, letterSpacing: ".18em", color: "#8B96BC", fontWeight: 600 }}>CADEIA</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {et.map((e, i) => (
          <React.Fragment key={e}>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 2,
              background: ativo === i ? C.gold : "transparent",
              color: ativo === i ? C.navyDeep : ativo > i ? C.goldSoft : "#7A85AB",
              fontWeight: ativo === i ? 600 : 400,
              border: `1px solid ${ativo >= i && ativo >= 0 ? C.gold : "#3B4778"}`,
              animation: ativo === i ? "pulseGold .6s ease-out" : "none", transition: "all .2s" }}>{e}</span>
            {i < 3 && <span style={{ color: ativo > i ? C.gold : "#4A5588", fontSize: 10 }}>→</span>}
          </React.Fragment>
        ))}
      </div>
      {flash && <span style={{ fontSize: 10.5, color: C.goldSoft, animation: "slideUp .3s ease" }}>{flash}</span>}
    </div>
  );
}

/* ══════════  IMPORTAÇÃO  ══════════ */
function Importacao({ db, m }) {
  const orfaos = db.contratos.filter((c) => (c.obs || "").startsWith("⚠"));
  const conserto = [
    ["Status", "7 grafias → 5", "'Aguardando êxito' (47) e 'Aguardando exito' (14) eram o mesmo status. O COUNTIF só via uma."],
    ["Tipo de honorário", "15 grafias → 8", "'Êxito puro'/'Exito puro', 'Fixo + Exito'/'Fixo + Êxito', 'Sucumbencia'/'Sucumbência'…"],
    ["Parceiros", "6 cadastrados", "Eliton Vilalta tinha 4 contratos e não existia em nenhuma tabela do painel."],
    ["Clientes órfãos", `${orfaos.length} recuperados`, "Tinham parcelas na aba MENSAIS mas nenhuma linha em CONTRATOS. Estavam invisíveis."],
    ["Caixa", "recalculado", "FEV, ABR, MAI, JUN e JUL tinham o caixa digitado por cima da fórmula. Aqui não há onde digitar."],
    ["Custos fixos", "vigência com fim", "A planilha só tinha 'mês início' — o custo nunca terminava."],
  ];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9, marginBottom: 12 }}>
        <KPI r="Contratos" v={db.contratos.length} n="CONTRATOS + ENCERRADOS + PENDENTES + órfãos" c={C.navy} />
        <KPI r="Parcelas" v={db.parcelas.length} n="da aba MENSAIS" c={C.gold} />
        <KPI r="Lançamentos" v={db.lancamentos.length} n="das abas JAN a JUL" c={C.green} />
        <KPI r="Custos fixos" v={db.custosFixos.length} n="da aba CONFIG" c={C.amber} />
        <KPI r="Parceiros" v={db.parceiros.length} n="nenhum órfão" c={C.navy} />
      </div>

      <Card t="O que a importação consertou" s="Cada linha aqui é um número que a planilha estava errando em silêncio.">
        <table style={tbl}>
          <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
            {["Campo", "Antes → depois", "O que estava acontecendo"].map((h) => <th key={h} style={{ ...th, textAlign: "left" }}>{h.toUpperCase()}</th>)}
          </tr></thead>
          <tbody>
            {conserto.map(([a, b, c]) => (
              <tr key={a} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                <td style={{ ...td, fontWeight: 600, whiteSpace: "nowrap" }}>{a}</td>
                <td style={{ ...td, fontFamily: S.mono, fontSize: 11.5, color: C.amber, fontWeight: 600, whiteSpace: "nowrap" }}>{b}</td>
                <td style={{ ...td, color: C.inkSoft, fontSize: 12 }}>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {orfaos.length > 0 && (
        <>
          <div style={{ height: 12 }} />
          <Card t="Clientes que estavam invisíveis" s="Tinham parcelas em MENSAIS e nenhuma linha em CONTRATOS. Nenhum painel os enxergava.">
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
              {orfaos.map((c) => (
                <div key={c.id} style={{ border: `1px solid ${C.gold}`, background: C.goldPale, padding: "9px 12px", minWidth: 150 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.cliente}</div>
                  <div style={{ fontSize: 10.5, color: C.inkSoft }}>
                    {m.porContrato[c.id]?.parcelas.length || 0} parcelas · {brl2(c.fixoTotal)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <div style={{ height: 12 }} />
      <Card t="Origem de cada tabela" s="De onde veio cada coisa — e o que passou a ser calculado.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 12 }}>
          <div>
            <Titulo t="✏️ IMPORTADO (você preenche)" />
            {[["Contratos", "CONTRATOS · ENCERRADOS · PENDENTES"], ["Parcelas", "MENSAIS"], ["Lançamentos", "JAN…DEZ (bloco variável)"], ["Custos fixos", "CONFIG"], ["Parâmetros", "CONFIG (topo)"], ["Parceiros", "coluna PARCEIRO"]].map(([a, b]) => (
              <Linha key={a} l={a} v={<span style={{ fontSize: 11, color: C.inkSoft, fontFamily: S.body }}>{b}</span>} />
            ))}
          </div>
          <div>
            <Titulo t="🔒 AGORA CALCULADO (sem campo)" />
            {["Caixa anterior e atual", "Fixo recebido e pendente", "Êxito e sucumbência projetados", "Inadimplência", "Conversão e ticket médio", "DRE, balanço e margem"].map((x) => (
              <Linha key={x} l={<span style={{ color: C.inkSoft }}>{x}</span>} v={<span style={{ color: C.green, fontSize: 11 }}>🔒</span>} />
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

/* ══════════  PAINEL  ══════════ */
function Painel({ db, m, goto }) {
  const delta = m.fatAnt ? Math.round(((m.fatAtual - m.fatAnt) / m.fatAnt) * 100) : 0;
  const abertas = db.tarefas.filter((t) => t.status === "aberta");
  const urgentes = abertas.filter((t) => t.prazo <= HOJE);
  return (
    <>
      <Faixa n="Como estou" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 9, marginBottom: 24 }}>
        <KPI r="Caixa hoje" v={brl2(m.caixa)} n={`${pct(m.metaPct)} da meta de ${brl2(db.params.metaCaixa)}`} c={C.navy} />
        <KPI r="Faturamento do mês" v={brl2(m.fatAtual)} n={m.fatAnt ? `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}% vs ${brl2(m.fatAnt)}` : "sem base"} c={delta >= 0 ? C.green : C.red} />
        <KPI r="A receber" v={brl2(m.aReceber)} n={`+ ${brl2(m.exitoProjEscritorio)} projetado (seu)`} c={C.gold} />
        <KPI r="Inadimplência" v={brl2(m.inadimp)} n={`${m.atrasadas.length} parcelas em atraso`} c={m.inadimp ? C.red : C.green} d={!!m.inadimp} />
      </div>

      {db.radarRun && (() => {
        const res = db.radarRun.resultados;
        const mov = res.filter((r) => r.status === "movimentou").length;
        const fal = res.filter((r) => r.status === "falhou").length;
        const pend = (db.radarMovs || []).filter((mv) => !db.tarefas.some((t) => t.origemMovId === mv.id)).length;
        return (
          <div onClick={() => goto("radar")} className="card" style={{ cursor: "pointer", background: "#fff", border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.gold}`, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 8.5, letterSpacing: ".16em", color: C.gold, fontWeight: 600 }}>RADAR PROCESSUAL · ÚLTIMA RODADA</div>
              <div style={{ fontSize: 12.5, color: C.ink, marginTop: 3 }}>
                <b>{mov}</b> processos movimentaram, <b>{fal}</b> falharam de {db.radarRun.processosVerificados} verificados
              </div>
            </div>
            {pend > 0 && <span style={{ fontFamily: S.mono, fontSize: 11, fontWeight: 600, color: C.navyDeep, background: C.goldSoft, padding: "5px 10px", borderRadius: 2 }}>{pend} para virar tarefa →</span>}
          </div>
        );
      })()}

      <Faixa n="O que exige ação hoje" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 24 }}>
        <Card t="Parcelas em atraso" a={{ t: "Ver parcelas", f: () => goto("parcelas") }}>
          {m.atrasadas.slice(0, 6).map((p) => (
            <div key={p.id} className="row" style={linhaFlex}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.contrato?.cliente}</div>
                <div style={{ fontSize: 10.5, color: C.inkSoft }}>{p.tipo} · esperada em {rotMes(p.mesEsperado)}</div>
              </div>
              <span style={{ fontFamily: S.mono, fontSize: 12.5, fontWeight: 600, color: C.red }}>{brl2(p.valor)}</span>
            </div>
          ))}
          {m.atrasadas.length > 6 && <Rodape>+ {m.atrasadas.length - 6} outras · {brl2(m.inadimp)} no total</Rodape>}
          {!m.atrasadas.length && <Vazio t="Carteira em dia." />}
        </Card>
        <Card t="Tarefas" a={{ t: "Ver todas", f: () => goto("tarefas") }}>
          {urgentes.map((t) => (
            <div key={t.id} className="row" style={linhaFlex}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{t.titulo}</div>
                <div style={{ fontSize: 10.5, color: C.inkSoft }}>{db.contratos.find((c) => c.id === t.contratoId)?.cliente || "—"} · {t.resp}</div>
              </div>
              <span style={{ fontFamily: S.mono, fontSize: 10, fontWeight: 600, color: t.prazo < HOJE ? C.red : C.amber }}>
                {t.prazo < HOJE ? `${diasDesde(t.prazo)}d` : "hoje"}
              </span>
            </div>
          ))}
          {!urgentes.length && <Vazio t="Nenhuma tarefa cadastrada ainda." />}
        </Card>
      </div>

      <Faixa n="Análises do mês — recalculadas a cada lançamento" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 9 }}>
        <Card t="Gastos e categorias" s="Cada despesa classificada">
          {m.gastosCat.length ? (<>
            <div style={{ height: 185, marginTop: 6 }}>
              <ResponsiveContainer>
                <BarChart data={m.gastosCat} layout="vertical" margin={{ left: 4, right: 24 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="nome" width={122} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: C.ink, fontFamily: S.body }} />
                  <Tooltip formatter={(v) => brl2(v)} cursor={{ fill: "#F0F2F7" }} contentStyle={tipStyle} />
                  <Bar dataKey="valor" radius={[0, 2, 2, 0]} barSize={12}>
                    {m.gastosCat.map((g, i) => <Cell key={i} fill={g.nome === "Restituição ao cliente" ? C.gold : C.navy} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Rodape>Total <b style={{ fontFamily: S.mono }}>{brl2(m.gastoAtual)}</b> · maior peso: <b>{m.gastosCat[0]?.nome}</b></Rodape>
          </>) : <Vazio t="Nenhuma saída neste mês." />}
        </Card>
        <Card t="Clientes fechados" s="Quantas propostas viraram contrato">
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, margin: "12px 0 6px" }}>
            <span style={{ fontFamily: S.display, fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{m.conversao}%</span>
            <span style={{ fontSize: 12, color: C.inkSoft }}>de conversão</span>
          </div>
          <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: C.line, margin: "8px 0 12px" }}>
            <div style={{ width: `${m.conversao}%`, background: C.navy }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, textAlign: "center" }}>
            <Mini n={m.ativos.length} l="contratos ativos" />
            <Mini n={db.contratos.filter((c) => c.status === "Encerrado").length} l="encerrados" c={C.green} />
            <Mini n={m.propostas.length} l="propostas em aberto" c={C.gold} />
          </div>
          <Rodape>Em aberto: {m.propostas.map((c) => c.cliente).join(" · ") || "—"}</Rodape>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 24 }}>
        <Card t="Restituições" s="Valores pagos ao processo a devolver ao cliente">
          <div style={{ fontFamily: S.display, fontSize: 30, fontWeight: 700, margin: "10px 0 10px" }}>
            {brl2(m.restit.reduce((s, l) => s + l.valor, 0))}
          </div>
          {m.restit.map((l) => (
            <div key={l.id} className="row" style={{ ...linhaFlex, fontSize: 12 }}>
              <span>{l.descricao}</span>
              <span style={{ fontFamily: S.mono, fontWeight: 600 }}>{brl2(l.valor)}</span>
            </div>
          ))}
          {!m.restit.length && <Vazio t="Nenhuma restituição neste mês." />}
        </Card>
        <Card t="Inadimplência" s="Parcelas em atraso, evidenciadas automaticamente">
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, margin: "10px 0 12px" }}>
            <span style={{ fontFamily: S.display, fontSize: 30, fontWeight: 700, color: m.inadimp ? C.red : C.green }}>{brl2(m.inadimp)}</span>
            <span style={{ fontSize: 11, color: C.inkSoft }}>{(m.inadimp / (m.aReceber + m.inadimp || 1) * 100).toFixed(1)}% da carteira</span>
          </div>
          {m.atrasadas.slice(0, 5).map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${C.line}` }}>
              <span>{p.contrato?.cliente} · {p.tipo} · {rotMes(p.mesEsperado)}</span>
              <span style={{ fontFamily: S.mono, fontWeight: 600 }}>{brl2(p.valor)}</span>
            </div>
          ))}
          {m.atrasadas.length > 5 && <Rodape>+ {m.atrasadas.length - 5} outras parcelas em atraso</Rodape>}
          {!m.atrasadas.length && <Vazio t="Carteira em dia." />}
        </Card>
      </div>

      <Faixa n="Para onde vou" />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 9 }}>
        <Card t={`Caixa — ${ANO}`} s="Encadeado de jan a dez. Sem constante digitada no meio.">
          <div style={{ height: 205, marginTop: 8 }}>
            <ResponsiveContainer>
              <LineChart data={m.serie}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: C.line }} tick={{ fontSize: 10, fill: C.inkSoft, fontFamily: S.body }} />
                <YAxis tickFormatter={compact} tickLine={false} axisLine={false} tick={{ fontSize: 9.5, fill: C.inkSoft, fontFamily: S.mono }} />
                <Tooltip formatter={(v) => brl2(v)} contentStyle={tipStyle} />
                <Line type="monotone" dataKey="caixa" stroke={C.navy} strokeWidth={2.5} dot={{ r: 2.5, fill: C.navy }} activeDot={{ r: 5, fill: C.gold }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card t="Saúde" s="Os números que a planilha travava">
          <div style={{ marginTop: 8 }}>
            <Linha l="Custo fixo mensal" v={brl2(m.custoFixoMensal)} />
            <Linha l="Meses de reserva" v={m.mesesReserva.toFixed(1)} />
            <Linha l="Recorrência atual" v={brl2(db.params.recorrenciaAtual)} />
            <Linha l="% receita recorrente" v={pct(m.pctRecorrente)} />
            <Linha l="Falta para a meta" v={brl2(Math.max(db.params.metaCaixa - m.caixa, 0))} forte />
          </div>
          <Rodape>Todos seguem o mês corrente — nenhum travado em janeiro ou junho.</Rodape>
        </Card>
      </div>
    </>
  );
}

/* ══════════  PARCEIROS  ══════════ */
function Parceiros({ db, m, up }) {
  const [novo, setNovo] = useState("");
  return (
    <Card t="Clientes por origem — conversão e receita" s="Lista fechada. Todo contrato tem um parceiro, e todo parceiro aparece aqui.">
      <table style={tbl}>
        <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
          {["Parceiro", "Contratos", "Ativos", "Encerrados", "Ticket médio", "Receita realizada", "Projetado (seu)", ""].map((h, i) => (
            <th key={h + i} style={{ ...th, textAlign: i > 0 && i < 7 ? "right" : "left" }}>{h.toUpperCase()}</th>
          ))}
        </tr></thead>
        <tbody>
          {m.porParceiro.map((p) => (
            <tr key={p.id} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
              <td style={{ ...td, fontWeight: 600 }}>{p.nome}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: S.mono }}>{p.total}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.navy }}>{p.ativos}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.green }}>{p.encerrados}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: S.mono }}>{p.encerrados ? brl2(p.ticket) : "—"}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600, color: C.green }}>{brl2(p.realizada)}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.amber }}>{brl2(p.proj)}</td>
              <td style={{ ...td, textAlign: "right" }}>
                {!p.total && <button onClick={() => up("parceiros", (ps) => ps.filter((x) => x.id !== p.id))} style={linkBtn}>remover</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 6, marginTop: 14, maxWidth: 380 }}>
        <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Novo parceiro / origem" style={{ ...campo, flex: 1 }} />
        <button className="btn" style={btnSolid} disabled={!novo.trim()}
          onClick={() => { up("parceiros", (ps) => [...ps, { id: nid("P"), nome: novo.trim() }]); setNovo(""); }}>Adicionar</button>
      </div>
      <Rodape>
        {m.semParceiro > 0 ? <>⚠ {m.semParceiro} contratos sem parceiro definido. </> : null}
        Na planilha, o <b>Eliton Vilalta</b> tinha 4 contratos e não aparecia em tabela nenhuma — nem em "Outros".
        Aqui a lista é a mesma que alimenta o cadastro: não dá para haver um parceiro que o painel não conheça.
      </Rodape>
    </Card>
  );
}

/* ══════════  CONTRATOS  ══════════ */
function Contratos({ db, m, setModal }) {
  const [f, setF] = useState("todos");
  const [q, setQ] = useState("");
  const [n, setN] = useState(12);
  const lista = db.contratos
    .filter((c) => (f === "todos" || c.status === f) && (!q || c.cliente.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <Card t="Ciclo do cliente" s="Uma tabela, cinco status. Sem recortar e colar entre abas.">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUS.length},1fr)`, gap: 7, marginTop: 12 }}>
          {STATUS.map((s) => {
            const g = db.contratos.filter((c) => c.status === s);
            return (
              <button key={s} onClick={() => { setF(f === s ? "todos" : s); setN(12); }} style={{
                background: f === s ? C.paper : "#fff", border: `1px solid ${f === s ? STATUS_COR[s] : C.line}`,
                borderTop: `2.5px solid ${STATUS_COR[s]}`, padding: "9px 11px", cursor: "pointer", textAlign: "left", fontFamily: S.body,
              }}>
                <div style={{ fontSize: 9, letterSpacing: ".06em", color: STATUS_COR[s], fontWeight: 600 }}>{s.toUpperCase()}</div>
                <div style={{ fontFamily: S.display, fontSize: 22, fontWeight: 700, marginTop: 2 }}>{g.length}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 9px" }}>
        <Faixa n={`${lista.length} contratos${f !== "todos" ? ` · ${f}` : ""}`} />
        <input value={q} onChange={(e) => { setQ(e.target.value); setN(12); }} placeholder="Buscar cliente…" style={{ ...campo, width: 180 }} />
        <button onClick={() => setModal({ t: "contrato" })} className="btn" style={{ ...btnGhost, whiteSpace: "nowrap" }}>+ Contrato</button>
      </div>

      {lista.slice(0, n).map((c) => {
        const d = m.porContrato[c.id];
        const parceiro = db.parceiros.find((p) => p.id === c.parceiroId);
        const alerta = (c.obs || "").startsWith("⚠");
        return (
          <div key={c.id} className="card" style={{ background: "#fff", border: `1px solid ${alerta ? C.gold : C.line}`, borderLeft: `2.5px solid ${STATUS_COR[c.status]}`, padding: "13px 15px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: S.display, fontSize: 16, fontWeight: 700 }}>{c.cliente}</span>
                  <Tag c={STATUS_COR[c.status]}>{c.status}</Tag>
                  <Tag c={C.inkSoft}>{c.tipoHonorario}</Tag>
                  {parceiro && <Tag c={C.gold}>{parceiro.nome}</Tag>}
                </div>
                <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 2, fontFamily: S.mono }}>
                  {c.processo || "sem processo"}{c.splitNick && ` · split ${c.splitNick}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                <button onClick={() => setModal({ t: "parcela", contratoId: c.id })} className="btn" style={btnGhost}>+ Parcela</button>
                {c.status === "Proposta" && <button onClick={() => setModal({ t: "fecharContrato", id: c.id })} className="btn" style={btnGold}>Registrar fechamento</button>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(118px,1fr))", gap: 1, marginTop: 11, background: C.line, border: `1px solid ${C.line}` }}>
              <Cel l="Fixo total" v={brl2(c.fixoTotal)} />
              <Cel l="Fixo recebido" v={brl2(d.fixoRecebido)} calc c={C.green} />
              <Cel l="Fixo pendente" v={brl2(d.fixoPendente)} calc c={C.amber} />
              <Cel l="Valor da causa" v={brl2(c.valorCausa)} />
              <Cel l="Parcelas" v={`${d.parcelas.filter((p) => p.recebido).length}/${d.parcelas.length}`} calc />
            </div>

            {(c.pctExito > 0 || c.pctSucumb > 0) && c.valorCausa > 0 && (
              <div style={{ marginTop: 10, background: C.paper, border: `1px solid ${C.line}`, padding: "9px 11px" }}>
                <div style={{ fontSize: 8.5, letterSpacing: ".12em", color: C.inkSoft, fontWeight: 600, marginBottom: 6 }}>
                  PROJEÇÃO · QUOTA DO PARCEIRO {pct(c.pctQuota)}
                </div>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead><tr style={{ color: C.inkSoft, fontSize: 9 }}>
                    <th style={thL}></th><th style={thR}>TOTAL</th><th style={thR}>PARCEIRO</th>
                    <th style={{ ...thR, color: C.navy }}>ESCRITÓRIO</th>
                  </tr></thead>
                  <tbody>
                    {c.pctExito > 0 && (
                      <tr style={{ borderTop: `1px solid ${C.line}` }}>
                        <td style={tdL}>Êxito · {pct(c.pctExito)}</td>
                        <td style={tdR}>{brl2(d.exitoTotal)}</td>
                        <td style={{ ...tdR, color: C.inkSoft }}>{brl2(d.exitoParceiro)}</td>
                        <td style={{ ...tdR, color: C.navy, fontWeight: 600 }}>{brl2(d.exitoEscritorio)}</td>
                      </tr>
                    )}
                    {c.pctSucumb > 0 && (
                      <tr style={{ borderTop: `1px solid ${C.line}` }}>
                        <td style={tdL}>Sucumbência · {pct(c.pctSucumb)}</td>
                        <td style={tdR}>{brl2(d.sucumbTotal)}</td>
                        <td style={{ ...tdR, color: C.inkSoft }}>{brl2(d.sucumbParceiro)}</td>
                        <td style={{ ...tdR, color: C.navy, fontWeight: 600 }}>{brl2(d.sucumbEscritorio)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {c.obs && <div style={{ fontSize: 11, color: alerta ? C.amber : C.inkSoft, marginTop: 9, fontStyle: alerta ? "normal" : "italic", fontWeight: alerta ? 600 : 400 }}>{c.obs}</div>}
          </div>
        );
      })}
      {n < lista.length && (
        <button onClick={() => setN(n + 20)} className="btn" style={{ ...btnGhost, width: "100%", padding: "11px" }}>
          Ver mais {Math.min(20, lista.length - n)} · restam {lista.length - n}
        </button>
      )}
      {!lista.length && <Card t=""><Vazio t="Nenhum contrato com esse filtro." /></Card>}
    </>
  );
}

/* ══════════  PARCELAS  ══════════ */
function Parcelas({ db, m, receber, estornar }) {
  const [f, setF] = useState("aberto");
  const lista = db.parcelas
    .map((p) => ({ ...p, contrato: db.contratos.find((c) => c.id === p.contratoId) }))
    .filter((p) => (f === "aberto" ? !p.recebido : f === "recebido" ? p.recebido : true))
    .sort((a, b) => (a.mesEsperado || "").localeCompare(b.mesEsperado || ""));
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 9, marginBottom: 11 }}>
        <KPI r="A receber" v={brl2(m.aReceber)} n="parcelas futuras" c={C.gold} />
        <KPI r="Em atraso" v={brl2(m.inadimp)} n={`${m.atrasadas.length} parcelas`} c={m.inadimp ? C.red : C.green} />
        <KPI r="Fixo pendente" v={brl2(m.fixoPendenteTotal)} n="contratos ativos" c={C.navy} />
        <KPI r="Receita realizada" v={brl2(m.receitaRealizada)} n="entrou no caixa" c={C.green} />
      </div>
      <Card t="Parcelas" s="É aqui que os dois mundos se tocam: confirmar o recebimento cria a entrada.">
        <div style={{ display: "flex", gap: 5, margin: "11px 0 4px" }}>
          {[["aberto", "Em aberto"], ["recebido", "Recebidas"], ["todas", "Todas"]].map(([k, n]) => (
            <button key={k} onClick={() => setF(k)} className="btn" style={chip(f === k)}>{n}</button>
          ))}
        </div>
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
                    <td style={{ ...td, fontWeight: 500 }}>{p.contrato?.cliente || "—"}</td>
                    <td style={{ ...td, color: C.inkSoft, fontSize: 11.5 }}>{db.parceiros.find((x) => x.id === p.contrato?.parceiroId)?.nome || "—"}</td>
                    <td style={td}><Tag c={C.navy}>{p.tipo}</Tag></td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: atras ? C.red : C.inkSoft, fontWeight: atras ? 600 : 400 }}>{rotMes(p.mesEsperado)}{atras && " ⚠"}</td>
                    <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600 }}>{brl2(p.valor)}</td>
                    <td style={td}><span style={{ fontSize: 11, fontWeight: 600, color: p.recebido ? C.green : atras ? C.red : C.amber }}>{p.recebido ? "✓ Sim" : "Não"}</span></td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: C.inkSoft }}>{p.mesEfetivo ? rotMes(p.mesEfetivo) : "—"}</td>
                    <td style={{ ...td, fontSize: 10.5, color: C.inkSoft, maxWidth: 140 }}>{p.obs || "—"}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      {p.recebido
                        ? <button onClick={() => estornar(p.id)} style={linkBtn}>estornar</button>
                        : <button onClick={() => receber(p.id)} className="btn" style={{ ...btnSolid, padding: "4px 10px", fontSize: 11, background: atras ? C.red : C.navy, whiteSpace: "nowrap" }}>Confirmar recebimento</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Rodape>
          <b>Confirmar recebimento</b> gera a entrada no caixa automaticamente. <b>Estornar</b> desfaz os dois.
          Se o dinheiro chegou por outro caminho, você também pode lançar a entrada direto em{" "}
          <b>Entrada / Saída</b> e vincular a parcela por lá — o efeito é o mesmo.
        </Rodape>
      </Card>
    </>
  );
}

/* ══════════  LANÇAMENTOS  ══════════ */
const ORIGEM_TAG = { manual: { t: "avulso", c: C.inkSoft }, parcela: { t: "↳ PARCELA", c: C.navy }, fixo: { t: "↳ CUSTO FIXO", c: C.amber } };
function Lancamentos({ db, setModal }) {
  const [f, setF] = useState("todos");
  const [n, setN] = useState(30);
  const lista = [...db.lancamentos].filter((l) => f === "todos" || l.tipo === f || (f === "pendente" && !l.pago))
    .sort((a, b) => b.data.localeCompare(a.data));
  return (
    <Card t="Entradas e saídas" s="O único lugar onde se digita dinheiro. Vem de contrato ou de qualquer outro lugar."
      a={{ t: "+ Nova entrada / saída", f: () => setModal({ t: "lancamento" }) }}>
      <div style={{ display: "flex", gap: 5, margin: "11px 0 4px" }}>
        {[["todos", "Todos"], ["entrada", "Entradas"], ["saida", "Saídas"], ["pendente", "Pendentes"]].map(([k, x]) => (
          <button key={k} onClick={() => { setF(k); setN(30); }} className="btn" style={chip(f === k)}>{x}</button>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={tbl}>
          <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
            {["Data", "Descrição / cliente", "Categoria", "Contrato", "Forma", "Pago", "Origem", "Valor"].map((h) => (
              <th key={h} style={{ ...th, textAlign: h === "Valor" ? "right" : "left" }}>{h.toUpperCase()}</th>
            ))}
          </tr></thead>
          <tbody>
            {lista.slice(0, n).map((l) => {
              const o = ORIGEM_TAG[l.origem] || ORIGEM_TAG.manual;
              return (
                <tr key={l.id} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: C.inkSoft }}>{fmtData(l.data)}</td>
                  <td style={{ ...td, fontWeight: 500 }}>{l.descricao}</td>
                  <td style={{ ...td, color: C.inkSoft, fontSize: 11.5 }}>{l.categoria}</td>
                  <td style={{ ...td, fontSize: 11.5 }}>{db.contratos.find((c) => c.id === l.contratoId)?.cliente || <span style={{ color: C.inkSoft }}>—</span>}</td>
                  <td style={{ ...td, color: C.inkSoft, fontSize: 11 }}>{l.forma}</td>
                  <td style={td}><span style={{ fontSize: 10.5, fontWeight: 600, color: l.pago ? C.green : C.amber }}>{l.pago ? "SIM" : "PENDENTE"}</span></td>
                  <td style={td}>
                    <span style={{ fontSize: 8.5, color: o.c, background: l.origem === "manual" ? "transparent" : "#EDF0F8", padding: l.origem === "manual" ? 0 : "2px 5px", fontWeight: 600, letterSpacing: ".04em", whiteSpace: "nowrap" }}>{o.t}</span>
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600, color: l.tipo === "entrada" ? C.green : C.red, whiteSpace: "nowrap" }}>
                    {l.tipo === "entrada" ? "+" : "−"} {brl2(l.valor)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {n < lista.length && (
        <button onClick={() => setN(n + 40)} className="btn" style={{ ...btnGhost, width: "100%", padding: "9px", marginTop: 10 }}>
          Ver mais · restam {lista.length - n}
        </button>
      )}
      <Rodape>
        A coluna <b>origem</b> é a memória do sistema: <b>↳ PARCELA</b> nasceu de um contrato, <b>↳ CUSTO FIXO</b> do cadastro,{" "}
        <b>avulso</b> foi digitado aqui. Todo número sabe de onde veio — era exatamente isso que faltava
        quando alguém digitava por cima de uma fórmula.
      </Rodape>
    </Card>
  );
}

/* ══════════  CUSTOS FIXOS  ══════════ */
function Fixos({ db, m, lancar, setModal, up }) {
  return (
    <>
      <Card t={`Custos fixos de ${rotMes(MES_ATUAL)}`} s="Cadastre uma vez — o sistema propaga por toda a vigência.">
        {!m.fixosDoMes.length ? <Vazio t="Nenhum custo fixo vigente neste mês." /> : (
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 11 }}>
            {m.fixosDoMes.map((f) => (
              <div key={f.id} style={{ border: `1px solid ${f.lancado ? C.line : C.gold}`, background: f.lancado ? C.paper : "#fff", padding: "9px 12px", minWidth: 158 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{f.descricao}</div>
                <div style={{ fontSize: 10, color: C.inkSoft }}>vence dia {f.diaVenc}</div>
                <div style={{ fontFamily: S.mono, fontSize: 14, fontWeight: 600, color: f.lancado ? C.inkSoft : C.red, margin: "3px 0 5px", textDecoration: f.lancado ? "line-through" : "none" }}>{brl2(f.valor)}</div>
                {f.lancado ? <div style={{ fontSize: 9, color: C.green, fontWeight: 600 }}>✓ LANÇADO NO MÊS</div>
                  : <button onClick={() => lancar(f.id, MES_ATUAL)} className="btn" style={{ ...btnSolid, padding: "4px 9px", fontSize: 10.5, width: "100%" }}>Lançar no caixa</button>}
              </div>
            ))}
          </div>
        )}
        <Rodape>Custo fixo mensal vigente: <b style={{ fontFamily: S.mono }}>{brl2(m.custoFixoMensal)}</b> · o sistema recusa lançar o mesmo custo duas vezes no mesmo mês.</Rodape>
      </Card>
      <div style={{ height: 11 }} />
      <Card t="Cadastro de custos fixos" s="Importado da aba CONFIG" a={{ t: "+ Novo custo fixo", f: () => setModal({ t: "fixo" }) }}>
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
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600, color: C.red }}>{brl2(f.valor)}</td>
                <td style={td}><span style={{ fontSize: 10.5, fontWeight: 600, color: f.recorrente ? C.green : C.inkSoft }}>{f.recorrente ? "SIM" : "NÃO"}</span></td>
                <td style={{ ...td, fontFamily: S.mono, color: C.inkSoft }}>{f.diaVenc}</td>
                <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: C.inkSoft }}>{MESES_N[f.mesInicio - 1]} → {MESES_N[(f.mesFim || 12) - 1]}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button onClick={() => up("custosFixos", (fs) => fs.filter((x) => x.id !== f.id))} style={linkBtn}>remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Rodape>Na planilha havia <b>"Contador" duas vezes</b> com valores diferentes. Aqui dá para ver — e resolver.</Rodape>
      </Card>
    </>
  );
}

/* ══════════  FLUXO  ══════════ */
function Fluxo({ db, m }) {
  const doMes = db.lancamentos.filter((l) => l.pago && mesDe(l.data) === MES_ATUAL).sort((a, b) => a.data.localeCompare(b.data));
  const anterior = db.params.caixaInicial + db.lancamentos.filter((l) => l.pago && l.data < MES_ATUAL + "-01")
    .reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0);
  let saldo = anterior;
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", gap: 9, marginBottom: 11 }}>
        <KPI r="Caixa anterior" v={brl2(anterior)} n="fechamento de junho" c={C.navy} />
        <KPI r="Entradas do mês" v={brl2(m.fatAtual)} n="realizadas" c={C.green} />
        <KPI r="Saídas do mês" v={brl2(m.gastoAtual)} n="realizadas" c={C.red} />
        <KPI r="Caixa atual" v={brl2(m.caixa)} n="🔒 calculado — não há campo" c={C.gold} d />
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
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: C.inkSoft }}>{fmtData(l.data)}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 500 }}>{l.descricao}</div>
                      <div style={{ fontSize: 10.5, color: C.inkSoft }}>{l.categoria}</div>
                    </td>
                    <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.green, fontWeight: 600 }}>{l.tipo === "entrada" ? brl2(l.valor) : ""}</td>
                    <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.red, fontWeight: 600 }}>{l.tipo === "saida" ? brl2(l.valor) : ""}</td>
                    <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600 }}>{brl2(saldo)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      <div style={{ height: 11 }} />
      <Card t={`Ano de ${ANO}`} s="A corrente do caixa, de jan a dez — sem um único número digitado no meio">
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
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.green }}>{s.entrada ? brl2(s.entrada) : "—"}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: C.red }}>{s.saida ? brl2(s.saida) : "—"}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, color: s.resultado >= 0 ? C.green : C.red }}>{s.resultado ? brl2(s.resultado) : "—"}</td>
                <td style={{ ...td, textAlign: "right", fontFamily: S.mono, fontWeight: 600 }}>{brl2(s.caixa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Rodape>Na planilha, o caixa de <b>fev, abr, mai, jun e jul</b> tinha sido digitado por cima da fórmula. Aqui a corrente não pode ser cortada.</Rodape>
      </Card>
    </>
  );
}

/* ══════════  DRE  ══════════ */
function DRE({ m }) {
  const linhas = [["Receita de honorários", m.rec, ""], ["(−) Custas e restituições", -m.diretos, ""],
    ["= Resultado bruto", m.rec - m.diretos, "sub"], ["(−) Despesas operacionais", -m.despOp, ""],
    ["= Resultado do período", m.resultado, "total"]];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 9 }}>
      <Card t={`DRE — ${rotMes(MES_ATUAL)}`} s="Receita, custos e margem do período">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 10 }}>
          <tbody>
            {linhas.map(([n, v, tipo]) => (
              <tr key={n} style={{ borderBottom: tipo === "total" ? "none" : `1px solid ${C.line}`,
                borderTop: tipo === "total" ? `1.5px solid ${C.navy}` : "none",
                background: tipo === "total" ? C.paper : "transparent" }}>
                <td style={{ padding: tipo === "total" ? "12px 8px" : "9px 8px", fontWeight: tipo ? 600 : 400, fontFamily: tipo === "total" ? S.display : S.body, fontSize: tipo === "total" ? 15 : 13 }}>{n}</td>
                <td style={{ padding: "9px 8px", textAlign: "right", fontFamily: S.mono, fontWeight: 600, fontSize: tipo === "total" ? 15 : 13, color: v < 0 ? C.red : tipo === "total" ? (v >= 0 ? C.green : C.red) : C.ink }}>{brl2(Math.abs(v))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card t="Margem do mês" s="Quanto sobra de cada real que entra">
        <div style={{ textAlign: "center", padding: "22px 0 14px" }}>
          <div style={{ fontFamily: S.display, fontSize: 54, fontWeight: 700, lineHeight: 1, color: m.margem >= 20 ? C.green : m.margem >= 0 ? C.amber : C.red }}>{m.margem}%</div>
          <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 5 }}>{brl2(m.resultado)} sobre {brl2(m.rec)}</div>
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 11 }}>
          <Linha l="Receita" v={brl2(m.rec)} />
          <Linha l="Custos diretos" v={brl2(m.diretos)} />
          <Linha l="Despesas operacionais" v={brl2(m.despOp)} />
          <Linha l="Resultado" v={brl2(m.resultado)} forte />
        </div>
      </Card>
    </div>
  );
}

/* ══════════  BALANÇO  ══════════ */
function Balanco({ m }) {
  return (
    <Card t="Balanço patrimonial" s="Posição consolidada do escritório — 15/07/2026">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 12 }}>
        <div>
          <Titulo t="ATIVO" />
          <Linha l="Caixa e equivalentes" v={brl2(m.caixa)} />
          <Linha l="Contas a receber (parcelas)" v={brl2(m.aReceber + m.inadimp)} />
          <Linha l="Total do ativo" v={brl2(m.ativoTotal)} forte topo />
          <div style={{ marginTop: 16, background: C.goldPale, borderLeft: `2px solid ${C.gold}`, padding: "10px 12px" }}>
            <div style={{ fontSize: 8.5, letterSpacing: ".1em", color: C.amber, fontWeight: 600 }}>FORA DO BALANÇO</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 12 }}>
              <span>Projetado — escritório</span><span style={{ fontFamily: S.mono, fontWeight: 600 }}>{brl2(m.exitoProjEscritorio)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 12, color: C.inkSoft }}>
              <span>Projetado — parceiros</span><span style={{ fontFamily: S.mono }}>{brl2(m.exitoProjParceiro)}</span>
            </div>
            <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 5, lineHeight: 1.5 }}>
              Expectativa, não receita. E a parte do parceiro nunca é sua.
            </div>
          </div>
        </div>
        <div>
          <Titulo t="PASSIVO E PATRIMÔNIO" />
          <Linha l={`Obrigações previstas (${m.aPagarPendente.length})`} v={brl2(m.previstos)} />
          <Linha l="Total do passivo" v={brl2(m.previstos)} forte topo />
          <div style={{ height: 14 }} />
          <Titulo t="PATRIMÔNIO LÍQUIDO" />
          <Linha l="Patrimônio líquido" v={brl2(m.pl)} forte />
          <div style={{ background: C.navy, color: "#fff", padding: "14px 13px", marginTop: 14 }}>
            <div style={{ fontSize: 8.5, letterSpacing: ".14em", color: C.goldSoft, fontWeight: 600 }}>CONFERÊNCIA</div>
            <div style={{ fontFamily: S.mono, fontSize: 12, marginTop: 5 }}>{brl2(m.ativoTotal)} = {brl2(m.previstos)} + {brl2(m.pl)}</div>
            <div style={{ fontSize: 10.5, color: "#A9B2CC", marginTop: 5 }}>Fecha sozinho porque nada é digitado duas vezes.</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ══════════  TAREFAS  ══════════ */
function Tarefas({ db, up, setModal }) {
  const cols = [{ k: "aberta", n: "Abertas", c: C.navy }, { k: "concluida", n: "Concluídas", c: C.green }];
  const toggle = (id) => up("tarefas", (ts) => ts.map((t) => t.id === id ? { ...t, status: t.status === "aberta" ? "concluida" : "aberta" } : t));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
      {cols.map((col) => (
        <Card key={col.k} t={col.n} s={col.k === "aberta" ? "O que precisa da mão do advogado" : "Histórico"}
          a={col.k === "aberta" ? { t: "+ Nova tarefa", f: () => setModal({ t: "tarefa" }) } : null}>
          <div style={{ marginTop: 9 }}>
            {db.tarefas.filter((t) => t.status === col.k).map((t) => {
              const atras = col.k === "aberta" && t.prazo < HOJE;
              return (
                <div key={t.id} className="row" style={{ border: `1px solid ${atras ? "#F0D4D2" : C.line}`, borderLeft: `2.5px solid ${atras ? C.red : col.c}`, padding: "9px 11px", marginBottom: 6, background: atras ? "#FDF6F5" : "#fff", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <input type="checkbox" checked={col.k === "concluida"} onChange={() => toggle(t.id)} style={{ accentColor: C.navy, width: 14, height: 14, marginTop: 2, cursor: "pointer" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, textDecoration: col.k === "concluida" ? "line-through" : "none", color: col.k === "concluida" ? C.inkSoft : C.ink }}>
                      {t.origem === "radar" && <span style={{ fontSize: 8.5, color: C.gold, background: C.goldPale, padding: "1px 5px", borderRadius: 2, fontWeight: 600, letterSpacing: ".04em", marginRight: 6 }}>↳ RADAR</span>}
                      {t.titulo}
                    </div>
                    <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 2 }}>
                      {db.contratos.find((c) => c.id === t.contratoId)?.cliente || "—"} · {t.resp || "sem responsável"}
                      {t.processoNumero && <span style={{ fontFamily: S.mono }}> · {t.processoNumero}</span>}
                    </div>
                  </div>
                  <span style={{ fontFamily: S.mono, fontSize: 10, fontWeight: 600, color: atras ? C.red : C.inkSoft }}>{fmtData(t.prazo)}</span>
                </div>
              );
            })}
            {!db.tarefas.filter((t) => t.status === col.k).length && <Vazio t={col.k === "aberta" ? "Nenhuma tarefa. Este é o ClickUp interno — vazio até você usar." : "Nada concluído ainda."} />}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ══════════  AJUSTES  ══════════ */
function Ajustes({ db, up, setDb, rodar }) {
  const setP = (k, v) => setDb((p) => ({ ...p, params: { ...p.params, [k]: Number(v) || 0 } }));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
      <Card t="Parâmetros do escritório" s="Importados da aba CONFIG. Editados aqui, e só aqui.">
        <div style={{ display: "grid", gap: 11, marginTop: 12 }}>
          {[["caixaInicial", "Caixa inicial do ano", "Saldo real em 01/01/2026"],
            ["metaCaixa", "Meta de caixa 2026", "Única meta: até 31/dez"],
            ["metaRecorrencia", "Meta de recorrência mensal", "Objetivo de receita previsível"],
            ["recorrenciaAtual", "Recorrência atual", "Atualize quando mudar"]].map(([k, l, h]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{l}</div>
                <div style={{ fontSize: 10.5, color: C.inkSoft }}>{h}</div>
              </div>
              <input type="number" value={db.params[k]} onChange={(e) => setP(k, e.target.value)}
                style={{ ...campo, width: 130, fontFamily: S.mono, fontWeight: 600, textAlign: "right", background: C.goldPale, borderColor: C.gold }} />
            </div>
          ))}
        </div>
        <Rodape>Fundo dourado = os únicos parâmetros digitados do sistema. Troque pelos valores reais e todo o resto se recalcula.</Rodape>
      </Card>
      <Card t="Dados" s="O que está carregado agora">
        <div style={{ marginTop: 10 }}>
          <Linha l="Contratos" v={db.contratos.length} />
          <Linha l="Parcelas" v={db.parcelas.length} />
          <Linha l="Lançamentos" v={db.lancamentos.length} />
          <Linha l="Custos fixos" v={db.custosFixos.length} />
          <Linha l="Parceiros" v={db.parceiros.length} />
          <Linha l="Tarefas" v={db.tarefas.length} forte />
        </div>
        <div style={{ display: "flex", gap: 7, marginTop: 16 }}>
          <button onClick={() => { setDb(importado()); rodar("Histórico recarregado das planilhas."); }} className="btn" style={btnGhost}>Recarregar histórico</button>
          <button onClick={() => { setDb(VAZIO); rodar("Sistema zerado."); }} className="btn" style={{ ...btnGhost, color: C.red, borderColor: "#E8C9C7" }}>Zerar tudo</button>
        </div>
        <Rodape>⚠ Ainda sem persistência: recarregar a página volta ao histórico importado. É o próximo passo.</Rodape>
      </Card>
    </div>
  );
}

/* ══════════  RADAR PROCESSUAL  ══════════ */
const RADAR_COR = { movimentou: C.gold, sem_novidade: C.inkSoft, falhou: C.red };
const RADAR_ROTULO = { movimentou: "Movimentou", sem_novidade: "Sem novidade", falhou: "Falhou" };

function Radar({ db, up, setModal, enviarParaTarefas, enviarTodas, rodarVerificacao }) {
  const [aba, setAba] = useState("movimentou");
  const run = db.radarRun;
  const movs = db.radarMovs || [];
  const hist = db.radarHistorico || [];

  if (!run) return <Card t="Radar processual" s="Sem verificação registrada."><Vazio t="Rode a primeira verificação para começar." /></Card>;

  const resultadoDe = (pid) => run.resultados.find((r) => r.processoId === pid);
  const proc = (pid) => db.processos.find((p) => p.id === pid);
  const cont = { movimentou: 0, sem_novidade: 0, falhou: 0 };
  run.resultados.forEach((r) => { cont[r.status]++; });
  const totalMovs = movs.length;
  const rodadaData = run.rodadaEm.slice(0, 10);
  const jaTarefa = (mvId) => db.tarefas.some((t) => t.origemMovId === mvId);
  const movsPendentes = movs.filter((mv) => !jaTarefa(mv.id));

  // processos parados há mais de 30 dias (régua de inércia)
  const parados = db.processos.filter((p) => p.monitorar && p.ativo && diasDesde(p.ultimoAndamento) > 30)
    .sort((a, b) => a.ultimoAndamento.localeCompare(b.ultimoAndamento));

  // lista da aba atual
  const listaProc = run.resultados.filter((r) => r.status === aba)
    .map((r) => ({ ...r, p: proc(r.processoId) }))
    .filter((r) => r.p);

  return (
    <>
      {/* faixa de execução */}
      <div className="card" style={{ background: C.navy, color: "#fff", padding: "15px 18px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 8.5, letterSpacing: ".18em", color: C.goldSoft, fontWeight: 600 }}>ÚLTIMA VERIFICAÇÃO AUTOMÁTICA</div>
          <div style={{ fontFamily: S.display, fontSize: 20, fontWeight: 700, marginTop: 2 }}>
            {new Date(rodadaData).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </div>
          <div style={{ fontSize: 11.5, color: "#A9B2CC", marginTop: 3 }}>
            {run.processosVerificados} processos varridos · roda toda semana, automaticamente
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={enviarTodas} disabled={!movsPendentes.length} className="btn" style={{ ...btnGold, opacity: movsPendentes.length ? 1 : .5, cursor: movsPendentes.length ? "pointer" : "not-allowed" }}>
            Enviar {movsPendentes.length || ""} movimentações às tarefas
          </button>
          <button onClick={rodarVerificacao} className="btn" style={{ background: "#fff", color: C.navy, border: "none", padding: "8px 15px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: S.body, borderRadius: 2 }}>
            ↻ Rodar de novo
          </button>
        </div>
      </div>

      {/* três resultados possíveis */}
      <Faixa n="O resultado da rodada — cada processo cai em um dos três" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
        {["movimentou", "sem_novidade", "falhou"].map((st) => (
          <button key={st} onClick={() => setAba(st)} style={{
            background: aba === st ? "#fff" : "#FBFBFD", border: `1px solid ${aba === st ? RADAR_COR[st] : C.line}`,
            borderTop: `3px solid ${RADAR_COR[st]}`, padding: "14px 16px", cursor: "pointer", textAlign: "left", fontFamily: S.body,
          }}>
            <div style={{ fontSize: 9.5, letterSpacing: ".1em", color: RADAR_COR[st], fontWeight: 600 }}>{RADAR_ROTULO[st].toUpperCase()}</div>
            <div style={{ fontFamily: S.display, fontSize: 34, fontWeight: 700, margin: "4px 0 1px" }}>{cont[st]}</div>
            <div style={{ fontSize: 10.5, color: C.inkSoft }}>
              {st === "movimentou" && `${totalMovs} movimentações no total`}
              {st === "sem_novidade" && "nada mudou desde a última rodada"}
              {st === "falhou" && "não deu para verificar — revisar"}
            </div>
          </button>
        ))}
      </div>

      {/* ── MOVIMENTOU: o feed que vira tarefa ── */}
      {aba === "movimentou" && (
        <Card t="Movimentações detectadas" s="Cada uma pode virar tarefa no ClickUp interno — é a costura entre o radar e a operação."
          a={movsPendentes.length ? { t: `Enviar todas (${movsPendentes.length})`, f: enviarTodas } : null}>
          {!movs.length ? <Vazio t="Nenhum processo movimentou nesta rodada." /> : (
            <div style={{ marginTop: 10 }}>
              {movs.map((mv) => {
                const enviado = jaTarefa(mv.id);
                return (
                  <div key={mv.id} className="row" style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ width: 3, alignSelf: "stretch", background: C.gold, borderRadius: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{mv.cliente}</span>
                        <Tag c={C.navy}>{mv.tipo}</Tag>
                        <span style={{ fontFamily: S.mono, fontSize: 10.5, color: C.inkSoft }}>{mv.numero}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: C.ink, marginTop: 3 }}>{mv.resumo}</div>
                      <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 2 }}>detectada em {fmtData(mv.data)}</div>
                    </div>
                    {enviado
                      ? <span style={{ fontSize: 10.5, color: C.green, fontWeight: 600, whiteSpace: "nowrap", alignSelf: "center" }}>✓ já é tarefa</span>
                      : <button onClick={() => enviarParaTarefas(mv)} className="btn" style={{ ...btnSolid, padding: "6px 12px", fontSize: 11.5, whiteSpace: "nowrap", alignSelf: "center" }}>→ Criar tarefa</button>}
                  </div>
                );
              })}
            </div>
          )}
          <Rodape>
            Todo processo que movimenta precisa de olho humano. O radar detecta; <b>"Criar tarefa"</b> joga para o ClickUp interno —
            que é a mesma aba de <b>Tarefas</b> do sistema. Nada vive numa ferramenta paralela.
          </Rodape>
        </Card>
      )}

      {/* ── SEM NOVIDADE ── */}
      {aba === "sem_novidade" && (
        <Card t="Processos sem novidade" s="Verificados nesta rodada, nada mudou. Ficam de olho para a próxima.">
          <div style={{ overflowX: "auto" }}>
            <table style={tbl}>
              <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
                {["Cliente", "Processo", "Tribunal", "Fase atual", "Último andamento"].map((h) => <th key={h} style={{ ...th, textAlign: "left" }}>{h.toUpperCase()}</th>)}
              </tr></thead>
              <tbody>
                {listaProc.map((r) => (
                  <tr key={r.processoId} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ ...td, fontWeight: 500 }}>{r.p.cliente}</td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11 }}>{r.p.numero}</td>
                    <td style={{ ...td, color: C.inkSoft }}>{r.p.tribunal} · {r.p.comarca}</td>
                    <td style={td}><Tag c={C.inkSoft}>{r.p.fase}</Tag></td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: diasDesde(r.p.ultimoAndamento) > 30 ? C.amber : C.inkSoft }}>
                      {fmtData(r.p.ultimoAndamento)} · {diasDesde(r.p.ultimoAndamento)}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── FALHOU: run health ── */}
      {aba === "falhou" && (
        <Card t="Processos que não deram certo na verificação" s="Aqui você vê se realmente não teve movimentação — ou se a automação só não conseguiu checar.">
          {!listaProc.length ? <Vazio t="Nenhuma falha nesta rodada. Todos foram verificados." /> : (
            <div style={{ marginTop: 10 }}>
              {listaProc.map((r) => (
                <div key={r.processoId} className="row" style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ width: 26, height: 26, borderRadius: 13, background: "#FBEDEC", color: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>!</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.p.cliente} <span style={{ fontFamily: S.mono, fontSize: 10.5, color: C.inkSoft, fontWeight: 400 }}>· {r.p.numero}</span></div>
                    <div style={{ fontSize: 11.5, color: C.red, marginTop: 2 }}>{r.detalhe}</div>
                  </div>
                  <button onClick={rodarVerificacao} className="btn" style={{ ...btnGhost, padding: "5px 11px", fontSize: 11, whiteSpace: "nowrap" }}>↻ Tentar de novo</button>
                </div>
              ))}
            </div>
          )}
          <Rodape>
            Uma falha <b>não significa</b> que o processo parou — significa que a automação não conseguiu olhar (tribunal fora do ar, CAPTCHA, timeout).
            Por isso a lista é separada: um processo silencioso de verdade é diferente de um que ninguém checou.
          </Rodape>
        </Card>
      )}

      {/* régua de inércia + tendência */}
      <div style={{ height: 12 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Card t="Parados há mais de 30 dias" s="A régua de inércia — o que exige uma ligação ao Balcão Virtual">
          {!parados.length ? <Vazio t="Nenhum processo parado além de 30 dias." /> : (
            <div style={{ marginTop: 8 }}>
              {parados.slice(0, 7).map((p) => (
                <div key={p.id} className="row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.cliente}</div>
                    <div style={{ fontSize: 10.5, color: C.inkSoft, fontFamily: S.mono }}>{p.numero} · {p.fase}</div>
                  </div>
                  <span style={{ fontFamily: S.mono, fontSize: 11.5, fontWeight: 600, color: C.amber, whiteSpace: "nowrap" }}>{diasDesde(p.ultimoAndamento)}d parado</span>
                </div>
              ))}
              {parados.length > 7 && <Rodape>+ {parados.length - 7} outros parados há mais de 30 dias</Rodape>}
            </div>
          )}
        </Card>

        <Card t="Movimentações por semana" s="Quantas cada rodada encontrou — e quantas falharam">
          <div style={{ height: 190, marginTop: 8 }}>
            <ResponsiveContainer>
              <BarChart data={hist.map((h) => ({ sem: fmtData(h.data), movimentaram: h.movimentaram, falharam: h.falharam }))}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false} />
                <XAxis dataKey="sem" tickLine={false} axisLine={{ stroke: C.line }} tick={{ fontSize: 10, fill: C.inkSoft, fontFamily: S.mono }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: C.inkSoft, fontFamily: S.mono }} allowDecimals={false} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="movimentaram" name="Movimentaram" fill={C.gold} radius={[2, 2, 0, 0]} barSize={14} />
                <Bar dataKey="falharam" name="Falharam" fill={C.red} radius={[2, 2, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* cadastro dos processos monitorados */}
      <div style={{ height: 12 }} />
      <Card t={`Processos monitorados (${db.processos.length})`} s="A lista que a automação varre toda semana"
        a={{ t: "+ Adicionar processo", f: () => setModal({ t: "processo" }) }}>
        <div style={{ overflowX: "auto" }}>
          <table style={tbl}>
            <thead><tr style={{ borderBottom: `1.5px solid ${C.navy}` }}>
              {["Cliente", "Processo", "Tribunal", "Fase", "Último andamento", "Resultado", "Monitorar", ""].map((h, i) => (
                <th key={h + i} style={{ ...th, textAlign: "left" }}>{h.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {db.processos.map((p) => {
                const r = resultadoDe(p.id);
                return (
                  <tr key={p.id} className="row" style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ ...td, fontWeight: 500 }}>{p.cliente}</td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11 }}>{p.numero}</td>
                    <td style={{ ...td, color: C.inkSoft, fontSize: 11.5 }}>{p.tribunal} · {p.comarca}</td>
                    <td style={td}><Tag c={C.inkSoft}>{p.fase}</Tag></td>
                    <td style={{ ...td, fontFamily: S.mono, fontSize: 11, color: diasDesde(p.ultimoAndamento) > 30 ? C.amber : C.inkSoft }}>{fmtData(p.ultimoAndamento)}</td>
                    <td style={td}>
                      {r ? <span style={{ fontSize: 10.5, fontWeight: 600, color: RADAR_COR[r.status] }}>{RADAR_ROTULO[r.status]}{r.status === "movimentou" ? ` (${r.qtd})` : ""}</span>
                        : <span style={{ fontSize: 10.5, color: C.inkSoft }}>—</span>}
                    </td>
                    <td style={td}>
                      <button onClick={() => up("processos", (ps) => ps.map((x) => x.id === p.id ? { ...x, monitorar: !x.monitorar } : x))}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: p.monitorar ? C.green : C.inkSoft, fontFamily: S.body }}>
                        {p.monitorar ? "● ativo" : "○ pausado"}
                      </button>
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <button onClick={() => up("processos", (ps) => ps.filter((x) => x.id !== p.id))} style={linkBtn}>remover</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Rodape>
          É esta lista que a automação percorre. Adicionar um processo aqui é adicioná-lo ao radar — e quando ele movimentar,
          vira tarefa sozinho, ligado ao contrato do mesmo cliente.
        </Rodape>
      </Card>
    </>
  );
}

/* ══════════  MODAIS  ══════════ */
function Shell({ titulo, eyebrow, onClose, children, onSave, ok, salvar = "Salvar" }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(21,29,62,.55)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 600, maxHeight: "92vh", overflowY: "auto", animation: "slideUp .25s ease" }}>
        <div style={{ background: C.navy, color: "#fff", padding: "14px 19px", position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ fontSize: 8.5, letterSpacing: ".18em", color: C.gold, fontWeight: 600 }}>{eyebrow}</div>
          <div style={{ fontFamily: S.display, fontSize: 18, fontWeight: 700, marginTop: 2 }}>{titulo}</div>
        </div>
        <div style={{ padding: "17px 19px" }}>
          {children}
          <div style={{ display: "flex", gap: 7, justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={onClose} className="btn" style={btnGhost}>Cancelar</button>
            <button onClick={onSave} disabled={!ok} className="btn" style={{ ...btnSolid, background: ok ? C.navy : "#C3C9D8", cursor: ok ? "pointer" : "not-allowed" }}>{salvar}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── entrada/saída: livre, com a OPÇÃO de quitar uma parcela ── */
function MLancamento({ db, onClose, onSave }) {
  const [tipo, setTipo] = useState("entrada");
  const [parcelaId, setParcelaId] = useState("");
  const [f, setF] = useState({ data: HOJE, descricao: "", valor: "", categoria: "", forma: "PIX", pago: true, contratoId: "", obs: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const cats = tipo === "entrada" ? CAT_ENTRADA : CAT_SAIDA;
  const abertas = db.parcelas.filter((p) => !p.recebido && (!f.contratoId || p.contratoId === f.contratoId))
    .map((p) => ({ ...p, cliente: db.contratos.find((c) => c.id === p.contratoId)?.cliente }));
  const ok = f.descricao && f.valor > 0 && f.categoria;

  const escolherParcela = (id) => {
    setParcelaId(id);
    if (!id) return;
    const p = db.parcelas.find((x) => x.id === id);
    const ct = db.contratos.find((c) => c.id === p.contratoId);
    setF((s) => ({ ...s, valor: p.valor, descricao: `${p.tipo} — ${ct?.cliente}`, categoria: "Honorários", contratoId: p.contratoId, pago: true }));
  };

  return (
    <Shell eyebrow="ENTRADA ÚNICA DE DADO" titulo="Nova entrada / saída" onClose={onClose} ok={ok}
      salvar={parcelaId ? "Salvar e quitar parcela" : "Salvar lançamento"}
      onSave={() => { onSave({ ...f, tipo, valor: Number(f.valor) }, parcelaId); onClose(); }}>
      <div style={{ display: "flex", marginBottom: 14, border: `1px solid ${C.line}` }}>
        {[["entrada", "Entrada", C.green], ["saida", "Saída", C.red]].map(([k, n, cor]) => (
          <button key={k} onClick={() => { setTipo(k); set("categoria", ""); setParcelaId(""); }} className="btn" style={{
            flex: 1, padding: "9px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            fontFamily: S.body, background: tipo === k ? cor : "#fff", color: tipo === k ? "#fff" : C.inkSoft,
          }}>{n}</button>
        ))}
      </div>

      {tipo === "entrada" && (
        <div style={{ background: parcelaId ? C.goldPale : C.paper, border: `1px solid ${parcelaId ? C.gold : C.line}`, padding: "11px 12px", marginBottom: 14 }}>
          <div style={{ fontSize: 8.5, letterSpacing: ".12em", color: parcelaId ? C.amber : C.inkSoft, fontWeight: 600, marginBottom: 5 }}>
            ESTA ENTRADA QUITA UMA PARCELA?
          </div>
          <select value={parcelaId} onChange={(e) => escolherParcela(e.target.value)} style={campo}>
            <option value="">Não — é dinheiro de outro lugar</option>
            {abertas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.cliente} · {p.tipo} · {rotMes(p.mesEsperado)} · {brl2(p.valor)}
                {p.mesEsperado < MES_ATUAL ? " ⚠ atrasada" : ""}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 6, lineHeight: 1.5 }}>
            {parcelaId
              ? <>Ao salvar, a parcela é marcada como <b>recebida</b> e a entrada cai no caixa — <b>de uma vez só</b>.</>
              : <>Deixe em "não" para consultoria, reembolso, aporte ou qualquer entrada que não venha de contrato.</>}
          </div>
        </div>
      )}

      <Grid>
        <F l="DATA"><input type="date" value={f.data} onChange={(e) => set("data", e.target.value)} style={campo} /></F>
        <F l="VALOR (R$)"><input type="number" step="0.01" placeholder="0,00" value={f.valor} onChange={(e) => set("valor", e.target.value)} style={{ ...campo, fontFamily: S.mono, fontWeight: 600 }} /></F>
        <F l="DESCRIÇÃO / CLIENTE" full><input value={f.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex.: Honorário inicial — Cliente X" style={campo} /></F>
        <F l="CATEGORIA" full>
          <select value={f.categoria} onChange={(e) => set("categoria", e.target.value)} style={campo}>
            <option value="">Selecione</option>{cats.map((c) => <option key={c}>{c}</option>)}
          </select>
        </F>
        <F l="CONTRATO / CLIENTE">
          <select value={f.contratoId} onChange={(e) => { set("contratoId", e.target.value); setParcelaId(""); }} style={campo} disabled={!!parcelaId}>
            <option value="">Sem vínculo</option>
            {db.contratos.map((c) => <option key={c.id} value={c.id}>{c.cliente}</option>)}
          </select>
        </F>
        <F l="FORMA"><select value={f.forma} onChange={(e) => set("forma", e.target.value)} style={campo}>{FORMAS.map((x) => <option key={x}>{x}</option>)}</select></F>
        <F l="PAGO / EFETIVADO?">
          <select value={f.pago ? "1" : "0"} onChange={(e) => set("pago", e.target.value === "1")} style={campo} disabled={!!parcelaId}>
            <option value="1">Sim — entrou/saiu do caixa</option>
            <option value="0">Pendente — ainda não caiu</option>
          </select>
        </F>
        <F l="OBSERVAÇÕES"><input value={f.obs} onChange={(e) => set("obs", e.target.value)} style={campo} /></F>
      </Grid>
      <Nota>
        Se <b>Pago = Sim</b>, entra no caixa agora. Se <b>Pendente</b>, vai para as obrigações do balanço e não mexe no caixa —
        é o mesmo "SIM / PENDENTE" da coluna PAGO das suas abas mensais, só que valendo para os dois lados.
      </Nota>
    </Shell>
  );
}

function MContrato({ db, onClose, onSave }) {
  const [f, setF] = useState({ cliente: "", parceiroId: "", processo: "", tipoHonorario: "", pctExito: 0, pctSucumb: 0, pctQuota: 0, fixoTotal: 0, valorCausa: 0, status: "Proposta", splitNick: "", obs: "", dataProposta: HOJE, dataFechamento: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const ok = f.cliente && f.tipoHonorario;
  const ex = (f.valorCausa || 0) * (f.pctExito || 0);
  return (
    <Shell eyebrow="CADASTRO" titulo="Novo contrato" onClose={onClose} ok={ok} salvar="Salvar contrato" onSave={() => { onSave(f); onClose(); }}>
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
        <F l="FIXO TOTAL (R$)"><input type="number" step="0.01" value={f.fixoTotal} onChange={(e) => set("fixoTotal", Number(e.target.value))} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="VALOR DA CAUSA (R$)"><input type="number" step="0.01" value={f.valorCausa} onChange={(e) => set("valorCausa", Number(e.target.value))} style={{ ...campo, fontFamily: S.mono, background: C.goldPale, borderColor: C.gold }} /></F>
        <F l="% ÊXITO"><input type="number" value={Math.round(f.pctExito * 100)} onChange={(e) => set("pctExito", Number(e.target.value) / 100)} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="% SUCUMBÊNCIA"><input type="number" value={Math.round(f.pctSucumb * 100)} onChange={(e) => set("pctSucumb", Number(e.target.value) / 100)} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="% QUOTA — FATIA DO PARCEIRO" full><input type="number" value={Math.round(f.pctQuota * 100)} onChange={(e) => set("pctQuota", Number(e.target.value) / 100)} style={{ ...campo, fontFamily: S.mono }} /></F>
        <F l="SPLIT NICK"><input value={f.splitNick} onChange={(e) => set("splitNick", e.target.value)} style={campo} /></F>
        <F l="DATA DA PROPOSTA"><input type="date" value={f.dataProposta} onChange={(e) => set("dataProposta", e.target.value)} style={campo} /></F>
        <F l="OBSERVAÇÕES" full><input value={f.obs} onChange={(e) => set("obs", e.target.value)} style={campo} /></F>
      </Grid>
      {ex > 0 && (
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "9px 11px", marginTop: 12, fontSize: 12 }}>
          <div style={{ fontSize: 8.5, letterSpacing: ".12em", color: C.inkSoft, fontWeight: 600, marginBottom: 5 }}>🔒 PRÉVIA CALCULADA</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Êxito total</span><b style={{ fontFamily: S.mono }}>{brl2(ex)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: C.inkSoft }}><span>Parceiro ({pct(f.pctQuota)})</span><span style={{ fontFamily: S.mono }}>{brl2(ex * f.pctQuota)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: C.navy, fontWeight: 600 }}><span>Escritório ({pct(1 - f.pctQuota)})</span><span style={{ fontFamily: S.mono }}>{brl2(ex * (1 - f.pctQuota))}</span></div>
        </div>
      )}
    </Shell>
  );
}

function MParcela({ db, contratoId, onClose, onSave }) {
  const ct = db.contratos.find((c) => c.id === contratoId);
  const [f, setF] = useState({ contratoId, tipo: "Mensal", valor: "", mesEsperado: MES_ATUAL, recebido: false, mesEfetivo: "", obs: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Shell eyebrow={(ct?.cliente || "").toUpperCase()} titulo="Nova parcela" onClose={onClose} ok={f.valor > 0 && f.mesEsperado}
      salvar="Salvar parcela" onSave={() => { onSave({ ...f, valor: Number(f.valor) }); onClose(); }}>
      <Grid>
        <F l="TIPO"><select value={f.tipo} onChange={(e) => set("tipo", e.target.value)} style={campo}>{TIPO_PARCELA.map((t) => <option key={t}>{t}</option>)}</select></F>
        <F l="VALOR (R$)"><input type="number" step="0.01" value={f.valor} onChange={(e) => set("valor", e.target.value)} style={{ ...campo, fontFamily: S.mono, fontWeight: 600 }} /></F>
        <F l="MÊS ESPERADO" full>
          <select value={f.mesEsperado} onChange={(e) => set("mesEsperado", e.target.value)} style={campo}>
            {MESES.map((m) => <option key={m} value={m}>{rotMes(m)}</option>)}
          </select>
        </F>
        <F l="OBSERVAÇÕES" full><input value={f.obs} onChange={(e) => set("obs", e.target.value)} style={campo} /></F>
      </Grid>
      <Nota>Não há campo "recebido" aqui — a confirmação acontece em <b>Parcelas</b> ou pelo lançamento de entrada. Nos dois casos, o efeito é o mesmo.</Nota>
    </Shell>
  );
}

function MFixo({ onClose, onSave }) {
  const [f, setF] = useState({ descricao: "", valor: "", recorrente: true, diaVenc: 5, mesInicio: 1, mesFim: 12 });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Shell eyebrow="CADASTRE UMA VEZ" titulo="Novo custo fixo" onClose={onClose} ok={f.descricao && f.valor > 0} salvar="Salvar custo fixo"
      onSave={() => { onSave({ ...f, valor: Number(f.valor), diaVenc: Number(f.diaVenc), mesInicio: Number(f.mesInicio), mesFim: Number(f.mesFim) }); onClose(); }}>
      <Grid>
        <F l="DESCRIÇÃO" full><input value={f.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex.: Contador" style={campo} /></F>
        <F l="VALOR MENSAL (R$)"><input type="number" step="0.01" value={f.valor} onChange={(e) => set("valor", e.target.value)} style={{ ...campo, fontFamily: S.mono, fontWeight: 600 }} /></F>
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
    <Shell eyebrow="OPERAÇÃO" titulo="Nova tarefa" onClose={onClose} ok={!!f.titulo} salvar="Salvar tarefa" onSave={() => { onSave(f); onClose(); }}>
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

const TRIBUNAIS_OPC = ["TJSP", "TJMG", "TJRJ", "TJPR", "TJRS", "TRT-2", "TRT-15", "TRF-3", "STJ"];
const FASES_OPC = ["Petição inicial", "Citação", "Contestação", "Réplica", "Saneamento", "Instrução", "Sentença", "Recurso", "Cumprimento de sentença", "Execução"];
function MProcesso({ db, onClose, onSave }) {
  const [f, setF] = useState({ numero: "", contratoId: "", cliente: "", tribunal: "TJSP", comarca: "", fase: "Petição inicial", ativo: true, ultimoAndamento: HOJE, monitorar: true });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const ok = f.numero && f.cliente;
  const vincular = (cid) => {
    const c = db.contratos.find((x) => x.id === cid);
    setF((s) => ({ ...s, contratoId: cid, cliente: c ? c.cliente : s.cliente, numero: c?.processo && c.processo !== "0000000-00.0000.8.26.0000" ? c.processo : s.numero }));
  };
  return (
    <Shell eyebrow="RADAR PROCESSUAL" titulo="Adicionar processo ao radar" onClose={onClose} ok={ok} salvar="Adicionar ao radar"
      onSave={() => { onSave({ ...f }); onClose(); }}>
      <Grid>
        <F l="VINCULAR A UM CONTRATO" full>
          <select value={f.contratoId} onChange={(e) => vincular(e.target.value)} style={campo}>
            <option value="">Sem contrato (processo avulso)</option>
            {db.contratos.map((c) => <option key={c.id} value={c.id}>{c.cliente}</option>)}
          </select>
        </F>
        <F l="Nº DO PROCESSO" full><input value={f.numero} onChange={(e) => set("numero", e.target.value)} placeholder="0000000-00.0000.8.26.0000" style={{ ...campo, fontFamily: S.mono, fontSize: 12 }} /></F>
        <F l="CLIENTE" full><input value={f.cliente} onChange={(e) => set("cliente", e.target.value)} style={campo} /></F>
        <F l="TRIBUNAL"><select value={f.tribunal} onChange={(e) => set("tribunal", e.target.value)} style={campo}>{TRIBUNAIS_OPC.map((t) => <option key={t}>{t}</option>)}</select></F>
        <F l="COMARCA / VARA"><input value={f.comarca} onChange={(e) => set("comarca", e.target.value)} style={campo} /></F>
        <F l="FASE ATUAL"><select value={f.fase} onChange={(e) => set("fase", e.target.value)} style={campo}>{FASES_OPC.map((x) => <option key={x}>{x}</option>)}</select></F>
        <F l="ÚLTIMO ANDAMENTO CONHECIDO"><input type="date" value={f.ultimoAndamento} onChange={(e) => set("ultimoAndamento", e.target.value)} style={campo} /></F>
      </Grid>
      <Nota>A automação usa o <b>número</b> e o <b>último andamento conhecido</b> como ponto de partida: na próxima rodada, tudo que for mais novo que essa data conta como movimentação nova.</Nota>
    </Shell>
  );
}

function MFechar({ contrato, onClose, onSave }) {
  const [n, setN] = useState(4);
  if (!contrato) return null;
  return (
    <Shell eyebrow="PROPOSTA → CONTRATO" titulo={`Fechar ${contrato.cliente}`} onClose={onClose} ok salvar="Registrar fechamento" onSave={() => onSave(Number(n))}>
      {contrato.fixoTotal > 0 ? (<>
        <Grid><F l="PARCELAS DO FIXO" full><input type="number" min="1" max="24" value={n} onChange={(e) => setN(e.target.value)} style={{ ...campo, fontFamily: S.mono, fontWeight: 600 }} /></F></Grid>
        <Nota>{n} parcelas de <b>{brl2(contrato.fixoTotal / (n || 1))}</b>, a partir de {rotMes(MES_ATUAL)}. Entram no <b>a receber</b> na hora — e cada confirmação vira uma entrada.</Nota>
      </>) : <Nota>Contrato sem honorário fixo. Nenhuma parcela será gerada — as de êxito você cadastra quando o valor se definir.</Nota>}
    </Shell>
  );
}

/* ══════════  ÁTOMOS  ══════════ */
const btnSolid = { background: C.navy, color: "#fff", border: "none", padding: "8px 15px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: S.body, borderRadius: 2 };
const btnGhost = { background: "#fff", color: C.ink, border: `1px solid ${C.line}`, padding: "8px 13px", fontSize: 12, cursor: "pointer", fontFamily: S.body, borderRadius: 2 };
const btnGold = { background: C.gold, color: C.navyDeep, border: "none", padding: "8px 13px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: S.body, borderRadius: 2 };
const linkBtn = { background: "none", border: "none", color: C.navy, fontSize: 11, cursor: "pointer", fontFamily: S.body, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2, padding: 0 };
const campo = { width: "100%", padding: "8px 10px", border: `1px solid ${C.line}`, fontSize: 12.5, fontFamily: S.body, borderRadius: 2, background: "#fff", color: C.ink };
const tbl = { width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginTop: 8 };
const th = { padding: "7px 8px", fontSize: 8.5, letterSpacing: ".11em", color: C.inkSoft, fontWeight: 600 };
const td = { padding: "8px 8px" };
const thL = { textAlign: "left", padding: "0 4px 4px", fontWeight: 600 };
const thR = { textAlign: "right", padding: "0 4px 4px", fontWeight: 600 };
const tdL = { padding: "5px 4px", color: C.inkSoft };
const tdR = { padding: "5px 4px", textAlign: "right", fontFamily: S.mono };
const linhaFlex = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.line}` };
const tipStyle = { fontFamily: S.body, fontSize: 12, borderRadius: 2, border: `1px solid ${C.line}` };
const chip = (on) => ({ padding: "5px 11px", fontSize: 11, cursor: "pointer", borderRadius: 2, fontFamily: S.body, border: `1px solid ${on ? C.navy : C.line}`, background: on ? C.navy : "#fff", color: on ? "#fff" : C.inkSoft });

const Grid = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>;
const F = ({ l, full, children }) => (
  <div style={full ? { gridColumn: "1 / -1" } : {}}>
    <label style={{ fontSize: 8.5, letterSpacing: ".1em", color: C.inkSoft, fontWeight: 600, display: "block", marginBottom: 4 }}>{l}</label>
    {children}
  </div>
);
const Nota = ({ children }) => <div style={{ background: C.paper, borderLeft: `2px solid ${C.gold}`, padding: "9px 11px", marginTop: 12, fontSize: 11, color: C.inkSoft, lineHeight: 1.6 }}>{children}</div>;
const Faixa = ({ n }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9, flex: 1 }}>
    <span style={{ fontSize: 8.5, letterSpacing: ".18em", color: C.inkSoft, fontWeight: 600, whiteSpace: "nowrap" }}>{n.toUpperCase()}</span>
    <div style={{ flex: 1, height: 1, background: C.line }} />
  </div>
);
const KPI = ({ r, v, n, c, d }) => (
  <div className="card" style={{ background: "#fff", border: `1px solid ${d ? c : C.line}`, borderTop: `2.5px solid ${c}`, padding: "12px 14px" }}>
    <div style={{ fontSize: 9, letterSpacing: ".1em", color: C.inkSoft, fontWeight: 600 }}>{r.toUpperCase()}</div>
    <div style={{ fontFamily: S.display, fontSize: 23, fontWeight: 700, margin: "4px 0 2px", color: c }}>{v}</div>
    <div style={{ fontSize: 10, color: C.inkSoft }}>{n}</div>
  </div>
);
const Card = ({ t, s, a, children }) => (
  <div className="card" style={{ background: "#fff", border: `1px solid ${C.line}`, padding: "14px 16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
      <div>
        {t && <div style={{ fontFamily: S.display, fontSize: 15.5, fontWeight: 700 }}>{t}</div>}
        {s && <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>{s}</div>}
      </div>
      {a && <button onClick={a.f} style={linkBtn}>{a.t}</button>}
    </div>
    {children}
  </div>
);
const Cel = ({ l, v, calc, c = C.ink }) => (
  <div style={{ background: calc ? C.calcBg : "#fff", padding: "8px 10px" }}>
    <div style={{ fontSize: 8, letterSpacing: ".08em", color: C.inkSoft, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
      {calc && <span style={{ fontSize: 7.5 }}>🔒</span>}{l.toUpperCase()}
    </div>
    <div style={{ fontFamily: S.mono, fontSize: 12.5, fontWeight: 600, color: c, marginTop: 2 }}>{v}</div>
  </div>
);
const Tag = ({ c, children }) => (
  <span style={{ fontSize: 8.5, letterSpacing: ".05em", fontWeight: 600, color: c, border: `1px solid ${c}45`, padding: "2px 5px", borderRadius: 2, whiteSpace: "nowrap" }}>
    {String(children).toUpperCase()}
  </span>
);
const Mini = ({ n, l, c = C.navy }) => (
  <div style={{ background: C.paper, padding: "7px 4px" }}>
    <div style={{ fontFamily: S.display, fontSize: 19, fontWeight: 700, color: c }}>{n}</div>
    <div style={{ fontSize: 9, color: C.inkSoft, lineHeight: 1.3 }}>{l}</div>
  </div>
);
const Linha = ({ l, v, forte, topo }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0",
    borderTop: topo ? `1.5px solid ${C.navy}` : "none", borderBottom: forte ? "none" : `1px solid ${C.line}`,
    fontWeight: forte ? 600 : 400, fontSize: forte ? 13 : 12 }}>
    <span>{l}</span><span style={{ fontFamily: S.mono, fontWeight: 600 }}>{v}</span>
  </div>
);
const Titulo = ({ t }) => (
  <div style={{ fontSize: 8.5, letterSpacing: ".16em", color: C.gold, fontWeight: 700, paddingBottom: 5, borderBottom: `1.5px solid ${C.navy}`, marginBottom: 3 }}>{t}</div>
);
const Rodape = ({ children }) => <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 11, paddingTop: 8, fontSize: 10.5, color: C.inkSoft, lineHeight: 1.6 }}>{children}</div>;
const Vazio = ({ t }) => <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: C.inkSoft }}>{t}</div>;
