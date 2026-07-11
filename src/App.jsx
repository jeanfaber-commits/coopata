/* ================================================================
   COOPATA — Sistema de gestão · versão conectada ao Supabase
   ----------------------------------------------------------------
   Como usar (projeto Vite + React):
     1. npm create vite@latest coopata -- --template react
     2. cd coopata
        npm i @supabase/supabase-js recharts lucide-react
     3. Salve este arquivo como src/App.jsx
        (e deixe o src/main.jsx padrão do Vite renderizando <App />)
     4. Crie o arquivo .env na raiz do projeto com:
          VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
          VITE_SUPABASE_ANON_KEY=sua_chave_publica_anon
     5. npm run dev

   Pré-requisitos no Supabase:
     · schema-coopata.sql executado no SQL Editor;
     · bucket privado "documentos" criado no Storage;
     · contas criadas no Auth e registradas na tabela "usuarios"
       com papel administrador, contador ou cooperado.

   A chave anon é pública por natureza — quem protege os dados são
   as políticas de RLS do banco. A chave service_role NUNCA deve
   aparecer neste arquivo.
   ================================================================ */

import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Fish, LayoutDashboard, Users, FileText, Wallet, Package, Scale, HardHat,
  LogOut, Plus, AlertTriangle, TrendingUp, Waves, Anchor, Calendar, Printer,
  X, Eye, EyeOff, ArrowUpRight, ArrowDownRight, CircleDollarSign, Boxes,
  FileBarChart, Lock, Ruler, Utensils, Skull, Ship, CheckCircle2,
  ChevronLeft, ExternalLink, RefreshCw,
} from "lucide-react";

/* ---------------- conexão com o Supabase ---------------- */
const SUPABASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  "COLE_AQUI_A_CHAVE_ANON";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------------- parâmetros locais ----------------
   Valores contábeis ainda não modelados em tabela própria.
   Ajuste aqui até existir o módulo patrimonial.            */
const CUSTO_MEDIO_RACAO = 6.6; // R$/kg, para o custo de ração por kg produzido

const IMOBILIZADO = [
  { item: "Tanques-rede e estruturas de fixação (12 un)", valor: 54000 },
  { item: "Embarcações e motores", valor: 28500 },
  { item: "Máquinas e equipamentos (balanças, aeradores)", valor: 9800 },
  { item: "Flutuante e galpão de apoio", valor: 22000 },
  { item: "(−) Depreciação acumulada", valor: -18400 },
];

const PASSIVOS_FIXOS = {
  obrigacoesTrabalhistas: 4930,
  fnoCurtoPrazo: 12600,
  fnoLongoPrazo: 44100,
  reservas: 21500,
};

/* Preenchidos a partir das tabelas "parametros" e "especies"
   no carregamento dos dados. */
let VALOR_COTA = 50;
let MENSALIDADE = 80;
let ENCARGOS = 0.38;
let ESPECIES = {}; // { nome: { id, cor, preco } }

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=Instrument+Sans:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600;700&display=swap');

