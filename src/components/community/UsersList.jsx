import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, Loader2, Crown, Shield, Briefcase } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UsersList({ user }) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const result = await base44.entities.User.list('-created_date', 500);
      return result || [];
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000,
  });

  const filteredUsers = users.filter(u => 
    u.email !== user?.email &&
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
     u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleMessage = async (targetUser) => {
    // Navegar para inbox com o usuário selecionado
    navigate(createPageUrl('Chat') + `?to=${encodeURIComponent(targetUser.email)}&name=${encodeURIComponent(targetUser.full_name || 'Usuário')}&photo=${encodeURIComponent(targetUser.profile_photo || '')}`);
  };

  const getBadge = (u) => {
    if (u.role === 'admin' || u.subscription_type === 'admin') {
      return (
        <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    }
    if (u.subscription_type === 'recruiter') {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
          <Briefcase className="w-3 h-3 mr-1" />
          Recrutador
        </Badge>
      );
    }
    if (u.subscription_type === 'premium') {
      return (
        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
          <Crown className="w-3 h-3 mr-1" />
          Premium
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Buscar usuários..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
        </div>
      ) : error ? (
        <Card className="rounded-xl">
          <CardContent className="p-8 text-center">
            <p className="text-red-500">Erro ao carregar usuários. Tente novamente.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Recarregar
            </Button>
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500">
              {search ? 'Nenhum usuário encontrado com esse nome.' : 'Nenhum usuário cadastrado ainda.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((u) => (
            <Card key={u.id} className="rounded-xl hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={u.profile_photo} />
                      <AvatarFallback className="bg-[#0056ff] text-white">
                        {u.full_name?.[0] || u.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-800">{u.full_name || 'Usuário'}</p>
                      <div className="flex items-center gap-2">
                        {getBadge(u)}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleMessage(u)}
                    className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
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