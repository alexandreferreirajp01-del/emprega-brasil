import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, MapPin, TrendingUp, Users, Crown,
  Newspaper, MessageCircle, ArrowRight, Briefcase,
  CheckCircle, Star, Shield, Zap, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { formatRelativeDate } from "@/components/common/ClickableContent";

export default function Home() {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const visitorMode = localStorage.getItem('vagas_abertas_visitor_mode');
      if (visitorMode === 'true') {
        setIsVisitor(true);
        return;
      }
      
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setIsVisitor(true);
      }
    };
    checkAuth();
  }, []);

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs-count'],
    queryFn: async () => {
      try {
        return await base44.entities.Job.list('-created_date', 100) || [];
      } catch (e) {
        return [];
      }
    },
  });

  const { data: news = [] } = useQuery({
    queryKey: ['news-home'],
    queryFn: async () => {
      try {
        return await base44.entities.News.list('-created_date', 3) || [];
      } catch (e) {
        return [];
      }
    },
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['cities-count'],
    queryFn: async () => {
      try {
        return await base44.entities.City.list('name', 300) || [];
      } catch (e) {
        return [];
      }
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] pt-10 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="bg-white/20 text-white border-0 mb-6 px-4 py-2 text-sm">
              🚀 A maior plataforma de vagas da Paraíba
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Encontre sua próxima
              <span className="block">oportunidade</span>
            </h1>
            
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Milhares de vagas atualizadas diariamente nas principais cidades da Paraíba
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link to={createPageUrl('Jobs')} className="flex-1">
                <Button className="w-full h-14 text-lg bg-white text-[#0056ff] hover:bg-white/90 rounded-xl shadow-xl font-semibold">
                  <Search className="w-5 h-5 mr-2" />
                  Buscar Vagas
                </Button>
              </Link>
              <Link to={createPageUrl('Subscription')}>
                <Button variant="outline" className="w-full h-14 text-lg border-white/40 text-white hover:bg-white/10 rounded-xl font-semibold">
                  <Crown className="w-5 h-5 mr-2" />
                  Ver Planos
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-12 md:gap-20 mt-16"
          >
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-white">{jobs.length}+</p>
              <p className="text-white/70 text-sm mt-1">Vagas Ativas</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-white">{cities.length}+</p>
              <p className="text-white/70 text-sm mt-1">Cidades</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-white">24h</p>
              <p className="text-white/70 text-sm mt-1">Atualizações</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to={createPageUrl('Jobs')}>
            <Card className="bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-[#0056ff]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#0056ff] transition-colors">
                  <Briefcase className="w-7 h-7 text-[#0056ff] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-800">Vagas de Emprego</h3>
                  <p className="text-slate-500 text-sm">Encontre oportunidades</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to={createPageUrl('Community')}>
            <Card className="bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                  <MessageCircle className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-800">Comunidade</h3>
                  <p className="text-slate-500 text-sm">Troque experiências</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to={createPageUrl('News')}>
            <Card className="bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-500 transition-colors">
                  <Newspaper className="w-7 h-7 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-800">Notícias</h3>
                  <p className="text-slate-500 text-sm">Mercado de trabalho</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Por que usar o Vagas Abertas?</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            A plataforma mais completa para encontrar oportunidades de emprego na Paraíba
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center p-6 border-0 shadow-md">
            <div className="w-16 h-16 bg-[#0056ff]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-[#0056ff]" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Vagas Atualizadas</h3>
            <p className="text-slate-500 text-sm">Novas oportunidades adicionadas todos os dias</p>
          </Card>
          
          <Card className="text-center p-6 border-0 shadow-md">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Foco na Paraíba</h3>
            <p className="text-slate-500 text-sm">Vagas em todas as cidades do estado</p>
          </Card>
          
          <Card className="text-center p-6 border-0 shadow-md">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Comunidade Ativa</h3>
            <p className="text-slate-500 text-sm">Troque experiências com outros profissionais</p>
          </Card>
          
          <Card className="text-center p-6 border-0 shadow-md">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Rápido e Fácil</h3>
            <p className="text-slate-500 text-sm">Interface simples e intuitiva</p>
          </Card>
        </div>
      </div>

      {/* News Section */}
      {news.length > 0 && (
        <div className="bg-slate-100 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Últimas Notícias</h2>
                <p className="text-slate-500">Fique por dentro do mercado de trabalho</p>
              </div>
              <Link to={createPageUrl('News')} className="text-[#0056ff] font-medium flex items-center gap-1 hover:underline">
                Ver todas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={createPageUrl('NewsDetail') + `?id=${item.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full bg-white">
                      {item.image_url && (
                        <div className="h-44 overflow-hidden">
                          <img 
                            src={item.image_url} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardContent className="p-5">
                        <Badge variant="outline" className="mb-3 text-xs">{item.category}</Badge>
                        <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-[#0056ff] transition-colors mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {formatRelativeDate(item.created_date)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Premium CTA */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Acesso Premium Vitalício
          </h2>
          <p className="text-white/80 text-xl mb-4">
            Por apenas <span className="font-bold text-yellow-400 text-3xl">R$29,90</span>
          </p>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Tenha acesso ilimitado a todas as vagas exclusivas e funcionalidades premium para sempre
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Vagas Exclusivas</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Chat de Suporte</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Acesso Vitalício</span>
            </div>
          </div>
          
          <Link to={createPageUrl('Subscription')}>
            <Button className="h-16 px-10 text-xl bg-white text-[#0056ff] hover:bg-white/90 rounded-xl font-semibold shadow-xl">
              Adquirir Agora
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}