:root{
  --rio:#14302A; --rio2:#1C443B; --rio3:#0E241F;
  --nevoa:#EDF1EA; --papel:#FDFDFA; --tinta:#1C2B27; --tinta2:#5F7069;
  --linha:#D9E1D8; --ouro:#D9A521; --ouro2:#8A6A14;
  --ok:#2E7D4F; --warn:#B57A10; --crit:#B3402A; --azul:#4A7C9B;
  --sombra:0 1px 2px rgba(20,48,42,.06), 0 8px 24px -12px rgba(20,48,42,.18);
}
*{box-sizing:border-box; margin:0; padding:0;}
html,body,#root{height:100%;}
body{font-family:'Instrument Sans',system-ui,sans-serif; color:var(--tinta); background:var(--nevoa);}
button{font-family:inherit; cursor:pointer;}
input,select,textarea{font-family:inherit; font-size:14px;}
::-webkit-scrollbar{width:10px;height:10px;}
::-webkit-scrollbar-thumb{background:#BFCBC0;border-radius:8px;border:2px solid var(--nevoa);}

.wordmark{font-family:'Archivo',sans-serif; font-weight:900; font-stretch:125%;
  letter-spacing:.14em; text-transform:uppercase;}
.wordmark-sub{font-family:'Archivo',sans-serif; font-weight:500; font-stretch:110%;
  letter-spacing:.32em; text-transform:uppercase; font-size:9px;}
.regua{display:block; height:7px; border-top:2px solid var(--ouro); border-bottom:1px solid var(--ouro); width:100%;}

.app{display:grid; grid-template-columns:236px 1fr; height:100vh; overflow:hidden;}
@media (max-width:900px){ .app{grid-template-columns:72px 1fr;} .nav-rot,.brand-txt,.side-user-info,.side-foot-txt{display:none;} }

.sidebar{background:linear-gradient(178deg,var(--rio) 0%,var(--rio3) 100%); color:#E8EFE9;
  display:flex; flex-direction:column; overflow-y:auto;}
.brand{padding:20px 18px 14px; border-bottom:1px solid rgba(255,255,255,.08);}
.brand .wordmark{font-size:21px; color:#FFF;}
.brand .wordmark em{font-style:normal; color:var(--ouro);}
.brand .regua{margin:7px 0 6px; opacity:.9;}
.brand .wordmark-sub{color:#9FB5AA;}
.nav{padding:12px 10px; display:flex; flex-direction:column; gap:2px; flex:1;}
.navbtn{display:flex; align-items:center; gap:11px; padding:10px 12px; border:none; background:transparent;
  color:#C4D3C9; border-radius:9px; font-size:13.5px; font-weight:500; text-align:left; transition:background .15s,color .15s;}
.navbtn:hover{background:rgba(255,255,255,.07); color:#FFF;}
.navbtn.ativo{background:var(--ouro); color:var(--rio3); font-weight:700;}
.navbtn.ativo svg{color:var(--rio3);}
.side-user{border-top:1px solid rgba(255,255,255,.08); padding:14px 14px; display:flex; gap:10px; align-items:center;}
.avatar{width:34px;height:34px;border-radius:50%;background:var(--ouro);color:var(--rio3);
  display:flex;align-items:center;justify-content:center;font-weight:800;font-family:'Archivo';flex-shrink:0;}
.side-user-info{min-width:0;}
.side-user-info b{display:block;font-size:12.5px;color:#FFF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.side-user-info span{font-size:11px;color:var(--ouro);text-transform:uppercase;letter-spacing:.08em;font-weight:600;}
.btn-sair{margin:0 14px 16px; display:flex;align-items:center;gap:8px;justify-content:center; padding:8px;
  background:transparent;border:1px solid rgba(255,255,255,.18);color:#C4D3C9;border-radius:9px;font-size:12.5px;}
.btn-sair:hover{border-color:var(--crit); color:#FFB4A4;}

.main{display:flex; flex-direction:column; overflow:hidden;}
.topbar{background:var(--papel); padding:16px 26px 12px; display:flex; align-items:center; justify-content:space-between; gap:16px;}
.topbar h1{font-family:'Archivo'; font-weight:800; font-stretch:112%; font-size:19px; letter-spacing:.01em;}
.topbar .data-hoje{font-size:12.5px; color:var(--tinta2); display:flex; align-items:center; gap:6px;}
.waterline{height:14px; background:var(--papel); position:relative; flex-shrink:0;}
.waterline svg{position:absolute; inset:0; width:100%; height:100%;}
.content{flex:1; overflow-y:auto; padding:22px 26px 40px;}

.grid{display:grid; gap:16px;}
.g2{grid-template-columns:repeat(2,1fr);} .g3{grid-template-columns:repeat(3,1fr);} .g4{grid-template-columns:repeat(4,1fr);}
.g23{grid-template-columns:3fr 2fr;} .g32{grid-template-columns:2fr 3fr;}
@media (max-width:1100px){ .g4{grid-template-columns:repeat(2,1fr);} .g3{grid-template-columns:repeat(2,1fr);} .g23,.g32{grid-template-columns:1fr;} }
@media (max-width:640px){ .g4,.g3,.g2{grid-template-columns:1fr;} }

.card{background:var(--papel); border:1px solid var(--linha); border-radius:12px; padding:18px; box-shadow:var(--sombra);}
.card-cab{display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:14px;}
.card-tit{font-family:'Archivo'; font-weight:700; font-stretch:108%; font-size:14.5px; display:flex; align-items:center; gap:8px;}
.card-tit svg{color:var(--ouro2);}
.card-sub{font-size:12px; color:var(--tinta2); margin-top:2px;}

.kpi-rot{font-size:11.5px; color:var(--tinta2); text-transform:uppercase; letter-spacing:.07em; font-weight:600;
  display:flex; align-items:center; gap:7px;}
.kpi-rot svg{color:var(--ouro2);}
.kpi-num{font-family:'Spline Sans Mono'; font-weight:600; font-size:24px; margin-top:8px; letter-spacing:-.02em;}
.kpi-sub{font-size:12px; color:var(--tinta2); margin-top:4px; display:flex; align-items:center; gap:5px;}
.pos{color:var(--ok);} .neg{color:var(--crit);}
.mono{font-family:'Spline Sans Mono'; font-weight:500;}

.tbl-wrap{overflow-x:auto;}
.tbl{width:100%; border-collapse:collapse; font-size:13.5px;}
.tbl th{text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.07em; color:var(--tinta2);
  font-weight:700; padding:8px 10px; border-bottom:2px solid var(--linha); white-space:nowrap;}
.tbl td{padding:9px 10px; border-bottom:1px solid var(--linha); vertical-align:middle;}
.tbl tr:last-child td{border-bottom:none;}
.tbl .num{text-align:right; font-family:'Spline Sans Mono'; font-size:13px; white-space:nowrap;}
.tbl th.num{font-family:'Instrument Sans';}
.tbl tr.total td{font-weight:700; border-top:2px solid var(--linha); background:#F4F7F2;}

.badge{display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:700; padding:3px 9px;
  border-radius:99px; white-space:nowrap;}
.b-ok{background:#E3F1E7; color:var(--ok);} .b-warn{background:#F8ECD4; color:var(--warn);}
.b-crit{background:#F9E2DC; color:var(--crit);} .b-info{background:#E2ECF3; color:var(--azul);}
.b-muted{background:#ECEFEA; color:var(--tinta2);}
.dot{width:9px; height:9px; border-radius:50%; display:inline-block; flex-shrink:0;}

.btn{display:inline-flex; align-items:center; gap:7px; border-radius:9px; font-size:13px; font-weight:600;
  padding:8px 14px; border:1px solid var(--linha); background:var(--papel); color:var(--tinta); transition:.15s;}
.btn:hover{border-color:var(--rio2); background:#F2F6F0;}
.btn-pri{background:var(--rio); border-color:var(--rio); color:#FFF;}
.btn-pri:hover{background:var(--rio2); border-color:var(--rio2);}
.btn-ouro{background:var(--ouro); border-color:var(--ouro); color:var(--rio3);}
.btn-ouro:hover{background:#C69417;}
.btn-sm{padding:5px 10px; font-size:12px; border-radius:7px;}
.btn-x{border:none; background:transparent; color:var(--tinta2); padding:4px; border-radius:6px;}
.btn-x:hover{background:var(--nevoa); color:var(--crit);}
.btn:disabled{opacity:.5; cursor:not-allowed;}

.overlay{position:fixed; inset:0; background:rgba(14,36,31,.55); display:flex; align-items:center;
  justify-content:center; z-index:60; padding:18px; backdrop-filter:blur(2px);}
.modal{background:var(--papel); border-radius:14px; width:100%; max-height:92vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,.3);}
.modal-cab{display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid var(--linha);
  position:sticky; top:0; background:var(--papel); z-index:2;}
.modal-cab h3{font-family:'Archivo'; font-weight:800; font-stretch:110%; font-size:15.5px;}
.modal-corpo{padding:18px 20px 22px;}

.campo{display:flex; flex-direction:column; gap:5px; margin-bottom:12px;}
.campo > span{font-size:12px; font-weight:700; color:var(--tinta2); text-transform:uppercase; letter-spacing:.05em;}
.campo input,.campo select,.campo textarea{border:1px solid var(--linha); border-radius:8px; padding:9px 11px;
  background:#FFF; color:var(--tinta); outline:none;}
.campo input:focus,.campo select:focus,.campo textarea:focus{border-color:var(--ouro); box-shadow:0 0 0 3px rgba(217,165,33,.18);}
.campos-2{display:grid; grid-template-columns:1fr 1fr; gap:0 14px;}

.alerta-item{display:flex; gap:11px; align-items:flex-start; padding:11px 12px; border-radius:10px;
  border:1px solid var(--linha); background:#FBFCFA; margin-bottom:9px;}
.alerta-item svg{flex-shrink:0; margin-top:1px;}
.alerta-item b{font-size:13px; display:block;}
.alerta-item span{font-size:12px; color:var(--tinta2);}
.a-crit{border-left:4px solid var(--crit);} .a-warn{border-left:4px solid var(--warn);} .a-info{border-left:4px solid var(--azul);}

.abas{display:flex; gap:6px; margin-bottom:18px; flex-wrap:wrap;}
.aba{padding:7px 15px; border-radius:99px; border:1px solid var(--linha); background:var(--papel);
  font-size:13px; font-weight:600; color:var(--tinta2);}
.aba.ativa{background:var(--rio); border-color:var(--rio); color:#FFF;}

.tag-esp{display:inline-flex; align-items:center; gap:7px; font-weight:600; font-size:13px;}

.login-pg{min-height:100vh; display:grid; grid-template-columns:1.1fr 1fr;}
@media (max-width:860px){ .login-pg{grid-template-columns:1fr;} .login-hero{display:none;} }
.login-hero{background:linear-gradient(165deg,#1C443B 0%,#14302A 45%,#0E241F 100%); color:#EAF1EB;
  padding:56px 52px; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden;}
.login-hero .ondas{position:absolute; left:0; right:0; bottom:0; opacity:.5;}
.hero-marca .wordmark{font-size:44px; color:#FFF; line-height:1.05;}
.hero-marca .wordmark em{font-style:normal; color:var(--ouro);}
.hero-marca .regua{max-width:420px; margin:14px 0 10px;}
.hero-marca .wordmark-sub{color:#A8BFB3; font-size:10.5px;}
.hero-desc{max-width:430px; font-size:15px; line-height:1.65; color:#C9D8CE; margin-top:26px;}
.hero-stats{display:flex; gap:34px; position:relative; z-index:2;}
.hero-stats b{display:block; font-family:'Spline Sans Mono'; font-size:22px; color:var(--ouro);}
.hero-stats span{font-size:11.5px; color:#A8BFB3; text-transform:uppercase; letter-spacing:.08em;}
.login-lado{display:flex; align-items:center; justify-content:center; padding:36px; background:var(--nevoa);}
.login-card{width:100%; max-width:400px;}
.login-card h2{font-family:'Archivo'; font-weight:800; font-stretch:112%; font-size:22px; margin-bottom:4px;}
.login-card > p{color:var(--tinta2); font-size:13.5px; margin-bottom:22px;}
.senha-wrap{position:relative;}
.senha-wrap button{position:absolute; right:8px; top:50%; transform:translateY(-50%); border:none; background:none; color:var(--tinta2); padding:4px;}
.erro-login{background:#F9E2DC; color:var(--crit); font-size:13px; font-weight:600; padding:10px 12px; border-radius:9px; margin-bottom:12px;}
.perfil-demo{display:flex; gap:8px; flex-wrap:wrap; margin-top:18px;}
.perfil-demo button{font-size:12px; padding:6px 11px; border-radius:99px; border:1px dashed #B8C6BA; background:#F5F8F3; color:var(--tinta2); font-weight:600;}
.perfil-demo button:hover{border-color:var(--ouro); color:var(--ouro2);}

.print-area{background:#FFF; border:1px solid var(--linha); border-radius:12px; padding:34px 38px; box-shadow:var(--sombra);}
.rel-cab{display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px double var(--rio); padding-bottom:14px; margin-bottom:6px;}
.rel-cab .wordmark{font-size:20px; color:var(--rio);}
.rel-bloco{margin-top:26px;}
.rel-bloco h3{font-family:'Archivo'; font-weight:800; font-stretch:112%; font-size:14px; text-transform:uppercase;
  letter-spacing:.06em; border-left:4px solid var(--ouro); padding-left:10px; margin-bottom:10px;}
.rel-nota{font-size:11.5px; color:var(--tinta2); margin-top:8px; font-style:italic;}
@media print{
  body *{visibility:hidden;}
  .print-area,.print-area *{visibility:visible;}
  .print-area{position:absolute; inset:0; width:100%; border:none; box-shadow:none; border-radius:0; padding:10px;}
}

.vazio{padding:26px; text-align:center; color:var(--tinta2); font-size:13.5px;}
.link-lote{background:none; border:none; color:var(--rio); font-weight:700; font-size:13.5px; text-decoration:underline; text-underline-offset:3px; padding:0;}
.link-lote:hover{color:var(--ouro2);}
`;

const STYLE_EXTRA = `
.tela-carrega{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:var(--nevoa);}
.tela-carrega .wordmark{font-size:26px;color:var(--rio);}
.spin{width:26px;height:26px;border:3px solid var(--linha);border-top-color:var(--ouro);border-radius:50%;animation:gira 1s linear infinite;}
@keyframes gira{to{transform:rotate(360deg);}}
.erro-global{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:99;background:var(--crit);color:#FFF;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:90vw;}
.erro-box{background:#F9E2DC;color:var(--crit);font-size:13px;font-weight:600;padding:9px 12px;border-radius:9px;margin-bottom:12px;}
.aviso-box{background:#E3F1E7;color:var(--ok);font-size:13px;font-weight:600;padding:9px 12px;border-radius:9px;margin-bottom:12px;}
.link-acao{background:none;border:none;color:var(--rio);font-weight:600;font-size:12.5px;text-decoration:underline;text-underline-offset:3px;padding:0;}
.link-acao:hover{color:var(--ouro2);}
`;

/* ---------------- utilitários ---------------- */
const BRL = (v) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const NUM = (v, d = 0) => (v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const nm = (v) => (v == null ? 0 : Number(v));
const dataBR = (iso) => { if (!iso) return "—"; const [a, m, d] = String(iso).slice(0, 10).split("-"); return `${d}/${m}/${a}`; };
const HOJE = new Date();
const hojeISO = HOJE.toISOString().slice(0, 10);
const diasAte = (iso) => Math.ceil((new Date(iso + "T12:00:00") - HOJE) / 86400000);
const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const msgErro = (e) => {
  const m = (e?.message || String(e || "")).toLowerCase();
  if (m.includes("row-level security") || m.includes("policy")) return "Seu perfil não tem permissão para esta ação.";
  if (m.includes("duplicate key")) return "Já existe um registro com esses dados.";
  if (m.includes("failed to fetch") || m.includes("networkerror")) return "Sem conexão com o servidor. Verifique a internet.";
  return e?.message || "Erro inesperado.";
};

/* ---------------- perfis e módulos ---------------- */
const PAPEIS = { administrador: "Administrador", contador: "Contador", cooperado: "Cooperado" };

const MODULOS = [
  { id: "dashboard", rotulo: "Painel geral", Icone: LayoutDashboard },
  { id: "producao", rotulo: "Produção", Icone: Fish },
  { id: "financeiro", rotulo: "Financeiro", Icone: Wallet },
  { id: "socios", rotulo: "Sócios", Icone: Users },
  { id: "documentos", rotulo: "Documentos", Icone: FileText },
  { id: "estoque", rotulo: "Estoque", Icone: Package },
  { id: "balanco", rotulo: "Balanço patrimonial", Icone: Scale },
  { id: "funcionarios", rotulo: "Funcionários", Icone: HardHat },
  { id: "relatorios", rotulo: "Relatórios", Icone: FileBarChart },
];

const ACESSO = {
  administrador: MODULOS.map((m) => m.id),
  contador: ["dashboard", "financeiro", "socios", "documentos", "estoque", "balanco", "funcionarios", "relatorios"],
  cooperado: ["dashboard", "producao", "socios", "documentos", "relatorios"],
};

const CATEGORIAS_DOC = { institucional: "Institucional", atas: "Atas", licencas_alvaras: "Licenças e alvarás" };
const CATEGORIA_DOC_ENUM = Object.fromEntries(Object.entries(CATEGORIAS_DOC).map(([k, v]) => [v, k]));

/* ---------------- adaptadores: linha do banco → forma da tela ---------------- */
const adSocio = (r) => ({
  id: r.id, nome: r.nome, cpf: r.cpf || "—", comunidade: r.comunidade || "—",
  telefone: r.telefone || "—", adesao: r.data_adesao, cotas: nm(r.cotas),
  cargo: r.cargo || "", status: r.status === "ativo" ? "Ativo" : "Desligado",
});
const adDocumento = (r) => ({
  id: r.id, titulo: r.titulo, categoria: CATEGORIAS_DOC[r.categoria] || r.categoria,
  orgao: r.orgao || "—", emissao: r.data_emissao, vencimento: r.data_vencimento, arquivo_path: r.arquivo_path,
});
const adLancamento = (r) => ({ id: r.id, data: r.data, desc: r.descricao, categoria: r.categoria, tipo: r.tipo, valor: nm(r.valor) });
const adTitulo = (r) => ({
  id: r.id, tipo: r.tipo, desc: r.descricao, contraparte: r.contraparte || "—",
  credor: r.contraparte || "—", cliente: r.contraparte || "—", valor: nm(r.valor),
  venc: r.vencimento, status: r.status === "pendente" ? "pendente" : r.tipo === "pagar" ? "pago" : "recebido",
});
const adEstoque = (r) => ({ id: r.id, item: r.item, unidade: r.unidade, qtd: nm(r.quantidade), minimo: nm(r.minimo), custo: nm(r.custo_unitario) });
const adFuncionario = (r) => ({ id: r.id, nome: r.nome, cargo: r.cargo || "—", admissao: r.data_admissao, salario: nm(r.salario) });
const adTanque = (r) => ({ id: r.id, volume: nm(r.volume_m3), dim: r.dimensoes || "—", local: r.local || "—", manutencao: r.em_manutencao });
const adLote = (r) => ({
  id: r.id, especie: r.especies?.nome || "—", tanque: r.tanque_id, alevinos: nm(r.quantidade_alevinos),
  dataPovoamento: r.data_povoamento, pesoInicial: nm(r.peso_inicial_g), custoAlevinos: nm(r.custo_alevinos),
  status: r.status === "ativo" ? "Ativo" : "Finalizado", dataDespesca: r.data_despesca,
  receitaDespesca: r.receita_despesca == null ? null : nm(r.receita_despesca),
});
const adBiometria = (r) => ({ id: r.id, lote: r.lote_id, data: r.data, peso: nm(r.peso_medio_g), amostra: nm(r.amostra) });
const adAlimentacao = (r) => ({ id: r.id, lote: r.lote_id, data: r.data, racao: r.racao, kg: nm(r.quantidade_kg) });
const adMortalidade = (r) => ({ id: r.id, lote: r.lote_id, data: r.data, qtd: nm(r.quantidade), causa: r.causa || "Não identificada" });
const adFluxo = (r) => {
  const d = new Date(String(r.mes).slice(0, 10) + "T12:00:00");
  const rot = MESES_ABREV[d.getMonth()] + (d.getFullYear() !== HOJE.getFullYear() ? "/" + String(d.getFullYear()).slice(2) : "");
  return { mes: rot, receitas: nm(r.receitas), despesas: nm(r.despesas) };
};

/* ---------------- carga de dados ---------------- */
async function buscarTudo() {
  const q = (p) => p.then(({ data, error }) => { if (error) throw error; return data || []; });

  const [
    especiesRows, parametrosRows, sociosRows, abertasRows, documentosRows,
    lancRows, titulosRows, estoqueRows, funcRows, tanquesRows,
    lotesRows, indRows, bioRows, aliRows, morRows, fluxoRows,
  ] = await Promise.all([
    q(supabase.from("especies").select("*").order("id")),
    q(supabase.from("parametros").select("*")),
    q(supabase.from("socios").select("*").order("nome")),
    q(supabase.from("mensalidades").select("*").eq("status", "aberta").order("competencia")),
    q(supabase.from("documentos").select("*")),
    q(supabase.from("lancamentos").select("*").order("data", { ascending: false }).order("criado_em", { ascending: false }).limit(300)),
    q(supabase.from("titulos").select("*").order("vencimento")),
    q(supabase.from("estoque_itens").select("*").eq("ativo", true).order("item")),
    q(supabase.from("funcionarios").select("*").eq("ativo", true).order("nome")),
    q(supabase.from("tanques").select("*").eq("ativo", true).order("id")),
    q(supabase.from("lotes").select("*, especies(nome)").order("data_povoamento")),
    q(supabase.from("v_indicadores_lote").select("*")),
    q(supabase.from("biometrias").select("*").order("data")),
    q(supabase.from("alimentacoes").select("*").order("data", { ascending: false }).limit(400)),
    q(supabase.from("mortalidades").select("*").order("data", { ascending: false }).limit(400)),
    q(supabase.from("v_fluxo_mensal").select("*")),
  ]);

  // parâmetros e espécies alimentam as constantes do módulo
  const PAR = {};
  parametrosRows.forEach((p) => { PAR[p.chave] = nm(p.valor); });
  VALOR_COTA = PAR.valor_cota || VALOR_COTA;
  MENSALIDADE = PAR.mensalidade || MENSALIDADE;
  ENCARGOS = PAR.encargos_folha || ENCARGOS;
  ESPECIES = {};
  especiesRows.forEach((e) => { ESPECIES[e.nome] = { id: e.id, cor: e.cor_hex || "#5F7069", preco: nm(e.preco_kg) }; });

  const socios = sociosRows.map((r) => ({
    ...adSocio(r),
    mensalidadeEmDia: !abertasRows.some((m) => m.socio_id === r.id),
  }));

  const titulos = titulosRows.map(adTitulo);
  const saldo = fluxoRows.reduce((s, r) => s + nm(r.receitas) - nm(r.despesas), 0);

  return {
    socios,
    mensalidadesAbertas: abertasRows,
    documentos: documentosRows.map(adDocumento),
    lancamentos: lancRows.map(adLancamento),
    pagar: titulos.filter((t) => t.tipo === "pagar"),
    receber: titulos.filter((t) => t.tipo === "receber"),
    estoque: estoqueRows.map(adEstoque),
    funcionarios: funcRows.map(adFuncionario),
    tanques: tanquesRows.map(adTanque),
    lotes: lotesRows.map(adLote),
    indicadoresRows: indRows,
    biometrias: bioRows.map(adBiometria),
    alimentacao: aliRows.map(adAlimentacao),
    mortalidade: morRows.map(adMortalidade),
    fluxo: fluxoRows.map(adFluxo),
    saldo,
  };
}

/* ================================================================
   COMPONENTES DE INTERFACE
   ================================================================ */
function Badge({ tom = "muted", children }) {
  return <span className={"badge b-" + tom}>{children}</span>;
}

function Kpi({ Icone, rotulo, valor, sub, subTom }) {
  return (
    <div className="card">
      <div className="kpi-rot">{Icone && <Icone size={15} />} {rotulo}</div>
      <div className="kpi-num">{valor}</div>
      {sub && <div className={"kpi-sub " + (subTom || "")}>{sub}</div>}
    </div>
  );
}

function Modal({ titulo, onFechar, children, largura = 480 }) {
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="modal" style={{ maxWidth: largura }}>
        <div className="modal-cab">
          <h3>{titulo}</h3>
          <button className="btn-x" onClick={onFechar} aria-label="Fechar"><X size={17} /></button>
        </div>
        <div className="modal-corpo">{children}</div>
      </div>
    </div>
  );
}

function Campo({ rotulo, children }) {
  return (
    <label className="campo">
      <span>{rotulo}</span>
      {children}
    </label>
  );
}

function TagEspecie({ especie }) {
  const cor = ESPECIES[especie]?.cor || "#888";
  return (
    <span className="tag-esp">
      <span className="dot" style={{ background: cor }} /> {especie}
    </span>
  );
}

function BadgeVencimento({ vencimento }) {
  if (!vencimento) return <Badge tom="muted">Sem vencimento</Badge>;
  const d = diasAte(vencimento);
  if (d < 0) return <Badge tom="crit"><AlertTriangle size={11} /> Vencido há {Math.abs(d)} d</Badge>;
  if (d <= 30) return <Badge tom="crit"><AlertTriangle size={11} /> Vence em {d} d</Badge>;
  if (d <= 90) return <Badge tom="warn">Vence em {d} d</Badge>;
  return <Badge tom="ok">Vigente · {d} d</Badge>;
}

function Waterline() {
  return (
    <div className="waterline" aria-hidden="true">
      <svg viewBox="0 0 1200 14" preserveAspectRatio="none">
        <path d="M0,7 C60,1 120,13 180,7 C240,1 300,13 360,7 C420,1 480,13 540,7 C600,1 660,13 720,7 C780,1 840,13 900,7 C960,1 1020,13 1080,7 C1140,1 1200,13 1260,7 L1260,14 L0,14 Z"
          fill="#EDF1EA" stroke="none" />
        <path d="M0,7 C60,1 120,13 180,7 C240,1 300,13 360,7 C420,1 480,13 540,7 C600,1 660,13 720,7 C780,1 840,13 900,7 C960,1 1020,13 1080,7 C1140,1 1200,13 1260,7"
          fill="none" stroke="#D9A521" strokeWidth="1.6" opacity="0.8" />
      </svg>
    </div>
  );
}

function OndasHero() {
  return (
    <svg className="ondas" viewBox="0 0 600 160" preserveAspectRatio="none" style={{ height: 160, width: "100%" }} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i}
          d={`M0,${30 + i * 28} C50,${18 + i * 28} 100,${42 + i * 28} 150,${30 + i * 28} C200,${18 + i * 28} 250,${42 + i * 28} 300,${30 + i * 28} C350,${18 + i * 28} 400,${42 + i * 28} 450,${30 + i * 28} C500,${18 + i * 28} 550,${42 + i * 28} 600,${30 + i * 28}`}
          fill="none" stroke="#D9A521" strokeWidth="1.2" opacity={0.5 - i * 0.08} />
      ))}
    </svg>
  );
}

/* ---------------- telas de acesso ---------------- */
function TelaCarregando({ texto = "Carregando dados da cooperativa…" }) {
  return (
    <div className="tela-carrega">
      <style>{STYLE + STYLE_EXTRA}</style>
      <div className="wordmark">COOPATA</div>
      <span className="regua" style={{ maxWidth: 180 }} />
      <div className="spin" />
      <div style={{ fontSize: 13.5, color: "var(--tinta2)" }}>{texto}</div>
    </div>
  );
}

function Login({ aoEntrar, avisoExterno }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [entrando, setEntrando] = useState(false);

  const entrar = async () => {
    setErro(""); setAviso("");
    if (!email.trim() || !senha) { setErro("Informe o e-mail e a senha."); return; }
    setEntrando(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEntrando(false);
    if (error) { setErro("E-mail ou senha incorretos."); return; }
    aoEntrar(data.user);
  };

  const recuperar = async () => {
    setErro(""); setAviso("");
    if (!email.trim()) { setErro("Digite seu e-mail no campo acima para recuperar a senha."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) setErro("Não foi possível enviar o e-mail de recuperação.");
    else setAviso("Enviamos um link de redefinição de senha para o seu e-mail.");
  };

  const ESPECIES_HERO = [
    ["Tambaqui", "#D9A521"], ["Matrinxã", "#E8C877"],
    ["Pirapitinga", "#9FC3D8"], ["Tambatinga", "#C79A6B"],
  ];

  return (
    <div className="login-pg">
      <style>{STYLE + STYLE_EXTRA}</style>
      <div className="login-hero">
        <div className="hero-marca">
          <div className="wordmark">COOPA<em>TA</em></div>
          <span className="regua" />
          <div className="wordmark-sub">Cooperativa de Piscicultura · Santarém · Pará</div>
          <p className="hero-desc">
            Gestão completa da produção em tanques-rede no rio Amazonas: sócios, licenças,
            finanças, estoque e indicadores zootécnicos — agora com dados permanentes e
            acesso individual por senha.
          </p>
        </div>
        <div className="hero-stats">
          {ESPECIES_HERO.map(([nome, cor]) => (
            <div key={nome}>
              <b style={{ color: cor, fontSize: 17 }}>●</b>
              <span>{nome}</span>
            </div>
          ))}
        </div>
        <OndasHero />
      </div>

      <div className="login-lado">
        <div className="login-card">
          <h2>Entrar no sistema</h2>
          <p>Acesso restrito a cooperados, contabilidade e administração.</p>
          {(erro || avisoExterno) && <div className="erro-login">{erro || avisoExterno}</div>}
          {aviso && <div className="aviso-box">{aviso}</div>}
          <Campo rotulo="E-mail">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@exemplo.com" autoFocus />
          </Campo>
          <Campo rotulo="Senha">
            <div className="senha-wrap">
              <input type={mostrar ? "text" : "password"} value={senha} style={{ width: "100%" }}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && entrar()} placeholder="••••••••" />
              <button onClick={() => setMostrar(!mostrar)} aria-label="Mostrar senha">
                {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Campo>
          <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center", padding: "11px" }}
            onClick={entrar} disabled={entrando}>
            <Lock size={15} /> {entrando ? "Entrando…" : "Acessar"}
          </button>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <button className="link-acao" onClick={recuperar}>Esqueci minha senha</button>
            <span style={{ fontSize: 11.5, color: "var(--tinta2)", textAlign: "right" }}>
              Contas são criadas pela administração
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   PAINEL GERAL (DASHBOARD)
   ================================================================ */
function Dashboard({ dados, indicadores }) {
  const { lotes, documentos, estoque, socios, pagar, receber, fluxo, saldo, mensalidadesAbertas } = dados;
  const ativos = lotes.filter((l) => l.status === "Ativo" && indicadores[l.id]);
  const biomassaTotal = ativos.reduce((s, l) => s + indicadores[l.id].biomassa, 0);
  const valorBiomassa = ativos.reduce((s, l) => s + indicadores[l.id].valorMercado, 0);
  const sobrevMedia = ativos.length ? ativos.reduce((s, l) => s + indicadores[l.id].sobrevivencia, 0) / ativos.length : 0;
  const totReceber = receber.filter((c) => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const totPagar = pagar.filter((c) => c.status === "pendente").reduce((s, c) => s + c.valor, 0);

  const docsVencendo = documentos.filter((d) => d.vencimento && diasAte(d.vencimento) <= 90)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const estoqueBaixo = estoque.filter((e) => e.qtd < e.minimo);
  const inadimplentes = socios.filter((s) => s.status === "Ativo" && !s.mensalidadeEmDia);
  const valorAbertas = mensalidadesAbertas.reduce((s, m) => s + nm(m.valor), 0);
  const contasUrgentes = pagar.filter((c) => c.status === "pendente" && diasAte(c.venc) <= 7);
  const totalAlertas = docsVencendo.length + estoqueBaixo.length + (inadimplentes.length ? 1 : 0) + contasUrgentes.length;

  const dadosPizza = Object.keys(ESPECIES).map((esp) => ({
    name: esp,
    value: Math.round(ativos.filter((l) => l.especie === esp).reduce((s, l) => s + indicadores[l.id].biomassa, 0)),
  })).filter((d) => d.value > 0);

  const dadosBarras = ativos.map((l) => ({ nome: l.id, kg: Math.round(indicadores[l.id].biomassa), cor: ESPECIES[l.especie]?.cor || "#1F4B42" }));

  return (
    <div>
      <div className="grid g4">
        <Kpi Icone={CircleDollarSign} rotulo="Saldo em caixa" valor={BRL(saldo)}
          sub={<><ArrowUpRight size={13} className="pos" /> {BRL(totReceber)} a receber em aberto</>} />
        <Kpi Icone={Fish} rotulo="Biomassa no rio" valor={NUM(biomassaTotal) + " kg"}
          sub={"≈ " + BRL(valorBiomassa) + " a preço de mercado"} />
        <Kpi Icone={ArrowDownRight} rotulo="Contas a pagar (aberto)" valor={BRL(totPagar)}
          sub={contasUrgentes.length ? contasUrgentes.length + " venc. nos próximos 7 dias" : "Nada vence esta semana"}
          subTom={contasUrgentes.length ? "neg" : "pos"} />
        <Kpi Icone={AlertTriangle} rotulo="Alertas ativos" valor={String(totalAlertas)}
          sub={"Sobrevivência média dos lotes: " + NUM(sobrevMedia, 1) + "%"} />
      </div>

      <div className="grid g23" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-cab">
            <div>
              <div className="card-tit"><TrendingUp size={16} /> Fluxo de caixa</div>
              <div className="card-sub">Receitas × despesas registradas por mês (mês corrente parcial)</div>
            </div>
          </div>
          <div style={{ height: 250 }}>
            {fluxo.length === 0 ? <div className="vazio">Ainda não há lançamentos registrados.</div> : (
              <ResponsiveContainer>
                <AreaChart data={fluxo} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1F4B42" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#1F4B42" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="gDes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B3402A" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#B3402A" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE5DC" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => NUM(v / 1000) + " mil"} width={52} />
                  <Tooltip formatter={(v, n) => [BRL(v), n === "receitas" ? "Receitas" : "Despesas"]} />
                  <Area type="monotone" dataKey="receitas" stroke="#1F4B42" strokeWidth={2.2} fill="url(#gRec)" name="receitas" />
                  <Area type="monotone" dataKey="despesas" stroke="#B3402A" strokeWidth={2.2} fill="url(#gDes)" name="despesas" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-cab">
            <div>
              <div className="card-tit"><Fish size={16} /> Biomassa por espécie</div>
              <div className="card-sub">Lotes ativos, estimativa atual (kg)</div>
            </div>
          </div>
          <div style={{ height: 250 }}>
            {dadosPizza.length === 0 ? <div className="vazio">Nenhum lote ativo no momento.</div> : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={dadosPizza} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={2}>
                    {dadosPizza.map((d) => <Cell key={d.name} fill={ESPECIES[d.name]?.cor || "#5F7069"} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [NUM(v) + " kg", n]} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid g32" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-cab">
            <div>
              <div className="card-tit"><AlertTriangle size={16} /> Alertas e pendências</div>
              <div className="card-sub">Licenças, estoque, mensalidades e vencimentos</div>
            </div>
          </div>
          {totalAlertas === 0 && <div className="vazio">Nenhum alerta no momento. Tudo em dia.</div>}
          {docsVencendo.map((d) => {
            const dd = diasAte(d.vencimento);
            return (
              <div key={"doc" + d.id} className={"alerta-item " + (dd <= 30 ? "a-crit" : "a-warn")}>
                <FileText size={17} color={dd <= 30 ? "#B3402A" : "#B57A10"} />
                <div><b>{d.titulo}</b><span>{d.orgao} · vence em {dataBR(d.vencimento)} ({dd} dias) — providenciar renovação</span></div>
              </div>
            );
          })}
          {contasUrgentes.map((c) => (
            <div key={"cp" + c.id} className="alerta-item a-crit">
              <Wallet size={17} color="#B3402A" />
              <div><b>{c.desc} — {BRL(c.valor)}</b><span>{c.credor} · vence em {dataBR(c.venc)}</span></div>
            </div>
          ))}
          {estoqueBaixo.map((e) => (
            <div key={"es" + e.id} className="alerta-item a-warn">
              <Package size={17} color="#B57A10" />
              <div><b>{e.item}</b><span>Estoque em {NUM(e.qtd)} {e.unidade}(s) — mínimo de {NUM(e.minimo)} · programar compra</span></div>
            </div>
          ))}
          {inadimplentes.length > 0 && (
            <div className="alerta-item a-info">
              <Users size={17} color="#4A7C9B" />
              <div>
                <b>{inadimplentes.length} sócio(s) com mensalidade em aberto</b>
                <span>{inadimplentes.map((s) => s.nome.split(" ").slice(0, 2).join(" ")).join(", ")} — total de {BRL(valorAbertas)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-cab">
            <div>
              <div className="card-tit"><Waves size={16} /> Biomassa por lote</div>
              <div className="card-sub">Estimativa atual dos lotes em cultivo (kg)</div>
            </div>
          </div>
          <div style={{ height: 232 }}>
            {dadosBarras.length === 0 ? <div className="vazio">Nenhum lote ativo.</div> : (
              <ResponsiveContainer>
                <BarChart data={dadosBarras} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE5DC" vertical={false} />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={44} />
                  <Tooltip formatter={(v) => [NUM(v) + " kg", "Biomassa"]} />
                  <Bar dataKey="kg" radius={[5, 5, 0, 0]} maxBarSize={38}>
                    {dadosBarras.map((d) => <Cell key={d.nome} fill={d.cor} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SÓCIOS
   ================================================================ */
function Socios({ dados, podeEditar, agir }) {
  const { socios } = dados;
  const [modal, setModal] = useState(false);
  const [f, setF] = useState({ nome: "", cpf: "", comunidade: "", telefone: "", cotas: 20, adesao: hojeISO });
  const [erroM, setErroM] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [avisoGeral, setAvisoGeral] = useState("");

  const ativos = socios.filter((s) => s.status === "Ativo");
  const capitalTotal = socios.reduce((s, x) => s + x.cotas * VALOR_COTA, 0);
  const emDia = ativos.filter((s) => s.mensalidadeEmDia).length;

  const salvar = async () => {
    if (!f.nome.trim()) { setErroM("Informe o nome do sócio."); return; }
    setSalvando(true);
    const e = await agir.salvarSocio(f);
    setSalvando(false);
    if (e) { setErroM(e); return; }
    setModal(false);
    setF({ nome: "", cpf: "", comunidade: "", telefone: "", cotas: 20, adesao: hojeISO });
  };

  const gerar = async () => {
    setGerando(true); setAvisoGeral("");
    const e = await agir.gerarMensalidades();
    setGerando(false);
    setAvisoGeral(e ? e : "Mensalidades do mês geradas para os sócios ativos.");
  };

  const baixar = async (s) => {
    setAvisoGeral("");
    const e = await agir.baixarMensalidade(s);
    if (e) setAvisoGeral(e);
  };

  return (
    <div>
      <div className="grid g3">
        <Kpi Icone={Users} rotulo="Sócios ativos" valor={String(ativos.length)} sub={"Cota-parte de " + BRL(VALOR_COTA)} />
        <Kpi Icone={CircleDollarSign} rotulo="Capital social integralizado" valor={BRL(capitalTotal)} sub={NUM(socios.reduce((s, x) => s + x.cotas, 0)) + " cotas subscritas"} />
        <Kpi Icone={CheckCircle2} rotulo="Mensalidades" valor={emDia + " / " + ativos.length} sub={BRL(MENSALIDADE) + " por sócio · " + (ativos.length - emDia) + " em aberto"} subTom={ativos.length - emDia > 0 ? "neg" : "pos"} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-cab">
          <div>
            <div className="card-tit"><Users size={16} /> Quadro social</div>
            <div className="card-sub">Cadastro, capital integralizado e situação das mensalidades</div>
          </div>
          {podeEditar && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-sm" onClick={gerar} disabled={gerando}>
                <RefreshCw size={13} /> {gerando ? "Gerando…" : "Gerar mensalidades do mês"}
              </button>
              <button className="btn btn-pri btn-sm" onClick={() => { setErroM(""); setModal(true); }}><Plus size={14} /> Novo sócio</button>
            </div>
          )}
        </div>
        {avisoGeral && <div className={avisoGeral.startsWith("Mensalidades") ? "aviso-box" : "erro-box"}>{avisoGeral}</div>}
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>Sócio</th><th>Comunidade</th><th>Adesão</th><th className="num">Cotas</th>
              <th className="num">Capital</th><th>Mensalidade</th><th>Situação</th>{podeEditar && <th></th>}
            </tr></thead>
            <tbody>
              {socios.map((s) => (
                <tr key={s.id}>
                  <td>
                    <b>{s.nome}</b>
                    <div style={{ fontSize: 11.5, color: "var(--tinta2)" }}>{s.cpf} · {s.telefone}{s.cargo ? " · " + s.cargo : ""}</div>
                  </td>
                  <td>{s.comunidade}</td>
                  <td>{dataBR(s.adesao)}</td>
                  <td className="num">{NUM(s.cotas)}</td>
                  <td className="num">{BRL(s.cotas * VALOR_COTA)}</td>
                  <td>{s.mensalidadeEmDia ? <Badge tom="ok">Em dia</Badge> : <Badge tom="crit">Em aberto</Badge>}</td>
                  <td><Badge tom={s.status === "Ativo" ? "info" : "muted"}>{s.status}</Badge></td>
                  {podeEditar && (
                    <td>{!s.mensalidadeEmDia &&
                      <button className="btn btn-sm" onClick={() => baixar(s)}><CheckCircle2 size={13} /> Baixar</button>}
                    </td>
                  )}
                </tr>
              ))}
              <tr className="total">
                <td colSpan={3}>Total</td>
                <td className="num">{NUM(socios.reduce((s, x) => s + x.cotas, 0))}</td>
                <td className="num">{BRL(capitalTotal)}</td>
                <td colSpan={podeEditar ? 3 : 2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal titulo="Cadastrar novo sócio" onFechar={() => setModal(false)}>
          {erroM && <div className="erro-box">{erroM}</div>}
          <Campo rotulo="Nome completo"><input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Campo>
          <div className="campos-2">
            <Campo rotulo="CPF"><input value={f.cpf} onChange={(e) => setF({ ...f, cpf: e.target.value })} placeholder="000.000.000-00" /></Campo>
            <Campo rotulo="Telefone"><input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} placeholder="(93) 9…" /></Campo>
            <Campo rotulo="Comunidade"><input value={f.comunidade} onChange={(e) => setF({ ...f, comunidade: e.target.value })} /></Campo>
            <Campo rotulo="Data de adesão"><input type="date" value={f.adesao} onChange={(e) => setF({ ...f, adesao: e.target.value })} /></Campo>
            <Campo rotulo={"Cotas subscritas (" + BRL(VALOR_COTA) + " cada)"}><input type="number" min="1" value={f.cotas} onChange={(e) => setF({ ...f, cotas: e.target.value })} /></Campo>
            <Campo rotulo="Capital integralizado"><input disabled value={BRL((Number(f.cotas) || 0) * VALOR_COTA)} /></Campo>
          </div>
          <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar sócio"}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* ================================================================
   DOCUMENTOS E LICENÇAS
   ================================================================ */
function Documentos({ dados, podeEditar, agir }) {
  const { documentos } = dados;
  const [aba, setAba] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [f, setF] = useState({ titulo: "", categoria: "Licenças e alvarás", orgao: "", emissao: hojeISO, vencimento: "" });
  const [arquivo, setArquivo] = useState(null);
  const [erroM, setErroM] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [avisoGeral, setAvisoGeral] = useState("");

  const categorias = ["Todos", "Institucional", "Atas", "Licenças e alvarás"];
  const lista = documentos.filter((d) => aba === "Todos" || d.categoria === aba)
    .sort((a, b) => (a.vencimento || "9999").localeCompare(b.vencimento || "9999"));
  const vencendo = documentos.filter((d) => d.vencimento && diasAte(d.vencimento) <= 90).length;

  const salvar = async () => {
    if (!f.titulo.trim()) { setErroM("Informe o título do documento."); return; }
    setSalvando(true);
    const e = await agir.salvarDocumento(f, arquivo);
    setSalvando(false);
    if (e) { setErroM(e); return; }
    setModal(false); setArquivo(null);
    setF({ titulo: "", categoria: "Licenças e alvarás", orgao: "", emissao: hojeISO, vencimento: "" });
  };

  const abrir = async (doc) => {
    setAvisoGeral("");
    const e = await agir.abrirDocumento(doc);
    if (e) setAvisoGeral(e);
  };

  return (
    <div>
      <div className="grid g3">
        <Kpi Icone={FileText} rotulo="Documentos arquivados" valor={String(documentos.length)} sub="Estatuto, atas, licenças e alvarás" />
        <Kpi Icone={AlertTriangle} rotulo="Vencendo em até 90 dias" valor={String(vencendo)} sub="Renovações a providenciar" subTom={vencendo ? "neg" : "pos"} />
        <Kpi Icone={Calendar} rotulo="Órgãos reguladores" valor="5" sub="SEMAS-PA · ANA · SAP/MAPA · SPU · Prefeitura" />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-cab">
          <div>
            <div className="card-tit"><FileText size={16} /> Arquivo de documentos</div>
            <div className="card-sub">Com aviso automático de vencimento e o PDF guardado no sistema</div>
          </div>
          {podeEditar && <button className="btn btn-pri btn-sm" onClick={() => { setErroM(""); setModal(true); }}><Plus size={14} /> Novo documento</button>}
        </div>
        {avisoGeral && <div className="erro-box">{avisoGeral}</div>}
        <div className="abas">
          {categorias.map((c) => (
            <button key={c} className={"aba " + (aba === c ? "ativa" : "")} onClick={() => setAba(c)}>{c}</button>
          ))}
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Documento</th><th>Categoria</th><th>Órgão</th><th>Emissão</th><th>Vencimento</th><th>Situação</th><th>Arquivo</th></tr></thead>
            <tbody>
              {lista.map((d) => (
                <tr key={d.id}>
                  <td><b>{d.titulo}</b></td>
                  <td>{d.categoria}</td>
                  <td>{d.orgao}</td>
                  <td>{dataBR(d.emissao)}</td>
                  <td>{d.vencimento ? dataBR(d.vencimento) : "—"}</td>
                  <td><BadgeVencimento vencimento={d.vencimento} /></td>
                  <td>
                    {d.arquivo_path
                      ? <button className="btn btn-sm" onClick={() => abrir(d)}><ExternalLink size={12} /> Abrir</button>
                      : <span style={{ fontSize: 12, color: "var(--tinta2)" }}>—</span>}
                  </td>
                </tr>
              ))}
              {lista.length === 0 && <tr><td colSpan={7} className="vazio">Nenhum documento nesta categoria.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal titulo="Arquivar novo documento" onFechar={() => setModal(false)}>
          {erroM && <div className="erro-box">{erroM}</div>}
          <Campo rotulo="Título do documento"><input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="ex.: Ata da AGE de 10/08/2026" /></Campo>
          <div className="campos-2">
            <Campo rotulo="Categoria">
              <select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
                <option>Institucional</option><option>Atas</option><option>Licenças e alvarás</option>
              </select>
            </Campo>
            <Campo rotulo="Órgão emissor"><input value={f.orgao} onChange={(e) => setF({ ...f, orgao: e.target.value })} placeholder="ex.: SEMAS-PA" /></Campo>
            <Campo rotulo="Data de emissão"><input type="date" value={f.emissao} onChange={(e) => setF({ ...f, emissao: e.target.value })} /></Campo>
            <Campo rotulo="Vencimento (se houver)"><input type="date" value={f.vencimento} onChange={(e) => setF({ ...f, vencimento: e.target.value })} /></Campo>
          </div>
          <Campo rotulo="Arquivo PDF (opcional)">
            <input type="file" accept="application/pdf,image/*" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
          </Campo>
          <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={salvar} disabled={salvando}>
            {salvando ? (arquivo ? "Enviando arquivo…" : "Salvando…") : "Arquivar documento"}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* ================================================================
   FINANCEIRO
   ================================================================ */
function Financeiro({ dados, podeEditar, agir }) {
  const { lancamentos, pagar, receber, fluxo, saldo } = dados;
  const [aba, setAba] = useState("lanc");
  const [modal, setModal] = useState(null); // 'lanc' | 'pagar' | 'receber'
  const [f, setF] = useState({});
  const [erroM, setErroM] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [avisoGeral, setAvisoGeral] = useState("");

  const totReceber = receber.filter((c) => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const totPagar = pagar.filter((c) => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const ult = fluxo[fluxo.length - 1] || { mes: "—", receitas: 0, despesas: 0 };

  const abrir = (tipo) => {
    setErroM("");
    setF(tipo === "lanc"
      ? { data: hojeISO, desc: "", categoria: "Vendas", tipo: "receita", valor: "" }
      : { desc: "", contraparte: "", valor: "", venc: hojeISO });
    setModal(tipo);
  };
  const salvar = async () => {
    const v = Number(String(f.valor).replace(",", "."));
    if (!f.desc?.trim() || !v) { setErroM("Preencha a descrição e um valor válido."); return; }
    setSalvando(true);
    let e = null;
    if (modal === "lanc") e = await agir.novoLancamento({ ...f, valor: v });
    if (modal === "pagar") e = await agir.novoTitulo("pagar", { ...f, valor: v });
    if (modal === "receber") e = await agir.novoTitulo("receber", { ...f, valor: v });
    setSalvando(false);
    if (e) { setErroM(e); return; }
    setModal(null);
  };
  const quitar = async (t) => {
    setAvisoGeral("");
    const e = await agir.liquidarTitulo(t);
    if (e) setAvisoGeral(e);
  };

  const TabelaContas = ({ dadosTbl, tipo }) => (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr>
          <th>Descrição</th><th>{tipo === "pagar" ? "Credor" : "Cliente"}</th><th>Vencimento</th>
          <th className="num">Valor</th><th>Situação</th>{podeEditar && <th></th>}
        </tr></thead>
        <tbody>
          {dadosTbl.map((c) => {
            const d = diasAte(c.venc);
            return (
              <tr key={c.id}>
                <td><b>{c.desc}</b></td>
                <td>{tipo === "pagar" ? c.credor : c.cliente}</td>
                <td>{dataBR(c.venc)}</td>
                <td className="num">{BRL(c.valor)}</td>
                <td>
                  {c.status !== "pendente" ? <Badge tom="ok">{tipo === "pagar" ? "Pago" : "Recebido"}</Badge>
                    : d < 0 ? <Badge tom="crit">Atrasado {Math.abs(d)} d</Badge>
                    : d <= 7 ? <Badge tom="warn">Vence em {d} d</Badge>
                    : <Badge tom="info">Em aberto</Badge>}
                </td>
                {podeEditar && (
                  <td>{c.status === "pendente" &&
                    <button className="btn btn-sm" onClick={() => quitar(c)}>
                      <CheckCircle2 size={13} /> {tipo === "pagar" ? "Baixar" : "Receber"}
                    </button>}
                  </td>
                )}
              </tr>
            );
          })}
          {dadosTbl.length === 0 && <tr><td colSpan={podeEditar ? 6 : 5} className="vazio">Nenhum título cadastrado.</td></tr>}
          <tr className="total">
            <td colSpan={3}>Total em aberto</td>
            <td className="num">{BRL(dadosTbl.filter((c) => c.status === "pendente").reduce((s, c) => s + c.valor, 0))}</td>
            <td colSpan={podeEditar ? 2 : 1}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="grid g4">
        <Kpi Icone={CircleDollarSign} rotulo="Saldo em caixa" valor={BRL(saldo)} sub="Somatório dos lançamentos registrados" />
        <Kpi Icone={ArrowUpRight} rotulo="A receber em aberto" valor={BRL(totReceber)} sub={receber.filter((c) => c.status === "pendente").length + " títulos"} subTom="pos" />
        <Kpi Icone={ArrowDownRight} rotulo="A pagar em aberto" valor={BRL(totPagar)} sub={pagar.filter((c) => c.status === "pendente").length + " títulos"} subTom="neg" />
        <Kpi Icone={TrendingUp} rotulo={"Resultado de " + ult.mes} valor={BRL(ult.receitas - ult.despesas)} sub={BRL(ult.receitas) + " − " + BRL(ult.despesas)} subTom={ult.receitas - ult.despesas >= 0 ? "pos" : "neg"} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-cab">
          <div>
            <div className="card-tit"><Wallet size={16} /> Movimento financeiro</div>
            <div className="card-sub">Lançamentos de caixa, contas a pagar e a receber — a baixa de um título já lança no caixa</div>
          </div>
          {podeEditar && (
            <div style={{ display: "flex", gap: 8 }}>
              {aba === "lanc" && <button className="btn btn-pri btn-sm" onClick={() => abrir("lanc")}><Plus size={14} /> Lançamento</button>}
              {aba === "pagar" && <button className="btn btn-pri btn-sm" onClick={() => abrir("pagar")}><Plus size={14} /> Conta a pagar</button>}
              {aba === "receber" && <button className="btn btn-pri btn-sm" onClick={() => abrir("receber")}><Plus size={14} /> Conta a receber</button>}
            </div>
          )}
        </div>
        {avisoGeral && <div className="erro-box">{avisoGeral}</div>}
        <div className="abas">
          <button className={"aba " + (aba === "lanc" ? "ativa" : "")} onClick={() => setAba("lanc")}>Lançamentos de caixa</button>
          <button className={"aba " + (aba === "pagar" ? "ativa" : "")} onClick={() => setAba("pagar")}>Contas a pagar</button>
          <button className={"aba " + (aba === "receber" ? "ativa" : "")} onClick={() => setAba("receber")}>Contas a receber</button>
        </div>

        {aba === "lanc" && (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th className="num">Valor</th></tr></thead>
              <tbody>
                {lancamentos.map((l) => (
                  <tr key={l.id}>
                    <td>{dataBR(l.data)}</td>
                    <td><b>{l.desc}</b></td>
                    <td><Badge tom="muted">{l.categoria}</Badge></td>
                    <td className={"num " + (l.tipo === "receita" ? "pos" : "neg")}>
                      {l.tipo === "receita" ? "+" : "−"} {BRL(l.valor)}
                    </td>
                  </tr>
                ))}
                {lancamentos.length === 0 && <tr><td colSpan={4} className="vazio">Nenhum lançamento — comece registrando o saldo inicial de implantação.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {aba === "pagar" && <TabelaContas dadosTbl={pagar} tipo="pagar" />}
        {aba === "receber" && <TabelaContas dadosTbl={receber} tipo="receber" />}
      </div>

      {modal === "lanc" && (
        <Modal titulo="Novo lançamento de caixa" onFechar={() => setModal(null)}>
          {erroM && <div className="erro-box">{erroM}</div>}
          <div className="campos-2">
            <Campo rotulo="Tipo">
              <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
                <option value="receita">Receita</option><option value="despesa">Despesa</option>
              </select>
            </Campo>
            <Campo rotulo="Data"><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Campo>
          </div>
          <Campo rotulo="Descrição"><input value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="ex.: Venda de tambaqui — feira" /></Campo>
          <div className="campos-2">
            <Campo rotulo="Categoria">
              <select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
                <option>Vendas</option><option>Mensalidades</option><option>Insumos</option><option>Combustível</option>
                <option>Energia</option><option>Pessoal</option><option>Manutenção</option><option>Outros</option>
              </select>
            </Campo>
            <Campo rotulo="Valor (R$)"><input type="number" step="0.01" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></Campo>
          </div>
          <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar lançamento"}
          </button>
        </Modal>
      )}
      {(modal === "pagar" || modal === "receber") && (
        <Modal titulo={modal === "pagar" ? "Nova conta a pagar" : "Nova conta a receber"} onFechar={() => setModal(null)}>
          {erroM && <div className="erro-box">{erroM}</div>}
          <Campo rotulo="Descrição"><input value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} /></Campo>
          <div className="campos-2">
            <Campo rotulo={modal === "pagar" ? "Credor" : "Cliente"}><input value={f.contraparte} onChange={(e) => setF({ ...f, contraparte: e.target.value })} /></Campo>
            <Campo rotulo="Vencimento"><input type="date" value={f.venc} onChange={(e) => setF({ ...f, venc: e.target.value })} /></Campo>
          </div>
          <Campo rotulo="Valor (R$)"><input type="number" step="0.01" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></Campo>
          <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar título"}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* ================================================================
   ESTOQUE
   ================================================================ */
function Estoque({ dados, podeEditar, agir }) {
  const { estoque } = dados;
  const [modal, setModal] = useState(false);
  const [mov, setMov] = useState(null); // {id, tipo, item}
  const [f, setF] = useState({ item: "", unidade: "", qtd: "", minimo: "", custo: "" });
  const [qtdMov, setQtdMov] = useState("");
  const [erroM, setErroM] = useState("");
  const [salvando, setSalvando] = useState(false);

  const valorTotal = estoque.reduce((s, e) => s + e.qtd * e.custo, 0);
  const abaixo = estoque.filter((e) => e.qtd < e.minimo);

  const salvar = async () => {
    if (!f.item.trim()) { setErroM("Informe a descrição do item."); return; }
    setSalvando(true);
    const e = await agir.novoItemEstoque(f);
    setSalvando(false);
    if (e) { setErroM(e); return; }
    setModal(false); setF({ item: "", unidade: "", qtd: "", minimo: "", custo: "" });
  };
  const movimentar = async () => {
    const q = Number(qtdMov);
    if (!q || !mov) { setErroM("Informe uma quantidade válida."); return; }
    setSalvando(true);
    const e = await agir.movimentarEstoque(mov.id, mov.tipo, q);
    setSalvando(false);
    if (e) { setErroM(e); return; }
    setMov(null); setQtdMov("");
  };

  return (
    <div>
      <div className="grid g3">
        <Kpi Icone={Boxes} rotulo="Itens cadastrados" valor={String(estoque.length)} sub="Rações, insumos e materiais" />
        <Kpi Icone={CircleDollarSign} rotulo="Valor do estoque" valor={BRL(valorTotal)} sub="Ao custo médio de aquisição" />
        <Kpi Icone={AlertTriangle} rotulo="Abaixo do mínimo" valor={String(abaixo.length)} sub={abaixo.length ? "Reposição recomendada" : "Níveis adequados"} subTom={abaixo.length ? "neg" : "pos"} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-cab">
          <div>
            <div className="card-tit"><Package size={16} /> Posição de estoque</div>
            <div className="card-sub">Toda entrada e saída fica registrada no histórico de movimentos</div>
          </div>
          {podeEditar && <button className="btn btn-pri btn-sm" onClick={() => { setErroM(""); setModal(true); }}><Plus size={14} /> Novo item</button>}
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>Item</th><th>Unidade</th><th className="num">Quantidade</th><th className="num">Mínimo</th>
              <th className="num">Custo unit.</th><th className="num">Valor total</th><th>Situação</th>{podeEditar && <th></th>}
            </tr></thead>
            <tbody>
              {estoque.map((e) => (
                <tr key={e.id}>
                  <td><b>{e.item}</b></td>
                  <td>{e.unidade}</td>
                  <td className="num">{NUM(e.qtd)}</td>
                  <td className="num">{NUM(e.minimo)}</td>
                  <td className="num">{BRL(e.custo)}</td>
                  <td className="num">{BRL(e.qtd * e.custo)}</td>
                  <td>{e.qtd < e.minimo ? <Badge tom="crit"><AlertTriangle size={11} /> Repor</Badge> : e.qtd < e.minimo * 1.3 ? <Badge tom="warn">Atenção</Badge> : <Badge tom="ok">OK</Badge>}</td>
                  {podeEditar && (
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn btn-sm" style={{ marginRight: 6 }} onClick={() => { setErroM(""); setMov({ id: e.id, tipo: "entrada", item: e.item }); }}>+ Entrada</button>
                      <button className="btn btn-sm" onClick={() => { setErroM(""); setMov({ id: e.id, tipo: "saida", item: e.item }); }}>− Saída</button>
                    </td>
                  )}
                </tr>
              ))}
              {estoque.length === 0 && <tr><td colSpan={podeEditar ? 8 : 7} className="vazio">Nenhum item cadastrado.</td></tr>}
              <tr className="total"><td colSpan={5}>Total</td><td className="num">{BRL(valorTotal)}</td><td colSpan={podeEditar ? 2 : 1}></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal titulo="Cadastrar item de estoque" onFechar={() => setModal(false)}>
          {erroM && <div className="erro-box">{erroM}</div>}
          <Campo rotulo="Descrição do item"><input value={f.item} onChange={(e) => setF({ ...f, item: e.target.value })} /></Campo>
          <div className="campos-2">
            <Campo rotulo="Unidade"><input value={f.unidade} onChange={(e) => setF({ ...f, unidade: e.target.value })} placeholder="ex.: saco 25 kg" /></Campo>
            <Campo rotulo="Quantidade inicial"><input type="number" value={f.qtd} onChange={(e) => setF({ ...f, qtd: e.target.value })} /></Campo>
            <Campo rotulo="Estoque mínimo"><input type="number" value={f.minimo} onChange={(e) => setF({ ...f, minimo: e.target.value })} /></Campo>
            <Campo rotulo="Custo unitário (R$)"><input type="number" step="0.01" value={f.custo} onChange={(e) => setF({ ...f, custo: e.target.value })} /></Campo>
          </div>
          <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar item"}
          </button>
        </Modal>
      )}
      {mov && (
        <Modal titulo={(mov.tipo === "entrada" ? "Entrada — " : "Saída — ") + mov.item} onFechar={() => setMov(null)} largura={380}>
          {erroM && <div className="erro-box">{erroM}</div>}
          <Campo rotulo="Quantidade">
            <input type="number" min="1" autoFocus value={qtdMov} onChange={(e) => setQtdMov(e.target.value)} onKeyDown={(e) => e.key === "Enter" && movimentar()} />
          </Campo>
          <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={movimentar} disabled={salvando}>
            {salvando ? "Registrando…" : "Confirmar " + mov.tipo}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* ================================================================
   BALANÇO PATRIMONIAL
   ================================================================ */
function Balanco({ dados, indicadores }) {
  const { lotes, estoque, socios, pagar, receber, saldo } = dados;
  const ativosLotes = lotes.filter((l) => l.status === "Ativo" && indicadores[l.id]);
  const ativosBio = Object.keys(ESPECIES).map((esp) => ({
    esp,
    valor: ativosLotes.filter((l) => l.especie === esp).reduce((s, l) => s + indicadores[l.id].valorMercado, 0),
  })).filter((x) => x.valor > 0);
  const totalBio = ativosBio.reduce((s, x) => s + x.valor, 0);

  const totReceber = receber.filter((c) => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const estoques = estoque.reduce((s, e) => s + e.qtd * e.custo, 0);
  const circulante = saldo + totReceber + estoques;
  const imobilizado = IMOBILIZADO.reduce((s, i) => s + i.valor, 0);
  const totalAtivo = circulante + totalBio + imobilizado;

  const fornecedores = pagar.filter((c) => c.status === "pendente" && c.credor !== "Banco da Amazônia").reduce((s, c) => s + c.valor, 0);
  const passivoCirc = fornecedores + PASSIVOS_FIXOS.obrigacoesTrabalhistas + PASSIVOS_FIXOS.fnoCurtoPrazo;
  const passivoNC = PASSIVOS_FIXOS.fnoLongoPrazo;
  const capital = socios.reduce((s, x) => s + x.cotas * VALOR_COTA, 0);
  const sobras = totalAtivo - passivoCirc - passivoNC - capital - PASSIVOS_FIXOS.reservas;
  const totalPassivoPL = passivoCirc + passivoNC + capital + PASSIVOS_FIXOS.reservas + sobras;

  const Linha = ({ rot, val, nivel = 0, forte }) => (
    <tr>
      <td style={{ paddingLeft: 10 + nivel * 18, fontWeight: forte ? 700 : 400 }}>{rot}</td>
      <td className="num" style={{ fontWeight: forte ? 700 : 400 }}>{BRL(val)}</td>
    </tr>
  );

  return (
    <div>
      <div className="grid g3">
        <Kpi Icone={Scale} rotulo="Total do ativo" valor={BRL(totalAtivo)} sub={"Posição em " + dataBR(hojeISO)} />
        <Kpi Icone={Fish} rotulo="Ativo biológico" valor={BRL(totalBio)} sub="Peixes vivos a valor justo de mercado" />
        <Kpi Icone={Anchor} rotulo="Patrimônio líquido" valor={BRL(capital + PASSIVOS_FIXOS.reservas + sobras)} sub={"Capital social de " + BRL(capital)} />
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-tit" style={{ marginBottom: 12 }}><ArrowUpRight size={16} /> Ativo</div>
          <div className="tbl-wrap">
            <table className="tbl">
              <tbody>
                <Linha rot="ATIVO CIRCULANTE" val={circulante} forte />
                <Linha rot="Caixa e bancos (saldo dos lançamentos)" val={saldo} nivel={1} />
                <Linha rot="Contas a receber" val={totReceber} nivel={1} />
                <Linha rot="Estoques (rações e insumos)" val={estoques} nivel={1} />
                <Linha rot="ATIVO BIOLÓGICO" val={totalBio} forte />
                {ativosBio.map((x) => <Linha key={x.esp} rot={x.esp + " (biomassa × preço de mercado)"} val={x.valor} nivel={1} />)}
                <Linha rot="IMOBILIZADO" val={imobilizado} forte />
                {IMOBILIZADO.map((i) => <Linha key={i.item} rot={i.item} val={i.valor} nivel={1} />)}
                <tr className="total"><td>TOTAL DO ATIVO</td><td className="num">{BRL(totalAtivo)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-tit" style={{ marginBottom: 12 }}><ArrowDownRight size={16} /> Passivo e patrimônio líquido</div>
          <div className="tbl-wrap">
            <table className="tbl">
              <tbody>
                <Linha rot="PASSIVO CIRCULANTE" val={passivoCirc} forte />
                <Linha rot="Fornecedores e contas a pagar" val={fornecedores} nivel={1} />
                <Linha rot="Obrigações trabalhistas e encargos" val={PASSIVOS_FIXOS.obrigacoesTrabalhistas} nivel={1} />
                <Linha rot="Financiamento FNO — curto prazo" val={PASSIVOS_FIXOS.fnoCurtoPrazo} nivel={1} />
                <Linha rot="PASSIVO NÃO CIRCULANTE" val={passivoNC} forte />
                <Linha rot="Financiamento FNO (Basa) — longo prazo" val={passivoNC} nivel={1} />
                <Linha rot="PATRIMÔNIO LÍQUIDO" val={capital + PASSIVOS_FIXOS.reservas + sobras} forte />
                <Linha rot="Capital social integralizado" val={capital} nivel={1} />
                <Linha rot="Reserva legal e RATES" val={PASSIVOS_FIXOS.reservas} nivel={1} />
                <Linha rot="Sobras acumuladas" val={sobras} nivel={1} />
                <tr className="total"><td>TOTAL DO PASSIVO + PL</td><td className="num">{BRL(totalPassivoPL)}</td></tr>
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--tinta2)", marginTop: 10 }}>
            O ativo biológico é reavaliado automaticamente pelo banco de dados a partir da biomassa dos lotes ativos
            e do preço de mercado de cada espécie. Imobilizado e passivos fixos são configurados no topo do código
            até existir o módulo patrimonial.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   FUNCIONÁRIOS
   ================================================================ */
function Funcionarios({ dados, podeEditar, agir }) {
  const { funcionarios } = dados;
  const [modal, setModal] = useState(false);
  const [f, setF] = useState({ nome: "", cargo: "", admissao: hojeISO, salario: "" });
  const [erroM, setErroM] = useState("");
  const [salvando, setSalvando] = useState(false);

  const folha = funcionarios.reduce((s, x) => s + x.salario, 0);
  const custoTotal = folha * (1 + ENCARGOS);

  const salvar = async () => {
    if (!f.nome.trim()) { setErroM("Informe o nome do funcionário."); return; }
    setSalvando(true);
    const e = await agir.novoFuncionario(f);
    setSalvando(false);
    if (e) { setErroM(e); return; }
    setModal(false); setF({ nome: "", cargo: "", admissao: hojeISO, salario: "" });
  };

  return (
    <div>
      <div className="grid g3">
        <Kpi Icone={HardHat} rotulo="Funcionários ativos" valor={String(funcionarios.length)} sub="Equipe de manejo e apoio" />
        <Kpi Icone={Wallet} rotulo="Folha bruta mensal" valor={BRL(folha)} sub="Salários-base" />
        <Kpi Icone={CircleDollarSign} rotulo="Custo total estimado" valor={BRL(custoTotal)} sub={"Encargos estimados em " + Math.round(ENCARGOS * 100) + "%"} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-cab">
          <div>
            <div className="card-tit"><HardHat size={16} /> Quadro de pessoal</div>
            <div className="card-sub">Folha de pagamento com estimativa de encargos</div>
          </div>
          {podeEditar && <button className="btn btn-pri btn-sm" onClick={() => { setErroM(""); setModal(true); }}><Plus size={14} /> Novo funcionário</button>}
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Nome</th><th>Cargo</th><th>Admissão</th><th className="num">Salário</th><th className="num">Encargos (est.)</th><th className="num">Custo mensal</th></tr></thead>
            <tbody>
              {funcionarios.map((x) => (
                <tr key={x.id}>
                  <td><b>{x.nome}</b></td>
                  <td>{x.cargo}</td>
                  <td>{dataBR(x.admissao)}</td>
                  <td className="num">{BRL(x.salario)}</td>
                  <td className="num">{BRL(x.salario * ENCARGOS)}</td>
                  <td className="num">{BRL(x.salario * (1 + ENCARGOS))}</td>
                </tr>
              ))}
              {funcionarios.length === 0 && <tr><td colSpan={6} className="vazio">Nenhum funcionário cadastrado.</td></tr>}
              <tr className="total">
                <td colSpan={3}>Total</td>
                <td className="num">{BRL(folha)}</td>
                <td className="num">{BRL(folha * ENCARGOS)}</td>
                <td className="num">{BRL(custoTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal titulo="Cadastrar funcionário" onFechar={() => setModal(false)}>
          {erroM && <div className="erro-box">{erroM}</div>}
          <Campo rotulo="Nome completo"><input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Campo>
          <div className="campos-2">
            <Campo rotulo="Cargo"><input value={f.cargo} onChange={(e) => setF({ ...f, cargo: e.target.value })} placeholder="ex.: Auxiliar de manejo" /></Campo>
            <Campo rotulo="Admissão"><input type="date" value={f.admissao} onChange={(e) => setF({ ...f, admissao: e.target.value })} /></Campo>
          </div>
          <Campo rotulo="Salário mensal (R$)"><input type="number" step="0.01" value={f.salario} onChange={(e) => setF({ ...f, salario: e.target.value })} /></Campo>
          <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar funcionário"}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* ================================================================
   PRODUÇÃO AQUÍCOLA
   ================================================================ */
function Producao({ dados, indicadores, podeEditar, agir }) {
  const { tanques, lotes, alimentacao, mortalidade } = dados;
  const [loteSel, setLoteSel] = useState(null);
  const [modal, setModal] = useState(null); // 'lote' | 'alim' | 'bio' | 'mort' | 'despesca'
  const [f, setF] = useState({});
  const [erroM, setErroM] = useState("");
  const [salvando, setSalvando] = useState(false);

  const ativos = lotes.filter((l) => l.status === "Ativo" && indicadores[l.id]);
  const biomassaTotal = ativos.reduce((s, l) => s + indicadores[l.id].biomassa, 0);
  const fcaMedio = ativos.length ? ativos.reduce((s, l) => s + indicadores[l.id].fca, 0) / ativos.length : 0;
  const sobrevMedia = ativos.length ? ativos.reduce((s, l) => s + indicadores[l.id].sobrevivencia, 0) / ativos.length : 0;

  const statusTanque = (t) => {
    const lote = ativos.find((l) => l.tanque === t.id);
    if (lote) return { rot: "Ocupado", tom: "info", lote };
    if (t.manutencao) return { rot: "Manutenção", tom: "warn" };
    return { rot: "Livre", tom: "ok" };
  };
  const tanquesLivres = tanques.filter((t) => !t.manutencao && !ativos.find((l) => l.tanque === t.id));

  const abrir = (tipo) => {
    setErroM("");
    if (tipo === "lote") setF({ especie: Object.keys(ESPECIES)[0] || "Tambaqui", tanque: tanquesLivres[0]?.id || "", alevinos: "", dataPovoamento: hojeISO, pesoInicial: "", custoAlevinos: "" });
    if (tipo === "alim") setF({ data: hojeISO, racao: "Engorda 32% — 6 mm", kg: "" });
    if (tipo === "bio") setF({ data: hojeISO, peso: "", amostra: 30 });
    if (tipo === "mort") setF({ data: hojeISO, qtd: "", causa: "" });
    setModal(tipo);
  };

  const salvar = async () => {
    setSalvando(true);
    let e = null;
    if (modal === "lote") {
      if (!f.tanque || !Number(f.alevinos)) { setSalvando(false); setErroM("Informe o tanque e a quantidade de alevinos."); return; }
      e = await agir.novoLote(f);
    }
    if (modal === "alim") {
      if (!Number(f.kg)) { setSalvando(false); setErroM("Informe a quantidade de ração."); return; }
      e = await agir.registrarAlimentacao(loteSel, f);
    }
    if (modal === "bio") {
      if (!Number(f.peso)) { setSalvando(false); setErroM("Informe o peso médio."); return; }
      e = await agir.registrarBiometria(loteSel, f);
    }
    if (modal === "mort") {
      if (!Number(f.qtd)) { setSalvando(false); setErroM("Informe a quantidade."); return; }
      e = await agir.registrarMortalidade(loteSel, f);
    }
    setSalvando(false);
    if (e) { setErroM(e); return; }
    setModal(null);
  };

  const confirmarDespesca = async () => {
    setSalvando(true);
    const e = await agir.despescar(loteSel);
    setSalvando(false);
    if (e) { setErroM(e); return; }
    setModal(null); setLoteSel(null);
  };

  /* ---------- detalhe do lote ---------- */
  if (loteSel) {
    const lote = lotes.find((l) => l.id === loteSel);
    const ind = indicadores[loteSel];
    if (!lote || !ind) { setLoteSel(null); return null; }
    const serieCresc = [{ data: dataBR(lote.dataPovoamento).slice(0, 5), peso: lote.pesoInicial },
      ...ind.bios.map((b) => ({ data: dataBR(b.data).slice(0, 5), peso: b.peso }))];
    const alims = alimentacao.filter((a) => a.lote === loteSel).sort((a, b) => b.data.localeCompare(a.data));
    const morts = mortalidade.filter((m) => m.lote === loteSel).sort((a, b) => b.data.localeCompare(a.data));
    const ativo = lote.status === "Ativo";
    const corEsp = ESPECIES[lote.especie]?.cor || "#1F4B42";

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-sm" onClick={() => setLoteSel(null)}><ChevronLeft size={14} /> Voltar</button>
            <div>
              <div style={{ fontFamily: "'Archivo'", fontWeight: 800, fontStretch: "112%", fontSize: 18 }}>
                Lote {lote.id} · <TagEspecie especie={lote.especie} />
              </div>
              <div style={{ fontSize: 12.5, color: "var(--tinta2)" }}>
                Tanque {lote.tanque} · povoado em {dataBR(lote.dataPovoamento)} com {NUM(lote.alevinos)} alevinos de {lote.pesoInicial} g · {ind.dias} dias de cultivo
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {ativo ? <Badge tom="ok">Em cultivo</Badge> : <Badge tom="muted">Finalizado em {dataBR(lote.dataDespesca)}</Badge>}
            {ativo && podeEditar && <button className="btn btn-ouro btn-sm" onClick={() => { setErroM(""); setModal("despesca"); }}><Ship size={14} /> Registrar despesca</button>}
          </div>
        </div>

        <div className="grid g4">
          <Kpi Icone={Ruler} rotulo="Peso médio" valor={NUM(ind.pesoAtual) + " g"} sub={"GPD " + NUM(ind.gpd, 2) + " g/dia · TCE " + NUM(ind.sgr, 2) + " %/dia"} />
          <Kpi Icone={Fish} rotulo="População estimada" valor={NUM(ind.populacao)} sub={"Sobrevivência de " + NUM(ind.sobrevivencia, 1) + "% · " + NUM(ind.mortos) + " mortos"} />
          <Kpi Icone={Waves} rotulo="Biomassa" valor={NUM(ind.biomassa) + " kg"} sub={"Densidade " + NUM(ind.densidade, 1) + " kg/m³ · ≈ " + BRL(ind.valorMercado)} />
          <Kpi Icone={Utensils} rotulo="Conversão alimentar (FCA)" valor={NUM(ind.fca, 2)} sub={NUM(ind.racaoTotal) + " kg de ração · custo ração ≈ " + BRL(ind.custoRacaoKg) + "/kg"} />
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-cab">
            <div>
              <div className="card-tit"><TrendingUp size={16} /> Curva de crescimento</div>
              <div className="card-sub">Peso médio (g) por biometria</div>
            </div>
            {ativo && podeEditar && <button className="btn btn-pri btn-sm" onClick={() => abrir("bio")}><Plus size={14} /> Nova biometria</button>}
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={serieCresc} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE5DC" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={46} />
                <Tooltip formatter={(v) => [NUM(v) + " g", "Peso médio"]} />
                <Line type="monotone" dataKey="peso" stroke={corEsp} strokeWidth={2.6}
                  dot={{ r: 4, fill: corEsp }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid g3" style={{ marginTop: 16 }}>
          <div className="card">
            <div className="card-cab">
              <div className="card-tit"><Utensils size={15} /> Alimentação</div>
              {ativo && podeEditar && <button className="btn btn-sm" onClick={() => abrir("alim")}><Plus size={13} /> Registrar</button>}
            </div>
            <div className="tbl-wrap" style={{ maxHeight: 260, overflowY: "auto" }}>
              <table className="tbl">
                <thead><tr><th>Data</th><th>Ração</th><th className="num">kg</th></tr></thead>
                <tbody>
                  {alims.map((a) => <tr key={a.id}><td>{dataBR(a.data)}</td><td>{a.racao}</td><td className="num">{NUM(a.kg)}</td></tr>)}
                  {alims.length === 0 && <tr><td colSpan={3} className="vazio">Sem registros recentes</td></tr>}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--tinta2)", marginTop: 8 }}>Acumulado do ciclo: <b className="mono">{NUM(ind.racaoTotal)} kg</b></p>
          </div>

          <div className="card">
            <div className="card-cab">
              <div className="card-tit"><Ruler size={15} /> Biometrias</div>
            </div>
            <div className="tbl-wrap" style={{ maxHeight: 260, overflowY: "auto" }}>
              <table className="tbl">
                <thead><tr><th>Data</th><th className="num">Peso médio</th><th className="num">Amostra</th></tr></thead>
                <tbody>
                  {[...ind.bios].reverse().map((b) => <tr key={b.id}><td>{dataBR(b.data)}</td><td className="num">{NUM(b.peso)} g</td><td className="num">{b.amostra}</td></tr>)}
                  {ind.bios.length === 0 && <tr><td colSpan={3} className="vazio">Nenhuma biometria registrada</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-cab">
              <div className="card-tit"><Skull size={15} /> Mortalidade</div>
              {ativo && podeEditar && <button className="btn btn-sm" onClick={() => abrir("mort")}><Plus size={13} /> Registrar</button>}
            </div>
            <div className="tbl-wrap" style={{ maxHeight: 260, overflowY: "auto" }}>
              <table className="tbl">
                <thead><tr><th>Data</th><th className="num">Qtd</th><th>Causa provável</th></tr></thead>
                <tbody>
                  {morts.map((m) => <tr key={m.id}><td>{dataBR(m.data)}</td><td className="num">{NUM(m.qtd)}</td><td>{m.causa}</td></tr>)}
                  {morts.length === 0 && <tr><td colSpan={3} className="vazio">Sem registros recentes</td></tr>}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--tinta2)", marginTop: 8 }}>Total do ciclo: <b className="mono">{NUM(ind.mortos)}</b> ({NUM(100 - ind.sobrevivencia, 1)}%)</p>
          </div>
        </div>

        {modal === "alim" && (
          <Modal titulo={"Registrar alimentação — " + loteSel} onFechar={() => setModal(null)} largura={400}>
            {erroM && <div className="erro-box">{erroM}</div>}
            <Campo rotulo="Data"><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Campo>
            <Campo rotulo="Ração">
              <select value={f.racao} onChange={(e) => setF({ ...f, racao: e.target.value })}>
                <option>Alevinos 40% — 2 mm</option><option>Crescimento 36% — 4 mm</option><option>Engorda 32% — 6 mm</option>
              </select>
            </Campo>
            <Campo rotulo="Quantidade (kg)"><input type="number" step="0.1" autoFocus value={f.kg} onChange={(e) => setF({ ...f, kg: e.target.value })} /></Campo>
            <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar registro"}
            </button>
          </Modal>
        )}
        {modal === "bio" && (
          <Modal titulo={"Nova biometria — " + loteSel} onFechar={() => setModal(null)} largura={400}>
            {erroM && <div className="erro-box">{erroM}</div>}
            <Campo rotulo="Data"><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Campo>
            <div className="campos-2">
              <Campo rotulo="Peso médio (g)"><input type="number" autoFocus value={f.peso} onChange={(e) => setF({ ...f, peso: e.target.value })} /></Campo>
              <Campo rotulo="Peixes amostrados"><input type="number" value={f.amostra} onChange={(e) => setF({ ...f, amostra: e.target.value })} /></Campo>
            </div>
            <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar biometria"}
            </button>
          </Modal>
        )}
        {modal === "mort" && (
          <Modal titulo={"Registrar mortalidade — " + loteSel} onFechar={() => setModal(null)} largura={400}>
            {erroM && <div className="erro-box">{erroM}</div>}
            <div className="campos-2">
              <Campo rotulo="Data"><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Campo>
              <Campo rotulo="Quantidade"><input type="number" autoFocus value={f.qtd} onChange={(e) => setF({ ...f, qtd: e.target.value })} /></Campo>
            </div>
            <Campo rotulo="Causa provável"><input value={f.causa} onChange={(e) => setF({ ...f, causa: e.target.value })} placeholder="ex.: baixo oxigênio, manejo, predação…" /></Campo>
            <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar registro"}
            </button>
          </Modal>
        )}
        {modal === "despesca" && (
          <Modal titulo={"Registrar despesca — " + loteSel} onFechar={() => setModal(null)} largura={420}>
            {erroM && <div className="erro-box">{erroM}</div>}
            <p style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 14 }}>
              Confirmar a despesca de <b>{NUM(ind.populacao)}</b> peixes com peso médio de <b>{NUM(ind.pesoAtual)} g</b>?<br />
              Biomassa estimada: <b>{NUM(ind.biomassa)} kg</b> · Receita a preço de mercado: <b>{BRL(ind.valorMercado)}</b>.
            </p>
            <p style={{ fontSize: 12, color: "var(--tinta2)", marginBottom: 14 }}>
              O banco encerra o lote, libera o tanque {lote.tanque} e lança a receita no caixa numa única operação.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" style={{ flex: 1, justifyContent: "center" }} onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-ouro" style={{ flex: 1, justifyContent: "center" }} onClick={confirmarDespesca} disabled={salvando}>
                {salvando ? "Registrando…" : "Confirmar despesca"}
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  /* ---------- visão geral da produção ---------- */
  return (
    <div>
      <div className="grid g4">
        <Kpi Icone={Fish} rotulo="Lotes em cultivo" valor={String(ativos.length)} sub={NUM(ativos.reduce((s, l) => s + indicadores[l.id].populacao, 0)) + " peixes no rio"} />
        <Kpi Icone={Waves} rotulo="Biomassa total" valor={NUM(biomassaTotal) + " kg"} sub={"≈ " + BRL(ativos.reduce((s, l) => s + indicadores[l.id].valorMercado, 0))} />
        <Kpi Icone={Utensils} rotulo="FCA médio (lotes ativos)" valor={NUM(fcaMedio, 2)} sub="Meta da cooperativa: até 1,8" subTom={fcaMedio <= 1.8 ? "pos" : "neg"} />
        <Kpi Icone={CheckCircle2} rotulo="Sobrevivência média" valor={NUM(sobrevMedia, 1) + "%"} sub="Meta: acima de 90%" subTom={sobrevMedia >= 90 ? "pos" : "neg"} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-cab">
          <div>
            <div className="card-tit"><Anchor size={16} /> Tanques-rede</div>
            <div className="card-sub">Estruturas cadastradas no sistema, com a ocupação atual</div>
          </div>
        </div>
        <div className="grid g4">
          {tanques.map((t) => {
            const st = statusTanque(t);
            return (
              <div key={t.id} style={{ border: "1px solid var(--linha)", borderRadius: 10, padding: "12px 14px", background: "#FBFCFA" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <b style={{ fontFamily: "'Archivo'", fontStretch: "112%" }}>{t.id}</b>
                  <Badge tom={st.tom}>{st.rot}</Badge>
                </div>
                <div style={{ fontSize: 12, color: "var(--tinta2)", lineHeight: 1.55 }}>
                  {t.dim} · {t.volume} m³<br />{t.local}
                  {st.lote && <><br /><span style={{ color: "var(--tinta)" }}>Lote <b>{st.lote.id}</b> — {st.lote.especie} · {NUM(indicadores[st.lote.id].densidade, 1)} kg/m³</span></>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-cab">
          <div>
            <div className="card-tit"><Fish size={16} /> Lotes de produção</div>
            <div className="card-sub">Indicadores calculados pelo banco de dados — toque no lote para ver detalhes e manejos</div>
          </div>
          {podeEditar && <button className="btn btn-pri btn-sm" onClick={() => abrir("lote")} disabled={!tanquesLivres.length}><Plus size={14} /> Novo lote</button>}
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>Lote</th><th>Espécie</th><th>Tanque</th><th className="num">Dias</th><th className="num">Peso médio</th>
              <th className="num">Sobrev.</th><th className="num">GPD</th><th className="num">FCA</th><th className="num">Biomassa</th><th>Situação</th>
            </tr></thead>
            <tbody>
              {lotes.filter((l) => indicadores[l.id]).map((l) => {
                const ind = indicadores[l.id];
                return (
                  <tr key={l.id}>
                    <td><button className="link-lote" onClick={() => setLoteSel(l.id)}>{l.id}</button></td>
                    <td><TagEspecie especie={l.especie} /></td>
                    <td>{l.tanque}</td>
                    <td className="num">{ind.dias}</td>
                    <td className="num">{NUM(ind.pesoAtual)} g</td>
                    <td className="num">{NUM(ind.sobrevivencia, 1)}%</td>
                    <td className="num">{NUM(ind.gpd, 2)}</td>
                    <td className="num">{NUM(ind.fca, 2)}</td>
                    <td className="num">{NUM(ind.biomassa)} kg</td>
                    <td>{l.status === "Ativo" ? <Badge tom="ok">Em cultivo</Badge> : <Badge tom="muted">Despescado {dataBR(l.dataDespesca)}</Badge>}</td>
                  </tr>
                );
              })}
              {lotes.length === 0 && <tr><td colSpan={10} className="vazio">Nenhum lote cadastrado — povoar o primeiro lote quando os alevinos chegarem.</td></tr>}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--tinta2)", marginTop: 10 }}>
          GPD = ganho de peso diário (g/dia) · FCA = fator de conversão alimentar (kg de ração por kg de peixe produzido) · biomassa estimada = população × peso médio.
        </p>
      </div>

      {modal === "lote" && (
        <Modal titulo="Povoar novo lote" onFechar={() => setModal(null)}>
          {erroM && <div className="erro-box">{erroM}</div>}
          <div className="campos-2">
            <Campo rotulo="Espécie">
              <select value={f.especie} onChange={(e) => setF({ ...f, especie: e.target.value })}>
                {Object.keys(ESPECIES).map((e2) => <option key={e2}>{e2}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Tanque (livres)">
              <select value={f.tanque} onChange={(e) => setF({ ...f, tanque: e.target.value })}>
                {tanquesLivres.map((t) => <option key={t.id} value={t.id}>{t.id} — {t.volume} m³</option>)}
              </select>
            </Campo>
            <Campo rotulo="Quantidade de alevinos"><input type="number" value={f.alevinos} onChange={(e) => setF({ ...f, alevinos: e.target.value })} /></Campo>
            <Campo rotulo="Data de povoamento"><input type="date" value={f.dataPovoamento} onChange={(e) => setF({ ...f, dataPovoamento: e.target.value })} /></Campo>
            <Campo rotulo="Peso médio inicial (g)"><input type="number" step="0.1" value={f.pesoInicial} onChange={(e) => setF({ ...f, pesoInicial: e.target.value })} /></Campo>
            <Campo rotulo="Custo dos alevinos (R$)"><input type="number" step="0.01" value={f.custoAlevinos} onChange={(e) => setF({ ...f, custoAlevinos: e.target.value })} /></Campo>
          </div>
          <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Povoar lote"}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* ================================================================
   GERADOR DE RELATÓRIOS
   ================================================================ */
const BLOCOS_RELATORIO = [
  { id: "fluxo", rotulo: "Fluxo de caixa realizado", papeis: ["administrador", "contador"] },
  { id: "projecao", rotulo: "Projeção de caixa (próximos 3 meses)", papeis: ["administrador", "contador"] },
  { id: "pagar", rotulo: "Contas a pagar", papeis: ["administrador", "contador"] },
  { id: "receber", rotulo: "Contas a receber", papeis: ["administrador", "contador"] },
  { id: "mensal", rotulo: "Mensalidades dos sócios", papeis: ["administrador", "contador", "cooperado"] },
  { id: "producao", rotulo: "Indicadores de produção", papeis: ["administrador", "cooperado"] },
  { id: "estoque", rotulo: "Posição de estoque", papeis: ["administrador", "contador"] },
  { id: "balanco", rotulo: "Balanço patrimonial (síntese)", papeis: ["administrador", "contador"] },
  { id: "quadro", rotulo: "Quadro social e capital", papeis: ["administrador", "contador", "cooperado"] },
  { id: "folha", rotulo: "Folha de pessoal", papeis: ["administrador", "contador"] },
];

function Relatorios({ usuario, dados, indicadores }) {
  const { socios, pagar, receber, estoque, funcionarios, lotes, fluxo, saldo } = dados;
  const disponiveis = BLOCOS_RELATORIO.filter((b) => b.papeis.includes(usuario.papel));
  const [sel, setSel] = useState(() => Object.fromEntries(disponiveis.slice(0, 3).map((b) => [b.id, true])));
  const [gerado, setGerado] = useState(false);
  const marcados = disponiveis.filter((b) => sel[b.id]);

  const pagarPend = pagar.filter((c) => c.status === "pendente");
  const receberPend = receber.filter((c) => c.status === "pendente");
  const ativos = lotes.filter((l) => l.status === "Ativo" && indicadores[l.id]);
  const folhaCusto = funcionarios.reduce((s, x) => s + x.salario, 0) * (1 + ENCARGOS);
  const compRotulo = HOJE.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const projecao = useMemo(() => {
    const meses = [0, 1, 2].map((off) => {
      const d = new Date(HOJE.getFullYear(), HOJE.getMonth() + off, 1);
      const nome = d.toLocaleDateString("pt-BR", { month: "long" });
      const rot = nome.charAt(0).toUpperCase() + nome.slice(1);
      return {
        chave: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"),
        rotulo: off === 0 ? rot + " (restante)" : rot,
      };
    });
    const despescaPrevista = ativos.filter((l) => indicadores[l.id].pesoAtual >= 1600)
      .reduce((s, l) => s + indicadores[l.id].valorMercado, 0);
    const recorrentesSaida = folhaCusto + 8500 + 2300 + 900 + 3150; // folha + ração + diesel + energia + parcela FNO
    let acumulado = saldo;
    return meses.map((m, i) => {
      const entTitulos = receberPend.filter((c) => c.venc?.startsWith(m.chave)).reduce((s, c) => s + c.valor, 0);
      const saiTitulos = pagarPend.filter((c) => c.venc?.startsWith(m.chave)).reduce((s, c) => s + c.valor, 0);
      const entradas = entTitulos + (i === 0 ? 0 : socios.length * MENSALIDADE) + (i === 1 ? Math.round(despescaPrevista) : 0);
      const saidas = saiTitulos + (i === 0 ? 0 : recorrentesSaida);
      acumulado += entradas - saidas;
      return { ...m, entradas, saidas, saldo: acumulado };
    });
  }, [ativos, indicadores, pagarPend, receberPend, socios, folhaCusto, saldo]);

  const balSint = useMemo(() => {
    const totReceber = receberPend.reduce((s, c) => s + c.valor, 0);
    const estoques = estoque.reduce((s, e) => s + e.qtd * e.custo, 0);
    const bio = ativos.reduce((s, l) => s + indicadores[l.id].valorMercado, 0);
    const imob = IMOBILIZADO.reduce((s, i) => s + i.valor, 0);
    const circ = saldo + totReceber + estoques;
    const totalAtivo = circ + bio + imob;
    const fornec = pagarPend.filter((c) => c.credor !== "Banco da Amazônia").reduce((s, c) => s + c.valor, 0);
    const pCirc = fornec + PASSIVOS_FIXOS.obrigacoesTrabalhistas + PASSIVOS_FIXOS.fnoCurtoPrazo;
    const capital = socios.reduce((s, x) => s + x.cotas * VALOR_COTA, 0);
    const pl = totalAtivo - pCirc - PASSIVOS_FIXOS.fnoLongoPrazo;
    return { circ, bio, imob, totalAtivo, pCirc, pNC: PASSIVOS_FIXOS.fnoLongoPrazo, capital, pl };
  }, [ativos, indicadores, estoque, pagarPend, receberPend, socios, saldo]);

  if (gerado) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => setGerado(false)}><ChevronLeft size={14} /> Voltar à seleção</button>
          <button className="btn btn-ouro" onClick={() => window.print()}><Printer size={15} /> Imprimir / salvar em PDF</button>
        </div>

        <div className="print-area">
          <div className="rel-cab">
            <div>
              <div className="wordmark">COOPATA</div>
              <div style={{ fontSize: 11.5, color: "var(--tinta2)", marginTop: 3 }}>
                Cooperativa de Piscicultura de Santarém — Pará<br />
                Piscicultura em tanques-rede · rio Amazonas
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12 }}>
              <b>Relatório gerencial</b><br />
              Emitido em {dataBR(hojeISO)}<br />
              Por {usuario.nome} ({PAPEIS[usuario.papel]})
            </div>
          </div>

          {sel.fluxo && (
            <div className="rel-bloco">
              <h3>Fluxo de caixa realizado</h3>
              <table className="tbl">
                <thead><tr><th>Mês</th><th className="num">Receitas</th><th className="num">Despesas</th><th className="num">Resultado</th></tr></thead>
                <tbody>
                  {fluxo.map((m) => (
                    <tr key={m.mes}><td>{m.mes}</td><td className="num">{BRL(m.receitas)}</td><td className="num">{BRL(m.despesas)}</td>
                      <td className={"num " + (m.receitas - m.despesas >= 0 ? "pos" : "neg")}>{BRL(m.receitas - m.despesas)}</td></tr>
                  ))}
                  <tr className="total"><td>Acumulado</td>
                    <td className="num">{BRL(fluxo.reduce((s, m) => s + m.receitas, 0))}</td>
                    <td className="num">{BRL(fluxo.reduce((s, m) => s + m.despesas, 0))}</td>
                    <td className="num">{BRL(fluxo.reduce((s, m) => s + m.receitas - m.despesas, 0))}</td></tr>
                </tbody>
              </table>
              <p className="rel-nota">* Mês corrente parcial, até {dataBR(hojeISO)}. Saldo atual em caixa: {BRL(saldo)}.</p>
            </div>
          )}

          {sel.projecao && (
            <div className="rel-bloco">
              <h3>Projeção de caixa — próximos 3 meses</h3>
              <table className="tbl">
                <thead><tr><th>Período</th><th className="num">Entradas previstas</th><th className="num">Saídas previstas</th><th className="num">Saldo projetado</th></tr></thead>
                <tbody>
                  {projecao.map((p) => (
                    <tr key={p.chave}><td>{p.rotulo}</td><td className="num">{BRL(p.entradas)}</td><td className="num">{BRL(p.saidas)}</td>
                      <td className={"num " + (p.saldo >= 0 ? "pos" : "neg")}><b>{BRL(p.saldo)}</b></td></tr>
                  ))}
                </tbody>
              </table>
              <p className="rel-nota">Premissas: títulos em aberto por vencimento; mensalidades de {BRL(MENSALIDADE)} × {socios.length} sócios; despesca prevista dos lotes com peso médio ≥ 1.600 g; custos recorrentes (folha com encargos, ração, diesel, energia e parcela FNO).</p>
            </div>
          )}

          {sel.pagar && (
            <div className="rel-bloco">
              <h3>Contas a pagar em aberto</h3>
              <table className="tbl">
                <thead><tr><th>Descrição</th><th>Credor</th><th>Vencimento</th><th className="num">Valor</th></tr></thead>
                <tbody>
                  {pagarPend.map((c) => <tr key={c.id}><td>{c.desc}</td><td>{c.credor}</td><td>{dataBR(c.venc)}</td><td className="num">{BRL(c.valor)}</td></tr>)}
                  <tr className="total"><td colSpan={3}>Total</td><td className="num">{BRL(pagarPend.reduce((s, c) => s + c.valor, 0))}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {sel.receber && (
            <div className="rel-bloco">
              <h3>Contas a receber em aberto</h3>
              <table className="tbl">
                <thead><tr><th>Descrição</th><th>Cliente</th><th>Vencimento</th><th className="num">Valor</th></tr></thead>
                <tbody>
                  {receberPend.map((c) => <tr key={c.id}><td>{c.desc}</td><td>{c.cliente}</td><td>{dataBR(c.venc)}</td><td className="num">{BRL(c.valor)}</td></tr>)}
                  <tr className="total"><td colSpan={3}>Total</td><td className="num">{BRL(receberPend.reduce((s, c) => s + c.valor, 0))}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {sel.mensal && (
            <div className="rel-bloco">
              <h3>Mensalidades dos sócios — {compRotulo}</h3>
              <table className="tbl">
                <thead><tr><th>Sócio</th><th>Comunidade</th><th className="num">Valor</th><th>Situação</th></tr></thead>
                <tbody>
                  {socios.map((s) => (
                    <tr key={s.id}><td>{s.nome}</td><td>{s.comunidade}</td><td className="num">{BRL(MENSALIDADE)}</td>
                      <td>{s.mensalidadeEmDia ? "Em dia" : "Em aberto"}</td></tr>
                  ))}
                  <tr className="total"><td colSpan={2}>Total previsto no mês</td><td className="num">{BRL(socios.length * MENSALIDADE)}</td>
                    <td>{socios.filter((s) => !s.mensalidadeEmDia).length} em aberto</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {sel.producao && (
            <div className="rel-bloco">
              <h3>Indicadores de produção por lote</h3>
              <table className="tbl">
                <thead><tr><th>Lote</th><th>Espécie</th><th>Tanque</th><th className="num">Dias</th><th className="num">Peso médio</th>
                  <th className="num">Sobrev.</th><th className="num">GPD</th><th className="num">FCA</th><th className="num">Biomassa</th><th className="num">Valor mercado</th></tr></thead>
                <tbody>
                  {lotes.filter((l) => indicadores[l.id]).map((l) => {
                    const i = indicadores[l.id];
                    return <tr key={l.id}><td>{l.id}{l.status === "Finalizado" ? " *" : ""}</td><td>{l.especie}</td><td>{l.tanque}</td>
                      <td className="num">{i.dias}</td><td className="num">{NUM(i.pesoAtual)} g</td><td className="num">{NUM(i.sobrevivencia, 1)}%</td>
                      <td className="num">{NUM(i.gpd, 2)}</td><td className="num">{NUM(i.fca, 2)}</td><td className="num">{NUM(i.biomassa)} kg</td>
                      <td className="num">{BRL(i.valorMercado)}</td></tr>;
                  })}
                </tbody>
              </table>
              <p className="rel-nota">* Lote finalizado (despescado). GPD em g/dia; FCA = ração consumida ÷ ganho de biomassa.</p>
            </div>
          )}

          {sel.estoque && (
            <div className="rel-bloco">
              <h3>Posição de estoque</h3>
              <table className="tbl">
                <thead><tr><th>Item</th><th className="num">Qtd</th><th className="num">Mínimo</th><th className="num">Custo unit.</th><th className="num">Total</th></tr></thead>
                <tbody>
                  {estoque.map((e) => <tr key={e.id}><td>{e.item} ({e.unidade})</td><td className="num">{NUM(e.qtd)}</td><td className="num">{NUM(e.minimo)}</td>
                    <td className="num">{BRL(e.custo)}</td><td className="num">{BRL(e.qtd * e.custo)}</td></tr>)}
                  <tr className="total"><td colSpan={4}>Valor total do estoque</td><td className="num">{BRL(estoque.reduce((s, e) => s + e.qtd * e.custo, 0))}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {sel.balanco && (
            <div className="rel-bloco">
              <h3>Balanço patrimonial — síntese em {dataBR(hojeISO)}</h3>
              <table className="tbl">
                <tbody>
                  <tr><td><b>Ativo circulante</b></td><td className="num">{BRL(balSint.circ)}</td></tr>
                  <tr><td><b>Ativo biológico</b> (peixes vivos a valor de mercado)</td><td className="num">{BRL(balSint.bio)}</td></tr>
                  <tr><td><b>Imobilizado</b> (líquido de depreciação)</td><td className="num">{BRL(balSint.imob)}</td></tr>
                  <tr className="total"><td>Total do ativo</td><td className="num">{BRL(balSint.totalAtivo)}</td></tr>
                  <tr><td><b>Passivo circulante</b></td><td className="num">{BRL(balSint.pCirc)}</td></tr>
                  <tr><td><b>Passivo não circulante</b> (FNO — Basa)</td><td className="num">{BRL(balSint.pNC)}</td></tr>
                  <tr><td><b>Patrimônio líquido</b> (capital de {BRL(balSint.capital)} + reservas e sobras)</td><td className="num">{BRL(balSint.pl)}</td></tr>
                  <tr className="total"><td>Total do passivo + PL</td><td className="num">{BRL(balSint.pCirc + balSint.pNC + balSint.pl)}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {sel.quadro && (
            <div className="rel-bloco">
              <h3>Quadro social e capital integralizado</h3>
              <table className="tbl">
                <thead><tr><th>Sócio</th><th>Adesão</th><th className="num">Cotas</th><th className="num">Capital</th></tr></thead>
                <tbody>
                  {socios.map((s) => <tr key={s.id}><td>{s.nome}</td><td>{dataBR(s.adesao)}</td><td className="num">{NUM(s.cotas)}</td><td className="num">{BRL(s.cotas * VALOR_COTA)}</td></tr>)}
                  <tr className="total"><td colSpan={2}>Capital social total ({socios.length} sócios)</td>
                    <td className="num">{NUM(socios.reduce((s, x) => s + x.cotas, 0))}</td>
                    <td className="num">{BRL(socios.reduce((s, x) => s + x.cotas * VALOR_COTA, 0))}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {sel.folha && (
            <div className="rel-bloco">
              <h3>Folha de pessoal (com encargos estimados)</h3>
              <table className="tbl">
                <thead><tr><th>Funcionário</th><th>Cargo</th><th className="num">Salário</th><th className="num">Custo total</th></tr></thead>
                <tbody>
                  {funcionarios.map((x) => <tr key={x.id}><td>{x.nome}</td><td>{x.cargo}</td><td className="num">{BRL(x.salario)}</td><td className="num">{BRL(x.salario * (1 + ENCARGOS))}</td></tr>)}
                  <tr className="total"><td colSpan={2}>Total mensal</td>
                    <td className="num">{BRL(funcionarios.reduce((s, x) => s + x.salario, 0))}</td>
                    <td className="num">{BRL(folhaCusto)}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          <p style={{ marginTop: 30, fontSize: 11, color: "var(--tinta2)", borderTop: "1px solid var(--linha)", paddingTop: 10 }}>
            Documento gerado pelo sistema de gestão da COOPATA. Valores de ativo biológico e indicadores zootécnicos são estimativas calculadas a partir dos registros de manejo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-cab">
          <div>
            <div className="card-tit"><FileBarChart size={16} /> Montar relatório</div>
            <div className="card-sub">Selecione os blocos que deseja combinar — o relatório sai pronto para impressão ou PDF</div>
          </div>
        </div>
        {disponiveis.map((b) => (
          <label key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 6px", borderBottom: "1px solid var(--linha)", cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" checked={!!sel[b.id]} onChange={(e) => setSel({ ...sel, [b.id]: e.target.checked })}
              style={{ width: 17, height: 17, accentColor: "#14302A" }} />
            {b.rotulo}
          </label>
        ))}
        <button className="btn btn-pri" style={{ marginTop: 16, width: "100%", justifyContent: "center", padding: 11 }}
          disabled={!marcados.length} onClick={() => setGerado(true)}>
          <FileBarChart size={15} /> Gerar relatório ({marcados.length} bloco{marcados.length === 1 ? "" : "s"})
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   APLICAÇÃO PRINCIPAL
   ================================================================ */
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [dados, setDados] = useState(null);
  const [aba, setAba] = useState("dashboard");
  const [inicializando, setInicializando] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erroGlobal, setErroGlobal] = useState("");
  const [avisoLogin, setAvisoLogin] = useState("");

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const d = await buscarTudo();
      setDados(d);
      setErroGlobal("");
    } catch (e) {
      setErroGlobal("Falha ao carregar os dados: " + msgErro(e));
    }
    setCarregando(false);
  };

  const aoEntrar = async (user) => {
    const { data: perfil, error } = await supabase.from("usuarios").select("*").eq("id", user.id).maybeSingle();
    if (error || !perfil || !perfil.ativo) {
      await supabase.auth.signOut();
      setAvisoLogin("Sua conta ainda não tem um perfil ativo no sistema. Peça à administração da cooperativa para cadastrá-la.");
      setInicializando(false);
      return;
    }
    setAvisoLogin("");
    setUsuario({ id: user.id, nome: perfil.nome, papel: perfil.papel });
    setAba("dashboard");
    setInicializando(false);
    await carregarDados();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) aoEntrar(data.session.user);
      else setInicializando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") { setUsuario(null); setDados(null); }
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const sair = async () => { await supabase.auth.signOut(); setUsuario(null); setDados(null); };

  /* indicadores: visão do banco + complementos calculados na tela */
  const indicadores = useMemo(() => {
    const m = {};
    if (!dados) return m;
    dados.indicadoresRows.forEach((v) => {
      const lote = dados.lotes.find((l) => l.id === v.id);
      if (!lote) return;
      const bios = dados.biometrias.filter((b) => b.lote === v.id);
      const ganho = Math.max(0.001, nm(v.biomassa_kg) - (lote.alevinos * lote.pesoInicial) / 1000);
      m[v.id] = {
        pesoAtual: nm(v.peso_atual_g),
        populacao: nm(v.populacao),
        mortos: lote.alevinos - nm(v.populacao),
        sobrevivencia: nm(v.sobrevivencia_pct),
        dias: nm(v.dias),
        gpd: nm(v.gpd_g_dia),
        sgr: nm(v.dias) > 0 && lote.pesoInicial > 0
          ? ((Math.log(Math.max(nm(v.peso_atual_g), 0.1)) - Math.log(lote.pesoInicial)) / nm(v.dias)) * 100
          : 0,
        biomassa: nm(v.biomassa_kg),
        racaoTotal: nm(v.racao_kg),
        fca: nm(v.fca),
        densidade: nm(v.densidade_kg_m3),
        valorMercado: nm(v.valor_mercado),
        custoRacaoKg: ganho > 1 ? (nm(v.racao_kg) * CUSTO_MEDIO_RACAO) / ganho : 0,
        bios,
      };
    });
    return m;
  }, [dados]);

  const gerarIdLote = (dataPov) => {
    const ano = String(dataPov).slice(0, 4), mes = String(dataPov).slice(5, 7);
    let id = `L-${ano}-${mes}`;
    let sufixo = 98; // 'b', 'c', …
    while (dados?.lotes.some((l) => l.id === id)) id = `L-${ano}-${mes}${String.fromCharCode(sufixo++)}`;
    return id;
  };

  const exec = async (p) => {
    const { error } = await p;
    if (error) return msgErro(error);
    await carregarDados();
    return null;
  };

  const agir = {
    salvarSocio: (f) => exec(supabase.from("socios").insert({
      nome: f.nome, cpf: f.cpf || null, comunidade: f.comunidade || null,
      telefone: f.telefone || null, data_adesao: f.adesao, cotas: Number(f.cotas) || 0,
    })),

    gerarMensalidades: async () => {
      const { error } = await supabase.rpc("gerar_mensalidades");
      if (error) return msgErro(error);
      await carregarDados();
      return null;
    },

    baixarMensalidade: async (s) => {
      const pend = dados.mensalidadesAbertas
        .filter((mn) => mn.socio_id === s.id)
        .sort((a, b) => String(a.competencia).localeCompare(String(b.competencia)))[0];
      if (!pend) return "Nenhuma mensalidade em aberto para este sócio.";
      const { data: lanc, error: e1 } = await supabase.from("lancamentos").insert({
        data: hojeISO, descricao: "Mensalidade " + dataBR(pend.competencia).slice(3) + " — " + s.nome,
        categoria: "Mensalidades", tipo: "receita", valor: nm(pend.valor), criado_por: usuario.id,
      }).select("id").single();
      if (e1) return msgErro(e1);
      const { error: e2 } = await supabase.from("mensalidades")
        .update({ status: "paga", pago_em: hojeISO }).eq("id", pend.id);
      if (e2) return msgErro(e2);
      await carregarDados();
      return null;
    },

    salvarDocumento: async (f, arquivo) => {
      let arquivo_path = null;
      if (arquivo) {
        arquivo_path = Date.now() + "-" + arquivo.name.replace(/[^\w.\-]+/g, "_");
        const { error: eUp } = await supabase.storage.from("documentos").upload(arquivo_path, arquivo);
        if (eUp) return "Falha ao enviar o arquivo: " + msgErro(eUp);
      }
      return exec(supabase.from("documentos").insert({
        titulo: f.titulo, categoria: CATEGORIA_DOC_ENUM[f.categoria] || "institucional",
        orgao: f.orgao || null, data_emissao: f.emissao || null,
        data_vencimento: f.vencimento || null, arquivo_path, criado_por: usuario.id,
      }));
    },

    abrirDocumento: async (doc) => {
      const { data, error } = await supabase.storage.from("documentos").createSignedUrl(doc.arquivo_path, 300);
      if (error) return msgErro(error);
      window.open(data.signedUrl, "_blank");
      return null;
    },

    novoLancamento: (f) => exec(supabase.from("lancamentos").insert({
      data: f.data, descricao: f.desc, categoria: f.categoria, tipo: f.tipo, valor: f.valor, criado_por: usuario.id,
    })),

    novoTitulo: (tipo, f) => exec(supabase.from("titulos").insert({
      tipo, descricao: f.desc, contraparte: f.contraparte || null, valor: f.valor, vencimento: f.venc,
    })),

    liquidarTitulo: async (t) => {
      const { data: lanc, error: e1 } = await supabase.from("lancamentos").insert({
        data: hojeISO,
        descricao: (t.tipo === "pagar" ? "Pagamento — " : "Recebimento — ") + t.desc +
          (t.contraparte && t.contraparte !== "—" ? " (" + t.contraparte + ")" : ""),
        categoria: "Outros", tipo: t.tipo === "pagar" ? "despesa" : "receita",
        valor: t.valor, criado_por: usuario.id,
      }).select("id").single();
      if (e1) return msgErro(e1);
      const { error: e2 } = await supabase.from("titulos")
        .update({ status: "liquidado", liquidado_em: hojeISO, lancamento_id: lanc.id }).eq("id", t.id);
      if (e2) return msgErro(e2);
      await carregarDados();
      return null;
    },

    novoItemEstoque: (f) => exec(supabase.from("estoque_itens").insert({
      item: f.item, unidade: f.unidade || "unidade", quantidade: Number(f.qtd) || 0,
      minimo: Number(f.minimo) || 0, custo_unitario: Number(f.custo) || 0,
    })),

    movimentarEstoque: (itemId, tipo, qtd) => exec(supabase.from("estoque_movimentos").insert({
      item_id: itemId, tipo, quantidade: qtd, criado_por: usuario.id,
    })),

    novoFuncionario: (f) => exec(supabase.from("funcionarios").insert({
      nome: f.nome, cargo: f.cargo || null, data_admissao: f.admissao, salario: Number(f.salario) || 0,
    })),

    novoLote: (f) => exec(supabase.from("lotes").insert({
      id: gerarIdLote(f.dataPovoamento), especie_id: ESPECIES[f.especie]?.id,
      tanque_id: f.tanque, quantidade_alevinos: Number(f.alevinos),
      data_povoamento: f.dataPovoamento, peso_inicial_g: Number(f.pesoInicial) || 1,
      custo_alevinos: Number(f.custoAlevinos) || 0,
    })),

    registrarAlimentacao: (loteId, f) => exec(supabase.from("alimentacoes").insert({
      lote_id: loteId, data: f.data, racao: f.racao, quantidade_kg: Number(f.kg), criado_por: usuario.id,
    })),

    registrarBiometria: (loteId, f) => exec(supabase.from("biometrias").insert({
      lote_id: loteId, data: f.data, peso_medio_g: Number(f.peso), amostra: Number(f.amostra) || null, criado_por: usuario.id,
    })),

    registrarMortalidade: (loteId, f) => exec(supabase.from("mortalidades").insert({
      lote_id: loteId, data: f.data, quantidade: Number(f.qtd), causa: f.causa || "Não identificada", criado_por: usuario.id,
    })),

    despescar: async (loteId) => {
      const { error } = await supabase.rpc("registrar_despesca", { p_lote: loteId });
      if (error) return msgErro(error);
      await carregarDados();
      return null;
    },
  };

  if (inicializando) return <TelaCarregando texto="Conectando ao sistema…" />;
  if (!usuario) return <Login aoEntrar={aoEntrar} avisoExterno={avisoLogin} />;
  if (!dados) return <TelaCarregando />;

  const modulos = MODULOS.filter((m) => (ACESSO[usuario.papel] || []).includes(m.id));
  const podeEditar = usuario.papel !== "cooperado";
  const moduloAtual = MODULOS.find((m) => m.id === aba);
  const iniciais = usuario.nome.split(" ").map((p) => p[0]).slice(0, 2).join("");
  const dataLonga = HOJE.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="app">
      <style>{STYLE + STYLE_EXTRA}</style>
      {erroGlobal && <div className="erro-global" onClick={() => setErroGlobal("")}>{erroGlobal} — toque para fechar</div>}
      <aside className="sidebar">
        <div className="brand">
          <div className="wordmark brand-txt">COOPA<em>TA</em></div>
          <span className="regua" />
          <div className="wordmark-sub brand-txt">Piscicultura · Santarém · PA</div>
        </div>
        <nav className="nav">
          {modulos.map((m) => (
            <button key={m.id} className={"navbtn " + (aba === m.id ? "ativo" : "")} onClick={() => setAba(m.id)} title={m.rotulo}>
              <m.Icone size={17} /> <span className="nav-rot">{m.rotulo}</span>
            </button>
          ))}
        </nav>
        <div className="side-user">
          <div className="avatar">{iniciais}</div>
          <div className="side-user-info"><b>{usuario.nome}</b><span>{PAPEIS[usuario.papel]}</span></div>
        </div>
        <button className="btn-sair" onClick={sair}><LogOut size={14} /> <span className="side-foot-txt">Sair do sistema</span></button>
      </aside>

      <div className="main">
        <div className="topbar">
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {moduloAtual?.rotulo}
            {!podeEditar && <Badge tom="muted"><Eye size={11} /> Somente leitura</Badge>}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-sm" onClick={carregarDados} disabled={carregando} title="Buscar os dados mais recentes">
              <RefreshCw size={13} /> {carregando ? "Atualizando…" : "Atualizar"}
            </button>
            <div className="data-hoje"><Calendar size={14} /> {dataLonga}</div>
          </div>
        </div>
        <Waterline />
        <div className="content">
          {aba === "dashboard" && <Dashboard dados={dados} indicadores={indicadores} />}
          {aba === "producao" && <Producao dados={dados} indicadores={indicadores} podeEditar={podeEditar} agir={agir} />}
          {aba === "financeiro" && <Financeiro dados={dados} podeEditar={podeEditar} agir={agir} />}
          {aba === "socios" && <Socios dados={dados} podeEditar={podeEditar} agir={agir} />}
          {aba === "documentos" && <Documentos dados={dados} podeEditar={podeEditar} agir={agir} />}
          {aba === "estoque" && <Estoque dados={dados} podeEditar={podeEditar} agir={agir} />}
          {aba === "balanco" && <Balanco dados={dados} indicadores={indicadores} />}
          {aba === "funcionarios" && <Funcionarios dados={dados} podeEditar={podeEditar} agir={agir} />}
          {aba === "relatorios" && <Relatorios usuario={usuario} dados={dados} indicadores={indicadores} />}
        </div>
      </div>
    </div>
  );
}