# Checklist de revisão visual — Power BI

Esta etapa é deliberadamente manual. Os critérios abaixo devem ser executados abrindo `powerbi/PainelTB.pbip` no Power BI Desktop após todos os testes automatizados passarem. Preencha cada item com `PASS` ou `FAIL` e, quando houver falha, registre uma observação objetiva e reproduzível.

## 1. Abertura e atualização do projeto

- [ ] **PBIP abre sem reparo** — `PainelTB.pbip` abre sem mensagem de arquivo corrompido, conversão forçada, recuperação ou remoção automática de objetos. Resultado: ______
- [ ] **Modelo TMDL carrega integralmente** — aparecem `Fato_Indicadores`, `Dim_UF`, `Dim_Municipio`, `Dim_Indicador`, `Dim_Tempo` e `Medidas`. Resultado: ______
- [ ] **Atualização completa sem erro** — `Atualizar` conclui sem erro de Power Query, credencial, firewall ou API. Resultado: ______
- [ ] **Contagens pós-refresh** — confirmar: 27 UFs; 9 indicadores; 4.669 municípios; 243 linhas UF×indicador; nenhuma chave órfã indicada pelo modelo. Resultado: ______

## 2. Visão Brasil

- [ ] **Página carrega sem visual quebrado** — nenhum visual exibe erro ou campo ausente. Resultado: ______
- [ ] **Cartões de classificação são coerentes** — a soma de Grupo 1 + Grupo 2 + Grupo 3 + Não classificável é 27. Resultado: ______
- [ ] **Tipografia e espaçamento** — títulos, rótulos e cartões não apresentam truncamento ou sobreposição em 100% de zoom. Resultado: ______

## 3. Visão UF

- [ ] **Mapa carrega todas as UFs** — as 27 UFs são reconhecidas geograficamente e nenhum estado é geocodificado fora do Brasil. Resultado: ______
- [ ] **Mapa se comporta como coroplético/preenchido** — a representação territorial é por área da UF, não por pontos/bubbles. Se o Azure Maps abrir em camada pontual, marcar `FAIL`. Resultado: ______
- [ ] **Cores dos grupos** — Grupo 1 usa a cor do tema `#2E6FAD`, Grupo 2 `#D9B53C`, Grupo 3 `#C62828` e Não classificável `#667085`, ou a correspondência configurada no visual sem inversão de categorias. Resultado: ______
- [ ] **Tooltip UF** — ao apontar uma UF, o tooltip mostra escore, indicadores avaliáveis e alerta de instabilidade sem erro. Resultado: ______
- [ ] **Pontuação auditável** — selecionar pelo menos AC, AM, SP, RJ e RS e comparar o escore exibido com `src/dados/indicadores.json`; tolerância exigida: zero. Resultado: ______

## 4. Visão Município

- [ ] **Municípios carregam e são geocodificados corretamente** — testar pelo menos cinco municípios de UFs distintas; nenhum deve aparecer na UF ou país errado. Resultado: ______
- [ ] **Classificação identificada como exploratória** — título/subtítulo deixa claro que a classificação municipal não é oficial. Resultado: ______
- [ ] **GrupoFonte preservado** — o visual usa a classificação do JSON municipal, sem substituir silenciosamente pelos cortes documentados. Resultado: ______
- [ ] **Regra recalculada disponível separadamente** — `Grupo Município pela regra documentada` está disponível no modelo para auditoria e não sobrescreve `GrupoFonte`. Resultado: ______
- [ ] **I2 municipal** — ao inspecionar I2, denominador/ponto ausentes não são convertidos para zero avaliável. Resultado: ______
- [ ] **I3 municipal** — a interpretação/tooltip não omite que o denominador é estimado/proxy. Resultado: ______

## 5. Ficha por indicador

- [ ] **I1–I9 presentes uma vez cada** — a tabela apresenta exatamente os nove identificadores sem duplicação. Resultado: ______
- [ ] **Nomes e eixos** — nomes e eixos coincidem com `docs/fonte_da_verdade.md`. Resultado: ______
- [ ] **Ano e referência nacional** — conferir I1, I4, I8 e I9 contra o JSON de origem; tolerância: zero. Resultado: ______
- [ ] **GAP clínico visível** — indicadores sem qualificação clínica completa continuam marcados como `GAP`, sem texto inferido pelo Power BI. Resultado: ______

## 6. Metodologia

- [ ] **Regra de ponto** — texto informa `valor ≥ referência nacional`; denominador zero é não avaliável. Resultado: ______
- [ ] **Classificação** — Grupo 1 ≥ 7; Grupo 2 = 4–6; Grupo 3 = 0–3; menos de 6 avaliáveis = Não classificável. Resultado: ______
- [ ] **Alerta** — denominador < 20 é explicitamente identificado como instabilidade. Resultado: ______
- [ ] **GAP municipal** — a divergência entre `GrupoFonte` municipal e a regra documentada é explicitada, não ocultada. Resultado: ______

## 7. Interação, filtros e desempenho

- [ ] **Filtros cruzados** — qualquer seleção disponível no mapa/tabela deve filtrar os demais visuais da mesma página de maneira coerente e sem ambiguidade. Se a página possuir apenas um visual interativo, registrar `N/A — sem segundo visual` em vez de presumir PASS. Resultado: ______
- [ ] **Troca de UF** — após o primeiro carregamento, medir três trocas de UF; nenhuma deve manter spinner por mais de 3 segundos em máquina de trabalho padrão. Tempos: ______ / ______ / ______ s. Resultado: ______
- [ ] **Troca de município** — após o primeiro carregamento, medir três seleções; nenhuma deve manter spinner por mais de 3 segundos. Tempos: ______ / ______ / ______ s. Resultado: ______
- [ ] **Ausência de caminhos ambíguos** — filtros de UF e município não produzem totais inesperados, duplicados ou propagação circular. Resultado: ______

## 8. Decisão do checkpoint

- [ ] **CHECKPOINT VISUAL APROVADO** — todos os itens aplicáveis acima estão em `PASS` ou `N/A` justificado.

### Falhas a devolver para nova rodada

Registrar somente itens objetivos, um por linha, no formato:

`[seção.item] FAIL — comportamento observado — comportamento esperado — passos para reproduzir`

Exemplo: `3.2 FAIL — Azure Maps mostra bolhas nos centroides — esperado preenchimento por UF — abrir Visão UF após refresh.`
