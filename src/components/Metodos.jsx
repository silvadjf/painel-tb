import { GRUPOS, COR_GRUPO } from '../data/meta';

export default function Metodos({ tema }) {
  const cores = COR_GRUPO[tema];
  return (
    <div className="metodos">
      <div className="bloco-metodo">
        <h3>Objetivo do painel</h3>
        <p>
          Apoiar a operacionalização das estratégias da terceira fase do Plano Nacional pelo
          Fim da Tuberculose como Problema de Saúde Pública, traduzindo a abordagem
          priorizar–integrar–inovar em uma rotina objetiva de tomada de decisão para gestores
          das três esferas. O indicador composto, construído a partir de nove
          indicadores-chave, categoriza o desempenho das localidades em grupos.
        </p>
      </div>

      <div className="bloco-metodo">
        <h3>Cálculo do escore (indicador composto)</h3>
        <p>
          A localidade que atinge valor <strong>igual ou superior à referência nacional</strong> em
          um indicador-chave recebe <strong>1 ponto</strong>; caso contrário, 0. Indicadores com
          denominador zero são tratados como não avaliáveis e não pontuam. O escore final é a
          soma dos pontos (0 a 9). O Brasil é tratado exclusivamente como referência nacional e
          não recebe pontuação.
        </p>
        <ul className="lista-grupos">
          {GRUPOS.map((g) => (
            <li key={g.id}>
              <span className="etiqueta-grupo" style={{ background: cores[g.id] }}>{g.id}</span>
              <span>{g.regra}{g.id.startsWith('Grupo') ? ` — ${g.rotulo.split('· ')[1]}` : ''}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bloco-metodo">
        <h3>Alertas de estabilidade do denominador</h3>
        <p>
          Denominadores pequenos podem gerar instabilidade classificatória — especialmente no
          indicador de sucesso de tratamento de TB-RR/MDR. A classificação territorial recebe
          alerta (⚠) quando há pelo menos um indicador avaliável com denominador instável
          (&lt; 20). Territórios com menos de 6 indicadores avaliáveis não são classificados.
        </p>
      </div>

      <div className="bloco-metodo">
        <h3>Anos de referência e fontes</h3>
        <p>
          Os indicadores utilizam anos de referência distintos (2023 a 2025), conforme a
          disponibilidade de cada base: Sinan TB, base nacional de TPT (IL-TB), planilha
          externa de CD4/Siscel e Site-TB. GO e SC utilizam sistemas locais para dados de
          IL-TB, incorporados na rotina de preparação. A atualização acompanha o painel de
          Tuberculose já publicado.
        </p>
      </div>
    </div>
  );
}
