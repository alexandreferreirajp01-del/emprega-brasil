import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Briefcase, MapPin, Building2, Clock, Eye, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import TimeAgo from "@/components/common/TimeAgo";

export default function RecentJobsBatch() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const idsParam = urlParams.get('ids');
        
        if (!idsParam) {
          window.location.href = createPageUrl('Jobs');
          return;
        }

        const jobIds = idsParam.split(',');
        const loadedJobs = [];

        for (const id of jobIds) {
          try {
            const job = await base44.entities.Job.get(id);
            if (job) loadedJobs.push(job);
          } catch (e) {
            console.warn(`Job ${id} not found`);
          }
        }

        setJobs(loadedJobs);
      } catch (e) {
        console.error('Error loading jobs:', e);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] dark:from-slate-800 dark:to-slate-950 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Jobs')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vagas Recém-Publicadas</h1>
              <p className="text-white/80 text-sm">{jobs.length} {jobs.length === 1 ? 'vaga disponível' : 'vagas disponíveis'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {jobs.length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">Nenhuma vaga encontrada</p>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Link key={job.id} to={createPageUrl('JobDetail') + `?id=${job.id}`}>
              <Card className="rounded-xl hover:shadow-lg transition-all cursor-pointer group border-0">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {job.image_url && (
                      <img 
                        src={job.image_url} 
                        alt={job.title}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-slate-800 dark:text-white group-hover:text-[#0A66C2] transition-colors line-clamp-2 mb-2">
                        {job.title}
                      </h3>
                      
                      {job.company && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm mb-2">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {job.city && (
                          <Badge variant="secondary" className="rounded-full text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {job.city}, {job.state}
                          </Badge>
                        )}
                        {job.job_type && (
                          <Badge variant="outline" className="rounded-full text-xs">
                            {job.job_type}
                          </Badge>
                        )}
                        {job.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
                            ⭐ Destaque
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          <TimeAgo date={job.created_date} />
                        </div>
                        {job.salary_range && (
                          <span className="text-green-600 font-semibold text-sm">
                            {job.salary_range}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}