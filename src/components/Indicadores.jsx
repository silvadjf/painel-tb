import { fmt } from '../data/meta';

export default function Indicadores({ brasil, indicadores }) {
  return (
    <div className="grade-indicadores">
      {indicadores.map((i) => {
        const d = brasil.indicadores[i.id];
        return (
          <article className="cartao-indicador" key={i.id}>
            <header>
              <span className="indicador-id">{i.id}</span>
              <span className="indicador-eixo">{i.eixo} · {d.ano}</span>
            </header>
            <h3>{i.nome}</h3>
            {i.detalhe && <p className="indicador-detalhe">{i.detalhe}</p>}
            <footer>
              <span>Valor de referência nacional</span>
              <strong>{fmt(d.ref)}%</strong>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
