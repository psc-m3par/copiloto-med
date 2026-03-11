import { useState, useEffect, useRef } from "react";
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const DEBUG_MODE = false;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FONT = "'Quicksand', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_SCALE = { P: 0.85, M: 1.0, G: 1.2 };
const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-","Não sei"];

const MOCK_VACCINES = [
  { name: "COVID-19 (Pfizer - 4ª dose)", date: "15/03/2024", nextDate: "15/03/2025", status: "late", doctor: "Dra. Ana Beatriz" },
  { name: "Gripe (Influenza)", date: "10/04/2025", nextDate: "10/04/2026", status: "ok", doctor: "UBS Centro" },
  { name: "Hepatite B (3ª dose)", date: "20/08/2020", nextDate: "—", status: "ok", doctor: "Dr. Marcos Lima" },
  { name: "Febre Amarela", date: "05/01/2019", nextDate: "05/01/2029", status: "ok", doctor: "UBS Centro" },
  { name: "Tétano/dTpa (reforço)", date: "12/06/2018", nextDate: "12/06/2028", status: "ok", doctor: "Dr. Ricardo Oliveira" },
];

const MOCK_EXAMS = [
  { name: "Hemograma Completo", date: "20/01/2026", result: "Normal", lab: "Lab Hermes Pardini", doctor: "Dr. Ricardo Oliveira", status: "ok" },
  { name: "Glicemia de Jejum", date: "20/01/2026", result: "132 mg/dL (elevada)", lab: "Lab Hermes Pardini", doctor: "Dr. Ricardo Oliveira", status: "warn" },
  { name: "Hemoglobina Glicada (HbA1c)", date: "20/01/2026", result: "7.2% (acima do ideal)", lab: "Lab Hermes Pardini", doctor: "Dr. Ricardo Oliveira", status: "warn" },
  { name: "Colesterol Total + Frações", date: "20/01/2026", result: "LDL 145 mg/dL (elevado)", lab: "Lab Hermes Pardini", doctor: "Dr. Ricardo Oliveira", status: "warn" },
  { name: "Eletrocardiograma", date: "15/11/2025", result: "Normal", lab: "Hospital São Lucas", doctor: "Dra. Carla Mendes", status: "ok" },
];

const MOCK_SUMMARY = {
  identificacao: {
    nome: "Maria Silva", sexo: "Feminino", dataNascimento: "15/03/1985", idade: "40 anos",
    peso: "68 kg", altura: "1,65 m", imc: "25,0 (Sobrepeso limítrofe)", tipoSanguineo: "O+",
    medico: "Dr. Ricardo Oliveira", atendimento: "Hospital São Lucas — Vitória/ES"
  },
  resumoGeral: "Paciente feminina, 40 anos, com diagnóstico de hipertensão arterial sistêmica e diabetes mellitus tipo 2, ambas em tratamento medicamentoso contínuo. Apresenta alergia documentada a dipirona e penicilina. Últimos exames laboratoriais (janeiro/2026) mostram glicemia de jejum e hemoglobina glicada discretamente acima das metas, além de LDL colesterol elevado, sugerindo necessidade de ajuste terapêutico. Eletrocardiograma recente dentro da normalidade. Acompanhamento regular com clínico geral e endocrinologista.",
  antecedentes: [
    "Hipertensão arterial sistêmica — diagnóstico em 2018",
    "Diabetes mellitus tipo 2 — diagnóstico em 2020",
    "Alergia a dipirona e penicilina",
    "Apendicectomia — 2005 (cirurgia prévia)",
    "Histórico familiar: pai com IAM aos 55 anos, mãe com DM2"
  ],
  eventosImportantes: [
    { periodo: "Janeiro/2026", evento: "Check-up anual", conduta: "Exames laboratoriais completos. Identificado LDL elevado e HbA1c acima da meta", status: "Em acompanhamento" },
    { periodo: "Novembro/2025", evento: "Avaliação cardiológica", conduta: "ECG normal. Sem alterações relevantes. Manter acompanhamento anual", evolucao: "Estável" },
    { periodo: "Março/2024", evento: "Ajuste de medicação", conduta: "Aumento da dose de Metformina de 500mg para 850mg 2x/dia por controle glicêmico insuficiente", evolucao: "Melhora parcial" }
  ],
  medicacoes: {
    emUso: [
      { nome: "Losartana 50mg", dose: "1 comprimido VO, 1x/dia", indicacao: "Hipertensão arterial", status: "Ativo" },
      { nome: "Metformina 850mg", dose: "1 comprimido VO, 2x/dia (café e jantar)", indicacao: "Diabetes tipo 2", status: "Ativo" }
    ],
    usoRecente: [
      { nome: "Amoxicilina 500mg", dose: "1 cp 8/8h por 7 dias — infecção urinária (set/2025)" }
    ]
  },
  doencasPreexistentes: [
    { nome: "Hipertensão Arterial Sistêmica", status: "Controlada", desde: "2018", observacao: "PA média em consultas: 130/85 mmHg" },
    { nome: "Diabetes Mellitus Tipo 2", status: "Em ajuste", desde: "2020", observacao: "HbA1c 7.2% — meta < 7.0%" }
  ],
  vacinacao: { status: "Esquema vacinal atualizado, exceto reforço de COVID-19 pendente." },
  alertas: [
    "Alergia a dipirona — evitar em qualquer prescrição",
    "Alergia a penicilina — considerar alternativas (macrolídeos, cefalosporinas com cautela)",
    "HbA1c acima da meta — avaliar ajuste terapêutico",
    "LDL colesterol elevado — considerar introdução de estatina",
    "Histórico familiar de IAM precoce — risco cardiovascular aumentado",
    "Reforço COVID-19 pendente"
  ],
  timeline: [
    { data: "2005", evento: "Apendicectomia" },
    { data: "2018", evento: "Diagnóstico de hipertensão → início de Losartana" },
    { data: "2020", evento: "Diagnóstico de DM2 → início de Metformina 500mg" },
    { data: "03/2024", evento: "Ajuste de Metformina para 850mg" },
    { data: "11/2025", evento: "ECG normal — avaliação cardiológica" },
    { data: "01/2026", evento: "Check-up: LDL e HbA1c elevados" }
  ]
};

const PDF_REFERENCES = {
  "Consulta 20/01/2026": { page: 1, highlight: { x: 50, y: 100, width: 400, height: 180 } },
  "Exames Laboratoriais Jan/2026": { page: 3, highlight: { x: 50, y: 80, width: 350, height: 220 } },
  "ECG Nov/2025": { page: 5, highlight: { x: 50, y: 120, width: 400, height: 150 } },
  "Caderneta de Vacinação": { page: 2, highlight: { x: 50, y: 100, width: 350, height: 180 } },
  "Histórico Clínico": { page: 1, highlight: { x: 50, y: 300, width: 400, height: 160 } },
  "Alertas de Alergia": { page: 1, highlight: { x: 50, y: 450, width: 400, height: 100 } },
  "Prescrições Ativas": { page: 4, highlight: { x: 50, y: 100, width: 400, height: 160 } },
};

const CHAT_RESPONSES = {
  default: {
    text: `Olá! Sou o Copiloto Med, seu assistente para organizar seu histórico de saúde.\n\nPosso ajudar com:\n• Consultar seu histórico de consultas e exames\n• Verificar vacinas e medicações em dia\n• Gerar um resumo clínico completo\n\n⚠️ Lembre-se: não substituo a consulta com um médico.\n\nComo posso ajudar?`,
    refs: []
  },
  consulta: {
    text: `**Última consulta registrada**\n\n• Data: **20/01/2026**\n• Local: **Hospital São Lucas — Vitória/ES**\n• Médico: **Dr. Ricardo Oliveira**\n• Motivo: Check-up anual com exames laboratoriais\n\nForam solicitados hemograma, glicemia, HbA1c, perfil lipídico e outros. Resultados indicam necessidade de atenção ao controle glicêmico e colesterol.\n\nDeseja ver o resumo clínico completo?`,
    refs: ["Consulta 20/01/2026", "Exames Laboratoriais Jan/2026"]
  },
  vacina: {
    text: `**Suas vacinas registradas**\n\n• **COVID-19 (4ª dose)**: 15/03/2024 — reforço pendente ⚠️\n• **Gripe**: 10/04/2025 — em dia ✅\n• **Hepatite B**: completa ✅\n• **Febre Amarela**: válida até 2029 ✅\n• **Tétano/dTpa**: válida até 2028 ✅\n\nRecomendo verificar com seu médico o reforço de COVID-19.`,
    refs: ["Caderneta de Vacinação"]
  },
  exame: {
    text: `**Últimos exames (Janeiro/2026)**\n\n• **Hemograma**: Normal ✅\n• **Glicemia de jejum**: 132 mg/dL — elevada ⚠️\n• **HbA1c**: 7.2% — acima da meta ⚠️\n• **Colesterol LDL**: 145 mg/dL — elevado ⚠️\n• **ECG (Nov/2025)**: Normal ✅\n\n⚠️ Converse com seu médico sobre os resultados alterados.`,
    refs: ["Exames Laboratoriais Jan/2026", "ECG Nov/2025"]
  }
};

