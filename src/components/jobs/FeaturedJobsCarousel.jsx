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
    <div className="mb-4">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Vagas em Destaque
          </h2>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={createPageUrl('JobDetail') + `?id=${job.id}`}
              className="flex-shrink-0 w-[90%] sm:w-[70%] md:w-[48%] lg:w-[32%] group"
            >
              <div className="h-full bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-700">
                {/* Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-orange-500 text-white border-0 text-xs h-5">
                    <Crown className="w-3 h-3 mr-1" />
                    Destaque
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-3">
                  {/* Title & Company */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 group-hover:text-orange-500 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2 truncate">
                    {job.company}
                  </p>

                  {/* Details */}
                  <div className="space-y-1 mb-2 text-xs">
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{job.city}, {job.state}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <Briefcase className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{job.job_type}</span>
                    </div>
                    {job.salary_range && (
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                        <DollarSign className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{formatSalary(job.salary_range)}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                    <p className="text-xs font-semibold text-orange-500 dark:text-orange-400 flex items-center group-hover:gap-1 transition-all">
                      Saiba mais
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Navigation & Dots */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1">
          <button
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
            className="bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-slate-900 dark:text-white" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
            className="bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-slate-900 dark:text-white" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: Math.ceil(jobs.length / 1) }).map((_, index) => (
            <button
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === selectedIndex
                  ? 'w-6 bg-orange-500'
                  : 'w-1.5 bg-slate-300 dark:bg-slate-600'
              }`}
              onClick={() => emblaApi && emblaApi.scrollTo(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}