import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Trash2, Eye, Star, Edit, Newspaper } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function GerenciarNoticiasLista() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.role === 'admin' || currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const { data: news = [] } = useQuery({
    queryKey: ['all-news'],
    queryFn: () => base44.entities.News.list('-created_date', 500),
    enabled: !!user,
  });

  const deleteNewsMutation = useMutation({
    mutationFn: (id) => base44.entities.News.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-news'] });
      alert('Notícia excluída!');
    },
    onError: () => alert('Erro ao excluir')
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-3 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gerenciar Notícias</h1>
              <p className="text-white/70 text-sm">{news.length} notícias cadastradas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {news.map((item) => (
          <Card key={item.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 truncate">{item.title}</h3>
                    {item.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-700 border-0">
                        <Star className="w-3 h-3 mr-1" />Destaque
                      </Badge>
                    )}
                    <Badge variant="outline">{item.category}</Badge>
                    {item.status === 'draft' && (
                      <Badge variant="outline" className="border-orange-300 text-orange-700">Rascunho</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    Por {item.author_name} • {item.views_count || 0} visualizações
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={createPageUrl('NewsDetail') + `?id=${item.id}`} target="_blank">
                    <Button variant="outline" size="sm" className="rounded-lg">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteNewsMutation.mutate(item.id)}
                    className="rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {news.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma notícia cadastrada</p>
          </div>
        )}
      </div>
    </div>
  );
}