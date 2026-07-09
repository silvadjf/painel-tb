# -*- coding: utf-8 -*-
"""
Converte as bases analíticas do projeto R "Brasil livre da TB" nos JSON
consumidos pelo painel web.

Uso:
    python tools/preparar_dados.py [csv_uf] [csv_municipal]

Sem argumentos, usa os caminhos padrão da pasta de resultados no OneDrive.
Saídas:
    src/dados/indicadores.json      (Brasil + UF; empacotado no build)
    public/dados/municipios.json    (base municipal EXPLORATÓRIA; carregada
                                     sob demanda pelo navegador)
"""
import csv
import json
import sys
from datetime import date
from pathlib import Path

BASE_RESULTADOS = (
    r"C:\Users\david\OneDrive - Ministério da Saúde"
    r"\David - Episus - Produtos Episus\Painéis\Brasil livre da TB\resultados"
)
PADRAO = BASE_RESULTADOS + r"\base_analitica_indicador_composto_long_28abr26.csv"
PADRAO_MUN = BASE_RESULTADOS + r"\base_analitica_indicadores_municipio_I1_I9_exploratoria.csv"

REGIOES = {"1": "Norte", "2": "Nordeste", "3": "Sudeste", "4": "Sul", "5": "Centro-Oeste"}
UFS_VALIDAS = {
    "11", "12", "13", "14", "15", "16", "17",
    "21", "22", "23", "24", "25", "26", "27", "28", "29",
    "31", "32", "33", "35", "41", "42", "43", "50", "51", "52", "53",
}

# abreviações para reduzir o tamanho do JSON municipal
FLAG_ABREV = {
    "nao_avaliavel_denominador_zero": "z",
    "instavel_extremo_den_1_4": "e",
    "instavel_den_5_19": "i",
    "cautela_den_20_49": "c",
    "adequado_den_50_mais": "a",
    "denominador_ausente": "x",
}
ALERTA_ABREV = {
    "classificação_suspensa_por_baixa_avaliabilidade": "s",
    "classificação_com_indicador_instável_e_proxy_metodológico": "ip",
    "classificação_com_proxy_metodológico": "p",
    "classificação_com_indicador_instável": "i",
    "classificação_sem_alerta_denominador": "ok",
}


def num(txt):
    """Converte número no formato pt-BR ('81,6200') para float; vazio -> None."""
    txt = (txt or "").strip()
    if txt == "" or txt.upper() == "NA":
        return None
    return float(txt.replace(",", "."))


def preparar_municipios(origem, destino):
    """Base municipal exploratória (uma linha por município × indicador)."""
    municipios = {}
    excluidos = set()
    with origem.open(encoding="utf-8-sig") as f:
        for linha in csv.DictReader(f, delimiter=";"):
            cod = linha["COD_TERRITORIO"].strip()
            if cod[:2] not in UFS_VALIDAS:
                excluidos.add(cod)  # código fora do padrão IBGE: sem malha/nome
                continue
            m = municipios.setdefault(
                cod,
                {
                    "uf": linha["SIGLA_UF"].strip(),
                    "aval": num(linha["INDICADORES_AVALIAVEIS"]),
                    "ating": num(linha["INDICADORES_ATINGIDOS"]),
                    "escore": num(linha["ESCORE_FINAL"]),
                    "grupo": linha["GRUPO_EXPLORATORIO"].strip(),
                    "alerta": ALERTA_ABREV.get(linha["ALERTA_CLASSIFICACAO"].strip(), "?"),
                    "inst": num(linha.get("N_INDICADORES_DEN_INSTAVEL", "")),
                    "proxy": num(linha.get("N_INDICADORES_PROXY", "")),
                    "ind": {},
                },
            )
            m["ind"][linha["ID_INDICADOR"].strip()] = [
                num(linha["NUMERADOR"]),
                num(linha["DENOMINADOR"]),
                num(linha["VALOR"]),
                num(linha["PONTO"]),
                FLAG_ABREV.get(linha["FLAG_DENOMINADOR"].strip(), "?"),
            ]

    saida = {
        "geradoEm": date.today().isoformat(),
        "fonte": origem.name,
        "excluidosCodigoInvalido": len(excluidos),
        "municipios": municipios,
    }
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(
        json.dumps(saida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    kb = destino.stat().st_size / 1024
    print(f"OK: {len(municipios)} municípios ({len(excluidos)} excluídos por código inválido) "
          f"-> {destino} ({kb:.0f} kB)")


def main():
    origem = Path(sys.argv[1] if len(sys.argv) > 1 else PADRAO)
    origem_mun = Path(sys.argv[2] if len(sys.argv) > 2 else PADRAO_MUN)
    raiz = Path(__file__).resolve().parent.parent
    destino = raiz / "src" / "dados" / "indicadores.json"
    destino_mun = raiz / "public" / "dados" / "municipios.json"

    territorios = {}
    with origem.open(encoding="utf-8-sig") as f:
        for linha in csv.DictReader(f, delimiter=";"):
            cod = linha["COD_TERRITORIO"].strip()
            t = territorios.setdefault(
                cod,
                {
                    "cod": cod,
                    "nivel": linha["NIVEL_TERRITORIO"],
                    "nome": linha["NOME_TERRITORIO"],
                    "sigla": linha["SIGLA_UF"],
                    "regiao": REGIOES.get(cod[:1], None) if linha["NIVEL_TERRITORIO"] == "UF" else None,
                    "avaliaveis": num(linha["INDICADORES_AVALIAVEIS"]),
                    "atingidos": num(linha["INDICADORES_ATINGIDOS"]),
                    "escore": num(linha["ESCORE_FINAL"]),
                    "escorePct": num(linha["ESCORE_PERCENTUAL"]),
                    "grupo": linha["GRUPO"].strip(),
                    "alerta": linha["ALERTA_CLASSIFICACAO"].strip(),
                    "indicadores": {},
                },
            )
            t["indicadores"][linha["ID_INDICADOR"].strip()] = {
                "ano": int(linha["ANO_REFERENCIA"]),
                "num": num(linha["NUMERADOR"]),
                "den": num(linha["DENOMINADOR"]),
                "valor": num(linha["VALOR"]),
                "ref": num(linha["REF"]),
                "ponto": num(linha["PONTO"]),
                "flag": linha["FLAG_DENOMINADOR"].strip(),
            }

    brasil = territorios.pop("BR")
    ufs = sorted(territorios.values(), key=lambda t: t["nome"])

    saida = {
        "geradoEm": date.today().isoformat(),
        "fonte": origem.name,
        "brasil": brasil,
        "ufs": ufs,
    }
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"OK: {len(ufs)} UFs + Brasil -> {destino}")

    if origem_mun.exists():
        preparar_municipios(origem_mun, destino_mun)
    else:
        print(f"AVISO: base municipal não encontrada em {origem_mun}; pulando.")


if __name__ == "__main__":
    main()