const CONSULTATION_FLOW = [
  {
    question: "Quando foi minha última consulta?",
    response: {
      text: `Sua última consulta foi em:\n\n📅 **20/01/2026**\n\n🩺 **Médico:** Dr. Ricardo Oliveira\n📍 **Local:** Hospital São Lucas — Vitória/ES\n\nFoi um check-up anual com solicitação de exames laboratoriais completos.`,
      refs: ["Consulta 20/01/2026"]
    }
  },
  {
    question: "Quais exames foram feitos?",
    response: {
      text: `Na consulta de **20/01/2026** foram realizados:\n\n🔬 **Hemograma Completo** — Normal\n🩸 **Glicemia de Jejum** — 132 mg/dL (elevada)\n📊 **Hemoglobina Glicada (HbA1c)** — 7.2%\n💉 **Colesterol Total + Frações** — LDL 145 mg/dL (elevado)\n\n⚠️ Os valores de glicemia e colesterol sugerem necessidade de reavaliação terapêutica.`,
      refs: ["Exames Laboratoriais Jan/2026"]
    }
  },
  {
    question: "Estou com dor de cabeça forte... o que devo fazer?",
    response: {
      text: `⚠️ **Orientações sobre dor de cabeça:**\n\n**Quando observar em casa:**\n• Dor leve a moderada, sem outros sintomas\n• Melhora com repouso e hidratação\n• Sem febre alta ou rigidez de nuca\n\n**O que fazer:**\n✅ Repouso em ambiente escuro e silencioso\n✅ Hidratação adequada\n✅ Compressa fria na testa\n\n**🚨 Busque atendimento URGENTE se:**\n• Dor súbita e muito intensa ("a pior da vida")\n• Acompanhada de febre alta, vômitos ou confusão mental\n• Rigidez de nuca ou alterações visuais\n• Perda de força em membros\n\n**📋 Importante para seu perfil:**\n• Você tem hipertensão — dor de cabeça pode indicar pico pressórico\n• Evite dipirona (alergia documentada)\n\n📞 **SAMU: 192**`,
      refs: ["Histórico Clínico", "Alertas de Alergia"]
    }
  },
  {
    question: "Preciso renovar alguma receita?",
    response: {
      text: `📋 **Medicações de uso contínuo:**\n\n**Losartana 50mg** — 1x/dia\n• Indicação: Hipertensão arterial\n• Status: Ativo ✅\n\n**Metformina 850mg** — 2x/dia\n• Indicação: Diabetes tipo 2\n• Status: Ativo ✅\n\n💡 **Recomendação:** Agende retorno com Dr. Ricardo Oliveira para reavaliar as doses, considerando os últimos resultados de HbA1c (7.2%) e LDL (145 mg/dL).\n\n⚠️ Nunca altere doses por conta própria.`,
      refs: ["Prescrições Ativas", "Exames Laboratoriais Jan/2026"]
    }
  }
];

const SUMMARY_HIGHLIGHTS = {
  "hipertensão arterial sistêmica": "Histórico Clínico",
  "diabetes mellitus tipo 2": "Histórico Clínico",
  "alergia documentada a dipirona": "Alertas de Alergia",
  "penicilina": "Alertas de Alergia",
  "glicemia de jejum": "Exames Laboratoriais Jan/2026",
  "hemoglobina glicada": "Exames Laboratoriais Jan/2026",
  "LDL colesterol elevado": "Exames Laboratoriais Jan/2026",
  "Losartana": "Prescrições Ativas",
  "Metformina": "Prescrições Ativas",
  "Hospital São Lucas": "Consulta 20/01/2026",
};

const MOCK_TERMS_USE = `TERMOS DE USO — COPILOTO MED\n\n1. Aceitação dos Termos\nAo utilizar o Copiloto Med, você concorda com estes Termos de Uso. O serviço é oferecido como ferramenta auxiliar de organização e consulta de informações relacionadas à saúde pessoal.\n\n2. Natureza do Serviço\nO Copiloto Med NÃO é um serviço de diagnóstico médico. As informações fornecidas são de caráter informativo e organizacional, e não substituem a consulta presencial com um médico habilitado.\n\n3. Responsabilidade do Usuário\nO paciente é responsável pela veracidade das informações inseridas na plataforma e por buscar atendimento médico profissional sempre que necessário.\n\n4. Propriedade Intelectual\nTodo o conteúdo, design e funcionalidades do Copiloto Med são propriedade da empresa desenvolvedora.\n\n5. Modificações\nReservamo-nos o direito de modificar estes termos a qualquer momento, com notificação prévia.`;

const MOCK_TERMS_RESPONSIBILITY = `TERMOS DE RESPONSABILIDADE — COPILOTO MED\n\n1. Limitação de Responsabilidade\nO Copiloto Med é uma ferramenta de apoio e organização de dados clínicos pessoais. Não nos responsabilizamos por decisões médicas tomadas com base exclusiva nas informações exibidas na plataforma.\n\n2. Consulta Médica\nO uso do Copiloto Med não substitui, em nenhuma hipótese, a avaliação presencial de um médico. Em caso de emergência, ligue imediatamente para o SAMU (192) ou dirija-se ao pronto-socorro mais próximo.\n\n3. Dados Clínicos\nOs resumos e interpretações gerados por inteligência artificial são aproximações baseadas nos documentos fornecidos. Podem conter imprecisões e devem ser validados por profissional habilitado.\n\n4. Armazenamento de Dados\nOs documentos e informações enviados são armazenados de forma segura, mas o usuário é responsável por manter cópias de segurança dos documentos originais.`;

