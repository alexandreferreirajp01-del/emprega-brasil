import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, Loader2, Crown, Shield, Briefcase, User, RefreshCw, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function SocialUsers({ user }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Carregar usuários
  const loadUsers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    
    try {
      const allUsers = await base44.entities.User.list('-created_date', 1000);
      // Filtrar apenas usuários com nome
      const validUsers = (allUsers || []).filter(u => u.full_name && u.full_name.trim());
      setUsers(validUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const getPlanBadge = (u) => {
    if (u.subscription_type === 'admin' || u.role === 'admin') {
      return <Badge className="bg-purple-100 text-purple-700 border-0 text-xs font-medium"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
    }
    if (u.subscription_type === 'recruiter') {
      return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs font-medium"><Briefcase className="w-3 h-3 mr-1" />Recrutador</Badge>;
    }
    if (u.subscription_type === 'premium') {
      return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs font-medium"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-600 border-0 text-xs font-medium"><User className="w-3 h-3 mr-1" />Básico</Badge>;
  };

  // Filtrar e ordenar
  const filteredUsers = users
    .filter(u => u.email !== user?.email)
    .filter(u => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return u.full_name?.toLowerCase().includes(searchLower) || 
             u.email?.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      if (sortBy === 'plan') {
        const order = { admin: 0, recruiter: 1, premium: 2, basic: 3, undefined: 4 };
        return (order[a.subscription_type] || 4) - (order[b.subscription_type] || 4);
      }
      return (a.full_name || '').localeCompare(b.full_name || '');
    });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header com busca */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuários..."
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">A-Z</SelectItem>
            <SelectItem value="plan">Plano</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => loadUsers(true)}
          disabled={refreshing}
          className="rounded-xl flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Contador */}
      <p className="text-sm text-slate-500">
        {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
      </p>

      {/* Lista */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">Nenhum usuário encontrado</p>
          <p className="text-sm text-slate-400 mt-1">Tente outro termo de busca</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map(u => (
            <Card key={u.id} className="shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Link to={`${createPageUrl('SocialProfile')}?email=${u.email}`} className="flex-shrink-0">
                    <Avatar className="w-14 h-14 ring-2 ring-slate-100">
                      <AvatarImage src={u.profile_photo} />
                      <AvatarFallback className="bg-[#0056ff] text-white text-lg font-semibold">
                        {u.full_name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`${createPageUrl('SocialProfile')}?email=${u.email}`}
                      className="font-semibold text-slate-800 hover:text-[#0056ff] hover:underline block truncate"
                    >
                      {u.full_name || 'Usuário'}
                    </Link>
                    <div className="mt-1.5">
                      {getPlanBadge(u)}
                    </div>
                  </div>
                  <Link to={`${createPageUrl('SocialChat')}?email=${u.email}`} className="flex-shrink-0">
                    <Button className="rounded-xl bg-[#0056ff] hover:bg-[#0044cc] shadow-sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Mensagem
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}