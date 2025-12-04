import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Newspaper, Trash2, Loader2, CheckCircle, Plus, X, Upload, Save, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import NotificationSender from "@/components/admin/NotificationSender";

export default function GerenciarNoticias() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [lastCreatedNews, setLastCreatedNews] = useState(null);
  const [form, setForm] = useState({
    title: '', subtitle: '', content: '', image_url: '', video_url: '', category: 'Geral', author_name: '', is_featured: false
  });
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

  const { data: newsList = [] } = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => base44.entities.News.list('-created_date', 100),
    staleTime: 60000,
  });

  const createNewsMutation = useMutation({
    mutationFn: (data) => base44.entities.News.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      setLastCreatedNews({ id: created?.id, title: form.title });
      setForm({ title: '', subtitle: '', content: '', image_url: '', video_url: '', category: 'Geral', author_name: '', is_featured: false });
      setShowForm(false);
      setShowNotification(true);
      showToast('Notícia publicada!');
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: (id) => base44.entities.News.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      showToast('Notícia excluída!');
    },
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result?.file_url) {
        setForm(prev => ({ ...prev, image_url: result.file_url }));
        showToast('Imagem carregada!');
      }
    } catch {
      showToast('Erro ao carregar', 'error');
    } finally {
      setUploading(false);
    }
  };

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

      <div className="bg-gradient-to-r from-red-600 to-red-700 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6" />
            Gerenciar Notícias
          </h1>
          <p className="text-white/70 text-sm">{newsList.length} notícias publicadas</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700 rounded-xl">
            <Plus className="w-5 h-5 mr-2" />Nova Notícia
          </Button>
        ) : (
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nova Notícia</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); createNewsMutation.mutate(form); }} className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mercado de Trabalho">Mercado de Trabalho</SelectItem>
                        <SelectItem value="Dicas de Emprego">Dicas de Emprego</SelectItem>
                        <SelectItem value="Economia">Economia</SelectItem>
                        <SelectItem value="Cursos">Cursos</SelectItem>
                        <SelectItem value="Geral">Geral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Autor</Label>
                    <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="rounded-lg" />
                  </div>
                </div>
                <div>
                  <Label>Imagem</Label>
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                      <div className="h-10 px-4 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 hover:bg-slate-50">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span className="text-sm">Upload</span>
                      </div>
                    </label>
                    <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Ou cole URL" className="flex-1 rounded-lg" />
                  </div>
                </div>
                <div>
                  <Label>Conteúdo</Label>
                  <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="rounded-lg min-h-[150px]" />
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm">Destaque</span>
                  </div>
                  <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                </div>
                <Button type="submit" disabled={createNewsMutation.isPending || !form.title} className="w-full bg-red-600 hover:bg-red-700 rounded-xl">
                  {createNewsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Publicar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {showNotification && lastCreatedNews && (
          <NotificationSender showToast={showToast} news={lastCreatedNews} notificationType="news" onClose={() => setShowNotification(false)} />
        )}

        <ScrollArea className="h-[calc(100vh-350px)]">
          <div className="space-y-3">
            {newsList.map((item) => (
              <Card key={item.id} className="rounded-xl">
                <CardContent className="p-4 flex items-start gap-3">
                  {item.image_url && <img src={item.image_url} alt="" className="w-16 h-12 object-cover rounded-lg" />}
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1">{item.title}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      {item.is_featured && <Badge className="bg-red-100 text-red-700 text-xs">Destaque</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteNewsMutation.mutate(item.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}