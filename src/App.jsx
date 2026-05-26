import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import * as api from "./lib/api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─────────────────────────────────────────────
// LOGO SVG — montanha low-poly Apex
// ─────────────────────────────────────────────
function ApexLogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,8 62,32 50,26" fill="#b8d4f0"/>
      <polygon points="50,8 38,32 50,26" fill="#dceeff"/>
      <polygon points="50,26 62,32 74,52 50,46" fill="#3b6ea8"/>
      <polygon points="50,26 38,32 26,52 50,46" fill="#5b8ec8"/>
      <polygon points="74,52 50,46 58,68 82,64" fill="#1e3d6e"/>
      <polygon points="26,52 50,46 42,68 18,64" fill="#2a5090"/>
      <polygon points="50,46 58,68 50,72 42,68" fill="#4a7ab8"/>
      <polygon points="82,64 58,68 66,88 90,80" fill="#0f2444"/>
      <polygon points="18,64 42,68 34,88 10,80" fill="#162e58"/>
      <polygon points="66,88 50,72 34,88" fill="#1a3560"/>
    </svg>
  );
}

function ApexLogoFull({ collapsed = false }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <ApexLogoMark size={34} />
      {!collapsed && (
        <div>
          <div style={{ color:"#fff", fontFamily:"'Outfit', sans-serif", fontWeight:600, fontSize:14, letterSpacing:"0.06em", lineHeight:1.2 }}>APEX</div>
          <div style={{ color:"#64748b", fontFamily:"'Outfit', sans-serif", fontWeight:400, fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase" }}>Solicitações</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ICONS — SVG inline, zero emoji
// ─────────────────────────────────────────────
const Icon = ({ name, size=16, color="currentColor", style={} }) => {
  const icons = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    table: <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    ticket: <><path d="M2 9a3 3 0 010-6h20a3 3 0 010 6"/><path d="M2 15a3 3 0 000 6h20a3 3 0 000-6"/><line x1="2" y1="12" x2="22" y2="12"/></>,
    history: <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    chevronDown: <polyline points="6 9 12 15 18 9"/>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
    menu: <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    paperclip: <><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.06-1.06a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    alertCircle: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    checkCircle: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff: <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>,
    messageSquare: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
    trendingUp: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    barChart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    logOut: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {icons[name]}
    </svg>
  );
};

// ─────────────────────────────────────────────
// RESPONSIVE HOOK
// ─────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [])
  return useMemo(() => ({
    isMobile: w < 768,
    isTablet: w >= 768 && w < 1024,
    isDesktop: w >= 1024,
    isTv: w >= 1600,
    w,
  }), [w]);
}

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const TEAMS = [
  { id:"t1", name:"BI", slug:"bi", color:"#6366f1" },
  { id:"t2", name:"Suporte", slug:"suporte", color:"#0ea5e9" },
  { id:"t3", name:"TI / Projetos", slug:"ti-projetos", color:"#10b981" },
];
const USERS = [
  { id:"u1", full_name:"Allan Gestor", email:"allan@alpesmidia.com", role:"admin", team_id:null, whatsapp:"5511999990001", avatar:null },
  { id:"u2", full_name:"Carlos BI", email:"carlos@alpesmidia.com", role:"membro_equipe", team_id:"t1", whatsapp:"5511999990002", avatar:null },
  { id:"u3", full_name:"Fernanda Suporte", email:"fernanda@alpesmidia.com", role:"membro_equipe", team_id:"t2", whatsapp:"5511999990003", avatar:null },
  { id:"u4", full_name:"Rafael TI", email:"rafael@alpesmidia.com", role:"membro_equipe", team_id:"t3", whatsapp:"5511999990004", avatar:null },
  { id:"u5", full_name:"Juliana Solicitante", email:"juliana@alpesmidia.com", role:"solicitante", team_id:null, whatsapp:null, avatar:null },
];
const REQUEST_TYPES = [
  { id:"rt1", name:"Novo Relatório", team_id:"t1" },
  { id:"rt2", name:"Correção de Dados", team_id:"t1" },
  { id:"rt3", name:"Suporte Técnico", team_id:"t2" },
  { id:"rt4", name:"Acesso ao Sistema", team_id:"t2" },
  { id:"rt5", name:"Novo Projeto", team_id:"t3" },
  { id:"rt6", name:"Infraestrutura", team_id:"t3" },
  { id:"rt7", name:"Automação", team_id:"t3" },
];
const STATUSES = [
  { key:"nova", label:"Nova", color:"#6b7280", bg:"#f3f4f6" },
  { key:"em_analise", label:"Em Análise", color:"#d97706", bg:"#fffbeb" },
  { key:"em_andamento", label:"Em Andamento", color:"#2563eb", bg:"#eff6ff" },
  { key:"aguardando_solicitante", label:"Aguard. Solicitante", color:"#7c3aed", bg:"#f5f3ff" },
  { key:"aguardando_terceiro", label:"Aguard. Terceiro", color:"#c2410c", bg:"#fff7ed" },
  { key:"finalizada", label:"Finalizada", color:"#16a34a", bg:"#f0fdf4" },
  { key:"cancelada", label:"Cancelada", color:"#dc2626", bg:"#fef2f2" },
];
const PRIORITIES = [
  { key:"baixa", label:"Baixa", color:"#16a34a" },
  { key:"media", label:"Média", color:"#ca8a04" },
  { key:"alta", label:"Alta", color:"#dc2626" },
  { key:"critica", label:"Crítica", color:"#7c2d12" },
];
const ROLES = [
  { key:"admin",      label:"Admin",      desc:"Acesso total e exclusivo", color:"#7c3aed", bg:"#f5f3ff" },
  { key:"supervisor", label:"Supervisor", desc:"Gestão completa exceto admins", color:"#dc2626", bg:"#fef2f2" },
  { key:"gestor",     label:"Gestor",     desc:"Vê tudo, reatribui e gerencia", color:"#2563eb", bg:"#eff6ff" },
  { key:"membro_equipe", label:"Membro de Equipe", desc:"Atende solicitações da equipe", color:"#0891b2", bg:"#ecfeff" },
  { key:"solicitante", label:"Solicitante", desc:"Abre e acompanha solicitações", color:"#16a34a", bg:"#f0fdf4" },
];
const INITIAL_REQUESTS = [
  { id:"r1", protocol:"APEX-2025-01000", title:"Dashboard de faturamento mensal", description:"Precisamos de um dashboard consolidado com faturamento por emissora.", team_id:"t1", type_id:"rt1", status:"em_andamento", priority:"alta", requester_id:"u5", assignee_id:"u2", client_name:"Alpes Mídia", created_at:"2025-05-10T09:00:00Z", updated_at:"2025-05-12T14:00:00Z", attachments:[{ id:"a1", file_name:"briefing.pdf", file_size:204800, uploader_id:"u5", created_at:"2025-05-10T09:05:00Z" }], comments:[{ id:"c1", author_id:"u2", content:"Iniciado levantamento das fontes de dados.", visibility:"publico", created_at:"2025-05-11T10:00:00Z" },{ id:"c2", author_id:"u1", content:"Prioridade elevada a pedido do diretor.", visibility:"interno", created_at:"2025-05-12T08:00:00Z" }], history:[{ id:"h1", actor_id:"u5", action:"created", old_value:null, new_value:"nova", created_at:"2025-05-10T09:00:00Z" },{ id:"h2", actor_id:"u2", action:"status_changed", old_value:"nova", new_value:"em_andamento", created_at:"2025-05-11T09:30:00Z" }] },
  { id:"r2", protocol:"APEX-2025-01001", title:"Erro nos dados de leads de abril", description:"Relatórios mostram valores duplicados.", team_id:"t1", type_id:"rt2", status:"nova", priority:"critica", requester_id:"u5", assignee_id:null, client_name:"Comercial", created_at:"2025-05-13T11:00:00Z", updated_at:"2025-05-13T11:00:00Z", attachments:[], comments:[], history:[{ id:"h3", actor_id:"u5", action:"created", old_value:null, new_value:"nova", created_at:"2025-05-13T11:00:00Z" }] },
  { id:"r3", protocol:"APEX-2025-01002", title:"Acesso ao sistema de automação", description:"Solicito acesso ao N8N.", team_id:"t2", type_id:"rt4", status:"em_analise", priority:"media", requester_id:"u5", assignee_id:"u3", client_name:null, created_at:"2025-05-14T08:00:00Z", updated_at:"2025-05-14T15:00:00Z", attachments:[], comments:[{ id:"c3", author_id:"u3", content:"Verificando permissões necessárias.", visibility:"publico", created_at:"2025-05-14T15:00:00Z" }], history:[{ id:"h4", actor_id:"u5", action:"created", old_value:null, new_value:"nova", created_at:"2025-05-14T08:00:00Z" },{ id:"h5", actor_id:"u3", action:"status_changed", old_value:"nova", new_value:"em_analise", created_at:"2025-05-14T15:00:00Z" }] },
  { id:"r4", protocol:"APEX-2025-01003", title:"Servidor de staging fora do ar", description:"Inacessível desde ontem.", team_id:"t3", type_id:"rt6", status:"em_andamento", priority:"critica", requester_id:"u2", assignee_id:"u4", client_name:null, created_at:"2025-05-15T07:00:00Z", updated_at:"2025-05-15T09:00:00Z", attachments:[], comments:[], history:[{ id:"h6", actor_id:"u2", action:"created", old_value:null, new_value:"nova", created_at:"2025-05-15T07:00:00Z" }] },
  { id:"r5", protocol:"APEX-2025-01004", title:"Automação envio de relatórios", description:"Envio semanal para a diretoria.", team_id:"t3", type_id:"rt7", status:"finalizada", priority:"media", requester_id:"u5", assignee_id:"u4", client_name:"Diretoria", created_at:"2025-05-01T10:00:00Z", updated_at:"2025-05-12T16:00:00Z", attachments:[], comments:[{ id:"c4", author_id:"u4", content:"Automação criada e testada. Envios toda segunda às 8h.", visibility:"publico", created_at:"2025-05-12T16:00:00Z" }], history:[{ id:"h7", actor_id:"u5", action:"created", old_value:null, new_value:"nova", created_at:"2025-05-01T10:00:00Z" },{ id:"h8", actor_id:"u4", action:"status_changed", old_value:"em_andamento", new_value:"finalizada", created_at:"2025-05-12T16:00:00Z" }] },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const gs = k => STATUSES.find(s=>s.key===k)||STATUSES[0];
const gp = k => PRIORITIES.find(p=>p.key===k)||PRIORITIES[1];
const gt = id => TEAMS.find(t=>t.id===id);
const gu = id => USERS.find(u=>u.id===id);
const gtype = id => REQUEST_TYPES.find(t=>t.id===id);
const grc = k => ROLES.find(r=>r.key===k)||ROLES[4];
const fd = d => d?new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit"}):"—";
const fdt = d => d?new Date(d).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"—";
const fsz = b => b>1048576?(b/1048576).toFixed(1)+" MB":Math.round(b/1024)+" KB";
const teamById = (teams, id) => teams?.find(t=>t.id===id) || gt(id);
const userById = (users, id) => users?.find(u=>u.id===id) || gu(id);
const requestAssignee = (request, users) => request._assignee || userById(users, request.assignee_id);
const requestRequester = (request, users) => request._requester || userById(users, request.requester_id);
const isStaffRole = role => ["admin","gestor","supervisor","membro_equipe"].includes(role);

const inp = { width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:14, outline:"none", background:"#fafafa", color:"#0f172a", WebkitAppearance:"none", fontFamily:"'DM Sans', sans-serif" };
const Field = ({ label, children }) => (
  <div>
    <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, fontFamily:"'DM Sans', sans-serif" }}>{label}</label>
    {children}
  </div>
);
const VisibilityToggle = ({ value, onChange }) => (
  <div style={{ display:"flex", gap:6 }}>
    {["publico","interno"].map(v => (
      <button key={v}
        type="button"
        onClick={() => onChange(v)}
        style={{
          padding:"8px 16px", borderRadius:8,
          border:`1.5px solid ${value===v?"#1e3d6e":"#e2e8f0"}`,
          background: value===v ? "#eff6ff" : "#fff",
          color: value===v ? "#1e3d6e" : "#64748b",
          cursor:"pointer", fontSize:13,
          fontWeight: value===v ? 600 : 400,
          fontFamily:"'DM Sans',sans-serif",
        }}>
        {v==="publico" ? "Público" : "Interno"}
      </button>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// AVATAR com foto
// ─────────────────────────────────────────────
function Avatar({ user, size = 32 }) {
  const colors = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"];
  const color = colors[(user?.full_name?.charCodeAt(0) || 0) % colors.length];
  const initials = user?.full_name
    ?.split(" ").slice(0, 2).map(n => n[0]).join("") || "?";
  const avatarUrl = user?.avatar_url || user?.avatar;

  if (avatarUrl) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        background: color,
      }}>
        <img
          src={avatarUrl}
          alt={user?.full_name || ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
          onError={(e) => {
            e.target.parentElement.style.display = "flex";
            e.target.parentElement.style.alignItems = "center";
            e.target.parentElement.style.justifyContent = "center";
            e.target.style.display = "none";
            e.target.parentElement.innerHTML =
              `<span style="color:#fff;font-weight:600;font-size:${Math.round(size * 0.36)}px">${initials}</span>`;
          }}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontWeight: 600,
      fontSize: size * 0.36,
      flexShrink: 0,
      fontFamily: "system-ui, sans-serif",
    }}>
      {initials}
    </div>
  );
}

const Badge = ({ label, color, bg, small }) => (
  <span style={{ display:"inline-flex", alignItems:"center", padding:small?"2px 7px":"3px 10px", borderRadius:20, fontSize:small?11:12, fontWeight:600, color, background:bg, whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>{label}</span>
);

const PriorityDot = ({ priority }) => {
  const p = gp(priority);
  return <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:p.color, marginRight:5, flexShrink:0 }} />;
};

// ─────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────
function LoginAnimatedBackground() {
  const loginCanvasRef = useCallback(el => {
    if (!el) return undefined;
    let raf = null;
    let t = 0;

    const init = () => {
      const rect = el.getBoundingClientRect();
      el.width = rect.width || window.innerWidth;
      el.height = rect.height || window.innerHeight;
      const w = el.width;
      const h = el.height;
      const ctx = el.getContext("2d");

      const animate = () => {
        ctx.clearRect(0, 0, w, h);

        const m1x = [0,0.08,0.22,0.38,0.5,0.65,0.8,0.94,1];
        const m1y = [1,0.72,0.52,0.38,0.3,0.4,0.54,0.7,1];
        ctx.beginPath();
        m1x.forEach((x,i) => i === 0 ? ctx.moveTo(x*w,m1y[i]*h) : ctx.lineTo(x*w,m1y[i]*h));
        ctx.closePath();
        ctx.fillStyle = "rgba(12,24,52,0.22)";
        ctx.fill();
        ctx.strokeStyle = "rgba(30,61,110,0.1)";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        const m2x = [0,0.12,0.3,0.5,0.7,0.88,1];
        const m2y = [1,0.8,0.62,0.48,0.6,0.75,1];
        ctx.beginPath();
        m2x.forEach((x,i) => i === 0 ? ctx.moveTo(x*w,m2y[i]*h) : ctx.lineTo(x*w,m2y[i]*h));
        ctx.closePath();
        ctx.fillStyle = "rgba(20,38,80,0.15)";
        ctx.fill();

        const m3x = [0,0.2,0.5,0.8,1];
        const m3y = [1,0.88,0.72,0.84,1];
        ctx.beginPath();
        m3x.forEach((x,i) => i === 0 ? ctx.moveTo(x*w,m3y[i]*h) : ctx.lineTo(x*w,m3y[i]*h));
        ctx.closePath();
        ctx.fillStyle = "rgba(15,28,60,0.1)";
        ctx.fill();

        const cx = w * 0.5;
        const cy = h * 1.05;
        for (let i = 1; i <= 6; i++) {
          const phase = ((t*0.35 + i*0.55) % 1);
          const r = phase * w * 0.75;
          const alpha = (1-phase) * 0.06;
          ctx.beginPath();
          ctx.arc(cx, cy, r, Math.PI*1.1, Math.PI*1.9);
          ctx.strokeStyle = `rgba(59,110,168,${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        t += 0.007;
        raf = requestAnimationFrame(animate);
      };
      animate();
    };

    requestAnimationFrame(init);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={loginCanvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        display: "block",
      }}
    />
  );
}

function AppAnimatedBackground() {
  const bgCanvasRef = useCallback(el => {
    if (!el) return undefined;
    let raf = null;
    let t = 0;

    const init = () => {
      el.width = window.innerWidth;
      el.height = window.innerHeight;
      const ctx = el.getContext("2d");
      const w = el.width;
      const h = el.height;

      const animate = () => {
        ctx.clearRect(0, 0, w, h);

        const pts = [[0,1],[0.15,0.72],[0.35,0.52],[0.55,0.62],[0.75,0.7],[1,0.78],[1,1]];
        ctx.beginPath();
        pts.forEach((p,i) => i === 0 ? ctx.moveTo(p[0]*w,p[1]*h) : ctx.lineTo(p[0]*w,p[1]*h));
        ctx.closePath();
        ctx.fillStyle = "rgba(30,61,110,0.025)";
        ctx.fill();

        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const y = 3 + Math.sin(x/w*Math.PI*8 + t*1.2) * 1.5;
          x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = "rgba(30,61,110,0.06)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        for (let i = 1; i <= 4; i++) {
          const phase = ((t*0.28 + i*0.65) % 1);
          const r = phase * w * 0.45;
          const alpha = (1-phase) * 0.035;
          ctx.beginPath();
          ctx.arc(w*0.95, h*1.1, r, 0, Math.PI*2);
          ctx.strokeStyle = `rgba(30,61,110,${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        t += 0.007;
        raf = requestAnimationFrame(animate);
      };
      animate();
    };

    requestAnimationFrame(init);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={bgCanvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        display: "block",
      }}
    />
  );
}

function LoginScreen({ onLogin, onGoogleLogin }) {
  const [tab, setTab] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) return;
    setError("");
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err?.message || "Erro ao entrar. Verifique seus dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await onGoogleLogin();
    } catch (err) {
      setError(err?.message || "Erro ao entrar com Google.");
      setLoading(false);
    }
  };

  return (
    <div style={{ position:"relative", minHeight:"100vh", background:"#07101f", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans', sans-serif" }}>
      <LoginAnimatedBackground />
      {/* Background mountain image overlay */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 60%, rgba(30,61,110,0.4) 0%, rgba(6,13,26,0.95) 70%)", zIndex:1 }} />
      {/* Subtle grid */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(59,110,168,0.04) 1px, transparent 1px),linear-gradient(90deg, rgba(59,110,168,0.04) 1px, transparent 1px)", backgroundSize:"40px 40px", zIndex:1 }} />

      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:420, padding:"0 20px" }}>
        {/* Logo area */}
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
            <ApexLogoMark size={64} />
          </div>
          <div style={{ color:"#fff", fontFamily:"'Outfit', sans-serif", fontWeight:600, fontSize:28, letterSpacing:"0.12em", marginBottom:4 }}>APEX</div>
          <div style={{ color:"#4a7ab8", fontFamily:"'Outfit', sans-serif", fontWeight:300, fontSize:13, letterSpacing:"0.3em", textTransform:"uppercase", marginBottom:8 }}>Solicitações</div>
          <div style={{ width:40, height:1, background:"rgba(74,122,184,0.4)", margin:"0 auto 8px" }} />
          <div style={{ color:"#334155", fontFamily:"'Outfit', sans-serif", fontWeight:300, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase" }}>Alpes Mídia</div>
        </div>

        {/* Card */}
        <div style={{ background:"rgba(15,23,42,0.8)", border:"1px solid rgba(59,110,168,0.2)", borderRadius:16, padding:"32px", backdropFilter:"blur(20px)" }}>
          {/* Tabs */}
          <div style={{ display:"flex", gap:0, marginBottom:28, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
            {[["email","E-mail e senha"],["google","Google"]].map(([k,l]) => (
              <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:"10px", border:"none", background:"transparent", cursor:"pointer", fontSize:13, fontWeight:tab===k?600:400, color:tab===k?"#7eb3e8":"#475569", borderBottom:tab===k?"2px solid #3b6ea8":"2px solid transparent", transition:"all 0.2s", fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
            ))}
          </div>

          {tab==="email" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Field label="E-mail">
                <div style={{ position:"relative" }}>
                  <Icon name="mail" size={16} color="#475569" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
                  <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@alpesmidia.com" type="email"
                    style={{ ...inp, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(59,110,168,0.25)", color:"#e2e8f0", paddingLeft:38 }}
                    onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
                </div>
              </Field>
              <Field label="Senha">
                <div style={{ position:"relative" }}>
                  <Icon name="lock" size={16} color="#475569" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
                  <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" type={showPass?"text":"password"}
                    style={{ ...inp, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(59,110,168,0.25)", color:"#e2e8f0", paddingLeft:38, paddingRight:38 }}
                    onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
                  <button onClick={()=>setShowPass(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                    <Icon name={showPass?"eyeOff":"eye"} size={15} color="#475569" />
                  </button>
                </div>
              </Field>
              <button onClick={handleLogin} disabled={loading||!email||!password}
                style={{ width:"100%", padding:"12px", background: loading||!email||!password?"rgba(59,110,168,0.3)":"linear-gradient(135deg,#1e3d6e,#3b6ea8)", color:"#fff", border:"none", borderRadius:8, cursor:loading||!email||!password?"not-allowed":"pointer", fontSize:14, fontWeight:600, fontFamily:"'Outfit',sans-serif", letterSpacing:"0.05em", transition:"all 0.2s" }}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
              {error&&<div style={{ color:"#fca5a5", fontSize:12, lineHeight:1.5, textAlign:"center", fontFamily:"'DM Sans',sans-serif" }}>{error}</div>}
              <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#475569", textAlign:"center", fontFamily:"'DM Sans',sans-serif" }}>
                Esqueci minha senha
              </button>
            </div>
          )}

          {tab==="google" && (
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:13, color:"#475569", marginBottom:20, lineHeight:1.6 }}>Faça login com sua conta Google corporativa da Alpes Mídia.</p>
              <button onClick={handleGoogleLogin} disabled={loading} style={{ width:"100%", padding:"12px 16px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, cursor:loading?"not-allowed":"pointer", fontSize:14, color:"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                {loading ? "Entrando..." : "Continuar com Google"}
              </button>
              {error&&<div style={{ color:"#fca5a5", fontSize:12, lineHeight:1.5, textAlign:"center", marginTop:12, fontFamily:"'DM Sans',sans-serif" }}>{error}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:32, color:"#1e293b", fontSize:11, fontFamily:"'Outfit',sans-serif", letterSpacing:"0.1em" }}>
          APEX SOLICITAÇÕES · ALPES GRUPO · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BOTTOM NAV (mobile)
// ─────────────────────────────────────────────
function BottomNav({ currentUser, view, setView }) {
  const isSolicitante = currentUser.role==="solicitante";
  const isAdmin = ["admin","gestor","supervisor"].includes(currentUser.role);
  const items = isSolicitante
    ? [{ key:"my-requests", icon:"ticket", label:"Minhas" }, { key:"new", icon:"plus", label:"Nova" }]
    : [{ key:"dashboard", icon:"home", label:"Início" }, { key:"requests", icon:"ticket", label:"Pedidos" }, { key:"historico", icon:"history", label:"Histórico" }, { key:"new", icon:"plus", label:"Nova" }, ...(isAdmin?[{ key:"admin-users", icon:"users", label:"Admin" }]:[]) ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:"1px solid #e2e8f0", display:"flex", zIndex:200, paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
      {items.map(item => (
        <button key={item.key} onClick={()=>setView(item.key)}
          style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 4px 8px", border:"none", background:"transparent", cursor:"pointer", gap:3, color:view===item.key?"#3b6ea8":"#94a3b8" }}>
          <Icon name={item.icon} size={19} color={view===item.key?"#3b6ea8":"#94a3b8"} />
          <span style={{ fontSize:10, fontWeight:view===item.key?600:400, fontFamily:"'DM Sans',sans-serif" }}>{item.label}</span>
          {view===item.key&&<div style={{ width:16, height:2, borderRadius:1, background:"#3b6ea8", marginTop:2 }} />}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function Sidebar({ currentUser, view, setView, open, setOpen, bp }) {
  const [adminOpen, setAdminOpen] = useState(true);
  const isSolicitante = currentUser.role==="solicitante";
  const isAdmin = ["admin","supervisor"].includes(currentUser.role);
  const collapsed = !open;
  const w = collapsed?60:bp.isTv?220:200;

  const navItems = isSolicitante
    ? [{ key:"my-requests", label:"Minhas Solicitações", icon:"ticket" }, { key:"new", label:"Nova Solicitação", icon:"plus" }]
    : [{ key:"dashboard", label:"Dashboard", icon:"home" }, { key:"requests", label:"Solicitações", icon:"ticket" }, { key:"historico", label:"Histórico", icon:"history" }, { key:"new", label:"Nova Solicitação", icon:"plus" }];
  const adminItems = [
    { key:"admin-users", label:"Usuários", icon:"users" },
    { key:"admin-teams", label:"Equipes", icon:"layers" },
    { key:"admin-types", label:"Tipos", icon:"tag" },
    ...(currentUser.role === "admin" ? [{ key:"auditoria", label:"Auditoria", icon:"eye" }] : []),
  ];

  const NavBtn = ({ item }) => (
    <button onClick={()=>{ setView(item.key); if(bp.isTablet) setOpen(false); }}
      style={{ display:"flex", alignItems:"center", gap:collapsed?0:10, width:"100%", padding:collapsed?"10px 0":"8px 10px", borderRadius:8, border:"none", background:view===item.key?"rgba(59,110,168,0.15)":"transparent", color:view===item.key?"#7eb3e8":"#64748b", cursor:"pointer", fontSize:bp.isTv?14:13, fontWeight:view===item.key?600:400, justifyContent:collapsed?"center":"flex-start", marginBottom:2, fontFamily:"'DM Sans',sans-serif" }}>
      <Icon name={item.icon} size={16} color={view===item.key?"#7eb3e8":"#64748b"} />
      {!collapsed&&item.label}
    </button>
  );

  return (
    <>
      {bp.isTablet&&open&&<div onClick={()=>setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:99 }} />}
      <div style={{ width:w, minWidth:w, background:"#0a1220", display:"flex", flexDirection:"column", overflow:"hidden", transition:"width 0.2s, min-width 0.2s", height:"100vh", zIndex:100, position:bp.isTablet?"fixed":"relative", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.05)" }}>
        {/* Logo */}
        <div style={{ padding:collapsed?"14px 10px":"18px 16px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:collapsed?"center":"flex-start" }}>
          <ApexLogoFull collapsed={collapsed} />
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:collapsed?"10px 6px":"12px 8px", overflowY:"auto" }}>
          {!collapsed&&<div style={{ color:"#1e3a5f", fontSize:10, fontWeight:700, letterSpacing:1.2, padding:"6px 8px 4px", textTransform:"uppercase", fontFamily:"'Outfit',sans-serif" }}>Menu</div>}
          {navItems.map(item=><NavBtn key={item.key} item={item} />)}

          {/* Admin section colapsável */}
          {isAdmin&&(
            <>
              {!collapsed ? (
                <button onClick={()=>setAdminOpen(v=>!v)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"8px 8px 4px", border:"none", background:"transparent", cursor:"pointer", marginTop:8 }}>
                  <span style={{ color:"#1e3a5f", fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", fontFamily:"'Outfit',sans-serif" }}>Admin</span>
                  <Icon name={adminOpen?"chevronDown":"chevronRight"} size={13} color="#1e3a5f" />
                </button>
              ) : <div style={{ height:8 }} />}
              {(adminOpen||collapsed)&&adminItems.map(item=><NavBtn key={item.key} item={item} />)}
            </>
          )}
        </nav>

        {/* Footer — apenas rodapé do sistema, sem nome do usuário */}
        {!collapsed&&(
          <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize:10, color:"#1e3a5f", fontFamily:"'Outfit',sans-serif", letterSpacing:"0.1em", textTransform:"uppercase", textAlign:"center" }}>
              Apex Solicitações · Alpes Grupo
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────
function Topbar({ currentUser, view, setSidebarOpen, bp, onLogout }) {
  const titles = { dashboard:"Dashboard", requests:"Solicitações", historico:"Histórico", new:"Nova Solicitação", detail:"Solicitação", "my-requests":"Minhas Solicitações", "admin-users":"Usuários", "admin-teams":"Equipes", "admin-types":"Tipos", auditoria:"Auditoria" };
  return (
    <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"0 20px", height:bp.isTv?64:56, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
      {!bp.isMobile&&<button onClick={()=>setSidebarOpen(v=>!v)} style={{ background:"none", border:"none", cursor:"pointer", padding:6, borderRadius:6, color:"#64748b" }}><Icon name="menu" size={18} color="#64748b" /></button>}
      {bp.isMobile&&<div style={{ display:"flex", alignItems:"center", gap:8 }}><ApexLogoMark size={26} /><span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, letterSpacing:"0.06em", color:"#0f172a" }}>APEX</span></div>}
      <h1 style={{ fontSize:bp.isMobile?14:15, fontWeight:600, color:"#0f172a", flex:1, fontFamily:"'Outfit',sans-serif", letterSpacing:"0.02em" }}>{!bp.isMobile&&titles[view]}</h1>
      {/* User info — apenas aqui, removido do sidebar */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {!bp.isMobile&&(
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#0f172a", fontFamily:"'DM Sans',sans-serif" }}>{currentUser.full_name}</div>
            <div style={{ fontSize:11, color:"#94a3b8", textTransform:"capitalize", fontFamily:"'DM Sans',sans-serif" }}>{grc(currentUser.role).label}</div>
          </div>
        )}
        <Avatar user={currentUser} size={32} />
        <button onClick={onLogout} style={{ background:"none", border:"none", cursor:"pointer", padding:6, borderRadius:6, color:"#94a3b8" }} title="Sair">
          <Icon name="logOut" size={16} color="#94a3b8" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// REQUEST CARD
// ─────────────────────────────────────────────
function RequestCard({ r, onClick, teams = TEAMS, users = USERS }) {
  const assigneeData = requestAssignee(r, users);
  const s=gs(r.status), p=gp(r.priority), t=r.team || teamById(teams, r.team_id), a=assigneeData;
  const waiting = r.status==="aguardando_solicitante";
  return (
    <div onClick={onClick} style={{ background:"#fff", borderRadius:12, border:waiting?"1.5px solid #fbbf24":"1px solid #e2e8f0", padding:"14px 16px", cursor:"pointer", borderLeft:`4px solid ${t?.color||"#e2e8f0"}`, transition:"all 0.15s" }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform="translateY(-1px)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="none";}}>
      {waiting&&<div style={{ marginBottom:8, display:"inline-flex", alignItems:"center", gap:6, background:"#fef3c7", color:"#92400e", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}><Icon name="alertCircle" size={13} color="#92400e" /> Aguardando sua resposta</div>}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:10, color:"#94a3b8", fontFamily:"monospace", marginBottom:3 }}>{r.protocol}</div>
          <div style={{ fontWeight:600, fontSize:14, color:"#1e293b", lineHeight:1.4, marginBottom:8, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", fontFamily:"'DM Sans',sans-serif" }}>{r.title}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
            <Badge label={s.label} color={s.color} bg={s.bg} small />
            <div style={{ display:"flex", alignItems:"center" }}><PriorityDot priority={r.priority} /><span style={{ fontSize:11, color:p.color, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{p.label}</span></div>
            {t&&<span style={{ fontSize:11, padding:"2px 7px", borderRadius:6, background:t.color+"15", color:t.color, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{t.name}</span>}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
          {a?<Avatar user={a} size={26} />:<div style={{ width:26, height:26, borderRadius:"50%", background:"#f1f5f9", border:"2px dashed #e2e8f0" }} />}
          <span style={{ fontSize:11, color:"#94a3b8", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>{fd(r.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TIMELINE
// ─────────────────────────────────────────────
function Timeline({ request, currentRole }) {
  const events = [];
  request.history.forEach(h=>events.push({...h,_type:"history"}));
  request.comments.forEach(c=>{ if(c.visibility==="publico"||["admin","gestor","supervisor","membro_equipe"].includes(currentRole)) events.push({...c,_type:"comment"}); });
  events.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));

  const cfg = e => {
    if(e._type==="comment") return e.visibility==="interno"?{icon:"lock",color:"#f59e0b",bg:"#fffbeb",border:"#fde68a"}:{icon:"messageSquare",color:"#6366f1",bg:"#eff6ff",border:"#c7d2fe"};
    return {created:{icon:"checkCircle",color:"#16a34a",bg:"#f0fdf4",border:"#bbf7d0"},status_changed:{icon:"trendingUp",color:"#2563eb",bg:"#eff6ff",border:"#bfdbfe"},priority_changed:{icon:"alertCircle",color:"#dc2626",bg:"#fef2f2",border:"#fecaca"},assignee_changed:{icon:"user",color:"#7c3aed",bg:"#f5f3ff",border:"#ddd6fe"}}[e.action]||{icon:"clock",color:"#64748b",bg:"#f8fafc",border:"#e2e8f0"};
  };
  const txt = e => {
    const actor=e.actor || e.author || gu(e.actor_id||e.author_id); const name=actor?.full_name||"Sistema";
    if(e._type==="comment") return {title:name+" comentou",body:e.content};
    return {created:{title:"Solicitação criada por "+name},status_changed:{title:name+" alterou o status",body:(gs(e.old_value)?.label||e.old_value||"—")+" → "+(gs(e.new_value)?.label||e.new_value)},priority_changed:{title:name+" alterou a prioridade",body:(e.old_value||"—")+" → "+(e.new_value||"—")},assignee_changed:{title:name+" alterou o responsável",body:(e.old_value||"Ninguém")+" → "+(e.new_value||"Ninguém")}}[e.action]||{title:e.action};
  };

  if(!events.length) return <div style={{ color:"#94a3b8", fontSize:13, textAlign:"center", padding:"28px 0", fontFamily:"'DM Sans',sans-serif" }}>Nenhuma atividade registrada.</div>;
  return (
    <div style={{ position:"relative" }}>
      {events.length>1&&<div style={{ position:"absolute", left:17, top:20, bottom:20, width:2, background:"linear-gradient(to bottom,#e2e8f0,#f1f5f9)", zIndex:0 }} />}
      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
        {events.map((e,idx)=>{ const c=cfg(e); const t=txt(e); const last=idx===events.length-1; return (
          <div key={e.id} style={{ display:"flex", gap:12, alignItems:"flex-start", paddingBottom:last?0:18, position:"relative", zIndex:1 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:c.bg, border:`2px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name={c.icon} size={14} color={c.color} />
            </div>
            <div style={{ flex:1, paddingTop:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:4 }}>
                <span style={{ fontWeight:600, fontSize:13, color:"#1e293b", fontFamily:"'DM Sans',sans-serif" }}>{t.title}</span>
                {e.visibility==="interno"&&<span style={{ fontSize:11, background:"#fef3c7", color:"#92400e", padding:"1px 6px", borderRadius:4, fontWeight:600 }}>Interno</span>}
                <span style={{ fontSize:11, color:"#94a3b8" }}>{fdt(e.created_at)}</span>
              </div>
              {t.body&&<div style={{ fontSize:13, color:"#475569", background:e._type==="comment"?"#f8fafc":"transparent", border:e._type==="comment"?"1px solid #f1f5f9":"none", borderRadius:e._type==="comment"?8:0, padding:e._type==="comment"?"10px 12px":"2px 0", lineHeight:1.6, fontFamily:"'DM Sans',sans-serif" }}>{t.body}</div>}
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STATUS STEPPER
// ─────────────────────────────────────────────
function StatusStepper({ status, bp }) {
  const steps=[{key:"nova",label:"Recebida"},{key:"em_analise",label:"Análise"},{key:"em_andamento",label:"Andamento"},{key:"finalizada",label:"Finalizada"}];
  const cancelled=status==="cancelada"; const waiting=["aguardando_solicitante","aguardando_terceiro"].includes(status);
  const idx={nova:0,em_analise:1,em_andamento:2,aguardando_solicitante:2,aguardando_terceiro:2,finalizada:4}[status]??0;
  if(cancelled) return <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}><Icon name="x" size={16} color="#dc2626" /><span style={{ fontWeight:600, color:"#dc2626", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Solicitação cancelada</span></div>;
  return (
    <div style={{ background:"#f8fafc", borderRadius:10, padding:"16px", border:"1px solid #e2e8f0" }}>
      {waiting&&<div style={{ marginBottom:12, background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:8, padding:"8px 12px", display:"flex", alignItems:"center", gap:8 }}><Icon name="clock" size={14} color="#c2410c" /><span style={{ fontSize:12, fontWeight:600, color:"#c2410c", fontFamily:"'DM Sans',sans-serif" }}>{status==="aguardando_solicitante"?"Aguardando sua resposta":"Aguardando terceiro"}</span></div>}
      <div style={{ display:"flex", alignItems:"center" }}>
        {steps.map((step,i)=>(
          <div key={step.key} style={{ display:"flex", alignItems:"center", flex:i<steps.length-1?1:0 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:bp?.isMobile?24:28, height:bp?.isMobile?24:28, borderRadius:"50%", background:i<idx?"#1e3d6e":i===idx?"#fff":"#e2e8f0", border:i===idx?"2px solid #3b6ea8":i<idx?"none":"2px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", color:i<idx?"#fff":i===idx?"#3b6ea8":"#94a3b8", fontWeight:700, fontSize:bp?.isMobile?11:13, boxShadow:i===idx?"0 0 0 4px rgba(59,110,168,0.12)":"none", fontFamily:"'DM Sans',sans-serif" }}>
                {i<idx?<Icon name="check" size={12} color="#fff" />:i+1}
              </div>
              <span style={{ fontSize:bp?.isMobile?9:10, fontWeight:(i===idx||i<idx)?600:400, color:i===idx?"#1e3d6e":i<idx?"#374151":"#94a3b8", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>{step.label}</span>
            </div>
            {i<steps.length-1&&<div style={{ flex:1, height:2, background:i<idx?"#1e3d6e":"#e2e8f0", marginBottom:18 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────
function MetricCard({ label, value, color, sub, bp }) {
  return (
    <div style={{ background:"#fff", borderRadius:12, padding:bp?.isMobile?"12px 14px":bp?.isTv?"20px":"16px 18px", border:"1px solid #e2e8f0", textAlign:"center" }}>
      <div style={{ fontSize:bp?.isMobile?22:bp?.isTv?32:26, fontWeight:700, color, fontFamily:"'Outfit',sans-serif" }}>{value}</div>
      <div style={{ fontSize:11, color:"#64748b", marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>{label}</div>
      {sub&&<div style={{ fontSize:10, color:"#94a3b8", marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// MY REQUESTS (solicitante)
// ─────────────────────────────────────────────
function LegacyMyRequestsView({ requests, currentUser, openRequest, setView, bp, teams = TEAMS, users = USERS }) {
  const [tab, setTab] = useState("ativos");
  const [search, setSearch] = useState("");
  const all = requests.filter(x=>x.requester_id===currentUser.id);
  const ativos = all.filter(x=>!["finalizada","cancelada"].includes(x.status));
  const finalizados = all.filter(x=>["finalizada","cancelada"].includes(x.status));
  const listed = useMemo(()=>{ let r=tab==="ativos"?ativos:finalizados; if(search) r=r.filter(x=>x.title.toLowerCase().includes(search.toLowerCase())||x.protocol.includes(search)); return r.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)); },[tab,ativos,finalizados,search]);
  const avgDays = useMemo(()=>{ const res=finalizados.filter(r=>r.created_at&&r.updated_at); if(!res.length) return null; return (res.reduce((acc,r)=>acc+Math.max(0,(new Date(r.updated_at)-new Date(r.created_at))/86400000),0)/res.length).toFixed(1); },[finalizados]);

  return (
    <div style={{ paddingBottom:bp.isMobile?80:0 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        <MetricCard label="Total" value={all.length} color="#1e3d6e" bp={bp} />
        <MetricCard label="Em Aberto" value={ativos.length} color="#2563eb" bp={bp} />
        <MetricCard label="Finalizadas" value={finalizados.filter(x=>x.status==="finalizada").length} color="#16a34a" bp={bp} />
        <MetricCard label="Canceladas" value={finalizados.filter(x=>x.status==="cancelada").length} color="#dc2626" bp={bp} />
      </div>
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden", marginBottom:14 }}>
        <div style={{ display:"flex", borderBottom:"1px solid #f1f5f9" }}>
          {[["ativos",`Em Aberto (${ativos.length})`],["finalizados",`Finalizados (${finalizados.length})`]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:"13px 16px", border:"none", background:"transparent", cursor:"pointer", fontSize:13, fontWeight:tab===k?600:400, color:tab===k?"#1e3d6e":"#64748b", borderBottom:tab===k?"2px solid #1e3d6e":"2px solid transparent", fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
          ))}
          {!bp.isMobile&&<button onClick={()=>setView("new")} style={{ padding:"10px 18px", background:"#1e3d6e", color:"#fff", border:"none", borderLeft:"1px solid #e2e8f0", cursor:"pointer", fontSize:13, fontWeight:600, whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>+ Nova</button>}
        </div>
        {tab==="finalizados"&&finalizados.length>0&&(
          <div style={{ padding:"10px 16px", background:"#f8fafc", borderBottom:"1px solid #f1f5f9", display:"flex", gap:20, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:"#64748b", display:"flex", alignItems:"center", gap:5, fontFamily:"'DM Sans',sans-serif" }}><Icon name="checkCircle" size={13} color="#16a34a" /> <strong style={{ color:"#16a34a" }}>{finalizados.filter(x=>x.status==="finalizada").length}</strong> finalizadas</span>
            {avgDays&&<span style={{ fontSize:12, color:"#64748b", display:"flex", alignItems:"center", gap:5, fontFamily:"'DM Sans',sans-serif" }}><Icon name="clock" size={13} color="#64748b" /> Tempo médio: <strong style={{ color:"#374151" }}>{avgDays} dias</strong></span>}
          </div>
        )}
        <div style={{ padding:"12px 14px", borderBottom:"1px solid #f1f5f9" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por título ou protocolo..." style={{ ...inp, fontSize:13 }} />
        </div>
        <div style={{ padding:"14px", display:"flex", flexDirection:"column", gap:10 }}>
          {listed.length===0?<div style={{ textAlign:"center", padding:"32px 20px", color:"#94a3b8", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Nenhuma solicitação encontrada.</div>:listed.map(r=><RequestCard key={r.id} r={r} onClick={()=>openRequest(r.id)} teams={teams} users={users} />)}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DETAIL VIEW
// ─────────────────────────────────────────────
function MyRequestsView({ requests, currentUser, openRequest, setView, bp, users = [], teams = [] }) {
  const [tab, setTab] = useState("ativos");
  const [search, setSearch] = useState("");

  const all = requests.filter(x => x.requester_id === currentUser.id);
  const ativos = all.filter(x => !["finalizada", "cancelada"].includes(x.status));
  const finalizados = all.filter(x => ["finalizada", "cancelada"].includes(x.status));
  const listed = useMemo(() => {
    let r = tab === "ativos" ? ativos : finalizados;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x => x.title.toLowerCase().includes(q) || x.protocol?.includes(search));
    }
    return [...r].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [tab, ativos, finalizados, search]);

  const avgDays = useMemo(() => {
    const res = finalizados.filter(r => r.created_at && r.updated_at);
    if (!res.length) return null;
    return (res.reduce((acc, r) => acc + Math.max(0, (new Date(r.updated_at) - new Date(r.created_at)) / 86400000), 0) / res.length).toFixed(1);
  }, [finalizados]);

  const oldestOpen = ativos.length > 0
    ? ativos.reduce((a, b) => new Date(a.created_at) < new Date(b.created_at) ? a : b)
    : null;

  const now = new Date();
  const daysSince = d => Math.floor((now - new Date(d)) / 86400000);

  return (
    <div style={{ paddingBottom: bp.isMobile ? 80 : 0, maxWidth: 800, margin: "0 auto" }}>
      <div style={{
        background: "linear-gradient(135deg, #1e3d6e 0%, #2d5a9e 100%)",
        borderRadius: 16, padding: bp.isMobile ? "20px 16px" : "24px 28px",
        marginBottom: 20, color: "#fff", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: bp.isMobile ? 18 : 22, fontWeight: 700, fontFamily: "'Outfit',sans-serif", marginBottom: 4 }}>
            Olá, {currentUser.full_name.split(" ")[0]}! 👋
          </div>
          <div style={{ fontSize: 13, opacity: 0.8, fontFamily: "'DM Sans',sans-serif" }}>
            {ativos.length === 0 ? "Nenhuma solicitação em aberto no momento." : `Você tem ${ativos.length} ${ativos.length > 1 ? "solicitações" : "solicitação"} em aberto.`}
          </div>
        </div>
        <button onClick={() => setView("new")} style={{
          background: "#fff", color: "#1e3d6e", border: "none", borderRadius: 10,
          padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700,
          fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center",
          gap: 6, whiteSpace: "nowrap",
        }}>
          <Icon name="plus" size={15} color="#1e3d6e" />
          Nova Solicitação
        </button>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: bp.isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
        gap: 12, marginBottom: 20,
      }}>
        {[
          { label: "Total", value: all.length, color: "#1e3d6e", icon: "ticket" },
          { label: "Em Aberto", value: ativos.length, color: "#2563eb", icon: "clock" },
          { label: "Finalizadas", value: finalizados.filter(x => x.status === "finalizada").length, color: "#16a34a", icon: "checkCircle" },
          { label: "Tempo médio", value: avgDays ? avgDays + "d" : "—", color: "#7c3aed", icon: "trendingUp" },
        ].map(m => (
          <div key={m.label} style={{
            background: "#fff", borderRadius: 12, padding: "14px 16px",
            border: "1px solid #e2e8f0", borderTop: `3px solid ${m.color}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Sans',sans-serif" }}>{m.label}</span>
              <Icon name={m.icon} size={14} color={m.color} />
            </div>
            <div style={{
              fontSize: bp.isMobile ? 22 : 26, fontWeight: 700,
              color: m.value !== "—" ? m.color : "#94a3b8", fontFamily: "'Outfit',sans-serif",
            }}>{m.value}</div>
          </div>
        ))}
      </div>

      {oldestOpen && daysSince(oldestOpen.created_at) >= 3 && (
        <div style={{
          background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12,
          padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
        }}>
          <Icon name="alertCircle" size={16} color="#c2410c" />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#c2410c", fontFamily: "'DM Sans',sans-serif" }}>
              Chamado aguardando há {daysSince(oldestOpen.created_at)} dias:
            </span>
            <span style={{ fontSize: 13, color: "#92400e", marginLeft: 6, fontFamily: "'DM Sans',sans-serif" }}>{oldestOpen.title}</span>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
          {[["ativos", `Em Aberto (${ativos.length})`], ["finalizados", `Finalizados (${finalizados.length})`]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: "14px 16px", border: "none", background: "transparent", cursor: "pointer",
              fontSize: 13, fontWeight: tab === k ? 700 : 400, color: tab === k ? "#1e3d6e" : "#64748b",
              borderBottom: tab === k ? "2px solid #1e3d6e" : "2px solid transparent", fontFamily: "'DM Sans',sans-serif",
            }}>{l}</button>
          ))}
        </div>

        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ position: "relative" }}>
            <Icon name="search" size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título ou protocolo..." style={{ ...inp, paddingLeft: 36, fontSize: 13 }} />
          </div>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {listed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{tab === "ativos" ? "✅" : "📋"}</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#374151", marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>
                {tab === "ativos" ? "Nenhuma solicitação em aberto" : "Nenhuma solicitação finalizada"}
              </div>
              {tab === "ativos" && (
                <button onClick={() => setView("new")} style={{
                  marginTop: 12, padding: "10px 20px", background: "#1e3d6e", color: "#fff",
                  border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                  fontFamily: "'DM Sans',sans-serif",
                }}>Abrir primeira solicitação</button>
              )}
            </div>
          ) : listed.map(r => {
            const s = STATUSES.find(st => st.key === r.status) || STATUSES[0];
            const p = PRIORITIES.find(pr => pr.key === r.priority) || PRIORITIES[1];
            const t = teams.find(tm => tm.id === r.team_id);
            const assignee = r._assignee || users?.find(u => u.id === r.assignee_id);
            const waiting = r.status === "aguardando_solicitante";
            const days = daysSince(r.created_at);
            const progressSteps = ["nova", "em_analise", "em_andamento", "finalizada"];
            const progressIdx = progressSteps.indexOf(r.status);
            const progressPct = progressIdx < 0 ? 100 : Math.round((progressIdx / (progressSteps.length - 1)) * 100);

            return (
              <div key={r.id} onClick={() => openRequest(r.id)}
                style={{
                  background: waiting ? "#fffbeb" : "#fafafa", borderRadius: 12,
                  border: waiting ? "1.5px solid #fbbf24" : "1px solid #e2e8f0",
                  borderLeft: `4px solid ${t?.color || "#e2e8f0"}`, padding: "16px",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
              >
                {waiting && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6, background: "#fef3c7",
                    color: "#92400e", padding: "4px 10px", borderRadius: 20, fontSize: 12,
                    fontWeight: 600, marginBottom: 10, fontFamily: "'DM Sans',sans-serif",
                  }}>
                    <Icon name="alertCircle" size={12} color="#92400e" />
                    Aguardando sua resposta
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginBottom: 3 }}>{r.protocol}</div>
                    <div style={{
                      fontWeight: 700, fontSize: 15, color: "#0f172a", lineHeight: 1.3,
                      marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical", fontFamily: "'DM Sans',sans-serif",
                    }}>{r.title}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 12,
                        fontWeight: 600, color: s.color, background: s.bg, fontFamily: "'DM Sans',sans-serif",
                      }}>{s.label}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                        <span style={{ fontSize: 11, color: p.color, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{p.label}</span>
                      </span>
                      {t && (
                        <span style={{
                          padding: "3px 8px", borderRadius: 6, fontSize: 11,
                          background: t.color + "20", color: t.color, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                        }}>{t.name}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    {assignee ? (
                      <div style={{ textAlign: "right" }}>
                        <Avatar user={assignee} size={32} />
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 3, fontFamily: "'DM Sans',sans-serif" }}>{assignee.full_name.split(" ")[0]}</div>
                      </div>
                    ) : (
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9",
                        border: "2px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon name="user" size={14} color="#cbd5e1" />
                      </div>
                    )}
                    <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif" }}>
                      {days === 0 ? "Hoje" : days === 1 ? "Ontem" : `${days}d atrás`}
                    </span>
                  </div>
                </div>

                {!["finalizada", "cancelada"].includes(r.status) && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'DM Sans',sans-serif" }}>Progresso</span>
                      <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{progressPct}%</span>
                    </div>
                    <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 2, background: progressPct === 100 ? "#16a34a" : "#1e3d6e",
                        width: `${progressPct}%`, transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                )}

                {r.status === "finalizada" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                    <Icon name="checkCircle" size={14} color="#16a34a" />
                    <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                      Finalizado em {new Date(r.updated_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}

                {r.status === "cancelada" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                    <Icon name="x" size={14} color="#dc2626" />
                    <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>Cancelado</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailView({ request, currentUser, updateRequest, setView, showToast, setRequests, bp, detailFrom, users = [], teams = [], api }) {
  const [tab, setTab] = useState("timeline");
  const [nc, setNc] = useState({ content:"", visibility:"publico" });
  const fileRef = useRef();
  const isSolicitante = currentUser.role==="solicitante";
  const canEdit = ["admin","gestor","supervisor","membro_equipe"].includes(currentUser.role);
  const canSeeInternalComments = ["admin","gestor","supervisor","membro_equipe"].includes(currentUser.role);
  const visibleComments = (request.comments || []).filter(c => c.visibility === "publico" || canSeeInternalComments);
  const requester = requestRequester(request, users);
  const assignee = requestAssignee(request, users);
  const s=gs(request.status), p=gp(request.priority), team=request.team || teamById(teams, request.team_id), type=request.type || gtype(request.type_id);
  const teamMembers = users.filter(u => {
    if (!u.is_active && u.is_active !== undefined) return false;
    if (["solicitante"].includes(u.role)) return false;
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "supervisor") return true;
    return u.team_id === request.team_id;
  });
  const backView = isSolicitante?"my-requests":(detailFrom||"requests");

  const openWA = () => {
    if (!assignee?.whatsapp) {
      showToast("Responsável sem WhatsApp cadastrado.", "error");
      return;
    }
    const number = assignee.whatsapp.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá ${assignee.full_name.split(" ")[0]}! ` +
      `Atualização sobre a solicitação *${request.protocol}* — ` +
      `*${request.title}*?`
    );
    window.open(`https://wa.me/${number}?text=${msg}`, "_blank");
  };
  const addComment = async () => {
    if (!nc.content.trim()) return;
    try {
      const comment = await api.createComment({
        request_id: request.id,
        author_id: currentUser.id,
        content: nc.content,
        visibility: nc.visibility,
      });
      setRequests(prev => prev.map(r =>
        r.id === request.id
          ? { ...r, comments: [...(r.comments || []), { ...comment, author_id: currentUser.id }] }
          : r
      ));
      setNc({ content: "", visibility: "publico" });
      showToast("Comentário adicionado.");
    } catch (err) {
      console.error("addComment error:", err);
      showToast("Erro ao adicionar comentário: " + (err?.message || JSON.stringify(err)), "error");
    }
  };
  const addFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      showToast("Enviando arquivo...");
      const att = await api.uploadAttachment(request.id, currentUser.id, file);
      setRequests(prev => prev.map(r =>
        r.id === request.id
          ? { ...r, attachments: [...(r.attachments || []), att] }
          : r
      ));
      showToast("Arquivo anexado: " + file.name);
    } catch (err) {
      console.error("addFile error:", err);
      showToast("Erro ao anexar: " + (err?.message || JSON.stringify(err)), "error");
    }
    e.target.value = "";
  };  const tabs = isSolicitante?[["timeline","Acompanhamento"],["attachments","Anexos"]]:[["timeline","Timeline"],["comments","Comentários"],["attachments","Anexos"]];
  const downloadAttachment = async (attachment) => {
    try {
      const url = await api.getAttachmentUrl(attachment.file_path);
      if (url) {
        window.open(url, "_blank");
      } else {
        showToast("Erro ao gerar link de download.", "error");
      }
    } catch (err) {
      console.error("downloadAttachment error:", err);
      showToast("Erro ao baixar arquivo.", "error");
    }
  };

  return (
    <div style={{ paddingBottom:bp.isMobile?80:0 }}>
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:bp.isMobile?"14px 16px":"20px 24px", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <button onClick={()=>setView(backView)} style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:8, padding:"7px 12px", cursor:"pointer", fontSize:13, color:"#64748b", display:"flex", alignItems:"center", gap:6, fontFamily:"'DM Sans',sans-serif" }}><Icon name="chevronRight" size={14} color="#64748b" style={{ transform:"rotate(180deg)" }} /> Voltar</button>
          {assignee&&assignee.whatsapp&&<button onClick={openWA} style={{ marginLeft:"auto", padding:"8px 14px", background:"#16a34a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}><Icon name="phone" size={14} color="#fff" /> {bp.isMobile?"WhatsApp":"Falar com responsável"}</button>}
        </div>
        <div style={{ fontSize:11, color:"#94a3b8", fontFamily:"monospace", marginBottom:4 }}>{request.protocol}</div>
        <h2 style={{ fontSize:bp.isMobile?16:18, fontWeight:600, color:"#0f172a", marginBottom:10, lineHeight:1.3, fontFamily:"'Outfit',sans-serif" }}>{request.title}</h2>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          <Badge label={s.label} color={s.color} bg={s.bg} />
          <Badge label={p.label} color={p.color} bg={p.color+"15"} />
          {team&&<span style={{ padding:"3px 10px", borderRadius:20, background:team.color+"20", color:team.color, fontWeight:600, fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{team.name}</span>}
          {type&&<span style={{ padding:"3px 10px", borderRadius:20, background:"#f1f5f9", color:"#64748b", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{type.name}</span>}
        </div>
      </div>
      {isSolicitante&&<div style={{ marginBottom:14 }}><StatusStepper status={request.status} bp={bp} /></div>}
      <div style={{ display:"grid", gridTemplateColumns:bp.isDesktop?"1fr 270px":"1fr", gap:14 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {request.description&&<div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:bp.isMobile?"14px 16px":"18px 22px" }}><div style={{ fontWeight:600, fontSize:13, marginBottom:8, color:"#374151", fontFamily:"'Outfit',sans-serif" }}>Descrição</div><p style={{ fontSize:13, color:"#475569", lineHeight:1.7, fontFamily:"'DM Sans',sans-serif" }}>{request.description}</p></div>}
          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
            <div style={{ display:"flex", borderBottom:"1px solid #f1f5f9", overflowX:"auto" }}>
              {tabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{ padding:bp.isMobile?"12px 16px":"12px 20px", border:"none", background:"transparent", cursor:"pointer", fontSize:13, fontWeight:tab===k?600:400, color:tab===k?"#1e3d6e":"#64748b", borderBottom:tab===k?"2px solid #1e3d6e":"2px solid transparent", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>{l}</button>)}
            </div>
            <div style={{ padding:bp.isMobile?"16px":"20px 22px" }}>
              {tab==="timeline"&&<div>
                <Timeline request={request} currentRole={currentUser.role} />
                <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:16, marginTop:12 }}>
                  <textarea value={nc.content} onChange={e=>setNc(c=>({...c,content:e.target.value}))} placeholder={isSolicitante?"Responda ou adicione informações...":"Escreva um comentário..."} rows={3} style={{ ...inp, resize:"vertical", marginBottom:10 }} />
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    {canEdit&&<VisibilityToggle value={nc.visibility} onChange={visibility=>setNc(c=>({...c,visibility}))} />}
                    <div style={{ flex:1 }} />
                    <button onClick={addComment} style={{ padding:"9px 20px", background:"#1e3d6e", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6, fontFamily:"'DM Sans',sans-serif" }}><Icon name="send" size={14} color="#fff" /> Enviar</button>
                  </div>
                </div>
              </div>}
              {tab==="comments"&&!isSolicitante&&<div>
                <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:18 }}>
                  {visibleComments.map(c=>{ const author=c.author || gu(c.author_id); return (<div key={c.id} style={{ display:"flex", gap:10 }}><Avatar user={author} size={30} /><div style={{ flex:1 }}><div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}><span style={{ fontWeight:600, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{author?.full_name}</span>{c.visibility==="interno"&&<span style={{ fontSize:11, background:"#fef3c7", color:"#92400e", padding:"1px 6px", borderRadius:4, fontWeight:600 }}>Interno</span>}<span style={{ fontSize:11, color:"#94a3b8" }}>{fdt(c.created_at)}</span></div><div style={{ fontSize:13, color:"#374151", background:"#f8fafc", borderRadius:8, padding:"10px 12px", lineHeight:1.6, fontFamily:"'DM Sans',sans-serif" }}>{c.content}</div></div></div>); })}
                  {!visibleComments.length&&<div style={{ color:"#94a3b8", fontSize:13, textAlign:"center", padding:"20px 0", fontFamily:"'DM Sans',sans-serif" }}>Nenhum comentário ainda.</div>}
                </div>
                <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:16 }}>
                  <textarea value={nc.content} onChange={e=>setNc(c=>({...c,content:e.target.value}))} rows={3} style={{ ...inp, resize:"vertical", marginBottom:10 }} placeholder="Escreva um comentário..." />
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <VisibilityToggle value={nc.visibility} onChange={visibility=>setNc(c=>({...c,visibility}))} />
                    <div style={{ flex:1 }} /><button onClick={addComment} style={{ padding:"9px 20px", background:"#1e3d6e", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>Enviar</button>
                  </div>
                </div>
              </div>}
              {tab==="attachments"&&<div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                  {(request.attachments||[]).map(a=>{ const ext=a.file_name.split(".").pop().toUpperCase(); const ec={PDF:"#ef4444",PNG:"#10b981",JPG:"#0ea5e9",XLSX:"#16a34a",CSV:"#16a34a",DOCX:"#2563eb"}[ext]||"#6366f1"; return (<div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0" }}><div style={{ width:34, height:34, borderRadius:8, background:ec+"15", border:`1px solid ${ec}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><span style={{ fontSize:10, fontWeight:700, color:ec, fontFamily:"monospace" }}>{ext}</span></div><div style={{ flex:1, overflow:"hidden" }}><div style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>{a.file_name}</div><div style={{ fontSize:11, color:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>{fsz(a.file_size)} · {fd(a.created_at)}</div></div><button onClick={()=>downloadAttachment(a)} style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:6, padding:"5px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#64748b" }}>Baixar</button></div>); })}
                  {!(request.attachments||[]).length&&<div style={{ textAlign:"center", color:"#94a3b8", fontSize:13, padding:"20px 0", fontFamily:"'DM Sans',sans-serif" }}>Nenhum arquivo anexado.</div>}
                </div>
                <input type="file" ref={fileRef} style={{ display:"none" }} onChange={addFile} />
                <button onClick={()=>fileRef.current?.click()} style={{ width:"100%", padding:"12px", border:"2px dashed #b8d4f0", borderRadius:10, background:"#f8faff", cursor:"pointer", fontSize:13, color:"#1e3d6e", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"'DM Sans',sans-serif" }}><Icon name="paperclip" size={15} color="#1e3d6e" /> Anexar arquivo</button>
              </div>}
            </div>
          </div>
        </div>
        {/* Right sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"16px 18px" }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:14, color:"#374151", fontFamily:"'Outfit',sans-serif" }}>Detalhes</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[{ label:"Solicitante", content:<div style={{ display:"flex", alignItems:"center", gap:8 }}><Avatar user={requester} size={22} /><span style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{requester?.full_name}</span></div> },{ label:"Responsável", content:assignee?<div style={{ display:"flex", alignItems:"center", gap:8 }}><Avatar user={assignee} size={22} /><span style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{assignee.full_name}</span></div>:<span style={{ color:"#94a3b8", fontSize:13 }}>Não atribuído</span> },...(request.client_name?[{ label:"Cliente / Área", content:<span style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{request.client_name}</span> }]:[]),{ label:"Última atualização", content:<span style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{fdt(request.updated_at)}</span> },{ label:"Aberto em", content:<span style={{ fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{fd(request.created_at)}</span> }].map(row=>(
                <div key={row.label}><div style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.5, marginBottom:4, fontFamily:"'Outfit',sans-serif" }}>{row.label}</div>{row.content}</div>
              ))}
            </div>
          </div>
          {isSolicitante && assignee && (
            <div style={{
              background: "#fff", borderRadius: 12,
              border: "1px solid #e2e8f0", padding: "18px",
              marginBottom: 14,
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, fontFamily: "'Outfit',sans-serif", color: "#374151" }}>
                Responsável pelo atendimento
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <Avatar user={assignee} size={48} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", fontFamily: "'DM Sans',sans-serif" }}>
                    {assignee.full_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>
                    {teams.find(t => t.id === request.team_id)?.name || "Equipe TI"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
                    <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>Disponível</span>
                  </div>
                </div>
              </div>
              {assignee.whatsapp && (
                <button onClick={openWA} style={{
                  width: "100%", padding: "12px", background: "#16a34a",
                  color: "#fff", border: "none", borderRadius: 10,
                  cursor: "pointer", fontSize: 14, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                  <Icon name="phone" size={16} color="#fff" />
                  Enviar mensagem pelo WhatsApp
                </button>
              )}
            </div>
          )}
          {canEdit&&(
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"16px 18px" }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:14, color:"#374151", fontFamily:"'Outfit',sans-serif" }}>Ações</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <Field label="Status">
                  <select
                    value={request.status}
                    onChange={e=>{
                      console.log('onChange status:', e.target.value);
                      console.log('updateRequest prop:', typeof updateRequest);
                      updateRequest(request.id, { status:e.target.value });
                    }}
                    style={inp}
                  >
                    {STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </Field>
                <Field label="Prioridade">
                  <select value={request.priority} onChange={e=>updateRequest(request.id,{priority:e.target.value})} style={inp}>
                    {PRIORITIES.map(p=><option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </Field>
                <Field label="Responsável">
                  <select value={request.assignee_id||""} onChange={e=>updateRequest(request.id,{assignee_id:e.target.value||null})} style={inp}>
                    <option value="">Sem responsável</option>
                    {teamMembers.map(u=><option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ requests, currentUser, openRequest, bp, users = [], teams = [] }) {
  const isAdmin = ["admin","supervisor","gestor"].includes(currentUser.role);
  const vis = isAdmin
    ? requests
    : requests.filter(r => r.team_id === currentUser.team_id || r.assignee_id === currentUser.id);

  const active = vis.filter(r => !["finalizada","cancelada"].includes(r.status));
  const done = vis.filter(r => r.status === "finalizada");
  const critical = vis.filter(r => r.priority === "critica" && !["finalizada","cancelada"].includes(r.status));

  const stats = [
    { label:"Total", value: vis.length, color:"#1e3d6e" },
    { label:"Novas", value: vis.filter(r=>r.status==="nova").length, color:"#d97706" },
    { label:"Andamento", value: vis.filter(r=>r.status==="em_andamento").length, color:"#2563eb" },
    { label:"Críticas", value: critical.length, color:"#dc2626" },
    { label:"Finalizadas", value: done.length, color:"#16a34a" },
  ];

  const byTeam = teams.map(t => ({
    name: t.name,
    Abertas: active.filter(r => r.team_id === t.id).length,
    Finalizadas: done.filter(r => r.team_id === t.id).length,
    color: t.color,
  })).filter(t => t.Abertas + t.Finalizadas > 0);

  const now = new Date();
  const byMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthReqs = vis.filter(r => {
      const rd = new Date(r.created_at);
      return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
    });
    return {
      name: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      Abertas: monthReqs.filter(r => !["finalizada","cancelada"].includes(r.status)).length,
      Finalizadas: monthReqs.filter(r => r.status === "finalizada").length,
      Total: monthReqs.length,
    };
  });

  const byStatus = Object.entries(
    vis.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([key, value]) => {
    const status = gs(key);
    return { name: status.label || key, value, color: status.color || "#94a3b8" };
  }).filter(s => s.value > 0);

  const topAssignees = Object.entries(
    done.reduce((acc, r) => {
      if (r.assignee_id) acc[r.assignee_id] = (acc[r.assignee_id] || 0) + 1;
      return acc;
    }, {})
  ).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([id,count]) => ({
    user: users.find(u => u.id === id),
    count,
  })).filter(a => a.user);

  const avgResolution = (() => {
    const resolved = done.filter(r => r.created_at && r.updated_at);
    if (!resolved.length) return null;
    const avg = resolved.reduce((acc, r) =>
      acc + Math.max(0, (new Date(r.updated_at) - new Date(r.created_at)) / 86400000), 0
    ) / resolved.length;
    return avg.toFixed(1);
  })();

  const recentActivity = [...vis].sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)).slice(0,5);

  return (
    <div style={{ paddingBottom: bp.isMobile ? 80 : 0 }}>
      <div style={{ display:"grid", gridTemplateColumns:bp.isMobile?"repeat(2,1fr)":"repeat(5,1fr)", gap:12, marginBottom:20 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:"#fff", borderRadius:12, padding:bp.isTv?"20px":"14px 16px", border:"1px solid #e2e8f0" }}>
            <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>{s.label}</div>
            <div style={{ fontSize:bp.isMobile?24:bp.isTv?32:28, fontWeight:700, color:s.value>0?s.color:"#94a3b8", fontFamily:"'Outfit',sans-serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {isAdmin && vis.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:bp.isDesktop?"1fr 1fr":"1fr", gap:16, marginBottom:20 }}>
          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"18px 20px" }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:16, fontFamily:"'Outfit',sans-serif", color:"#0f172a" }}>Volume por Mês</div>
            <ResponsiveContainer width="100%" height={bp.isTv?220:180}>
              <LineChart data={byMonth}>
                <XAxis dataKey="name" tick={{ fontSize:11, fill:"#94a3b8" }} />
                <YAxis tick={{ fontSize:11, fill:"#94a3b8" }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:"1px solid #e2e8f0" }} />
                <Line type="monotone" dataKey="Total" stroke="#1e3d6e" strokeWidth={2} dot={{ r:4 }} name="Total" />
                <Line type="monotone" dataKey="Finalizadas" stroke="#16a34a" strokeWidth={2} dot={{ r:4 }} name="Finalizadas" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {byTeam.length > 0 && (
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"18px 20px" }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:16, fontFamily:"'Outfit',sans-serif", color:"#0f172a" }}>Chamados por Equipe</div>
              <ResponsiveContainer width="100%" height={bp.isTv?220:180}>
                <BarChart data={byTeam} barSize={20}>
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:"#94a3b8" }} />
                  <YAxis tick={{ fontSize:11, fill:"#94a3b8" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:"1px solid #e2e8f0" }} />
                  <Bar dataKey="Abertas" fill="#3b6ea8" radius={[4,4,0,0]} />
                  <Bar dataKey="Finalizadas" fill="#16a34a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {byStatus.length > 0 && (
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"18px 20px" }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:16, fontFamily:"'Outfit',sans-serif", color:"#0f172a" }}>Distribuição por Status</div>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <ResponsiveContainer width="50%" height={bp.isTv?220:160}>
                  <PieChart>
                    <Pie data={byStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                      {byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex:1 }}>
                  {byStatus.map((s, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <div style={{ width:10, height:10, borderRadius:2, background:s.color, flexShrink:0 }} />
                      <span style={{ fontSize:11, color:"#374151", flex:1, fontFamily:"'DM Sans',sans-serif" }}>{s.name}</span>
                      <span style={{ fontSize:11, fontWeight:600, color:"#374151", fontFamily:"'DM Sans',sans-serif" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"18px 20px" }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:16, fontFamily:"'Outfit',sans-serif", color:"#0f172a" }}>Top Responsáveis</div>
            {topAssignees.length > 0 ? (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {topAssignees.map((a, i) => (
                  <div key={a.user.id} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:i===0?"#f59e0b":i===1?"#94a3b8":"#cd7c2f", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                    <Avatar user={a.user} size={28} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{a.user.full_name.split(" ")[0]}</div>
                      <div style={{ fontSize:11, color:"#64748b", fontFamily:"'DM Sans',sans-serif" }}>{a.count} finalizado{a.count!==1?"s":""}</div>
                    </div>
                    <div style={{ background:"#f0fdf4", color:"#16a34a", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>{a.count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color:"#94a3b8", fontSize:13, textAlign:"center", padding:"20px 0", fontFamily:"'DM Sans',sans-serif" }}>Nenhum chamado finalizado ainda.</div>
            )}
            {avgResolution && (
              <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:"#64748b", fontFamily:"'DM Sans',sans-serif" }}>Tempo médio de resolução</span>
                <span style={{ fontSize:14, fontWeight:700, color:"#1e3d6e", fontFamily:"'Outfit',sans-serif" }}>{avgResolution} dias</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:bp.isDesktop?"1fr 1fr":"1fr", gap:16 }}>
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #f1f5f9", fontWeight:600, fontSize:14, fontFamily:"'Outfit',sans-serif", color:"#0f172a" }}>Atividade Recente</div>
          {recentActivity.map(r => { const s=gs(r.status), t=teamById(teams,r.team_id); return (
            <div key={r.id} onClick={()=>openRequest(r.id)} style={{ padding:"12px 18px", borderBottom:"1px solid #f8fafc", cursor:"pointer", display:"flex", alignItems:"center", gap:10 }} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ width:3, height:32, borderRadius:2, background:t?.color||"#e2e8f0", flexShrink:0 }} />
              <div style={{ flex:1, overflow:"hidden" }}>
                <div style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>{r.title}</div>
                <div style={{ fontSize:11, color:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>{r.protocol} · {fd(r.updated_at)}</div>
              </div>
              <Badge label={s.label} color={s.color} bg={s.bg} small />
            </div>
          ); })}
          {!recentActivity.length&&<div style={{ padding:24, textAlign:"center", color:"#94a3b8", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Nenhuma atividade.</div>}
        </div>

        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #f1f5f9", fontWeight:600, fontSize:14, fontFamily:"'Outfit',sans-serif", color:"#dc2626", display:"flex", alignItems:"center", gap:8 }}><Icon name="alertCircle" size={16} color="#dc2626" /> Críticas Abertas</div>
          {critical.map(r => { const a=requestAssignee(r,users); return (
            <div key={r.id} onClick={()=>openRequest(r.id)} style={{ padding:"12px 18px", borderBottom:"1px solid #f8fafc", cursor:"pointer", display:"flex", alignItems:"center", gap:10 }} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{r.title}</div>
                <div style={{ fontSize:11, color:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>{a?"Resp: "+a.full_name.split(" ")[0]:"Sem responsável"}</div>
              </div>
              <Badge label={gs(r.status).label} color={gs(r.status).color} bg={gs(r.status).bg} small />
            </div>
          ); })}
          {!critical.length&&<div style={{ padding:24, textAlign:"center", color:"#94a3b8", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Nenhuma crítica aberta.</div>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// KANBAN + REQUESTS VIEW
// ─────────────────────────────────────────────
const QUICK_FILTERS=[{key:"todos",label:"Todos",filter:()=>true},{key:"meus",label:"Meus",filter:(r,uid)=>r.assignee_id===uid},{key:"sem_resp",label:"Sem responsável",filter:r=>!r.assignee_id},{key:"criticos",label:"Críticos",filter:r=>r.priority==="critica"},{key:"aguardando",label:"Aguardando",filter:r=>["aguardando_solicitante","aguardando_terceiro"].includes(r.status)}];
function getMonthRange(){const now=new Date();return{from:new Date(now.getFullYear(),now.getMonth(),1).toISOString().split("T")[0],to:new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().split("T")[0]};}

function RequestsView({ requests, currentUser, openRequest, setView, bp, teams = TEAMS, users = USERS, updateRequest }) {
  const [search,setSearch]=useState(""); const [teamF,setTeamF]=useState(""); const [priorityF,setPriorityF]=useState(""); const [dateFrom,setDateFrom]=useState(getMonthRange().from); const [dateTo,setDateTo]=useState(getMonthRange().to); const [quick,setQuick]=useState("todos"); const [showFin,setShowFin]=useState(false); const [showFilters,setShowFilters]=useState(false); const [mode,setMode]=useState(bp.isMobile?"list":"kanban");
  const scopedRequests=useMemo(()=>{let r=requests; if(currentUser.role==="membro_equipe") r=r.filter(x=>x.team_id===currentUser.team_id||x.assignee_id===currentUser.id); if(dateFrom) r=r.filter(x=>x.created_at>=dateFrom); if(dateTo) r=r.filter(x=>x.created_at<=dateTo+"T23:59:59"); if(teamF) r=r.filter(x=>x.team_id===teamF); if(priorityF) r=r.filter(x=>x.priority===priorityF); if(search) r=r.filter(x=>x.title.toLowerCase().includes(search.toLowerCase())||x.protocol.includes(search)); return r;},[requests,currentUser,dateFrom,dateTo,teamF,priorityF,search]);
  const base=useMemo(()=>{let r=scopedRequests; const qf=QUICK_FILTERS.find(f=>f.key===quick); if(qf) r=r.filter(x=>qf.filter(x,currentUser.id)); return r;},[scopedRequests,quick,currentUser.id]);
  const kanbanCols=useMemo(()=>{const a=STATUSES.filter(s=>!["finalizada","cancelada"].includes(s.key));const c=STATUSES.filter(s=>["finalizada","cancelada"].includes(s.key));return showFin?[...a,...c]:a;},[showFin]);
  const setMonth=offset=>{const now=new Date();const d=new Date(now.getFullYear(),now.getMonth()+offset,1);setDateFrom(new Date(d.getFullYear(),d.getMonth(),1).toISOString().split("T")[0]);setDateTo(new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().split("T")[0]);};
  const monthLabel=useMemo(()=>{if(!dateFrom) return "Período livre";return new Date(dateFrom+"T12:00:00").toLocaleDateString("pt-BR",{month:"long",year:"numeric"});},[dateFrom]);
  const isCurMonth=useMemo(()=>{const mr=getMonthRange();return dateFrom===mr.from&&dateTo===mr.to;},[dateFrom,dateTo]);

  return (
    <div style={{ paddingBottom:bp.isMobile?80:0 }}>
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"12px 14px", marginBottom:14 }}>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <input placeholder="Buscar por título ou protocolo..." value={search} onChange={e=>setSearch(e.target.value)} style={{ ...inp, flex:"1 1 180px" }} />
          {bp.isMobile&&<button onClick={()=>setShowFilters(v=>!v)} style={{ padding:"10px 12px", border:"1px solid #e2e8f0", borderRadius:8, background:showFilters?"#eff6ff":"#fff", cursor:"pointer" }}><Icon name="filter" size={15} color={showFilters?"#2563eb":"#64748b"} /></button>}
          {!bp.isMobile&&<><select value={teamF} onChange={e=>setTeamF(e.target.value)} style={{ ...inp, width:"auto" }}><option value="">Todas equipes</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><select value={priorityF} onChange={e=>setPriorityF(e.target.value)} style={{ ...inp, width:"auto" }}><option value="">Todas prioridades</option>{PRIORITIES.map(p=><option key={p.key} value={p.key}>{p.label}</option>)}</select><div style={{ display:"flex", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>{(bp.isTablet?[["list","Lista"],["table","Tabela"]]:[["kanban","Kanban"],["list","Lista"],["table","Tabela"]]).map(([k,l])=><button key={k} onClick={()=>setMode(k)} style={{ padding:"9px 13px", border:"none", background:mode===k?"#1e3d6e":"#fff", color:mode===k?"#fff":"#64748b", cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif" }}>{l}</button>)}</div><button onClick={()=>setView("new")} style={{ padding:"9px 16px", background:"#1e3d6e", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>+ Nova</button></>}
        </div>
        {bp.isMobile&&showFilters&&<div style={{ marginTop:10, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}><select value={teamF} onChange={e=>setTeamF(e.target.value)} style={{ ...inp, fontSize:13 }}><option value="">Todas equipes</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><select value={priorityF} onChange={e=>setPriorityF(e.target.value)} style={{ ...inp, fontSize:13 }}><option value="">Todas prioridades</option>{PRIORITIES.map(p=><option key={p.key} value={p.key}>{p.label}</option>)}</select></div>}
        {/* Período */}
        <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", borderTop:"1px solid #f1f5f9", paddingTop:10 }}>
          <Icon name="calendar" size={14} color="#64748b" />
          <button onClick={()=>setMonth(-1)} style={{ padding:"4px 10px", border:"1px solid #e2e8f0", borderRadius:6, background:"#fff", cursor:"pointer", fontSize:12, color:"#64748b" }}>‹</button>
          <span style={{ fontSize:13, fontWeight:600, color:"#374151", minWidth:120, textAlign:"center", textTransform:"capitalize", fontFamily:"'DM Sans',sans-serif" }}>{monthLabel}</span>
          <button onClick={()=>setMonth(1)} style={{ padding:"4px 10px", border:"1px solid #e2e8f0", borderRadius:6, background:"#fff", cursor:"pointer", fontSize:12, color:"#64748b" }}>›</button>
          {!isCurMonth&&<button onClick={()=>{const mr=getMonthRange();setDateFrom(mr.from);setDateTo(mr.to);}} style={{ padding:"4px 10px", border:"1px solid #1e3d6e", borderRadius:6, background:"#eff6ff", cursor:"pointer", fontSize:12, color:"#1e3d6e", fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>Mês atual</button>}
          <button onClick={()=>{setDateFrom("");setDateTo("");}} style={{ padding:"4px 10px", border:"1px solid #e2e8f0", borderRadius:6, background:"#fff", cursor:"pointer", fontSize:12, color:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>Ver tudo</button>
          {!bp.isMobile&&<><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ ...inp, width:"auto", fontSize:12 }} /><span style={{ fontSize:12, color:"#94a3b8" }}>até</span><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ ...inp, width:"auto", fontSize:12 }} /></>}
          <span style={{ fontSize:12, color:"#94a3b8", marginLeft:"auto", fontFamily:"'DM Sans',sans-serif" }}>{base.length} chamado{base.length!==1?"s":""}</span>
        </div>
        {/* Filtros rápidos */}
        <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap", borderTop:"1px solid #f1f5f9", paddingTop:10 }}>
          {QUICK_FILTERS.map(f=><button key={f.key} onClick={()=>setQuick(q=>q===f.key?"todos":f.key)} style={{ padding:"5px 12px", borderRadius:20, border:`1.5px solid ${quick===f.key?"#1e3d6e":"#e2e8f0"}`, background:quick===f.key?"#eff6ff":"#fff", color:quick===f.key?"#1e3d6e":"#64748b", cursor:"pointer", fontSize:12, fontWeight:quick===f.key?600:400, fontFamily:"'DM Sans',sans-serif" }}>{f.label} <span style={{ marginLeft:4, background:quick===f.key?"#1e3d6e":"#f1f5f9", color:quick===f.key?"#fff":"#64748b", borderRadius:10, padding:"1px 6px", fontSize:11 }}>{scopedRequests.filter(x=>f.filter(x,currentUser.id)).length}</span></button>)}
          {mode==="kanban"&&<button onClick={()=>setShowFin(v=>!v)} style={{ padding:"5px 12px", borderRadius:20, border:`1.5px solid ${showFin?"#16a34a":"#e2e8f0"}`, background:showFin?"#f0fdf4":"#fff", color:showFin?"#16a34a":"#64748b", cursor:"pointer", fontSize:12, fontWeight:showFin?600:400, marginLeft:"auto", fontFamily:"'DM Sans',sans-serif" }}>{showFin?"Ocultar finalizados":"Mostrar finalizados"}</button>}
        </div>
      </div>
      {mode==="kanban"&&!bp.isMobile&&<KanbanView requests={base} openRequest={openRequest} kanbanCols={kanbanCols} updateRequest={updateRequest} teams={teams} users={users} bp={bp} />}
      {mode==="list"&&<div style={{ display:"flex", flexDirection:"column", gap:10 }}>{base.map(r=><RequestCard key={r.id} r={r} onClick={()=>openRequest(r.id)} teams={teams} users={users} />)}{!base.length&&<div style={{ background:"#fff", borderRadius:12, border:"2px dashed #e2e8f0", padding:32, textAlign:"center", color:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>Nenhuma solicitação encontrada.</div>}</div>}
      {mode==="table"&&!bp.isMobile&&<TableView requests={base} openRequest={openRequest} teams={teams} users={users} />}
    </div>
  );
}

function DraggableCard({ r, openRequest, teams, users }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: r.id });
  const t = teamById(teams, r.team_id);
  const p = gp(r.priority);
  const a = requestAssignee(r, users);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
      }}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) openRequest(r.id);
      }}
    >
      <div style={{ background:"#fff", borderRadius:10, border:"1px solid #e2e8f0", padding:"11px 13px", borderLeft:`3px solid ${t?.color||"#e2e8f0"}`, marginBottom:8, boxShadow:isDragging?"0 8px 24px rgba(0,0,0,0.12)":"none" }}>
        <div style={{ fontSize:10, color:"#94a3b8", marginBottom:3, fontFamily:"monospace" }}>{r.protocol}</div>
        <div style={{ fontWeight:600, fontSize:13, lineHeight:1.4, marginBottom:8, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", fontFamily:"'DM Sans',sans-serif" }}>{r.title}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:p.color, marginRight:5, flexShrink:0, display:"inline-block" }} />
            <span style={{ fontSize:11, color:p.color, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{p.label}</span>
          </div>
          {a ? <Avatar user={a} size={20} /> : <span style={{ fontSize:11, color:"#cbd5e1" }}>—</span>}
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ col, activeId, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight:80,
        borderRadius:10,
        background:isOver ? "rgba(59,110,168,0.08)" : activeId ? "rgba(59,110,168,0.04)" : "transparent",
        border:activeId ? "2px dashed rgba(59,110,168,0.2)" : "2px solid transparent",
        padding:4,
        transition:"all 0.15s",
      }}
    >
      {children}
    </div>
  );
}

function KanbanView({ requests, openRequest, kanbanCols, updateRequest, teams = TEAMS, users = USERS, bp }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint:{ distance:8 } }));
  const activeRequest = activeId ? requests.find(r => r.id === activeId) : null;

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const overRequest = requests.find(r => r.id === over.id);
    const targetStatus = kanbanCols.find(col => col.key === over.id)?.key || overRequest?.status;
    const request = requests.find(r => r.id === active.id);
    if (targetStatus && request && request.status !== targetStatus && typeof updateRequest === "function") {
      await updateRequest(active.id, { status: targetStatus });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={event => setActiveId(event.active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:16, alignItems:"flex-start" }}>
        {kanbanCols.map(col => {
          const colRequests = requests.filter(r => r.status === col.key);
          const isClosed = ["finalizada","cancelada"].includes(col.key);
          return (
            <div key={col.key} style={{ minWidth:bp?.isTv?260:220, width:bp?.isTv?260:220, flexShrink:0, opacity:isClosed?0.85:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, padding:"6px 8px", borderRadius:8, background:isClosed?"#f8fafc":"transparent" }}>
                <div style={{ width:9, height:9, borderRadius:"50%", background:col.color, flexShrink:0 }} />
                <span style={{ fontWeight:600, fontSize:12, color:"#374151", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>{col.label}</span>
                <span style={{ background:col.bg, color:col.color, borderRadius:20, padding:"2px 8px", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>{colRequests.length}</span>
              </div>

              <SortableContext items={colRequests.map(r => r.id)} strategy={verticalListSortingStrategy}>
                <DroppableColumn col={col} activeId={activeId}>
                  {colRequests.map(r => (
                    <DraggableCard key={r.id} r={r} openRequest={openRequest} teams={teams} users={users} />
                  ))}
                  {colRequests.length === 0 && (
                    <div style={{ padding:"18px", textAlign:"center", color:"#cbd5e1", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
                      {activeId ? "Soltar aqui" : "Vazio"}
                    </div>
                  )}
                </DroppableColumn>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeRequest ? (
          <div style={{ background:"#fff", borderRadius:10, border:"1px solid #e2e8f0", padding:"11px 13px", borderLeft:`3px solid ${teamById(teams,activeRequest.team_id)?.color||"#e2e8f0"}`, boxShadow:"0 16px 40px rgba(0,0,0,0.15)", width:bp?.isTv?260:220, cursor:"grabbing", fontFamily:"'DM Sans',sans-serif" }}>
            <div style={{ fontSize:10, color:"#94a3b8", marginBottom:3, fontFamily:"monospace" }}>{activeRequest.protocol}</div>
            <div style={{ fontWeight:600, fontSize:13, lineHeight:1.4 }}>{activeRequest.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function TableView({ requests, openRequest, teams = TEAMS, users = USERS }) {
  return (
    <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead><tr style={{ background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>{["Protocolo","Título","Equipe","Status","Prioridade","Responsável","Atualizado"].map(h=><th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:600, color:"#374151", fontSize:12, whiteSpace:"nowrap", fontFamily:"'Outfit',sans-serif" }}>{h}</th>)}</tr></thead>
        <tbody>{requests.map(r=>{ const s=gs(r.status),t=teamById(teams,r.team_id),a=requestAssignee(r,users); return (<tr key={r.id} onClick={()=>openRequest(r.id)} style={{ borderBottom:"1px solid #f1f5f9", cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{ padding:"11px 16px", fontFamily:"monospace", fontSize:12, color:"#1e3d6e", fontWeight:600, whiteSpace:"nowrap" }}>{r.protocol}</td><td style={{ padding:"11px 16px", fontWeight:500, maxWidth:200, fontFamily:"'DM Sans',sans-serif" }}><div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</div></td><td style={{ padding:"11px 16px" }}>{t&&<span style={{ padding:"2px 8px", borderRadius:6, background:t.color+"20", color:t.color, fontWeight:600, fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{t.name}</span>}</td><td style={{ padding:"11px 16px" }}><Badge label={s.label} color={s.color} bg={s.bg} small /></td><td style={{ padding:"11px 16px" }}><div style={{ display:"flex", alignItems:"center" }}><PriorityDot priority={r.priority} /><span style={{ color:gp(r.priority).color, fontWeight:600, fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{gp(r.priority).label}</span></div></td><td style={{ padding:"11px 16px" }}>{a?<div style={{ display:"flex", alignItems:"center", gap:6 }}><Avatar user={a} size={22} /><span style={{ fontFamily:"'DM Sans',sans-serif" }}>{a.full_name.split(" ")[0]}</span></div>:<span style={{ color:"#cbd5e1" }}>—</span>}</td><td style={{ padding:"11px 16px", color:"#94a3b8", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>{fd(r.updated_at)}</td></tr>); })}{!requests.length&&<tr><td colSpan={7} style={{ padding:32, textAlign:"center", color:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>Nenhuma solicitação encontrada.</td></tr>}</tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
// HISTORICO VIEW
// ─────────────────────────────────────────────
function HistoricoView({ requests, currentUser, openRequest, bp, teams = TEAMS, users = USERS }) {
  const [filters,setFilters]=useState({team:"",status:"finalizada",search:"",dateFrom:"",dateTo:""});
  const [showFilters,setShowFilters]=useState(false);
  const sf=(k,v)=>setFilters(f=>({...f,[k]:v}));
  const base=useMemo(()=>{ let r=requests.filter(x=>["finalizada","cancelada"].includes(x.status)); if(currentUser.role==="membro_equipe") r=r.filter(x=>x.team_id===currentUser.team_id||x.assignee_id===currentUser.id); return r;},[requests,currentUser]);
  const filtered=useMemo(()=>{ let r=base; if(filters.team) r=r.filter(x=>x.team_id===filters.team); if(filters.status) r=r.filter(x=>x.status===filters.status); if(filters.search) r=r.filter(x=>x.title.toLowerCase().includes(filters.search.toLowerCase())||x.protocol.includes(filters.search)); if(filters.dateFrom) r=r.filter(x=>new Date(x.updated_at)>=new Date(filters.dateFrom)); if(filters.dateTo) r=r.filter(x=>new Date(x.updated_at)<=new Date(filters.dateTo+"T23:59:59")); return r.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));},[base,filters]);
  const metrics=useMemo(()=>{ const fin=base.filter(x=>x.status==="finalizada"); const canc=base.filter(x=>x.status==="cancelada"); const wt=fin.filter(r=>r.created_at&&r.updated_at); const avgDays=wt.length?(wt.reduce((acc,r)=>acc+Math.max(0,(new Date(r.updated_at)-new Date(r.created_at))/86400000),0)/wt.length).toFixed(1):"—"; const byTeam=teams.map(t=>({...t,total:fin.filter(r=>r.team_id===t.id).length,canceladas:canc.filter(r=>r.team_id===t.id).length})); const now=new Date(); const byMonth=Array.from({length:4},(_,i)=>{ const d=new Date(now.getFullYear(),now.getMonth()-i,1); return{label:d.toLocaleDateString("pt-BR",{month:"short",year:"2-digit"}),count:fin.filter(r=>{ const rd=new Date(r.updated_at); return rd.getMonth()===d.getMonth()&&rd.getFullYear()===d.getFullYear(); }).length}; }).reverse(); const ac={}; fin.forEach(r=>{ if(r.assignee_id) ac[r.assignee_id]=(ac[r.assignee_id]||0)+1; }); const topId=Object.entries(ac).sort((a,b)=>b[1]-a[1])[0]?.[0]; return{fin:fin.length,canc:canc.length,avgDays,byTeam,byMonth,topAssignee:topId?userById(users,topId):null,topCount:topId?ac[topId]:0};},[base,teams,users]);
  const maxBar=Math.max(...metrics.byMonth.map(m=>m.count),1);
  return (
    <div style={{ paddingBottom:bp.isMobile?80:0 }}>
      <div style={{ display:"grid", gridTemplateColumns:bp.isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        <MetricCard label="Finalizadas" value={metrics.fin} color="#16a34a" bp={bp} />
        <MetricCard label="Canceladas" value={metrics.canc} color="#dc2626" bp={bp} />
        <MetricCard label="Tempo médio" value={metrics.avgDays==="—"?"—":metrics.avgDays+"d"} color="#1e3d6e" sub="por chamado" bp={bp} />
        <div style={{ background:"#fff", borderRadius:12, padding:bp.isMobile?"12px 14px":"16px 18px", border:"1px solid #e2e8f0", textAlign:"center" }}>{metrics.topAssignee?<><div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}><Avatar user={metrics.topAssignee} size={28} /></div><div style={{ fontSize:12, fontWeight:700, color:"#374151", fontFamily:"'DM Sans',sans-serif" }}>{metrics.topAssignee.full_name.split(" ")[0]}</div><div style={{ fontSize:11, color:"#64748b", fontFamily:"'DM Sans',sans-serif" }}>{metrics.topCount} finalizados</div></>:<><div style={{ fontSize:22, fontWeight:700, color:"#94a3b8", fontFamily:"'Outfit',sans-serif" }}>—</div><div style={{ fontSize:11, color:"#64748b", fontFamily:"'DM Sans',sans-serif" }}>Top responsável</div></>}</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:bp.isDesktop?"1fr 1fr":"1fr", gap:14, marginBottom:20 }}>
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"18px 20px" }}>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:14, color:"#374151", fontFamily:"'Outfit',sans-serif" }}>Finalizados por equipe</div>
          {metrics.byTeam.map(t=><div key={t.id} style={{ marginBottom:12 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:13, fontWeight:600, color:t.color, fontFamily:"'DM Sans',sans-serif" }}>{t.name}</span><span style={{ fontSize:13, color:"#374151", fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{t.total}</span></div><div style={{ height:8, borderRadius:4, background:"#f1f5f9", overflow:"hidden" }}><div style={{ height:"100%", borderRadius:4, background:t.color, width:metrics.fin?`${Math.round((t.total/metrics.fin)*100)}%`:"0%", transition:"width 0.4s" }} /></div></div>)}
        </div>
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"18px 20px" }}>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:14, color:"#374151", fontFamily:"'Outfit',sans-serif" }}>Finalizados por mês</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:90 }}>
            {metrics.byMonth.map((m,i)=><div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}><span style={{ fontSize:11, fontWeight:700, color:"#374151", fontFamily:"'DM Sans',sans-serif" }}>{m.count}</span><div style={{ width:"100%", borderRadius:"4px 4px 0 0", background:"#1e3d6e", opacity:m.count===0?0.15:0.75, height:m.count===0?4:Math.max(8,Math.round((m.count/maxBar)*60)), transition:"height 0.4s" }} /><span style={{ fontSize:10, color:"#94a3b8", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>{m.label}</span></div>)}
          </div>
        </div>
      </div>
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"12px 14px", marginBottom:14 }}>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <input value={filters.search} onChange={e=>sf("search",e.target.value)} placeholder="Buscar por título ou protocolo..." style={{ ...inp, flex:"1 1 180px" }} />
          {bp.isMobile?<button onClick={()=>setShowFilters(v=>!v)} style={{ padding:"10px 12px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer" }}><Icon name="filter" size={15} color="#64748b" /></button>:<><select value={filters.status} onChange={e=>sf("status",e.target.value)} style={{ ...inp, width:"auto" }}><option value="">Todos</option><option value="finalizada">Finalizada</option><option value="cancelada">Cancelada</option></select><select value={filters.team} onChange={e=>sf("team",e.target.value)} style={{ ...inp, width:"auto" }}><option value="">Todas equipes</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><input type="date" value={filters.dateFrom} onChange={e=>sf("dateFrom",e.target.value)} style={{ ...inp, width:"auto" }} /><input type="date" value={filters.dateTo} onChange={e=>sf("dateTo",e.target.value)} style={{ ...inp, width:"auto" }} /></>}
          <span style={{ fontSize:12, color:"#94a3b8", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>{filtered.length} registro{filtered.length!==1?"s":""}</span>
        </div>
        {bp.isMobile&&showFilters&&<div style={{ marginTop:10, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}><select value={filters.status} onChange={e=>sf("status",e.target.value)} style={{ ...inp, fontSize:13 }}><option value="">Todos</option><option value="finalizada">Finalizada</option><option value="cancelada">Cancelada</option></select><select value={filters.team} onChange={e=>sf("team",e.target.value)} style={{ ...inp, fontSize:13 }}><option value="">Todas equipes</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>}
      </div>
      {bp.isMobile||bp.isTablet?<div style={{ display:"flex", flexDirection:"column", gap:10 }}>{filtered.map(r=><RequestCard key={r.id} r={r} onClick={()=>openRequest(r.id)} teams={teams} users={users} />)}{!filtered.length&&<div style={{ background:"#fff", borderRadius:12, border:"2px dashed #e2e8f0", padding:32, textAlign:"center", color:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>Nenhum registro.</div>}</div>:<div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}><thead><tr style={{ background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>{["Protocolo","Título","Equipe","Status","Responsável","Solicitante","Resolvido em"].map(h=><th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:600, color:"#374151", fontSize:12, whiteSpace:"nowrap", fontFamily:"'Outfit',sans-serif" }}>{h}</th>)}</tr></thead><tbody>{filtered.map(r=>{ const s=gs(r.status),t=teamById(teams,r.team_id),a=requestAssignee(r,users),req=requestRequester(r,users); const dur=r.created_at&&r.updated_at?Math.max(0,Math.round((new Date(r.updated_at)-new Date(r.created_at))/86400000)):null; return (<tr key={r.id} onClick={()=>openRequest(r.id)} style={{ borderBottom:"1px solid #f1f5f9", cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{ padding:"11px 16px", fontFamily:"monospace", fontSize:12, color:"#1e3d6e", fontWeight:600, whiteSpace:"nowrap" }}>{r.protocol}</td><td style={{ padding:"11px 16px", fontWeight:500, maxWidth:200, fontFamily:"'DM Sans',sans-serif" }}><div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</div></td><td style={{ padding:"11px 16px" }}>{t&&<span style={{ padding:"2px 8px", borderRadius:6, background:t.color+"20", color:t.color, fontWeight:600, fontSize:12 }}>{t.name}</span>}</td><td style={{ padding:"11px 16px" }}><span style={{ padding:"2px 8px", borderRadius:6, background:s.bg, color:s.color, fontWeight:600, fontSize:12 }}>{s.label}</span></td><td style={{ padding:"11px 16px" }}>{a?<div style={{ display:"flex", alignItems:"center", gap:6 }}><Avatar user={a} size={22} /><span style={{ fontFamily:"'DM Sans',sans-serif" }}>{a.full_name.split(" ")[0]}</span></div>:<span style={{ color:"#cbd5e1" }}>—</span>}</td><td style={{ padding:"11px 16px" }}>{req?<div style={{ display:"flex", alignItems:"center", gap:6 }}><Avatar user={req} size={22} /><span style={{ fontFamily:"'DM Sans',sans-serif" }}>{req.full_name.split(" ")[0]}</span></div>:<span style={{ color:"#cbd5e1" }}>—</span>}</td><td style={{ padding:"11px 16px", whiteSpace:"nowrap" }}><div style={{ fontSize:12, color:"#374151", fontFamily:"'DM Sans',sans-serif" }}>{fd(r.updated_at)}</div>{dur!==null&&<div style={{ fontSize:11, color:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>{dur}d de duração</div>}</td></tr>); })}{!filtered.length&&<tr><td colSpan={7} style={{ padding:32, textAlign:"center", color:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>Nenhum registro encontrado.</td></tr>}</tbody></table></div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// NEW REQUEST
// ─────────────────────────────────────────────
function NewRequestView({ currentUser, setView, showToast, bp, teams, requestTypes, users, requests, originView, api, loadAllData }) {
  const [form,setForm]=useState({title:"",description:"",team_id:"",type_id:"",priority:"media",assignee_id:"",client_name:""});
  const [assignees,setAssignees]=useState(users || []);
  useEffect(() => {
    let active = true;
    if (users && users.length > 0) {
      setAssignees(users);
      return () => { active = false; };
    }
    api.getAvailableAssignees()
      .then(data => { if (active) setAssignees(data); })
      .catch(err => {
        console.error("getAvailableAssignees error:", err);
        if (active) setAssignees([]);
      });
    return () => { active = false; };
  }, [users, api]);
  const types=requestTypes.filter(t=>t.team_id===form.team_id);
  const members = (assignees || []).filter(u => {
    if (u.is_active === false) return false;
    if (u.role === "solicitante") return false;
    if (!form.team_id) return false;
    if (["admin","supervisor","gestor"].includes(u.role)) return true;
    return u.team_id === form.team_id;
  });
  const back=originView || (currentUser.role==="solicitante"?"my-requests":"requests");
  const nextProtocol = () => {
    const year = new Date().getFullYear();
    const nums = requests
      .map(r => String(r.protocol || "").match(/^APEX-(\d{4})-(\d+)$/))
      .filter(m => m && Number(m[1]) === year)
      .map(m => Number(m[2]));
    const next = (nums.length ? Math.max(...nums) : 999) + 1;
    return `APEX-${year}-${String(next).padStart(5, "0")}`;
  };
  const create = async () => {
    if (!form.title || !form.team_id) {
      showToast("Preencha título e equipe.", "error");
      return;
    }
    try {
      await api.createRequest({
        protocol: nextProtocol(),
        title: form.title,
        description: form.description || null,
        team_id: form.team_id,
        type_id: form.type_id || null,
        priority: form.priority,
        assignee_id: form.assignee_id || null,
        client_name: form.client_name || null,
        requester_id: currentUser.id,
        status: "nova",
      });
      await loadAllData();
      showToast("Solicitação criada com sucesso!");
      setView(currentUser.role === "solicitante" ? "my-requests" : "requests");
    } catch (err) {
      console.error("Erro ao criar solicitação:", err);
      showToast("Erro ao criar solicitação: " + (err.message || err), "error");
    }
  };
  return (
    <div style={{ maxWidth:640, paddingBottom:bp.isMobile?80:0 }}>
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h2 style={{ fontSize:16, fontWeight:600, fontFamily:"'Outfit',sans-serif", color:"#0f172a" }}>Nova Solicitação</h2>
          <button onClick={()=>setView(back)} style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:13, color:"#64748b", fontFamily:"'DM Sans',sans-serif" }}>Cancelar</button>
        </div>
        <div style={{ padding:"20px" }}>
          <div style={{ display:"grid", gap:14 }}>
            <Field label="Título *"><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Descreva brevemente sua solicitação" style={inp} /></Field>
            <div style={{ display:"grid", gridTemplateColumns:bp.isMobile?"1fr":"1fr 1fr", gap:12 }}>
              <Field label="Equipe *"><select value={form.team_id} onChange={e=>setForm(f=>({...f,team_id:e.target.value,type_id:"",assignee_id:""}))} style={inp}><option value="">Selecione a equipe</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
              <Field label="Tipo"><select value={form.type_id} onChange={e=>setForm(f=>({...f,type_id:e.target.value}))} style={inp} disabled={!form.team_id}><option value="">Tipo de solicitação</option>{types.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:bp.isMobile?"1fr":"1fr 1fr", gap:12 }}>
              <Field label="Prioridade"><select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={inp}>{PRIORITIES.map(p=><option key={p.key} value={p.key}>{p.label}</option>)}</select></Field>
              <Field label="Responsável (opcional)"><select value={form.assignee_id} onChange={e=>setForm(f=>({...f,assignee_id:e.target.value}))} style={inp} disabled={!form.team_id}><option value="">Sem preferência</option>{members.map(u=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select></Field>
            </div>
            <Field label="Cliente / Departamento"><input value={form.client_name} onChange={e=>setForm(f=>({...f,client_name:e.target.value}))} placeholder="Ex: Comercial, Diretoria..." style={inp} /></Field>
            <Field label="Descrição"><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Descreva com detalhes o que você precisa..." rows={4} style={{ ...inp, resize:"vertical" }} /></Field>
          </div>
          <div style={{ marginTop:20, display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={()=>setView(back)} style={{ padding:"10px 20px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:13, color:"#64748b", fontFamily:"'DM Sans',sans-serif" }}>Cancelar</button>
            <button onClick={create} style={{ padding:"10px 24px", background:"#1e3d6e", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>Criar Solicitação</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN USERS
// ─────────────────────────────────────────────
const EMPTY_FORM={full_name:"",email:"",role:"solicitante",team_id:"",whatsapp:"",is_active:true};
function UserModal({ user, onSave, onClose, bp, availableRoles = ROLES, teams = TEAMS, api, setUsers, showToast }) {
  const isEdit=!!user; const [form,setForm]=useState(isEdit?{...user}:{...EMPTY_FORM,password:"Alpes@2025!"}); const [errors,setErrors]=useState({}); const [showPass,setShowPass]=useState(false); const [saving,setSaving]=useState(false);
  const needsTeam=form.role==="membro_equipe";
  const set=(k,v)=>{ setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:undefined})); };
  const saveUserViaEdge=async()=>{
    const e={};
    if(!form.full_name.trim()) e.full_name="Nome obrigatório";
    if(!form.email.trim()) e.email="E-mail obrigatório";
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email="E-mail inválido";
    if(needsTeam&&!form.team_id) e.team_id="Selecione a equipe";
    if(!isEdit&&(!form.password||form.password.length<8)) e.password="Senha deve ter no mínimo 8 caracteres";
    if(isEdit&&form.newPassword&&form.newPassword.length<8) e.newPassword="Nova senha deve ter no mínimo 8 caracteres";
    if(Object.keys(e).length){setErrors(e);return;}

    setSaving(true);
    try {
      if (isEdit) {
        if (form.newPassword && form.newPassword.trim()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error("Sessão expirada.");
          await api.updateUserPassword(form.id, form.newPassword, session.access_token);
        }
        await onSave({...form,id:form.id});
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sessão expirada. Faça login novamente.");

        await api.createUser({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
          team_id: form.team_id || null,
          whatsapp: form.whatsapp || null,
          is_active: form.is_active !== false,
        }, session.access_token);

        const updated = await api.getProfiles();
        if (typeof setUsers === "function") setUsers(updated);
        showToast("Usuário criado com sucesso.");
        onClose();
      }
    } catch (err) {
      console.error("UserModal save error:", err);
      showToast("Erro ao salvar: " + (err?.message || err), "error");
    } finally {
      setSaving(false);
    }
  };
  const fileRef=useRef();
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, avatar: ev.target.result }));
    reader.readAsDataURL(file);

    if (isEdit && form.id) {
      try {
        const avatarUrl = await api.uploadAvatar(form.id, file);
        setForm(f => ({ ...f, avatar_url: avatarUrl, avatar: avatarUrl }));
        showToast("Foto atualizada com sucesso.");
        if (typeof setUsers === "function") {
          setUsers(prev => prev.map(u =>
            u.id === form.id ? { ...u, avatar_url: avatarUrl } : u
          ));
        }
      } catch (err) {
        showToast("Erro ao salvar foto: " + (err?.message || err), "error");
      }
    }
  };
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:1000, display:"flex", alignItems:bp.isMobile?"flex-end":"center", justifyContent:"center", padding:bp.isMobile?0:"20px" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:bp.isMobile?"16px 16px 0 0":"14px", width:"100%", maxWidth:520, maxHeight:"92vh", overflow:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}>
        <div style={{ padding:"18px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"#fff", zIndex:1 }}>
          <div><h3 style={{ fontSize:16, fontWeight:600, color:"#0f172a", fontFamily:"'Outfit',sans-serif" }}>{isEdit?"Editar Usuário":"Novo Usuário"}</h3><p style={{ fontSize:12, color:"#94a3b8", marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>{isEdit?"Atualize as informações":"Preencha os dados para criar o acesso"}</p></div>
          <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="x" size={15} color="#64748b" /></button>
        </div>
        <div style={{ padding:"20px" }}>
          {/* Avatar upload */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:22, padding:"14px 16px", background:"#f8fafc", borderRadius:12, border:"1px solid #e2e8f0" }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <Avatar user={{ ...form, full_name:form.full_name||"?" }} size={48} />
              <button onClick={()=>fileRef.current?.click()} style={{ position:"absolute", bottom:-2, right:-2, width:20, height:20, borderRadius:"50%", background:"#1e3d6e", border:"2px solid #fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="image" size={10} color="#fff" /></button>
              <input type="file" accept="image/*" ref={fileRef} style={{ display:"none" }} onChange={handleAvatarChange} />
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:14, color:"#1e293b", fontFamily:"'DM Sans',sans-serif" }}>{form.full_name||"Nome do usuário"}</div>
              <div style={{ fontSize:12, color:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>{form.email||"email@empresa.com"}</div>
              {form.role&&<span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:grc(form.role).bg, color:grc(form.role).color, fontWeight:600, marginTop:4, display:"inline-block", fontFamily:"'DM Sans',sans-serif" }}>{grc(form.role).label}</span>}
            </div>
          </div>
          <div style={{ display:"grid", gap:14 }}>
            <Field label="Nome completo *"><input value={form.full_name} onChange={e=>set("full_name",e.target.value)} placeholder="Ex: João Silva" style={{ ...inp, borderColor:errors.full_name?"#fca5a5":"#e2e8f0" }} />{errors.full_name&&<span style={{ fontSize:12, color:"#ef4444", marginTop:4, display:"block", fontFamily:"'DM Sans',sans-serif" }}>{errors.full_name}</span>}</Field>
            <Field label="E-mail *"><input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="joao@alpesmidia.com" type="email" style={{ ...inp, borderColor:errors.email?"#fca5a5":"#e2e8f0" }} disabled={isEdit} />{errors.email&&<span style={{ fontSize:12, color:"#ef4444", marginTop:4, display:"block" }}>{errors.email}</span>}{isEdit&&<span style={{ fontSize:11, color:"#94a3b8", marginTop:4, display:"block", fontFamily:"'DM Sans',sans-serif" }}>E-mail não pode ser alterado.</span>}</Field>
            {!isEdit&&(
              <Field label="Senha *">
                <div style={{ position:"relative" }}>
                  <input value={form.password||""} onChange={e=>set("password",e.target.value)} type={showPass?"text":"password"} placeholder="Mínimo 8 caracteres" style={{ ...inp, borderColor:errors.password?"#fca5a5":"#e2e8f0", paddingRight:38 }} />
                  <button type="button" onClick={()=>setShowPass(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                    <Icon name={showPass?"eyeOff":"eye"} size={15} color="#475569" />
                  </button>
                </div>
                {errors.password&&<span style={{ fontSize:12, color:"#ef4444", marginTop:4, display:"block" }}>{errors.password}</span>}
              </Field>
            )}
            <Field label="Perfil de acesso *">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {availableRoles.map(r=><button key={r.key} onClick={()=>{set("role",r.key);if(r.key!=="membro_equipe") set("team_id","");}} style={{ padding:"10px 12px", borderRadius:10, border:`2px solid ${form.role===r.key?r.color:"#e2e8f0"}`, background:form.role===r.key?r.bg:"#fff", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}><div style={{ fontWeight:600, fontSize:13, color:form.role===r.key?r.color:"#374151", marginBottom:2, fontFamily:"'DM Sans',sans-serif" }}>{r.label}</div><div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.3, fontFamily:"'DM Sans',sans-serif" }}>{r.desc}</div></button>)}
              </div>
            </Field>
            {needsTeam&&<Field label="Equipe *"><div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>{teams.map(t=><button key={t.id} onClick={()=>set("team_id",t.id)} style={{ padding:"10px 12px", borderRadius:10, border:`2px solid ${form.team_id===t.id?t.color:"#e2e8f0"}`, background:form.team_id===t.id?t.color+"15":"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}><div style={{ width:10, height:10, borderRadius:"50%", background:t.color, flexShrink:0 }} /><span style={{ fontSize:13, fontWeight:600, color:form.team_id===t.id?t.color:"#374151", fontFamily:"'DM Sans',sans-serif" }}>{t.name}</span></button>)}</div>{errors.team_id&&<span style={{ fontSize:12, color:"#ef4444", marginTop:4, display:"block" }}>{errors.team_id}</span>}</Field>}
            <Field label="WhatsApp (opcional)"><div style={{ position:"relative" }}><Icon name="phone" size={15} color="#475569" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} /><input value={form.whatsapp||""} onChange={e=>set("whatsapp",e.target.value.replace(/\D/g,""))} placeholder="5511999990000" type="tel" style={{ ...inp, paddingLeft:36 }} /></div><span style={{ fontSize:11, color:"#94a3b8", marginTop:4, display:"block", fontFamily:"'DM Sans',sans-serif" }}>DDI + DDD + número</span></Field>
            {isEdit&&<Field label="Status"><div style={{ display:"flex", gap:8 }}>{[{v:true,l:"Ativo",c:"#16a34a",b:"#f0fdf4"},{v:false,l:"Inativo",c:"#dc2626",b:"#fef2f2"}].map(opt=><button key={String(opt.v)} onClick={()=>set("is_active",opt.v)} style={{ flex:1, padding:"10px", borderRadius:8, border:`2px solid ${form.is_active===opt.v?opt.c:"#e2e8f0"}`, background:form.is_active===opt.v?opt.b:"#fff", cursor:"pointer", fontWeight:600, fontSize:13, color:form.is_active===opt.v?opt.c:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>{opt.l}</button>)}</div></Field>}
            {isEdit&&(
              <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:16, marginTop:4 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>
                  Alterar senha (opcional)
                </label>
                <div style={{ position:"relative" }}>
                  <input value={form.newPassword||""} onChange={e=>set("newPassword",e.target.value)} type={showPass?"text":"password"} placeholder="Nova senha (mínimo 8 caracteres)" style={{ ...inp, paddingRight:38, borderColor:errors.newPassword?"#fca5a5":"#e2e8f0" }} />
                  <button type="button" onClick={()=>setShowPass(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                    <Icon name={showPass?"eyeOff":"eye"} size={15} color="#475569" />
                  </button>
                </div>
                {errors.newPassword&&<span style={{ fontSize:12, color:"#ef4444", marginTop:4, display:"block" }}>{errors.newPassword}</span>}
                <span style={{ fontSize:11, color:"#94a3b8", marginTop:4, display:"block", fontFamily:"'DM Sans',sans-serif" }}>Deixe em branco para não alterar a senha.</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding:"16px 20px", borderTop:"1px solid #f1f5f9", display:"flex", gap:10, justifyContent:"flex-end", position:"sticky", bottom:0, background:"#fff" }}>
          <button onClick={onClose} style={{ padding:"10px 20px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:13, color:"#64748b", fontFamily:"'DM Sans',sans-serif" }}>Cancelar</button>
          <button onClick={saveUserViaEdge} disabled={saving} style={{ padding:"10px 24px", background:"#1e3d6e", color:"#fff", border:"none", borderRadius:8, cursor:saving?"not-allowed":"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", opacity:saving?0.8:1 }}>{saving?"Salvando...":isEdit?"Salvar alterações":"Criar usuário"}</button>
        </div>
      </div>
    </div>
  );
}

function AdminUsers({ bp, showToast, users, setUsers, teams = TEAMS, api, currentUser }) {
  const [modal,setModal]=useState(null); const [search,setSearch]=useState(""); const [filterRole,setFilterRole]=useState(""); const [confirmDeact,setConfirmDeact]=useState(null);
  const visibleUsers = currentUser.role === "supervisor"
    ? users.filter(u => u.role !== "admin")
    : users;
  const availableRoles = currentUser.role === "supervisor"
    ? ROLES.filter(r => r.key !== "admin")
    : ROLES;
  const filtered=useMemo(()=>{ let u=visibleUsers; if(search) u=u.filter(x=>x.full_name.toLowerCase().includes(search.toLowerCase())||x.email.toLowerCase().includes(search.toLowerCase())); if(filterRole) u=u.filter(x=>x.role===filterRole); return u;},[visibleUsers,search,filterRole]);
  const saveUser = async (data) => {
    try {
      if (currentUser.role === "supervisor" && data.role === "admin") {
        showToast("Supervisores não podem gerenciar admins.", "error");
        return;
      }
      const isEdit = users.some(u => u.id === data.id);
      if (isEdit) {
        const oldUser = users.find(u => u.id === data.id);
        const { avatar, newPassword, password, ...profileData } = data;
        if (avatar && !profileData.avatar_url) profileData.avatar_url = avatar;
        await api.upsertProfile(profileData);
        if (currentUser.role === "supervisor") {
          await api.createAuditLog({
            actorId: currentUser.id,
            actorName: currentUser.full_name,
            action: "update_user",
            entity: "profiles",
            entityId: data.id,
            oldValue: oldUser,
            newValue: profileData,
            description: `Supervisor alterou usuário: ${data.full_name}`,
          });
        }
        const updated = await api.getProfiles();
        setUsers(updated);
        showToast("Usuário atualizado.");
      }
      setModal(null);
    } catch (err) {
      console.error("saveUser error:", err);
      showToast("Erro ao salvar: " + (err?.message || err), "error");
    }
  };
  const toggleActive = async (user) => {
    try {
      if (currentUser.role === "supervisor" && user.role === "admin") {
        showToast("Supervisores não podem gerenciar admins.", "error");
        return;
      }
      await api.toggleProfileActive(user.id, !user.is_active);
      if (currentUser.role === "supervisor") {
        await api.createAuditLog({
          actorId: currentUser.id,
          actorName: currentUser.full_name,
          action: user.is_active ? "deactivate_user" : "update_user",
          entity: "profiles",
          entityId: user.id,
          oldValue: { is_active: user.is_active },
          newValue: { is_active: !user.is_active },
          description: `Supervisor ${user.is_active ? "desativou" : "reativou"} usuário: ${user.full_name}`,
        });
      }
      const updated = await api.getProfiles();
      setUsers(updated);
      showToast(user.is_active
        ? user.full_name.split(" ")[0] + " desativado."
        : user.full_name.split(" ")[0] + " reativado."
      );
      setConfirmDeact(null);
    } catch (err) {
      showToast("Erro ao atualizar usuário.", "error");
    }
  };
  const RoleBadge=({role})=>{ const r=grc(role); return <span style={{ padding:"2px 8px", borderRadius:6, background:r.bg, color:r.color, fontWeight:600, fontSize:12, whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>{r.label}</span>; };
  return (
    <div style={{ paddingBottom:bp.isMobile?80:0 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, gap:10 }}>
        <div><h2 style={{ fontSize:16, fontWeight:600, fontFamily:"'Outfit',sans-serif", color:"#0f172a" }}>Usuários</h2><p style={{ fontSize:12, color:"#94a3b8", marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>{visibleUsers.length} cadastrado{visibleUsers.length!==1?"s":""}</p></div>
        <button onClick={()=>setModal("new")} style={{ padding:"9px 16px", background:"#1e3d6e", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}><Icon name="plus" size={15} color="#fff" /> {bp.isMobile?"Novo":"Novo usuário"}</button>
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome ou e-mail..." style={{ ...inp, flex:"1 1 200px" }} />
        <select value={filterRole} onChange={e=>setFilterRole(e.target.value)} style={{ ...inp, width:"auto" }}><option value="">Todos os perfis</option>{availableRoles.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}</select>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        {availableRoles.map(r=>{ const count=visibleUsers.filter(u=>u.role===r.key).length; return (<div key={r.key} onClick={()=>setFilterRole(fr=>fr===r.key?"":r.key)} style={{ background:"#fff", borderRadius:10, padding:"12px 14px", border:`1px solid ${filterRole===r.key?r.color:"#e2e8f0"}`, cursor:"pointer", borderLeft:`4px solid ${r.color}` }}><div style={{ fontSize:bp.isMobile?18:22, fontWeight:700, color:r.color, fontFamily:"'Outfit',sans-serif" }}>{count}</div><div style={{ fontSize:bp.isMobile?10:11, color:"#64748b", fontWeight:500, marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>{r.label}</div></div>); })}
      </div>
      {bp.isMobile?(
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(u=>{ const team=teamById(teams,u.team_id); const active=u.is_active!==false; return (<div key={u.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"14px 16px", opacity:active?1:0.6 }}><div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}><div style={{ display:"flex", alignItems:"center", gap:12 }}><Avatar user={u} size={38} /><div><div style={{ fontWeight:600, fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>{u.full_name}</div><div style={{ fontSize:12, color:"#64748b", fontFamily:"'DM Sans',sans-serif" }}>{u.email}</div></div></div><div style={{ display:"flex", gap:6 }}><button onClick={()=>setModal(u)} style={{ background:"#f1f5f9", border:"none", borderRadius:6, padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center" }}><Icon name="edit" size={13} color="#374151" /></button><button onClick={()=>active?setConfirmDeact(u):toggleActive(u)} style={{ background:active?"#fef2f2":"#f0fdf4", border:"none", borderRadius:6, padding:"6px 10px", cursor:"pointer" }}><Icon name={active?"x":"check"} size={13} color={active?"#dc2626":"#16a34a"} /></button></div></div><div style={{ display:"flex", flexWrap:"wrap", gap:6 }}><RoleBadge role={u.role} />{team&&<span style={{ padding:"2px 8px", borderRadius:6, background:team.color+"20", color:team.color, fontWeight:600, fontSize:12 }}>{team.name}</span>}<span style={{ padding:"2px 8px", borderRadius:6, background:active?"#f0fdf4":"#f1f5f9", color:active?"#16a34a":"#94a3b8", fontWeight:600, fontSize:12 }}>{active?"Ativo":"Inativo"}</span></div></div>); })}
        </div>
      ):(
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr style={{ background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>{["Usuário","E-mail","Perfil","Equipe","WhatsApp","Status","Ações"].map(h=><th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:600, color:"#374151", fontSize:12, whiteSpace:"nowrap", fontFamily:"'Outfit',sans-serif" }}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map(u=>{ const team=teamById(teams,u.team_id); const active=u.is_active!==false; return (<tr key={u.id} style={{ borderBottom:"1px solid #f1f5f9", opacity:active?1:0.55 }}><td style={{ padding:"12px 16px" }}><div style={{ display:"flex", alignItems:"center", gap:10 }}><Avatar user={u} size={30} /><span style={{ fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{u.full_name}</span></div></td><td style={{ padding:"12px 16px", color:"#64748b", fontFamily:"'DM Sans',sans-serif" }}>{u.email}</td><td style={{ padding:"12px 16px" }}><RoleBadge role={u.role} /></td><td style={{ padding:"12px 16px" }}>{team?<span style={{ padding:"2px 8px", borderRadius:6, background:team.color+"20", color:team.color, fontWeight:600, fontSize:12 }}>{team.name}</span>:<span style={{ color:"#cbd5e1" }}>—</span>}</td><td style={{ padding:"12px 16px", color:"#64748b", fontFamily:"monospace", fontSize:12 }}>{u.whatsapp||<span style={{ color:"#cbd5e1" }}>—</span>}</td><td style={{ padding:"12px 16px" }}><span style={{ padding:"2px 8px", borderRadius:6, background:active?"#f0fdf4":"#f1f5f9", color:active?"#16a34a":"#94a3b8", fontWeight:600, fontSize:12 }}>{active?"Ativo":"Inativo"}</span></td><td style={{ padding:"12px 16px" }}><div style={{ display:"flex", gap:6 }}><button onClick={()=>setModal(u)} style={{ padding:"5px 10px", border:"1px solid #e2e8f0", borderRadius:6, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#374151", fontFamily:"'DM Sans',sans-serif" }}><Icon name="edit" size={12} color="#374151" /> Editar</button><button onClick={()=>active?setConfirmDeact(u):toggleActive(u)} style={{ padding:"5px 10px", border:`1px solid ${active?"#fecaca":"#bbf7d0"}`, borderRadius:6, background:active?"#fef2f2":"#f0fdf4", cursor:"pointer", fontSize:12, color:active?"#dc2626":"#16a34a", fontFamily:"'DM Sans',sans-serif" }}>{active?"Desativar":"Reativar"}</button></div></td></tr>); })}{!filtered.length&&<tr><td colSpan={7} style={{ padding:32, textAlign:"center", color:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>Nenhum usuário encontrado.</td></tr>}</tbody>
          </table>
        </div>
      )}
      {modal&&<UserModal user={modal==="new"?null:modal} onSave={saveUser} onClose={()=>setModal(null)} bp={bp} availableRoles={availableRoles} teams={teams} api={api} setUsers={setUsers} showToast={showToast} />}
      {confirmDeact&&<div onClick={()=>setConfirmDeact(null)} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}><div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:14, padding:"24px", maxWidth:380, width:"100%", boxShadow:"0 24px 60px rgba(0,0,0,0.2)", textAlign:"center" }}><Icon name="alertCircle" size={32} color="#dc2626" style={{ marginBottom:12 }} /><h3 style={{ fontWeight:600, fontSize:16, marginBottom:8, fontFamily:"'Outfit',sans-serif" }}>Desativar usuário?</h3><p style={{ fontSize:13, color:"#64748b", lineHeight:1.6, marginBottom:20, fontFamily:"'DM Sans',sans-serif" }}><strong>{confirmDeact.full_name}</strong> não poderá mais acessar o sistema.</p><div style={{ display:"flex", gap:10 }}><button onClick={()=>setConfirmDeact(null)} style={{ flex:1, padding:"10px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:13, color:"#64748b", fontFamily:"'DM Sans',sans-serif" }}>Cancelar</button><button onClick={()=>toggleActive(confirmDeact)} style={{ flex:1, padding:"10px", background:"#ef4444", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>Desativar</button></div></div></div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
function AdminTeams({ bp, showToast, teams, setTeams, api, currentUser }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", slug:"", color:"#6366f1" });
  const [errors, setErrors] = useState({});

  const save = async () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    if (!form.slug.trim()) e.slug = "Slug obrigatório";
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      const created = await api.createTeam(form);
      if (currentUser.role === "supervisor") {
        await api.createAuditLog({
          actorId: currentUser.id,
          actorName: currentUser.full_name,
          action: "create_team",
          entity: "teams",
          entityId: created.id,
          oldValue: null,
          newValue: created,
          description: `Supervisor criou equipe: ${created.name}`,
        });
      }
      setTeams(prev => [...prev, created]);
      setModal(false);
      setForm({ name: "", slug: "", color: "#6366f1" });
      setErrors({});
      showToast("Equipe criada com sucesso.");
    } catch (err) {
      showToast("Erro ao criar equipe.", "error");
    }
  };

  return (
    <div style={{ paddingBottom: bp.isMobile ? 80 : 0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:16, fontWeight:600, fontFamily:"'Outfit',sans-serif" }}>Equipes</h2>
          <p style={{ fontSize:12, color:"#94a3b8", marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>
            {teams.length} equipe{teams.length !== 1 ? "s" : ""} cadastrada{teams.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => setModal(true)} style={{ padding:"9px 16px", background:"#1e3d6e", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>+ Adicionar</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns: bp.isMobile ? "1fr" : "repeat(auto-fill, minmax(200px,1fr))", gap:14 }}>
        {teams.map(t => (
          <div key={t.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"18px 20px", borderLeft:`4px solid ${t.color}` }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4, fontFamily:"'Outfit',sans-serif" }}>{t.name}</div>
            <div style={{ fontSize:12, color:"#64748b", marginBottom:12, fontFamily:"'DM Sans',sans-serif" }}>/{t.slug}</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:12, height:12, borderRadius:"50%", background:t.color }} />
              <span style={{ fontSize:11, color:"#94a3b8", fontFamily:"monospace" }}>{t.color}</span>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div onClick={() => setModal(false)} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:14, width:"100%", maxWidth:440, boxShadow:"0 24px 80px rgba(0,0,0,0.2)", overflow:"hidden" }}>
            <div style={{ padding:"18px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ fontSize:16, fontWeight:600, fontFamily:"'Outfit',sans-serif" }}>Nova Equipe</h3>
              <button onClick={() => setModal(false)} style={{ background:"#f1f5f9", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16 }}>×</button>
            </div>
            <div style={{ padding:20, display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Nome *</label>
                <input value={form.name} onChange={e => { const name = e.target.value; const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""); setForm(f => ({ ...f, name, slug })); setErrors(err => ({ ...err, name: undefined })); }} placeholder="Ex: Marketing" style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${errors.name ? "#fca5a5" : "#e2e8f0"}`, fontSize:14, outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
                {errors.name && <span style={{ fontSize:12, color:"#ef4444", marginTop:4, display:"block" }}>{errors.name}</span>}
              </div>
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Slug *</label>
                <input value={form.slug} onChange={e => { setForm(f => ({ ...f, slug: e.target.value })); setErrors(err => ({ ...err, slug: undefined })); }} placeholder="ex: marketing" style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${errors.slug ? "#fca5a5" : "#e2e8f0"}`, fontSize:14, outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
                {errors.slug && <span style={{ fontSize:12, color:"#ef4444", marginTop:4, display:"block" }}>{errors.slug}</span>}
              </div>
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Cor da equipe</label>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width:44, height:44, borderRadius:8, border:"1px solid #e2e8f0", cursor:"pointer", padding:2 }} />
                  <div style={{ width:32, height:32, borderRadius:"50%", background:form.color }} />
                  <span style={{ fontSize:12, color:"#94a3b8", fontFamily:"monospace" }}>{form.color}</span>
                </div>
              </div>
            </div>
            <div style={{ padding:"16px 20px", borderTop:"1px solid #f1f5f9", display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => { setModal(false); setErrors({}); }} style={{ padding:"10px 20px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:13, color:"#64748b", fontFamily:"'DM Sans',sans-serif" }}>Cancelar</button>
              <button onClick={save} style={{ padding:"10px 24px", background:"#1e3d6e", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>Criar equipe</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminTypes({ bp, showToast, requestTypes, setRequestTypes, teams, api, currentUser }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", team_id:"", description:"" });
  const [errors, setErrors] = useState({});

  const save = async () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    if (!form.team_id) e.team_id = "Selecione uma equipe";
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      const created = await api.createRequestType(form);
      if (currentUser.role === "supervisor") {
        await api.createAuditLog({
          actorId: currentUser.id,
          actorName: currentUser.full_name,
          action: "create_request_type",
          entity: "request_types",
          entityId: created.id,
          oldValue: null,
          newValue: created,
          description: `Supervisor criou tipo: ${created.name}`,
        });
      }
      setRequestTypes(prev => [...prev, created]);
      setModal(false);
      setForm({ name: "", team_id: "", description: "" });
      setErrors({});
      showToast("Tipo criado com sucesso.");
    } catch (err) {
      showToast("Erro ao criar tipo.", "error");
    }
  };

  return (
    <div style={{ paddingBottom: bp.isMobile ? 80 : 0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:16, fontWeight:600, fontFamily:"'Outfit',sans-serif" }}>Tipos de Solicitação</h2>
          <p style={{ fontSize:12, color:"#94a3b8", marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>
            {requestTypes.length} tipo{requestTypes.length !== 1 ? "s" : ""} cadastrado{requestTypes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => setModal(true)} style={{ padding:"9px 16px", background:"#1e3d6e", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>+ Adicionar</button>
      </div>
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
              {["Nome","Equipe","Descrição","Status"].map(h => <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:600, color:"#374151", fontSize:12, fontFamily:"'Outfit',sans-serif" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {requestTypes.map(t => {
              const team = teams.find(tm => tm.id === t.team_id);
              return (
                <tr key={t.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                  <td style={{ padding:"12px 16px", fontWeight:500, fontFamily:"'DM Sans',sans-serif" }}>{t.name}</td>
                  <td style={{ padding:"12px 16px" }}>{team && <span style={{ padding:"2px 8px", borderRadius:6, background:team.color+"20", color:team.color, fontWeight:600, fontSize:12 }}>{team.name}</span>}</td>
                  <td style={{ padding:"12px 16px", color:"#64748b", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{t.description || "—"}</td>
                  <td style={{ padding:"12px 16px" }}><span style={{ padding:"2px 8px", borderRadius:6, background:"#f0fdf4", color:"#16a34a", fontWeight:600, fontSize:12 }}>Ativo</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal && (
        <div onClick={() => setModal(false)} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:14, width:"100%", maxWidth:440, boxShadow:"0 24px 80px rgba(0,0,0,0.2)", overflow:"hidden" }}>
            <div style={{ padding:"18px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ fontSize:16, fontWeight:600, fontFamily:"'Outfit',sans-serif" }}>Novo Tipo</h3>
              <button onClick={() => setModal(false)} style={{ background:"#f1f5f9", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16 }}>×</button>
            </div>
            <div style={{ padding:20, display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Nome *</label>
                <input value={form.name} onChange={e => { setForm(f=>({...f,name:e.target.value})); setErrors(err=>({...err,name:undefined})); }} placeholder="Ex: Novo Relatório" style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${errors.name?"#fca5a5":"#e2e8f0"}`, fontSize:14, outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
                {errors.name && <span style={{ fontSize:12, color:"#ef4444", marginTop:4, display:"block" }}>{errors.name}</span>}
              </div>
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Equipe *</label>
                <select value={form.team_id} onChange={e => { setForm(f=>({...f,team_id:e.target.value})); setErrors(err=>({...err,team_id:undefined})); }} style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${errors.team_id?"#fca5a5":"#e2e8f0"}`, fontSize:14, outline:"none", background:"#fafafa", fontFamily:"'DM Sans',sans-serif" }}>
                  <option value="">Selecione a equipe</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {errors.team_id && <span style={{ fontSize:12, color:"#ef4444", marginTop:4, display:"block" }}>{errors.team_id}</span>}
              </div>
              <div>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>Descrição (opcional)</label>
                <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Descreva brevemente este tipo..." rows={3} style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:14, outline:"none", resize:"vertical", fontFamily:"'DM Sans',sans-serif" }} />
              </div>
            </div>
            <div style={{ padding:"16px 20px", borderTop:"1px solid #f1f5f9", display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => { setModal(false); setErrors({}); }} style={{ padding:"10px 20px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:13, color:"#64748b", fontFamily:"'DM Sans',sans-serif" }}>Cancelar</button>
              <button onClick={save} style={{ padding:"10px 24px", background:"#1e3d6e", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>Criar tipo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditoriaView({ bp, api }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.getAuditLogs()
      .then(data => {
        if (!cancelled) {
          setLogs(data || []);
          setError(null);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error("getAuditLogs error:", err);
          setError(err?.message || "Erro ao carregar");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const actionLabels = {
    update_request: "Alterou solicitação",
    delete_request: "Deletou solicitação",
    create_user: "Criou usuário",
    update_user: "Alterou usuário",
    deactivate_user: "Desativou usuário",
    create_team: "Criou equipe",
    create_request_type: "Criou tipo",
  };

  return (
    <div style={{ paddingBottom: bp.isMobile ? 80 : 0 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
          Auditoria
        </h2>
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
          Ações realizadas pelos supervisores
        </p>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
          Carregando...
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: 40, color: "#ef4444", fontFamily: "'DM Sans', sans-serif" }}>
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign:"center", padding:60 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <div style={{ fontWeight:600, fontSize:15, color:"#374151",
                        fontFamily:"'Outfit',sans-serif" }}>
            Nenhuma ação registrada ainda
          </div>
          <div style={{ fontSize:13, color:"#94a3b8", marginTop:6,
                        fontFamily:"'DM Sans',sans-serif" }}>
            As ações dos supervisores aparecerão aqui.
          </div>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Data/Hora","Supervisor","Ação","Entidade","Descrição"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12, fontFamily: "'Outfit', sans-serif", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "11px 16px", color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td style={{ padding: "11px 16px", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                    {log.actor_name}
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, background: "#fef3c7", color: "#92400e", fontWeight: 600, fontSize: 12 }}>
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px", color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>
                    {log.entity}
                  </td>
                  <td style={{ padding: "11px 16px", color: "#374151", fontFamily: "'DM Sans', sans-serif", maxWidth: 300 }}>
                    {log.description || "—"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>
                    Nenhuma ação registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ApexSolicitacoes() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [detailFrom, setDetailFrom] = useState("requests");
  const [newFrom, setNewFrom] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState(TEAMS);
  const [requestTypes, setRequestTypes] = useState(REQUEST_TYPES);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const bp = useBreakpoint();

  // Verificar sessão ao carregar
  useEffect(() => {
    let mounted = true
    let timeoutId = null

    if (!hasSupabaseConfig) {
      setAuthLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return
      if (error || !session) {
        if (mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          setAuthLoading(false)
        }
        return
      }
      try {
        const profile = await api.getProfile(session.user.id)
        if (!mounted) return
        if (profile && profile.is_active) {
          setCurrentUser(profile)
          setLoggedIn(true)
          loadAllData()
        } else {
          await supabase.auth.signOut()
        }
      } catch (e) {
        console.error('getProfile error:', e)
      } finally {
        if (mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          setAuthLoading(false)
        }
      }
    }).catch(err => {
      console.error('getSession error:', err)
      if (mounted) {
        if (timeoutId) clearTimeout(timeoutId)
        setLoggedIn(false)
        setCurrentUser(null)
        setAuthLoading(false)
      }
    })

    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth timeout')
        try {
          localStorage.removeItem('apex-session')
        } catch (storageErr) {
          console.warn('Auth timeout storage cleanup failed:', storageErr)
        }
        setLoggedIn(false)
        setCurrentUser(null)
        setAuthLoading(false)
      }
    }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return
        if (event === 'SIGNED_OUT') {
          setLoggedIn(false)
          setCurrentUser(null)
          setRequests([])
          setUsers([])
          setAuthLoading(false)
          return
        }
        if (event === 'SIGNED_IN' && session && !loggedIn) {
          try {
            const profile = await api.getProfile(session.user.id)
            if (!mounted) return
            if (profile && profile.is_active) {
              setCurrentUser(profile)
              setLoggedIn(true)
              loadAllData()
            } else {
              await supabase.auth.signOut()
            }
          } catch (e) {
            console.error(e)
          } finally {
            if (mounted) setAuthLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, []);

  useEffect(() => {
    if (bp.isMobile || bp.isTablet) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [bp.isMobile, bp.isTablet]);

  useEffect(() => {
    if (!loggedIn || !currentUser) return;
    const staffAdminViews = ["admin-users", "admin-teams", "admin-types"];
    const allowed = currentUser.role === "solicitante"
      ? ["my-requests", "new", "detail"]
      : [
          "dashboard",
          "requests",
          "historico",
          "new",
          "detail",
          ...(currentUser.role === "admin" || currentUser.role === "supervisor" ? staffAdminViews : []),
          ...(currentUser.role === "admin" ? ["auditoria"] : []),
        ];
    if (!allowed.includes(view)) {
      setView(currentUser.role === "solicitante" ? "my-requests" : "dashboard");
    }
  }, [loggedIn, currentUser, view]);

  const loadAllData = async () => {
    setDataLoading(true);
    try {
      const [reqs, profs, tms, types] = await Promise.all([
        api.getRequests(),
        api.getProfiles().catch(err => {
          console.error("getProfiles error:", err);
          return [];
        }),
        api.getTeams(),
        api.getRequestTypes(),
      ]);
      // Normalizar requests para o formato que o App espera
      const normalized = reqs.map(r => ({
        ...r,
        team_id: r.team?.id || r.team_id,
        type_id: r.type?.id || r.type_id,
        requester_id: r.requester?.id || r.requester_id,
        assignee_id: r.assignee?.id || r.assignee_id,
        _requester: r.requester || null,
        _assignee: r.assignee || null,
        comments: [],
        attachments: [],
        history: [],
      }));
      setRequests(normalized);
      setUsers(profs);
      if (tms?.length) setTeams(tms);
      if (types?.length) setRequestTypes(types);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      showToast('Erro ao carregar dados. Verifique a conexão.', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openRequest = async (id, from) => {
    setSelectedId(id);
    setDetailFrom(from || view);
    setView("detail");
    // Carregar comments, attachments e history do Supabase
    try {
      const [comments, attachments, history] = await Promise.all([
        api.getComments(id),
        api.getAttachments(id),
        api.getHistory(id),
      ]);
      setRequests(prev => prev.map(r => r.id === id ? {
        ...r,
        comments: comments.map(c => ({
          ...c,
          author_id: c.author?.id || c.author_id,
        })),
        attachments,
        history: history.map(h => ({
          ...h,
          actor_id: h.actor?.id || h.actor_id,
        })),
      } : r));
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
    }
  };

  const updateRequestFn = async (id, patch) => {
    console.log('updateRequestFn called:', id, patch);
    const oldRequest = requests.find(r => r.id === id);
    const optimisticUpdatedAt = new Date().toISOString();
    const resolveAssignee = assigneeId =>
      ((users?.length ? users : USERS).find(u => u.id === assigneeId) || null);

    setRequests(prev => prev.map(r =>
      r.id === id ? {
        ...r,
        ...patch,
        _assignee: Object.prototype.hasOwnProperty.call(patch, "assignee_id")
          ? resolveAssignee(patch.assignee_id)
          : r._assignee,
        updated_at: optimisticUpdatedAt
      } : r
    ));

    try {
      const updatedRequest = await api.updateRequest(id, patch);
      if (currentUser.role === "supervisor") {
        await api.createAuditLog({
          actorId: currentUser.id,
          actorName: currentUser.full_name,
          action: "update_request",
          entity: "requests",
          entityId: id,
          oldValue: {
            status: oldRequest?.status,
            priority: oldRequest?.priority,
            assignee_id: oldRequest?.assignee_id,
          },
          newValue: patch,
          description: `Supervisor alterou solicitação: ${Object.keys(patch).join(", ")}`,
        });
      }
      setRequests(prev => prev.map(r =>
        r.id === id ? {
          ...r,
          ...updatedRequest,
          _assignee: Object.prototype.hasOwnProperty.call(patch, "assignee_id")
            ? resolveAssignee(updatedRequest.assignee_id)
            : r._assignee,
        } : r
      ));
      showToast('Solicitação atualizada.');
    } catch (err) {
      console.error('updateRequestFn error:', err);
      if (oldRequest) {
        setRequests(prev => prev.map(r => r.id === id ? oldRequest : r));
      }
      showToast('Erro ao atualizar solicitação.', 'error');
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const data = await api.signInWithEmail(email, password);
      if (!data?.session) throw new Error('Login falhou');

      const profile = await api.getProfile(data.session.user.id);

      if (!profile) {
        await api.signOut();
        throw new Error('Perfil não encontrado. Contate o administrador.');
      }
      if (!profile.is_active) {
        await api.signOut();
        throw new Error('Usuário desativado. Contate o administrador.');
      }

      setCurrentUser(profile);
      setLoggedIn(true);
      setView(profile.role === "solicitante" ? "my-requests" : "dashboard");
      loadAllData();
    } catch (err) {
      throw err;
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await api.signInWithGoogle();
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = async () => {
    await api.signOut();
    setLoggedIn(false);
    setCurrentUser(null);
    setView("dashboard");
  };

  const selectedRequest = requests.find(r => r.id === selectedId);
  const isSolicitante = currentUser?.role === "solicitante";
  const navigate = (nextView) => {
    if (nextView === "new") setNewFrom(view);
    setView(nextView);
  };
  const sharedProps = {
    requests,
    setRequests,
    currentUser,
    openRequest: (id) => openRequest(id, view),
    setView: navigate,
    bp,
    users,
    teams,
    requestTypes,
    updateRequest: updateRequestFn,
    api,
    showToast,
    loadAllData,
  };

  // Loading inicial
  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#060d1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}>
        <ApexLogoMark size={48} />
        <div style={{
          color: "#4a7ab8",
          fontSize: 13,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.1em",
        }}>Carregando...</div>
        <div id="auth-debug" style={{
          color: "#334155",
          fontSize: 11,
          fontFamily: "monospace",
          maxWidth: 300,
          textAlign: "center",
        }}>
          Aguardando conexão com Supabase...
        </div>
      </div>
    );
  }

  if (!loggedIn || !currentUser) {
    return (
      <>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'DM Sans', sans-serif; }
        `}</style>
        <LoginScreen
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
        />
      </>
    );
  }

  const globalStyle = `
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%;overflow:hidden}
    body{font-family:'DM Sans',system-ui,sans-serif;background:#f8fafc;-webkit-font-smoothing:antialiased}
    input,textarea,select,button{font-family:'DM Sans',sans-serif}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
    ::-webkit-scrollbar-track{background:transparent}
    select{-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px!important}
    @media (hover:none){button:active{opacity:0.75}}
  `;

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{
        display: "flex", height: "100vh", overflow: "hidden", position: "relative",
        fontSize: 14, color: "#0f172a", background: "#f8fafc"
      }}>
        <AppAnimatedBackground />
        {!bp.isMobile && (
          <Sidebar
            currentUser={currentUser}
            view={view}
            setView={navigate}
            open={sidebarOpen}
            setOpen={setSidebarOpen}
            bp={bp}
          />
        )}
        {bp.isTablet && sidebarOpen && <div style={{ width: 220, flexShrink: 0 }} />}
        <div style={{
          flex: 1, overflow: "auto",
          display: "flex", flexDirection: "column", minWidth: 0,
          position: "relative", zIndex: 1
        }}>
          <Topbar
            currentUser={currentUser}
            view={view}
            setSidebarOpen={setSidebarOpen}
            bp={bp}
            onLogout={handleLogout}
          />
          <main style={{
            flex: 1,
            padding: bp.isMobile ? "16px 14px" : "24px 24px",
            overflow: "auto",
            position: "relative",
            zIndex: 1
          }}>
            {dataLoading ? (
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "center", height: "60vh",
                color: "#94a3b8", fontSize: 14,
                fontFamily: "'DM Sans', sans-serif"
              }}>
                Carregando dados...
              </div>
            ) : (
              <>
                {view === "dashboard" && !isSolicitante && (
                  <Dashboard {...sharedProps} />
                )}
                {view === "my-requests" && (
                  <MyRequestsView {...sharedProps} />
                )}
                {view === "requests" && !isSolicitante && (
                  <RequestsView {...sharedProps} />
                )}
                {view === "historico" && !isSolicitante && (
                  <HistoricoView {...sharedProps} />
                )}
                {view === "new" && (
                  <NewRequestView
                    currentUser={currentUser}
                    setView={setView}
                    setRequests={setRequests}
                    showToast={showToast}
                    bp={bp}
                    teams={teams}
                    requestTypes={requestTypes}
                    users={users}
                    requests={requests}
                    originView={newFrom}
                    api={api}
                    loadAllData={loadAllData}
                  />
                )}
                {view === "detail" && selectedRequest && (
                  <DetailView
                    request={selectedRequest}
                    currentUser={currentUser}
                    updateRequest={updateRequestFn}
                    setView={setView}
                    showToast={showToast}
                    setRequests={setRequests}
                    bp={bp}
                    detailFrom={detailFrom}
                    users={users}
                    teams={teams}
                    api={api}
                  />
                )}
                {view === "admin-users" && ["admin","supervisor"].includes(currentUser.role) && (
                  <AdminUsers
                    bp={bp}
                    showToast={showToast}
                    users={users}
                    setUsers={setUsers}
                    teams={teams}
                    api={api}
                    currentUser={currentUser}
                  />
                )}
                {view === "admin-teams" && ["admin","supervisor"].includes(currentUser.role) && (
                  <AdminTeams
                    bp={bp}
                    showToast={showToast}
                    teams={teams}
                    setTeams={setTeams}
                    api={api}
                    currentUser={currentUser}
                  />
                )}
                {view === "admin-types" && ["admin","supervisor"].includes(currentUser.role) && (
                  <AdminTypes
                    bp={bp}
                    showToast={showToast}
                    requestTypes={requestTypes}
                    setRequestTypes={setRequestTypes}
                    teams={teams}
                    api={api}
                    currentUser={currentUser}
                  />
                )}
                {view === "auditoria" && currentUser.role === "admin" && (
                  <AuditoriaView
                    currentUser={currentUser}
                    bp={bp}
                    api={api}
                  />
                )}
              </>
            )}
          </main>
        </div>
        {bp.isMobile && (
          <BottomNav currentUser={currentUser} view={view} setView={navigate} />
        )}
        {toast && (
          <div style={{
            position: "fixed",
            bottom: bp.isMobile ? 80 : 24,
            left: "50%", transform: "translateX(-50%)",
            background: toast.type === "error" ? "#ef4444" : "#16a34a",
            color: "#fff", padding: "12px 22px", borderRadius: 10,
            fontWeight: 600, fontSize: 13, zIndex: 9999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            whiteSpace: "nowrap", maxWidth: "90vw", textAlign: "center",
            fontFamily: "'DM Sans', sans-serif"
          }}>
            {toast.msg}
          </div>
        )}
        {import.meta.env.VITE_SHOW_DEMO === 'true' && (
          <DemoSwitcher
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            setView={setView}
            bp={bp}
          />
        )}
      </div>
    </>
  );
}
function DemoSwitcher({ currentUser, setCurrentUser, setView, bp }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:"fixed", bottom:bp.isMobile?72:20, right:12, zIndex:9000 }}>
      {open&&<div style={{ position:"absolute", bottom:"calc(100% + 8px)", right:0, background:"#0a1220", borderRadius:12, padding:"12px", boxShadow:"0 8px 32px rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.08)", minWidth:180 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#334155", marginBottom:8, textTransform:"uppercase", letterSpacing:1, fontFamily:"'Outfit',sans-serif" }}>Demo — Trocar usuário</div>
        {USERS.map(u=><button key={u.id} onClick={()=>{setCurrentUser(u);setView(u.role==="solicitante"?"my-requests":"dashboard");setOpen(false);}} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:8, border:"none", background:currentUser.id===u.id?"rgba(59,110,168,0.2)":"transparent", cursor:"pointer", width:"100%", textAlign:"left" }}><Avatar user={u} size={22} /><div><div style={{ fontSize:12, fontWeight:600, color:currentUser.id===u.id?"#7eb3e8":"#e2e8f0", fontFamily:"'DM Sans',sans-serif" }}>{u.full_name.split(" ")[0]}</div><div style={{ fontSize:10, color:"#475569", textTransform:"capitalize", fontFamily:"'DM Sans',sans-serif" }}>{u.role.replace(/_/g," ")}</div></div></button>)}
      </div>}
      <button onClick={()=>setOpen(v=>!v)} style={{ width:40, height:40, borderRadius:"50%", background:"#0a1220", border:"2px solid rgba(255,255,255,0.1)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(0,0,0,0.3)" }}>
        <Icon name="users" size={16} color="#7eb3e8" />
      </button>
    </div>
  );
}
