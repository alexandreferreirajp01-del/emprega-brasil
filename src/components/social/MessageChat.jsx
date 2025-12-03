import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function MessageChat({ user, chatWith, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [chatWith.email]);

  const loadMessages = async () => {
    try {
      const [sent, received] = await Promise.all([
        base44.entities.DirectMessage.filter({
          sender_email: user.email,
          receiver_email: chatWith.email
        }),
        base44.entities.DirectMessage.filter({
          sender_email: chatWith.email,
          receiver_email: user.email
        })
      ]);
      
      const allMessages = [...sent, ...received].sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      );
      setMessages(allMessages);
      
      // Mark received messages as read
      const unread = received.filter(m => !m.is_read);
      for (const msg of unread) {
        await base44.entities.DirectMessage.update(msg.id, { is_read: true });
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      await base44.entities.DirectMessage.create({
        sender_email: user.email,
        sender_name: user.full_name,
        sender_photo: user.profile_photo,
        receiver_email: chatWith.email,
        content: newMessage.trim()
      });
      setNewMessage('');
      loadMessages();
    } catch (e) {}
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={chatWith.profile_photo} />
          <AvatarFallback className="bg-[#0056ff] text-white">
            {chatWith.full_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-slate-800">{chatWith.full_name}</h3>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm">Inicie a conversa!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_email === user.email;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMine ? 'order-2' : 'order-1'}`}>
                  <div className={`rounded-2xl px-4 py-2 ${
                    isMine 
                      ? 'bg-[#0056ff] text-white rounded-br-sm' 
                      : 'bg-white text-slate-800 rounded-bl-sm shadow-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <p className={`text-xs text-slate-400 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                    {moment(msg.created_date).format('HH:mm')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-full bg-slate-100 border-0"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="rounded-full bg-[#0056ff] hover:bg-[#0044cc] h-10 w-10"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}