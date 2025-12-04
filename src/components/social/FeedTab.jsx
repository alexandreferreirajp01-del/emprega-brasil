import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Send, Loader2, X, Heart, MessageCircle, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function FeedTab({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoPost, setNovoPost] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [uploading, setUploading] = useState(false);

  const carregarPosts = async () => {
    try {
      const lista = await base44.entities.Publicacao.list('-created_date', 50);
      setPosts(lista || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPosts();
    const interval = setInterval(carregarPosts, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImagemUrl(file_url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const publicar = async () => {
    if (!novoPost.trim() && !imagemUrl) return;
    setEnviando(true);
    try {
      await base44.entities.Publicacao.create({
        autor_email: user.email,
        autor_nome: user.full_name || 'Usuário',
        autor_foto: user.profile_photo || '',
        conteudo: novoPost.trim(),
        imagem_url: imagemUrl,
        curtidas: 0,
        comentarios: 0
      });
      setNovoPost('');
      setImagemUrl('');
      carregarPosts();
    } catch (e) {
      console.error(e);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Criar Post */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.profile_photo} />
              <AvatarFallback className="bg-blue-600 text-white">
                {user?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="O que você está pensando?"
                value={novoPost}
                onChange={(e) => setNovoPost(e.target.value)}
                className="min-h-[80px] rounded-xl resize-none"
              />
              
              {imagemUrl && (
                <div className="relative">
                  <img src={imagemUrl} alt="" className="w-full max-h-48 object-cover rounded-xl" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={() => setImagemUrl('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  <Button variant="outline" size="sm" className="rounded-lg" asChild>
                    <span>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4 mr-2" />}
                      {uploading ? 'Enviando...' : 'Foto'}
                    </span>
                  </Button>
                </label>
                
                <Button
                  onClick={publicar}
                  disabled={(!novoPost.trim() && !imagemUrl) || enviando}
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  {enviando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Posts */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500">Nenhuma publicação ainda. Seja o primeiro!</p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} user={user} onRefresh={carregarPosts} />
        ))
      )}
    </div>
  );
}

function PostCard({ post, user, onRefresh }) {
  const [curtidas, setCurtidas] = useState([]);
  const [curtiu, setCurtiu] = useState(false);
  const [showComentarios, setShowComentarios] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  useEffect(() => {
    const carregarCurtidas = async () => {
      const lista = await base44.entities.Curtida.filter({ publicacao_id: post.id });
      setCurtidas(lista || []);
      setCurtiu((lista || []).some(c => c.user_email === user?.email));
    };
    carregarCurtidas();
  }, [post.id, user]);

  const toggleCurtir = async () => {
    if (curtiu) {
      const minhaCurtida = curtidas.find(c => c.user_email === user.email);
      if (minhaCurtida) {
        await base44.entities.Curtida.delete(minhaCurtida.id);
        setCurtidas(curtidas.filter(c => c.id !== minhaCurtida.id));
        setCurtiu(false);
      }
    } else {
      const nova = await base44.entities.Curtida.create({
        publicacao_id: post.id,
        user_email: user.email
      });
      setCurtidas([...curtidas, nova]);
      setCurtiu(true);
    }
  };

  const carregarComentarios = async () => {
    const lista = await base44.entities.Comentario.filter({ publicacao_id: post.id }, 'created_date');
    setComentarios(lista || []);
  };

  const abrirComentarios = () => {
    setShowComentarios(!showComentarios);
    if (!showComentarios) carregarComentarios();
  };

  const enviarComentario = async () => {
    if (!novoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      await base44.entities.Comentario.create({
        publicacao_id: post.id,
        autor_email: user.email,
        autor_nome: user.full_name || 'Usuário',
        autor_foto: user.profile_photo || '',
        texto: novoComentario.trim()
      });
      setNovoComentario('');
      carregarComentarios();
    } catch (e) {
      console.error(e);
    } finally {
      setEnviandoComentario(false);
    }
  };

  const excluirPost = async () => {
    await base44.entities.Publicacao.delete(post.id);
    onRefresh();
  };

  const podeExcluir = user?.email === post.autor_email || user?.role === 'admin' || user?.subscription_type === 'admin';

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.autor_foto} />
              <AvatarFallback className="bg-blue-600 text-white">{post.autor_nome?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-800">{post.autor_nome}</p>
              <p className="text-xs text-slate-500">{moment(post.created_date).fromNow()}</p>
            </div>
          </div>
          {podeExcluir && (
            <Button variant="ghost" size="icon" onClick={excluirPost} className="text-red-500">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {post.conteudo && <p className="text-slate-700 mb-3 whitespace-pre-wrap">{post.conteudo}</p>}
        {post.imagem_url && <img src={post.imagem_url} alt="" className="w-full rounded-xl mb-3 max-h-96 object-cover" />}

        <div className="flex items-center gap-4 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={toggleCurtir} className={`rounded-lg ${curtiu ? 'text-red-500' : 'text-slate-600'}`}>
            <Heart className={`w-5 h-5 mr-1 ${curtiu ? 'fill-current' : ''}`} />
            {curtidas.length}
          </Button>
          <Button variant="ghost" size="sm" onClick={abrirComentarios} className="rounded-lg text-slate-600">
            <MessageCircle className="w-5 h-5 mr-1" />
            {comentarios.length}
          </Button>
        </div>

        {showComentarios && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Escreva um comentário..."
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                className="rounded-xl"
                onKeyPress={(e) => e.key === 'Enter' && enviarComentario()}
              />
              <Button size="icon" onClick={enviarComentario} disabled={!novoComentario.trim() || enviandoComentario} className="bg-blue-600 rounded-xl">
                {enviandoComentario ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            
            {comentarios.map((c) => (
              <div key={c.id} className="flex gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={c.autor_foto} />
                  <AvatarFallback className="bg-slate-200 text-sm">{c.autor_nome?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-slate-100 rounded-xl p-3">
                  <p className="font-medium text-sm">{c.autor_nome}</p>
                  <p className="text-sm text-slate-700">{c.texto}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}