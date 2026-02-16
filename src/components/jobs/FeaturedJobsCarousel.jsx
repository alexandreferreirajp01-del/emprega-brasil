import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, MapPin, Briefcase, DollarSign, Calendar, Crown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function FeaturedJobsCarousel({ jobs, viewCounts = {} }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    slidesToScroll: 1,
    skipSnaps: false,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 1 },
      '(min-width: 1024px)': { slidesToScroll: 1 },
    }
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const formatSalary = (salary) => {
    if (!salary) return 'A combinar';
    return salary;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    if (diff < 7) return `${diff}d atrás`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  if (!jobs || jobs.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Header centralizado */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Vagas em Destaque
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Oportunidades selecionadas especialmente para você
        </p>

        {/* Navigation Buttons - Desktop */}
        <div className="hidden md:flex gap-2 justify-center">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 md:gap-6">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={createPageUrl('JobDetail') + `?id=${job.id}`}
              className="flex-shrink-0 w-[90%] sm:w-[70%] md:w-[48%] lg:w-[32%] group"
            >
              <div className="relative h-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 dark:border-slate-700 group-hover:scale-[1.02]">
                {/* Badge Premium no topo */}
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
                    <Crown className="w-3 h-3 mr-1" />
                    Destaque
                  </Badge>
                </div>

                {/* Header com gradiente */}
                <div className="h-16 bg-gradient-to-br from-[#0A66C2] via-[#004182] to-[#0A66C2] relative">
                  <div className="absolute inset-0 bg-black/10"></div>
                  {/* Decoração */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Company Info */}
                  <div className="flex items-start justify-between mb-3 -mt-3">
                    <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-700 shadow-lg flex items-center justify-center border-2 border-white dark:border-slate-600">
                      <Briefcase className="w-7 h-7 text-[#0A66C2]" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                      <Calendar className="w-3 h-3" />
                      {formatDate(job.published_at || job.created_date)}
                    </div>
                  </div>

                  {/* Title & Company */}
                  <div className="mb-4">
                    <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 group-hover:text-[#0A66C2] dark:group-hover:text-blue-400 transition-colors leading-tight">
                      {job.title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium truncate">
                      {job.company}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs md:text-sm min-w-0">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#0A66C2]" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0">
                        {job.city}, {job.state}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs md:text-sm min-w-0">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#0A66C2]" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0">
                        {job.job_type || 'Não especificado'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs md:text-sm min-w-0">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#0A66C2]" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold truncate flex-1 min-w-0">
                        {formatSalary(job.salary_range)}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                      <Eye className="w-3 h-3 flex-shrink-0" />
                      <span className="whitespace-nowrap">{viewCounts[job.id] || 0}</span>
                    </div>
                    <div className="text-xs md:text-sm font-semibold text-[#0A66C2] dark:text-blue-400 group-hover:underline whitespace-nowrap">
                      Ver detalhes →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Dots Indicator - Mobile */}
      <div className="flex justify-center gap-2 mt-6 md:hidden">
        {Array.from({ length: Math.ceil(jobs.length / 1) }).map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === selectedIndex
                ? 'w-8 bg-[#0A66C2]'
                : 'w-2 bg-slate-300 dark:bg-slate-600'
            }`}
            onClick={() => emblaApi && emblaApi.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
}