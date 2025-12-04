import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, Loader2, Crown, Shield, Briefcase, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UsuariosTab({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();

  const carregarUsuarios = async () => {
    setLoading(true);
    setErro(null);
    try {
      const lista = await base44.entities.User.list('-created_date', 300);
      setUsuarios(lista || []);
    } catch (e) {
      console.error('Erro:', e);
      setErro('Falha ao carregar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter(u => 
    u.email !== user?.email &&
    (u.full_name?.toLowerCase().includes(busca.toLowerCase()) ||
     u.email?.toLowerCase().includes(busca.toLowerCase()))
  );

  const abrirChat = (u) => {
    navigate(createPageUrl('ChatDireto') + `?email=${encodeURIComponent(u.email)}&nome=${encodeURIComponent(u.full_name || 'Usuário')}&foto=${encodeURIComponent(u.profile_photo || '')}`);
  };

  const getBadge = (u) => {
    if (u.role === 'admin' || u.subscription_type === 'admin') {
      return <Badge className="bg-purple-100 text-purple-700 text-xs"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
    }
    if (u.subscription_type === 'recruiter') {
      return <Badge className="bg-blue-100 text-blue-700 text-xs"><Briefcase className="w-3 h-3 mr-1" />Recrutador</Badge>;
    }
    if (u.subscription_type === 'premium') {
      return <Badge className="bg-green-100 text-green-700 text-xs"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (erro) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-8 text-center">
          <p className="text-red-500 mb-4">{erro}</p>
          <Button onClick={carregarUsuarios} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Buscar usuários..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {usuariosFiltrados.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500">
              {busca ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {usuariosFiltrados.map((u) => (
            <Card key={u.id} className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={u.profile_photo} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {u.full_name?.[0] || u.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-800">{u.full_name || 'Usuário'}</p>
                      {getBadge(u)}
                    </div>
                  </div>
                  <Button
                    onClick={() => abrirChat(u)}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Mensagem
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}