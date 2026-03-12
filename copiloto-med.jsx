import { useState, useEffect, useRef } from "react";
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const DEBUG_MODE = false;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FONT = "'Quicksand', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_SCALE = { P: 0.85, M: 1.0, G: 1.2 };
const SPECIALTIES = [
  "Clínica Geral","Cardiologia","Dermatologia","Endocrinologia","Gastroenterologia",
  "Ginecologia e Obstetrícia","Neurologia","Oftalmologia","Oncologia","Ortopedia",
  "Pediatria","Pneumologia","Psiquiatria","Radiologia","Reumatologia","Urologia","Outra"
];

const DOCTOR_STATUS = ["Formando","Residente","Médico Geral","Especialista","Professor/Pesquisador"];

const MOCK_CONSULTATIONS = [
  {
    id:1, name:"Maria Silva", age:40, sex:"Feminino", date:"20/01/2026", time:"09:30",
    chiefComplaint:"Check-up anual",
    diagnosis:"Hipertensão arterial sistêmica controlada. Diabetes Mellitus tipo 2 em ajuste terapêutico.",
    plan:"Metformina 850mg 2x/dia. Solicitados HbA1c e perfil lipídico. Retorno em 90 dias.",
    status:"em_acompanhamento",
    summary:"Paciente feminina, 40 anos, portadora de HAS e DM2. PA: 130/85 mmHg. Glicemia jejum: 132 mg/dL. HbA1c: 7.2% (acima da meta). LDL: 145 mg/dL. Ajustada dose de Metformina. Orientada sobre dieta e exercícios físicos regulares."
  },
  {
    id:2, name:"João Ferreira", age:55, sex:"Masculino", date:"18/01/2026", time:"14:00",
    chiefComplaint:"Dor torácica aos esforços",
    diagnosis:"Angina estável. Encaminhado para cardiologista.",
    plan:"ECG com alterações inespecíficas. Encaminhamento urgente à cardiologia. AAS 100mg/dia iniciado.",
    status:"encaminhado",
    summary:"Paciente masculino, 55 anos. Dor precordial em aperto aos médios esforços há 2 semanas. ECG com alterações de repolarização. Suspeita de angina estável. Encaminhado para cardiologia em caráter de urgência."
  },
  {
    id:3, name:"Ana Costa", age:28, sex:"Feminino", date:"15/01/2026", time:"11:00",
    chiefComplaint:"Cefaleia recorrente",
    diagnosis:"Enxaqueca sem aura (CID G43.0)",
    plan:"Sumatriptano 50mg para crises. Propranolol 40mg/dia profilaxia. Orientações sobre gatilhos.",
    status:"concluido",
    summary:"Paciente feminina, 28 anos. Crises de cefaleia pulsátil hemicraniana com fotofobia e náusea, 3-4x/mês há 6 meses. Sem déficit neurológico. Diagnóstico de enxaqueca sem aura. Profilaxia iniciada."
  },
];

const CHAT_RESPONSES = {
  default: {
    text: `Olá! Sou o Copiloto Med, seu assistente clínico.\n\nPosso ajudar com:\n• Registrar e resumir atendimentos\n• Buscar histórico de pacientes\n• Gerar resumos clínicos estruturados\n• Orientações sobre conduta e encaminhamentos\n\n⚠️ As decisões clínicas são sempre de sua responsabilidade.\n\nComo posso ajudar?`,
    refs: []
  },
  registro: {
    text: `**Registrar novo atendimento**\n\nClique em **"Novo Atendimento"** no Histórico, ou descreva aqui:\n\n• Nome do paciente e idade\n• Queixa principal\n• Diagnóstico\n• Conduta\n\nGero o resumo clínico formatado para você.`,
    refs: []
  },
  resumo: {
    text: `**Último atendimento — Maria Silva (40 anos)**\n\n📅 20/01/2026 · Check-up anual\n\n**Diagnóstico:**\nHAS controlada + DM2 em ajuste\n\n**Conduta:**\n• Metformina 850mg 2x/dia\n• HbA1c e perfil lipídico solicitados\n• Retorno em 90 dias\n\n**Status:** Em acompanhamento`,
    refs: []
  },
  pacientes: {
    text: `**Atendimentos recentes**\n\n1. **Maria Silva** (40a) — 20/01/2026 — Em acompanhamento\n2. **João Ferreira** (55a) — 18/01/2026 — Encaminhado (Cardiologia)\n3. **Ana Costa** (28a) — 15/01/2026 — Concluído\n\nDeseja o resumo de algum atendimento específico?`,
    refs: []
  },
  conduta: {
    text: `**Orientação clínica — dor torácica**\n\n🔴 **Sinais de alerta (encaminhar/emergência):**\n• Dor em repouso ou em progressão\n• Irradiação para braço, mandíbula\n• Sudorese, dispneia associadas\n• Alterações no ECG\n\n✅ **Investigação inicial:**\n• ECG em repouso\n• Troponina (se suspeita SCA)\n• Ecocardiograma se indicado\n\n⚠️ Esta orientação é auxiliar. Avaliação clínica presencial é indispensável.`,
    refs: []
  }
};

const CONSULTATION_FLOW = [
  {
    question: "Quero registrar um atendimento",
    response: {
      text: `Certo! Preciso de algumas informações:\n\n1️⃣ **Nome e idade do paciente**\n2️⃣ **Queixa principal**\n3️⃣ **Diagnóstico**\n4️⃣ **Conduta**\n\nQual o nome e idade do paciente?`,
      refs: []
    }
  },
  {
    question: "Maria Silva, 40 anos",
    response: {
      text: `Registrado: **Maria Silva, 40 anos**.\n\nQual a queixa principal e o diagnóstico?`,
      refs: []
    }
  },
  {
    question: "Check-up anual. HAS + DM2 em ajuste.",
    response: {
      text: `Entendido. Qual a conduta adotada?`,
      refs: []
    }
  },
  {
    question: "Ajuste de Metformina + exames solicitados",
    response: {
      text: `✅ **Atendimento registrado!**\n\n**Paciente:** Maria Silva, 40 anos\n**Queixa:** Check-up anual\n**Diagnóstico:** HAS + DM2\n**Conduta:** Ajuste de Metformina + exames\n\nResumo clínico adicionado ao Histórico de Atendimentos.`,
      refs: []
    }
  }
];

const MOCK_TERMS_USE = `TERMOS DE USO — COPILOTO MED\n\n1. Aceitação dos Termos\nAo utilizar o Copiloto Med, o profissional de saúde concorda com estes Termos de Uso. O serviço é oferecido exclusivamente como ferramenta auxiliar de apoio clínico e organização de informações médicas.\n\n2. Natureza do Serviço\nO Copiloto Med é um assistente de auxílio clínico baseado em inteligência artificial. NÃO substitui o julgamento clínico do médico, protocolos institucionais, diretrizes do CFM ou qualquer norma regulatória vigente. Toda decisão diagnóstica e terapêutica é de exclusiva responsabilidade do profissional habilitado.\n\n3. Uso Profissional\nA plataforma destina-se exclusivamente a profissionais de saúde devidamente registrados e habilitados. O usuário é responsável pelo uso adequado das informações geradas e pela verificação de sua precisão antes de qualquer aplicação clínica.\n\n4. Propriedade Intelectual\nTodo o conteúdo, design e funcionalidades do Copiloto Med são propriedade da empresa desenvolvedora.\n\n5. Modificações\nReservamo-nos o direito de modificar estes termos a qualquer momento, com notificação prévia.`;

const MOCK_TERMS_RESPONSIBILITY = `TERMOS DE RESPONSABILIDADE — COPILOTO MED\n\n1. Limitação de Responsabilidade\nO Copiloto Med é uma ferramenta de apoio ao profissional médico. As sugestões, resumos e orientações geradas por IA são de caráter auxiliar. Não nos responsabilizamos por decisões clínicas, diagnósticos ou condutas terapêuticas adotadas com base nas informações da plataforma.\n\n2. Responsabilidade Profissional\nO profissional de saúde mantém integral responsabilidade ética, legal e técnica sobre os atendimentos realizados, conforme os Princípios Fundamentais do Código de Ética Médica (CFM) e a legislação vigente. O uso desta ferramenta não transfere, reduz ou altera essa responsabilidade.\n\n3. Precisão das Informações\nOs resumos e sugestões gerados por inteligência artificial são aproximações baseadas nas informações inseridas. Podem conter imprecisões. O profissional deve sempre validar criticamente qualquer output antes de utilizá-lo clinicamente.\n\n4. Dados dos Pacientes\nO profissional é responsável por obter consentimento adequado dos pacientes para o registro e uso de seus dados clínicos na plataforma, em conformidade com a LGPD e normas do CFM sobre prontuário eletrônico.`;

const MOCK_PRIVACY_POLICY = `POLÍTICA DE PRIVACIDADE — COPILOTO MED\n\n1. Dados Coletados\nColetamos: email e dados de cadastro do profissional (nome, CRM, especialidade), além dos dados clínicos de pacientes inseridos pelo próprio profissional no exercício de suas atividades.\n\n2. Uso dos Dados\nOs dados são utilizados exclusivamente para:\n• Apoiar o profissional na organização de atendimentos\n• Gerar resumos clínicos por inteligência artificial\n• Melhorar continuamente a ferramenta\n\n3. Dados de Pacientes\nOs dados clínicos inseridos pertencem ao profissional e ao paciente. Não compartilhamos informações de pacientes com terceiros, exceto quando exigido por lei ou ordem judicial.\n\n4. Conformidade\nO tratamento de dados segue a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018) e as diretrizes do Conselho Federal de Medicina sobre prontuário e sigilo médico.\n\n5. Segurança\nUtilizamos criptografia e boas práticas de segurança para proteger dados sensíveis de saúde.\n\n6. Seus Direitos\nO profissional pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento.`;

