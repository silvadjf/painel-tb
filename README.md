# Painel Brasil Livre da TB — Monitoramento estratégico

Painel de monitoramento de informações estratégicas do **Plano Nacional pelo Fim
da Tuberculose como Problema de Saúde Pública** (indicador composto I1–I9),
construído com React + Vite + MapLibre GL como site 100% estático.

> **Status: versão de desenvolvimento — não publicada.** Os dados vêm de base
> analítica interna validada (28/abr/2026); a publicação depende de aprovação
> da área técnica (CGTM) e da ASCOM.

## Fluxo de dados

```
Projeto R "Brasil livre da TB" (OneDrive)
  ├─ resultados/base_analitica_indicador_composto_long_*.csv        (Brasil/UF)
  └─ resultados/base_analitica_indicadores_municipio_I1_I9_*.csv    (municipal)
       └─ python tools/preparar_dados.py   (ou: npm run dados)
            ├─ src/dados/indicadores.json      (UF; empacotado no build)
            └─ public/dados/municipios.json    (municipal; carregado sob demanda)
```

Quando a base R for atualizada, basta rodar `npm run dados` (ajustando o
caminho do CSV em `tools/preparar_dados.py`, se mudar de nome) e recompilar.

## Rodar localmente

```bash
npm install
npm run dev     # http://localhost:5173
```

## Estrutura

```
tools/preparar_dados.py   # CSV longo (R) -> JSON do painel
src/
  dados/indicadores.json  # dados empacotados (gerado, 27 UFs + Brasil)
  data/meta.js            # rótulos I1-I9, eixos, cores de grupo, regiões
  components/
    Header.jsx            # cabeçalho + tema claro/escuro
    Filtros.jsx           # Região / Eixo temático / Categoria
    ScoreCards.jsx        # contagem de UFs por grupo
    MapaUF.jsx            # coroplético por grupo (malha IBGE)
    TabelaUF.jsx          # UF × indicadores com barras vs referência
    DetalheUF.jsx         # detalhamento da UF selecionada / referências BR
    Indicadores.jsx       # 9 cards com definição e referência nacional
    Metodos.jsx           # critérios: escore, grupos, alertas de denominador
```

## Regras implementadas (conforme README de validação da base)

- Ponto por indicador: `VALOR >= REF` → 1; senão 0; denominador zero → não avaliável.
- Escore final: soma dos pontos (0–9). Brasil é somente referência.
- Grupos: 1 (escore ≥ 7), 2 (4–6), 3 (0–3); "Não classificável" (< 6 avaliáveis).
- Alerta ⚠ quando há indicador avaliável com denominador instável (< 20).

## Visão municipal (exploratória)

Implementada conforme a proposta metodológica enviada à CGTM (jul/2026):

- Grupo municipal apresentado **somente como "exploratório"**, nunca como
  classificação oficial, com aviso destacado.
- Leitura principal: indicadores individuais com numerador, denominador,
  valor, referência nacional, ponto e flag de estabilidade do denominador.
- I2 não pontua (sem denominador municipal); I3 usa proxy; I1 em SC é parcial.
- Nomes de município enriquecidos em runtime via API de localidades do IBGE
  (equivalente à "tabela dimensão municipal" sugerida para o Power BI).
- 70 registros com código fora do padrão IBGE são excluídos pelo script de
  preparação (reportados no console).

## Próximas fases

- Publicação (GitHub Pages ou infraestrutura do Ministério) após aprovação.
