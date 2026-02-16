import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Search, Users, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MensagensPage() {
  const [user, setUser] = useState(null);
  const [selectedConversa, setSelectedConversa] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = '/';
      }
    };
    checkAuth();
  }, []);

  // Buscar todas as mensagens do usuário
  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.MensagemDireta.list('-created_date', 500);
    },
    enabled: !!user,
    refetchInterval: 5000
  });

  // Agrupar mensagens por conversa
  const conversas = React.useMemo(() => {
    const conversasMap = new Map();

    mensagens.forEach(msg => {
      const conversaId = msg.conversa_id;
      
      if (!conversasMap.has(conversaId)) {
        // Determinar o outro participante
        const isRemetente = msg.remetente_email === user?.email;
        const outroParticipante = {
          email: isRemetente ? msg.destinatario_email : msg.remetente_email,
          nome: isRemetente ? msg.destinatario_nome : msg.remetente_nome,
          foto: isRemetente ? msg.destinatario_foto : msg.remetente_foto
        };

        conversasMap.set(conversaId, {
          conversa_id: conversaId,
          outroParticipante,
          mensagens: [],
          ultimaMensagem: msg,
          naoLidas: 0
        });
      }

      const conversa = conversasMap.get(conversaId);
      conversa.mensagens.push(msg);
      
      // Contar não lidas (apenas mensagens recebidas)
      if (msg.destinatario_email === user?.email && !msg.lida) {
        conversa.naoLidas++;
      }
    });

    return Array.from(conversasMap.values())
      .sort((a, b) => new Date(b.ultimaMensagem.created_date) - new Date(a.ultimaMensagem.created_date));
  }, [mensagens, user]);

  // Filtrar conversas por busca
  const conversasFiltradas = conversas.filter(c => 
    c.outroParticipante.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.outroParticipante.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return await base44.functions.invoke('sendMessage', messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensagens']);
      setMessageText('');
    }
  });

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (mensagemId) => {
      await base44.entities.MensagemDireta.update(mensagemId, { lida: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensagens']);
    }
  });

  // Marcar mensagens como lidas ao selecionar conversa
  useEffect(() => {
    if (selectedConversa && user) {
      const conversaData = conversas.find(c => c.conversa_id === selectedConversa);
      if (conversaData) {
        conversaData.mensagens
          .filter(msg => msg.destinatario_email === user.email && !msg.lida)
          .forEach(msg => markAsReadMutation.mutate(msg.id));
      }
    }
  }, [selectedConversa, user]);

  // Auto scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedConversa, mensagens]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversa) return;

    const conversa = conversas.find(c => c.conversa_id === selectedConversa);
    if (!conversa) return;

    sendMessageMutation.mutate({
      destinatario_email: conversa.outroParticipante.email,
      conteudo: messageText,
      message_type: 'user_to_admin'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';
  const conversaSelecionada = conversas.find(c => c.conversa_id === selectedConversa);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Mensagens {isAdmin && '(Suporte)'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {isAdmin ? 'Central de atendimento e suporte' : 'Fale com os administradores'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          {/* Lista de Conversas */}
          <Card className="lg:col-span-1 flex flex-col dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar conversas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 dark:bg-slate-700 dark:border-slate-600"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {conversasFiltradas.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nenhuma conversa</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversasFiltradas.map((conversa) => (
                      <button
                        key={conversa.conversa_id}
                        onClick={() => setSelectedConversa(conversa.conversa_id)}
                        className={`w-full p-3 rounded-xl text-left transition-all ${
                          selectedConversa === conversa.conversa_id
                            ? 'bg-blue-50 dark:bg-slate-700 border-2 border-blue-500'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-12 h-12 bg-slate-200 dark:bg-slate-600">
                              {conversa.outroParticipante.foto ? (
                                <img src={conversa.outroParticipante.foto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold">
                                  {conversa.outroParticipante.nome?.[0]?.toUpperCase()}
                                </div>
                              )}
                            </Avatar>
                            {conversa.naoLidas > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {conversa.naoLidas}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {conversa.outroParticipante.nome}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                              {conversa.ultimaMensagem.conteudo}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              {formatTime(conversa.ultimaMensagem.created_date)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Área de Chat */}
          <Card className="lg:col-span-2 flex flex-col dark:bg-slate-800 dark:border-slate-700">
            {selectedConversa && conversaSelecionada ? (
              <>
                {/* Header da Conversa */}
                <div className="p-4 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 bg-slate-200 dark:bg-slate-600">
                      {conversaSelecionada.outroParticipante.foto ? (
                        <img src={conversaSelecionada.outroParticipante.foto} alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold">
                          {conversaSelecionada.outroParticipante.nome?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {conversaSelecionada.outroParticipante.nome}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {conversaSelecionada.outroParticipante.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mensagens */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {conversaSelecionada.mensagens
                      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                      .map((msg) => {
                        const isMe = msg.remetente_email === user.email;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isMe 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
                            }`}>
                              <p className="text-sm">{msg.conteudo}</p>
                              <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                {formatTime(msg.created_date)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>

                {/* Input de Mensagem */}
                <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma conversa para começar</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}