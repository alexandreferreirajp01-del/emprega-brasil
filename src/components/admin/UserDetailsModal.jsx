import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, Mail, Lock, Activity, MessageCircle, 
  Calendar, Eye, Save, Loader2, Briefcase,
  Newspaper, Heart, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import TimeAgo from '@/components/common/TimeAgo';

export default function UserDetailsModal({ user, open, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('info');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  // Buscar atividades do usuário
  const { data: activities = [] } = useQuery({
    queryKey: ['user-activities', user.email],
    queryFn: async () => {
      const acts = await base44.entities.UserActivity.filter({ user_email: user.email }, '-created_date', 50);
      return acts;
    },
    enabled: open && activeTab === 'activities'
  });

  // Buscar vagas favoritas
  const { data: favorites = [] } = useQuery({
    queryKey: ['user-favorites', user.email],
    queryFn: async () => {
      return await base44.entities.FavoriteJob.filter({ user_email: user.email });
    },
    enabled: open && activeTab === 'activities'
  });

  // Buscar histórico de visualizações
  const { data: viewHistory = [] } = useQuery({
    queryKey: ['user-views', user.email],
    queryFn: async () => {
      return await base44.entities.ViewHistory.filter({ user_email: user.email }, '-created_date', 20);
    },
    enabled: open && activeTab === 'activities'
  });

  // Buscar mensagens
  const { data: messages = [] } = useQuery({
    queryKey: ['user-messages', user.email],
    queryFn: async () => {
      const sent = await base44.entities.MensagemDireta.filter({ remetente_email: user.email });
      const received = await base44.entities.MensagemDireta.filter({ destinatario_email: user.email });
      return [...sent, ...received].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
    enabled: open && activeTab === 'messages'
  });

  // Alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: async (password) => {
      return await base44.functions.invoke('changePassword', {
        user_email: user.email,
        new_password: password
      });
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
    },
    onError: () => {
      toast.error('Erro ao alterar senha');
    }
  });

  // Enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      return await base44.functions.invoke('sendMessage', {
        destinatario_email: user.email,
        conteudo: content,
        message_type: 'admin_to_user'
      });
    },
    onSuccess: () => {
      toast.success('Mensagem enviada!');
      setMessage('');
      setActiveTab('messages');
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem');
    }
  });

  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    changePasswordMutation.mutate(newPassword);
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }
    sendMessageMutation.mutate(message);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {(user.full_name || user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div>{user.full_name || 'Sem nome'}</div>
              <div className="text-sm font-normal text-slate-500">{user.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="info">
              <User className="w-4 h-4 mr-2" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="activities">
              <Activity className="w-4 h-4 mr-2" />
              Atividades
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageCircle className="w-4 h-4 mr-2" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="w-4 h-4 mr-2" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informações */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados Cadastrais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-slate-600 dark:text-slate-400">Nome Completo</Label>
                    <p className="font-medium">{user.full_name || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600 dark:text-slate-400">Email</Label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600 dark:text-slate-400">Função</Label>
                    <Badge className={user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600 dark:text-slate-400">Plano</Label>
                    <Badge>{user.subscription_type || 'Básico'}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600 dark:text-slate-400">Data de Cadastro</Label>
                    <p className="font-medium">{new Date(user.created_date).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600 dark:text-slate-400">Última Atualização</Label>
                    <p className="font-medium">{new Date(user.updated_date).toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                {user.phone && (
                  <div>
                    <Label className="text-sm text-slate-600 dark:text-slate-400">Telefone</Label>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                )}

                {user.city && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-600 dark:text-slate-400">Cidade</Label>
                      <p className="font-medium">{user.city}</p>
                    </div>
                    {user.state && (
                      <div>
                        <Label className="text-sm text-slate-600 dark:text-slate-400">Estado</Label>
                        <p className="font-medium">{user.state}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Atividades */}
          <TabsContent value="activities" className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Heart className="w-5 h-5" />
                    <div>
                      <p className="text-2xl font-bold">{favorites.length}</p>
                      <p className="text-xs text-slate-600">Vagas Favoritas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <Eye className="w-5 h-5" />
                    <div>
                      <p className="text-2xl font-bold">{viewHistory.length}</p>
                      <p className="text-xs text-slate-600">Vagas Visualizadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Activity className="w-5 h-5" />
                    <div>
                      <p className="text-2xl font-bold">{activities.length}</p>
                      <p className="text-xs text-slate-600">Atividades</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Atividades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Nenhuma atividade registrada</p>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <Activity className="w-4 h-4 mt-1 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action_type}</p>
                          {activity.page_name && (
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Página: {activity.page_name}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            <TimeAgo date={activity.created_date} />
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Mensagens */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enviar Mensagem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending}
                  className="w-full"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <MessageCircle className="w-4 h-4 mr-2" />
                  )}
                  Enviar Mensagem
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Conversas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Nenhuma mensagem ainda</p>
                  ) : (
                    messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`p-3 rounded-lg ${
                          msg.remetente_email === user.email 
                            ? 'bg-blue-50 dark:bg-blue-900/20 ml-8' 
                            : 'bg-slate-50 dark:bg-slate-800 mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {msg.remetente_email === user.email ? 'Usuário' : 'Admin'}
                          </p>
                          <p className="text-xs text-slate-500">
                            <TimeAgo date={msg.created_date} />
                          </p>
                        </div>
                        <p className="text-sm">{msg.conteudo}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Segurança */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha (mínimo 6 caracteres)"
                  />
                </div>
                <Button 
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                  className="w-full"
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações de Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm">ID do Usuário</span>
                  <span className="text-xs font-mono text-slate-600">{user.id}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm">Criado por</span>
                  <span className="text-xs text-slate-600">{user.created_by || 'Sistema'}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}