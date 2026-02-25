import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Plus, Edit, Trash2, Eye, Loader2, Search,
  Star, Clock, Image as ImageIcon, Send, Save, X, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import BlogEditor from "@/components/blog/BlogEditor";

const CATEGORIES = ["Geral","Dicas","Mercado de Trabalho","Tecnologia","Carreira","Educação","Empreendedorismo","Lifestyle"];

const emptyForm = {
  title: '', subtitle: '', content: '', cover_image: '', category: 'Geral',
  tags: '', author_name: 'Vagas Abertas PB', is_featured: false, status: 'draft', reading_time: 5,
};

export default function GerenciarBlog() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      const ok = u?.role === 'admin' || u?.subscription_type === 'admin' || u?.email === 'alexandreferreirajp01@gmail.com';
      if (!ok) { window.location.href = createPageUrl('Home'); return; }
      setUser(u);
      setFormData(f => ({ ...f, author_name: u.custom_full_name || u.full_name || 'Vagas Abertas PB' }));
    }).catch(() => window.location.href = createPageUrl('Splash'))
      .finally(() => setAuthLoading(false));
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts-admin'],
    queryFn: () => base44.entities.BlogPost.list('-created_date', 200),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] }); toast.success('Post excluído!'); },
  });

  const set = (field, val) => setFormData(p => ({ ...p, [field]: val }));

  const handleNew = () => {
    setEditingPost(null);
    setFormData({ ...emptyForm, author_name: user?.custom_full_name || user?.full_name || 'Vagas Abertas PB' });
    setView('form');
    window.scrollTo(0, 0);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '', subtitle: post.subtitle || '',
      content: post.content || '', cover_image: post.cover_image || '',
      category: post.category || 'Geral', tags: (post.tags || []).join(', '),
      author_name: post.author_name || '', is_featured: post.is_featured || false,
      status: post.status || 'draft', reading_time: post.reading_time || 5,
    });
    setView('form');
    window.scrollTo(0, 0);
  };

  const handleSave = async (targetStatus) => {
    if (!formData.title.trim()) { toast.error('Título é obrigatório'); return; }
    if (!formData.content || formData.content === '<p></p>' || formData.content.trim() === '') {
      toast.error('Conteúdo é obrigatório'); return;
    }
    setSaving(true);
    const data = {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      content: formData.content,
      cover_image: formData.cover_image.trim(),
      category: formData.category,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      author_name: formData.author_name.trim(),
      is_featured: formData.is_featured,
      status: targetStatus,
      reading_time: Number(formData.reading_time) || 5,
      published_at: targetStatus === 'published' ? new Date().toISOString() : null,
      slug: formData.title.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
    };
    try {
      if (editingPost) {
        await base44.entities.BlogPost.update(editingPost.id, data);
      } else {
        await base44.entities.BlogPost.create(data);
      }
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
      toast.success(targetStatus === 'published' ? 'Post publicado!' : 'Rascunho salvo!');
      setView('list');
      setEditingPost(null);
      setFormData(emptyForm);
    } finally {
      setSaving(false);
    }
  };

  const uploadCover = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setUploadingCover(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: base64 });
      set('cover_image', file_url);
      toast.success('Capa carregada!');
    } catch { toast.error('Erro ao fazer upload'); }
    finally { setUploadingCover(false); }
  };

  const filteredPosts = posts.filter(p => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || p.title?.toLowerCase().includes(s);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
    </div>
  );

  // ─── LISTA ─────────────────────────────────────────────────────────────
  if (view === 'list') return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-4 pb-6 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <button className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3">
              <ArrowLeft className="w-4 h-4" /> Configurações
            </button>
          </Link>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5" />Gerenciar Blog</h1>
              <p className="text-white/60 text-xs mt-0.5">{posts.filter(p => p.status === 'published').length} publicados · {posts.filter(p => p.status === 'draft').length} rascunhos</p>
            </div>
            <Button onClick={handleNew} size="sm" className="bg-white text-[#1D2226] hover:bg-white/90 font-semibold gap-1">
              <Plus className="w-4 h-4" /> Novo Post
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar posts..." className="pl-9 h-10 rounded-xl" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-10 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-slate-400" /></div>
        ) : filteredPosts.length === 0 ? (
          <Card><CardContent className="py-10 text-center">
            <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Nenhum post ainda</p>
            <Button onClick={handleNew} size="sm" className="mt-3 bg-[#0A66C2]"><Plus className="w-4 h-4 mr-1" />Criar post</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredPosts.map(post => (
              <Card key={post.id} className="hover:shadow-md transition-shadow overflow-hidden">
                {post.cover_image && (
                  <div className="h-36 overflow-hidden">
                    <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2">{post.title}</p>
                      {post.subtitle && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{post.subtitle}</p>}
                    </div>
                    <div className="flex gap-1 items-center flex-shrink-0">
                      {post.is_featured && <Star className="w-3.5 h-3.5 text-amber-500" />}
                      <Badge className={`text-xs px-1.5 ${post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                        {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 flex-wrap">
                    <span>{post.category}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{post.reading_time || 5}min</span>
                    <span>·</span>
                    <span>{format(new Date(post.created_date), 'dd/MM/yy')}</span>
                    <span>·</span>
                    <span><Eye className="w-3 h-3 inline" /> {post.views_count || 0}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link to={createPageUrl('BlogDetail') + `?id=${post.id}`} target="_blank" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1"><Eye className="w-3.5 h-3.5" />Ver</Button>
                    </Link>
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleEdit(post)}><Edit className="w-3.5 h-3.5" />Editar</Button>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => { if (confirm('Excluir?')) deleteMutation.mutate(post.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─── FORMULÁRIO ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-4 pb-6 px-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setView('list')} className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3">
            <ArrowLeft className="w-4 h-4" /> Posts
          </button>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-lg font-bold text-white">{editingPost ? 'Editar Post' : 'Novo Post'}</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1" disabled={saving} onClick={() => handleSave('draft')}>
                <Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Rascunho'}
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1" disabled={saving} onClick={() => handleSave('published')}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publicar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4 pb-12">
        {/* Capa */}
        <Card><CardContent className="p-4">
          <Label className="text-sm font-semibold mb-3 block">Imagem de Capa</Label>
          {formData.cover_image ? (
            <div className="relative rounded-xl overflow-hidden h-48">
              <img src={formData.cover_image} alt="capa" className="w-full h-full object-cover" />
              <button onClick={() => set('cover_image', '')} className="absolute top-2 right-2 bg-white/80 rounded-full p-1 hover:bg-white">
                <X className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <Label className="flex-1 cursor-pointer">
                <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                  {uploadingCover ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ImageIcon className="w-6 h-6 mb-1" /><span className="text-xs">Upload de imagem</span></>}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={uploadCover} />
              </Label>
              <div className="text-slate-400 text-sm">ou</div>
              <div className="flex-1">
                <Input value={formData.cover_image} onChange={e => set('cover_image', e.target.value)} placeholder="URL da imagem..." className="text-sm" />
              </div>
            </div>
          )}
        </CardContent></Card>

        {/* Metadados */}
        <Card><CardContent className="p-4 space-y-3">
          <div>
            <Label className="text-sm">Título *</Label>
            <Input value={formData.title} onChange={e => set('title', e.target.value)} placeholder="Digite o título do post..." className="mt-1 text-lg font-semibold" />
          </div>
          <div>
            <Label className="text-sm">Subtítulo</Label>
            <Input value={formData.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Subtítulo ou resumo..." className="mt-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-sm">Categoria</Label>
              <Select value={formData.category} onValueChange={v => set('category', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Autor</Label>
              <Input value={formData.author_name} onChange={e => set('author_name', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Tempo de leitura (min)</Label>
              <Input type="number" value={formData.reading_time} onChange={e => set('reading_time', e.target.value)} min={1} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Tags (separadas por vírgula)</Label>
            <Input value={formData.tags} onChange={e => set('tags', e.target.value)} placeholder="emprego, carreira, dicas..." className="mt-1" />
          </div>
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <div>
                <p className="font-medium text-sm">Post em Destaque</p>
                <p className="text-xs text-slate-500">Aparece em evidência no Blog</p>
              </div>
            </div>
            <Switch checked={formData.is_featured} onCheckedChange={v => set('is_featured', v)} />
          </div>
        </CardContent></Card>

        {/* Editor de Conteúdo */}
        <Card><CardContent className="p-4">
          <Label className="text-sm font-semibold mb-3 block">Conteúdo *</Label>
          <BlogEditor value={formData.content} onChange={v => set('content', v)} />
        </CardContent></Card>

        {/* Botões finais */}
        <div className="flex gap-3 pb-4">
          <Button variant="outline" className="flex-1 gap-1" onClick={() => setView('list')}><X className="w-4 h-4" />Cancelar</Button>
          <Button variant="outline" className="flex-1 gap-1" disabled={saving} onClick={() => handleSave('draft')}><Save className="w-4 h-4" />Salvar Rascunho</Button>
          <Button className="flex-1 gap-1 bg-green-600 hover:bg-green-700" disabled={saving} onClick={() => handleSave('published')}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publicar
          </Button>
        </div>
      </div>
    </div>
  );
}