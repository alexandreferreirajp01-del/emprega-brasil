import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Política de Privacidade</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 md:p-8 prose prose-slate max-w-none">
            <p className="text-slate-500 mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Informações que Coletamos</h2>
            <p className="text-slate-600 mb-4">
              O web Vagas coleta as seguintes informações de forma transparente e em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018):
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li><strong>Dados de cadastro:</strong> nome completo, endereço de e-mail, telefone (opcional), foto de perfil, dados profissionais como experiência e formação acadêmica</li>
              <li><strong>Dados de navegação:</strong> páginas visitadas, vagas visualizadas, tempo de permanência, favoritos e histórico de buscas</li>
              <li><strong>Dados técnicos:</strong> endereço IP, tipo e versão do navegador, sistema operacional, identificador de dispositivo, geolocalização aproximada (cidade/estado)</li>
              <li><strong>Cookies e tecnologias de rastreamento:</strong> utilizamos cookies essenciais, de desempenho, funcionais e de publicidade para melhorar sua experiência e personalizar conteúdo</li>
              <li><strong>Dados de interação:</strong> curtidas, comentários, compartilhamentos e mensagens no feed social da plataforma</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">2. Uso das Informações</h2>
            <p className="text-slate-600 mb-4">Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Personalizar sua experiência</li>
              <li>Enviar comunicações relevantes sobre vagas</li>
              <li>Analisar o uso da plataforma</li>
              <li>Exibir anúncios personalizados</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Compartilhamento de Dados</h2>
            <p className="text-slate-600 mb-6">
              Não vendemos suas informações pessoais. Podemos compartilhar dados com:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li>Parceiros de publicidade (Google AdSense)</li>
              <li>Provedores de serviços essenciais</li>
              <li>Autoridades quando exigido por lei</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Cookies e Publicidade</h2>
            <p className="text-slate-600 mb-4">
              Utilizamos cookies e tecnologias similares (pixels, web beacons, localStorage) para melhorar sua experiência e exibir anúncios relevantes. Nossa plataforma utiliza:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li><strong>Google AdSense:</strong> para exibição de anúncios contextualizados e personalizados. O Google pode usar cookies de terceiros para exibir anúncios baseados em visitas anteriores</li>
              <li><strong>Google Analytics:</strong> para análise de tráfego, comportamento do usuário e otimização da plataforma</li>
              <li><strong>Cookies essenciais:</strong> necessários para funcionamento básico (autenticação, segurança, preferências)</li>
              <li><strong>Cookies de desempenho:</strong> para análise de velocidade e otimização</li>
            </ul>
            <p className="text-slate-600 mb-6">
              Você pode gerenciar suas preferências de cookies nas <a href={createPageUrl('Cookies')} className="text-[#1E6FB6] hover:underline">Configurações de Cookies</a> ou desativar anúncios personalizados nas <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-[#1E6FB6] hover:underline">Configurações de Anúncios do Google</a>.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">5. Seus Direitos (LGPD)</h2>
            <p className="text-slate-600 mb-4">Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li><strong>Confirmação e acesso:</strong> confirmar se tratamos seus dados e solicitar acesso completo aos dados pessoais que mantemos sobre você</li>
              <li><strong>Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Anonimização, bloqueio ou eliminação:</strong> solicitar exclusão de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD</li>
              <li><strong>Portabilidade:</strong> solicitar a transferência de seus dados para outro fornecedor de serviço</li>
              <li><strong>Revogação de consentimento:</strong> revogar o consentimento a qualquer momento, sem afetar a legalidade do tratamento anteriormente autorizado</li>
              <li><strong>Informação sobre compartilhamento:</strong> saber com quais entidades públicas e privadas compartilhamos seus dados</li>
              <li><strong>Oposição:</strong> opor-se ao tratamento de dados realizado com base em uma das hipóteses de dispensa de consentimento</li>
            </ul>
            <p className="text-slate-600 mb-6">
              Para exercer qualquer destes direitos, entre em contato através do e-mail contato@webvagas.com.br ou WhatsApp (83) 99197-1320. Responderemos sua solicitação em até 15 dias úteis.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">6. Segurança</h2>
            <p className="text-slate-600 mb-6">
              Implementamos medidas de segurança técnicas e organizacionais para proteger 
              suas informações contra acesso não autorizado, alteração ou destruição.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">7. Retenção de Dados</h2>
            <p className="text-slate-600 mb-6">
              Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta política, obrigações legais e regulatórias, ou até que você solicite a exclusão. Dados de contas inativas por mais de 24 meses podem ser anonimizados ou excluídos automaticamente.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">8. Transferência Internacional</h2>
            <p className="text-slate-600 mb-6">
              Alguns de nossos parceiros de serviços (como Google, Base44 e serviços de hospedagem) podem armazenar dados fora do Brasil. Garantimos que tais transferências ocorrem apenas para países com nível adequado de proteção ou mediante cláusulas contratuais padrão de proteção de dados.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">9. Encarregado de Dados (DPO)</h2>
            <p className="text-slate-600 mb-6">
              Nosso encarregado de proteção de dados está disponível para esclarecer dúvidas e atender solicitações relacionadas ao tratamento de dados pessoais:<br />
              <strong>E-mail:</strong> contato@webvagas.com.br<br />
              <strong>WhatsApp:</strong> (83) 99197-1320
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">10. Contato e Dados da Empresa</h2>
            <p className="text-slate-600">
              <strong>Razão Social:</strong> Alexandre Ferreira<br />
              <strong>CNPJ:</strong> 62.874.724/0001-11<br />
              <strong>E-mail:</strong> contato@webvagas.com.br<br />
              <strong>WhatsApp:</strong> (83) 99197-1320<br />
              <strong>Endereço:</strong> Paraíba, Brasil
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}