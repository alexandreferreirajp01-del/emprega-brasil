import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Users, Trash2, Loader2, CheckCircle, Search, Clock, UserX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function GerenciarUsuarios() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser.email === 'alexandreferreirajp01@gmail.com' || 
                        currentUser.role === 'admin' || 
                        currentUser.subscription_type === 'admin';
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    staleTime: 60000,
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast('Usuário atualizado!');
    },
    onError: () => showToast('Erro ao atualizar', 'error')
  });

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingUsers = users.filter(u => u.access_status === 'pending' || !u.access_status);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Gerenciar Usuários
          </h1>
          <p className="text-white/70 text-sm">{users.length} usuários • {pendingUsers.length} pendentes</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {pendingUsers.length > 0 && (
          <Card className="rounded-xl border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                <Clock className="w-5 h-5" />
                Pendentes ({pendingUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingUsers.slice(0, 5).map((u) => (
                <div key={u.id} className="p-3 bg-white rounded-xl flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={u.profile_photo} />
                    <AvatarFallback className="bg-amber-200 text-amber-700">{u.full_name?.[0] || u.email?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.full_name || 'Sem nome'}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <Select onValueChange={(type) => updateUserMutation.mutate({ id: u.id, data: { subscription_type: type, access_status: 'approved' } })}>
                    <SelectTrigger className="w-28 h-8 text-xs rounded-lg">
                      <SelectValue placeholder="Aprovar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="recruiter">Recrutador</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-3 bg-white rounded-xl border flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={u.profile_photo} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">{u.full_name?.[0] || u.email?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.full_name || 'Sem nome'}</p>
                  <div className="flex gap-1 mt-0.5">
                    <Badge className={`text-[10px] ${
                      u.subscription_type === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.subscription_type === 'premium' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {u.subscription_type || 'Visitante'}
                    </Badge>
                  </div>
                </div>
                <Select 
                  value={u.subscription_type || 'visitor'}
                  onValueChange={(type) => updateUserMutation.mutate({ id: u.id, data: { subscription_type: type, access_status: 'approved' } })}
                >
                  <SelectTrigger className="w-24 h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visitor">Visitante</SelectItem>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="recruiter">Recrutador</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateUserMutation.mutate({ id: u.id, data: { access_status: u.access_status === 'blocked' ? 'approved' : 'blocked' } })}
                  className={`h-8 rounded-lg text-xs ${u.access_status === 'blocked' ? 'text-green-600' : 'text-orange-600'}`}
                >
                  <UserX className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}