import { COR_GRUPO, ROTULO_FLAG, fmt } from '../data/meta';

export default function DetalheUF({ uf, brasil, indicadores, tema, onFechar }) {
  const cores = COR_GRUPO[tema];

  if (!uf) {
    return (
      <aside className="painel-lateral">
        <section className="bloco-lateral">
          <h3>ⓘ Referências nacionais</h3>
          <p className="lateral-texto">
            Valores do Brasil usados como referência de pontuação. Clique em uma UF
            (mapa ou tabela) para ver o detalhamento.
          </p>
          <ol className="lista-elevados">
            {indicadores.map((i) => {
              const d = brasil.indicadores[i.id];
              return (
                <li key={i.id}>
                  <span className="elevado-nome">
                    {i.id} · {i.curto} <small className="ano-ref">({d.ano})</small>
                  </span>
                  <span className="elevado-valor">{fmt(d.ref)}%</span>
                </li>
              );
            })}
          </ol>
        </section>
      </aside>
    );
  }

  return (
    <aside className="painel-lateral">
      <section className="bloco-lateral">
        <div className="detalhe-cabecalho">
          <h3>{uf.nome} — {uf.sigla}</h3>
          <button className="fechar" onClick={onFechar} aria-label="Fechar detalhe">✕</button>
        </div>
        <p className="detalhe-resumo">
          <span className="etiqueta-grupo" style={{ background: cores[uf.grupo] }}>{uf.grupo}</span>
          <strong> Escore {fmt(uf.escore, 0)}/9</strong> · {fmt(uf.atingidos, 0)} de {fmt(uf.avaliaveis, 0)} indicadores avaliáveis atingidos
        </p>
        {String(uf.alerta).includes('instável') && (
          <p className="alerta-detalhe">⚠ Classificação com pelo menos um indicador de denominador instável.</p>
        )}
        <div className="detalhe-barras">
          {indicadores.map((i) => {
            const d = uf.indicadores[i.id];
            if (!d) return null;
            return (
              <div className="detalhe-barra" key={i.id} title={ROTULO_FLAG[d.flag] ?? d.flag}>
                <div className="detalhe-barra-rotulo">
                  <span>{i.id} · {i.curto} <small className="ano-ref">({d.ano})</small></span>
                  <span className={d.ponto === 1 ? 'ponto-ok' : 'ponto-nok'}>
                    {d.valor == null ? 'não avaliável' : `${fmt(d.valor)}% ${d.ponto === 1 ? '● 1 ponto' : '○ 0 ponto'}`}
                  </span>
                </div>
                <span className="mini-barra-fundo alta">
                  <span
                    className={`mini-barra-fill ${d.ponto === 1 ? 'atinge' : 'nao-atinge'}`}
                    style={{ width: `${Math.max(2, Math.min(100, d.valor ?? 0))}%` }}
                  />
                  <span className="mini-barra-ref" style={{ left: `${Math.min(100, d.ref)}%` }} />
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
