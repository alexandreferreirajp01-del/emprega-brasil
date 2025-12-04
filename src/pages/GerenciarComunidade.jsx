import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MessageSquare, Trash2, Loader2, CheckCircle, Clock, Check, XCircle, Newspaper } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import ChatManager from "@/components/admin/ChatManager";

export default function GerenciarComunidade() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                        currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  const { data: posts = [] } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => base44.entities.FeedPost.list('-created_date', 200),
    staleTime: 60000,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['admin-comments'],
    queryFn: () => base44.entities.FeedComentario.list('-created_date', 200),
    staleTime: 60000,
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.FeedPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      showToast('Post excluído!');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.FeedComentario.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      showToast('Comentário excluído!');
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-600 to-purple-700 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Gerenciar Comunidade
          </h1>
          <p className="text-white/70 text-sm">{posts.length} posts • {comments.length} comentários</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="posts" className="space-y-4">
          <TabsList className="bg-white rounded-xl p-1 grid grid-cols-3 w-full">
            <TabsTrigger value="posts" className="rounded-lg text-xs">Posts</TabsTrigger>
            <TabsTrigger value="comments" className="rounded-lg text-xs">Comentários</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg text-xs">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-3">
                {posts.map((post) => (
                  <Card key={post.id} className="rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={post.autor_foto} />
                          <AvatarFallback className="bg-purple-100 text-purple-700">{post.autor_nome?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{post.autor_nome}</p>
                          <p className="text-slate-600 text-sm line-clamp-2">{post.conteudo}</p>
                          <div className="flex gap-2 mt-2 text-xs text-slate-500">
                            <span>❤️ {post.total_curtidas || 0}</span>
                            <span>💬 {post.total_comentarios || 0}</span>
                            <span>👁️ {post.views || 0}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deletePostMutation.mutate(post.id)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-white rounded-xl border flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.autor_foto} />
                      <AvatarFallback className="bg-slate-100 text-xs">{comment.autor_nome?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-xs">{comment.autor_nome}</p>
                      <p className="text-slate-600 text-sm">{comment.conteudo}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteCommentMutation.mutate(comment.id)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chat">
            <ChatManager showToast={showToast} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}