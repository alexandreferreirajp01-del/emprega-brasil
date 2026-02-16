import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, Briefcase, DollarSign, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function LatestJobsToday({ jobs }) {
  // Obter hoje
  const now = new Date();
  const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Filtrar vagas postadas hoje - sem restrição de status
  const todayJobs = jobs
    .filter(job => {
      try {
        // Usar qualquer data disponível
        const dateToCheck = new Date(job.published_at || job.created_date);
        const jobDate = dateToCheck.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Comparar as datas em formato ISO (evita problemas de timezone)
        return jobDate === todayDate;
      } catch (e) {
        return false;
      }
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
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Últimas Vagas Publicadas Hoje
          </h2>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {todayJobs.map((job) => (
          <Link
            key={job.id}
            to={createPageUrl('JobDetail') + `?id=${job.id}`}
            className="group"
          >
            <Card className="h-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-3">
                {/* Title & Company */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 group-hover:text-[#0A66C2] transition-colors">
                  {job.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 truncate">
                  {job.company}
                </p>

                {/* Quick Info */}
                <div className="space-y-1 mb-2 text-xs">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{job.city}, {job.state}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Briefcase className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{job.job_type || 'CLT'}</span>
                  </div>
                  {job.salary_range && (
                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                      <DollarSign className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{formatSalary(job.salary_range)}</span>
                    </div>
                  )}
                </div>

                {/* Badge */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                  <Badge className="bg-green-500 text-white border-0 text-xs h-5">
                    Novo
                  </Badge>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {formatTimeAgo(job.published_at || job.created_date)}
                  </span>
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
            className="rounded-lg px-4 py-1 text-sm font-semibold hover:bg-[#0A66C2] hover:text-white transition-all"
          >
            Ver todas as vagas
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}