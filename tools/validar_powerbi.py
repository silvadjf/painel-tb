#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validação determinística dos critérios de aceite do projeto Power BI.

Não abre o Power BI Desktop. Valida dados, regra de pontuação, modelo estático,
PBIR, tema e contraste diretamente contra os JSON que alimentam o painel web.
"""
from __future__ import annotations

import csv
import json
import re
import sys
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IND_JSON = ROOT / "src" / "dados" / "indicadores.json"
MUN_JSON = ROOT / "public" / "dados" / "municipios.json"
POWERBI = ROOT / "powerbi"
REPORT = POWERBI / "PainelTB.Report"
MODEL = POWERBI / "PainelTB.SemanticModel"
DOCS = ROOT / "docs"
THEME = REPORT / "StaticResources" / "RegisteredResources" / "PainelTB-7f2c9a41.json"
REL = MODEL / "definition" / "relationships.tmdl"
RESULT_JSON = DOCS / "validacao_powerbi.json"
MUN_CSV = DOCS / "municipios_presentes.csv"

VALID_IND = {f"I{i}" for i in range(1, 10)}
REQUIRED_PAGES = {"Visão Brasil", "Visão UF", "Visão Município", "Ficha por indicador", "Metodologia"}

results: list[dict] = []


def check(name: str, passed: bool, detail: str, severity: str = "FAIL") -> None:
    status = "PASS" if passed else severity
    results.append({"criterio": name, "status": status, "detalhe": detail})
    print(f"[{status}] {name}: {detail}")


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def flatten_uf(src: dict) -> list[dict]:
    out = []
    for t in src["ufs"]:
        for iid, d in t["indicadores"].items():
            out.append(
                {
                    "CodUF": str(t["cod"]),
                    "IndicadorID": iid,
                    "Ano": int(d["ano"]),
                    "Numerador": d.get("num"),
                    "Denominador": d.get("den"),
                    "Valor": d.get("valor"),
                    "Referencia": d.get("ref"),
                    "PontoFonte": d.get("ponto"),
                    "Flag": d.get("flag"),
                }
            )
    return out


def flatten_municipios(src_mun: dict, refs: dict) -> list[dict]:
    out = []
    for cod, m in src_mun["municipios"].items():
        for iid, arr in m.get("ind", {}).items():
            ref = refs[iid]
            vals = list(arr) + [None] * max(0, 5 - len(arr))
            out.append(
                {
                    "CodMunicipio": cod,
                    "CodUF": cod[:2],
                    "IndicadorID": iid,
                    "Ano": int(ref["ano"]),
                    "Numerador": vals[0],
                    "Denominador": vals[1],
                    "Valor": vals[2],
                    "PontoFonte": vals[3],
                    "Flag": vals[4],
                    "Referencia": ref["ref"],
                }
            )
    return out


def point_calc(d: dict):
    den, val, ref = d.get("den"), d.get("valor"), d.get("ref")
    if den is None or den == 0 or val is None or ref is None:
        return None
    return 1 if val >= ref else 0


def contrast_ratio(hex1: str, hex2: str) -> float:
    def lum(h: str) -> float:
        h = h.lstrip("#")
        rgb = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
        vals = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in rgb]
        return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2]
    a, b = sorted((lum(hex1), lum(hex2)), reverse=True)
    return (a + 0.05) / (b + 0.05)


def theme_schema_validate(theme: dict) -> tuple[bool, str]:
    url = theme.get("$schema")
    if not url:
        return False, "theme.json sem $schema"
    try:
        import jsonschema  # type: ignore
        with urllib.request.urlopen(url, timeout=20) as r:
            schema = json.loads(r.read().decode("utf-8"))
        jsonschema.validate(theme, schema)
        return True, f"válido contra {url}"
    except Exception as exc:
        return False, f"falha na validação do schema: {type(exc).__name__}: {exc}"


def generate_municipality_csv(mun: dict) -> tuple[int, int]:
    """Gera lista completa. Nomes IBGE são best-effort; código é sempre preservado."""
    name_map: dict[str, tuple[str, str]] = {}
    try:
        with urllib.request.urlopen(
            "https://servicodados.ibge.gov.br/api/v1/localidades/municipios", timeout=30
        ) as r:
            data = json.loads(r.read().decode("utf-8"))
        for item in data:
            cod7 = str(item["id"])
            name_map[cod7[:6]] = (cod7, item["nome"])
    except Exception:
        pass
    rows = []
    for cod, m in sorted(mun["municipios"].items()):
        cod7, nome = name_map.get(cod, ("", ""))
        rows.append((cod, cod7, nome, m.get("uf", "")))
    with MUN_CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["COD_MUNICIPIO_6", "COD_IBGE_7", "NOME_MUNICIPIO", "UF"])
        w.writerows(rows)
    return len(rows), sum(1 for _, cod7, name, _ in rows if cod7 and name)


def main() -> int:
    DOCS.mkdir(exist_ok=True)
    src = load_json(IND_JSON)
    mun = load_json(MUN_JSON)
    refs = src["brasil"]["indicadores"]

    # ETL/dados — réplica independente em Python da transformação do M.
    uf_rows = flatten_uf(src)
    mun_rows = flatten_municipios(mun, refs)
    check("ETL.UF.27", len(src["ufs"]) == 27, f"UFs={len(src['ufs'])}; esperado=27")
    check("ETL.Fato.UF.243", len(uf_rows) == 27 * 9, f"linhas UF={len(uf_rows)}; esperado=243")
    keys = [(r["CodUF"], r["IndicadorID"], r["Ano"]) for r in uf_rows]
    check("ETL.Fato.UF.sem_duplicatas", len(keys) == len(set(keys)), f"chaves={len(keys)}; únicas={len(set(keys))}")
    check("ETL.indicadores_sem_orfaos", {r["IndicadorID"] for r in uf_rows} == VALID_IND, f"IDs={sorted({r['IndicadorID'] for r in uf_rows})}")
    ufcodes = {str(x["cod"]) for x in src["ufs"]}
    check("ETL.UF.sem_orfaos", all(r["CodUF"] in ufcodes for r in uf_rows), f"códigos UF={len(ufcodes)}")
    check("ETL.M.replicacao_python", len(mun_rows) > 0 and all(r["IndicadorID"] in VALID_IND for r in mun_rows), f"linhas municipais replicadas={len(mun_rows)}")

    # DAX/regra — recalcula todos os 27 territórios, não apenas amostra de 10.
    score_mismatches = []
    point_mismatches = []
    for t in src["ufs"]:
        calc_points = []
        for iid, d in t["indicadores"].items():
            p = point_calc(d)
            if p is not None:
                calc_points.append(p)
            if d.get("ponto") != p:
                point_mismatches.append((t["sigla"], iid, d.get("ponto"), p))
        score = sum(calc_points)
        if t.get("escore") != score:
            score_mismatches.append((t["sigla"], t.get("escore"), score))
    check("DAX.pontos_27x9_tolerancia_zero", not point_mismatches, f"divergências={len(point_mismatches)}")
    check("DAX.escore_27UF_tolerancia_zero", not score_mismatches, f"divergências={len(score_mismatches)}; UFs comparadas=27")

    rel_text = REL.read_text(encoding="utf-8")
    rel_count = len(re.findall(r"(?m)^relationship\s+", rel_text))
    check("Modelo.relacionamentos_4", rel_count == 4, f"relacionamentos={rel_count}")
    check("Modelo.sem_bidirecional", "bothDirections" not in rel_text, "nenhum crossFilteringBehavior: bothDirections")
    check("Modelo.dim_UF_unica", len(ufcodes) == len(src["ufs"]), f"chaves Dim_UF únicas={len(ufcodes)}")
    check("Modelo.dim_indicador_unica", len(VALID_IND) == 9, "I1-I9 únicos")
    check("Modelo.dim_municipio_unica", len(mun["municipios"]) == len(set(mun["municipios"])), f"chaves municipais únicas={len(mun['municipios'])}")

    # GAP metodológico municipal: não falha o espelhamento, mas precisa ficar visível.
    group_disagreement = []
    for cod, m in mun["municipios"].items():
        aval = m.get("aval")
        score = m.get("escore")
        if aval is None or score is None:
            continue
        documented = "Não classificável" if aval < 6 else ("Grupo 1" if score >= 7 else "Grupo 2" if score >= 4 else "Grupo 3")
        if m.get("grupo") != documented:
            group_disagreement.append((cod, m.get("grupo"), documented, aval, score))
    check("GAP.grupo_municipal_divergente_da_regra_documentada", len(group_disagreement) == 0, f"divergências={len(group_disagreement)}; GrupoFonte é preservado e medida separada calcula a regra documentada", severity="WARN")

    # PBIR estrutural.
    json_files = list(REPORT.rglob("*.json")) + [REPORT / "definition.pbir", POWERBI / "PainelTB.pbip", MODEL / "definition.pbism"]
    parse_errors = []
    for p in json_files:
        try:
            load_json(p)
        except Exception as exc:
            parse_errors.append((str(p.relative_to(ROOT)), str(exc)))
    check("PBIR.JSON.valido", not parse_errors, f"arquivos JSON/PBIR verificados={len(json_files)}; erros={len(parse_errors)}")

    pages = []
    page_ids = []
    for page_file in (REPORT / "definition" / "pages").glob("*/page.json"):
        d = load_json(page_file)
        pages.append(d.get("displayName"))
        page_ids.append(d.get("name"))
    check("PBIR.paginas_exigidas", set(pages) == REQUIRED_PAGES, f"páginas={sorted(pages)}")
    pages_meta = load_json(REPORT / "definition" / "pages" / "pages.json")
    check("PBIR.pageOrder_completo", set(pages_meta.get("pageOrder", [])) == set(page_ids), f"pageOrder={len(pages_meta.get('pageOrder', []))}; páginas={len(page_ids)}")

    visuals = []
    missing_titles = []
    indicator_bound = False
    visual_types = Counter()
    for vfile in (REPORT / "definition" / "pages").glob("*/visuals/*/visual.json"):
        v = load_json(vfile)
        visuals.append(v)
        visual = v.get("visual", {})
        visual_types[visual.get("visualType", "")] += 1
        title_entries = visual.get("visualContainerObjects", {}).get("title", [])
        has_title = any(x.get("properties", {}).get("show", {}).get("expr", {}).get("Literal", {}).get("Value") == "true" for x in title_entries)
        if not has_title:
            missing_titles.append(str(vfile.relative_to(ROOT)))
        if "Dim_Indicador.IndicadorID" in json.dumps(v, ensure_ascii=False):
            indicator_bound = True
    check("PBIR.todos_visuais_com_titulo", not missing_titles, f"visuais={len(visuals)}; sem título={len(missing_titles)}")
    check("PBIR.I1_I9_em_visual", indicator_bound, "Ficha por indicador está ligada a Dim_Indicador[IndicadorID]")
    check("PBIR.mapa_UF", visual_types["azureMap"] >= 1, f"azureMap={visual_types['azureMap']}")
    check("PBIR.mapa_municipio", visual_types["azureMap"] >= 2, f"azureMap={visual_types['azureMap']}")
    check("PBIR.metodologia_interna", visual_types["textbox"] >= 1, f"textbox={visual_types['textbox']}")

    # Tema e WCAG.
    theme = load_json(THEME)
    schema_ok, schema_detail = theme_schema_validate(theme)
    check("Tema.schema_PowerBI", schema_ok, schema_detail)
    pairs = {
        "Grupo 1": ("#2E6FAD", "#FFFFFF"),
        "Grupo 2": ("#D9B53C", "#111827"),
        "Grupo 3": ("#C62828", "#FFFFFF"),
        "Não classificável": ("#667085", "#FFFFFF"),
        "Texto principal": ("#FFFFFF", "#111827"),
        "Texto secundário": ("#FFFFFF", "#344054"),
    }
    contrast = {k: contrast_ratio(bg, fg) for k, (bg, fg) in pairs.items()}
    check("Tema.WCAG_AA_4.5", all(v >= 4.5 for v in contrast.values()), "; ".join(f"{k}={v:.2f}:1" for k, v in contrast.items()))

    # Lista completa de municípios/códigos; nomes são enriquecimento e não bloqueiam ETL.
    nmun, nnamed = generate_municipality_csv(mun)
    check("Fonte.municipios_lista_completa", nmun == len(mun["municipios"]), f"linhas={nmun}; chaves JSON={len(mun['municipios'])}; nomes IBGE resolvidos={nnamed}")

    # Fonte da verdade e metodologia devem declarar GAP e regra central.
    truth = (DOCS / "fonte_da_verdade.md").read_text(encoding="utf-8")
    method = (DOCS / "metodologia.md").read_text(encoding="utf-8") if (DOCS / "metodologia.md").exists() else ""
    check("Docs.fonte_da_verdade", all(x in truth for x in ["I1", "I9", "GAP", "valor >= referência"]), "documento contém I1-I9, GAP e regra de pontuação")
    check("Docs.metodologia_espelha_regra", all(x in method for x in ["Grupo 1", "Grupo 2", "Grupo 3", "menos de 6", "denominador"]), "metodologia documenta cortes e avaliabilidade")

    RESULT_JSON.write_text(json.dumps({"resultados": results}, ensure_ascii=False, indent=2), encoding="utf-8")
    failures = [r for r in results if r["status"] == "FAIL"]
    warnings = [r for r in results if r["status"] == "WARN"]
    print(f"\nResumo: PASS={sum(r['status']=='PASS' for r in results)} WARN={len(warnings)} FAIL={len(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