const MOCK_PRIVACY_POLICY = `POLÍTICA DE PRIVACIDADE — COPILOTO MED\n\n1. Dados Coletados\nColetamos: email de cadastro, nome do paciente, dados de saúde (nome, data de nascimento, histórico clínico) e documentos médicos enviados pelo usuário.\n\n2. Uso dos Dados\nSeus dados são utilizados exclusivamente para:\n• Organizar e exibir informações clínicas pessoais\n• Gerar resumos clínicos por inteligência artificial\n• Melhorar a experiência do serviço\n\n3. Compartilhamento\nNão compartilhamos seus dados pessoais ou de saúde com terceiros, exceto quando exigido por lei.\n\n4. Segurança\nUtilizamos criptografia e boas práticas de segurança para proteger seus dados sensíveis de saúde.\n\n5. Seus Direitos\nVocê pode solicitar a exclusão dos seus dados a qualquer momento.\n\n6. Cookies\nUtilizamos cookies essenciais para o funcionamento da plataforma.`;

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
const WelcomeScreen = ({onEnterEmail, onProfessional}) => (
  <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F8FAFC",fontFamily:FONT}}>
    <div style={{textAlign:"center",maxWidth:380,padding:32}}>
      <CopiloMedLogo width={260}/>
      <p style={{color:C.textSec,fontSize:14,margin:"18px 0 44px",lineHeight:1.6}}>Seu assistente inteligente para saúde e histórico médico</p>
      <p style={{color:C.textMuted,fontSize:12,fontWeight:600,margin:"0 0 14px",letterSpacing:".5px",textTransform:"uppercase"}}>Como você deseja entrar?</p>
      <button onClick={onEnterEmail} style={{width:"100%",padding:"13px",border:"none",borderRadius:999,
        background:C.pri,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:10,fontFamily:FONT,
        boxShadow:`0 4px 14px rgba(37,99,235,0.35)`,transition:"all .2s"}}>
        <I n="heart" s={18} c="#fff"/>Sou paciente — entrar com email
      </button>
      <div style={{color:C.textMuted,fontSize:12,margin:"6px 0",fontWeight:500}}>ou</div>
      <button onClick={onProfessional} style={{width:"100%",padding:"13px",border:`2px solid ${C.cream}`,borderRadius:999,
        background:"#fff",color:C.text,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>
        Sou Profissional de Saúde
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
    {id:"chat",icon:"chat",label:"Nova Consulta"},
    {id:"historico",icon:"card",label:"Meu Histórico"},
    {id:"resumo",icon:"file",label:"Resumo Clínico"},
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
      {!collapsed&&(
        <div style={{padding:"8px 14px",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
          <span style={{fontSize:9,fontWeight:700,color:"#9CA3AF",letterSpacing:".5px",textTransform:"uppercase",marginRight:4}}>Fonte</span>
          {["P","M","G"].map(sz=>(
            <button key={sz} onClick={()=>onFontSizeChange?.(sz)}
              style={{width:28,height:28,borderRadius:8,border:fontSize===sz?"none":`1px solid #1E293B`,
                background:fontSize===sz?C.pri:"transparent",color:fontSize===sz?"#fff":"#9CA3AF",
                fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {sz}
            </button>
          ))}
        </div>
      )}
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
  const [docExtracting, setDocExtracting] = useState(false);
  const [docExtracted, setDocExtracted] = useState(false);
  const [form, setForm] = useState({
    name:"", birthDate:"", sex:"", cpf:"", bloodType:"", weight:"", height:"",
    continuousMeds:"", allergies:"", chronicConditions:"",
    doctorName:"", doctorPhone:"", doctorClinic:"",
  });
  const [errors, setErrors] = useState({});
  const up = (k,v) => { setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:undefined})); };
  const calcAge = (bd) => {
    if(!bd) return "";
    const b = new Date(bd), n = new Date();
    let age = n.getFullYear() - b.getFullYear();
    if(n.getMonth()<b.getMonth()||(n.getMonth()===b.getMonth()&&n.getDate()<b.getDate())) age--;
    return String(age);
  };
  const calcBMI = (w,h) => {
    if(!w||!h) return null;
    const bmi = parseFloat(w)/Math.pow(parseFloat(h)/100,2);
    return isNaN(bmi) ? null : bmi.toFixed(1);
  };
  const bmiCategory = (bmi) => {
    if(!bmi) return "";
    const v = parseFloat(bmi);
    if(v<18.5) return "Abaixo do peso";
    if(v<25) return "Peso normal";
    if(v<30) return "Sobrepeso";
    return "Obesidade";
  };
  const handleDocExtract = (e) => {
    if(!e.target.files[0]) return;
    setDocExtracting(true);
    setTimeout(()=>{
      setForm(p=>({...p,
        name:"Pedro", birthDate:"2003-07-03", sex:"Masculino", cpf:"199.262.427-58",
        allergies:"Dipirona, Penicilina",
        chronicConditions:"Hipertensão arterial leve",
        continuousMeds:"Losartana 50mg — 1x ao dia",
      }));
      setErrors({});
      setDocExtracting(false);
      setDocExtracted(true);
    }, 1800);
  };
  const validate2 = () => {
    if(!docExtracted){setErrors({doc:"Envie um documento para continuar"});return false}
    return true;
  };
  const iStyle = f => ({...baseInput,borderColor:errors[f]?C.err:C.border});
  const bmi = calcBMI(form.weight, form.height);
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
              <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:"14px 0 6px"}}>Antes de comecar</h2>
              <p style={{color:C.textSec,fontSize:13,lineHeight:1.6,margin:0}}>Leia os pontos abaixo sobre o uso do Copiloto Med.</p>
            </div>
            <div style={{background:"#fff",borderRadius:12,padding:16,marginBottom:12,border:`2px solid ${C.pri}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:32,height:32,borderRadius:8,background:C.priLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n="heart" s={16} c={C.pri}/></div>
                <h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>O medico e insubstituivel</h3>
              </div>
              <p style={{fontSize:12,color:C.textSec,lineHeight:1.7,margin:0}}>
                Estou aqui para te ajudar a <strong style={{color:C.text}}>organizar seu historico medico</strong> — consultas, exames, vacinas e medicacoes. Mas quem cuida da sua saude e o medico. <strong style={{color:C.err}}>Nada que eu diga substitui uma consulta ou diagnostico profissional.</strong> Em emergencias, ligue <strong>192 (SAMU)</strong>.
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
                <span style={{fontSize:12,color:"#92400E",lineHeight:1.6}}>Declaro que li e compreendi que o <strong>Copiloto Med nao substitui o Medico</strong> e concordo com os termos legais.</span>
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
              <h2 style={{fontSize:20,fontWeight:800,color:C.text,margin:"0 0 6px"}}>Seus dados basicos</h2>
              <p style={{fontSize:13,color:C.textSec,margin:0}}>Envie um documento para preenchermos seus dados automaticamente</p>
            </div>
            <label htmlFor="onb-doc-id" style={{display:"block",cursor:"pointer",marginBottom:4}}>
              <div style={{border:`2px dashed ${docExtracted?C.ok:errors.doc?C.err:C.border}`,borderRadius:14,padding:"28px 20px",textAlign:"center",background:docExtracted?"#F0FDF4":C.bg,transition:"all .3s"}}>
                {docExtracting?(
                  <><div style={{width:36,height:36,border:`3px solid ${C.border}`,borderTopColor:C.pri,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 10px"}}/><p style={{fontSize:13,fontWeight:600,color:C.text,margin:0}}>Lendo documento...</p><p style={{fontSize:11,color:C.textMuted,margin:"4px 0 0"}}>Extraindo seus dados</p></>
                ):docExtracted?(
                  <><div style={{width:44,height:44,borderRadius:"50%",background:"#DCFCE7",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}><I n="check" s={22} c={C.ok}/></div><p style={{fontSize:13,fontWeight:700,color:C.ok,margin:0}}>Documento lido com sucesso!</p><p style={{fontSize:11,color:C.textMuted,margin:"4px 0 0"}}>Clique para trocar o documento</p></>
                ):(
                  <><div style={{width:52,height:52,borderRadius:14,background:C.priGhost,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><I n="file" s={26} c={C.pri}/></div><p style={{fontSize:14,fontWeight:700,color:C.text,margin:"0 0 4px"}}>Enviar documento</p><p style={{fontSize:12,color:C.textMuted,margin:0}}>RG, CNH ou Passaporte</p><p style={{fontSize:10,color:C.textMuted,margin:"6px 0 0"}}>PDF ou imagem</p></>
                )}
              </div>
            </label>
            <input id="onb-doc-id" type="file" accept=".pdf,image/*" onChange={handleDocExtract} style={{display:"none"}}/>
            {errors.doc&&<p style={{color:C.err,fontSize:11,margin:"4px 0 12px"}}>{errors.doc}</p>}
            {docExtracted&&(
              <div style={{background:"#fff",borderRadius:12,border:`1.5px solid ${C.border}`,padding:16,margin:"12px 0 16px"}}>
                <p style={{fontSize:11,fontWeight:700,color:C.textMuted,margin:"0 0 10px",textTransform:"uppercase",letterSpacing:".5px"}}>Dados extraidos</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><span style={{fontSize:11,color:C.textMuted}}>Nome</span><p style={{fontSize:13,fontWeight:700,color:C.text,margin:"2px 0 0"}}>{form.name}</p></div>
                  <div><span style={{fontSize:11,color:C.textMuted}}>Idade</span><p style={{fontSize:13,fontWeight:700,color:C.text,margin:"2px 0 0"}}>{calcAge(form.birthDate)} anos</p></div>
                  <div><span style={{fontSize:11,color:C.textMuted}}>CPF</span><p style={{fontSize:13,fontWeight:700,color:C.text,margin:"2px 0 0"}}>{form.cpf}</p></div>
                  <div><span style={{fontSize:11,color:C.textMuted}}>Sexo</span><p style={{fontSize:13,fontWeight:700,color:C.text,margin:"2px 0 0"}}>{form.sex}</p></div>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:10,marginTop:docExtracted?0:16}}>
              <button onClick={()=>setStep(1)} style={{flex:1,padding:"12px",border:`1.5px solid ${C.border}`,borderRadius:10,background:"#fff",color:C.text,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Voltar</button>
              <button onClick={()=>{if(validate2())setStep(3)}} style={{flex:2,padding:"12px",border:"none",borderRadius:10,background:C.pri,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Continuar</button>
            </div>
          </div>
        )}
        {step===3&&(
          <div>
            <div style={{textAlign:"center",marginBottom:18}}>
              <h2 style={{fontSize:20,fontWeight:800,color:C.text,margin:"0 0 6px"}}>Informacoes complementares</h2>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Tipo Sanguineo</label><select value={form.bloodType} onChange={e=>up("bloodType",e.target.value)} style={{...baseInput,appearance:"auto"}}><option value="">Selecione</option>{BLOOD_TYPES.map(b=><option key={b}>{b}</option>)}</select></div>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Peso (kg)</label><input type="number" step="0.1" min="0" value={form.weight} onChange={e=>up("weight",e.target.value)} placeholder="Ex: 68" style={baseInput}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:8}}>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Altura (cm)</label><input type="number" min="0" value={form.height} onChange={e=>up("height",e.target.value)} placeholder="Ex: 175" style={baseInput}/></div>
              {bmi&&<div style={{display:"flex",alignItems:"flex-end",paddingBottom:2}}><div style={{padding:"8px 12px",background:C.priLight,borderRadius:8,border:`1px solid ${C.pri}30`,fontSize:11,color:C.pri,fontWeight:600,width:"100%"}}>IMC: <strong>{bmi}</strong> — {bmiCategory(bmi)}</div></div>}
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Medicacao continua</label>
              <textarea value={form.continuousMeds} onChange={e=>up("continuousMeds",e.target.value)} placeholder="Ex: Losartana 50mg — 1x ao dia" rows={3} style={{...baseInput,resize:"vertical",minHeight:70,lineHeight:1.5}}/>
            </div>
            <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Alergias e restricoes</label><textarea value={form.allergies} onChange={e=>up("allergies",e.target.value)} placeholder="Ex: Dipirona, Penicilina..." rows={2} style={{...baseInput,resize:"vertical",minHeight:60,lineHeight:1.5}}/></div>
            <div style={{marginBottom:18}}><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Condicoes cronicas</label><textarea value={form.chronicConditions} onChange={e=>up("chronicConditions",e.target.value)} placeholder="Ex: Diabetes tipo 2, Hipertensao..." rows={2} style={{...baseInput,resize:"vertical",minHeight:60,lineHeight:1.5}}/></div>
            <div style={{borderTop:`1.5px dashed ${C.border}`,paddingTop:14,marginBottom:14}}>
              <p style={{fontSize:11,fontWeight:700,color:C.textMuted,margin:"0 0 12px",textTransform:"uppercase",letterSpacing:".5px"}}>Opcional</p>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Medico de referencia</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <input value={form.doctorName} onChange={e=>up("doctorName",e.target.value)} placeholder="Nome do medico" style={baseInput}/>
                  <input value={form.doctorPhone} onChange={e=>up("doctorPhone",e.target.value)} placeholder="Telefone" style={baseInput}/>
                </div>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Hospital / Clinica</label>
                <select value={form.doctorClinic} onChange={e=>up("doctorClinic",e.target.value)} style={{...baseInput,appearance:"auto"}}>
                  <option value="">Selecione</option>
                  <option>Copa Star</option>
                  <option>Barra D'Or</option>
                  <option>Outro</option>
                </select>
              </div>
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
            <p style={{fontSize:13,color:C.textSec,margin:"0 0 20px"}}>Confira suas informacoes cadastradas</p>
            <div style={{background:C.bg,borderRadius:14,border:`2px solid ${C.border}`,padding:20,marginBottom:20,textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${C.border}`}}>
                <div style={{width:60,height:60,borderRadius:12,background:C.priGhost,display:"flex",alignItems:"center",justifyContent:"center"}}><I n="user" s={28} c={C.pri}/></div>
                <div><div style={{fontSize:16,fontWeight:800,color:C.text}}>{form.name}</div><div style={{fontSize:12,color:C.textSec,marginTop:2}}>{form.birthDate&&calcAge(form.birthDate)+" anos"}{form.sex&&" - "+form.sex}</div></div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7,fontSize:12}}>
                {form.bloodType&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.textSec}}>Tipo Sanguineo</span><span style={{fontWeight:700,color:C.err}}>{form.bloodType}</span></div>}
                {form.weight&&form.height&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.textSec}}>Peso / Altura / IMC</span><span style={{fontWeight:600,color:C.text}}>{form.weight}kg / {form.height}cm / {bmi}</span></div>}
                {form.continuousMeds&&<div style={{paddingTop:6,borderTop:`1px solid ${C.borderLight}`}}><span style={{color:C.textSec,display:"block",marginBottom:3}}>Medicacao continua:</span><span style={{fontWeight:500,color:C.text}}>{form.continuousMeds}</span></div>}
                {form.chronicConditions&&<div style={{paddingTop:6,borderTop:`1px solid ${C.borderLight}`}}><span style={{color:C.textSec,display:"block",marginBottom:3}}>Condicoes cronicas:</span><span style={{fontWeight:500,color:C.text}}>{form.chronicConditions}</span></div>}
                {form.allergies&&<div><span style={{color:C.textSec,display:"block",marginBottom:3}}>Alergias:</span><span style={{fontWeight:500,color:C.text}}>{form.allergies}</span></div>}
                {form.doctorClinic&&<div style={{paddingTop:6,borderTop:`1px solid ${C.borderLight}`}}><span style={{color:C.textSec,display:"block",marginBottom:3}}>Clinica:</span><span style={{fontWeight:500,color:C.text}}>{form.doctorClinic}</span></div>}
              </div>
            </div>
            <button onClick={()=>onComplete({name:form.name,birthDate:form.birthDate,age:calcAge(form.birthDate),sex:form.sex||"Nao informado",cpf:form.cpf||"",bloodType:form.bloodType||"",weight:form.weight||"",height:form.height||"",bmi:bmi||"",continuousMeds:form.continuousMeds,allergies:form.allergies||"",chronicConditions:form.chronicConditions||"",photo:null,doctorName:form.doctorName||"",doctorPhone:form.doctorPhone||"",doctorClinic:form.doctorClinic||"",documents:[]})}
              style={{width:"100%",padding:"14px",border:"none",borderRadius:12,background:C.pri,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:FONT,marginBottom:10}}>
              Ir para o chat
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
      if(q.includes("consulta")||q.includes("ultima")||q.includes("data")) r=CHAT_RESPONSES.consulta;
      else if(q.includes("vacina")) r=CHAT_RESPONSES.vacina;
      else if(q.includes("exame")||q.includes("resultado")) r=CHAT_RESPONSES.exame;
      else r=CHAT_RESPONSES.default;
      setMessages(p=>[...p,{role:"bot",text:r.text,refs:r.refs,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}]);
      setTyping(false);
    },1600);
  };

  const suggestions = consultationMode&&consultationStep>0&&consultationStep<CONSULTATION_FLOW.length
    ? [CONSULTATION_FLOW[consultationStep].question]
    : profiles.length>0&&messages.length===0
      ? ["🩺 Quando foi minha ultima consulta?","📋 Meus exames estao em dia?","💊 Preciso renovar alguma receita?"]
      : ["O que voce pode fazer?","Como cadastrar meu perfil?"];

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

