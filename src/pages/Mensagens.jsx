import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, ArrowLeft, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Mensagens() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversaAtiva, setConversaAtiva] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        
        // Verificar se veio com destinatário na URL
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
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const getConversaId = (email1, email2) => {
    return [email1, email2].sort().join('_');
  };

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
    refetchInterval: 5000
  });

  // Agrupar conversas
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
          data: msg.created_date
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
      conteudo: novaMensagem
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-green-600 to-green-700 pt-6 pb-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {conversaAtiva && (
            <Button variant="ghost" size="icon" onClick={() => setConversaAtiva(null)} className="text-white">
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
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {!conversaAtiva ? (
          // Lista de Conversas
          <div className="space-y-2">
            {conversas.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Nenhuma conversa ainda.</p>
                <p className="text-sm">Visite o perfil de alguém para iniciar!</p>
              </div>
            ) : (
              conversas.map((conv) => (
                <Card
                  key={conv.email}
                  className="rounded-xl cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setConversaAtiva(conv)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {conv.nome?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{conv.nome}</p>
                      <p className="text-sm text-slate-500 truncate">{conv.ultimaMensagem}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          // Conversa Ativa
          <Card className="rounded-xl h-[calc(100vh-220px)] flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {mensagensConversa.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.remetente_email === user.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        msg.remetente_email === user.email
                          ? 'bg-green-600 text-white rounded-br-md'
                          : 'bg-slate-100 text-slate-800 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm">{msg.conteudo}</p>
                      <p className={`text-xs mt-1 ${msg.remetente_email === user.email ? 'text-green-100' : 'text-slate-400'}`}>
                        {new Date(msg.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
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
                className="bg-green-600 hover:bg-green-700 rounded-full"
              >
                {enviarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}