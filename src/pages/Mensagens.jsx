import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Send, ArrowLeft, MessageCircle, Plus, Search, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TimeAgo from "@/components/common/TimeAgo";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import VisitorRedirect from "@/components/common/VisitorRedirect";

export default function Mensagens() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversaAtiva, setConversaAtiva] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [showNovaConversa, setShowNovaConversa] = useState(false);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        
        const params = new URLSearchParams(window.location.search);
        const destEmail = params.get('para');
        const destNome = params.get('nome');
        const destFoto = params.get('foto');
        
        if (destEmail) {
          setConversaAtiva({
            email: destEmail,
            nome: destNome || destEmail,
            foto: destFoto || ''
          });
        }
      } catch {
        // Erro ao carregar usuário
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const getConversaId = (email1, email2) => {
    return [email1, email2].sort().join('_');
  };

  // Buscar todos os usuários cadastrados
  const { data: usuarios = [], isLoading: loadingUsuarios } = useQuery({
    queryKey: ['todos-usuarios-mensagem'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list('full_name', 1000);
      return (allUsers || [])
        .filter(u => u.email && u.email !== user?.email)
        .map(u => ({
          id: u.id || u.email,
          email: u.email,
          full_name: u.full_name || u.email,
          profile_photo: u.profile_photo || ''
        }))
        .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    },
    enabled: showNovaConversa && !!user,
    staleTime: 60000
  });

  const { data: todasMensagens = [] } = useQuery({
    queryKey: ['mensagens-usuario', user?.email],
    queryFn: async () => {
      const enviadas = await base44.entities.MensagemDireta.filter({ remetente_email: user.email });
      const recebidas = await base44.entities.MensagemDireta.filter({ destinatario_email: user.email });
      return [...(enviadas || []), ...(recebidas || [])].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
    enabled: !!user?.email,
    refetchInterval: 3000
  });

  const conversas = React.useMemo(() => {
    if (!user || !todasMensagens.length) return [];
    
    const map = new Map();
    todasMensagens.forEach(msg => {
      const outroEmail = msg.remetente_email === user.email ? msg.destinatario_email : msg.remetente_email;
      const outroNome = msg.remetente_email === user.email ? (msg.destinatario_nome || outroEmail) : (msg.remetente_nome || outroEmail);
      
      if (!map.has(outroEmail)) {
        map.set(outroEmail, {
          email: outroEmail,
          nome: outroNome,
          ultimaMensagem: msg.conteudo,
          data: msg.created_date,
          naoLida: msg.destinatario_email === user.email && !msg.lida
        });
      }
    });
    
    return Array.from(map.values());
  }, [todasMensagens, user]);

  const mensagensConversa = React.useMemo(() => {
    if (!conversaAtiva || !user) return [];
    const conversaId = getConversaId(user.email, conversaAtiva.email);
    return todasMensagens
      .filter(m => m.conversa_id === conversaId)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [todasMensagens, conversaAtiva, user]);

  const enviarMutation = useMutation({
    mutationFn: (data) => base44.entities.MensagemDireta.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens-usuario'] });
      setNovaMensagem('');
    }
  });

  const handleEnviar = () => {
    if (!novaMensagem.trim() || !conversaAtiva) return;
    enviarMutation.mutate({
      conversa_id: getConversaId(user.email, conversaAtiva.email),
      remetente_email: user.email,
      remetente_nome: user.full_name || 'Usuário',
      destinatario_email: conversaAtiva.email,
      destinatario_nome: conversaAtiva.nome,
      conteudo: novaMensagem
    });
  };

  const iniciarConversa = (usuario) => {
    setConversaAtiva({
      email: usuario.email,
      nome: usuario.full_name || usuario.email,
      foto: usuario.profile_photo || ''
    });
    setShowNovaConversa(false);
    setBuscaUsuario('');
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.email !== user?.email && 
    (u.full_name?.toLowerCase().includes(buscaUsuario.toLowerCase()) ||
     u.email?.toLowerCase().includes(buscaUsuario.toLowerCase()))
  );



  return (
    <VisitorRedirect>
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {conversaAtiva && (
              <Button variant="ghost" size="icon" onClick={() => setConversaAtiva(null)} className="text-white hover:bg-white/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">
                {conversaAtiva ? conversaAtiva.nome : 'Mensagens'}
              </h1>
              <p className="text-white/70 text-sm">
                {conversaAtiva ? 'Conversa' : 'Suas conversas'}
              </p>
            </div>
          </div>
          {!conversaAtiva && (
            <Dialog open={showNovaConversa} onOpenChange={setShowNovaConversa}>
              <DialogTrigger asChild>
                <Button className="bg-white/20 hover:bg-white/30 text-white rounded-full" size="icon">
                  <Plus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Nova Mensagem
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={buscaUsuario}
                      onChange={(e) => setBuscaUsuario(e.target.value)}
                      placeholder="Buscar usuário..."
                      className="pl-10 rounded-xl"
                    />
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {loadingUsuarios ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-[#0056ff]" />
                        </div>
                      ) : usuariosFiltrados.length > 0 ? (
                        usuariosFiltrados.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => iniciarConversa(u)}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={u.profile_photo} />
                              <AvatarFallback className="bg-blue-100 text-blue-700">
                                {u.full_name?.[0] || u.email?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 truncate">{u.full_name || 'Usuário'}</p>
                              <p className="text-sm text-slate-500 truncate">{u.email}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-slate-500 py-4">Nenhum usuário encontrado</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {!conversaAtiva ? (
          <div className="space-y-2">
            {conversas.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">Nenhuma conversa ainda</p>
                <p className="text-sm mb-4">Clique no + para iniciar uma nova conversa</p>
                <Button onClick={() => setShowNovaConversa(true)} className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Mensagem
                </Button>
              </div>
            ) : (
              conversas.map((conv) => (
                <Card
                  key={conv.email}
                  className={`rounded-xl cursor-pointer hover:shadow-md transition-shadow ${conv.naoLida ? 'border-blue-300 bg-blue-50' : ''}`}
                  onClick={() => setConversaAtiva(conv)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {conv.nome?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold truncate ${conv.naoLida ? 'text-blue-700' : 'text-slate-800'}`}>{conv.nome}</p>
                        <TimeAgo date={conv.data} className="text-xs text-slate-400" />
                      </div>
                      <p className={`text-sm truncate ${conv.naoLida ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>{conv.ultimaMensagem}</p>
                    </div>
                    {conv.naoLida && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Card className="rounded-xl h-[calc(100vh-220px)] flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {mensagensConversa.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Nenhuma mensagem ainda. Envie a primeira!</p>
                ) : (
                  mensagensConversa.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.remetente_email === user.email ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.remetente_email === user.email
                            ? 'bg-[#0056ff] text-white rounded-br-md'
                            : 'bg-slate-100 text-slate-800 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                        <p className={`text-xs mt-1 ${msg.remetente_email === user.email ? 'text-blue-100' : 'text-slate-400'}`}>
                          {new Date(msg.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t flex gap-2">
              <Input
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="rounded-full"
                onKeyPress={(e) => e.key === 'Enter' && handleEnviar()}
              />
              <Button
                onClick={handleEnviar}
                disabled={!novaMensagem.trim() || enviarMutation.isPending}
                className="bg-[#0056ff] hover:bg-[#0044cc] rounded-full"
              >
                {enviarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
    </VisitorRedirect>
  );
}