// ─── MEU HISTORICO (Vaccination + Exams cards) ───
const MeuHistoricoScreen = ({profiles, onAddProfile, onRemoveProfile}) => {
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [docsExpanded, setDocsExpanded] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [showVaccineForm, setShowVaccineForm] = useState({});
  const [manualVaccines, setManualVaccines] = useState([]);
  const [vaccineForm, setVaccineForm] = useState({name:"",date:"",nextDate:"",doctor:""});
  const [showExamForm, setShowExamForm] = useState({});
  const [manualExams, setManualExams] = useState([]);
  const [examForm, setExamForm] = useState({name:"",date:"",result:"",lab:"",doctor:""});

  const saveManualVaccine = (idx) => {
    if(!vaccineForm.name.trim()) return;
    setManualVaccines(p=>[...p,{...vaccineForm,status:"ok",manual:true}]);
    setVaccineForm({name:"",date:"",nextDate:"",doctor:""});
    setShowVaccineForm(p=>({...p,[idx]:false}));
    setToast({msg:"Vacina registrada",type:"success"});
  };
  const saveManualExam = (idx) => {
    if(!examForm.name.trim()) return;
    setManualExams(p=>[...p,{...examForm,status:"ok",manual:true}]);
    setExamForm({name:"",date:"",result:"",lab:"",doctor:""});
    setShowExamForm(p=>({...p,[idx]:false}));
    setToast({msg:"Exame registrado",type:"success"});
  };

  const getTabForIdx = (idx) => activeTab[idx]||"identification";

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:C.bgClinical,fontFamily:FONT}}>
      {toast&&<Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      {confirm&&<ConfirmModal title="Remover Perfil" message={`Tem certeza que deseja remover ${confirm.name}?`} danger onConfirm={()=>{onRemoveProfile(confirm.idx);setConfirm(null);setToast({msg:`${confirm.name} removido`,type:"success"})}} onCancel={()=>setConfirm(null)}/>}
      <div style={{padding:"13px 28px",borderBottom:`1px solid ${C.border}`,background:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><I n="card" s={18} c={C.pri}/><span style={{fontSize:15,fontWeight:700,color:C.text}}>Meu Historico</span></div>
        {profiles.length>0&&<Btn onClick={onAddProfile} icon={<I n="plus" s={14} c="#fff"/>}>Adicionar Perfil</Btn>}
      </div>
      <div style={{flex:1,overflow:"auto",padding:28}}>
        {profiles.length===0?(
          <div style={{textAlign:"center",marginTop:70}}>
            <h3 style={{fontSize:17,fontWeight:700,color:C.text,margin:"0 0 6px"}}>Nenhum perfil cadastrado</h3>
            <p style={{color:C.textSec,fontSize:13,margin:"0 0 22px"}}>Cadastre seu perfil para acessar seu historico medico</p>
            <Btn onClick={onAddProfile} icon={<I n="plus" s={15} c="#fff"/>}>Criar Meu Perfil</Btn>
          </div>
        ):(
          <div style={{maxWidth:700,margin:"0 auto"}}>
            {profiles.map((profile,idx)=>(
              <div key={idx} style={{marginBottom:14}}>
                <button onClick={()=>setExpanded(expanded===idx?null:idx)} style={{width:"100%",padding:"14px 18px",borderRadius:expanded===idx?"14px 14px 0 0":"14px",border:`1.5px solid ${C.border}`,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:FONT,textAlign:"left"}}>
                  <div style={{width:40,height:40,borderRadius:10,overflow:"hidden",background:C.priGhost,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {profile.photo?<img src={profile.photo} style={{width:40,height:40,objectFit:"cover"}} alt=""/>:<I n="user" s={18} c={C.pri}/>}
                  </div>
                  <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.text}}>{profile.name}</div><div style={{fontSize:11,color:C.textMuted}}>{profile.age?" Idade: "+profile.age+" anos":""} {profile.bloodType&&"• "+profile.bloodType}</div></div>
                  <I n={expanded===idx?"chevU":"chevD"} s={16} c={C.textMuted}/>
                </button>
                {expanded===idx&&(
                  <div style={{border:`1.5px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 14px 14px",background:"#fff",padding:22}}>
                    <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
                      <div style={{display:"inline-flex",background:C.borderLight,borderRadius:8,padding:3}}>
                        {[{key:"identification",icon:"card",label:"Identificacao"},{key:"vaccination",icon:"syringe",label:"Vacinas"},{key:"exams",icon:"activity",label:"Exames"}].map(tab=>{
                          const isAct=getTabForIdx(idx)===tab.key;
                          return (
                            <button key={tab.key} onClick={()=>setActiveTab(p=>({...p,[idx]:tab.key}))} style={{padding:"6px 14px",borderRadius:6,border:"none",background:isAct?"#fff":"transparent",color:isAct?C.text:C.textMuted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT,boxShadow:isAct?"0 1px 3px rgba(0,0,0,.08)":"none",display:"flex",alignItems:"center",gap:5}}>
                              <I n={tab.icon} s={13} c={isAct?C.pri:C.textMuted}/>{tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {getTabForIdx(idx)==="identification"&&(
                      <div style={{borderRadius:14,overflow:"hidden",maxWidth:520,margin:"0 auto 20px",boxShadow:"0 4px 20px rgba(0,0,0,.1)",border:`1px solid ${C.border}`}}>
                        <div style={{background:`linear-gradient(135deg, ${C.navy} 0%, #1E293B 100%)`,padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div><CopiloMedLogo width={120} variant="white"/><div style={{fontSize:9,color:"#94A3B8",letterSpacing:1.5,marginTop:4}}>IDENTIFICACAO DO PACIENTE</div></div>
                          <I n="shield" s={22} c={C.gold}/>
                        </div>
                        <div style={{height:3,background:`linear-gradient(90deg, ${C.pri}, #93C5FD, ${C.pri})`}}/>
                        <div style={{padding:"18px 22px",display:"flex",gap:18,background:"#fff"}}>
                          <div style={{width:88,height:106,borderRadius:10,overflow:"hidden",background:C.borderLight,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${C.border}`}}>
                            {profile.photo?<img src={profile.photo} style={{width:88,height:106,objectFit:"cover"}} alt=""/>:<I n="user" s={32} c={C.textMuted}/>}
                          </div>
                          <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 20px",fontSize:11,alignContent:"start"}}>
                            {[["NOME",profile.name],["SEXO",profile.sex||"—"],["IDADE",profile.age?(profile.age+" anos"):"—"],["TIPO SANG.",profile.bloodType||"—"],["PESO",profile.weight?(profile.weight+" kg"):"—"],["ALTURA",profile.height?(profile.height+" cm"):"—"],["IMC",profile.bmi||"—"],["CPF",profile.cpf||"—"]].map(([k,v])=>(
                              <div key={k}><div style={{fontSize:9,fontWeight:800,color:C.textMuted,letterSpacing:.8,marginBottom:1}}>{k}</div><div style={{color:C.text,fontWeight:600,fontSize:k==="TIPO SANG."?13:11,color:k==="TIPO SANG."?C.err:C.text}}>{v}</div></div>
                            ))}
                          </div>
                        </div>
                        {(profile.chronicConditions||profile.allergies)&&(
                          <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 22px",background:"#FFF7F7"}}>
                            {profile.allergies&&<><div style={{fontSize:9,fontWeight:800,color:C.err,letterSpacing:.8,marginBottom:3}}>ALERGIAS</div><div style={{fontSize:11,color:C.text,marginBottom:profile.chronicConditions?8:0}}>{profile.allergies}</div></>}
                            {profile.chronicConditions&&<><div style={{fontSize:9,fontWeight:800,color:C.textMuted,letterSpacing:.8,marginBottom:3}}>CONDICOES CRONICAS</div><div style={{fontSize:11,color:C.text}}>{profile.chronicConditions}</div></>}
                          </div>
                        )}
                        {(profile.doctorName||profile.doctorClinic)&&(
                          <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 22px",background:"#F8FAFC"}}>
                            <div style={{fontSize:9,fontWeight:800,color:C.textMuted,letterSpacing:.8,marginBottom:4}}>MEDICO DE REFERENCIA</div>
                            <div style={{display:"flex",alignItems:"center",gap:8}}><I n="heart" s={14} c={C.pri}/><div>{profile.doctorName&&<div style={{fontSize:11,fontWeight:600,color:C.text}}>{profile.doctorName}</div>}{profile.doctorClinic&&<div style={{fontSize:10,color:C.textSec}}>{profile.doctorClinic}</div>}</div></div>
                          </div>
                        )}
                        <div style={{background:C.navy,padding:"7px",textAlign:"center",fontSize:9,color:"#94A3B8",fontWeight:700,letterSpacing:1.5}}>CARTAO DE IDENTIFICACAO MEDICA</div>
                      </div>
                    )}

                    {getTabForIdx(idx)==="vaccination"&&(
                      <div style={{borderRadius:14,overflow:"hidden",maxWidth:520,margin:"0 auto 20px",boxShadow:"0 4px 20px rgba(0,0,0,.1)",border:`1px solid ${C.border}`}}>
                        <div style={{background:`linear-gradient(135deg, ${C.navy} 0%, #1E293B 100%)`,padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div><CopiloMedLogo width={120} variant="white"/><div style={{fontSize:9,color:"#94A3B8",letterSpacing:1.5,marginTop:4}}>CADERNETA DE VACINACAO</div></div>
                          <I n="syringe" s={20} c={C.gold}/>
                        </div>
                        <div style={{height:3,background:`linear-gradient(90deg, ${C.pri}, #93C5FD, ${C.pri})`}}/>
                        <div style={{padding:"14px 18px",background:"#fff"}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${C.borderLight}`}}>
                            {profile.photo?<img src={profile.photo} style={{width:32,height:32,borderRadius:8,objectFit:"cover"}} alt=""/>:<div style={{width:32,height:32,borderRadius:8,background:C.priGhost,display:"flex",alignItems:"center",justifyContent:"center"}}><I n="user" s={14} c={C.pri}/></div>}
                            <div><span style={{fontSize:13,fontWeight:700,color:C.text}}>{profile.name}</span>{profile.bloodType&&<span style={{fontSize:11,color:C.err,fontWeight:700,marginLeft:8}}>{profile.bloodType}</span>}</div>
                          </div>
                          <div style={{overflowX:"auto"}}>
                            <table style={{width:"100%",fontSize:11,borderCollapse:"collapse",minWidth:400}}>
                              <thead><tr style={{borderBottom:`1.5px solid ${C.border}`}}>
                                {["Vacina","Aplicacao","Proxima dose","Status","Medico"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 8px",fontSize:9,fontWeight:800,color:C.textMuted,letterSpacing:.6,textTransform:"uppercase"}}>{h}</th>)}
                              </tr></thead>
                              <tbody>
                                {[...MOCK_VACCINES,...manualVaccines].map((v,vi)=>(
                                  <tr key={vi} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                                    <td style={{padding:"9px 8px",fontWeight:700,color:C.text}}>{v.name}{v.manual&&<span style={{marginLeft:6,padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:700,background:C.lilacLight,color:C.lilac}}>Manual</span>}</td>
                                    <td style={{padding:"9px 8px",color:C.textSec,fontFamily:FONT_MONO,fontSize:10}}>{v.date}</td>
                                    <td style={{padding:"9px 8px",color:C.textSec,fontFamily:FONT_MONO,fontSize:10}}>{v.nextDate}</td>
                                    <td style={{padding:"9px 8px"}}><span style={{padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:v.status==="ok"?C.okBg:C.warnBg,color:v.status==="ok"?C.ok:C.warn}}>{v.status==="ok"?"Em dia":"Pendente"}</span></td>
                                    <td style={{padding:"9px 8px",color:C.textSec,fontSize:10}}>{v.doctor}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div style={{marginTop:14}}>
                            <button onClick={()=>setShowVaccineForm(p=>({...p,[idx]:!p[idx]}))} style={{padding:"8px 14px",border:`1.5px dashed ${C.pri}40`,borderRadius:8,background:"transparent",cursor:"pointer",fontSize:11,fontWeight:600,color:C.pri,fontFamily:FONT,display:"flex",alignItems:"center",gap:6}}>
                              <I n="plus" s={14} c={C.pri}/>{showVaccineForm[idx]?"Fechar":"Registrar vacina manualmente"}
                            </button>
                            {showVaccineForm[idx]&&(
                              <div style={{marginTop:10,padding:14,background:C.bg,borderRadius:10,border:`1px solid ${C.border}`}}>
                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                                  <input value={vaccineForm.name} onChange={e=>setVaccineForm(p=>({...p,name:e.target.value}))} placeholder="Nome da vacina" style={{...baseInput,fontSize:11,padding:"8px 10px"}}/>
                                  <input value={vaccineForm.doctor} onChange={e=>setVaccineForm(p=>({...p,doctor:e.target.value}))} placeholder="Medico / UBS" style={{...baseInput,fontSize:11,padding:"8px 10px"}}/>
                                </div>
                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                                  <div><label style={{fontSize:9,fontWeight:700,color:C.textMuted,display:"block",marginBottom:2}}>Data aplicacao</label><input type="date" value={vaccineForm.date} onChange={e=>setVaccineForm(p=>({...p,date:e.target.value}))} style={{...baseInput,fontSize:11,padding:"8px 10px"}}/></div>
                                  <div><label style={{fontSize:9,fontWeight:700,color:C.textMuted,display:"block",marginBottom:2}}>Proxima dose</label><input type="date" value={vaccineForm.nextDate} onChange={e=>setVaccineForm(p=>({...p,nextDate:e.target.value}))} style={{...baseInput,fontSize:11,padding:"8px 10px"}}/></div>
                                </div>
                                <Btn onClick={()=>saveManualVaccine(idx)} style={{fontSize:11,padding:"7px 16px"}}>Salvar vacina</Btn>
                              </div>
                            )}
                            <div style={{marginTop:10,padding:"8px 12px",background:C.warnBg,borderRadius:8,border:`1px solid ${C.warn}30`}}>
                              <p style={{fontSize:9,color:"#92400E",margin:0,lineHeight:1.5}}>Registro manual nao substitui laudos oficiais. Consulte seu medico para validacao.</p>
                            </div>
                          </div>
                        </div>
                        <div style={{background:C.navy,padding:"7px",textAlign:"center",fontSize:9,color:"#94A3B8",fontWeight:700,letterSpacing:1.5}}>HISTORICO DE VACINACAO</div>
                      </div>
                    )}

                    {getTabForIdx(idx)==="exams"&&(
                      <div style={{borderRadius:14,overflow:"hidden",maxWidth:520,margin:"0 auto 20px",boxShadow:"0 4px 20px rgba(0,0,0,.1)",border:`1px solid ${C.border}`}}>
                        <div style={{background:`linear-gradient(135deg, ${C.navy} 0%, #1E293B 100%)`,padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div><CopiloMedLogo width={120} variant="white"/><div style={{fontSize:9,color:"#94A3B8",letterSpacing:1.5,marginTop:4}}>HISTORICO DE EXAMES</div></div>
                          <I n="activity" s={20} c={C.gold}/>
                        </div>
                        <div style={{height:3,background:`linear-gradient(90deg, ${C.pri}, #93C5FD, ${C.pri})`}}/>
                        <div style={{padding:"14px 18px",background:"#fff"}}>
                          <div style={{overflowX:"auto"}}>
                            <table style={{width:"100%",fontSize:11,borderCollapse:"collapse",minWidth:500}}>
                              <thead><tr style={{borderBottom:`1.5px solid ${C.border}`}}>
                                {["Exame","Data","Resultado","Laboratorio","Medico"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 8px",fontSize:9,fontWeight:800,color:C.textMuted,letterSpacing:.6,textTransform:"uppercase"}}>{h}</th>)}
                              </tr></thead>
                              <tbody>
                                {[...MOCK_EXAMS,...manualExams].map((ex,ei)=>(
                                  <tr key={ei} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                                    <td style={{padding:"9px 8px",fontWeight:700,color:C.text}}>{ex.name}{ex.manual&&<span style={{marginLeft:6,padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:700,background:C.lilacLight,color:C.lilac}}>Manual</span>}</td>
                                    <td style={{padding:"9px 8px",color:C.textSec,fontFamily:FONT_MONO,fontSize:10}}>{ex.date}</td>
                                    <td style={{padding:"9px 8px",color:ex.status==="warn"?C.warn:ex.status==="ok"?C.ok:C.text,fontWeight:ex.status!=="ok"?600:400,fontSize:10}}>{ex.result}</td>
                                    <td style={{padding:"9px 8px",color:C.textSec,fontSize:10}}>{ex.lab}</td>
                                    <td style={{padding:"9px 8px",color:C.textSec,fontSize:10}}>{ex.doctor}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div style={{marginTop:14}}>
                            <button onClick={()=>setShowExamForm(p=>({...p,[idx]:!p[idx]}))} style={{padding:"8px 14px",border:`1.5px dashed ${C.pri}40`,borderRadius:8,background:"transparent",cursor:"pointer",fontSize:11,fontWeight:600,color:C.pri,fontFamily:FONT,display:"flex",alignItems:"center",gap:6}}>
                              <I n="plus" s={14} c={C.pri}/>{showExamForm[idx]?"Fechar":"Registrar exame manualmente"}
                            </button>
                            {showExamForm[idx]&&(
                              <div style={{marginTop:10,padding:14,background:C.bg,borderRadius:10,border:`1px solid ${C.border}`}}>
                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                                  <input value={examForm.name} onChange={e=>setExamForm(p=>({...p,name:e.target.value}))} placeholder="Nome do exame" style={{...baseInput,fontSize:11,padding:"8px 10px"}}/>
                                  <input type="date" value={examForm.date} onChange={e=>setExamForm(p=>({...p,date:e.target.value}))} style={{...baseInput,fontSize:11,padding:"8px 10px"}}/>
                                </div>
                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                                  <input value={examForm.result} onChange={e=>setExamForm(p=>({...p,result:e.target.value}))} placeholder="Resultado" style={{...baseInput,fontSize:11,padding:"8px 10px"}}/>
                                  <input value={examForm.lab} onChange={e=>setExamForm(p=>({...p,lab:e.target.value}))} placeholder="Laboratorio" style={{...baseInput,fontSize:11,padding:"8px 10px"}}/>
                                </div>
                                <input value={examForm.doctor} onChange={e=>setExamForm(p=>({...p,doctor:e.target.value}))} placeholder="Medico solicitante" style={{...baseInput,fontSize:11,padding:"8px 10px",marginBottom:10}}/>
                                <Btn onClick={()=>saveManualExam(idx)} style={{fontSize:11,padding:"7px 16px"}}>Salvar exame</Btn>
                              </div>
                            )}
                            <div style={{marginTop:10,padding:"8px 12px",background:C.warnBg,borderRadius:8,border:`1px solid ${C.warn}30`}}>
                              <p style={{fontSize:9,color:"#92400E",margin:0,lineHeight:1.5}}>Registro manual nao substitui laudos oficiais. Consulte seu medico para validacao.</p>
                            </div>
                          </div>
                        </div>
                        <div style={{background:C.navy,padding:"7px",textAlign:"center",fontSize:9,color:"#94A3B8",fontWeight:700,letterSpacing:1.5}}>HISTORICO DE EXAMES LABORATORIAIS</div>
                      </div>
                    )}

                    {profile.documents?.length>0&&(
                      <div style={{background:C.bg,borderRadius:12,marginBottom:16,border:`1px solid ${C.border}`}}>
                        <button onClick={()=>setDocsExpanded(p=>({...p,[idx]:!p[idx]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:16,background:"transparent",border:"none",cursor:"pointer",fontFamily:FONT}}>
                          <I n="file" s={14} c={C.pri}/>
                          <span style={{fontSize:11,fontWeight:800,color:C.textMuted,letterSpacing:".5px",textTransform:"uppercase",flex:1,textAlign:"left"}}>Documentos ({profile.documents.length})</span>
                          <I n={docsExpanded[idx]?"chevU":"chevD"} s={12} c={C.textMuted}/>
                        </button>
                        {docsExpanded[idx]&&<div style={{padding:"0 16px 16px",display:"grid",gap:6}}>{profile.documents.map(doc=><div key={doc.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#fff",borderRadius:8,border:`1px solid ${C.border}`}}><I n="file" s={12} c={C.pri}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.name}</div><div style={{fontSize:9,color:C.textMuted}}>{doc.type} - {doc.size}</div></div><button style={{background:"none",border:"none",cursor:"pointer",padding:2}} onClick={()=>setToast({msg:"Download iniciado",type:"success"})}><I n="download" s={13} c={C.pri}/></button></div>)}</div>}
                      </div>
                    )}
                    <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:10}}>
                      <Btn variant="ghost" onClick={()=>setToast({msg:"Link copiado!",type:"success"})} icon={<I n="share" s={14}/>}>Compartilhar</Btn>
                      <Btn variant="ghost" onClick={()=>setToast({msg:"Download iniciado!",type:"success"})} icon={<I n="download" s={14}/>}>Baixar</Btn>
                    </div>
                    <div style={{display:"flex",justifyContent:"center"}}>
                      <Btn variant="danger" onClick={()=>setConfirm({name:profile.name,idx})} icon={<I n="trash" s={14} c={C.err}/>}>Remover Perfil</Btn>
                    </div>
                  </div>
                )}
              </div>
            ))}
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

// ─── RESUMO CLINICO ───
const ResumoScreen = ({profiles, onAddProfile}) => {
  const [expanded, setExpanded] = useState(null);
  const [summaries, setSummaries] = useState({});
  const [toast, setToast] = useState(null);

  const handleExpand = (idx) => {
    if(expanded===idx){setExpanded(null);return}
    setExpanded(idx);
    if(!summaries[idx]){
      setSummaries(p=>({...p,[idx]:{status:"loading",data:null}}));
      setTimeout(()=>setSummaries(p=>({...p,[idx]:{status:"done",data:MOCK_SUMMARY}})),2500);
    }
  };

  const regenerate = (idx) => {
    setSummaries(p=>({...p,[idx]:{status:"loading",data:null}}));
    setTimeout(()=>setSummaries(p=>({...p,[idx]:{status:"done",data:MOCK_SUMMARY}})),2500);
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:C.bgClinical,fontFamily:FONT}}>
      {toast&&<Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      <div style={{padding:"13px 28px",borderBottom:`1px solid ${C.border}`,background:"#fff",display:"flex",alignItems:"center",gap:10}}>
        <I n="sparkle" s={18} c={C.pri}/><span style={{fontSize:15,fontWeight:700,color:C.text}}>Resumos Clinicos</span>
      </div>
      <div style={{flex:1,overflow:"auto",padding:28}}>
        {profiles.length===0?(
          <div style={{textAlign:"center",marginTop:70}}>
            <h3 style={{fontSize:17,fontWeight:700,color:C.text,margin:"0 0 6px"}}>Nenhum perfil encontrado</h3>
            <p style={{color:C.textSec,fontSize:13,margin:"0 0 22px"}}>Cadastre seu perfil para ver o resumo clinico.</p>
            <Btn onClick={onAddProfile} icon={<I n="plus" s={15} c="#fff"/>}>Criar Meu Perfil</Btn>
          </div>
        ):(
          <div style={{maxWidth:700,margin:"0 auto"}}>
            {profiles.map((profile,idx)=>{
              const s=summaries[idx];
              return (
                <div key={idx} style={{marginBottom:14}}>
                  <button onClick={()=>handleExpand(idx)} style={{width:"100%",padding:"14px 18px",borderRadius:expanded===idx?"14px 14px 0 0":"14px",border:`1.5px solid ${C.border}`,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:FONT,textAlign:"left"}}>
                    <div style={{width:40,height:40,borderRadius:10,background:C.priGhost,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:C.pri}}>{profile.name[0]}</div>
                    <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.text}}>{profile.name}</div><div style={{fontSize:11,color:C.textMuted}}>{profile.age&&profile.age+" anos"} {profile.bloodType&&"• "+profile.bloodType}</div></div>
                    <I n={expanded===idx?"chevU":"chevD"} s={16} c={C.textMuted}/>
                  </button>
                  {expanded===idx&&(
                    <div style={{border:`1.5px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 14px 14px",background:"#fff",padding:22}}>
                      <div style={{border:`1.5px solid ${C.border}`,borderRadius:12,padding:18,background:C.bg}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14}}>
                          <I n="sparkle" s={16} c={C.pri}/>
                          <span style={{fontSize:11,fontWeight:800,color:C.textMuted,letterSpacing:1}}>RESUMO CLINICO IA</span>
                          {s?.status==="done"&&<span style={{marginLeft:"auto",fontSize:10,color:C.ok,fontWeight:600,background:C.okBg,padding:"2px 8px",borderRadius:6}}>Gerado</span>}
                        </div>
                        {(!s||s.status==="loading")?(
                          <div style={{textAlign:"center",padding:32}}>
                            <div style={{width:36,height:36,border:`3px solid ${C.border}`,borderTopColor:C.pri,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 14px"}}/>
                            <p style={{fontSize:13,fontWeight:700,color:C.text}}>Gerando resumo automaticamente...</p>
                            <p style={{fontSize:11,color:C.textMuted}}>Analisando documentos de {profile.name}</p>
                          </div>
                        ):(
                          <div>
                            <div style={{marginBottom:20}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>🧑</span><h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>Dados do Paciente</h3></div>
                              <div style={{fontSize:11,lineHeight:1.9,color:C.textSec,marginLeft:22}}>
                                {[["Nome",s.data.identificacao.nome],["Sexo",s.data.identificacao.sexo],["Nascimento",s.data.identificacao.dataNascimento],["Idade",s.data.identificacao.idade],["Peso",s.data.identificacao.peso],["Altura",s.data.identificacao.altura],["IMC",s.data.identificacao.imc],["Tipo Sanguineo",s.data.identificacao.tipoSanguineo],["Medico",s.data.identificacao.medico],["Atendimento",s.data.identificacao.atendimento]].map(([k,v])=>(
                                  <div key={k}><strong style={{color:C.text}}>{k}:</strong> {v}</div>
                                ))}
                              </div>
                            </div>
                            {(()=>{
                              const vaxOk=MOCK_VACCINES.filter(v=>v.status==="ok");
                              const vaxLate=MOCK_VACCINES.filter(v=>v.status==="late");
                              const exWarn=MOCK_EXAMS.filter(e=>e.status==="warn");
                              const exOk=MOCK_EXAMS.filter(e=>e.status==="ok");
                              return (
                                <div style={{marginBottom:20}}>
                                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>💉</span><h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>Vacinacao e Exames</h3></div>
                                  <div style={{marginLeft:22,display:"flex",flexDirection:"column",gap:10}}>
                                    {vaxLate.length>0&&<div style={{background:C.errBg,border:`1px solid ${C.err}25`,borderRadius:8,padding:12}}><div style={{fontSize:11,fontWeight:700,color:C.err,marginBottom:6}}>Vacinas pendentes ({vaxLate.length})</div>{vaxLate.map((v,i)=><div key={i} style={{fontSize:11,color:C.text,marginBottom:3}}>- <strong>{v.name}</strong> - pendente desde {v.nextDate}</div>)}</div>}
                                    {vaxOk.length>0&&<div style={{background:C.okBg,border:`1px solid ${C.ok}25`,borderRadius:8,padding:12}}><div style={{fontSize:11,fontWeight:700,color:C.ok,marginBottom:6}}>Vacinas em dia ({vaxOk.length})</div>{vaxOk.map((v,i)=><div key={i} style={{fontSize:11,color:C.text,marginBottom:3}}>- <strong>{v.name}</strong></div>)}</div>}
                                    {exWarn.length>0&&<div style={{background:C.warnBg,border:`1px solid ${C.warn}25`,borderRadius:8,padding:12}}><div style={{fontSize:11,fontWeight:700,color:C.warn,marginBottom:6}}>Exames com alteracoes ({exWarn.length})</div>{exWarn.map((e,i)=><div key={i} style={{fontSize:11,color:C.text,marginBottom:3}}>- <strong>{e.name}</strong>: {e.result}</div>)}</div>}
                                    {exOk.length>0&&<div style={{background:C.okBg,border:`1px solid ${C.ok}25`,borderRadius:8,padding:12}}><div style={{fontSize:11,fontWeight:700,color:C.ok,marginBottom:6}}>Exames normais ({exOk.length})</div>{exOk.map((e,i)=><div key={i} style={{fontSize:11,color:C.text,marginBottom:3}}>- <strong>{e.name}</strong>: {e.result}</div>)}</div>}
                                  </div>
                                </div>
                              );
                            })()}
                            <div style={{marginBottom:20}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>🕒</span><h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>Historico de Consultas</h3></div>
                              <div style={{marginLeft:22,display:"flex",flexDirection:"column",gap:10}}>
                                {s.data.eventosImportantes.map((ev,i)=>(
                                  <div key={i} style={{background:"#fff",border:`1px solid ${C.borderLight}`,borderRadius:8,padding:12}}>
                                    <div style={{fontSize:11,fontWeight:700,color:C.pri,marginBottom:4}}>{ev.periodo}</div>
                                    {ev.evento&&<div style={{fontSize:11,color:C.text,marginBottom:3}}><strong>Evento:</strong> {ev.evento}</div>}
                                    {ev.conduta&&<div style={{fontSize:11,color:C.textSec,marginBottom:3}}><strong>Conduta:</strong> {ev.conduta}</div>}
                                    {ev.evolucao&&<div style={{fontSize:11,color:C.textSec}}><strong>Evolucao:</strong> {ev.evolucao}</div>}
                                    {ev.status&&<div style={{fontSize:11,color:C.warn,fontWeight:600}}><strong>Status:</strong> {ev.status}</div>}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {s.data.doencasPreexistentes?.length>0&&(
                              <div style={{marginBottom:20}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>🏥</span><h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>Condicoes Cronicas e Pre-existentes</h3></div>
                                <div style={{marginLeft:22,display:"flex",flexDirection:"column",gap:10}}>
                                  {s.data.doencasPreexistentes.map((d,i)=>(
                                    <div key={i} style={{background:C.lilacBg,border:`1px solid ${C.lilac}25`,borderRadius:8,padding:12}}>
                                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                                        <div style={{fontSize:11,fontWeight:700,color:C.text}}>{d.nome}</div>
                                        <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:6,background:d.status==="Controlada"?C.okBg:C.warnBg,color:d.status==="Controlada"?C.ok:C.warn}}>{d.status}</span>
                                      </div>
                                      <div style={{fontSize:10,color:C.textSec,marginBottom:2}}>Desde: {d.desde}</div>
                                      {d.observacao&&<div style={{fontSize:10,color:C.textSec}}>{d.observacao}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div style={{marginBottom:20}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>💊</span><h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>Medicacoes</h3></div>
                              <div style={{marginLeft:22}}>
                                {s.data.medicacoes.emUso.map((med,i)=>(
                                  <div key={i} style={{background:C.okBg,border:`1px solid ${C.ok}30`,borderRadius:8,padding:10,marginBottom:8}}>
                                    <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:3}}>{med.nome}</div>
                                    <div style={{fontSize:10,color:C.textSec,marginBottom:2}}><strong>Dose:</strong> {med.dose}</div>
                                    <div style={{fontSize:10,color:C.textSec,marginBottom:2}}><strong>Indicacao:</strong> {med.indicacao}</div>
                                    <div style={{fontSize:10,color:C.ok,fontWeight:600}}>Status: {med.status}</div>
                                  </div>
                                ))}
                                {s.data.medicacoes.usoRecente.length>0&&<>
                                  <div style={{fontSize:11,fontWeight:700,color:C.text,marginTop:12,marginBottom:6}}>Uso recente</div>
                                  {s.data.medicacoes.usoRecente.map((med,i)=><div key={i} style={{background:"#fff",border:`1px solid ${C.borderLight}`,borderRadius:8,padding:10,marginBottom:6}}><div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:2}}>{med.nome}</div><div style={{fontSize:10,color:C.textSec}}>{med.dose}</div></div>)}
                                </>}
                              </div>
                            </div>
                            <div style={{marginBottom:20}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>🩺</span><h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>Resumo Clinico Geral</h3></div>
                              <p style={{fontSize:11,lineHeight:1.8,color:C.textSec,margin:"0 0 0 22px"}}>
                                {(()=>{
                                  const text=s.data.resumoGeral;
                                  const parts=[];let lastIndex=0;
                                  const entries=Object.entries(SUMMARY_HIGHLIGHTS);
                                  const matches=[];
                                  entries.forEach(([phrase,refKey])=>{
                                    const idx2=text.toLowerCase().indexOf(phrase.toLowerCase());
                                    if(idx2!==-1) matches.push({start:idx2,end:idx2+phrase.length,phrase,refKey});
                                  });
                                  matches.sort((a,b)=>a.start-b.start);
                                  matches.forEach((m,mi)=>{
                                    if(m.start>lastIndex) parts.push(<span key={"t"+mi}>{text.slice(lastIndex,m.start)}</span>);
                                    parts.push(<span key={"h"+mi} style={{background:C.priLight,borderBottom:`2px solid ${C.pri}`,cursor:"pointer",padding:"1px 3px",borderRadius:3,fontWeight:600}} title={`Ver referencia: ${m.refKey}`} onClick={()=>setToast({msg:`Referencia: ${m.refKey}`,type:"success"})}>{text.slice(m.start,m.end)}</span>);
                                    lastIndex=m.end;
                                  });
                                  if(lastIndex<text.length) parts.push(<span key="last">{text.slice(lastIndex)}</span>);
                                  return parts.length>0?parts:text;
                                })()}
                              </p>
                            </div>
                            <div style={{marginBottom:20}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>⚠️</span><h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>Alertas Clinicos Ativos</h3></div>
                              <div style={{marginLeft:22,display:"flex",flexDirection:"column",gap:6}}>
                                {s.data.alertas.map((alerta,i)=>(
                                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:C.errBg,border:`1px solid ${C.err}20`,borderRadius:6,padding:"8px 12px"}}>
                                    <div style={{width:4,height:4,borderRadius:"50%",background:C.err,flexShrink:0}}/>
                                    <span style={{fontSize:11,color:C.err,fontWeight:500}}>{alerta}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div style={{marginBottom:20}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>🧭</span><h3 style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>Linha do Tempo</h3></div>
                              <div style={{marginLeft:22,position:"relative",paddingLeft:16}}>
                                <div style={{position:"absolute",left:5,top:6,bottom:6,width:2,background:C.borderLight}}/>
                                {s.data.timeline.map((item,i)=>(
                                  <div key={i} style={{position:"relative",marginBottom:12,paddingLeft:12}}>
                                    <div style={{position:"absolute",left:-8,top:6,width:8,height:8,borderRadius:"50%",background:C.pri,border:`2px solid ${C.bg}`}}/>
                                    <div style={{fontSize:10,fontWeight:700,color:C.pri,marginBottom:2}}>{item.data}</div>
                                    <div style={{fontSize:11,color:C.textSec}}>{item.evento}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div style={{display:"flex",gap:8,marginTop:18,flexWrap:"wrap",paddingTop:14,borderTop:`1px solid ${C.borderLight}`}}>
                              <Btn variant="ghost" onClick={()=>setToast({msg:"Link copiado!",type:"success"})} icon={<I n="share" s={13}/>} style={{fontSize:11,padding:"7px 14px"}}>Compartilhar</Btn>
                              <Btn variant="ghost" onClick={()=>setToast({msg:"Download iniciado!",type:"success"})} icon={<I n="download" s={13}/>} style={{fontSize:11,padding:"7px 14px"}}>Baixar</Btn>
                              <Btn variant="teal" onClick={()=>regenerate(idx)} icon={<I n="refresh" s={13} c={C.pri}/>} style={{fontSize:11,padding:"7px 14px"}}>Atualizar</Btn>
                            </div>
                          </div>
                        )}
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

// ─── PATIENT REGISTRATION (3 steps) ───
const PatientRegistration = ({email, onComplete, onCancel}) => {
  const [step,setStep]=useState(1);const[saving,setSaving]=useState(false);
  const [form,setForm]=useState({name:"",email:email||"",phone:"",birthDate:"",sex:"",bloodType:"",photo:null,photoPreview:null,cpf:"",weight:"",height:"",continuousMeds:[],allergies:"",chronicConditions:"",doctorName:"",doctorClinic:""});
  const [errors,setErrors]=useState({});
  const [documents,setDocuments]=useState([]);
  const [uploadingDoc,setUploadingDoc]=useState(false);
  const up=(k,v)=>{setForm(p=>({...p,[k]:v}));setErrors(p=>({...p,[k]:undefined}))};
  const calcAge=(bd)=>{if(!bd)return"";const b=new Date(bd),n=new Date();let a=n.getFullYear()-b.getFullYear();if(n.getMonth()<b.getMonth()||(n.getMonth()===b.getMonth()&&n.getDate()<b.getDate()))a--;return String(a);};
  const calcBMI=(w,h)=>{if(!w||!h)return null;const b=parseFloat(w)/Math.pow(parseFloat(h)/100,2);return isNaN(b)?null:b.toFixed(1);};
  const formatCPF=(v)=>{const d=v.replace(/\D/g,"").slice(0,11);if(d.length<=3)return d;if(d.length<=6)return d.slice(0,3)+"."+d.slice(3);if(d.length<=9)return d.slice(0,3)+"."+d.slice(3,6)+"."+d.slice(6);return d.slice(0,3)+"."+d.slice(3,6)+"."+d.slice(6,9)+"-"+d.slice(9);};
  const v1=()=>{const e={};if(!form.name.trim())e.name="Nome e obrigatorio";if(Object.keys(e).length){setErrors(e);return false}return true};
  const addMed=()=>up("continuousMeds",[...form.continuousMeds,{name:"",dosage:"",frequency:""}]);
  const removeMed=(i)=>up("continuousMeds",form.continuousMeds.filter((_,idx)=>idx!==i));
  const updateMed=(i,f,v)=>up("continuousMeds",form.continuousMeds.map((m,idx)=>idx===i?{...m,[f]:v}:m));
  const save=()=>{setSaving(true);setTimeout(()=>{const bmi=calcBMI(form.weight,form.height);onComplete({name:form.name,birthDate:form.birthDate,age:calcAge(form.birthDate),sex:form.sex||"Nao informado",bloodType:form.bloodType||"",cpf:form.cpf||"",weight:form.weight||"",height:form.height||"",bmi:bmi||"",continuousMeds:form.continuousMeds,allergies:form.allergies||"",chronicConditions:form.chronicConditions||"",photo:form.photoPreview,doctorName:form.doctorName||"",doctorClinic:form.doctorClinic||"",documents});},1200)};
  const handlePhoto=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>up("photoPreview",ev.target.result);r.readAsDataURL(f);up("photo",f)}};
  const handleDocUpload=e=>{const files=Array.from(e.target.files);setUploadingDoc(true);setTimeout(()=>{const nd=files.map(f=>({id:Date.now()+Math.random(),name:f.name,type:f.type.includes("pdf")?"PDF":f.type.includes("image")?"Imagem":"Documento",size:(f.size/1024).toFixed(1)+"KB"}));setDocuments(p=>[...p,...nd]);setUploadingDoc(false);},800)};
  const iStyle=f=>({...baseInput,borderColor:errors[f]?C.err:C.border});
  const bmi=calcBMI(form.weight,form.height);
  if(saving)return(<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,fontFamily:FONT}}><div style={{textAlign:"center"}}><div style={{width:48,height:48,border:`3px solid ${C.border}`,borderTopColor:C.pri,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/><p style={{fontSize:15,fontWeight:700,color:C.text}}>Salvando dados...</p></div></div>);
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:C.bg,fontFamily:FONT}}>
      <div style={{padding:"13px 28px",borderBottom:`1px solid ${C.border}`,background:"#fff",display:"flex",alignItems:"center",gap:14}}>
        <button onClick={step>1?()=>setStep(s=>s-1):onCancel} style={{background:"none",border:"none",cursor:"pointer",padding:3,display:"flex"}}><I n="arrowL" s={18} c={C.textSec}/></button>
        <span style={{fontSize:15,fontWeight:700,color:C.text}}>Novo Perfil</span>
      </div>
      <div style={{padding:"16px 28px 0",background:"#fff"}}>
        <div style={{display:"flex",gap:6}}>{[1,2,3].map(s=>(<div key={s} style={{flex:1,height:3,borderRadius:2,background:s<=step?C.pri:C.border,transition:"all .3s"}}/>))}</div>
        <p style={{fontSize:12,color:C.textSec,margin:"6px 0 0"}}>Passo {step} de 3 — {step===1?"Dados pessoais":step===2?"Saude e documentos":"Revisao"}</p>
      </div>
      <div style={{flex:1,overflow:"auto",padding:"20px 28px",display:"flex",justifyContent:"center"}}>
        <div style={{maxWidth:440,width:"100%"}}>
          {step===1&&<>
            <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Nome completo *</label><input value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Ex: Maria Silva" style={iStyle("name")}/>{errors.name&&<p style={{color:C.err,fontSize:11,margin:"4px 0 0"}}>{errors.name}</p>}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Data de nascimento</label><input type="date" value={form.birthDate} onChange={e=>up("birthDate",e.target.value)} style={baseInput}/>{form.birthDate&&<p style={{fontSize:10,color:C.textMuted,margin:"3px 0 0"}}>Idade: {calcAge(form.birthDate)} anos</p>}</div>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Sexo</label><select value={form.sex} onChange={e=>up("sex",e.target.value)} style={{...baseInput,appearance:"auto"}}><option value="">Selecione</option><option>Masculino</option><option>Feminino</option><option>Outro</option></select></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>CPF</label><input value={form.cpf} onChange={e=>up("cpf",formatCPF(e.target.value))} placeholder="000.000.000-00" style={baseInput}/></div>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Tipo Sanguineo</label><select value={form.bloodType} onChange={e=>up("bloodType",e.target.value)} style={{...baseInput,appearance:"auto"}}><option value="">Selecione</option>{BLOOD_TYPES.map(b=><option key={b}>{b}</option>)}</select></div>
            </div>
            <div style={{marginTop:22,display:"flex",gap:10}}>
              <Btn variant="ghost" onClick={onCancel} style={{flex:1}}>Cancelar</Btn>
              <Btn onClick={()=>{if(v1())setStep(2)}} style={{flex:2}}>Continuar</Btn>
            </div>
          </>}
          {step===2&&<>
            <label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Foto (opcional)</label>
            <div style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:16,textAlign:"center",marginBottom:14,cursor:"pointer",background:C.bg}} onClick={()=>document.getElementById("pat-photo").click()}>
              {form.photoPreview?<div style={{position:"relative",display:"inline-block"}}><img src={form.photoPreview} style={{maxHeight:140,borderRadius:8,objectFit:"cover"}} alt=""/><button onClick={e=>{e.stopPropagation();up("photoPreview",null);up("photo",null)}} style={{position:"absolute",top:-6,right:-6,width:22,height:22,borderRadius:"50%",background:C.err,color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:700}}>x</button></div>:<><I n="camera" s={28} c={C.textMuted}/><p style={{fontSize:12,color:C.textMuted,margin:"6px 0 0"}}>Clique para adicionar foto</p></>}
              <input id="pat-photo" type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:8}}>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Peso (kg)</label><input type="number" step="0.1" min="0" value={form.weight} onChange={e=>up("weight",e.target.value)} placeholder="Ex: 68" style={baseInput}/></div>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Altura (cm)</label><input type="number" min="0" value={form.height} onChange={e=>up("height",e.target.value)} placeholder="Ex: 165" style={baseInput}/></div>
            </div>
            {bmi&&<div style={{margin:"0 0 12px",padding:"8px 12px",background:C.priLight,borderRadius:8,fontSize:11,color:C.pri,fontWeight:600}}>IMC: {bmi}</div>}
            <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Alergias</label><textarea value={form.allergies} onChange={e=>up("allergies",e.target.value)} placeholder="Ex: Dipirona, Penicilina..." rows={2} style={{...baseInput,resize:"vertical",minHeight:60,lineHeight:1.5}}/></div>
            <div style={{marginBottom:12}}><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Condicoes cronicas</label><textarea value={form.chronicConditions} onChange={e=>up("chronicConditions",e.target.value)} placeholder="Ex: Diabetes, Hipertensao..." rows={2} style={{...baseInput,resize:"vertical",minHeight:60,lineHeight:1.5}}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Medico de referencia</label><input value={form.doctorName} onChange={e=>up("doctorName",e.target.value)} placeholder="Nome do medico" style={baseInput}/></div>
              <div><label style={{fontSize:12,fontWeight:700,color:C.text,display:"block",marginBottom:5}}>Hospital / Clinica</label><input value={form.doctorClinic} onChange={e=>up("doctorClinic",e.target.value)} placeholder="Local ou telefone" style={baseInput}/></div>
            </div>
            <div style={{background:C.priGhost,borderRadius:12,padding:16,marginBottom:14,border:`1.5px dashed ${C.pri}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><I n="file" s={16} c={C.pri}/><span style={{fontSize:12,fontWeight:800,color:C.pri}}>DOCUMENTOS MEDICOS</span></div>
              <label htmlFor="pat-docs" style={{display:"block",cursor:"pointer"}}>
                <div style={{border:`2px dashed ${C.border}`,borderRadius:10,padding:"12px",textAlign:"center",background:"#fff"}}>
                  {uploadingDoc?<><div style={{width:24,height:24,border:`3px solid ${C.border}`,borderTopColor:C.pri,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 6px"}}/><p style={{fontSize:11,margin:0}}>Processando...</p></>:<><I n="clip" s={22} c={C.pri}/><p style={{fontSize:12,fontWeight:600,color:C.text,margin:"4px 0 2px"}}>Clique para adicionar</p><p style={{fontSize:10,color:C.textMuted,margin:0}}>PDF, imagens</p></>}
                </div>
              </label>
              <input id="pat-docs" type="file" multiple accept=".pdf,image/*,.doc,.docx" onChange={handleDocUpload} style={{display:"none"}}/>
              {documents.length>0&&<div style={{marginTop:8}}>{documents.map(doc=><div key={doc.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#fff",borderRadius:7,marginBottom:5,border:`1px solid ${C.border}`}}><I n="file" s={14} c={C.pri}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.name}</div><div style={{fontSize:9,color:C.textMuted}}>{doc.size}</div></div><button onClick={()=>setDocuments(p=>p.filter(d=>d.id!==doc.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:16,fontWeight:700,padding:2}}>x</button></div>)}</div>}
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="ghost" onClick={()=>setStep(1)} style={{flex:1}}>Voltar</Btn>
              <Btn onClick={()=>setStep(3)} style={{flex:2}}>Continuar</Btn>
            </div>
          </>}
          {step===3&&<>
            <div style={{background:"#fff",borderRadius:14,border:`1.5px solid ${C.border}`,padding:22,marginBottom:20}}>
              <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:16}}>
                {form.photoPreview?<img src={form.photoPreview} style={{width:60,height:60,borderRadius:12,objectFit:"cover"}} alt=""/>:<div style={{width:60,height:60,borderRadius:12,background:C.priGhost,display:"flex",alignItems:"center",justifyContent:"center"}}><I n="user" s={28} c={C.pri}/></div>}
                <div><h3 style={{fontSize:18,fontWeight:800,color:C.text,margin:0}}>{form.name}</h3><p style={{fontSize:12,color:C.textSec,margin:"3px 0 0"}}>{form.birthDate&&calcAge(form.birthDate)+" anos"} {form.bloodType&&"- "+form.bloodType}</p></div>
              </div>
              {form.chronicConditions&&<div style={{padding:"8px 0",borderTop:`1px solid ${C.borderLight}`}}><span style={{fontSize:12,color:C.textSec}}>Condicoes: </span><span style={{fontSize:12,fontWeight:600,color:C.text}}>{form.chronicConditions}</span></div>}
              {form.allergies&&<div style={{padding:"8px 0",borderTop:`1px solid ${C.borderLight}`}}><span style={{fontSize:12,color:C.textSec}}>Alergias: </span><span style={{fontSize:12,fontWeight:600,color:C.text}}>{form.allergies}</span></div>}
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="ghost" onClick={()=>setStep(2)} style={{flex:1}}>Voltar</Btn>
              <Btn onClick={save} style={{flex:2,background:C.ok,boxShadow:`0 4px 12px ${C.ok}30`}} icon={<I n="check" s={15} c="#fff"/>}>Salvar Perfil</Btn>
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
  const [profiles, setProfiles] = useState([]);
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

  if(screen==="welcome") return <WelcomeScreen onEnterEmail={()=>setScreen("email")} onProfessional={()=>alert("Area do profissional de saude em desenvolvimento")}/>;
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
          <PatientRegistration email={email}
            onCancel={()=>{setRegistering(false);setActiveNav("historico")}}
            onComplete={profile=>{setProfiles(p=>[...p,profile]);setRegistering(false);setActiveNav("historico");setToast({msg:`${profile.name} cadastrado com sucesso!`,type:"success"});}}/>
        ):activeNav==="chat"?(
          <ChatScreen
            profiles={profiles}
            showOnboarding={showOnboarding}
            consultations={consultations}
            activeConsultationId={activeConsultationId}
            onSaveConsultation={handleSaveConsultation}
            onNewConsultation={handleNewConsultation}
            onCompleteOnboarding={(profile)=>{setProfiles(p=>[...p,profile]);setShowOnboarding(false);setToast({msg:`${profile.name} cadastrado com sucesso!`,type:"success"});}}
            onSkipOnboarding={()=>setShowOnboarding(false)}
          />
        ):activeNav==="historico"?(
          <MeuHistoricoScreen profiles={profiles} onAddProfile={()=>setRegistering(true)} onRemoveProfile={idx=>setProfiles(p=>p.filter((_,i)=>i!==idx))}/>
        ):activeNav==="resumo"?(
          <ResumoScreen profiles={profiles} onAddProfile={()=>setRegistering(true)}/>
        ):null}
      </div>
    </div>
  );
}
