import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, Send, Users, AlertCircle, ExternalLink,
  Briefcase, ShoppingBag, Home, Wrench, GraduationCap,
  TrendingUp, Laptop, Calendar, MapPin, Globe
} from "lucide-react";

const CATEGORIES = [
  { name: "Vagas de Emprego",          icon: Briefcase,    color: "from-blue-600 to-blue-700",    bg: "bg-blue-50 dark:bg-blue-900/20",    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",    border: "border-blue-200 dark:border-blue-800/40" },
  { name: "Compra e Venda",            icon: ShoppingBag,  color: "from-orange-500 to-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800/40" },
  { name: "Imóveis",                   icon: Home,         color: "from-emerald-600 to-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-900/20", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800/40" },
  { name: "Serviços e Profissionais",  icon: Wrench,       color: "from-yellow-500 to-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-800/40" },
  { name: "Cursos e Educação",         icon: GraduationCap, color: "from-purple-600 to-purple-700", bg: "bg-purple-50 dark:bg-purple-900/20", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800/40" },
  { name: "Empreendedorismo e Negócios", icon: TrendingUp, color: "from-rose-500 to-rose-600",    bg: "bg-rose-50 dark:bg-rose-900/20",    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",    border: "border-rose-200 dark:border-rose-800/40" },
  { name: "Tecnologia e Informática",  icon: Laptop,       color: "from-cyan-600 to-cyan-700",    bg: "bg-cyan-50 dark:bg-cyan-900/20",    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",    border: "border-cyan-200 dark:border-cyan-800/40" },
  { name: "Eventos e Oportunidades",   icon: Calendar,     color: "from-pink-500 to-pink-600",    bg: "bg-pink-50 dark:bg-pink-900/20",    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",    border: "border-pink-200 dark:border-pink-800/40" },
  { name: "Comunidade Local",          icon: MapPin,       color: "from-teal-600 to-teal-700",    bg: "bg-teal-50 dark:bg-teal-900/20",    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",    border: "border-teal-200 dark:border-teal-800/40" },
  { name: "Assuntos Diversos",         icon: Globe,        color: "from-slate-500 to-slate-600",  bg: "bg-slate-50 dark:bg-slate-800/40",  badge: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",  border: "border-slate-200 dark:border-slate-700" },
];

const getPlatformColor = (type) => {
  if (type === 'telegram') return 'bg-[#0088cc]';
  if (type === 'facebook') return 'bg-[#1877f2]';
  return 'bg-[#25D366]';
};

const getPlatformIcon = (type) => {
  if (type === 'telegram') return <Send className="w-5 h-5" />;
  if (type === 'facebook') return <Users className="w-5 h-5" />;
  return <MessageCircle className="w-5 h-5" />;
};

const TYPE_LABELS = {
  whatsapp: 'WhatsApp',
  whatsapp_channel: 'Canal',
  telegram: 'Telegram',
  facebook: 'Facebook',
};

export default function Groups() {
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups_public'],
    queryFn: () => base44.entities.Group.list('order', 200),
  });

  const activeGroups = groups.filter(g => g.is_active !== false);

  const groupsByCategory = CATEGORIES.map(cat => ({
    ...cat,
    groups: activeGroups.filter(g => (g.category || 'Vagas de Emprego') === cat.name),
  })).filter(cat => cat.groups.length > 0);

  const totalGroups = activeGroups.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] dark:from-slate-900 dark:to-slate-900 pt-6 pb-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Hub de Comunidades</h1>
          <p className="text-white/70 text-sm">
            {totalGroups} grupos organizados por tema — encontre sua comunidade!
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-8 space-y-6">
        {/* Aviso grupos de vagas */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/30 shadow rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-200 text-sm">
                Grupos de WhatsApp têm limite de <strong>1.025 membros</strong>. Se um estiver cheio, tente o próximo — todos recebem o mesmo conteúdo.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && totalGroups === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Nenhum grupo disponível no momento.</p>
          </div>
        )}

        {/* Categories */}
        {groupsByCategory.map((cat) => {
          const CatIcon = cat.icon;
          return (
            <div key={cat.name}>
              {/* Category Header */}
              <div className={`flex items-center gap-3 mb-3`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0 shadow`}>
                  <CatIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-white text-base">{cat.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{cat.groups.length} grupo{cat.groups.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Groups Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                {cat.groups.map((group) => (
                  <Card key={group.id} className={`overflow-hidden hover:shadow-md transition-all duration-200 rounded-2xl ${cat.bg} ${cat.border} border`}>
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Platform Icon */}
                        <div className={`${getPlatformColor(group.type)} px-4 flex items-center justify-center text-white flex-shrink-0`}>
                          {getPlatformIcon(group.type)}
                        </div>
                        {/* Content */}
                        <div className="flex-1 p-4 min-w-0">
                          <h3 className="font-semibold text-slate-800 dark:text-white text-sm leading-snug mb-1 truncate">
                            {group.name}
                          </h3>
                          {group.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{group.description}</p>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <Badge className={`${cat.badge} border-0 text-xs rounded-full px-2 py-0.5`}>
                              {TYPE_LABELS[group.type] || group.type}
                            </Badge>
                            <a href={group.link} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className={`${getPlatformColor(group.type)} hover:opacity-90 text-white rounded-full text-xs h-7 px-3`}>
                                Entrar <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}