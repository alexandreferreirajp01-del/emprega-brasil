import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, Send, Users, Mail, Bell, Image, Link as LinkIcon, 
  Loader2, CheckCircle, AlertCircle, History, Plus, Trash2, 
  Edit2, Eye, Clock, Crown, Briefcase, Shield, UserX, Smartphone
} from "lucide-react";
import PushNotificationSender from "@/components/admin/PushNotificationSender";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const GROUPS = [
  { id: 'basic', label: 'Básico', icon: Users, color: 'bg-slate-100 text-slate-600', filter: (u) => !u.subscription_type || u.subscription_type === 'basic' },
  { id: 'premium', label: 'Premium', icon: Crown, color: 'bg-yellow-100 text-yellow-700', filter: (u) => u.subscription_type === 'premium' },
  { id: 'recruiter', label: 'Recrutador', icon: Briefcase, color: 'bg-blue-100 text-blue-700', filter: (u) => u.subscription_type === 'recruiter' },
  { id: 'admin', label: 'Administrador', icon: Shield, color: 'bg-purple-100 text-purple-700', filter: (u) => u.subscription_type === 'admin' || u.role === 'admin' },
  { id: 'visitor', label: 'Visitantes', icon: UserX, color: 'bg-gray-100 text-gray-600', filter: (u) => u.subscription_type === 'visitor' },
];

