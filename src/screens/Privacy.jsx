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
          <li>Seu e-mail e senha, para criar e proteger sua conta. A senha é guardada pelo servidor de autenticação de forma irreversível (hash) e nunca fica visível.</li>
          <li>A chave da verificação em 2 etapas, usada pelo app autenticador.</li>
          <li>A data em que você aceitou esta política.</li>
          <li>O nome que você escolher informar (opcional), que fica só no aparelho.</li>
          <li>Contas, saldos, lançamentos, gastos fixos, planos, desejos e anotações que você cadastrar ou importar.</li>
          <li>Preferências de uso, como tema e tamanho do texto.</li>
        </ul>
        <p>O app não pede CPF, telefone, senha de banco nem localização.</p>

        <h2>Onde os dados ficam</h2>
        <p>
          <b>Seus dados financeiros ficam somente neste aparelho</b>, criptografados. Eles nunca são enviados para servidor nenhum.
          Apenas os dados da conta (e-mail, senha protegida e 2FA) ficam no serviço de autenticação Supabase, que atua como operador
          desses dados, podendo estar hospedado fora do Brasil. O app não usa cookies, anúncios, analytics, nem fontes ou scripts de terceiros.
        </p>

        <h2>Para que são usados</h2>
        <p>Os dados financeiros servem exclusivamente para mostrar a você seus saldos, gastos, análises e planos. Os dados da conta servem apenas para autenticação: entrar, confirmar seu e-mail, recuperar a senha e verificar o segundo fator. Nada é vendido, compartilhado para outras finalidades ou usado para publicidade.</p>

        <h2>Segurança</h2>
        <ul>
          <li>O acesso exige conta com e-mail confirmado e verificação em 2 etapas.</li>
          <li>O PIN é obrigatório. Os dados são criptografados no aparelho (AES-256-GCM, chave derivada do PIN com PBKDF2-SHA256, 600 mil iterações).</li>
          <li>O app só funciona instalado na tela de início, isolado do navegador comum.</li>
          <li>O app bloqueia sozinho depois de um tempo em segundo plano.</li>
          <li>A opção Ocultar valores esconde os números da tela.</li>
          <li>Importações de extrato são lidas no próprio aparelho.</li>
          <li>A exportação de dados pode ser protegida com senha, usando a mesma criptografia.</li>
          <li>No aplicativo para Android, os dados não entram no backup em nuvem do Google nem na transferência entre aparelhos, e a tela não pode ser capturada.</li>
          <li>No aplicativo para iPhone, o conteúdo fica coberto na tela de apps recentes.</li>
        </ul>
        <p>
          Nenhum sistema é totalmente imune. Proteja o aparelho com senha, mantenha o sistema atualizado e, se exportar seus dados sem
          criptografia, guarde o arquivo em local seguro.
        </p>

        <h2>Seus direitos</h2>
        <p>Como titular, você controla tudo diretamente no app, em Ajustes:</p>
        <ul>
          <li><b>Acesso e portabilidade:</b> Exportar dados gera um arquivo com todas as informações.</li>
          <li><b>Correção:</b> qualquer registro pode ser editado.</li>
          <li><b>Eliminação:</b> Excluir todos os dados apaga tudo deste aparelho. Excluir conta apaga também sua conta no servidor.</li>
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
