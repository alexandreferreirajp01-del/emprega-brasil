import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MessageCircle, Heart, Briefcase, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TrendingSection({ posts = [], jobs = [], news = [], likes = [], comments = [] }) {
  // Calcular posts em alta (mais curtidas + comentários)
  const trendingPosts = [...posts]
    .map(post => ({
      ...post,
      engagement: (likes.filter(l => l.post_id === post.id).length * 2) + 
                  (comments.filter(c => c.post_id === post.id).length)
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 3);

  // Jobs mais visualizados (baseado em is_featured primeiro, depois created_date)
  const hotJobs = [...jobs]
    .filter(j => !j.is_premium)
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    })
    .slice(0, 3);

  // Notícias em destaque
  const hotNews = [...news]
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (b.views_count || 0) - (a.views_count || 0);
    })
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Posts em Alta */}
      {trendingPosts.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              Em Alta na Comunidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trendingPosts.map((post, index) => (
              <div key={post.id} className="flex items-start gap-3">
                <span className="text-xl font-bold text-slate-200">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {likes.filter(l => l.post_id === post.id).length}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {comments.filter(c => c.post_id === post.id).length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Vagas em Destaque */}
      {hotJobs.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#0056ff]" />
              Vagas em Alta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hotJobs.map((job) => (
              <Link 
                key={job.id} 
                to={createPageUrl('JobDetail') + `?id=${job.id}`}
                className="block group"
              >
                <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                  <p className="font-medium text-sm text-slate-800 group-hover:text-[#0056ff] transition-colors line-clamp-1">
                    {job.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{job.company} • {job.city}</p>
                  {job.is_featured && (
                    <Badge className="mt-2 bg-yellow-100 text-yellow-700 text-xs">Destaque</Badge>
                  )}
                </div>
              </Link>
            ))}
            <Link to={createPageUrl('Jobs')} className="text-sm text-[#0056ff] hover:underline block text-center mt-2">
              Ver todas as vagas →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Notícias em Destaque */}
      {hotNews.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-purple-500" />
              Notícias Populares
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hotNews.map((item) => (
              <Link 
                key={item.id} 
                to={createPageUrl('NewsDetail') + `?id=${item.id}`}
                className="block group"
              >
                <div className="flex gap-3">
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt="" 
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 group-hover:text-[#0056ff] transition-colors line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{item.views_count || 0} visualizações</p>
                  </div>
                </div>
              </Link>
            ))}
            <Link to={createPageUrl('News')} className="text-sm text-[#0056ff] hover:underline block text-center mt-2">
              Ver todas as notícias →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}