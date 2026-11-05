import { APP } from "../config.js";
import Icon from "../components/Icon.jsx";

export default function Privacy({ go, public: isPublic }) {
  return (
    <div className="page narrow">
      <header className="top">
        <button className="icon-btn" onClick={() => (history.length > 1 ? history.back() : go(isPublic ? "" : "ajustes"))} aria-label="Voltar"><Icon name="left" /></button>
        <h1>Política de Privacidade</h1>
      </header>
      <div className="prose">
        <p className="muted">Versão de {APP.policyVersion.split("-").reverse().join("/")}</p>
        <p>
          O {APP.name} foi feito para que os seus dados financeiros sejam só seus. Esta política explica, em linguagem simples,
          como o app trata informações pessoais, seguindo os princípios da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>

        <h2>Quais dados o app usa</h2>
        <ul>
          <li>O nome que você escolher informar (opcional).</li>
          <li>Contas, saldos, lançamentos, gastos fixos, planos, desejos e anotações que você cadastrar ou importar.</li>
          <li>Preferências de uso, como tema e tamanho do texto.</li>
        </ul>
        <p>O app não pede CPF, e-mail, telefone, senha de banco nem localização.</p>

        <h2>Onde os dados ficam</h2>
        <p>
          <b>Somente neste aparelho</b>, no armazenamento local do navegador. O {APP.name} não tem servidor, não cria conta e não envia
          seus dados para ninguém. Também não usa cookies de rastreamento, anúncios, analytics ou fontes e scripts de terceiros.
        </p>

        <h2>Para que são usados</h2>
        <p>Exclusivamente para mostrar a você seus saldos, gastos, análises e planos. Nenhum dado é vendido, compartilhado ou usado para outra finalidade.</p>

        <h2>Segurança</h2>
        <ul>
          <li>Você pode ativar um PIN em Ajustes. Com ele, os dados são criptografados no aparelho (AES-256-GCM, chave derivada com PBKDF2).</li>
          <li>O app bloqueia sozinho depois de um tempo em segundo plano.</li>
          <li>A opção Ocultar valores esconde os números da tela.</li>
          <li>Importações de extrato são lidas no próprio aparelho.</li>
        </ul>
        <p>
          Nenhum sistema é totalmente imune. Proteja o aparelho com senha, mantenha o sistema atualizado e guarde o arquivo de backup em local seguro,
          pois ele não é criptografado.
        </p>

        <h2>Seus direitos</h2>
        <p>Como titular, você controla tudo diretamente no app, em Ajustes:</p>
        <ul>
          <li><b>Acesso e portabilidade:</b> Exportar dados gera um arquivo com todas as informações.</li>
          <li><b>Correção:</b> qualquer registro pode ser editado.</li>
          <li><b>Eliminação:</b> Excluir todos os dados apaga tudo deste aparelho, de forma imediata.</li>
          <li><b>Revogação do consentimento:</b> excluir os dados encerra o uso. Você pode aceitar a política de novo quando quiser.</li>
        </ul>

        <h2>Dados de menores</h2>
        <p>O app não coleta dados de ninguém. Recomendamos que menores de idade usem com acompanhamento dos responsáveis.</p>

        <h2>Alterações e contato</h2>
        <p>
          Se esta política mudar, a nova versão aparece aqui com a data atualizada. Dúvidas ou solicitações:{" "}
          <a href={APP.contact} target="_blank" rel="noopener noreferrer">{APP.contact.replace(/^https?:\/\//, "")}</a>.
        </p>
        <p className="muted" style={{ marginTop: 32 }}>Este texto descreve o funcionamento do app e não substitui orientação jurídica.</p>
      </div>
    </div>
  );
}
