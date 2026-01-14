import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <Cookie className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Política de Cookies</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 md:p-8 prose prose-slate max-w-none">
            <p className="text-slate-500 mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">O que são Cookies?</h2>
            <p className="text-slate-600 mb-6">
              Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita nosso site. 
              Eles nos ajudam a melhorar sua experiência, lembrar suas preferências e analisar como você usa nossa plataforma.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">Tipos de Cookies Utilizados</h2>
            
            <h3 className="text-lg font-semibold text-slate-800 mb-3 mt-6">1. Cookies Essenciais (Necessários)</h3>
            <p className="text-slate-600 mb-4">
              Estes cookies são fundamentais para o funcionamento do site e não podem ser desativados:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li><strong>Autenticação:</strong> mantém você conectado durante a navegação</li>
              <li><strong>Segurança:</strong> protege contra ataques e fraudes</li>
              <li><strong>Sessão:</strong> armazena informações temporárias da sua visita</li>
              <li><strong>Preferências:</strong> lembra suas configurações (idioma, modo escuro)</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mb-3 mt-6">2. Cookies de Desempenho e Analytics</h3>
            <p className="text-slate-600 mb-4">
              Usamos estes cookies para entender como os visitantes usam o site:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li><strong>Google Analytics:</strong> coleta dados anônimos sobre páginas visitadas, tempo de permanência e origem do tráfego</li>
              <li><strong>Análise de navegação:</strong> ajuda a identificar problemas técnicos e melhorar a performance</li>
              <li><strong>Testes A/B:</strong> permite comparar diferentes versões de páginas para otimização</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mb-3 mt-6">3. Cookies de Publicidade</h3>
            <p className="text-slate-600 mb-4">
              Utilizamos cookies de publicidade para exibir anúncios relevantes:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li><strong>Google AdSense:</strong> exibe anúncios contextualizados baseados no conteúdo da página</li>
              <li><strong>Anúncios personalizados:</strong> podem usar seu histórico de navegação para mostrar anúncios mais relevantes</li>
              <li><strong>Remarketing:</strong> exibe anúncios do Emprega Brasil+ em outros sites que você visita</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mb-3 mt-6">4. Cookies de Funcionalidade</h3>
            <p className="text-slate-600 mb-4">
              Melhoram a experiência oferecendo funcionalidades personalizadas:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li><strong>Preferências de usuário:</strong> lembram suas configurações de filtros de busca</li>
              <li><strong>Histórico:</strong> registram vagas visualizadas recentemente</li>
              <li><strong>Favoritos:</strong> armazenam suas vagas favoritas</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">Cookies de Terceiros</h2>
            <p className="text-slate-600 mb-4">
              Utilizamos serviços de terceiros que podem definir seus próprios cookies:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li><strong>Google AdSense:</strong> para publicidade contextualizada</li>
              <li><strong>Google Analytics:</strong> para análise de tráfego e comportamento</li>
              <li><strong>AdsTerra:</strong> parceiro adicional de publicidade</li>
              <li><strong>Redes sociais:</strong> botões de compartilhamento (WhatsApp, Facebook, etc)</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">Como Gerenciar Cookies</h2>
            <p className="text-slate-600 mb-4">
              Você pode controlar e gerenciar cookies de várias formas:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li><strong>Configurações do navegador:</strong> a maioria dos navegadores permite bloquear ou excluir cookies</li>
              <li><strong>Modo anônimo/privado:</strong> navegadores oferecem modo de navegação que não armazena cookies</li>
              <li><strong>Desativar cookies de terceiros:</strong> você pode desabilitar apenas cookies de publicidade mantendo os essenciais</li>
              <li><strong>Google Ads Settings:</strong> acesse <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:underline">adssettings.google.com</a> para gerenciar anúncios personalizados</li>
            </ul>

            <p className="text-slate-600 mb-6">
              <strong>Atenção:</strong> Desabilitar cookies essenciais pode afetar o funcionamento da plataforma e impedir acesso a certas funcionalidades.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">Tempo de Armazenamento</h2>
            <p className="text-slate-600 mb-6">
              Os cookies têm diferentes períodos de validade:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li><strong>Cookies de sessão:</strong> expiram quando você fecha o navegador</li>
              <li><strong>Cookies persistentes:</strong> permanecem por períodos específicos (dias, meses ou anos) conforme necessário</li>
              <li><strong>Cookies de autenticação:</strong> mantêm você conectado por até 30 dias</li>
              <li><strong>Cookies de análise:</strong> geralmente válidos por até 2 anos</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">Atualizações desta Política</h2>
            <p className="text-slate-600 mb-6">
              Podemos atualizar esta política periodicamente. Alterações significativas serão comunicadas através de aviso no site ou por e-mail.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">Contato</h2>
            <p className="text-slate-600">
              Dúvidas sobre nossa política de cookies? Entre em contato:<br />
              <strong>E-mail:</strong> rhvagasabertasparaiba@gmail.com<br />
              <strong>WhatsApp:</strong> (83) 99197-1320<br />
              <strong>CNPJ:</strong> 62.874.724/0001-11
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}