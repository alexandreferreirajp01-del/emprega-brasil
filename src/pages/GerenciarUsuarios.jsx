import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, Users, Loader2, CheckCircle, Search, Clock, UserX, 
  ChevronLeft, ChevronRight, Eye, Mail, Phone, FileDown, RefreshCw, Filter, Edit
} from "lucide-react";
import UserEditDialog from "@/components/admin/UserEditDialog";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 20;

export default function GerenciarUsuarios() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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

  const { data: users = [], isLoading: loadingUsers } = useQuery({
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search || 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search) ||
      u.id?.includes(search);
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'blocked' && u.access_status === 'blocked') ||
      (statusFilter === 'active' && u.access_status !== 'blocked');
    
    const matchesType = typeFilter === 'all' || u.subscription_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingUsers = users.filter(u => u.access_status === 'pending' || !u.access_status);
  
  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleGoBack = () => {
    navigate(-1);
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'dono': return 'bg-amber-100 text-amber-700';
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'premium': return 'bg-green-100 text-green-700';
      case 'recruiter': return 'bg-blue-100 text-blue-700';
      case 'basic': return 'bg-slate-100 text-slate-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleExportExcel = () => {
    const data = filteredUsers.map(u => ({
      'ID': u.id,
      'Nome': u.full_name || '',
      'Email': u.email || '',
      'Telefone': u.phone || '',
      'Tipo de Conta': u.subscription_type || 'basic',
      'Status': u.access_status === 'blocked' ? 'Bloqueado' : 'Ativo',
      'Data de Cadastro': new Date(u.created_date).toLocaleDateString('pt-BR'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuários');
    
    const colWidths = [
      { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Excel exportado!');
  };

  const handleExportPDF = async () => {
    try {
      const content = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #4F46E5; margin-bottom: 10px; }
              .info { color: #64748B; margin-bottom: 20px; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #EEF2FF; padding: 12px; text-align: left; font-size: 12px; border: 1px solid #CBD5E1; }
              td { padding: 10px; border: 1px solid #E2E8F0; font-size: 11px; }
              tr:nth-child(even) { background: #F8FAFC; }
              .badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
              .admin { background: #F3E8FF; color: #7C3AED; }
              .premium { background: #D1FAE5; color: #059669; }
              .recruiter { background: #DBEAFE; color: #2563EB; }
              .basic { background: #F1F5F9; color: #475569; }
              .blocked { background: #FEE2E2; color: #DC2626; }
            </style>
          </head>
          <body>
            <h1>Usuários - Vagas Abertas Paraíba</h1>
            <div class="info">
              Total: ${filteredUsers.length} usuários<br>
              Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Cadastro</th>
                </tr>
              </thead>
              <tbody>
                ${filteredUsers.map(u => `
                  <tr>
                    <td>${u.full_name || 'Sem nome'}</td>
                    <td>${u.email || ''}</td>
                    <td>${u.phone || '-'}</td>
                    <td><span class="badge ${u.subscription_type || 'basic'}">${u.subscription_type || 'basic'}</span></td>
                    <td>${u.access_status === 'blocked' ? '<span class="badge blocked">Bloqueado</span>' : 'Ativo'}</td>
                    <td>${new Date(u.created_date).toLocaleDateString('pt-BR')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        showToast('PDF gerado!');
      };
    } catch (e) {
      showToast('Erro ao gerar PDF', 'error');
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    showToast('Lista atualizada!');
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const handleSaveUser = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white text-sm`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 pt-4 pb-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="text-white hover:bg-white/20 mb-2 -ml-2 h-9"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
            Gerenciar Usuários
          </h1>
          <p className="text-white/70 text-sm">
            {users.length} usuários • {pendingUsers.length} pendentes
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 space-y-4">
        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="rounded-xl"
            disabled={loadingUsers}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={handleExportExcel} 
            variant="outline" 
            className="rounded-xl text-green-600 hover:bg-green-50 border-green-200"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            className="rounded-xl text-red-600 hover:bg-red-50 border-red-200"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Pending Users */}
        {pendingUsers.length > 0 && (
          <Card className="rounded-xl border-amber-200 bg-amber-50">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                <Clock className="w-4 h-4" />
                Pendentes ({pendingUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {pendingUsers.slice(0, 5).map((u) => (
                <div key={u.id} className="p-3 bg-white rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      {u.profile_photo ? (
                        <AvatarImage src={u.profile_photo} alt={u.full_name || 'Usuário'} />
                      ) : (
                        <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                          {u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{u.full_name || 'Sem nome'}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <Select onValueChange={async (type) => {
                    await updateUserMutation.mutateAsync({ 
                      id: u.id, 
                      data: { subscription_type: type, access_status: 'approved' } 
                    });
                    
                    // Sincronizar com sistema de assinaturas
                    if (type === 'premium' || type === 'recruiter') {
                      try {
                        await base44.functions.invoke('syncSubscription', {
                          userEmail: u.email,
                          subscriptionType: type,
                          action: 'activate'
                        });
                      } catch (err) {
                        console.error('Erro ao sincronizar assinatura:', err);
                      }
                    }
                  }}>
                    <SelectTrigger className="w-full sm:w-28 h-9 text-xs rounded-lg">
                      <SelectValue placeholder="Aprovar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="recruiter">Recrutador</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="dono">Dono</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="rounded-xl">
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, email, telefone ou ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-11 rounded-xl text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-32 h-9 rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="blocked">Bloqueados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-32 h-9 rounded-lg">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="recruiter">Recrutador</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="dono">Dono</SelectItem>
                </SelectContent>
              </Select>
              {(search || statusFilter !== 'all' || typeFilter !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setCurrentPage(1);
                  }}
                  className="h-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="p-0">
            {loadingUsers ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="divide-y">
                {paginatedUsers.map((u) => (
                  <div 
                    key={u.id} 
                    className="p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* User Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          {u.profile_photo ? (
                            <AvatarImage src={u.profile_photo} alt={u.full_name || 'Usuário'} />
                          ) : (
                            <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                              {u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate">
                              {u.full_name || 'Sem nome'}
                            </p>
                            <Badge className={`text-[10px] px-1.5 py-0 ${getTypeBadgeClass(u.subscription_type)}`}>
                              {u.subscription_type || 'basic'}
                            </Badge>
                            {u.access_status === 'blocked' && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-600">
                                Bloqueado
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-13 sm:ml-0">
                        <Select 
                          value={u.subscription_type || 'basic'}
                          onValueChange={async (type) => {
                            const oldType = u.subscription_type;
                            
                            await updateUserMutation.mutateAsync({ 
                              id: u.id, 
                              data: { subscription_type: type, access_status: 'approved' } 
                            });
                            
                            // Sincronizar com sistema de assinaturas
                            try {
                              if (type === 'premium' || type === 'recruiter') {
                                await base44.functions.invoke('syncSubscription', {
                                  userEmail: u.email,
                                  subscriptionType: type,
                                  action: 'activate'
                                });
                              } else if ((oldType === 'premium' || oldType === 'recruiter') && 
                                         (type === 'basic' || type === 'visitor')) {
                                await base44.functions.invoke('syncSubscription', {
                                  userEmail: u.email,
                                  subscriptionType: oldType,
                                  action: 'deactivate'
                                });
                              }
                            } catch (err) {
                              console.error('Erro ao sincronizar assinatura:', err);
                            }
                          }}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Básico</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="recruiter">Recrutador</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="dono">Dono</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(u)}
                          className="h-8 w-8 p-0 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                          className="h-8 w-8 p-0 rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateUserMutation.mutate({ 
                            id: u.id, 
                            data: { access_status: u.access_status === 'blocked' ? 'approved' : 'blocked' } 
                          })}
                          className={`h-8 w-8 p-0 rounded-lg ${
                            u.access_status === 'blocked' 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-orange-600 hover:bg-orange-50'
                          }`}
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded User Details */}
                    {selectedUser?.id === u.id && (
                      <div className="mt-3 pt-3 border-t bg-slate-50 -mx-3 -mb-3 px-3 pb-3 rounded-b-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">{u.email}</span>
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                          <div className="text-slate-500">
                            Criado: {new Date(u.created_date).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-slate-500">
                            ID: {u.id}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-xl p-3 border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 p-0 rounded-lg text-xs ${
                      currentPage === pageNum ? 'bg-indigo-600' : ''
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 rounded-lg"
            >
              <span className="hidden sm:inline">Próximo</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="text-center text-xs text-slate-500">
          Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length} usuários
        </div>
      </div>

      {/* Dialog de Edição */}
      <UserEditDialog
        user={editingUser}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleSaveUser}
      />
    </div>
  );
}