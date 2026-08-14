#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera docs/municipios_presentes.csv usando os códigos do JSON municipal e nomes da API IBGE.

O código de 6 dígitos é a chave efetivamente usada pelo painel web. O código IBGE oficial
retornado pela API tem 7 dígitos; a associação replica o comportamento do painel web,
que usa os seis primeiros dígitos para casar com municipios.json.

Códigos presentes no JSON sem correspondência na API de Localidades são preservados e
marcados como GAP em vez de receber nome/código inventado. Falhas de comunicação com a
API continuam sendo bloqueantes.
"""
from __future__ import annotations

import csv
import gzip
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
            "Accept-Encoding": "gzip",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read()
        encoding = (r.headers.get("Content-Encoding") or "").lower()
        if encoding == "gzip" or raw[:2] == b"\x1f\x8b":
            raw = gzip.decompress(raw)
        charset = r.headers.get_content_charset() or "utf-8"
        return json.loads(raw.decode(charset))


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

    if errors:
        print("Erros de comunicação com a API IBGE:")
        for e in errors:
            print(f"- {e}")
        raise SystemExit(f"Falha ao consultar {len(errors)} UFs na API do IBGE")

    OUT.parent.mkdir(exist_ok=True)
    rows = []
    unresolved = []
    for cod, m in sorted(municipalities.items()):
        cod7, nome = lookup.get(cod, ("", ""))
        status = "OK_API_IBGE" if cod7 and nome else "GAP_SEM_CORRESPONDENCIA_API_IBGE"
        if status != "OK_API_IBGE":
            unresolved.append(cod)
        rows.append([cod, cod7, nome, m.get("uf", ""), status])

    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["COD_MUNICIPIO_6", "COD_IBGE_7", "NOME_MUNICIPIO", "UF", "STATUS_RESOLUCAO"])
        w.writerows(rows)

    resolved = len(rows) - len(unresolved)
    print(f"Municípios/códigos presentes no JSON: {len(rows)}")
    print(f"Nomes/códigos IBGE 7 resolvidos: {resolved}")
    print(f"Códigos da fonte sem correspondência na API IBGE: {len(unresolved)}")
    if unresolved:
        print("GAPs explícitos: " + ", ".join(unresolved))

    # Critério: a lista da fonte deve ser integral, a API deve responder para todas as UFs,
    # e qualquer código sem correspondência deve ficar explicitamente marcado — jamais imputado.
    if len(rows) != len(municipalities):
        raise SystemExit("A lista gerada não preservou todas as chaves de municipios.json")


if __name__ == "__main__":
    main()
