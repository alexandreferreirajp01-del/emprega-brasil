import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Briefcase, MessageCircle, Newspaper, Crown, ArrowRight, 
  MapPin, Calendar, Users, Star, TrendingUp, Building2, Eye,
  ChevronRight, Zap, Shield, CheckCircle, Clock, Heart, Handshake, Sparkles, Moon, Sun, RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import TimeAgo from "@/components/common/TimeAgo";
import VisitTracker from "@/components/common/VisitTracker";
import PremiumModal from "@/components/subscription/PremiumModal";
import PlansBanner from "@/components/common/PlansBanner";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícone amarelo para a sede
const sedeIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path fill="#FFD700" stroke="#000" stroke-width="1" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.688 12.5 28.5 12.5 28.5S25 22.188 25 12.5C25 5.596 19.404 0 12.5 0z"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#FFF"/>
    </svg>
  `),
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Ícone verde para subsedes estaduais
const subsedeIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path fill="#10B981" stroke="#000" stroke-width="1" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.688 12.5 28.5 12.5 28.5S25 22.188 25 12.5C25 5.596 19.404 0 12.5 0z"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#FFF"/>
    </svg>
  `),
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Coordenadas centrais dos estados brasileiros
const STATE_CENTERS = {
  'AC': [-8.77, -70.55], 'AL': [-9.71, -35.73], 'AP': [1.41, -51.77],
  'AM': [-3.47, -65.10], 'BA': [-12.96, -38.51], 'CE': [-3.71, -38.54],
  'DF': [-15.83, -47.86], 'ES': [-19.19, -40.34], 'GO': [-16.64, -49.31],
  'MA': [-2.55, -44.30], 'MT': [-12.64, -55.42], 'MS': [-20.51, -54.54],
  'MG': [-18.10, -44.38], 'PA': [-5.53, -52.29], 'PB': [-7.06, -35.55],
  'PR': [-24.89, -51.55], 'PE': [-8.28, -35.07], 'PI': [-8.28, -43.68],
  'RJ': [-22.84, -43.15], 'RN': [-5.22, -36.52], 'RS': [-30.01, -51.22],
  'RO': [-11.22, -62.80], 'RR': [1.99, -61.33], 'SC': [-27.33, -49.44],
  'SP': [-23.55, -46.64], 'SE': [-10.90, -37.07], 'TO': [-10.25, -48.25]
};

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
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [allViews, setAllViews] = useState([]);
  const [news, setNews] = useState([]);
  const [posts, setPosts] = useState([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [refreshingMap, setRefreshingMap] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (e) {
        // Não autenticado - OK, Home é pública
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

  // Agrupar vagas por estado (vagas que têm estado mas não têm cidade)
  const jobsByState = {};
  jobs.forEach(job => {
    if (job.state && (!job.city || job.city.trim() === '')) {
      if (!jobsByState[job.state]) {
        jobsByState[job.state] = [];
      }
      jobsByState[job.state].push(job);
    }
  });

  // Função para atualizar vagas manualmente
  const handleRefreshMap = async () => {
    setRefreshingMap(true);
    try {
      const jobsResult = await base44.entities.Job.list('-created_date', 10000);
      setJobs(jobsResult);
      console.log('Mapa atualizado com', jobsResult.filter(j => j.latitude && j.longitude && j.exibir_no_mapa !== false).length, 'vagas');
    } catch (error) {
      console.error('Erro ao atualizar mapa:', error);
      alert('Erro ao atualizar: ' + error.message);
    } finally {
      setRefreshingMap(false);
    }
  };





  const quickActions = [
    { label: 'Buscar Vagas', icon: Search, page: 'Jobs', color: 'bg-white', iconColor: 'text-[#1E6FB6]', desc: 'Encontre oportunidades' },
    { label: 'Feed', icon: MessageCircle, page: 'Feed', color: 'bg-[#1E6FB6]', desc: 'Conecte-se' },
    { label: 'Notícias', icon: Newspaper, page: 'News', color: 'bg-[#057642]', desc: 'Fique informado' },
    { label: 'Grupos', icon: Users, page: 'Groups', color: 'bg-[#F9C846]', desc: 'WhatsApp' },
  ];

  const tabs = [
    { id: 'jobs', label: 'Vagas', icon: Briefcase },
    { id: 'news', label: 'Notícias', icon: Newspaper },
    { id: 'feed', label: 'Feed', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[#F3F2EF] dark:bg-slate-900">
      <VisitTracker pageName="Home" user={user} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#1E6FB6] via-[#0B2F5B] to-[#0B2F5B] dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 pt-6 sm:pt-8 pb-24 sm:pb-20 px-3 sm:px-4 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white dark:bg-slate-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white dark:bg-slate-600 rounded-full blur-3xl"></div>
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
                    Vagas atualizadas diariamente em todo o Brasil
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
                    <Link to={createPageUrl('Jobs')}>
                      <Button className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg bg-white text-[#1E6FB6] hover:bg-white/90 rounded-xl shadow-lg w-full sm:w-auto">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Buscar Vagas
                      </Button>
                    </Link>
                    {!user && (
                      <Button 
                        onClick={() => {
                          sessionStorage.setItem('needs_login', 'true');
                          window.location.href = createPageUrl('Splash');
                        }}
                        className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg bg-[#1E6FB6] text-white hover:bg-[#0B2F5B] rounded-xl w-full sm:w-auto font-bold shadow-lg"
                      >
                        Entrar / Cadastrar
                      </Button>
                    )}
                  </div>
                </div>


                </div>
              </div>

              {/* Quick Actions */}
              <div className="max-w-6xl mx-auto px-3 sm:px-4 -mt-12 mb-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {quickActions.map((action, i) => (
                    <Link key={i} to={createPageUrl(action.page)}>
                      <Card className="bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-xl sm:rounded-2xl border-0 overflow-hidden h-full">
                        <CardContent className="p-3 sm:p-5">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 ${action.color} rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform ${action.color === 'bg-white' ? 'border-2 border-[#1E6FB6] dark:border-blue-400' : ''}`}>
                            <action.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${action.iconColor || 'text-white'}`} />
                          </div>
                          <h3 className="font-semibold text-slate-800 dark:text-white text-sm sm:text-base leading-tight transition-colors">{action.label}</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-tight mt-0.5 transition-colors">{action.desc}</p>
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
            <Card className="rounded-xl sm:rounded-2xl border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-800 transition-colors" style={{ minHeight: '400px' }}>
              <div className="bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] p-3 sm:p-4 flex items-center justify-between">
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
              <CardContent className="p-3 sm:p-4 space-y-3">
                {featuredJobs.slice(0, 5).map((job) => (
                  <Link key={job.id} to={createPageUrl('JobDetail') + `?id=${job.id}`}>
                    <div className="p-3 sm:p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group border border-transparent hover:border-[#0A66C2]/20 dark:hover:border-blue-400/20">
                      <div className="flex flex-col gap-3">
                        {/* Título e Badge */}
                        <div className="flex items-start gap-2">
                          <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-[#1E6FB6] dark:group-hover:text-blue-400 transition-colors flex-1 text-sm sm:text-base line-clamp-2">
                            {job.title}
                          </h3>
                          <Badge className="bg-yellow-100 text-yellow-700 border-0 text-[10px] sm:text-xs shrink-0 whitespace-nowrap">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" /> Destaque
                          </Badge>
                        </div>

                        {/* Empresa */}
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm flex items-center gap-1 transition-colors">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{job.company || 'Empresa'}</span>
                        </p>

                        {/* Badges e Informações */}
                        <div className="flex flex-wrap items-center gap-2">
                          {job.city && (
                            <Badge variant="secondary" className="rounded-full text-[10px] sm:text-xs">
                              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                              {job.city}
                            </Badge>
                          )}
                          {job.job_type && (
                            <Badge variant="outline" className="rounded-full text-[10px] sm:text-xs">
                              {job.job_type}
                            </Badge>
                          )}
                        </div>

                        {/* Rodapé com Stats */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 transition-colors">
                          <div className="flex items-center gap-3 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 transition-colors">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <TimeAgo date={job.created_date} />
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {viewsCountMap[job.id] || 0}
                            </span>
                          </div>
                          {job.salary_range && (
                            <p className="text-green-600 font-semibold text-xs sm:text-sm truncate max-w-[120px]">{job.salary_range}</p>
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

            {/* Mapa de Vagas */}
            <Card className="rounded-xl sm:rounded-2xl border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-800 transition-colors" style={{ position: 'relative', zIndex: 1, isolation: 'isolate' }}>
              <div className="bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] p-3 sm:p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm sm:text-lg">Mapa de Vagas</h2>
                    <p className="text-white/70 text-xs sm:text-sm">{jobs.filter(job => job.latitude && job.longitude && job.exibir_no_mapa !== false).length} vagas disponíveis</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleRefreshMap}
                  disabled={refreshingMap}
                  className="text-white hover:bg-white/10 rounded-lg sm:rounded-xl text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${refreshingMap ? 'animate-spin' : ''}`} />
                  {refreshingMap ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>
              <CardContent className="p-0">
                <div className="h-[400px] w-full" style={{ position: 'relative', zIndex: 1 }}>
                  <MapContainer
                    center={[-14.235, -51.925]}
                    zoom={4}
                    style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Marcador da Sede - Amarelo */}
                    <Marker 
                      position={[-7.1352, -34.8634]} 
                      icon={sedeIcon}
                    >
                      <Popup maxWidth={280} closeButton={true}>
                        <div className="p-2" style={{ minWidth: '240px' }}>
                          <h3 className="font-bold text-base mb-3 text-slate-900 leading-tight">
                            🏢 Sede web Vagas
                          </h3>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-slate-700">
                                Rua Rosalva Nepomuceno do Nascimento, 75<br/>
                                Planalto Boa Esperança<br/>
                                João Pessoa - PB<br/>
                                CEP: 58065-065
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-center text-slate-600 font-medium">
                              web Vagas - Central de Oportunidades
                            </p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Subsedes Estaduais (vagas com estado mas sem cidade) */}
                    {Object.entries(jobsByState).map(([state, stateJobs]) => {
                      const coords = STATE_CENTERS[state];
                      if (!coords) return null;
                      
                      return (
                        <Marker key={`subsede-${state}`} position={coords} icon={subsedeIcon}>
                          <Popup maxWidth={320} closeButton={true}>
                            <div className="p-2" style={{ minWidth: '280px' }}>
                              <h3 className="font-bold text-base mb-3 text-slate-900 leading-tight">
                                🏢 web Vagas - {state}
                              </h3>
                              <p className="text-sm text-slate-600 mb-3">
                                {stateJobs.length} {stateJobs.length === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                              </p>
                              
                              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {stateJobs.slice(0, 10).map(job => (
                                  <div key={job.id} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100">
                                    <Link 
                                      to={`${createPageUrl('JobDetail')}?id=${job.id}`}
                                      className="text-sm font-medium text-slate-900 hover:text-blue-600 block"
                                    >
                                      {job.title}
                                    </Link>
                                    {job.company && (
                                      <p className="text-xs text-slate-500">{job.company}</p>
                                    )}
                                  </div>
                                ))}
                                {stateJobs.length > 10 && (
                                  <p className="text-xs text-slate-500 text-center pt-2">
                                    + {stateJobs.length - 10} vagas
                                  </p>
                                )}
                              </div>

                              <Link 
                                to={createPageUrl('Jobs')}
                                className="block w-full text-center bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow-md no-underline mt-3"
                                style={{ color: 'white', textDecoration: 'none' }}
                              >
                                Ver todas as vagas
                              </Link>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                    {/* Marcadores das Vagas */}
                    {jobs
                      .filter(job => job.latitude && job.longitude && job.exibir_no_mapa !== false)
                      .map(job => (
                        <Marker key={job.id} position={[job.latitude, job.longitude]}>
                          <Popup maxWidth={280} closeButton={true}>
                            <div className="p-2" style={{ minWidth: '240px' }}>
                              <h3 className="font-bold text-base mb-3 text-slate-900 leading-tight">
                                {job.title || 'Vaga sem título'}
                              </h3>

                              <div className="space-y-2 mb-4">
                                <div className="flex items-start gap-2">
                                  <Building2 className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-slate-700">
                                    {job.company || 'Não informado'}
                                  </span>
                                </div>

                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-slate-700">
                                    {job.neighborhood ? `${job.neighborhood} - ` : ''}{job.city || 'Não informado'}, {job.state || ''}
                                  </span>
                                </div>

                                <div className="flex items-start gap-2">
                                  <Calendar className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-slate-700">
                                    <TimeAgo date={job.published_at || job.created_date} />
                                  </span>
                                </div>

                                {job.job_type && (
                                  <div className="flex items-start gap-2">
                                    <Briefcase className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-slate-700">{job.job_type}</span>
                                  </div>
                                )}

                                {job.salary_range && (
                                  <div className="mt-2 pt-2 border-t border-slate-200">
                                    <span className="text-sm font-semibold text-green-600">
                                      💰 {job.salary_range}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <Link 
                                to={`${createPageUrl('JobDetail')}?id=${job.id}`}
                                className="block w-full text-center bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg transition-all shadow-sm hover:shadow-md no-underline"
                                style={{ color: 'white', textDecoration: 'none' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Navegando para vaga:', job.id);
                                }}
                              >
                                Saiba mais →
                              </Link>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>
                  </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">

            {/* Banner Planos Premium - Dinâmico */}
            <PlansBanner />

            {/* Banner Parcerias */}
            <Card 
              className="rounded-2xl border-0 shadow-lg bg-gradient-to-r from-[#1E6FB6] to-[#0B2F5B] cursor-pointer hover:shadow-xl transition-all"
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

            {/* Premium CTA - apenas para não-premium */}
            {user && user?.subscription_type !== 'premium' && user?.subscription_type !== 'admin' && user?.role !== 'admin' && (
              <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-[#1E6FB6] to-[#0B2F5B] text-white overflow-hidden">
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
                    className="w-full bg-white text-[#1E6FB6] hover:bg-white/90 rounded-xl"
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
                <div className="w-14 h-14 bg-[#057642]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-[#057642]" />
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