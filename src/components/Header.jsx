export default function Header({ tema, onTema, geradoEm }) {
  return (
    <header className="cabecalho">
      <div className="cabecalho-marca">
        <span className="marca">Brasil Livre da TB</span>
        <span className="marca-divisor" />
        <h1 className="titulo-pagina">
          Plano Nacional pelo Fim da Tuberculose
          <small>Monitoramento de informações estratégicas</small>
        </h1>
      </div>
      <div className="cabecalho-acoes">
        <button
          className="botao-aparencia"
          onClick={() => onTema(tema === 'dark' ? 'light' : 'dark')}
          title="Alternar tema claro/escuro"
        >
          🎨 Aparência · {tema === 'dark' ? 'escuro' : 'claro'}
        </button>
        <div className="atualizacao">
          <span className="ponto-vivo" /> Última atualização
          <strong>{new Date(`${geradoEm}T12:00:00`).toLocaleDateString('pt-BR')}</strong>
        </div>
      </div>
    </header>
  );
}
