import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase, Users, MapPin, Heart, Mail, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function About() {
  const handleWhatsApp = () => {
    window.open('https://wa.me/5583991971320', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-6 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-[#0A66C2]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Emprega Brasil+</h1>
              <p className="text-white/80">A maior plataforma de empregos do Brasil</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 space-y-6">
        {/* Missão */}
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Nossa Missão</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              O Emprega Brasil+ é a maior plataforma de oportunidades de emprego do Brasil, conectando milhares de candidatos qualificados às melhores empresas do país. Nossa missão é democratizar o acesso ao mercado de trabalho, oferecendo uma experiência completa e intuitiva tanto para candidatos quanto para recrutadores.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Fundada em 2024, atendemos profissionais de todos os estados brasileiros com vagas nas áreas de tecnologia, administração, vendas, saúde, educação, engenharia e muito mais. Oferecemos ferramentas modernas de busca, notificações em tempo real, análise de perfil profissional e conexão direta com recrutadores verificados.
            </p>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <Briefcase className="w-8 h-8 text-[#0A66C2] mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">5.000+</p>
              <p className="text-sm text-slate-500">Vagas Ativas</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-[#0A66C2] mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">50.000+</p>
              <p className="text-sm text-slate-500">Usuários Ativos</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 text-[#0A66C2] mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">27</p>
              <p className="text-sm text-slate-500">Estados Atendidos</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-[#0A66C2] mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">1.200+</p>
              <p className="text-sm text-slate-500">Empresas Parceiras</p>
            </CardContent>
          </Card>
        </div>

        {/* O que oferecemos */}
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">O que Oferecemos</h2>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span>Mais de 5.000 vagas ativas em todos os estados brasileiros, atualizadas diariamente</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span>Sistema de busca avançada com filtros por localização, área de atuação, salário e tipo de contrato</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span>Ferramentas exclusivas: gerador de currículo profissional, simulador de entrevistas com IA e preparação personalizada</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span>Notícias atualizadas sobre mercado de trabalho, economia e dicas de carreira publicadas por especialistas</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span>Comunidade ativa com feed social para networking, grupos de WhatsApp com alertas de vagas e suporte ao candidato</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span>Plano Premium vitalício com acesso a vagas exclusivas de grandes empresas, sem mensalidade</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span>Painel para recrutadores com publicação ilimitada, gerenciamento de candidatos e análise de visualizações</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Entre em Contato</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0A66C2]/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#0A66C2]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">E-mail</p>
                  <a href="mailto:rhvagasabertasparaiba@gmail.com" className="font-medium text-[#0A66C2] hover:underline">rhvagasabertasparaiba@gmail.com</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0A66C2]/10 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-[#0A66C2]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">WhatsApp</p>
                  <p className="font-medium text-slate-800">(83) 99197-1320</p>
                </div>
              </div>
              <Button 
                onClick={handleWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] rounded-xl h-12 mt-4"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Fale Conosco no WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <Link to={createPageUrl('Terms')} className="text-[#0A66C2] hover:underline">
            Termos de Uso
          </Link>
          <span className="text-slate-300">|</span>
          <Link to={createPageUrl('Privacy')} className="text-[#0A66C2] hover:underline">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </div>
  );
}