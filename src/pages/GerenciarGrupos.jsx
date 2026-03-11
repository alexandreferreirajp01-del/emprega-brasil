import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, MessageCircle, Send, Users, ExternalLink, GripVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

const CATEGORIES = [
  "Vagas de Emprego",
  "Compra e Venda",
  "Imóveis",
  "Serviços e Profissionais",
  "Cursos e Educação",
  "Empreendedorismo e Negócios",
  "Tecnologia e Informática",
  "Eventos e Oportunidades",
  "Comunidade Local",
  "Assuntos Diversos",
];

const emptyForm = { name: '', type: 'whatsapp', link: '', description: '', category: 'Vagas de Emprego', is_active: true, order: 0 };

const TYPE_LABELS = {
  whatsapp: 'WhatsApp',
  whatsapp_channel: 'Canal WhatsApp',
  telegram: 'Telegram',
  facebook: 'Facebook',
};

const TYPE_COLORS = {
  whatsapp: 'bg-[#25D366]',
  whatsapp_channel: 'bg-[#25D366]',
  telegram: 'bg-[#0088cc]',
  facebook: 'bg-[#1877f2]',
};

function GroupIcon({ type }) {
  if (type === 'telegram') return <Send className="w-5 h-5 text-white" />;
  if (type === 'facebook') return <Users className="w-5 h-5 text-white" />;
  return <MessageCircle className="w-5 h-5 text-white" />;
}

export default function GerenciarGrupos() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.list('order', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Group.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['groups']); toast.success('Grupo criado!'); closeDialog(); },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Group.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['groups']); toast.success('Grupo atualizado!'); closeDialog(); },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Group.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['groups']); toast.success('Grupo excluído!'); setConfirmDelete(null); },
    onError: (e) => toast.error('Erro: ' + e.message),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (g) => { setEditing(g); setForm({ name: g.name, type: g.type || 'whatsapp', link: g.link, description: g.description || '', is_active: g.is_active !== false, order: g.order || 0 }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.link.trim()) { toast.error('Link é obrigatório'); return; }
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const toggleActive = (g) => {
    updateMutation.mutate({ id: g.id, data: { is_active: !g.is_active } });
  };

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] pt-4 pb-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <button className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3">
              <ArrowLeft className="w-4 h-4" /> Configurações
            </button>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Gerenciar Grupos</h1>
                <p className="text-white/60 text-xs mt-0.5">Adicione, edite ou desative grupos da página de comunidade</p>
              </div>
            </div>
            <Button onClick={openCreate} className="bg-green-500 hover:bg-green-600 gap-2">
              <Plus className="w-4 h-4" /> Novo Grupo
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Carregando...</div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">Nenhum grupo cadastrado ainda.</p>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" /> Adicionar Primeiro Grupo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <Card key={g.id} className={`dark:bg-slate-800 dark:border-slate-700 transition-opacity ${!g.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl ${TYPE_COLORS[g.type] || 'bg-[#25D366]'} flex items-center justify-center flex-shrink-0`}>
                      <GroupIcon type={g.type} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{g.name}</p>
                        <Badge className="text-xs">{TYPE_LABELS[g.type] || g.type}</Badge>
                        {!g.is_active && <Badge variant="outline" className="text-xs text-red-500 border-red-300">Desativado</Badge>}
                      </div>
                      {g.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{g.description}</p>}
                      <a href={g.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5 truncate max-w-xs">
                        <ExternalLink className="w-3 h-3 flex-shrink-0" /> {g.link}
                      </a>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 hidden sm:block">{g.is_active ? 'Ativo' : 'Inativo'}</span>
                        <Switch
                          checked={g.is_active !== false}
                          onCheckedChange={() => toggleActive(g)}
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(g)} className="h-8 w-8">
                        <Pencil className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(g)} className="h-8 w-8">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Grupo' : 'Novo Grupo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Nome do Grupo *</Label>
              <Input className="mt-1" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Grupo WhatsApp PB 01" />
            </div>
            <div>
              <Label>Plataforma *</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="whatsapp_channel">Canal WhatsApp</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Link de Convite *</Label>
              <Input className="mt-1" value={form.link} onChange={e => set('link', e.target.value)} placeholder="https://chat.whatsapp.com/..." />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input className="mt-1" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Breve descrição do grupo" />
            </div>
            <div>
              <Label>Ordem de exibição</Label>
              <Input className="mt-1" type="number" value={form.order} onChange={e => set('order', Number(e.target.value))} placeholder="0" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
              <Label>Grupo ativo (visível para usuários)</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={closeDialog}>Cancelar</Button>
              <Button className="flex-1 bg-[#1D4371] hover:bg-[#0F2744]" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Criar Grupo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Grupo</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 dark:text-slate-300 text-sm">Tem certeza que deseja excluir <strong>{confirmDelete?.name}</strong>? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={() => deleteMutation.mutate(confirmDelete.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}