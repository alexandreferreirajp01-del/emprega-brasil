import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Loader2, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

// Função para gerar ID de conversa consistente
function getConversationId(email1, email2) {
  return [email1, email2].sort().join('_');
}

export default function SocialChat() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const targetEmail = urlParams.get('email');

  // Autenticação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Buscar usuário de destino
  useEffect(() => {
    const fetchTargetUser = async () => {
      if (!targetEmail) return;
      try {
        const users = await base44.entities.User.filter({ email: targetEmail });
        if (users && users.length > 0) {
          setTargetUser(users[0]);
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
      }
    };
    fetchTargetUser();
  }, [targetEmail]);

  // Buscar mensagens
  const fetchMessages = async () => {
    if (!user || !targetEmail) return;
    
    try {
      const allMessages = await base44.entities.DirectMessage.list('-created_date', 1000);
      
      // Filtrar mensagens desta conversa
      const conversationMessages = allMessages
        .filter(m => 
          (m.sender_email === user.email && m.receiver_email === targetEmail) ||
          (m.sender_email === targetEmail && m.receiver_email === user.email)
        )
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      
      setMessages(conversationMessages);
      setLoadingMessages(false);

      // Marcar como lidas
      conversationMessages.forEach(async (msg) => {
        if (msg.receiver_email === user.email && !msg.is_read) {
          try {
            await base44.entities.DirectMessage.update(msg.id, { is_read: true });
          } catch (e) {
            // Ignorar erros de atualização
          }
        }
      });
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (user && targetEmail) {
      fetchMessages();
      // Atualizar a cada 3 segundos
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [user, targetEmail]);

  // Scroll para o final
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Enviar mensagem
  const handleSend = async () => {
    if (!newMessage.trim() || sending || !user || !targetEmail) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const conversationId = getConversationId(user.email, targetEmail);
      
      await base44.entities.DirectMessage.create({
        sender_email: user.email,
        sender_name: user.full_name || 'Usuário',
        sender_photo: user.profile_photo || '',
        receiver_email: targetEmail,
        receiver_name: targetUser?.full_name || 'Usuário',
        content: messageContent,
        is_read: false,
        conversation_id: conversationId
      });

      // Recarregar mensagens imediatamente
      await fetchMessages();
      
      // Focar no input novamente
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Restaurar mensagem em caso de erro
      setNewMessage(messageContent);
    } finally {
      setSending(false);
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Fixo */}
      <header className="bg-white border-b shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3 p-4 max-w-2xl mx-auto">
          <Link to={createPageUrl('Social')}>
            <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Link 
            to={`${createPageUrl('SocialProfile')}?email=${targetEmail}`} 
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-slate-100">
              <AvatarImage src={targetUser?.profile_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white font-semibold">
                {targetUser?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 truncate">
                {targetUser?.full_name || 'Carregando...'}
              </p>
              <p className="text-xs text-slate-500">Toque para ver perfil</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 pt-24 pb-24">
        <div className="max-w-2xl mx-auto space-y-3">
          {loadingMessages ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">Nenhuma mensagem ainda</p>
              <p className="text-sm text-slate-400 mt-1">Envie a primeira mensagem!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_email === user?.email;
              const showDate = index === 0 || 
                moment(msg.created_date).format('YYYY-MM-DD') !== 
                moment(messages[index - 1].created_date).format('YYYY-MM-DD');
              
              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="text-center py-2">
                      <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        {moment(msg.created_date).format('DD [de] MMMM')}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${isMe ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        isMe 
                          ? 'bg-[#0056ff] text-white rounded-br-sm' 
                          : 'bg-white shadow-sm border rounded-bl-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      <p className={`text-[10px] text-slate-400 mt-1 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {moment(msg.created_date).format('HH:mm')}
                        {isMe && msg.is_read && ' • Lida'}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-2xl mx-auto p-3 pb-safe">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 rounded-full bg-slate-100 border-0 h-11 px-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={sending}
            />
            <Button 
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="rounded-full bg-[#0056ff] hover:bg-[#0044cc] w-11 h-11 p-0 flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}