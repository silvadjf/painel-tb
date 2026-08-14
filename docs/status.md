# Status — projeto Power BI do Painel TB

Data: 2026-08-13/14  
Branch de trabalho: `feature/powerbi-pbip`  
Última validação automatizada completa: GitHub Actions `Validate Power BI project`, run 12 (`31765195794`) — **SUCCESS**.

## Situação geral

O projeto PBIP/TMDL foi construído a partir dos mesmos arquivos JSON consumidos pelo painel web, sem reconstrução clínica dos indicadores a partir de microdados e sem geração de números fictícios. A validação automatizada bloqueante está concluída com **PASS**. Resta o checkpoint humano no Power BI Desktop descrito em `docs/checklist_revisao_visual.md`.

## Entregáveis implementados

- `powerbi/PainelTB.pbip` — projeto Power BI versionável.
- `powerbi/PainelTB.SemanticModel/` — modelo semântico em TMDL.
- `powerbi/PainelTB.Report/` — definição PBIR do relatório e tema.
- `docs/fonte_da_verdade.md` — extração de verdade do repositório web.
- `docs/municipios_presentes.csv` — lista integral das 4.669 chaves municipais presentes no JSON, com enriquecimento de código IBGE de 7 dígitos e nome quando a API de Localidades possui correspondência.
- `docs/metodologia.md` — metodologia textual espelhada da implementação web.
- `docs/checklist_revisao_visual.md` — checkpoint humano objetivo.
- `tools/validar_powerbi.py` — testes determinísticos de dados, pontuação, relacionamentos, PBIR, tema e contraste.
- `tools/critico_powerbi.py` — crítico com teto de cinco iterações e parada por estagnação.
- `tools/gerar_municipios_presentes.py` — geração determinística da lista municipal.
- `.github/workflows/validate-powerbi.yml` — execução automatizada no GitHub Actions, incluindo validador oficial do PBIR.

## O que passou 100% automatizado

### ETL/dados

**PASS**

- 27 UFs presentes.
- 243 linhas mínimas no grão UF × indicador (27 × 9).
- zero duplicatas na chave UF + indicador + ano.
- I1–I9 presentes e sem indicador órfão.
- zero UF órfã.
- transformação municipal replicada independentemente em Python: 23.107 linhas indicador-território.
- 4.669 chaves territoriais municipais únicas preservadas.
- lista `docs/municipios_presentes.csv` gerada a partir do JSON municipal e da API de Localidades do IBGE.

A consulta M é validada pelo fallback explicitamente aceito para o projeto: um script Python independente replica a leitura/normalização e verifica a estrutura diretamente contra os JSON de origem. A execução efetiva do refresh pelo motor M do Power BI Desktop permanece no checkpoint humano, pois o runner Linux não contém o mashup engine do Desktop.

### Modelo semântico/DAX

**PASS**

- regra recalculada: ponto = 1 quando `valor >= referência`; denominador zero/ausente = não avaliável;
- comparação de ponto para todos os 27 × 9 registros de UF: **0 divergências**;
- comparação do escore recalculado para todas as 27 UFs: **0 divergências**, tolerância zero;
- quatro relacionamentos do esquema estrela esperados;
- nenhum relacionamento bidirecional;
- chaves de `Dim_UF`, `Dim_Indicador` e `Dim_Municipio` únicas.

### Relatório/PBIR e tema

**PASS**

- todos os JSON/PBIR parseiam sem erro;
- Microsoft Power BI Report Authoring CLI: **succeeded, 0 errors, 0 warnings**;
- páginas presentes: Visão Brasil, Visão UF, Visão Município, Ficha por indicador e Metodologia;
- `pageOrder` completo;
- todo visual definido possui título;
- I1–I9 aparecem na ficha por indicador;
- visuais Azure Maps presentes para UF e município;
- página interna de metodologia presente;
- `theme.json` válido contra o schema de tema do Power BI usado no projeto;
- contraste WCAG AA >= 4,5:1 em todos os pares testados:
  - Grupo 1: 5,26:1;
  - Grupo 2: 8,98:1;
  - Grupo 3: 5,62:1;
  - Não classificável: 4,97:1;
  - texto principal: 17,74:1;
  - texto secundário: 10,46:1.

### Documentação/metodologia

**PASS**

- `fonte_da_verdade.md` contém os nove indicadores, referências, regra de pontuação, fontes disponíveis e GAPs;
- `metodologia.md` reproduz os cortes de classificação e a regra de avaliabilidade;
- nenhuma definição clínica ausente foi preenchida por inferência.

## WARN/GAPs objetivos que permanecem

### 1. Qualificação clínica completa de I1–I9

**GAP — depende de validação/fornecimento pela CGTM.**

O repositório web fornece nomes e, para alguns indicadores, detalhes operacionais, mas não contém para todos os I1–I9 a ficha integral necessária para reconstrução clínica a partir de microdados: população elegível, numerador, denominador, filtros de inclusão/exclusão, variáveis, recodificações, tratamento de ignorados/nulos e demais regras operacionais.

Consequência: o PBIP utiliza exatamente os numeradores, denominadores, valores e referências já calculados nos JSON. Não tenta reconstruí-los clinicamente.

### 2. Grupo municipal versus regra documentada

**WARN metodológico — 588 registros municipais divergentes.**

Há 588 territórios em que `GrupoFonte` do JSON municipal não coincide com a classificação produzida pelos cortes documentados (Grupo 1 >= 7; Grupo 2 = 4–6; Grupo 3 = 0–3; não classificável com menos de 6 avaliáveis).

Tratamento adotado:

- `GrupoFonte` é preservado para equivalência com o painel web atual;
- a medida `Grupo Município pela regra documentada` é disponibilizada separadamente;
- nenhuma correção silenciosa foi aplicada;
- a CGTM precisa definir qual regra municipal deve ser oficializada antes de substituir a classificação de origem.

### 3. Quatro códigos territoriais sem correspondência na API atual do IBGE

**GAP de identificação territorial, sem imputação.**

Entre as 4.669 chaves presentes em `municipios.json`, 4 não obtiveram correspondência na API de Localidades do IBGE usada para enriquecimento: `240000`, `330000`, `350958` e `350999`.

Essas chaves permanecem em `docs/municipios_presentes.csv`, com o código de 6 dígitos da fonte preservado e `STATUS_RESOLUCAO = GAP_SEM_CORRESPONDENCIA_API_IBGE`. Nome e código de 7 dígitos ficam vazios deliberadamente. Devem ser investigados na base analítica de origem; não foram imputados.

## Pendente de checkpoint humano

O runner automatizado não substitui o Power BI Desktop para os itens abaixo. A revisão deve seguir `docs/checklist_revisao_visual.md`:

- abertura do `.pbip` sem reparo/conversão inesperada;
- refresh real das partições Power Query M;
- renderização do Azure Maps;
- confirmação de que o mapa de UF está efetivamente em camada coroplética/preenchida e não em bubbles;
- geocodificação correta de UF e município;
- tooltips;
- aplicação visual efetiva da paleta dos grupos;
- comportamento de filtros/interações entre visuais quando aplicável;
- desempenho ao trocar UF/município;
- ausência de truncamento/sobreposição no layout.

## Estado para validação da CGTM

**Automação: APROVADA.**  
**Validação visual no Desktop: PENDENTE.**  
**Qualificação clínica completa dos I1–I9: GAP PENDENTE DA CGTM.**  
**Regra municipal oficial: GAP PENDENTE DA CGTM.**

Nenhuma etapa pendente acima deve ser tratada como implicitamente aprovada antes do retorno do checkpoint humano ou da definição técnica correspondente.