// ─── COLORS ───
const C = {
  pri: "#2563EB", priHover: "#1D4ED8", priDark: "#1E40AF", priLight: "#DBEAFE", priGhost: "#EFF6FF",
  priBg: "#2563EB15",
  acc: "#0D9488", accLight: "#CCFBF1",
  bg: "#F8FAFC", card: "#FFFFFF",
  bgEmotional: "#F8FAFC", bgClinical: "#F8FAFC",
  sidebar: "#0F172A", sidebarHover: "#1E293B", sidebarActive: "#2563EB30",
  text: "#0F172A", textSec: "#475569", textMuted: "#94A3B8", textLight: "#CBD5E1",
  lilac: "#7C3AED", lilacLight: "#EDE9FE", lilacBg: "#F5F3FF",
  border: "#E2E8F0", borderLight: "#F1F5F9",
  ok: "#16A34A", okBg: "#DCFCE7",
  warn: "#D97706", warnBg: "#FEF3C7",
  err: "#DC2626", errBg: "#FEE2E2",
  navy: "#0F172A", navyMid: "#1E293B", gold: "#D4A853", goldLight: "#F5E6B8",
  chatUser: "#2563EB", chatBot: "#FFFFFF",
  secondary: "#0D9488", muted: "#E2E8F0", accent: "#DBEAFE",
  cream: "#E2E8F0", coral: "#DC2626", teal: "#0D9488", blue: "#0F172A",
  ring: "#2563EB",
};

const baseInput = {
  width:"100%", padding:"12px 16px", border:`2px solid ${C.muted}`, borderRadius:8, fontSize:15,
  outline:"none", transition:"all .2s ease", background:"white", color:C.text, boxSizing:"border-box",
  fontFamily:FONT, fontWeight:500,
};

// ─── ICONS ───
const I = ({n, s=18, c="currentColor", sw=1.8, ...p}) => {
  const d = {
    mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>,
    arrowL: <><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></>,
    check: <><path d="M20 6 9 17l-5-5"/></>,
    send: <><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/></>,
    plus: <><path d="M5 12h14"/><path d="M12 5v14"/></>,
    mic: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></>,
    card: <><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></>,
    file: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></>,
    chat: <><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></>,
    chevL: <><path d="m15 18-6-6 6-6"/></>,
    chevD: <><path d="m6 9 6 6 6-6"/></>,
    chevU: <><path d="m18 15-6-6-6 6"/></>,
    chevR: <><path d="m9 18 6-6-6-6"/></>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></>,
    camera: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></>,
    trash: <><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></>,
    sparkle: <><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
    clip: <><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></>,
    syringe: <><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></>,
    shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></>,
    heart: <><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></>,
    pill: <><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></>,
    x: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>,
    user: <><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></>,
    flask: <><path d="M9 3h6l1 7H8L9 3Z"/><path d="M6.8 12.8C5.1 14.5 4 17.2 4 20h16c0-2.8-1.1-5.5-2.8-7.2"/><path d="M9 3v5"/><path d="M15 3v5"/></>,
    activity: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>{d[n]}</svg>;
};

// ─── LOGO ───
const CopiloMedLogo = ({width=180, variant="color"}) => {
  const isDark = variant === "white";
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:0,fontFamily:FONT}}>
      <span style={{fontSize:width*0.165,fontWeight:800,color:isDark?"#FFFFFF":"#2563EB",letterSpacing:"-0.5px"}}>Med</span>
      <span style={{fontSize:width*0.165,fontWeight:700,color:isDark?"#93C5FD":"#1D4ED8",letterSpacing:"-0.5px"}}>Copilot</span>
    </div>
  );
};

const CopiloMedLogoSmall = ({size=28, variant="color"}) => {
  const color = variant==="white" ? "#93C5FD" : "#2563EB";
  return <span style={{fontSize:size*0.7,fontWeight:800,color,fontFamily:FONT,lineHeight:1}}>M</span>;
};

const ChatAvatar = ({size=40}) => (
  <div style={{
    width:size, height:size, borderRadius:"50%",
    background:`linear-gradient(135deg, #2563EB, #1D4ED8)`,
    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
    boxShadow:"0 2px 8px rgba(37,99,235,0.3)"
  }}>
    <span style={{fontSize:size*0.38,fontWeight:700,color:"#fff",fontFamily:FONT,lineHeight:1,marginTop:1}}>M</span>
  </div>
);

// ─── TOAST ───
const Toast = ({message, type="success", onClose}) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, []);
  const bg = type==="success" ? C.ok : type==="error" ? C.err : C.pri;
  return (
    <div style={{position:"fixed",top:20,right:20,zIndex:9999,padding:"12px 22px",borderRadius:12,
      background:bg,color:"#fff",fontSize:13,fontWeight:500,boxShadow:`0 8px 32px ${bg}40`,
      animation:"toastIn .35s cubic-bezier(.21,1.02,.73,1)",display:"flex",alignItems:"center",gap:8,fontFamily:FONT}}>
      {type==="success"&&<I n="check" s={16} c="#fff"/>}{message}
    </div>
  );
};

// ─── CONFIRM MODAL ───
const ConfirmModal = ({title,message,onConfirm,onCancel,danger}) => (
  <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,backdropFilter:"blur(4px)"}} onClick={onCancel}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:32,maxWidth:400,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
      <h3 style={{margin:"0 0 6px",fontSize:17,fontWeight:700,color:C.text}}>{title}</h3>
      <p style={{margin:"0 0 24px",color:C.textSec,fontSize:14,lineHeight:1.6}}>{message}</p>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{padding:"9px 18px",border:`1.5px solid ${C.border}`,borderRadius:10,background:"#fff",cursor:"pointer",fontSize:13,color:C.textSec,fontFamily:FONT,fontWeight:500}}>Cancelar</button>
        <button onClick={onConfirm} style={{padding:"9px 18px",border:"none",borderRadius:10,background:danger?C.err:C.pri,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:FONT}}>{danger?"Remover":"Confirmar"}</button>
      </div>
    </div>
  </div>
);

// ─── BTN ───
const Btn = ({children, variant="primary", icon, onClick, style:s, disabled, ...p}) => {
  const base = {display:"inline-flex",alignItems:"center",gap:7,fontFamily:FONT,fontSize:15,fontWeight:600,
    borderRadius:999,cursor:disabled?"default":"pointer",transition:"all .2s",border:"none",padding:"13px 28px",
    boxShadow:"0 4px 14px rgba(37,99,235,0.35)",...s};
  const vars = {
    primary: {...base,background:C.pri,color:"#fff"},
    ghost: {...base,background:"transparent",color:C.text,border:`2px solid ${C.cream}`,boxShadow:"none"},
    danger: {...base,background:C.errBg,color:C.err,border:`1px solid ${C.err}25`,boxShadow:"none"},
    teal: {...base,background:C.priGhost,color:C.pri,border:`1.5px solid ${C.pri}30`,boxShadow:"none"},
  };
  return <button onClick={onClick} disabled={disabled} style={{...vars[variant]||vars.primary,opacity:disabled?.5:1}} {...p}>{icon}{children}</button>;
};

// ─── WELCOME ───
const WelcomeScreen = ({onEnterEmail}) => (
  <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F8FAFC",fontFamily:FONT}}>
    <div style={{textAlign:"center",maxWidth:380,padding:32}}>
      <CopiloMedLogo width={260}/>
      <p style={{color:C.textSec,fontSize:14,margin:"18px 0 44px",lineHeight:1.6}}>Assistente clínico para profissionais de saúde</p>
      <button onClick={onEnterEmail} style={{width:"100%",padding:"14px",border:"none",borderRadius:999,
        background:C.pri,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:FONT,
        boxShadow:`0 4px 14px rgba(37,99,235,0.35)`,transition:"all .2s"}}>
        <I n="heart" s={18} c="#fff"/>Entrar como Profissional de Saúde
      </button>
    </div>
  </div>
);

// ─── EMAIL ───
const EmailScreen = ({onBack, onSendCode}) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const validate = () => {
    if(!email){setError("Digite seu email");return}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError("Verifique o formato do email");return}
    setError("");onSendCode(email);
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"#F8FAFC",fontFamily:FONT}}>
      <div style={{padding:"14px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14,background:"#F8FAFC"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}><I n="arrowL" s={18} c={C.textSec}/></button>
        <span style={{fontSize:15,fontWeight:700,color:C.text}}>Entrar como Paciente</span>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{maxWidth:380,width:"100%",textAlign:"center"}}>
          <CopiloMedLogo width={200}/>
          <div style={{height:18}}/>
          <h2 style={{fontSize:22,fontWeight:700,color:C.text,margin:"0 0 4px"}}>Seu email</h2>
          <p style={{color:C.textSec,fontSize:13,margin:"0 0 28px"}}>Enviaremos um código de acesso</p>
          <div style={{textAlign:"left",marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Email</label>
            <input type="email" value={email} placeholder="seu@email.com"
              onChange={e=>{setEmail(e.target.value);setError("")}}
              onBlur={()=>{if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))setError("Verifique o formato do email")}}
              style={{...baseInput,borderColor:error?C.err:C.border}}/>
            {error&&<p style={{color:C.err,fontSize:12,margin:"5px 0 0",fontWeight:500}}>⚠ {error}</p>}
          </div>
          <button onClick={validate} style={{width:"100%",padding:"13px",border:"none",borderRadius:999,
            background:C.pri,color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:FONT,
            boxShadow:`0 4px 14px rgba(37,99,235,0.35)`}}>Enviar Código</button>
        </div>
      </div>
    </div>
  );
};

