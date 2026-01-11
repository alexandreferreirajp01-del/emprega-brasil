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
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-[#0056ff]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vagas Abertas Paraíba</h1>
              <p className="text-white/80">Conectando talentos e oportunidades</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 space-y-6">
        {/* Missão */}
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Nossa Missão</h2>
            <p className="text-slate-600 leading-relaxed">
              O Vagas Abertas Paraíba nasceu com o objetivo de democratizar o acesso às oportunidades 
              de emprego no estado da Paraíba. Acreditamos que todos merecem ter acesso a boas 
              oportunidades de trabalho, independente de onde estejam.
            </p>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <Briefcase className="w-8 h-8 text-[#0056ff] mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">500+</p>
              <p className="text-sm text-slate-500">Vagas Publicadas</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-[#0056ff] mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">1000+</p>
              <p className="text-sm text-slate-500">Usuários</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 text-[#0056ff] mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">50+</p>
              <p className="text-sm text-slate-500">Cidades</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-[#0056ff] mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">100%</p>
              <p className="text-sm text-slate-500">Satisfação</p>
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
                <span>Vagas atualizadas diariamente de empresas da Paraíba</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span>Comunidade ativa para networking e troca de experiências</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span>Notícias e dicas sobre o mercado de trabalho</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span>Grupos de WhatsApp e Telegram para alertas de vagas</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span>Acesso premium com vagas exclusivas</span>
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
                <div className="w-12 h-12 bg-[#0056ff]/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#0056ff]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">E-mail</p>
                  <p className="font-medium text-slate-800">alexandreferreirajp01@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0056ff]/10 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-[#0056ff]" />
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
          <Link to={createPageUrl('Terms')} className="text-[#0056ff] hover:underline">
            Termos de Uso
          </Link>
          <span className="text-slate-300">|</span>
          <Link to={createPageUrl('Privacy')} className="text-[#0056ff] hover:underline">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </div>
  );
}