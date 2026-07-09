import { EIXOS, GRUPOS, REGIOES } from '../data/meta';

function Seletor({ rotulo, valor, onValor, opcoes, padrao }) {
  return (
    <label className="filtro">
      <span>{rotulo}</span>
      <select value={valor} onChange={(e) => onValor(e.target.value)}>
        <option value={padrao}>{padrao}</option>
        {opcoes.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export default function Filtros({ regiao, onRegiao, eixo, onEixo, grupo, onGrupo }) {
  return (
    <div className="barra-filtros">
      <span className="filtros-titulo">Filtros</span>
      <Seletor rotulo="Região" valor={regiao} onValor={onRegiao} opcoes={REGIOES} padrao="Todas" />
      <Seletor rotulo="Eixo temático" valor={eixo} onValor={onEixo} opcoes={EIXOS} padrao="Todos" />
      <Seletor
        rotulo="Categoria de classificação"
        valor={grupo}
        onValor={onGrupo}
        opcoes={GRUPOS.map((g) => g.id)}
        padrao="Todos"
      />
    </div>
  );
}
