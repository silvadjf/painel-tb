#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera docs/municipios_presentes.csv usando os códigos do JSON municipal e nomes da API IBGE.

O código de 6 dígitos é a chave efetivamente usada pelo painel web. O código IBGE oficial
retornado pela API tem 7 dígitos; a associação replica o comportamento do painel web,
que usa os seis primeiros dígitos para casar com municipios.json.
"""
from __future__ import annotations

import csv
import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "dados" / "municipios.json"
OUT = ROOT / "docs" / "municipios_presentes.csv"


def fetch_json(url: str):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "painel-tb-powerbi-validation/1.0",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def main() -> None:
    src = json.loads(SRC.read_text(encoding="utf-8"))
    municipalities = src["municipios"]
    uf_codes = sorted({cod[:2] for cod in municipalities})
    lookup: dict[str, tuple[str, str]] = {}

    errors = []
    for uf in uf_codes:
        url = f"https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios"
        try:
            data = fetch_json(url)
            for item in data:
                cod7 = str(item["id"])
                lookup[cod7[:6]] = (cod7, str(item["nome"]))
        except Exception as exc:
            errors.append(f"UF {uf}: {type(exc).__name__}: {exc}")
        time.sleep(0.05)

    OUT.parent.mkdir(exist_ok=True)
    rows = []
    for cod, m in sorted(municipalities.items()):
        cod7, nome = lookup.get(cod, ("", ""))
        rows.append([cod, cod7, nome, m.get("uf", "")])

    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["COD_MUNICIPIO_6", "COD_IBGE_7", "NOME_MUNICIPIO", "UF"])
        w.writerows(rows)

    resolved = sum(bool(r[1] and r[2]) for r in rows)
    print(f"Municípios no JSON: {len(rows)}")
    print(f"Nomes/códigos IBGE 7 resolvidos: {resolved}")
    if errors:
        print("Erros IBGE:")
        for e in errors:
            print(f"- {e}")
    if resolved != len(rows):
        missing = [r[0] for r in rows if not r[1] or not r[2]]
        raise SystemExit(f"Não foi possível resolver {len(missing)} municípios; primeiros: {missing[:20]}")


if __name__ == "__main__":
    main()
