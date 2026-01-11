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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-8">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] pt-4 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-white/80 hover:text-white mb-3 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-[#0A66C2]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Emprega Brasil+</h1>
              <p className="text-sm md:text-base text-white/80">Conectando talentos e oportunidades</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 space-y-4 md:space-y-6">
        {/* Missão */}
        <Card className="shadow-lg rounded-xl md:rounded-2xl dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4 md:p-6 lg:p-8">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-3 md:mb-4">Nossa Missão</h2>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              O Emprega Brasil+ nasceu com o objetivo de democratizar o acesso às oportunidades 
              de emprego em todo o Brasil. Acreditamos que todos merecem ter acesso a boas 
              oportunidades de trabalho, independente de onde estejam.
            </p>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="rounded-lg md:rounded-xl dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-3 md:p-4 text-center">
              <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-[#0A66C2] mx-auto mb-1 md:mb-2" />
              <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">500+</p>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Vagas Publicadas</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg md:rounded-xl dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-3 md:p-4 text-center">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-[#0A66C2] mx-auto mb-1 md:mb-2" />
              <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">1000+</p>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Usuários</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg md:rounded-xl dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-3 md:p-4 text-center">
              <MapPin className="w-6 h-6 md:w-8 md:h-8 text-[#0A66C2] mx-auto mb-1 md:mb-2" />
              <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">50+</p>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Cidades</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg md:rounded-xl dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-3 md:p-4 text-center">
              <Heart className="w-6 h-6 md:w-8 md:h-8 text-[#0A66C2] mx-auto mb-1 md:mb-2" />
              <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">100%</p>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Satisfação</p>
            </CardContent>
          </Card>
        </div>

        {/* O que oferecemos */}
        <Card className="shadow-lg rounded-xl md:rounded-2xl dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4 md:p-6 lg:p-8">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-3 md:mb-4">O que Oferecemos</h2>
            <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2 md:gap-3">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 dark:text-green-400 text-xs md:text-sm">✓</span>
                </div>
                <span>Vagas atualizadas diariamente de empresas de todo o Brasil</span>
              </li>
              <li className="flex items-start gap-2 md:gap-3">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 dark:text-green-400 text-xs md:text-sm">✓</span>
                </div>
                <span>Comunidade ativa para networking e troca de experiências</span>
              </li>
              <li className="flex items-start gap-2 md:gap-3">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 dark:text-green-400 text-xs md:text-sm">✓</span>
                </div>
                <span>Notícias e dicas sobre o mercado de trabalho</span>
              </li>
              <li className="flex items-start gap-2 md:gap-3">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 dark:text-green-400 text-xs md:text-sm">✓</span>
                </div>
                <span>Grupos de WhatsApp e Telegram para alertas de vagas</span>
              </li>
              <li className="flex items-start gap-2 md:gap-3">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 dark:text-green-400 text-xs md:text-sm">✓</span>
                </div>
                <span>Acesso premium com vagas exclusivas</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card className="shadow-lg rounded-xl md:rounded-2xl dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4 md:p-6 lg:p-8">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-3 md:mb-4">Entre em Contato</h2>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0A66C2]/10 dark:bg-[#0A66C2]/20 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 md:w-6 md:h-6 text-[#0A66C2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">E-mail</p>
                  <p className="text-sm md:text-base font-medium text-slate-800 dark:text-white break-all">alexandreferreirajp01@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0A66C2]/10 dark:bg-[#0A66C2]/20 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 md:w-6 md:h-6 text-[#0A66C2]" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">WhatsApp</p>
                  <p className="text-sm md:text-base font-medium text-slate-800 dark:text-white">(83) 99197-1320</p>
                </div>
              </div>
              <Button 
                onClick={handleWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg md:rounded-xl h-11 md:h-12 mt-2 md:mt-4 text-sm md:text-base"
              >
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Fale Conosco no WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="flex flex-wrap gap-3 md:gap-4 justify-center text-xs md:text-sm pb-4">
          <Link to={createPageUrl('Terms')} className="text-[#0A66C2] hover:underline">
            Termos de Uso
          </Link>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <Link to={createPageUrl('Privacy')} className="text-[#0A66C2] hover:underline">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </div>
  );
}