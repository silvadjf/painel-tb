import { useEffect, useMemo, useState } from 'react';
import MapaMunicipal from './MapaMunicipal';
import { INDICADORES, COR_GRUPO, ALERTA_MUN, FLAG_MUN, fmt } from '../data/meta';

const cacheNomes = new Map();
function nomesMunicipios(ufId) {
  if (!cacheNomes.has(ufId)) {
    cacheNomes.set(
      ufId,
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufId}/municipios`)
        .then((r) => r.json())
        .then((lista) => new Map(lista.map((m) => [String(m.id).slice(0, 6), m.nome]))),
    );
  }
  return cacheNomes.get(ufId);
}

let promDados = null;
function carregarMunicipios() {
  promDados ??= fetch(`${import.meta.env.BASE_URL}dados/municipios.json`).then((r) => {
    if (!r.ok) throw new Error(`municipios.json: ${r.status}`);
    return r.json();
  });
  return promDados;
}

function DetalheMunicipio({ cod, mun, nome, brasil, tema, onFechar }) {
  const cores = COR_GRUPO[tema];
  return (
    <aside className="painel-lateral">
      <section className="bloco-lateral">
        <div className="detalhe-cabecalho">
          <h3>{nome} — {mun.uf}</h3>
          <button className="fechar" onClick={onFechar} aria-label="Fechar detalhe">✕</button>
        </div>
        <p className="detalhe-resumo">
          <span className="etiqueta-grupo" style={{ background: cores[mun.grupo] ?? cores['Não classificável'] }}>
            {mun.grupo} (exploratório)
          </span>
          <strong>Escore {fmt(mun.escore, 0)}</strong> · {fmt(mun.ating, 0)} de {fmt(mun.aval, 0)} avaliáveis
        </p>
        <p className="alerta-detalhe">⚠ {ALERTA_MUN[mun.alerta] ?? mun.alerta}</p>
        <div className="detalhe-barras">
          {INDICADORES.map((i) => {
            const d = mun.ind[i.id];
            if (!d) return null;
            const [num, den, valor, ponto, flag] = d;
            const ref = brasil.indicadores[i.id].ref;
            return (
              <div className="detalhe-barra" key={i.id} title={FLAG_MUN[flag] ?? flag}>
                <div className="detalhe-barra-rotulo">
                  <span>
                    {i.id} · {i.curto}{' '}
                    <small className="ano-ref">
                      ({fmt(num, 0)}/{fmt(den, 0)})
                    </small>
                  </span>
                  <span className={ponto === 1 ? 'ponto-ok' : 'ponto-nok'}>
                    {valor == null
                      ? i.id === 'I2' ? 'não pontua' : 'não avaliável'
                      : `${fmt(valor)}% ${ponto == null ? '· sem ponto' : ponto === 1 ? '● 1' : '○ 0'}`}
                  </span>
                </div>
                <span className="mini-barra-fundo alta">
                  <span
                    className={`mini-barra-fill ${ponto === 1 ? 'atinge' : 'nao-atinge'}`}
                    style={{ width: `${Math.max(2, Math.min(100, valor ?? 0))}%` }}
                  />
                  <span className="mini-barra-ref" style={{ left: `${Math.min(100, ref)}%` }} />
                </span>
              </div>
            );
          })}
        </div>
        <p className="lateral-texto" style={{ marginTop: 12 }}>
          Numerador/denominador entre parênteses · traço vertical: referência nacional ·
          I2 possui apenas numerador municipal · I3 usa denominador estimado (proxy).
        </p>
      </section>
    </aside>
  );
}

export default function SecaoMunicipal({ estados, brasil, tema }) {
  const [ufId, setUfId] = useState('');
  const [dados, setDados] = useState(null);
  const [nomes, setNomes] = useState(new Map());
  const [munSel, setMunSel] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!ufId) return;
    carregarMunicipios().then(setDados).catch((e) => setErro(String(e)));
    nomesMunicipios(ufId).then(setNomes).catch(() => setNomes(new Map()));
    setMunSel(null);
  }, [ufId]);

  const doEstado = useMemo(() => {
    if (!dados || !ufId) return {};
    return Object.fromEntries(
      Object.entries(dados.municipios).filter(([cod]) => cod.slice(0, 2) === String(ufId)),
    );
  }, [dados, ufId]);

  const resumo = useMemo(() => {
    const lista = Object.values(doEstado);
    const conta = (g) => lista.filter((m) => m.grupo === g).length;
    return {
      total: lista.length,
      g1: conta('Grupo 1'), g2: conta('Grupo 2'), g3: conta('Grupo 3'),
      nc: conta('Não classificável'),
    };
  }, [doEstado]);

  const cores = COR_GRUPO[tema];

  return (
    <div className="secao-municipal">
      <div className="aviso-exploratorio">
        <strong>⚠ Classificação exploratória — não oficial.</strong> Todos os municípios
        classificáveis possuem alerta metodológico (denominador instável e/ou proxy).
        I2 entra apenas como numerador (não pontua); I3 usa denominador estimado;
        I1 em SC está parcial (base local sem código IBGE municipal). Use os indicadores
        individuais, com numerador e denominador, como leitura principal.
      </div>

      <div className="barra-filtros">
        <label className="filtro">
          <span>Unidade Federativa</span>
          <select value={ufId} onChange={(e) => setUfId(e.target.value)}>
            <option value="">Selecione um estado…</option>
            {estados.map((e) => (
              <option key={e.cod} value={e.cod}>{e.nome} · {e.sigla}</option>
            ))}
          </select>
        </label>
        {ufId && dados && (
          <p className="resumo-municipal">
            {resumo.total} municípios na base ·{' '}
            <span style={{ color: cores['Grupo 1'] }}>{resumo.g1} G1</span> ·{' '}
            <span style={{ color: cores['Grupo 2'] }}>{resumo.g2} G2</span> ·{' '}
            <span style={{ color: cores['Grupo 3'] }}>{resumo.g3} G3</span> ·{' '}
            {resumo.nc} não classificáveis
          </p>
        )}
      </div>

      {erro && <p className="mapa-status erro">Falha ao carregar dados municipais: {erro}</p>}

      {ufId ? (
        <div className="mapa-e-detalhe">
          <MapaMunicipal
            ufId={ufId}
            municipios={doEstado}
            nomes={nomes}
            munSel={munSel}
            onMunSel={setMunSel}
            tema={tema}
          />
          {munSel && doEstado[munSel] ? (
            <DetalheMunicipio
              cod={munSel}
              mun={doEstado[munSel]}
              nome={nomes.get(munSel) ?? munSel}
              brasil={brasil}
              tema={tema}
              onFechar={() => setMunSel(null)}
            />
          ) : (
            <aside className="painel-lateral">
              <section className="bloco-lateral">
                <h3>ⓘ Como ler</h3>
                <p className="lateral-texto">
                  Clique em um município para ver os nove indicadores com numerador,
                  denominador, valor, referência nacional, ponto e estabilidade do
                  denominador. Municípios em cinza não possuem registro na base ou não
                  são classificáveis (menos de 6 indicadores avaliáveis).
                </p>
              </section>
            </aside>
          )}
        </div>
      ) : (
        <p className="lateral-vazio">Selecione um estado para carregar a malha municipal.</p>
      )}
    </div>
  );
}
