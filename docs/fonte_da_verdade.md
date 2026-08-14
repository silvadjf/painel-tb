# Fonte da verdade — Painel TB

Data da extração: 2026-08-13  
Repositório analisado: `silvadjf/painel-tb` (`main`)  
Escopo: equivalência do painel React/Vite/MapLibre em Power BI, sem redefinição clínica ou metodológica.

## 1. Hierarquia de fontes dentro do repositório

A implementação Power BI deve tratar como verdade, nesta ordem:

1. `src/dados/indicadores.json` — dados Brasil/UF já calculados, incluindo referência nacional, ponto, escore e grupo.
2. `public/dados/municipios.json` — dados municipais exploratórios já calculados e comprimidos.
3. `src/data/meta.js` — rótulos, eixos, detalhes disponíveis, grupos, cores e flags.
4. `src/components/Metodos.jsx` e `README.md` — regra explícita de pontuação/classificação e alertas.
5. `tools/preparar_dados.py` — transformação dos CSV analíticos do projeto R para os dois JSON consumidos pelo painel.

O Power BI **não recalcula os indicadores clínicos a partir de bases brutas**. Ele importa os mesmos numeradores, denominadores, valores e referências já materializados no painel web e recalcula somente as regras de pontuação/escore para fins de validação e análise.

## 2. Regra de pontuação e classificação

Regra documentada no repositório:

- indicador avaliável: denominador disponível e diferente de zero;
- ponto: `1` se `valor >= referência nacional`; caso contrário, `0`;
- denominador zero: não avaliável e não pontua;
- Brasil: somente referência nacional, sem pontuação;
- escore final: soma dos pontos;
- Grupo 1: escore >= 7;
- Grupo 2: escore entre 4 e 6;
- Grupo 3: escore entre 0 e 3;
- Não classificável: menos de 6 indicadores avaliáveis;
- alerta de instabilidade: pelo menos um indicador avaliável com denominador < 20.

Flags de denominador existentes no JSON Brasil/UF:

- `nao_avaliavel_denominador_zero`;
- `instavel_extremo_den_1_4`;
- `instavel_den_5_19`;
- `cautela_den_20_49`;
- `adequado_den_50_mais`.

## 3. Indicadores I1–I9 extraídos do repositório

> **Regra de governança:** a coluna “Definição clínica completa” só é preenchida quando o próprio repositório contém uma ficha suficientemente completa. O repositório contém nomes e alguns detalhes operacionais, mas não contém critérios completos de inclusão/exclusão, variáveis e recodificações clínicas para nenhum dos nove indicadores. Portanto, todos permanecem com GAP de qualificação clínica completa. O Power BI preserva os valores já calculados; não inventa critérios ausentes.

| ID | Eixo | Nome no repositório | Detalhe disponível no repositório | Definição clínica completa |
|---|---|---|---|---|
| I1 | Prevenção | Percentual de pessoas em tratamento preventivo da TB (TPT) com uso de esquema encurtado | Rifapentina + Isoniazida (3HP) entre as pessoas em TPT. | **GAP** — faltam critérios completos de elegibilidade, período e filtros da base. |
| I2 | Prevenção | Cobertura estimada de TPT em pessoas vivendo com HIV/aids com CD4 ≤ 350 | Numerador da base de TPT; denominador de planilha externa CD4/Siscel. | **GAP** — faltam a especificação do denominador externo e os critérios completos de elegibilidade. |
| I3 | Prevenção | Cobertura estimada de TPT em contatos elegíveis | Denominador estimado por premissa de contatos domiciliares e média de pessoas por domicílio. | **GAP** — faltam a fórmula integral do proxy e os parâmetros usados na preparação da base. |
| I4 | Diagnóstico laboratorial | Percentual de contatos examinados de casos novos de TB pulmonar com confirmação laboratorial | Contatos examinados / contatos identificados. | **GAP** — faltam filtros completos para caso índice, contatos e janela de avaliação. |
| I5 | Diagnóstico laboratorial | Percentual de casos de TB pulmonar com confirmação laboratorial | Sem detalhe adicional em `meta.js`. | **GAP**. |
| I6 | Diagnóstico laboratorial | Percentual de casos novos de TB pulmonar com teste rápido molecular (TRM) | Sem detalhe adicional em `meta.js`. | **GAP**. |
| I7 | Tratamento | Percentual de casos de coinfecção TB-HIV em uso de terapia antirretroviral (TARV) | Sem detalhe adicional em `meta.js`. | **GAP**. |
| I8 | Tratamento | Percentual de cura de casos novos de TB pulmonar com confirmação laboratorial | Sem detalhe adicional em `meta.js`. | **GAP**. |
| I9 | Tratamento | Percentual de sucesso de tratamento de casos novos de TB multirresistente/resistente à rifampicina | Sucesso inclui os desfechos “Tratamento completo” e “Curado” (Site-TB). | **GAP** — faltam os demais filtros completos da população TB-RR/MDR e do período. |

