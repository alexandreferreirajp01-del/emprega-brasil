import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Briefcase, MessageCircle, Newspaper, Crown, ArrowRight, 
  MapPin, Calendar, Users, Star, TrendingUp, Building2, Eye,
  ChevronRight, Zap, Shield, CheckCircle, Clock, Heart, Handshake
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import TimeAgo from "@/components/common/TimeAgo";
import VisitTracker from "@/components/common/VisitTracker";
import PremiumModal from "@/components/subscription/PremiumModal";

// Função de fetch com retry robusto
async function fetchWithRetry(fetchFn, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fetchFn();
      if (result && result.length >= 0) {
        return result;
      }
    } catch (error) {
      console.warn(`Tentativa ${attempt + 1} falhou:`, error.message);
    }
    if (attempt < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 400 * Math.pow(2, attempt)));
    }
  }
  return [];
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [allViews, setAllViews] = useState([]);
  const [news, setNews] = useState([]);
  const [posts, setPosts] = useState([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          setIsVisitor(true);
          return;
        }
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setIsVisitor(true);
      }
    };
    checkAuth();
  }, []);

  // Carregar dados com retry robusto
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Carregar TODAS as jobs (sem limite)
      const jobsResult = await fetchWithRetry(() => 
        base44.entities.Job.list('-created_date', 10000)
      );
      if (isMounted) setJobs(jobsResult);

      // Carregar views
      const viewsResult = await fetchWithRetry(() => 
        base44.entities.JobView.list('-created_date', 5000)
      );
      if (isMounted) setAllViews(viewsResult);

      // Carregar notícias
      const newsResult = await fetchWithRetry(() => 
        base44.entities.News.list('-created_date', 50)
      );
      const publishedNews = newsResult.filter(n => n.status === 'published' || !n.status);
      if (isMounted) setNews(publishedNews);

      // Carregar posts do Feed
      const postsResult = await fetchWithRetry(() => 
        base44.entities.FeedPost.list('-created_date', 50)
      );
      if (isMounted) setPosts(postsResult);
    };

    loadData();

    return () => { isMounted = false; };
  }, []);

  // Contagem de views por vaga
  const viewsCountMap = {};
  allViews.forEach(v => {
    viewsCountMap[v.job_id] = (viewsCountMap[v.job_id] || 0) + 1;
  });

  // Filtrar apenas vagas em destaque
  const featuredJobs = jobs.filter(job => job.is_featured);



  const stats = [
    { label: 'Vagas Ativas', value: jobs.length, icon: Briefcase, color: 'text-blue-600' },
    { label: 'Notícias', value: news.length, icon: Newspaper, color: 'text-green-600' },
    { label: 'Posts', value: posts.length, icon: MessageCircle, color: 'text-purple-600' },
  ];

  const quickActions = [
    { label: 'Buscar Vagas', icon: Search, page: 'Jobs', color: 'bg-blue-600', desc: 'Encontre oportunidades' },
    { label: 'Feed', icon: MessageCircle, page: 'Feed', color: 'bg-purple-600', desc: 'Conecte-se' },
    { label: 'Notícias', icon: Newspaper, page: 'News', color: 'bg-green-600', desc: 'Fique informado' },
    { label: 'Grupos', icon: Users, page: 'Groups', color: 'bg-orange-600', desc: 'WhatsApp' },
  ];

  const tabs = [
    { id: 'jobs', label: 'Vagas', icon: Briefcase },
    { id: 'news', label: 'Notícias', icon: Newspaper },
    { id: 'feed', label: 'Feed', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <VisitTracker pageName="Home" user={user} />
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0056ff] via-[#0044cc] to-[#003399] pt-6 sm:pt-8 pb-24 sm:pb-20 px-3 sm:px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-6 sm:mb-8 px-2">
                  <Badge className="bg-white/20 text-white border-0 mb-3 sm:mb-4 px-3 sm:px-4 py-1 text-xs sm:text-sm">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {jobs.length > 0 ? `+${jobs.length}` : '200+'} {jobs.length === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                    Encontre Sua Próxima<br />Oportunidade
                  </h1>
                  <p className="text-white/80 text-sm sm:text-lg max-w-2xl mx-auto mb-5 sm:mb-8 px-2">
                    A maior plataforma de empregos da Paraíba.
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
                    <Link to={createPageUrl('Jobs')}>
                      <Button className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg bg-white text-[#0056ff] hover:bg-white/90 rounded-xl shadow-lg w-full sm:w-auto">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Buscar Vagas
                      </Button>
                    </Link>
                    {isVisitor && (
                      <Link to={createPageUrl('Splash')}>
                        <Button variant="outline" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg border-white text-white hover:bg-white/10 rounded-xl w-full sm:w-auto">
                          Criar Conta Grátis
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

          {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto px-2">
                    {stats.map((stat, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
                        <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white mx-auto mb-1 sm:mb-2" />
                        <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-[10px] sm:text-xs text-white/70 leading-tight">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="max-w-6xl mx-auto px-3 sm:px-4 -mt-12 mb-6 sm:mb-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {quickActions.map((action, i) => (
                    <Link key={i} to={createPageUrl(action.page)}>
                      <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-xl sm:rounded-2xl border-0 overflow-hidden h-full">
                        <CardContent className="p-3 sm:p-5">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 ${action.color} rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                            <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-slate-800 text-sm sm:text-base leading-tight">{action.label}</h3>
                          <p className="text-slate-500 text-xs sm:text-sm leading-tight mt-0.5">{action.desc}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

      {/* Main Content Grid */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Featured Jobs */}
            <Card className="rounded-xl sm:rounded-2xl border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 sm:p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm sm:text-lg">Vagas em Destaque</h2>
                    <p className="text-white/70 text-xs sm:text-sm">{featuredJobs.length} vagas selecionadas</p>
                  </div>
                </div>
                <Link to={createPageUrl('Jobs')}>
                  <Button variant="ghost" className="text-white hover:bg-white/10 rounded-lg sm:rounded-xl text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4">
                    Ver Todas <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardContent className="p-4 space-y-3">
                {featuredJobs.slice(0, 5).map((job) => (
                  <Link key={job.id} to={createPageUrl('JobDetail') + `?id=${job.id}`}>
                    <div className="p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-blue-100">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                              {job.title}
                            </h3>
                            <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs shrink-0">
                              <Star className="w-3 h-3 mr-1" /> Destaque
                            </Badge>
                          </div>
                          <p className="text-slate-500 text-sm flex items-center gap-1 mb-2">
                            <Building2 className="w-3 h-3" />
                            {job.company || 'Empresa'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {job.city && (
                              <Badge variant="secondary" className="rounded-full text-xs">
                                <MapPin className="w-3 h-3 mr-1" />
                                {job.city}
                              </Badge>
                            )}
                            {job.job_type && (
                              <Badge variant="outline" className="rounded-full text-xs">
                                {job.job_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <TimeAgo date={job.created_date} />
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <Eye className="w-3 h-3" />
                            {viewsCountMap[job.id] || 0} views
                          </p>
                          {job.salary_range && (
                            <p className="text-green-600 font-medium text-sm mt-1">{job.salary_range}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {featuredJobs.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma vaga em destaque</p>
                  </div>
                )}
              </CardContent>
            </Card>


          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <Card className="rounded-xl sm:rounded-2xl border-0 shadow-lg overflow-hidden">
              <div className="flex border-b bg-white">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2.5 sm:py-3 px-1 sm:px-2 text-center transition-all duration-300 relative ${
                      activeTab === tab.id 
                        ? 'bg-[#0056ff] text-white' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-0.5 sm:mb-1" />
                    <span className="text-[10px] sm:text-xs font-medium block">{tab.label}</span>
                  </button>
                ))}
              </div>
              
              <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                {/* Jobs Tab */}
                {activeTab === 'jobs' && (
                  <div className="divide-y">
                    {jobs.slice(0, 8).map((job) => (
                      <Link key={job.id} to={createPageUrl('JobDetail') + `?id=${job.id}`}>
                        <div className="p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                          <h4 className="font-medium text-slate-800 text-sm truncate mb-1">{job.title}</h4>
                          <p className="text-slate-500 text-xs truncate">{job.company}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {job.city && (
                              <Badge variant="secondary" className="text-xs rounded-full">
                                <MapPin className="w-2 h-2 mr-1" />
                                {job.city}
                              </Badge>
                            )}
                            <span className="text-xs text-slate-400"><TimeAgo date={job.created_date} /></span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {jobs.length === 0 && (
                      <div className="p-8 text-center text-slate-400">
                        <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma vaga</p>
                      </div>
                    )}
                  </div>
                )}

                {/* News Tab */}
                {activeTab === 'news' && (
                  <div className="divide-y">
                    {news.slice(0, 8).map((item) => (
                      <Link key={item.id} to={createPageUrl('NewsDetail') + `?id=${item.id}`}>
                        <div className="p-4 hover:bg-green-50 transition-colors cursor-pointer">
                          <h4 className="font-medium text-slate-800 text-sm line-clamp-2 mb-1">{item.title}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            {item.category && (
                              <Badge variant="outline" className="text-xs rounded-full">
                                {item.category}
                              </Badge>
                            )}
                            <span className="text-xs text-slate-400"><TimeAgo date={item.created_date} /></span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {news.length === 0 && (
                      <div className="p-8 text-center text-slate-400">
                        <Newspaper className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma notícia</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Feed Tab */}
                {activeTab === 'feed' && (
                  <div className="divide-y">
                    {posts.slice(0, 8).map((post) => (
                      <Link key={post.id} to={createPageUrl('Feed')}>
                        <div className="p-3 sm:p-4 hover:bg-purple-50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 mb-2">
                            {post.autor_foto ? (
                              <img src={post.autor_foto} alt="" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-3 h-3 text-purple-600" />
                              </div>
                            )}
                            <span className="text-xs text-slate-500 font-medium">{post.autor_nome || 'Usuário'}</span>
                            <span className="text-xs text-slate-400 ml-auto">
                              <TimeAgo date={post.created_date} />
                            </span>
                          </div>
                          <p className="text-slate-800 text-sm line-clamp-3 leading-relaxed">{post.conteudo}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {post.total_curtidas || 0}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" /> {post.total_comentarios || 0}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {posts.length === 0 && (
                      <div className="p-8 text-center text-slate-400">
                        <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum post</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              
              {/* View All Link */}
              <div className="p-3 border-t bg-slate-50">
                <Link to={createPageUrl(activeTab === 'jobs' ? 'Jobs' : activeTab === 'news' ? 'News' : 'Feed')}>
                  <Button variant="ghost" className="w-full text-[#0056ff] hover:bg-blue-50 rounded-xl">
                    Ver Todos <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Banner Parcerias */}
            <Card 
              className="rounded-2xl border-0 shadow-lg bg-gradient-to-r from-[#0056ff] to-[#0044cc] cursor-pointer hover:shadow-xl transition-all"
              onClick={() => window.location.href = createPageUrl('Parcerias')}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Handshake className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">Seja Parceiro</h3>
                    <p className="text-white/80 text-xs">Empresas têm benefícios exclusivos</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white" />
              </CardContent>
            </Card>

            {/* Premium CTA - apenas para visitantes e básicos */}
            {(isVisitor || !user || (user?.subscription_type !== 'premium' && user?.subscription_type !== 'admin' && user?.role !== 'admin')) && (
              <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-[#0056ff] to-[#003399] text-white overflow-hidden">
                <CardContent className="p-6 text-center relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="font-bold text-xl mb-2">Seja Premium</h3>
                  <p className="text-white/80 text-sm mb-4">
                    Acesso vitalício a todas as vagas exclusivas
                  </p>
                  <div className="text-3xl font-bold mb-4">
                    R$ 29,90
                    <span className="text-sm font-normal text-white/70 block">pagamento único</span>
                  </div>
                  <Button 
                    onClick={() => setShowPremiumModal(true)}
                    className="w-full bg-white text-[#0056ff] hover:bg-white/90 rounded-xl"
                  >
                    Assinar Agora
                  </Button>
                  <div className="flex items-center justify-center gap-2 mt-4 text-white/70 text-xs">
                    <Shield className="w-4 h-4" />
                    <span>Garantia de 7 dias</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Join Community */}
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Grupos do WhatsApp</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Entre nos nossos grupos e receba vagas em primeira mão
                </p>
                <Link to={createPageUrl('Groups')}>
                  <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] rounded-xl">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Entrar nos Grupos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        user={user}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}