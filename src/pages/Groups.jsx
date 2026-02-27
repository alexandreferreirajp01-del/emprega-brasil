import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users, AlertCircle, ExternalLink } from "lucide-react";

const getIcon = (type) => {
  if (type === 'telegram') return <Send className="w-8 h-8" />;
  if (type === 'facebook') return <Users className="w-8 h-8" />;
  return <MessageCircle className="w-8 h-8" />;
};

const getColor = (type) => {
  if (type === 'telegram') return 'bg-[#0088cc]';
  if (type === 'facebook') return 'bg-[#1877f2]';
  return 'bg-[#25D366]';
};

const getColorLight = (type) => {
  if (type === 'telegram') return 'bg-[#0088cc]/10 text-[#0088cc]';
  if (type === 'facebook') return 'bg-[#1877f2]/10 text-[#1877f2]';
  return 'bg-[#25D366]/10 text-[#25D366]';
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
    queryFn: () => base44.entities.Group.list('order', 100),
  });

  const activeGroups = groups.filter(g => g.is_active !== false);

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 pt-6 pb-12 px-4 transition-colors">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Grupos de Vagas</h1>
          <p className="text-white/70 dark:text-slate-300">Entre em nossos grupos exclusivos para receber vagas diariamente</p>
        </div>
      </div>

      {/* Warning */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 mb-6">
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/30 shadow-lg rounded-2xl transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Atenção aos Limites dos Grupos</h3>
                <p className="text-amber-700 dark:text-amber-200 text-sm leading-relaxed">
                  Cada grupo do WhatsApp possui uma capacidade máxima de <strong>1.025 membros</strong>. 
                  Caso não consiga entrar em um grupo por estar lotado, não se preocupe! 
                  Tente entrar no próximo grupo disponível. Todos os grupos recebem as mesmas vagas diariamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Grid */}
      <div className="max-w-4xl mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
        ) : activeGroups.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Nenhum grupo disponível no momento.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGroups.map((group) => (
              <Card key={group.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group rounded-2xl dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Icon Side */}
                    <div className={`${getColor(group.type)} p-6 flex items-center justify-center text-white`}>
                      {getIcon(group.type)}
                    </div>
                    
                    {/* Content Side */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-[#0A66C2] dark:group-hover:text-blue-400 transition-colors">
                            {group.name}
                          </h3>
                          {group.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{group.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <Badge className={`${getColorLight(group.type)} border-0 rounded-full`}>
                          {TYPE_LABELS[group.type] || group.type}
                        </Badge>
                        
                        <a href={group.link} target="_blank" rel="noopener noreferrer">
                          <Button 
                            size="sm" 
                            className={`${getColor(group.type)} hover:opacity-90 rounded-full text-white`}
                          >
                            Entrar
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}