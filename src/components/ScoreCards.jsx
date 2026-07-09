import { GRUPOS, COR_GRUPO } from '../data/meta';

export default function ScoreCards({ ufs, tema }) {
  const cores = COR_GRUPO[tema];
  const cards = GRUPOS.map((g) => ({
    ...g,
    n: ufs.filter((u) => u.grupo === g.id).length,
  }));

  return (
    <section className="cartoes">
      {cards.map((c) => (
        <article className="cartao" key={c.id}>
          <span className="cartao-barra" style={{ background: cores[c.id] }} />
          <div className="cartao-textos">
            <h2>{c.rotulo}</h2>
            <p className="delta-igual">{c.regra}</p>
          </div>
          <span className="cartao-numero" style={{ color: cores[c.id] }}>{c.n}</span>
        </article>
      ))}
    </section>
  );
}