export default function ListaTransmissao() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('send');
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedLists, setSelectedLists] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  // List management
  const [showListDialog, setShowListDialog] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [listEmails, setListEmails] = useState('');

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

  // Fetch data
  const { data: users = [] } = useQuery({
    queryKey: ['users-broadcast'],
    queryFn: () => base44.entities.User.list('-created_date', 5000),
    enabled: !!user,
  });

  const { data: broadcastLists = [] } = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => base44.entities.BroadcastList.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: broadcastHistory = [] } = useQuery({
    queryKey: ['broadcast-history'],
    queryFn: () => base44.entities.BroadcastMessage.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: pushSubscriptions = [] } = useQuery({
    queryKey: ['push-subs-broadcast'],
    queryFn: () => base44.entities.PushSubscription.list('-created_date', 5000),
    enabled: !!user,
  });

  // Calculate recipients
  const getRecipients = () => {
    const recipientEmails = new Set();
    
    // Add from selected groups
    selectedGroups.forEach(groupId => {
      const group = GROUPS.find(g => g.id === groupId);
      if (group) {
        users.filter(group.filter).forEach(u => {
          if (u.email) recipientEmails.add(u.email);
        });
      }
    });
    
    // Add from selected lists
    selectedLists.forEach(listId => {
      const list = broadcastLists.find(l => l.id === listId);
      if (list && list.user_emails) {
        list.user_emails.forEach(email => recipientEmails.add(email));
      }
    });
    
    return Array.from(recipientEmails);
  };

  const recipientCount = getRecipients().length;

  // Group user counts
  const groupCounts = GROUPS.reduce((acc, group) => {
    acc[group.id] = users.filter(group.filter).length;
    return acc;
  }, {});

  // Mutations
  const createListMutation = useMutation({
    mutationFn: (data) => base44.entities.BroadcastList.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-lists'] });
      toast.success('Lista criada com sucesso!');
      resetListForm();
    },
    onError: () => toast.error('Erro ao criar lista'),
  });

  const updateListMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BroadcastList.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-lists'] });
      toast.success('Lista atualizada!');
      resetListForm();
    },
    onError: () => toast.error('Erro ao atualizar lista'),
  });

  const deleteListMutation = useMutation({
    mutationFn: (id) => base44.entities.BroadcastList.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-lists'] });
      toast.success('Lista excluída!');
    },
    onError: () => toast.error('Erro ao excluir lista'),
  });

  const resetListForm = () => {
    setShowListDialog(false);
    setEditingList(null);
    setListName('');
    setListDescription('');
    setListEmails('');
  };

  const handleSaveList = () => {
    if (!listName.trim()) {
      toast.error('Digite um nome para a lista');
      return;
    }

    const emails = listEmails
      .split(/[\n,;]/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e && e.includes('@'));

    const data = {
      name: listName.trim(),
      description: listDescription.trim(),
      user_emails: emails,
      is_active: true,
    };

    if (editingList) {
      updateListMutation.mutate({ id: editingList.id, data });
    } else {
      createListMutation.mutate(data);
    }
  };

  const handleEditList = (list) => {
    setEditingList(list);
    setListName(list.name);
    setListDescription(list.description || '');
    setListEmails(list.user_emails?.join('\n') || '');
    setShowListDialog(true);
  };

  // Image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      toast.success('Imagem enviada!');
    } catch (error) {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  // Send broadcast
  const handleSend = async () => {
    if (!title.trim()) {
      toast.error('Digite um título');
      return;
    }
    if (!content.trim()) {
      toast.error('Digite o conteúdo da mensagem');
      return;
    }
    if (selectedGroups.length === 0 && selectedLists.length === 0) {
      toast.error('Selecione pelo menos um grupo ou lista');
      return;
    }

    const recipients = getRecipients();
    if (recipients.length === 0) {
      toast.error('Nenhum destinatário encontrado');
      return;
    }

    setSending(true);
    let sentEmails = 0;
    let sentPush = 0;

    try {
      // Create broadcast record
      const broadcast = await base44.entities.BroadcastMessage.create({
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl || null,
        link_url: linkUrl || null,
        link_text: linkText || null,
        target_groups: selectedGroups,
        target_lists: selectedLists,
        recipients_count: recipients.length,
        status: 'sending',
        sent_by: user.email,
        sent_at: new Date().toISOString(),
      });

      // Build email body
      let emailBody = content;
      if (imageUrl) {
        emailBody += `<br/><br/><img src="${imageUrl}" style="max-width: 100%; border-radius: 8px;" />`;
      }
      if (linkUrl) {
        emailBody += `<br/><br/><a href="${linkUrl}" style="color: #0056ff; text-decoration: underline;">${linkText || linkUrl}</a>`;
      }

      // Send emails in batches
      const BATCH_SIZE = 10;
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map(email => 
            base44.integrations.Core.SendEmail({
              to: email,
              subject: title,
              body: emailBody,
            }).then(() => { sentEmails++; }).catch(() => {})
          )
        );
      }

      // Send push notifications
      const pushMap = {};
      pushSubscriptions.forEach(sub => {
        if (sub.user_email && recipients.includes(sub.user_email)) {
          pushMap[sub.user_email] = sub;
        }
      });

      // Create notifications for all recipients
      await Promise.allSettled(
        recipients.map(email => 
          base44.entities.Notification.create({
            user_email: email,
            title: title,
            message: content.substring(0, 200),
            type: 'broadcast',
            icon: '📢',
            link: linkUrl || null,
            read: false,
          }).then(() => { sentPush++; }).catch(() => {})
        )
      );

      // Update broadcast status
      await base44.entities.BroadcastMessage.update(broadcast.id, {
        status: 'sent',
        sent_emails: sentEmails,
        sent_push: sentPush,
      });

      queryClient.invalidateQueries({ queryKey: ['broadcast-history'] });
      
      toast.success(`Mensagem enviada para ${recipients.length} destinatários!`);
      
      // Reset form
      setTitle('');
      setContent('');
      setImageUrl('');
      setLinkUrl('');
      setLinkText('');
      setSelectedGroups([]);
      setSelectedLists([]);

    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0056ff] to-[#0044cc] pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Send className="w-7 h-7" />
            Lista de Transmissão
          </h1>
          <p className="text-white/70 text-sm mt-1">Envie mensagens em massa para grupos de usuários</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="push" className="gap-2">
              <Smartphone className="w-4 h-4" />
              Push
            </TabsTrigger>
            <TabsTrigger value="send" className="gap-2">
              <Send className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="lists" className="gap-2">
              <Users className="w-4 h-4" />
              Listas
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Push Tab */}
          <TabsContent value="push" className="space-y-4">
            <PushNotificationSender onSuccess={() => queryClient.invalidateQueries({ queryKey: ['broadcast-history'] })} />
          </TabsContent>

          {/* Send Tab */}
          <TabsContent value="send" className="space-y-4">
            {/* Groups Selection */}
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0056ff]" />
                  Selecionar Grupos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {GROUPS.map(group => (
                    <label
                      key={group.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedGroups.includes(group.id) 
                          ? 'border-[#0056ff] bg-[#0056ff]/5' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Checkbox
                        checked={selectedGroups.includes(group.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedGroups([...selectedGroups, group.id]);
                          } else {
                            setSelectedGroups(selectedGroups.filter(g => g !== group.id));
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${group.color}`}>
                            <group.icon className="w-3 h-3" />
                          </div>
                          <span className="font-medium text-sm">{group.label}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{groupCounts[group.id]} usuários</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Custom Lists */}
                {broadcastLists.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium text-slate-700 mb-2">Listas Personalizadas</p>
                    <div className="flex flex-wrap gap-2">
                      {broadcastLists.filter(l => l.is_active).map(list => (
                        <label
                          key={list.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                            selectedLists.includes(list.id)
                              ? 'border-[#0056ff] bg-[#0056ff]/5'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Checkbox
                            checked={selectedLists.includes(list.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLists([...selectedLists, list.id]);
                              } else {
                                setSelectedLists(selectedLists.filter(l => l !== list.id));
                              }
                            }}
                          />
                          <span className="text-sm">{list.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {list.user_emails?.length || 0}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipients count */}
                <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total de destinatários:</span>
                  <Badge className="bg-[#0056ff] text-white text-lg px-3 py-1">
                    {recipientCount}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Message Content */}
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#0056ff]" />
                  Conteúdo da Mensagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Título *</label>
                  <Input
                    placeholder="Ex: Nova vaga disponível!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-slate-400 mt-1">{title.length}/100</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Mensagem *</label>
                  <Textarea
                    placeholder="Digite o conteúdo da mensagem..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    maxLength={1000}
                  />
                  <p className="text-xs text-slate-400 mt-1">{content.length}/1000</p>
                </div>

                {/* Image */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Imagem (opcional)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#0056ff] transition-colors">
                        {uploading ? (
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0056ff]" />
                        ) : imageUrl ? (
                          <img src={imageUrl} alt="Preview" className="max-h-32 mx-auto rounded" />
                        ) : (
                          <>
                            <Image className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500">Clique para enviar imagem</p>
                          </>
                        )}
                      </div>
                    </label>
                    {imageUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImageUrl('')}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                      <LinkIcon className="w-4 h-4 inline mr-1" />
                      URL do Link (opcional)
                    </label>
                    <Input
                      placeholder="https://..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Texto do Link</label>
                    <Input
                      placeholder="Clique aqui"
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card className="rounded-xl bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-[#0056ff] mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800">Forma de Entrega</p>
                    <p className="text-sm text-slate-600 mt-1">
                      A mensagem será enviada simultaneamente por:
                    </p>
                    <div className="flex gap-4 mt-2">
                      <Badge variant="outline" className="bg-white">
                        <Mail className="w-3 h-3 mr-1" /> E-mail
                      </Badge>
                      <Badge variant="outline" className="bg-white">
                        <Bell className="w-3 h-3 mr-1" /> Notificação Push
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={sending || recipientCount === 0}
              className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] text-lg rounded-xl"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando para {recipientCount} destinatários...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Enviar Mensagem ({recipientCount} destinatários)
                </>
              )}
            </Button>
          </TabsContent>

          {/* Lists Tab */}
          <TabsContent value="lists" className="space-y-4">
            <Card className="rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Listas Personalizadas</CardTitle>
                <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-[#0056ff]" onClick={() => resetListForm()}>
                      <Plus className="w-4 h-4 mr-1" /> Nova Lista
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingList ? 'Editar Lista' : 'Nova Lista'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Nome da Lista *</label>
                        <Input
                          placeholder="Ex: Candidatos TI"
                          value={listName}
                          onChange={(e) => setListName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Descrição</label>
                        <Input
                          placeholder="Descrição opcional"
                          value={listDescription}
                          onChange={(e) => setListDescription(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">
                          Emails (um por linha ou separados por vírgula)
                        </label>
                        <Textarea
                          placeholder="email1@exemplo.com&#10;email2@exemplo.com"
                          value={listEmails}
                          onChange={(e) => setListEmails(e.target.value)}
                          rows={6}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          {listEmails.split(/[\n,;]/).filter(e => e.trim() && e.includes('@')).length} emails válidos
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={resetListForm} className="flex-1">
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveList} className="flex-1 bg-[#0056ff]">
                          {editingList ? 'Salvar' : 'Criar Lista'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {broadcastLists.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Nenhuma lista criada</p>
                    <p className="text-sm text-slate-400">Crie listas personalizadas para envios segmentados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {broadcastLists.map(list => (
                      <div key={list.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">{list.name}</p>
                          <p className="text-sm text-slate-500">
                            {list.user_emails?.length || 0} emails • {list.description || 'Sem descrição'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditList(list)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => deleteListMutation.mutate(list.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-[#0056ff]" />
                  Histórico de Envios
                </CardTitle>
              </CardHeader>
              <CardContent>
                {broadcastHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Nenhuma transmissão enviada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {broadcastHistory.map(msg => (
                      <div key={msg.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-slate-800">{msg.title}</h4>
                              <Badge className={
                                msg.status === 'sent' ? 'bg-green-100 text-green-700' :
                                msg.status === 'sending' ? 'bg-yellow-100 text-yellow-700' :
                                msg.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-600'
                              }>
                                {msg.status === 'sent' ? 'Enviado' :
                                 msg.status === 'sending' ? 'Enviando' :
                                 msg.status === 'failed' ? 'Falhou' : 'Rascunho'}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{msg.content}</p>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(msg.sent_at || msg.created_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {msg.recipients_count} destinatários
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {msg.sent_emails || 0} emails
                              </span>
                              <span className="flex items-center gap-1">
                                <Bell className="w-3 h-3" />
                                {msg.sent_push || 0} notificações
                              </span>
                            </div>
                            {msg.target_groups?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {msg.target_groups.map(g => {
                                  const group = GROUPS.find(gr => gr.id === g);
                                  return group ? (
                                    <Badge key={g} variant="outline" className="text-xs">
                                      {group.label}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                          {msg.image_url && (
                            <img src={msg.image_url} alt="" className="w-16 h-16 rounded object-cover ml-4" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}