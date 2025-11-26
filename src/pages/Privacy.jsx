import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
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
              O Vagas Abertas Paraíba coleta as seguintes informações:
            </p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li>Dados de cadastro: nome completo, e-mail e foto de perfil</li>
              <li>Dados de uso: páginas visitadas, vagas visualizadas</li>
              <li>Dados do dispositivo: tipo de navegador, sistema operacional</li>
              <li>Cookies e tecnologias similares para melhorar a experiência</li>
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
            <p className="text-slate-600 mb-6">
              Utilizamos cookies para melhorar sua experiência e exibir anúncios relevantes. 
              O Google e outros parceiros de publicidade podem usar cookies para exibir anúncios 
              baseados em visitas anteriores. Você pode desativar anúncios personalizados nas 
              configurações de anúncios do Google.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">5. Seus Direitos</h2>
            <p className="text-slate-600 mb-4">Você tem direito a:</p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incorretos</li>
              <li>Solicitar exclusão dos seus dados</li>
              <li>Revogar consentimento para marketing</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">6. Segurança</h2>
            <p className="text-slate-600 mb-6">
              Implementamos medidas de segurança técnicas e organizacionais para proteger 
              suas informações contra acesso não autorizado, alteração ou destruição.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">7. Contato</h2>
            <p className="text-slate-600">
              Para dúvidas sobre esta política, entre em contato pelo WhatsApp: (83) 99197-1320
              ou e-mail: alexandreferreirajp01@gmail.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}