import { COR_GRUPO, fmt } from '../data/meta';

function CelulaIndicador({ dado }) {
  if (!dado || dado.valor == null) return <td className="celula-vazia">—</td>;
  const largura = Math.max(2, Math.min(100, dado.valor));
  const refPos = Math.max(0, Math.min(100, dado.ref));
  const instavel = dado.flag.startsWith('instavel') || dado.flag.startsWith('nao_avaliavel');
  return (
    <td title={`valor ${fmt(dado.valor)}% · referência ${fmt(dado.ref)}% · ${dado.num ?? '—'}/${dado.den ?? '—'}`}>
      <div className="mini-barra">
        <span className="mini-barra-fundo">
          <span
            className={`mini-barra-fill ${dado.ponto === 1 ? 'atinge' : 'nao-atinge'}`}
            style={{ width: `${largura}%` }}
          />
          <span className="mini-barra-ref" style={{ left: `${refPos}%` }} />
        </span>
        <span className="mini-barra-valor">
          {fmt(dado.valor)}{instavel ? ' ⚠' : ''}
        </span>
      </div>
    </td>
  );
}

export default function TabelaUF({ ufs, indicadores, ufSel, onUfSel, tema }) {
  const cores = COR_GRUPO[tema];
  const ordenadas = [...ufs].sort(
    (a, b) => (b.escore ?? -1) - (a.escore ?? -1) || a.nome.localeCompare(b.nome),
  );

  return (
    <div className="tabela-wrap">
      <table className="tabela-ufs">
        <thead>
          <tr>
            <th className="col-uf">Unidade Federativa</th>
            {indicadores.map((i) => (
              <th key={i.id} title={i.nome}>
                {i.id}
                <small>{i.curto}</small>
              </th>
            ))}
            <th>Escore</th>
            <th>Grupo</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((u) => (
            <tr
              key={u.sigla}
              className={u.sigla === ufSel ? 'linha-sel' : ''}
              onClick={() => onUfSel(u.sigla === ufSel ? null : u.sigla)}
            >
              <td className="col-uf">
                <strong>{u.sigla}</strong> {u.nome}
                {String(u.alerta).includes('instável') && <span title="classificação com indicador instável"> ⚠</span>}
              </td>
              {indicadores.map((i) => (
                <CelulaIndicador key={i.id} dado={u.indicadores[i.id]} />
              ))}
              <td className="col-escore">{fmt(u.escore, 0)}</td>
              <td>
                <span className="etiqueta-grupo" style={{ background: cores[u.grupo] }}>
                  {u.grupo}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="tabela-legenda">
        Barra: valor do indicador (%) · traço vertical: referência nacional · ⚠ denominador instável ·
        clique em uma linha para detalhar a UF
      </p>
    </div>
  );
}
