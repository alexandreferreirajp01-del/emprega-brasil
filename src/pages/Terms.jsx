import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Termos de Uso</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 md:p-8 prose prose-slate max-w-none">
            <p className="text-slate-500 mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-slate-600 mb-6">
              Ao acessar e usar o Vagas Abertas Paraíba, você concorda com estes Termos de Uso. 
              Se não concordar, não use nossos serviços.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">2. Descrição do Serviço</h2>
            <p className="text-slate-600 mb-6">
              O Vagas Abertas Paraíba é uma plataforma de divulgação de vagas de emprego no estado da Paraíba. 
              Oferecemos acesso gratuito a vagas públicas e acesso premium a vagas exclusivas.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Cadastro e Conta</h2>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li>Você deve fornecer informações verdadeiras no cadastro</li>
              <li>É responsável por manter a segurança da sua conta</li>
              <li>Deve ter pelo menos 18 anos ou autorização dos responsáveis</li>
              <li>Uma conta por pessoa</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Uso Aceitável</h2>
            <p className="text-slate-600 mb-4">Você concorda em NÃO:</p>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li>Publicar conteúdo falso, ofensivo ou ilegal</li>
              <li>Usar bots ou scripts automatizados</li>
              <li>Tentar acessar áreas restritas</li>
              <li>Copiar ou distribuir nosso conteúdo sem autorização</li>
              <li>Prejudicar outros usuários</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">5. Plano Premium</h2>
            <ul className="list-disc pl-6 text-slate-600 mb-6">
              <li>O plano premium é vitalício após pagamento único</li>
              <li>Garantia de reembolso de 7 dias</li>
              <li>Acesso a todas as vagas, incluindo exclusivas</li>
              <li>Não transferível para outra pessoa</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">6. Vagas de Emprego</h2>
            <p className="text-slate-600 mb-6">
              Não garantimos a veracidade de todas as vagas publicadas. O Vagas Abertas Paraíba 
              não é responsável por relações de trabalho estabelecidas entre usuários e empresas.
              Recomendamos verificar a legitimidade das ofertas antes de fornecer dados pessoais.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">7. Propriedade Intelectual</h2>
            <p className="text-slate-600 mb-6">
              Todo o conteúdo da plataforma (design, logos, textos) é de propriedade do 
              Vagas Abertas Paraíba ou licenciado por terceiros.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">8. Publicidade</h2>
            <p className="text-slate-600 mb-6">
              O serviço pode exibir anúncios de terceiros. Não nos responsabilizamos pelo 
              conteúdo dos anúncios exibidos pelo Google AdSense ou outros parceiros.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">9. Limitação de Responsabilidade</h2>
            <p className="text-slate-600 mb-6">
              O serviço é fornecido "como está". Não garantimos disponibilidade ininterrupta 
              ou ausência de erros. Nossa responsabilidade é limitada ao valor pago pelo plano premium.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">10. Alterações</h2>
            <p className="text-slate-600 mb-6">
              Podemos alterar estes termos a qualquer momento. Alterações significativas 
              serão comunicadas por e-mail ou notificação no app.
            </p>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">11. Contato</h2>
            <p className="text-slate-600">
              Dúvidas? Entre em contato pelo WhatsApp: (83) 99197-1320 
              ou e-mail: alexandreferreirajp01@gmail.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}