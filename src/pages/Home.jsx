import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, Briefcase, MessageCircle, Newspaper, Crown, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0056ff] to-[#003399] pt-12 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Vagas Abertas Paraíba
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Encontre sua próxima oportunidade de emprego
          </p>
          <Link to={createPageUrl('Jobs')}>
            <Button className="h-14 px-8 text-lg bg-white text-[#0056ff] hover:bg-white/90 rounded-xl">
              <Search className="w-5 h-5 mr-2" />
              Buscar Vagas
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-4 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to={createPageUrl('Jobs')}>
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Briefcase className="w-10 h-10 text-[#0056ff] mx-auto mb-3" />
                <h3 className="font-semibold text-lg">Vagas</h3>
                <p className="text-slate-500 text-sm">Ver oportunidades</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to={createPageUrl('Community')}>
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg">Comunidade</h3>
                <p className="text-slate-500 text-sm">Troque experiências</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to={createPageUrl('News')}>
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Newspaper className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg">Notícias</h3>
                <p className="text-slate-500 text-sm">Mercado de trabalho</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* CTA Premium */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-[#0056ff] to-[#003399] text-white">
          <CardContent className="p-8 text-center">
            <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Plano Premium</h2>
            <p className="text-white/80 mb-6">Acesso vitalício por R$29,90</p>
            <Link to={createPageUrl('Subscription')}>
              <Button className="bg-white text-[#0056ff] hover:bg-white/90 rounded-xl">
                Ver Planos <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}