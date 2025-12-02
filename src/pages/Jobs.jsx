import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, MapPin, Calendar, Briefcase, Building2, 
  Lock, Star, X, Eye, Share2
} from "lucide-react";
import FavoriteButton from "@/components/jobs/FavoriteButton";
import ShareJobDialog from "@/components/jobs/ShareJobDialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const CIDADES_PB = [
  "João Pessoa", "Campina Grande", "Bayeux", "Cabedelo", "Santa Rita",
  "Água Branca", "Aguiar", "Alagoa Grande", "Alagoa Nova", "Alagoinha", "Alcantil",
  "Algodão de Jandaíra", "Alhandra", "Amparo", "Aparecida", "Araçagi", "Arara",
  "Araruna", "Areia", "Areia de Baraúnas", "Areial", "Aroeiras", "Assunção",
  "Baía da Traição", "Bananeiras", "Baraúna", "Barra de Santa Rosa", "Barra de Santana",
  "Barra de São Miguel", "Belém", "Belém do Brejo do Cruz", "Bernardino Batista",
  "Boa Ventura", "Boa Vista", "Bom Jesus", "Bom Sucesso", "Bonito de Santa Fé",
  "Boqueirão", "Borborema", "Brejo do Cruz", "Brejo dos Santos", "Caaporã",
  "Cabaceiras", "Cachoeira dos Índios", "Cacimba de Areia", "Cacimba de Dentro",
  "Cacimbas", "Caiçara", "Caldas Brandão", "Camalaú", "Capim", "Caraúbas",
  "Carrapateira", "Casserengue", "Catingueira", "Catolé do Rocha", "Caturité",
  "Conceição", "Condado", "Conde", "Congo", "Coremas", "Coxixola",
  "Cruz do Espírito Santo", "Cubati", "Cuité", "Cuité de Mamanguape", "Cuitegi",
  "Curral de Cima", "Curral Velho", "Damião", "Desterro", "Diamante", "Dona Inês",
  "Duas Estradas", "Emas", "Esperança", "Fagundes", "Frei Martinho", "Gado Bravo",
  "Guarabira", "Gurinhém", "Gurjão", "Ibiara", "Igaracy", "Imaculada", "Ingá",
  "Itabaiana", "Itaporanga", "Itapororoca", "Itatuba", "Jacaraú", "Jericó",
  "Joca Claudino", "Juarez Távora", "Juazeirinho", "Junco do Seridó", "Juripiranga",
  "Juru", "Lagoa", "Lagoa de Dentro", "Lagoa Seca", "Lastro", "Livramento",
  "Logradouro", "Lucena", "Mãe d'Água", "Malta", "Mamanguape", "Manaíra",
  "Marcação", "Mari", "Marizópolis", "Massaranduba", "Mataraca", "Matinhas",
  "Mato Grosso", "Maturéia", "Mogeiro", "Montadas", "Monte Horebe", "Monteiro",
  "Mulungu", "Natuba", "Nazarezinho", "Nova Floresta", "Nova Olinda", "Nova Palmeira",
  "Olho d'Água", "Olivedos", "Ouro Velho", "Parari", "Passagem", "Patos", "Paulista",
  "Pedra Branca", "Pedra Lavrada", "Pedras de Fogo", "Pedro Régis", "Piancó", "Picuí",
  "Pilar", "Pilões", "Pilõezinhos", "Pirpirituba", "Pitimbu", "Pocinhos",
  "Poço Dantas", "Poço de José de Moura", "Pombal", "Prata", "Princesa Isabel",
  "Puxinanã", "Queimadas", "Quixaba", "Remígio", "Riachão", "Riachão do Bacamarte",
  "Riachão do Poço", "Riacho de Santo Antônio", "Riacho dos Cavalos", "Rio Tinto",
  "Salgadinho", "Salgado de São Félix", "Santa Cecília", "Santa Cruz", "Santa Helena",
  "Santa Inês", "Santa Luzia", "Santa Teresinha", "Santana de Mangueira",
  "Santana dos Garrotes", "Santarém", "Santo André", "São Bentinho", "São Bento",
  "São Domingos", "São Domingos do Cariri", "São Francisco", "São João do Cariri",
  "São João do Rio do Peixe", "São João do Tigre", "São José da Lagoa Tapada",
  "São José de Caiana", "São José de Espinharas", "São José de Piranhas",
  "São José de Princesa", "São José do Bonfim", "São José do Brejo do Cruz",
  "São José do Sabugi", "São José dos Cordeiros", "São José dos Ramos", "São Mamede",
  "São Miguel de Taipu", "São Sebastião de Lagoa de Roça", "São Sebastião do Umbuzeiro",
  "Sapé", "Serra Branca", "Serra da Raiz", "Serra Grande", "Serra Redonda", "Serraria",
  "Sertãozinho", "Sobrado", "Solânea", "Soledade", "Sossego", "Sousa", "Sumé",
  "Tacima", "Taperoá", "Tavares", "Teixeira", "Tenório", "Triunfo", "Uiraúna",
  "Umbuzeiro", "Várzea", "Vieirópolis", "Vista Serrana", "Zabelê"
];
import TimeAgo, { getTimeAgo } from "@/components/common/TimeAgo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