### GAP que precisa de decisão da CGTM

Antes de considerar a qualificação clínica dos indicadores validada, a CGTM deve fornecer/confirmar, para I1–I9: população elegível, numerador, denominador, filtros de inclusão/exclusão, variáveis de origem, recodificações, tratamento de ignorados/nulos, período e fonte oficial. Até essa confirmação, o projeto Power BI deve reproduzir os **resultados calculados** do JSON, não reconstruir a epidemiologia a partir de microdados.

## 4. Dados Brasil/UF — dump representativo

Metadados atuais de `src/dados/indicadores.json`:

- `geradoEm`: `2026-07-09`;
- fonte: `base_analitica_indicador_composto_long_28abr26.csv`;
- escopo: Brasil + 27 UFs.

Referências nacionais materializadas:

| Indicador | Ano | Numerador BR | Denominador BR | Valor/Referência |
|---|---:|---:|---:|---:|
| I1 | 2025 | 38.582 | 47.273 | 81,62 |
| I2 | 2025 | 7.878 | 61.383 | 12,83 |
| I3 | 2025 | 22.401 | 116.149,9150943396 | 19,2863 |
| I4 | 2024 | 120.982 | 168.932 | 71,6 |
| I5 | 2025 | 54.809 | 73.652 | 74,4 |
| I6 | 2025 | 42.857 | 73.652 | 58,2 |
| I7 | 2025 | 7.958 | 11.968 | 66,5 |
| I8 | 2024 | 36.652 | 55.163 | 66,4 |
| I9 | 2023 | 439 | 791 | 55,5 |

Exemplo real — Acre (`cod=12`): 9 indicadores avaliáveis, 7 atingidos, escore 7, Grupo 1. O I1 tem valor 75,12, referência 81,62 e ponto 0; I2 tem 42,01 versus 12,83 e ponto 1; I9 tem 88,9 versus 55,5 e ponto 1. Essa amostra confirma que a regra efetivamente armazenada é `valor >= ref`.

## 5. Unidades da Federação presentes

| Código IBGE | UF | Sigla | Região |
|---:|---|---|---|
| 11 | Rondônia | RO | Norte |
| 12 | Acre | AC | Norte |
| 13 | Amazonas | AM | Norte |
| 14 | Roraima | RR | Norte |
| 15 | Pará | PA | Norte |
| 16 | Amapá | AP | Norte |
| 17 | Tocantins | TO | Norte |
| 21 | Maranhão | MA | Nordeste |
| 22 | Piauí | PI | Nordeste |
| 23 | Ceará | CE | Nordeste |
| 24 | Rio Grande do Norte | RN | Nordeste |
| 25 | Paraíba | PB | Nordeste |
| 26 | Pernambuco | PE | Nordeste |
| 27 | Alagoas | AL | Nordeste |
| 28 | Sergipe | SE | Nordeste |
| 29 | Bahia | BA | Nordeste |
| 31 | Minas Gerais | MG | Sudeste |
| 32 | Espírito Santo | ES | Sudeste |
| 33 | Rio de Janeiro | RJ | Sudeste |
| 35 | São Paulo | SP | Sudeste |
| 41 | Paraná | PR | Sul |
| 42 | Santa Catarina | SC | Sul |
| 43 | Rio Grande do Sul | RS | Sul |
| 50 | Mato Grosso do Sul | MS | Centro-Oeste |
| 51 | Mato Grosso | MT | Centro-Oeste |
| 52 | Goiás | GO | Centro-Oeste |
| 53 | Distrito Federal | DF | Centro-Oeste |

