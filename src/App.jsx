import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Filtros from './components/Filtros';
import ScoreCards from './components/ScoreCards';
import MapaUF from './components/MapaUF';
import TabelaUF from './components/TabelaUF';
import DetalheUF from './components/DetalheUF';
import SecaoMunicipal from './components/SecaoMunicipal';
import Indicadores from './components/Indicadores';
import Metodos from './components/Metodos';
import dados from './dados/indicadores.json';
import { INDICADORES } from './data/meta';

export default function App() {
  const [tema, setTema] = useState(() => localStorage.getItem('tema-tb') ?? 'dark');
  const [regiao, setRegiao] = useState('Todas');
  const [eixo, setEixo] = useState('Todos');
  const [grupo, setGrupo] = useState('Todos');
  const [ufSel, setUfSel] = useState(null); // sigla da UF selecionada

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark');
    localStorage.setItem('tema-tb', tema);
  }, [tema]);

  const ufsFiltradas = useMemo(
    () =>
      dados.ufs.filter(
        (u) =>
          (regiao === 'Todas' || u.regiao === regiao) &&
          (grupo === 'Todos' || u.grupo === grupo),
      ),
    [regiao, grupo],
  );

  const indicadoresVisiveis = useMemo(
    () => INDICADORES.filter((i) => eixo === 'Todos' || i.eixo === eixo),
    [eixo],
  );

  const detalhe = useMemo(
    () => dados.ufs.find((u) => u.sigla === ufSel) ?? null,
    [ufSel],
  );

  return (
    <div className="app">
      <Header tema={tema} onTema={setTema} geradoEm={dados.geradoEm} fonte={dados.fonte} />

      <nav className="abas-secao">
        <a href="#visao-nacional">Visão nacional</a>
        <a href="#visao-municipal">Visão municipal</a>
        <a href="#indicadores">Indicadores</a>
        <a href="#metodos">Critérios / Métodos</a>
      </nav>

      <Filtros
        regiao={regiao} onRegiao={setRegiao}
        eixo={eixo} onEixo={setEixo}
        grupo={grupo} onGrupo={setGrupo}
      />

      <section id="visao-nacional" className="secao">
        <h2 className="titulo-secao">Visão nacional</h2>
        <ScoreCards ufs={ufsFiltradas} tema={tema} />
        <div className="mapa-e-detalhe">
          <MapaUF
            ufs={dados.ufs}
            ufsFiltradas={ufsFiltradas}
            ufSel={ufSel}
            onUfSel={setUfSel}
            tema={tema}
          />
          <DetalheUF
            uf={detalhe}
            brasil={dados.brasil}
            indicadores={indicadoresVisiveis}
            tema={tema}
            onFechar={() => setUfSel(null)}
          />
        </div>
        <TabelaUF
          ufs={ufsFiltradas}
          indicadores={indicadoresVisiveis}
          ufSel={ufSel}
          onUfSel={setUfSel}
          tema={tema}
        />
      </section>

      <section id="visao-municipal" className="secao">
        <h2 className="titulo-secao">Visão municipal — exploratória</h2>
        <SecaoMunicipal estados={dados.ufs} brasil={dados.brasil} tema={tema} />
      </section>

      <section id="indicadores" className="secao">
        <h2 className="titulo-secao">Indicadores-chave e referências nacionais</h2>
        <Indicadores brasil={dados.brasil} indicadores={indicadoresVisiveis} />
      </section>

      <section id="metodos" className="secao">
        <h2 className="titulo-secao">Critérios e métodos</h2>
        <Metodos tema={tema} />
      </section>

      <footer className="rodape">
        Fonte: {dados.fonte} · dados processados em {new Date(`${dados.geradoEm}T12:00:00`).toLocaleDateString('pt-BR')} ·
        malha geográfica: IBGE · <strong>versão de desenvolvimento — não publicada</strong>
      </footer>
    </div>
  );
}