// ─── CODE ───
const CodeScreen = ({email, onBack, onVerify}) => {
  const [code, setCode] = useState(["","","","","",""]);
  const [timer, setTimer] = useState(300);
  const refs = useRef([]);
  useEffect(()=>{const t=setInterval(()=>setTimer(p=>p>0?p-1:0),1000);return()=>clearInterval(t)},[]);
  const handleChange = (i,v) => {
    if(!/^\d?$/.test(v))return;const nc=[...code];nc[i]=v;setCode(nc);
    if(v&&i<5)refs.current[i+1]?.focus();
    if(nc.every(d=>d))setTimeout(()=>onVerify(nc.join("")),400);
  };
  const handlePaste = e => {
    const p=e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if(p.length===6){setCode(p.split(""));setTimeout(()=>onVerify(p),400)}
  };
  const handleKey = (i,e) => {if(e.key==="Backspace"&&!code[i]&&i>0)refs.current[i-1]?.focus()};
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"#F8FAFC",fontFamily:FONT}}>
      <div style={{padding:"14px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14,background:"#F8FAFC"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}><I n="arrowL" s={18} c={C.textSec}/></button>
        <span style={{fontSize:15,fontWeight:700,color:C.text}}>Verificar Código</span>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{maxWidth:380,width:"100%",textAlign:"center"}}>
          <div style={{width:52,height:52,borderRadius:14,background:C.okBg,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:18}}>
            <I n="check" s={24} c={C.ok}/>
          </div>
          <h2 style={{fontSize:22,fontWeight:700,color:C.text,margin:"0 0 4px"}}>Digite o código</h2>
          <p style={{color:C.textSec,fontSize:13,margin:"0 0 28px"}}>Enviamos para <strong style={{color:C.text}}>{email}</strong></p>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:14}}>
            {code.map((d,i)=>(
              <input key={i} ref={el=>refs.current[i]=el} value={d} maxLength={1}
                onChange={e=>handleChange(i,e.target.value)} onPaste={handlePaste} onKeyDown={e=>handleKey(i,e)}
                style={{width:46,height:54,textAlign:"center",fontSize:22,fontWeight:800,
                  border:`2px solid ${d?C.pri:C.border}`,borderRadius:12,outline:"none",
                  transition:"all .2s",fontFamily:FONT,color:C.text,background:"#fff"}}/>
            ))}
          </div>
          <p style={{color:C.textMuted,fontSize:12,margin:"0 0 14px"}}>Código expira em <strong style={{color:C.text}}>{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,"0")}</strong></p>
          <button disabled={timer>0} style={{padding:"8px 20px",border:`1.5px solid ${C.border}`,borderRadius:10,background:"#fff",
            color:timer>0?C.textMuted:C.pri,cursor:timer>0?"default":"pointer",fontSize:13,fontFamily:FONT,fontWeight:600,opacity:timer>0?.4:1}}>
            ↻ Reenviar código
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── SIDEBAR ───
const Sidebar = ({active, onNavigate, email, onLogout, collapsed, onToggle, onUpload, consultations, onNewConsultation, onSelectConsultation, activeConsultationId, fontSize, onFontSizeChange}) => {
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const items = [
    {id:"chat",icon:"chat",label:"Copiloto"},
    {id:"historico",icon:"card",label:"Atendimentos"},
  ];
  const navBtn = (it) => {
    const act = active===it.id;
    return (
      <button key={it.id} onClick={()=>{if(it.id==="chat")onNewConsultation?.();onNavigate(it.id)}}
        style={{width:"100%",padding:collapsed?"10px":"10px 14px",borderRadius:10,border:"none",
          background:act?C.sidebarActive:"transparent",display:"flex",alignItems:"center",gap:11,
          cursor:"pointer",marginBottom:2,textAlign:"left",transition:"all .15s",fontFamily:FONT,
          justifyContent:collapsed?"center":"flex-start"}}>
        <I n={it.icon} s={18} c={act?"#93C5FD":C.textMuted} sw={act?2:1.6}/>
        {!collapsed&&<span style={{fontSize:13,fontWeight:act?700:500,color:act?"#93C5FD":"#D1D5DB"}}>{it.label}</span>}
      </button>
    );
  };
  return (
    <div style={{width:collapsed?60:240,background:C.sidebar,display:"flex",flexDirection:"column",flexShrink:0,fontFamily:FONT,transition:"width .25s ease",overflow:"hidden"}}>
      <div style={{padding:collapsed?"16px 10px":"18px 18px 14px",display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between",flexShrink:0}}>
        {collapsed ? <button onClick={onToggle} style={{background:"none",border:"none",cursor:"pointer",padding:0}}><CopiloMedLogoSmall size={22} variant="white"/></button>
        : <><CopiloMedLogo width={150} variant="white"/>
          <button onClick={onToggle} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><I n="chevL" s={16} c={C.textMuted}/></button>
        </>}
      </div>
      <div style={{flex:1,padding:collapsed?"0 8px":"0 10px",overflowY:"auto"}}>
        <div style={{marginBottom:16}}>{items.map(navBtn)}</div>
        <div style={{borderTop:`1px solid #1E293B`,margin:collapsed?"12px 0":"12px 4px",paddingTop:12}}>
          {!collapsed&&<p style={{fontSize:10,fontWeight:700,color:"#9CA3AF",letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 8px 4px"}}>Documentos</p>}
          <button onClick={onUpload} style={{width:"100%",padding:collapsed?"10px":"10px 14px",borderRadius:10,
            border:`1.5px dashed #4B5563`,background:"transparent",cursor:"pointer",
            display:"flex",alignItems:"center",gap:9,fontFamily:FONT,justifyContent:collapsed?"center":"flex-start",transition:"all .15s"}}>
            <I n="clip" s={16} c="#9CA3AF"/>
            {!collapsed&&<span style={{fontSize:12,fontWeight:600,color:"#9CA3AF"}}>Adicionar arquivos</span>}
          </button>
        </div>
        {!collapsed&&consultations&&consultations.length>0&&(
          <div style={{borderTop:`1px solid #1E293B`,margin:"12px 4px",paddingTop:12}}>
            <button onClick={()=>setHistoryExpanded(!historyExpanded)}
              style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",padding:"0 4px 8px",fontFamily:FONT}}>
              <p style={{fontSize:10,fontWeight:700,color:"#9CA3AF",letterSpacing:"1px",textTransform:"uppercase",margin:0}}>Histórico ({consultations.length})</p>
              <I n={historyExpanded?"chevU":"chevD"} s={12} c="#9CA3AF"/>
            </button>
            {historyExpanded&&(
              <div style={{maxHeight:200,overflowY:"auto",marginTop:4}}>
                {consultations.map(c=>{
                  const isActive = activeConsultationId===c.id;
                  return (
                    <button key={c.id} onClick={()=>onSelectConsultation(c.id)}
                      style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"none",background:isActive?"#1E293B":"transparent",cursor:"pointer",marginBottom:4,textAlign:"left",fontFamily:FONT,transition:"all .15s"}}
                      onMouseEnter={e=>!isActive&&(e.currentTarget.style.background="#1E293B")}
                      onMouseLeave={e=>!isActive&&(e.currentTarget.style.background="transparent")}>
                      <div style={{fontSize:11,fontWeight:600,color:isActive?"#93C5FD":"#D1D5DB",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{c.title}</div>
                      <div style={{fontSize:9,color:"#9CA3AF"}}>{c.date} • {c.time}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{padding:collapsed?"12px 8px":"14px 14px",borderTop:"1px solid #1E293B",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:collapsed?"center":"flex-start",gap:9}}>
          <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${C.pri},#1D4ED8)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800,flexShrink:0}}>
            {email?.[0]?.toUpperCase()||"P"}
          </div>
          {!collapsed&&<div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,color:"#D1D5DB",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{email}</div>
            <button onClick={onLogout} style={{background:"none",border:"none",padding:0,color:C.textMuted,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",gap:3,fontFamily:FONT,marginTop:1}}>
              <I n="logout" s={11} c={C.textMuted}/>Sair
            </button>
          </div>}
        </div>
      </div>
    </div>
  );
};


// ─── ONBOARDING MODAL ───
const OnboardingModal = ({onComplete, onSkip}) => {
  const [step, setStep] = useState(1);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(null);
  const [form, setForm] = useState({
    name:"", crm:"", specialty:"", status:"", hospitals:"", plans:""
  });
  const [errors, setErrors] = useState({});
  const up = (k,v) => { setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:undefined})); };
  const validate2 = () => {
    const e={};
    if(!form.name.trim()) e.name="Nome é obrigatório";
    if(!form.specialty) e.specialty="Especialização é obrigatória";
    if(Object.keys(e).length){setErrors(e);return false}
    return true;
  };
  const iStyle = f => ({...baseInput,borderColor:errors[f]?C.err:C.border});
  return (
    <div style={{position:"fixed",inset:0,zIndex:9997,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,backdropFilter:"blur(6px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#F8FAFC",borderRadius:24,padding:"36px 32px",maxWidth:540,width:"92%",boxShadow:"0 24px 60px rgba(0,0,0,.25)",maxHeight:"90vh",overflow:"auto"}}>
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {[1,2,3,4].map(s=>(<div key={s} style={{flex:1,height:4,borderRadius:3,background:s<=step?C.pri:C.border,transition:"all .3s ease"}}/>))}
        </div>
        {step===1&&(
          <div>
            <div style={{textAlign:"center",marginBottom:20}}>
              <CopiloMedLogo width={180}/>
              <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:"14px 0 6px"}}>Antes de começar</h2>
              <p style={{color:C.textSec,fontSize:13,lineHeight:1.6,margin:0}}>Leia os pontos abaixo sobre o uso do Copiloto Med como ferramenta clínica.</p>
            </div>
            <div style={{background:"#fff",borderRadius:12,padding:16,marginBottom:12,border:`2px solid ${C.pri}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:32,height:32,borderRadius:8,background:C.priLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n="sparkle" s={16} c={C.pri}/></div>
                <h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>Auxílio clínico — não substitui o médico</h3>
              </div>
              <p style={{fontSize:12,color:C.textSec,lineHeight:1.7,margin:0}}>
                O Copiloto Med é uma ferramenta de <strong style={{color:C.text}}>apoio ao profissional de saúde</strong> — organização de atendimentos, resumos clínicos e sugestões baseadas em IA. <strong style={{color:C.err}}>Não substitui o julgamento clínico, protocolos institucionais nem diretrizes do CFM.</strong> A responsabilidade sobre diagnósticos e condutas é integralmente do profissional habilitado.
              </p>
            </div>
            <div style={{background:C.bg,borderRadius:10,padding:14,marginBottom:14,border:`1px solid ${C.border}`}}>
              <p style={{fontSize:11,fontWeight:700,color:C.text,margin:"0 0 10px"}}>Documentos legais</p>
              {[{key:"use",label:"Termos de Uso"},{key:"responsibility",label:"Termos de Responsabilidade"},{key:"privacy",label:"Politica de Privacidade"}].map(t=>(
                <button key={t.key} onClick={()=>setShowTermsModal(t.key)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",cursor:"pointer",fontFamily:FONT,textAlign:"left",width:"100%",marginBottom:6}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.pri}}>{t.label}</span>
                  <I n="chevR" s={14} c={C.textMuted}/>
                </button>
              ))}
            </div>
            <div style={{background:C.warnBg,borderRadius:10,padding:"12px 14px",marginBottom:16,border:`1.5px solid ${C.warn}40`}}>
              <label style={{display:"flex",alignItems:"start",gap:10,cursor:"pointer"}}>
                <input type="checkbox" checked={disclaimerAccepted} onChange={e=>setDisclaimerAccepted(e.target.checked)} style={{width:18,height:18,cursor:"pointer",accentColor:C.pri,marginTop:1,flexShrink:0}}/>
                <span style={{fontSize:12,color:"#92400E",lineHeight:1.6}}>Declaro que li e compreendi que o <strong>Copiloto Med é um auxílio clínico e não substitui meu julgamento profissional</strong>, e concordo com os termos legais.</span>
              </label>
            </div>
            <button onClick={()=>setStep(2)} disabled={!disclaimerAccepted}
              style={{width:"100%",padding:"14px",border:"none",borderRadius:12,background:disclaimerAccepted?C.pri:C.border,color:"#fff",fontSize:15,fontWeight:700,cursor:disclaimerAccepted?"pointer":"not-allowed",fontFamily:FONT,opacity:disclaimerAccepted?1:0.5,transition:"all .2s"}}>
              Concordo e quero continuar
            </button>
          </div>
        )}
        {step===2&&(
          <div>
            <div style={{textAlign:"center",marginBottom:20}}>
              <h2 style={{fontSize:20,fontWeight:800,color:C.text,margin:"0 0 6px"}}>Sua identificação</h2>
              <p style={{fontSize:13,color:C.textSec,margin:0}}>Dados profissionais básicos</p>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Nome completo *</label>
              <input value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Ex: Dr. Pedro Souza" style={iStyle("name")}/>
              {errors.name&&<p style={{color:C.err,fontSize:11,margin:"4px 0 0"}}>{errors.name}</p>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>CRM</label>
                <input value={form.crm} onChange={e=>up("crm",e.target.value)} placeholder="Ex: 12345-RJ" style={baseInput}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Status *</label>
                <select value={form.status} onChange={e=>up("status",e.target.value)} style={{...baseInput,appearance:"auto"}}>
                  <option value="">Selecione</option>
                  {DOCTOR_STATUS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Especialização *</label>
              <select value={form.specialty} onChange={e=>up("specialty",e.target.value)} style={{...baseInput,appearance:"auto"}}>
                <option value="">Selecione</option>
                {SPECIALTIES.map(s=><option key={s}>{s}</option>)}
              </select>
              {errors.specialty&&<p style={{color:C.err,fontSize:11,margin:"4px 0 0"}}>{errors.specialty}</p>}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(1)} style={{flex:1,padding:"12px",border:`1.5px solid ${C.border}`,borderRadius:10,background:"#fff",color:C.text,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Voltar</button>
              <button onClick={()=>{if(validate2())setStep(3)}} style={{flex:2,padding:"12px",border:"none",borderRadius:10,background:C.pri,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Continuar</button>
            </div>
          </div>
        )}
        {step===3&&(
          <div>
            <div style={{textAlign:"center",marginBottom:18}}>
              <h2 style={{fontSize:20,fontWeight:800,color:C.text,margin:"0 0 6px"}}>Atuacao profissional</h2>
              <p style={{fontSize:13,color:C.textSec,margin:0}}>Opcional — pode editar depois</p>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Hospitais / Clinicas que atende</label>
              <textarea value={form.hospitals} onChange={e=>up("hospitals",e.target.value)} placeholder="Ex: Copa Star, Barra D'Or, Clinica Particular..." rows={2} style={{...baseInput,resize:"none",lineHeight:1.5}}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Planos que aceita</label>
              <textarea value={form.plans} onChange={e=>up("plans",e.target.value)} placeholder="Ex: Unimed, Bradesco Saude, Particular..." rows={2} style={{...baseInput,resize:"none",lineHeight:1.5}}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(2)} style={{flex:1,padding:"12px",border:`1.5px solid ${C.border}`,borderRadius:10,background:"#fff",color:C.text,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Voltar</button>
              <button onClick={()=>setStep(4)} style={{flex:2,padding:"12px",border:"none",borderRadius:10,background:C.pri,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Continuar</button>
            </div>
          </div>
        )}
        {step===4&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:56,marginBottom:12}}>&#127881;</div>
            <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 6px"}}>Tudo pronto!</h2>
            <p style={{fontSize:13,color:C.textSec,margin:"0 0 20px"}}>Bem-vindo ao Copiloto Med</p>
            <div style={{background:C.bg,borderRadius:14,border:`2px solid ${C.border}`,padding:20,marginBottom:20,textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${C.border}`}}>
                <div style={{width:56,height:56,borderRadius:12,background:C.priGhost,display:"flex",alignItems:"center",justifyContent:"center"}}><I n="user" s={26} c={C.pri}/></div>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:C.text}}>{form.name}</div>
                  <div style={{fontSize:12,color:C.textSec,marginTop:2}}>{form.specialty||"—"}{form.status&&" · "+form.status}</div>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7,fontSize:12}}>
                {form.crm&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.textSec}}>CRM</span><span style={{fontWeight:600,color:C.text}}>{form.crm}</span></div>}
                {form.hospitals&&<div style={{paddingTop:6,borderTop:`1px solid ${C.borderLight}`}}><span style={{color:C.textSec,display:"block",marginBottom:2}}>Hospitais / Clinicas:</span><span style={{fontWeight:500,color:C.text}}>{form.hospitals}</span></div>}
                {form.plans&&<div><span style={{color:C.textSec,display:"block",marginBottom:2}}>Planos aceitos:</span><span style={{fontWeight:500,color:C.text}}>{form.plans}</span></div>}
              </div>
            </div>
            <button onClick={()=>onComplete({name:form.name,crm:form.crm||"",specialty:form.specialty||"",status:form.status||"",hospitals:form.hospitals||"",plans:form.plans||""})}
              style={{width:"100%",padding:"14px",border:"none",borderRadius:12,background:C.pri,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:FONT,marginBottom:10}}>
              Ir para o Copiloto
            </button>
          </div>
        )}
        {showTermsModal&&(
          <div style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={()=>setShowTermsModal(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:"28px 24px",maxWidth:500,width:"90%",maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h3 style={{fontSize:16,fontWeight:800,color:C.text,margin:0}}>{showTermsModal==="use"?"Termos de Uso":showTermsModal==="responsibility"?"Termos de Responsabilidade":"Politica de Privacidade"}</h3>
                <button onClick={()=>setShowTermsModal(null)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><I n="x" s={18} c={C.textMuted}/></button>
              </div>
              <div style={{flex:1,overflowY:"auto",fontSize:12,color:C.textSec,lineHeight:1.8,whiteSpace:"pre-line",fontFamily:FONT}}>
                {showTermsModal==="use"?MOCK_TERMS_USE:showTermsModal==="responsibility"?MOCK_TERMS_RESPONSIBILITY:MOCK_PRIVACY_POLICY}
              </div>
              <button onClick={()=>setShowTermsModal(null)} style={{marginTop:16,width:"100%",padding:"11px",border:"none",borderRadius:10,background:C.pri,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Entendi</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// ─── HIGHLIGHT DEBUG PANEL ───
const HighlightDebugPanel = ({highlight, scale, currentPage}) => {
  const [copied, setCopied] = useState(false);
  const copyCode = () => {
    const code = `{\n  page: ${currentPage},\n  highlight: { x: ${Math.round(highlight.x)}, y: ${Math.round(highlight.y)}, width: ${Math.round(highlight.width)}, height: ${Math.round(highlight.height)} }\n}`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(()=>setCopied(false),2000);
  };
  return (
    <div style={{position:"fixed",top:20,right:20,background:"rgba(0,0,0,.92)",color:"#00ff00",padding:16,borderRadius:8,fontFamily:"monospace",fontSize:11,zIndex:10000,border:"2px solid #00ff00",minWidth:220}}>
      <div style={{fontWeight:"bold",marginBottom:8,color:"#FF8A65"}}>DEBUG PANEL</div>
      <div>Page: <span style={{color:"#fff"}}>{currentPage}</span></div>
      <div>Scale: <span style={{color:"#fff"}}>{(scale*100).toFixed(0)}%</span></div>
      {highlight&&<>
        <div style={{marginTop:10,marginBottom:4,color:"#FF8A65",fontWeight:"bold"}}>Highlight:</div>
        <div>  x: <span style={{color:"#fff"}}>{Math.round(highlight.x)}</span></div>
        <div>  y: <span style={{color:"#fff"}}>{Math.round(highlight.y)}</span></div>
        <div>  w: <span style={{color:"#fff"}}>{Math.round(highlight.width)}</span></div>
        <div>  h: <span style={{color:"#fff"}}>{Math.round(highlight.height)}</span></div>
        <button onClick={copyCode} style={{marginTop:10,padding:"6px 10px",background:copied?"#6A9E4A":"#FF8A65",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:"bold",width:"100%"}}>
          {copied?"Copiado!":"Copiar Codigo"}
        </button>
      </>}
    </div>
  );
};

// ─── PDF VIEWER ───
const PDFViewer = ({pdfPath, pageNumber, highlight, onClose}) => {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(pageNumber||1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rendering, setRendering] = useState(false);
  const canvasRef = useRef(null);
  const [tempHighlight, setTempHighlight] = useState(null);

  useEffect(()=>{ if(highlight) setTempHighlight(highlight); },[highlight]);

  useEffect(()=>{
    if(!tempHighlight||!DEBUG_MODE) return;
    const handleKey = (e) => {
      if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const step = e.shiftKey ? 1 : 10;
      setTempHighlight(prev => {
        const h={...prev};
        if(!e.altKey){
          if(e.key==='ArrowLeft') h.x-=step;
          if(e.key==='ArrowRight') h.x+=step;
          if(e.key==='ArrowUp') h.y-=step;
          if(e.key==='ArrowDown') h.y+=step;
        } else {
          if(e.key==='ArrowLeft') h.width-=step;
          if(e.key==='ArrowRight') h.width+=step;
          if(e.key==='ArrowUp') h.height-=step;
          if(e.key==='ArrowDown') h.height+=step;
        }
        return h;
      });
    };
    window.addEventListener('keydown',handleKey);
    return ()=>window.removeEventListener('keydown',handleKey);
  },[tempHighlight]);

  const activeHighlight = DEBUG_MODE ? tempHighlight : highlight;

  useEffect(()=>{
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
      } catch(err) { console.error('Error loading PDF:',err); }
    };
    loadPdf();
  },[pdfPath]);

  useEffect(()=>{
    if(!pdf||!canvasRef.current) return;
    const renderPage = async () => {
      setRendering(true);
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({scale});
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({canvasContext:context,viewport}).promise;
      setRendering(false);
    };
    renderPage();
  },[pdf,currentPage,scale]);

  useEffect(()=>{ if(pageNumber) setCurrentPage(pageNumber); },[pageNumber]);

  return (
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:"#fff",borderLeft:`1px solid ${C.border}`}}>
      <div style={{padding:"13px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <I n="file" s={18} c={C.pri}/>
          <span style={{fontSize:14,fontWeight:600,color:C.text}}>Relatorio Medico</span>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:5,display:"flex"}}><I n="x" s={18} c={C.textMuted}/></button>
      </div>
      <div style={{padding:"10px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:C.bg}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage<=1} style={{padding:"6px 10px",border:`1px solid ${C.border}`,borderRadius:6,background:"#fff",cursor:currentPage>1?"pointer":"default",opacity:currentPage>1?1:0.5}}><I n="chevL" s={14} c={C.text}/></button>
          <span style={{fontSize:13,color:C.text,fontWeight:500}}>{currentPage} / {numPages}</span>
          <button onClick={()=>setCurrentPage(p=>Math.min(numPages,p+1))} disabled={currentPage>=numPages} style={{padding:"6px 10px",border:`1px solid ${C.border}`,borderRadius:6,background:"#fff",cursor:currentPage<numPages?"pointer":"default",opacity:currentPage<numPages?1:0.5}}><I n="chevR" s={14} c={C.text}/></button>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setScale(s=>Math.max(0.5,s-0.1))} style={{padding:"6px 12px",border:`1px solid ${C.border}`,borderRadius:6,background:"#fff",fontSize:13,cursor:"pointer"}}>-</button>
          <span style={{fontSize:13,color:C.text,minWidth:45,textAlign:"center"}}>{Math.round(scale*100)}%</span>
          <button onClick={()=>setScale(s=>Math.min(2.0,s+0.1))} style={{padding:"6px 12px",border:`1px solid ${C.border}`,borderRadius:6,background:"#fff",fontSize:13,cursor:"pointer"}}>+</button>
        </div>
      </div>
      <div style={{flex:1,overflow:"auto",background:"#525659",display:"flex",justifyContent:"center",padding:20,position:"relative"}}>
        <div style={{position:"relative"}}>
          <canvas ref={canvasRef} style={{display:"block",boxShadow:"0 2px 8px rgba(0,0,0,.3)"}}/>
          {activeHighlight&&currentPage===pageNumber&&(
            <>
              <div style={{position:"absolute",left:activeHighlight.x*scale,top:activeHighlight.y*scale,width:activeHighlight.width*scale,height:activeHighlight.height*scale,border:"3px solid #2563EB",background:"rgba(37,99,235,0.12)",pointerEvents:"none",boxShadow:"0 0 20px rgba(37,99,235,0.4)",animation:"pulse 2s ease-in-out infinite"}}/>
              <div style={{position:"absolute",left:(activeHighlight.x+activeHighlight.width+15)*scale,top:activeHighlight.y*scale,background:"rgba(0,0,0,.85)",color:"#93C5FD",padding:"10px 14px",borderRadius:8,fontSize:11,fontWeight:600,fontFamily:FONT,maxWidth:180,lineHeight:1.4,boxShadow:"0 4px 12px rgba(0,0,0,.3)",border:"1.5px solid #2563EB",pointerEvents:"none"}}>
                Versao de testes para validacao de conceito
              </div>
            </>
          )}
          {DEBUG_MODE&&activeHighlight&&currentPage===pageNumber&&<HighlightDebugPanel highlight={activeHighlight} scale={scale} currentPage={currentPage}/>}
        </div>
        {rendering&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}><div style={{color:"#fff",fontSize:13}}>Carregando...</div></div>}
      </div>
    </div>
  );
};

// ─── CHAT SCREEN ───
const ChatScreen = ({profiles, showOnboarding, onCompleteOnboarding, onSkipOnboarding, consultations, activeConsultationId, onSaveConsultation, onNewConsultation}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [consultationMode, setConsultationMode] = useState(false);
  const [consultationStep, setConsultationStep] = useState(0);
  const [hoveredRef, setHoveredRef] = useState(null);
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfReference, setPdfReference] = useState(null);
  const chatEnd = useRef(null);

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"})},[messages,typing]);

  useEffect(()=>{
    if(activeConsultationId){
      const c = consultations?.find(c=>c.id===activeConsultationId);
      if(c){setMessages(c.messages);setConsultationMode(false);setConsultationStep(0);}
    } else {
      setMessages([]);setConsultationMode(false);setConsultationStep(0);
    }
  },[activeConsultationId,consultations]);

  useEffect(()=>{
    if(messages.length>0&&!typing&&!activeConsultationId&&!consultationMode){
      const t=setTimeout(()=>onSaveConsultation?.(messages),2000);
      return ()=>clearTimeout(t);
    }
  },[messages.length,typing,activeConsultationId,consultationMode,onSaveConsultation]);

  const parseMarkdown = (text) => {
    const isAlert = text.trim().startsWith('&#x26A0;')||text.trim().startsWith('⚠')||text.trim().includes('URGENTE');
    const lines = text.split('\n');
    const processed = lines.map((line,idx)=>{
      const isBullet = line.trim().startsWith('•')||line.trim().startsWith('✅');
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part,i)=>{
        if(part.startsWith('**')&&part.endsWith('**')) return <strong key={`${idx}-${i}`}>{part.slice(2,-2)}</strong>;
        return part;
      });
      if(isBullet) return <div key={idx} style={{marginLeft:16,marginTop:4,marginBottom:4}}>{parts}</div>;
      return <span key={idx}>{parts}{idx<lines.length-1&&<br/>}</span>;
    });
    if(isAlert) return <div style={{background:"linear-gradient(to right, #FEE2E2, transparent)",borderLeft:"3px solid #DC2626",paddingLeft:12,marginLeft:-12,marginRight:-12,paddingTop:8,paddingBottom:8,borderRadius:6}}>{processed}</div>;
    return processed;
  };

  const send = () => {
    if(!input.trim()) return;
    const startingConsultation = input.toLowerCase().includes("quando foi")&&input.toLowerCase().includes("consulta");
    if(startingConsultation&&!consultationMode){
      setConsultationMode(true);setConsultationStep(0);
      setMessages(p=>[...p,{role:"user",text:input,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}]);
      setInput("");setTyping(true);
      setTimeout(()=>{
        setMessages(p=>[...p,{role:"bot",text:CONSULTATION_FLOW[0].response.text,refs:CONSULTATION_FLOW[0].response.refs,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}]);
        setConsultationStep(1);setTyping(false);
      },1600);
      return;
    }
    if(consultationMode&&consultationStep<CONSULTATION_FLOW.length){
      setMessages(p=>[...p,{role:"user",text:input,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}]);
      setInput("");setTyping(true);
      setTimeout(()=>{
        const cf = CONSULTATION_FLOW[consultationStep];
        setMessages(p=>[...p,{role:"bot",text:cf.response.text,refs:cf.response.refs,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}]);
        const next=consultationStep+1;
        setConsultationStep(next);
        if(next>=CONSULTATION_FLOW.length){setConsultationMode(false);setConsultationStep(0);}
        setTyping(false);
      },1600);
      return;
    }
    setMessages(p=>[...p,{role:"user",text:input,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}]);
    const q=input.toLowerCase();
    setInput("");setTyping(true);
    setTimeout(()=>{
      let r;
      if(q.includes("registrar")||q.includes("novo atendimento")||q.includes("anotar")) r=CHAT_RESPONSES.registro;
      else if(q.includes("resumo")||q.includes("ultimo atendimento")||q.includes("maria")) r=CHAT_RESPONSES.resumo;
      else if(q.includes("paciente")||q.includes("historico")||q.includes("lista")) r=CHAT_RESPONSES.pacientes;
      else if(q.includes("dor")||q.includes("conduta")||q.includes("protocolo")||q.includes("orientacao")) r=CHAT_RESPONSES.conduta;
      else r=CHAT_RESPONSES.default;
      setMessages(p=>[...p,{role:"bot",text:r.text,refs:r.refs,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}]);
      setTyping(false);
    },1600);
  };

  const suggestions = consultationMode&&consultationStep>0&&consultationStep<CONSULTATION_FLOW.length
    ? [CONSULTATION_FLOW[consultationStep].question]
    : profiles.length>0&&messages.length===0
      ? ["📋 Quero registrar um atendimento","👥 Ver pacientes recentes","🩺 Orientação clínica — dor torácica"]
      : ["O que voce pode fazer?","Como registrar um atendimento?"];

  return (
    <div style={{flex:1,display:"flex",flexDirection:"row",background:C.bgEmotional,fontFamily:FONT}}>
      <div style={{flex:pdfViewerOpen?1:"auto",width:pdfViewerOpen?"50%":"100%",display:"flex",flexDirection:"column",transition:"width .3s ease"}}>
        {showOnboarding&&<OnboardingModal onComplete={onCompleteOnboarding} onSkip={onSkipOnboarding}/>}
        <div style={{padding:"13px 28px",background:"#fff",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <ChatAvatar size={34}/>
            <div>
              <span style={{fontSize:15,fontWeight:700,color:C.pri,display:"block"}}>Copiloto Med</span>
              <span style={{fontSize:12,color:C.priDark}}>Online - Pronto para ajudar</span>
            </div>
            {activeConsultationId&&<span style={{fontSize:11,color:C.pri,background:C.priLight,padding:"3px 8px",borderRadius:6,marginLeft:6}}>Historico</span>}
          </div>
          {activeConsultationId&&(
            <Btn onClick={()=>{onNewConsultation?.();setMessages([]);setConsultationMode(false);setConsultationStep(0);}} icon={<I n="plus" s={14} c="#fff"/>}>Nova Consulta</Btn>
          )}
        </div>
        <div style={{flex:1,overflow:"auto",padding:"28px 28px 0"}}>
          {messages.length===0&&(
            <div style={{textAlign:"center",marginTop:60}}>
              <h2 style={{fontSize:24,fontWeight:800,color:C.text,margin:"0 0 6px"}}>Como posso ajudar?</h2>
              <p style={{color:C.textSec,fontSize:13,margin:"0 0 28px"}}>Pergunte sobre suas consultas, exames, vacinas ou medicacoes</p>
              <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                {suggestions.map((s,i)=>{
                  const isHov = hoveredSuggestion===i;
                  return (
                    <button key={i} onMouseEnter={()=>setHoveredSuggestion(i)} onMouseLeave={()=>setHoveredSuggestion(null)}
                      onClick={()=>setInput(s.replace("?","").replace("🩺 ","").replace("📋 ","").replace("💊 ",""))}
                      style={{padding:"9px 16px",borderRadius:20,border:`1.5px solid ${isHov?C.pri:C.border}`,background:isHov?C.priGhost:"#fff",fontSize:12,color:isHov?C.pri:C.text,cursor:"pointer",fontFamily:FONT,fontWeight:isHov?600:500,transition:"all .2s ease",transform:isHov?"scale(1.02)":"scale(1)"}}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {messages.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:18,gap:10,alignItems:"flex-start"}}>
              {m.role==="bot"&&<ChatAvatar size={34}/>}
              <div style={{maxWidth:"80%"}}>
                <div style={{padding:"12px 16px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?C.chatUser:C.chatBot,color:m.role==="user"?"#fff":C.text,fontSize:14,fontWeight:500,lineHeight:1.5,whiteSpace:"pre-wrap",boxShadow:m.role==="bot"?"0 1px 3px rgba(15,23,42,0.08)":"none"}}>
                  {parseMarkdown(m.text)}
                </div>
                {m.role==="bot"&&m.text&&(m.text.includes("URGENTE")||m.text.includes("emergencia")||m.text.includes("SAMU"))&&profiles[0]&&(
                  <div style={{marginTop:8,padding:"10px 14px",background:C.errBg,borderRadius:10,border:`1.5px solid ${C.err}30`,display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18}}>&#128222;</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:800,color:C.err,marginBottom:2}}>Emergencia Medica</div>
                      <div style={{fontSize:13,fontWeight:800,color:C.err}}>SAMU: 192</div>
                      {profiles[0].doctorName&&<div style={{fontSize:11,color:C.text,fontWeight:600}}>{profiles[0].doctorName}</div>}
                      {profiles[0].doctorClinic&&<div style={{fontSize:10,color:C.textSec}}>{profiles[0].doctorClinic}</div>}
                    </div>
                  </div>
                )}
                {m.role==="bot"&&m.text&&(m.text.includes("sintoma")||m.text.includes("diagnostico")||m.text.includes("medicacao")||m.text.includes("dor")||m.text.includes("febre"))&&!m.dismissed&&(
                  <div style={{marginTop:8,padding:"10px 14px",background:C.warnBg,borderRadius:10,border:`1px solid ${C.warn}30`,display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:14}}>✨</span>
                    <span style={{fontSize:11,color:C.text,flex:1,fontWeight:500}}>Novo dado clinico detectado. Adicionar ao resumo?</span>
                    <button onClick={()=>setMessages(p=>p.map((msg,mi)=>mi===i?{...msg,dismissed:true}:msg))} style={{padding:"5px 12px",borderRadius:8,border:"none",background:C.pri,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Adicionar</button>
                    <button onClick={()=>setMessages(p=>p.map((msg,mi)=>mi===i?{...msg,dismissed:true}:msg))} style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.textMuted,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Ignorar</button>
                  </div>
                )}
                {m.refs?.length>0&&(
                  <div style={{marginTop:8}}>
                    <div style={{fontSize:9,fontWeight:700,color:C.textMuted,letterSpacing:".5px",textTransform:"uppercase",marginBottom:5}}>Fontes consultadas</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {m.refs.map((r,j)=>{
                        const refId=`${i}-${j}`;
                        const isHov=hoveredRef===refId;
                        const refData=PDF_REFERENCES[r];
                        return (
                          <div key={j} style={{position:"relative"}}>
                            <button
                              onClick={()=>{if(refData){setPdfReference(refData);setPdfViewerOpen(true);}}}
                              onMouseEnter={()=>setHoveredRef(refId)} onMouseLeave={()=>setHoveredRef(null)}
                              style={{padding:"5px 12px",borderRadius:14,border:`1.5px solid ${isHov?C.pri:C.border}`,background:isHov?C.priLight:"#fff",fontSize:11,color:C.pri,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:FONT,fontWeight:600,transition:"all .2s ease",transform:isHov?"translateY(-1px)":"none",boxShadow:isHov?`0 4px 8px ${C.pri}20`:"none"}}>
                              <I n="link" s={11} c={C.pri}/>{r}
                            </button>
                            {isHov&&refData&&<div style={{position:"absolute",bottom:"100%",left:0,padding:"6px 10px",background:C.navy,color:"#fff",borderRadius:6,fontSize:9,whiteSpace:"nowrap",marginBottom:4,zIndex:10,fontFamily:FONT,fontWeight:500}}>Pagina {refData.page} - Clique para abrir</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div style={{fontSize:10,color:C.textMuted,marginTop:3,textAlign:m.role==="user"?"right":"left"}}>{m.time}</div>
              </div>
            </div>
          ))}
          {typing&&<div style={{display:"flex",marginBottom:18,gap:10,alignItems:"flex-start"}}>
            <ChatAvatar size={34}/>
            <div style={{padding:"12px 16px",borderRadius:"16px 16px 16px 4px",background:C.chatBot,fontSize:14,color:C.textSec,boxShadow:"0 1px 3px rgba(15,23,42,.08)"}}>
              <span style={{animation:"blink 1.2s infinite"}}>●</span>{" "}<span style={{animation:"blink 1.2s infinite .15s"}}>●</span>{" "}<span style={{animation:"blink 1.2s infinite .3s"}}>●</span>
            </div>
          </div>}
          <div ref={chatEnd}/>
        </div>
        <div style={{padding:"14px 20px",background:"#fff",borderTop:`1px solid ${C.muted}`,position:"relative"}}>
          {consultationMode&&<div style={{position:"absolute",top:-28,left:20,padding:"4px 10px",background:C.priLight,color:C.pri,fontSize:11,fontWeight:600,borderRadius:6}}>Modo Consulta ({consultationStep+1}/4)</div>}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
              placeholder="Envie sua mensagem" style={{flex:1,border:`2px solid ${C.muted}`,background:C.bg,borderRadius:999,padding:"10px 16px",outline:"none",fontSize:14,fontFamily:FONT,fontWeight:500,color:C.text,transition:"all .2s"}}/>
            <button onClick={send} style={{width:40,height:40,borderRadius:"50%",border:"none",background:input.trim()?C.pri:C.muted,cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
              <I n="send" s={16} c="#fff"/>
            </button>
          </div>
          <p style={{textAlign:"center",fontSize:10,color:C.textMuted,margin:"8px 0 0"}}>
            O Copiloto Med nao substitui o Medico. Em emergencias, ligue 192 (SAMU).
          </p>
        </div>
      </div>
      {pdfViewerOpen&&(
        <div style={{width:"50%",height:"100vh",display:"flex"}}>
          <PDFViewer pdfPath="relatorio-maria.pdf" pageNumber={pdfReference?.page} highlight={pdfReference?.highlight} onClose={()=>{setPdfViewerOpen(false);setPdfReference(null);}}/>
        </div>
      )}
    </div>
  );
};

// ─── HISTORICO DE ATENDIMENTOS ───
const MeuHistoricoScreen = ({profiles, onAddProfile, onRemoveProfile}) => {
  const [expanded, setExpanded] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const statusMeta = (s) => {
    if(s==="em_acompanhamento") return {label:"Em acompanhamento",color:C.warn,bg:C.warnBg};
    if(s==="encaminhado") return {label:"Encaminhado",color:C.pri,bg:C.priLight};
    return {label:"Concluído",color:C.ok,bg:C.okBg};
  };
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:C.bgClinical,fontFamily:FONT}}>
      {toast&&<Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      {confirm&&<ConfirmModal title="Remover Atendimento" message={`Remover o atendimento de ${confirm.name}?`} danger onConfirm={()=>{onRemoveProfile(confirm.idx);setConfirm(null);setToast({msg:"Atendimento removido",type:"success"})}} onCancel={()=>setConfirm(null)}/>}
      <div style={{padding:"13px 28px",borderBottom:`1px solid ${C.border}`,background:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><I n="card" s={18} c={C.pri}/><span style={{fontSize:15,fontWeight:700,color:C.text}}>Histórico de Atendimentos</span></div>
        <Btn onClick={onAddProfile} icon={<I n="plus" s={14} c="#fff"/>}>Novo Atendimento</Btn>
      </div>
      <div style={{flex:1,overflow:"auto",padding:28}}>
        {profiles.length===0?(
          <div style={{textAlign:"center",marginTop:70}}>
            <h3 style={{fontSize:17,fontWeight:700,color:C.text,margin:"0 0 6px"}}>Nenhum atendimento registrado</h3>
            <p style={{color:C.textSec,fontSize:13,margin:"0 0 22px"}}>Registre um novo atendimento para começar</p>
            <Btn onClick={onAddProfile} icon={<I n="plus" s={15} c="#fff"/>}>Novo Atendimento</Btn>
          </div>
        ):(
          <div style={{maxWidth:700,margin:"0 auto"}}>
            {profiles.map((profile,idx)=>{
              const st=statusMeta(profile.status);
              return (
                <div key={idx} style={{marginBottom:10}}>
                  <button onClick={()=>setExpanded(expanded===idx?null:idx)}
                    style={{width:"100%",padding:"14px 18px",borderRadius:expanded===idx?"14px 14px 0 0":"14px",border:`1.5px solid ${C.border}`,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:FONT,textAlign:"left"}}>
                    <div style={{width:42,height:42,borderRadius:10,background:C.priGhost,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:C.pri,flexShrink:0}}>
                      {profile.name?.[0]||"P"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.text}}>{profile.name}</div>
                      <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>{profile.age&&profile.age+" anos"}{profile.sex&&" · "+profile.sex}{profile.date&&" · "+profile.date}{profile.chiefComplaint&&" — "+profile.chiefComplaint}</div>
                    </div>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:st.bg,color:st.color,flexShrink:0,whiteSpace:"nowrap"}}>{st.label}</span>
                    <I n={expanded===idx?"chevU":"chevD"} s={16} c={C.textMuted}/>
                  </button>
                  {expanded===idx&&(
                    <div style={{border:`1.5px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 14px 14px",background:"#fff",padding:22}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                        {profile.chiefComplaint&&<div><div style={{fontSize:9,fontWeight:800,color:C.textMuted,letterSpacing:.8,marginBottom:4}}>QUEIXA PRINCIPAL</div><div style={{fontSize:13,color:C.text,fontWeight:500}}>{profile.chiefComplaint}</div></div>}
                        {profile.date&&<div><div style={{fontSize:9,fontWeight:800,color:C.textMuted,letterSpacing:.8,marginBottom:4}}>DATA</div><div style={{fontSize:13,color:C.text,fontWeight:500}}>{profile.date}{profile.time&&" · "+profile.time}</div></div>}
                      </div>
                      {profile.diagnosis&&(
                        <div style={{marginBottom:12,padding:"10px 14px",background:"#FFF7F7",borderRadius:8,border:`1px solid ${C.err}15`}}>
                          <div style={{fontSize:9,fontWeight:800,color:C.err,letterSpacing:.8,marginBottom:4}}>DIAGNÓSTICO</div>
                          <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{profile.diagnosis}</div>
                        </div>
                      )}
                      {profile.plan&&(
                        <div style={{marginBottom:12,padding:"10px 14px",background:C.okBg,borderRadius:8,border:`1px solid ${C.ok}20`}}>
                          <div style={{fontSize:9,fontWeight:800,color:C.ok,letterSpacing:.8,marginBottom:4}}>CONDUTA</div>
                          <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{profile.plan}</div>
                        </div>
                      )}
                      {profile.summary&&(
                        <div style={{background:C.bg,borderRadius:10,padding:14,marginBottom:14,border:`1px solid ${C.border}`}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                            <I n="sparkle" s={13} c={C.pri}/>
                            <span style={{fontSize:9,fontWeight:800,color:C.textMuted,letterSpacing:".5px",textTransform:"uppercase"}}>Resumo Clínico</span>
                          </div>
                          <p style={{fontSize:12,color:C.textSec,lineHeight:1.7,margin:0}}>{profile.summary}</p>
                        </div>
                      )}
                      <div style={{display:"flex",gap:8,justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",gap:8}}>
                          <Btn variant="ghost" onClick={()=>setToast({msg:"Resumo copiado!",type:"success"})} icon={<I n="share" s={13}/>} style={{fontSize:11,padding:"7px 14px"}}>Compartilhar</Btn>
                          <Btn variant="ghost" onClick={()=>setToast({msg:"Download iniciado!",type:"success"})} icon={<I n="download" s={13}/>} style={{fontSize:11,padding:"7px 14px"}}>Baixar</Btn>
                        </div>
                        <Btn variant="danger" onClick={()=>setConfirm({name:profile.name,idx})} icon={<I n="trash" s={14} c={C.err}/>} style={{fontSize:11,padding:"7px 14px"}}>Remover</Btn>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── UPLOAD MODAL ───
const UploadModal = ({profiles, onClose, onConfirm}) => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [uploadError, setUploadError] = useState(null);

  const handleFileSelect = e => {
    const newFiles = Array.from(e.target.files);
    const oversized = newFiles.filter(f=>f.size>MAX_FILE_SIZE);
    if(oversized.length>0){setUploadError(`Arquivo "${oversized[0].name}" excede o limite de 10MB.`);return}
    setUploadError(null);setFiles(newFiles);setProcessing(true);
    setTimeout(()=>{
      const mockOCR=newFiles.map(f=>{
        const name=f.name.toLowerCase();
        let type="Documento Medico",description="Documento clinico";
        const date=new Date().toLocaleDateString("pt-BR");
        if(name.includes("prontuario")||name.includes("consulta")){type="Prontuario de Consulta";description=`Consulta medica realizada em ${date}.`;}
        else if(name.includes("exame")||name.includes("resultado")){type="Exame Laboratorial";description=`Resultado de exames realizados em ${date}.`;}
        else if(name.includes("receita")||name.includes("prescricao")){type="Receita Medica";description="Prescricao de medicamentos com dosagem.";}
        else if(name.includes("vacina")){type="Carteira de Vacinacao";description="Registro de vacinacoes.";}
        else if(name.includes("raio")||name.includes("rx")||name.includes("imagem")){type="Exame de Imagem";description="Exame de imagem (raio-x, ultrassom, etc.).";}
        return {id:Date.now()+Math.random(),originalFile:f,name:f.name,size:(f.size/1024).toFixed(1)+"KB",type,description,detectedDate:date,confidence:Math.floor(Math.random()*4)+96};
      });
      setProcessed(mockOCR);setProcessing(false);
    },2000);
  };

  const confirm = () => {
    if(!selectedProfile){alert("Selecione um perfil");return}
    onConfirm(selectedProfile,processed);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,backdropFilter:"blur(6px)",padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,maxWidth:600,width:"100%",maxHeight:"90vh",overflow:"auto",boxShadow:"0 24px 60px rgba(0,0,0,.3)"}}>
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:"#fff",borderRadius:"20px 20px 0 0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><I n="clip" s={20} c={C.pri}/><h2 style={{fontSize:18,fontWeight:800,color:C.text,margin:0}}>Adicionar Documentos</h2></div>
            <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:24,color:C.textMuted,lineHeight:1,padding:4}}>x</button>
          </div>
        </div>
        <div style={{padding:24}}>
          {processed.length===0?(
            <>
              <label htmlFor="file-upload-modal" style={{display:"block",cursor:"pointer"}}>
                <div style={{border:`3px dashed ${C.border}`,borderRadius:14,padding:"40px 20px",textAlign:"center",background:C.bg,transition:"all .2s"}}>
                  {processing?<><div style={{width:40,height:40,border:`4px solid ${C.border}`,borderTopColor:C.pri,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/><p style={{fontSize:14,fontWeight:700,color:C.text,margin:"0 0 4px"}}>Processando documentos...</p><p style={{fontSize:12,color:C.textSec,margin:0}}>Analisando com IA</p></>:<><I n="clip" s={40} c={C.pri}/><p style={{fontSize:15,fontWeight:700,color:C.text,margin:"12px 0 4px"}}>Selecione os documentos</p><p style={{fontSize:12,color:C.textSec,margin:"0 0 16px"}}>PDF, imagens ou outros arquivos medicos</p><div style={{display:"inline-block",padding:"10px 24px",background:C.pri,color:"#fff",borderRadius:10,fontSize:13,fontWeight:600}}>Escolher Arquivos</div></>}
                </div>
              </label>
              <input id="file-upload-modal" type="file" multiple accept=".pdf,image/*,.doc,.docx" onChange={handleFileSelect} style={{display:"none"}}/>
              {uploadError&&<div style={{marginTop:14,padding:"12px 16px",background:C.errBg,borderRadius:10,border:`1px solid ${C.err}30`,display:"flex",alignItems:"start",gap:10}}><I n="alert" s={16} c={C.err}/><div style={{fontSize:12,color:C.err,fontWeight:600,lineHeight:1.5}}>{uploadError}</div></div>}
            </>
          ):(
            <>
              <div style={{marginBottom:20}}>
                <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:8}}>Selecione o perfil *</label>
                <select value={selectedProfile} onChange={e=>setSelectedProfile(e.target.value)} style={{...baseInput,appearance:"auto"}}>
                  <option value="">Escolha um perfil</option>
                  {profiles.map((p,i)=><option key={i} value={i}>{p.name}</option>)}
                </select>
              </div>
              <div style={{background:C.priGhost,borderRadius:12,padding:16,marginBottom:20,border:`1px solid ${C.pri}30`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><I n="sparkle" s={16} c={C.pri}/><span style={{fontSize:11,fontWeight:800,color:C.pri,letterSpacing:".5px",textTransform:"uppercase"}}>Documentos Processados ({processed.length})</span></div>
                {processed.map(doc=>(
                  <div key={doc.id} style={{background:"#fff",borderRadius:10,padding:14,marginBottom:10,border:`1px solid ${C.border}`}}>
                    <div style={{display:"flex",alignItems:"start",gap:10,marginBottom:8}}>
                      <div style={{width:36,height:36,borderRadius:8,background:C.priLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n="file" s={18} c={C.pri}/></div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>{doc.type}</div>
                        <div style={{fontSize:11,color:C.textSec,marginBottom:4,lineHeight:1.4}}>{doc.description}</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",fontSize:10}}>
                          <span style={{color:C.textMuted}}>{doc.name}</span>
                          <span style={{padding:"2px 6px",background:C.okBg,color:C.ok,borderRadius:4,fontWeight:600}}>{doc.confidence}% confianca</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:10}}>
                <Btn variant="ghost" onClick={()=>{setFiles([]);setProcessed([])}} style={{flex:1}}>Escolher Outros</Btn>
                <Btn onClick={confirm} style={{flex:2}} icon={<I n="check" s={15} c="#fff"/>}>Confirmar e Adicionar</Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── RESUMO CLINICO (removed — integrated in Historico) ───

// ─── NOVO ATENDIMENTO ───
const NovAtendimento = ({onComplete, onCancel}) => {
  const [step,setStep]=useState(1);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({
    name:"",age:"",sex:"",date:new Date().toISOString().split("T")[0],
    chiefComplaint:"",diagnosis:"",plan:"",status:"concluido",summary:""
  });
  const [errors,setErrors]=useState({});
  const up=(k,v)=>{setForm(p=>({...p,[k]:v}));setErrors(p=>({...p,[k]:undefined}))};
  const validate1=()=>{
    const e={};
    if(!form.name.trim())e.name="Nome é obrigatório";
    if(!form.chiefComplaint.trim())e.chiefComplaint="Queixa principal é obrigatória";
    if(Object.keys(e).length){setErrors(e);return false}
    return true;
  };
  const save=()=>{
    setSaving(true);
    setTimeout(()=>{
      const dateStr=form.date?new Date(form.date+"T12:00").toLocaleDateString("pt-BR"):new Date().toLocaleDateString("pt-BR");
      onComplete({
        name:form.name,age:form.age,sex:form.sex||"Não informado",
        date:dateStr,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),
        chiefComplaint:form.chiefComplaint,diagnosis:form.diagnosis,plan:form.plan,
        status:form.status,
        summary:form.summary||(form.name+(form.age?" ("+form.age+" anos)":"")+" — "+form.chiefComplaint+(form.diagnosis?". Diagnóstico: "+form.diagnosis:"")+(form.plan?". Conduta: "+form.plan:""))
      });
    },900);
  };
  const iStyle=f=>({...baseInput,borderColor:errors[f]?C.err:C.border});
  if(saving)return(<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,fontFamily:FONT}}><div style={{textAlign:"center"}}><div style={{width:48,height:48,border:`3px solid ${C.border}`,borderTopColor:C.pri,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/><p style={{fontSize:15,fontWeight:700,color:C.text}}>Salvando atendimento...</p></div></div>);
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:C.bg,fontFamily:FONT}}>
      <div style={{padding:"13px 28px",borderBottom:`1px solid ${C.border}`,background:"#fff",display:"flex",alignItems:"center",gap:14}}>
        <button onClick={step>1?()=>setStep(s=>s-1):onCancel} style={{background:"none",border:"none",cursor:"pointer",padding:3,display:"flex"}}><I n="arrowL" s={18} c={C.textSec}/></button>
        <span style={{fontSize:15,fontWeight:700,color:C.text}}>Novo Atendimento</span>
      </div>
      <div style={{padding:"16px 28px 0",background:"#fff"}}>
        <div style={{display:"flex",gap:6}}>{[1,2].map(s=>(<div key={s} style={{flex:1,height:3,borderRadius:2,background:s<=step?C.pri:C.border,transition:"all .3s"}}/>))}</div>
        <p style={{fontSize:12,color:C.textSec,margin:"6px 0 0"}}>Passo {step} de 2 — {step===1?"Identificação do paciente":"Dados clínicos"}</p>
      </div>
      <div style={{flex:1,overflow:"auto",padding:"20px 28px",display:"flex",justifyContent:"center"}}>
        <div style={{maxWidth:480,width:"100%"}}>
          {step===1&&<>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Nome do paciente *</label>
              <input value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Ex: Maria Silva" style={iStyle("name")}/>
              {errors.name&&<p style={{color:C.err,fontSize:11,margin:"4px 0 0"}}>{errors.name}</p>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Idade</label><input type="number" min="0" max="130" value={form.age} onChange={e=>up("age",e.target.value)} placeholder="Ex: 40" style={baseInput}/></div>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Sexo</label><select value={form.sex} onChange={e=>up("sex",e.target.value)} style={{...baseInput,appearance:"auto"}}><option value="">—</option><option>Masculino</option><option>Feminino</option><option>Outro</option></select></div>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Data</label><input type="date" value={form.date} onChange={e=>up("date",e.target.value)} style={baseInput}/></div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Queixa principal *</label>
              <input value={form.chiefComplaint} onChange={e=>up("chiefComplaint",e.target.value)} placeholder="Ex: Dor torácica, Check-up anual..." style={iStyle("chiefComplaint")}/>
              {errors.chiefComplaint&&<p style={{color:C.err,fontSize:11,margin:"4px 0 0"}}>{errors.chiefComplaint}</p>}
            </div>
            <div style={{marginTop:22,display:"flex",gap:10}}>
              <Btn variant="ghost" onClick={onCancel} style={{flex:1}}>Cancelar</Btn>
              <Btn onClick={()=>{if(validate1())setStep(2)}} style={{flex:2}}>Continuar</Btn>
            </div>
          </>}
          {step===2&&<>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Diagnóstico</label>
              <textarea value={form.diagnosis} onChange={e=>up("diagnosis",e.target.value)} placeholder="Ex: Hipertensão arterial sistêmica. DM2." rows={2} style={{...baseInput,resize:"vertical",minHeight:70,lineHeight:1.5}}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Conduta</label>
              <textarea value={form.plan} onChange={e=>up("plan",e.target.value)} placeholder="Ex: Ajuste de medicação. Exames solicitados." rows={2} style={{...baseInput,resize:"vertical",minHeight:70,lineHeight:1.5}}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Resumo clínico <span style={{fontWeight:400,color:C.textMuted}}>(opcional)</span></label>
              <textarea value={form.summary} onChange={e=>up("summary",e.target.value)} placeholder="Notas adicionais, evolução, observações..." rows={3} style={{...baseInput,resize:"vertical",minHeight:80,lineHeight:1.5}}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:8}}>Status do atendimento</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[{v:"concluido",l:"Concluído"},{v:"em_acompanhamento",l:"Em acompanhamento"},{v:"encaminhado",l:"Encaminhado"}].map(opt=>(
                  <button key={opt.v} onClick={()=>up("status",opt.v)}
                    style={{padding:"7px 16px",borderRadius:20,border:`1.5px solid ${form.status===opt.v?C.pri:C.border}`,background:form.status===opt.v?C.priGhost:"#fff",color:form.status===opt.v?C.pri:C.textSec,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT,transition:"all .2s"}}>
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="ghost" onClick={()=>setStep(1)} style={{flex:1}}>Voltar</Btn>
              <Btn onClick={save} style={{flex:2,background:C.ok,boxShadow:`0 4px 12px ${C.ok}30`}} icon={<I n="check" s={15} c="#fff"/>}>Salvar Atendimento</Btn>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ───
export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [email, setEmail] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("chat");
  const [profiles, setProfiles] = useState(MOCK_CONSULTATIONS);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [toast, setToast] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [activeConsultationId, setActiveConsultationId] = useState(null);
  const [fontSize, setFontSize] = useState("M");
  const fs = (base) => Math.round(base * FONT_SCALE[fontSize]);

  const handleNav = id => { setActiveNav(id); setRegistering(false); };

  const handleUploadConfirm = (profileIdx, documents) => {
    setProfiles(p=>p.map((profile,i)=>{
      if(i===parseInt(profileIdx)) return {...profile,documents:[...(profile.documents||[]),...documents]};
      return profile;
    }));
    setShowUploadModal(false);
    setToast({msg:`${documents.length} documento(s) adicionado(s)!`,type:"success"});
  };

  const handleNewConsultation = () => { setActiveConsultationId(null); setActiveNav("chat"); };
  const handleSelectConsultation = (id) => { setActiveConsultationId(id); setActiveNav("chat"); };

  const handleSaveConsultation = (messages) => {
    if(messages.length===0) return;
    if(activeConsultationId){
      setConsultations(p=>p.map(c=>c.id===activeConsultationId?{...c,messages,date:new Date().toLocaleDateString("pt-BR"),time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}:c));
    } else {
      const nc={id:Date.now(),title:messages[0]?.text?.substring(0,40)+(messages[0]?.text?.length>40?"...":""),date:new Date().toLocaleDateString("pt-BR"),time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),messages};
      setConsultations(p=>[nc,...p]);
      setActiveConsultationId(nc.id);
    }
  };

  if(screen==="welcome") return <WelcomeScreen onEnterEmail={()=>setScreen("email")}/>;
  if(screen==="email") return <EmailScreen onBack={()=>setScreen("welcome")} onSendCode={e=>{setEmail(e);setScreen("code")}}/>;
  if(screen==="code") return <CodeScreen email={email} onBack={()=>setScreen("email")} onVerify={()=>setScreen("app")}/>;

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:FONT,overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:${FONT};background:#F8FAFC;color:${C.text}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}
        @keyframes toastIn{from{transform:translateY(-20px) scale(.95);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)}50%{box-shadow:0 0 0 6px rgba(37,99,235,0)}}
        input:focus,select:focus{border-color:${C.pri} !important;box-shadow:0 0 0 3px rgba(37,99,235,0.18) !important}
        input::placeholder{color:#BBBBBB}
        button{transition:all .15s ease}
        button:hover{filter:brightness(.97)}
        button:active{transform:scale(.98)}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        ::selection{background:${C.priLight};color:${C.pri}}
      `}</style>
      {toast&&<Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      {showUploadModal&&<UploadModal profiles={profiles} onClose={()=>setShowUploadModal(false)} onConfirm={handleUploadConfirm}/>}
      <Sidebar active={activeNav} onNavigate={handleNav} email={email}
        onLogout={()=>setScreen("welcome")} collapsed={sidebarCollapsed}
        onToggle={()=>setSidebarCollapsed(!sidebarCollapsed)}
        consultations={consultations}
        onNewConsultation={handleNewConsultation}
        onSelectConsultation={handleSelectConsultation}
        activeConsultationId={activeConsultationId}
        fontSize={fontSize} onFontSizeChange={setFontSize}
        onUpload={()=>{
          if(profiles.length===0){setToast({msg:"Crie um perfil primeiro",type:"error"});}
          else{setShowUploadModal(true);}
        }}/>
      <div style={{flex:1,display:"flex",fontSize:fs(14),overflow:"hidden"}}>
        {registering?(
          <NovAtendimento
            onCancel={()=>{setRegistering(false);setActiveNav("historico")}}
            onComplete={profile=>{setProfiles(p=>[...p,profile]);setRegistering(false);setActiveNav("historico");setToast({msg:`Atendimento de ${profile.name} registrado!`,type:"success"});}}/>
        ):activeNav==="chat"?(
          <ChatScreen
            profiles={profiles}
            showOnboarding={showOnboarding}
            consultations={consultations}
            activeConsultationId={activeConsultationId}
            onSaveConsultation={handleSaveConsultation}
            onNewConsultation={handleNewConsultation}
            onCompleteOnboarding={(profile)=>{setDoctorProfile(profile);setShowOnboarding(false);setToast({msg:`Bem-vindo, ${profile.name}!`,type:"success"});}}
            onSkipOnboarding={()=>setShowOnboarding(false)}
          />
        ):activeNav==="historico"?(
          <MeuHistoricoScreen profiles={profiles} onAddProfile={()=>setRegistering(true)} onRemoveProfile={idx=>setProfiles(p=>p.filter((_,i)=>i!==idx))}/>
        ):null}
      </div>
    </div>
  );
}
