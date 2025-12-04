import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function ChatDireto() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [conversaId, setConversaId] = useState(null);
  const messagesEndRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const destinatarioEmail = urlParams.get('email');
  const destinatarioNome = decodeURIComponent(urlParams.get('nome') || 'Usuário');
  const destinatarioFoto = decodeURIComponent(urlParams.get('foto') || '');
  const convParam = urlParams.get('conv');

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const buscarOuCriarConversa = async () => {
      if (!user?.email || !destinatarioEmail) return;

      if (convParam) {
        setConversaId(convParam);
        return;
      }

      try {
        // Buscar conversa existente
        const c1 = await base44.entities.Conversa.filter({
          user1_email: user.email,
          user2_email: destinatarioEmail
        });
        if (c1?.length > 0) {
          setConversaId(c1[0].id);
          return;
        }

        const c2 = await base44.entities.Conversa.filter({
          user1_email: destinatarioEmail,
          user2_email: user.email
        });
        if (c2?.length > 0) {
          setConversaId(c2[0].id);
          return;
        }

        // Criar nova
        const nova = await base44.entities.Conversa.create({
          user1_email: user.email,
          user1_name: user.full_name || 'Usuário',
          user1_photo: user.profile_photo || '',
          user2_email: destinatarioEmail,
          user2_name: destinatarioNome,
          user2_photo: destinatarioFoto,
          ultima_msg: '',
          ultima_msg_data: new Date().toISOString()
        });
        setConversaId(nova.id);
      } catch (e) {
        console.error(e);
      }
    };
    buscarOuCriarConversa();
  }, [user, destinatarioEmail, convParam]);

  useEffect(() => {
    if (!conversaId) return;
    
    const carregar = async () => {
      const lista = await base44.entities.Mensagem.filter({ conversa_id: conversaId }, 'created_date');
      setMensagens(lista || []);
    };
    
    carregar();
    const interval = setInterval(carregar, 3000);
    return () => clearInterval(interval);
  }, [conversaId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviar = async () => {
    if (!novaMensagem.trim() || !conversaId) return;
    setEnviando(true);
    try {
      await base44.entities.Mensagem.create({
        conversa_id: conversaId,
        remetente_email: user.email,
        remetente_nome: user.full_name || 'Usuário',
        destinatario_email: destinatarioEmail,
        texto: novaMensagem.trim(),
        lida: false
      });

      await base44.entities.Conversa.update(conversaId, {
        ultima_msg: novaMensagem.trim().substring(0, 100),
        ultima_msg_data: new Date().toISOString()
      });

      setNovaMensagem('');
      
      const lista = await base44.entities.Mensagem.filter({ conversa_id: conversaId }, 'created_date');
      setMensagens(lista || []);
    } catch (e) {
      console.error(e);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Comunidade') + '?tab=mensagens'}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Avatar className="w-10 h-10">
              <AvatarImage src={destinatarioFoto} />
              <AvatarFallback className="bg-blue-600 text-white">{destinatarioNome?.[0]}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-slate-800">{destinatarioNome}</p>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-3">
          {mensagens.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Nenhuma mensagem ainda. Diga olá!</p>
            </div>
          ) : (
            mensagens.map((msg) => {
              const isMe = msg.remetente_email === user?.email;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    isMe ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white shadow rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.texto}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                      {moment(msg.created_date).format('HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && enviar()}
            className="flex-1 rounded-xl"
          />
          <Button onClick={enviar} disabled={!novaMensagem.trim() || enviando} className="bg-blue-600 rounded-xl">
            {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}