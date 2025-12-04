import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function MensagensTab({ user }) {
  const [conversas, setConversas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const carregar = async () => {
      if (!user?.email) return;
      try {
        const c1 = await base44.entities.Conversa.filter({ user1_email: user.email });
        const c2 = await base44.entities.Conversa.filter({ user2_email: user.email });
        const todas = [...(c1 || []), ...(c2 || [])];
        todas.sort((a, b) => new Date(b.ultima_msg_data || b.created_date) - new Date(a.ultima_msg_data || a.created_date));
        setConversas(todas);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [user]);

  const abrirConversa = (c) => {
    const isUser1 = c.user1_email === user.email;
    const outroEmail = isUser1 ? c.user2_email : c.user1_email;
    const outroNome = isUser1 ? c.user2_name : c.user1_name;
    const outroFoto = isUser1 ? c.user2_photo : c.user1_photo;
    
    navigate(createPageUrl('ChatDireto') + `?conv=${c.id}&email=${encodeURIComponent(outroEmail)}&nome=${encodeURIComponent(outroNome || 'Usuário')}&foto=${encodeURIComponent(outroFoto || '')}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (conversas.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-8 text-center">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma conversa ainda.</p>
          <p className="text-sm text-slate-400">Vá até "Usuários" para iniciar uma conversa.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversas.map((c) => {
        const isUser1 = c.user1_email === user.email;
        const outroNome = isUser1 ? c.user2_name : c.user1_name;
        const outroFoto = isUser1 ? c.user2_photo : c.user1_photo;

        return (
          <Card 
            key={c.id} 
            className="rounded-xl cursor-pointer hover:shadow-md transition"
            onClick={() => abrirConversa(c)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={outroFoto} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {outroNome?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 truncate">{outroNome || 'Usuário'}</p>
                    {c.ultima_msg_data && (
                      <span className="text-xs text-slate-400">{moment(c.ultima_msg_data).fromNow()}</span>
                    )}
                  </div>
                  {c.ultima_msg && (
                    <p className="text-sm text-slate-500 truncate">{c.ultima_msg}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}