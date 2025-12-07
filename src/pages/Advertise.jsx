import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Megaphone, Users, TrendingUp, Target, BarChart3, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Advertise() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Anuncie Conosco</h1>
          </div>
          <p className="text-white/80 mt-2">Alcance milhares de profissionais na Paraíba</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card className="rounded-2xl">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Por que anunciar no Vagas Abertas?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex gap-3">
                <Users className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">Audiência Qualificada</h3>
                  <p className="text-slate-600 text-sm">Milhares de profissionais ativos buscando oportunidades</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Target className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">Segmentação Precisa</h3>
                  <p className="text-slate-600 text-sm">Anúncios direcionados por categoria, cidade e perfil</p>
                </div>
              </div>
              <div className="flex gap-3">
                <TrendingUp className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">Crescimento Constante</h3>
                  <p className="text-slate-600 text-sm">Plataforma em expansão com novos usuários diariamente</p>
                </div>
              </div>
              <div className="flex gap-3">
                <BarChart3 className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">Resultados Mensuráveis</h3>
                  <p className="text-slate-600 text-sm">Relatórios de visualizações e engajamento</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Formatos de Anúncio</h2>
            <div className="space-y-4">
              <div className="border rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 mb-2">Banner Display</h3>
                <p className="text-slate-600 mb-3">Banners visuais em posições estratégicas do aplicativo</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Visibilidade em todas as páginas</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Formato responsivo</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Integração com Google AdSense</li>
                </ul>
              </div>

              <div className="border rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 mb-2">Vagas Patrocinadas</h3>
                <p className="text-slate-600 mb-3">Destaque suas vagas no topo dos resultados</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Maior visibilidade</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Badge de destaque</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Prioridade nas buscas</li>
                </ul>
              </div>

              <div className="border rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 mb-2">Newsletter</h3>
                <p className="text-slate-600 mb-3">Envio de campanhas para nossa base de usuários</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Alcance direto</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Segmentação por perfil</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Relatório de resultados</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 text-white">
          <CardContent className="p-6 md:p-8 text-center">
            <Megaphone className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-bold mb-3">Pronto para anunciar?</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Entre em contato conosco para conhecer nossos pacotes e começar a alcançar milhares de profissionais qualificados.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://wa.me/5583991971320?text=Olá! Gostaria de anunciar no Vagas Abertas Paraíba" target="_blank" rel="noopener noreferrer">
                <Button className="bg-white text-purple-600 hover:bg-white/90 px-6">
                  WhatsApp: (83) 99197-1320
                </Button>
              </a>
              <a href="mailto:rhvagasabertasparaiba@gmail.com?subject=Interesse em Anunciar">
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 px-6">
                  rhvagasabertasparaiba@gmail.com
                </Button>
              </a>
            </div>
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-sm text-white/70">
                <strong>Vagas Abertas Paraíba</strong><br />
                CNPJ: 62.874.724/0001-11
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}