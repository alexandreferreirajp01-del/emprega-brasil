import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, Briefcase, DollarSign, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function LatestJobsToday({ jobs }) {
  // Comparar datas em UTC para evitar problemas de timezone
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Filtrar vagas publicadas hoje (aceita 'ativa', undefined, ou draft)
  const todayJobs = jobs
    .filter(job => {
      const jobDate = new Date(job.published_at || job.created_date);
      // Comparar apenas o dia/mês/ano
      const jobDay = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
      
      const isToday = jobDay.getTime() === today.getTime();
      const isActive = !job.status || job.status === 'ativa' || job.status === 'draft';
      
      return isToday && isActive;
    })
    .sort((a, b) => new Date(b.published_at || b.created_date) - new Date(a.published_at || a.created_date))
    .slice(0, 4);

  const formatSalary = (salary) => {
    if (!salary) return 'A combinar';
    return salary;
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const jobDate = new Date(date);
    const diffInHours = Math.floor((now - jobDate) / (1000 * 60 * 60));
    
    if (diffInHours === 0) return 'Agora';
    if (diffInHours === 1) return 'Há 1 hora';
    if (diffInHours < 24) return `Há ${diffInHours} horas`;
    return 'Hoje';
  };

  if (todayJobs.length === 0) {
    return (
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Nenhuma vaga publicada hoje
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            Volte mais tarde para novas oportunidades
          </p>
          <Link to={createPageUrl('Jobs')}>
            <Button className="bg-[#0A66C2] hover:bg-[#004182]">
              Ver Todas as Vagas
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Últimas Vagas Publicadas Hoje
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Oportunidades atualizadas em tempo real para você
        </p>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {todayJobs.map((job) => (
          <Link
            key={job.id}
            to={createPageUrl('JobDetail') + `?id=${job.id}`}
            className="group"
          >
            <Card className="h-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
              <CardContent className="p-5">
                {/* Header com Badge Novo */}
                <div className="flex items-start justify-between mb-4">
                  <Badge className="bg-green-500 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Novo
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(job.published_at || job.created_date)}
                  </div>
                </div>

                {/* Title & Company */}
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-[#0A66C2] dark:group-hover:text-blue-400 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium truncate">
                    {job.company}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-start gap-2.5 text-sm">
                    <MapPin className="w-4 h-4 text-[#0A66C2] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Local</p>
                      <p className="text-slate-700 dark:text-slate-300 font-medium truncate">
                        {job.city}, {job.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-sm">
                    <Briefcase className="w-4 h-4 text-[#0A66C2] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Tipo</p>
                      <p className="text-slate-700 dark:text-slate-300 font-medium truncate">
                        {job.job_type || 'Não especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-sm">
                    <DollarSign className="w-4 h-4 text-[#0A66C2] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Salário</p>
                      <p className="text-slate-700 dark:text-slate-300 font-semibold truncate">
                        {formatSalary(job.salary_range)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="text-sm font-semibold text-[#0A66C2] dark:text-blue-400 group-hover:underline flex items-center">
                    Ver detalhes
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Ver Todas Button */}
      <div className="text-center">
        <Link to={createPageUrl('Jobs')}>
          <Button 
            variant="outline"
            className="rounded-xl px-6 py-2 font-semibold hover:bg-[#0A66C2] hover:text-white transition-all"
          >
            Ver todas as vagas
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}