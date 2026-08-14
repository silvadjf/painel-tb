# Metodologia — Painel TB

Este documento espelha a regra metodológica implementada no painel web `painel-tb` e consolidada em `docs/fonte_da_verdade.md`. O projeto Power BI não redefine indicadores clínicos nem substitui os resultados já calculados: ele reutiliza os mesmos JSON e recalcula apenas a pontuação para auditoria.

## Unidade de análise

O painel acompanha nove indicadores estratégicos, I1 a I9, para Brasil, unidades da Federação e municípios. O Brasil funciona como referência nacional e não recebe pontuação. A visão municipal é exploratória e não deve ser interpretada como classificação oficial.

## Regra de pontuação

Para cada território e indicador avaliável:

- recebe **1 ponto** quando o valor do indicador é **igual ou superior à referência nacional** (`valor >= ref`);
- recebe **0 ponto** quando o valor é inferior à referência;
- quando o denominador é igual a zero, o indicador é tratado como **não avaliável** e não pontua.

O escore final é a soma dos pontos dos indicadores avaliáveis.

## Classificação territorial documentada

- **Grupo 1**: escore final >= 7;
- **Grupo 2**: escore final de 4 a 6;
- **Grupo 3**: escore final de 0 a 3;
- **Não classificável**: menos de 6 indicadores avaliáveis.

O percentual do escore é calculado como `escore / indicadores avaliáveis × 100` quando aplicável.

## Estabilidade do denominador

O painel preserva a flag de estabilidade associada a cada indicador. A metodologia web destaca alerta quando há pelo menos um indicador avaliável com denominador inferior a 20. As faixas encontradas no repositório são:

- denominador zero: não avaliável;
- 1 a 4: instabilidade extrema;
- 5 a 19: instável;
- 20 a 49: cautela;
- 50 ou mais: adequado.

Essas flags servem para interpretação da estabilidade do resultado; não alteram automaticamente a regra de ponto `valor >= ref`, exceto quando o indicador é não avaliável.

## Indicadores e referências

Os nomes, eixos e detalhes disponíveis de I1–I9 estão em `docs/fonte_da_verdade.md` e na dimensão `Dim_Indicador`. Os anos de referência não são uniformes: os valores nacionais atualmente materializados usam 2023, 2024 ou 2025 conforme o indicador.

## Município: regras adicionais e GAP metodológico

A visão municipal possui particularidades explicitamente documentadas no painel web:

- a classificação é **exploratória, não oficial**;
- I2 municipal possui apenas numerador e não pontua;
- I3 municipal utiliza denominador estimado/proxy;
- I1 em Santa Catarina está parcial;
- indicadores individuais, numeradores, denominadores e flags devem ser priorizados na interpretação.

O JSON municipal contém um campo `grupo` proveniente da base analítica de origem (`GRUPO_EXPLORATORIO`). Foram detectados registros em que esse grupo armazenado não coincide com os cortes 7/4/3 descritos para a regra geral. Por isso, o modelo Power BI mantém dois conceitos separados:

1. **GrupoFonte** — preserva exatamente o grupo existente no JSON, para equivalência com o painel web;
2. **Grupo Município pela regra documentada** — medida DAX que aplica os cortes Grupo 1 >=7, Grupo 2 4–6, Grupo 3 0–3 e mínimo de 6 avaliáveis.

Nenhum deles substitui o outro até que a CGTM confirme a regra municipal definitiva.

## GAP de qualificação clínica

O repositório contém nomes e alguns detalhes dos indicadores, mas não contém para todos os I1–I9 uma ficha clínica integral que especifique, de forma suficiente para reconstrução a partir de microdados, população elegível, numerador, denominador, variáveis, filtros de inclusão/exclusão, recodificações, tratamento de ignorados/nulos e demais regras operacionais.

Esses elementos permanecem marcados como **GAP**. O projeto Power BI não os infere. Até a validação da CGTM, a equivalência é assegurada pela reutilização dos numeradores, denominadores, valores, referências e pontos já materializados nos JSON do painel web.

## Fontes de dados citadas no painel web

A metodologia existente cita Sinan TB, base nacional de tratamento preventivo da tuberculose (IL-TB/TPT), planilha externa de CD4/Siscel e Site-TB. Também registra incorporação de sistemas locais para IL-TB em GO e SC na rotina de preparação. O detalhamento clínico completo dessas rotinas não está disponível no repositório.
