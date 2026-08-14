#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Crítico objetivo dos entregáveis Power BI.

Recebe somente os artefatos versionados, a fonte da verdade e o validador.
Máximo de 5 iterações. Se o conjunto de falhas não mudar em duas iterações
consecutivas, interrompe por estagnação e documenta o bloqueio.
"""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = ROOT / "tools" / "validar_powerbi.py"
RESULT = ROOT / "docs" / "validacao_powerbi.json"
REPORT = ROOT / "docs" / "relatorio_critico.md"
MAX_ITER = 5


def read_signature() -> tuple[str, ...]:
    if not RESULT.exists():
        return ("VALIDADOR_SEM_RESULTADO",)
    data = json.loads(RESULT.read_text(encoding="utf-8"))
    fails = [r["criterio"] for r in data.get("resultados", []) if r.get("status") == "FAIL"]
    return tuple(sorted(fails))


def render(iterations: list[dict], final: str) -> None:
    lines = [
        "# Relatório do crítico automatizado — Power BI",
        "",
        f"Executado em: {datetime.now(timezone.utc).isoformat()}",
        f"Teto: {MAX_ITER} iterações; parada por estagnação após 2 assinaturas de falha idênticas.",
        "",
        "| Iteração | Resultado | Falhas objetivas |",
        "|---:|---|---|",
    ]
    for it in iterations:
        f = ", ".join(it["falhas"]) if it["falhas"] else "—"
        lines.append(f"| {it['n']} | {it['resultado']} | {f} |")
    lines += ["", f"## Resultado final: {final}", ""]
    if final == "PASS":
        lines.append("Todos os critérios automatizáveis classificados como bloqueantes passaram. Avisos metodológicos permanecem documentados como WARN/GAP e não foram ocultados.")
    elif final == "ESTAGNAÇÃO":
        lines.append("O crítico interrompeu a execução porque duas iterações consecutivas produziram exatamente o mesmo conjunto de falhas. Não houve tentativa de girar indefinidamente.")
    else:
        lines.append("O teto de iterações foi atingido com falhas bloqueantes remanescentes.")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    iterations = []
    previous = None
    same_count = 0
    final = "FAIL"

    for n in range(1, MAX_ITER + 1):
        cp = subprocess.run([sys.executable, str(VALIDATOR)], cwd=ROOT)
        sig = read_signature()
        result = "PASS" if cp.returncode == 0 and not sig else "FAIL"
        iterations.append({"n": n, "resultado": result, "falhas": list(sig)})

        if result == "PASS":
            final = "PASS"
            break

        if sig == previous:
            same_count += 1
        else:
            same_count = 1
        previous = sig

        if same_count >= 2:
            final = "ESTAGNAÇÃO"
            break
    else:
        final = "FAIL"

    render(iterations, final)
    print(f"Crítico: {final}; relatório: {REPORT.relative_to(ROOT)}")
    return 0 if final == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