const JOB_FUNCTIONS = [
  "Auxiliar de cozinha", "ASG", "Auxiliar administrativo", "Analista administrativo",
  "Analista de compras", "Analista de logística", "Analista de marketing",
  "Analista de recursos humanos", "Analista de sistemas", "Atendente de balcão",
  "Atendente de call center", "Auxiliar de limpeza", "Auxiliar de manutenção",
  "Auxiliar de mecânico", "Auxiliar de produção", "Bibliotecário", "Biomédico",
  "Bombeiro", "Cabeleireiro", "Caixa de supermercado", "Carpinteiro",
  "Consultor de vendas", "Coordenador administrativo", "Coordenador de produção",
  "Coordenador de recursos humanos", "Cozinheiro", "Designer gráfico",
  "Desenvolvedor de software", "Digitador", "Eletricista", "Engenheiro civil",
  "Engenheiro de produção", "Engenheiro eletricista", "Engenheiro mecânico",
  "Farmacêutico", "Fisioterapeuta", "Garçom", "Jardineiro", "Jornalista",
  "Motorista", "Nutricionista", "Operador de caixa", "Operador de máquinas",
  "Pedreiro", "Pintor", "Professor", "Psicólogo", "Porteiro", "Recepcionista",
  "Técnico de enfermagem", "Técnico em informática", "Técnico em manutenção",
  "Vendedor", "Zelador", "Mecânico", "Balconista", "Copeiro", "Babá",
  "Lavador de Carros", "Faturista", "Departamento Pessoal", "Repositor",
  "Manobrista", "Tec Enfermagem", "Enfermeira", "Médica", "Gestor Comercial",
  "Gerente", "Coordenador", "Assistente Fiscal", "Assistente contábil",
  "Tec Segurança do trabalho", "Controladoria", "Compras", "Promotor de vendas",
  "Carregador", "Estoquista", "Logística", "Panfletista", "Outros"
];

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFunction, setSelectedFunction] = useState('all');
  const [citySearch, setCitySearch] = useState('');
  const [funcSearch, setFuncSearch] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [funcOpen, setFuncOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isVisitor, setIsVisitor] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const searchParam = urlParams.get('search');
    if (typeParam) setSelectedType(typeParam);
    if (searchParam) setSearchTerm(searchParam);
  }, []);

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

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs-list'],
    queryFn: async () => {
      const result = await base44.entities.Job.list('-created_date', 1000);
      return result || [];
    },
    staleTime: 30000,
    gcTime: 120000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 500,
  });



  const { data: allViews = [] } = useQuery({
    queryKey: ['all-job-views'],
    queryFn: async () => {
      const result = await base44.entities.JobView.list('-created_date', 5000);
      return result || [];
    },
    staleTime: 60000,
    gcTime: 300000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const viewsCountMap = {};
  allViews.forEach(v => {
    viewsCountMap[v.job_id] = (viewsCountMap[v.job_id] || 0) + 1;
  });

  const userIsPremium = user?.subscription_type === 'premium' || user?.subscription_type === 'admin' || user?.role === 'admin' || user?.email === 'alexandreferreirajp01@gmail.com';

  const canViewJob = (job) => {
    if (!job.is_premium) return true;
    if (userIsPremium) return true;
    return false;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_function?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = selectedCity === 'all' || job.city === selectedCity;
    const matchesType = selectedType === 'all' || job.job_type === selectedType;
    const matchesFunction = selectedFunction === 'all' || job.job_function === selectedFunction;
    
    return matchesSearch && matchesCity && matchesType && matchesFunction;
  });

  // Filtrar cidades pela busca
  const filteredCities = CIDADES_PB.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity('all');
    setSelectedType('all');
    setSelectedFunction('all');
    setCitySearch('');
    setFuncSearch('');
  };

  const hasActiveFilters = searchTerm || selectedCity !== 'all' || selectedType !== 'all' || selectedFunction !== 'all';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Vagas de Emprego</h1>
          
          {/* Barra de Pesquisa Principal */}
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Pesquisar por cargo, empresa, cidade ou função..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-12 pr-4 rounded-lg border-0 bg-slate-50 text-base w-full"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-6xl mx-auto px-4 -mt-4">
        <Card className="shadow-lg rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Filtrar por:</span>
              
              {/* Filtro Cidade com busca */}
              <Popover open={cityOpen} onOpenChange={setCityOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] h-10 rounded-lg justify-start">
                    <MapPin className="w-4 h-4 text-slate-400 mr-2" />
                    <span className="truncate">
                      {selectedCity === 'all' ? 'Cidade' : selectedCity}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[220px] p-0" 
                  align="start"
                  side="bottom"
                  collisionPadding={{ top: 10, bottom: 200 }}
                >
                  <Command>
                    <CommandInput 
                      placeholder="Buscar cidade..." 
                      value={citySearch}
                      onValueChange={setCitySearch}
                    />
                    <CommandList className="max-h-[180px]">
                      <CommandEmpty>Nenhuma cidade encontrada</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedCity('all');
                            setCityOpen(false);
                            setCitySearch('');
                          }}
                        >
                          Todas as cidades
                        </CommandItem>
                        {filteredCities.map((city) => (
                          <CommandItem
                            key={city}
                            value={city}
                            onSelect={() => {
                              setSelectedCity(city);
                              setCityOpen(false);
                              setCitySearch('');
                            }}
                          >
                            {city}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Filtro Tipo */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px] h-10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <SelectValue placeholder="Tipo" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="Home Office">Home Office</SelectItem>
                  <SelectItem value="Estágio">Estágio</SelectItem>
                  <SelectItem value="Temporário">Temporário</SelectItem>
                  <SelectItem value="Jovem Aprendiz">Jovem Aprendiz</SelectItem>
                  <SelectItem value="Freelancer">Freelancer</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="PCD">PCD</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Função */}
              <Popover open={funcOpen} onOpenChange={setFuncOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[160px] h-10 rounded-lg justify-start">
                    <Briefcase className="w-4 h-4 text-slate-400 mr-2" />
                    <span className="truncate text-sm">
                      {selectedFunction === 'all' ? 'Função' : selectedFunction}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[220px] p-0" 
                  align="start"
                  side="bottom"
                  collisionPadding={{ top: 10, bottom: 200 }}
                >
                  <Command>
                    <CommandInput 
                      placeholder="Buscar função..." 
                      value={funcSearch}
                      onValueChange={setFuncSearch}
                    />
                    <CommandList className="max-h-[180px]">
                      <CommandEmpty>Nenhuma função encontrada</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedFunction('all');
                            setFuncOpen(false);
                            setFuncSearch('');
                          }}
                        >
                          Todas funções
                        </CommandItem>
                        {JOB_FUNCTIONS.filter(f => 
                          f.toLowerCase().includes(funcSearch.toLowerCase())
                        ).map((func) => (
                          <CommandItem
                            key={func}
                            value={func}
                            onSelect={() => {
                              setSelectedFunction(func);
                              setFuncOpen(false);
                              setFuncSearch('');
                            }}
                          >
                            {func}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters} 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" /> Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-sm text-slate-500 mb-4">
          {filteredJobs.length} vaga{filteredJobs.length !== 1 ? 's' : ''} encontrada{filteredJobs.length !== 1 ? 's' : ''}
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-5 bg-slate-200 rounded w-1/2 mb-3" />
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id}>
                <JobCard job={job} canView={canViewJob(job)} viewCount={viewsCountMap[job.id] || 0} user={user} />
              </div>
            ))}
          </div>
        )}

        {filteredJobs.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Briefcase className="w-20 h-20 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-slate-500 mb-6">Tente ajustar os filtros ou termo de busca</p>
            <Button onClick={clearFilters} variant="outline" className="rounded-lg">
              Limpar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, canView, viewCount = 0, user }) {
  const [shareOpen, setShareOpen] = useState(false);
  
  if (!canView) {
    return (
      <Card className="overflow-hidden relative">
        <CardContent className="p-6">
          <JobCardContent job={job} viewCount={viewCount} />
        </CardContent>
        {/* Indicadores de vaga premium bloqueada */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded-md text-xs">
          <Lock className="w-3 h-3" />
        </div>
        <div className="absolute bottom-3 right-3 bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-medium">
          Vaga Premium
        </div>
        {/* Overlay clicável */}
        <Link to={createPageUrl('Subscription')} className="absolute inset-0 z-10" />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group border-l-4 border-l-transparent hover:border-l-[#0056ff]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <Link to={createPageUrl('JobDetail') + `?id=${job.id}`} className="flex-1">
            <JobCardContent job={job} viewCount={viewCount} />
          </Link>
          <div className="flex flex-col gap-1 ml-3">
            <FavoriteButton job={job} user={user} size="sm" />
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                setShareOpen(true);
              }}
              className="h-8 w-8 rounded-full text-slate-400 hover:text-[#0056ff]"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      <ShareJobDialog open={shareOpen} onOpenChange={setShareOpen} job={job} />
    </Card>
  );
}

function JobCardContent({ job, viewCount }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h3 className="font-semibold text-lg text-slate-800 group-hover:text-[#0056ff] transition-colors">
            {job.title || 'Vaga não informada'}
          </h3>
          {job.is_featured && (
            <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
              <Star className="w-3 h-3 mr-1" /> Destaque
            </Badge>
          )}
          {job.is_premium && (
            <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
              Premium
            </Badge>
          )}
        </div>
        
        <p className="text-slate-500 flex items-center gap-1 mb-3">
          <Building2 className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{job.company || 'Empresa confidencial'}</span>
        </p>
        
        <div className="flex flex-wrap gap-2">
          {job.city && (
            <Badge variant="secondary" className="rounded-full text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {job.city}
            </Badge>
          )}
          {job.job_type && (
            <Badge variant="secondary" className="rounded-full text-xs">
              {job.job_type}
            </Badge>
          )}
          {job.job_function && (
            <Badge variant="outline" className="rounded-full text-xs">
              {job.job_function}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 text-right">
        <p className="text-sm text-slate-500 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <TimeAgo date={job.created_date} />
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {viewCount} views
        </p>
        {job.salary_range && (
          <p className="font-semibold text-green-600 text-sm">{job.salary_range}</p>
        )}
      </div>
    </div>
  );
}