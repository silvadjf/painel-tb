// Metadados dos nove indicadores-chave do Plano Nacional pelo Fim da TB.
// Rótulos e definições conforme o levantamento de requisitos (CGTM) e a
// planilha de qualificação inicial de indicadores.

export const EIXOS = ['Prevenção', 'Diagnóstico laboratorial', 'Tratamento'];

export const INDICADORES = [
  {
    id: 'I1', eixo: 'Prevenção', curto: 'TPT esquema encurtado',
    nome: 'Percentual de pessoas em tratamento preventivo da TB (TPT) com uso de esquema encurtado',
    detalhe: 'Rifapentina + Isoniazida (3HP) entre as pessoas em TPT.',
  },
  {
    id: 'I2', eixo: 'Prevenção', curto: 'TPT em PVHA (CD4 ≤ 350)',
    nome: 'Cobertura estimada de TPT em pessoas vivendo com HIV/aids com CD4 ≤ 350',
    detalhe: 'Numerador da base de TPT; denominador de planilha externa CD4/Siscel.',
  },
  {
    id: 'I3', eixo: 'Prevenção', curto: 'TPT em contatos',
    nome: 'Cobertura estimada de TPT em contatos elegíveis',
    detalhe: 'Denominador estimado por premissa de contatos domiciliares e média de pessoas por domicílio.',
  },
  {
    id: 'I4', eixo: 'Diagnóstico laboratorial', curto: 'Contatos examinados',
    nome: 'Percentual de contatos examinados de casos novos de TB pulmonar com confirmação laboratorial',
    detalhe: 'Contatos examinados / contatos identificados.',
  },
  {
    id: 'I5', eixo: 'Diagnóstico laboratorial', curto: 'Confirmação laboratorial',
    nome: 'Percentual de casos de TB pulmonar com confirmação laboratorial',
    detalhe: '',
  },
  {
    id: 'I6', eixo: 'Diagnóstico laboratorial', curto: 'Casos novos com TRM',
    nome: 'Percentual de casos novos de TB pulmonar com teste rápido molecular (TRM)',
    detalhe: '',
  },
  {
    id: 'I7', eixo: 'Tratamento', curto: 'Coinfecção TB-HIV em TARV',
    nome: 'Percentual de casos de coinfecção TB-HIV em uso de terapia antirretroviral (TARV)',
    detalhe: '',
  },
  {
    id: 'I8', eixo: 'Tratamento', curto: 'Cura com confirmação lab.',
    nome: 'Percentual de cura de casos novos de TB pulmonar com confirmação laboratorial',
    detalhe: '',
  },
  {
    id: 'I9', eixo: 'Tratamento', curto: 'Sucesso TB-RR/MDR',
    nome: 'Percentual de sucesso de tratamento de casos novos de TB multirresistente/resistente à rifampicina',
    detalhe: 'Inclui desfechos "Tratamento completo" e "Curado" (Site-TB).',
  },
];

export const GRUPOS = [
  { id: 'Grupo 1', rotulo: 'Grupo 1 · Desempenho adequado', regra: 'Escore final ≥ 7' },
  { id: 'Grupo 2', rotulo: 'Grupo 2 · Desempenho mediano', regra: 'Escore final entre 4 e 6' },
  { id: 'Grupo 3', rotulo: 'Grupo 3 · Desempenho crítico', regra: 'Escore final entre 0 e 3' },
  { id: 'Não classificável', rotulo: 'Não classificável', regra: 'Menos de 6 indicadores avaliáveis' },
];

// cores por tema (claro/escuro), seguindo o mockup: G1 azul, G2 ocre, G3 vermelho
export const COR_GRUPO = {
  light: {
    'Grupo 1': '#4C7FC4', 'Grupo 2': '#D9B53C', 'Grupo 3': '#C62828',
    'Não classificável': '#9aa4b2', 'Referência nacional': '#3b82f6',
  },
  dark: {
    'Grupo 1': '#5E93D8', 'Grupo 2': '#E8C84A', 'Grupo 3': '#EF4444',
    'Não classificável': '#7d8794', 'Referência nacional': '#3b82f6',
  },
};

export const REGIOES = ['Norte', 'Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste'];

export const ROTULO_FLAG = {
  nao_avaliavel_denominador_zero: 'não avaliável (denominador zero)',
  instavel_extremo_den_1_4: 'denominador instável extremo (1–4)',
  instavel_den_5_19: 'denominador instável (5–19)',
  cautela_den_20_49: 'cautela (denominador 20–49)',
  adequado_den_50_mais: 'denominador adequado (≥ 50)',
};

// rótulos da base municipal exploratória (códigos abreviados no JSON)
export const ALERTA_MUN = {
  s: 'classificação suspensa por baixa avaliabilidade',
  ip: 'indicador com denominador instável + proxy metodológico',
  p: 'proxy metodológico',
  i: 'indicador com denominador instável',
  ok: 'sem alerta de denominador',
};

export const FLAG_MUN = {
  z: 'denominador zero (não avaliável)',
  e: 'denominador instável extremo (1–4)',
  i: 'denominador instável (5–19)',
  c: 'cautela (denominador 20–49)',
  a: 'denominador adequado (≥ 50)',
  x: 'denominador ausente',
};

export const fmt = (v, casas = 1) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