## 6. Dados municipais — verdade disponível e limitação de nomes

Metadados atuais de `public/dados/municipios.json`:

- `geradoEm`: `2026-07-09`;
- fonte: `base_analitica_indicadores_municipio_I1_I9_exploratoria.csv`;
- `excluidosCodigoInvalido`: 70;
- cada município é indexado pelo **código IBGE de 6 dígitos usado pelo painel**;
- o JSON não armazena nome de município. O painel web resolve o nome em tempo de execução pela API de Localidades do IBGE e converte o identificador IBGE de 7 dígitos para os primeiros 6 dígitos, exatamente como faz para a malha geográfica.

A lista completa de códigos presentes deve ser produzida de maneira determinística pelo script `tools/validar_powerbi.py`, que lê diretamente `public/dados/municipios.json` e gera `docs/municipios_presentes.csv` durante a validação. Os nomes são enriquecidos pela mesma API do IBGE já utilizada pelo painel web; se a API estiver indisponível, o código continua sendo a chave oficial e o campo de nome fica explicitamente pendente, sem imputação.

A estrutura municipal é comprimida:

```json
{
  "110002": {
    "uf": "RO",
    "aval": 8.0,
    "ating": 5.0,
    "escore": 5.0,
    "grupo": "Grupo 2",
    "alerta": "ip",
    "inst": 3.0,
    "proxy": 3.0,
    "ind": {
      "I1": [46.0, 62.0, 74.19, 0.0, "a"],
      "I2": [4.0, null, null, null, "x"],
      "I3": [33.0, 50.09433962264151, 65.88, 1.0, "a"]
    }
  }
}
```

A ordem de cada array municipal é: `[numerador, denominador, valor, ponto, flag]`.

### Particularidades municipais já declaradas pelo painel web

- classificação municipal é **exploratória, não oficial**;
- I2 municipal possui apenas numerador e não pontua;
- I3 municipal usa denominador estimado/proxy;
- I1 em Santa Catarina é parcial;
- os indicadores individuais, numerador e denominador são a leitura principal;
- códigos fora do padrão aceito pelo script são excluídos.

## 7. Inconsistência detectada que não deve ser corrigida silenciosamente

O campo municipal `grupo` vem de `GRUPO_EXPLORATORIO` na base de origem. Há registros do JSON municipal cuja combinação `aval/escore/grupo` não coincide com os cortes documentados para UF (por exemplo, há município com 6 avaliáveis e escore 3 armazenado como Grupo 2, e outro com 6 avaliáveis e escore 6 armazenado como Grupo 1).

Consequência para o Power BI:

- preservar `GrupoFonte` exatamente como veio do JSON para equivalência com a visão municipal atual;
- expor separadamente a medida `Grupo pela regra documentada`, calculada pelos cortes 7/4/3 e mínimo de 6 avaliáveis;
- **não substituir um pelo outro até a CGTM confirmar a regra municipal**.

Esse ponto é um GAP metodológico objetivo, não uma decisão de design.

## 8. Anos e fontes citados pela metodologia web

Os indicadores usam anos distintos entre 2023 e 2025. O componente de metodologia cita Sinan TB, base nacional de TPT (IL-TB), planilha externa CD4/Siscel e Site-TB. GO e SC possuem dados locais de IL-TB incorporados na rotina de preparação. O repositório não contém a especificação clínica integral dessas rotinas.

## 9. Regra de não derivação

Qualquer informação que não esteja neste documento ou nos arquivos de origem acima deve ser tratada como `GAP`, `PENDENTE` ou `NÃO DISPONÍVEL`. Não preencher números, filtros clínicos, referências ou parâmetros por inferência.
