import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, EyeOff, Megaphone, Loader2, Link as LinkIcon, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

export default function GerenciarPopups() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    icon: '📢',
    type: 'info',
    frequency: 'once',
    is_active: true,
    button_text: 'Entendi',
    priority: 0,
    start_date: '',
    end_date: '',
    buttons: []
  });

  const queryClient = useQueryClient();

  const { data: popups = [], isLoading } = useQuery({
    queryKey: ['popups-admin'],
    queryFn: () => base44.entities.AppPopup.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AppPopup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups-admin'] });
      toast.success('Popup criado!');
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AppPopup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups-admin'] });
      toast.success('Popup atualizado!');
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AppPopup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups-admin'] });
      toast.success('Popup removido!');
    },
  });

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingPopup(null);
    setFormData({
      title: '', message: '', icon: '📢', type: 'info', frequency: 'once',
      is_active: true, button_text: 'Entendi', priority: 0,
      start_date: '', end_date: '', buttons: []
    });
  };

  const addButton = () => {
    setFormData(prev => ({
      ...prev,
      buttons: [...(prev.buttons || []), { label: '', url: '', style: 'primary' }]
    }));
  };

  const updateButton = (index, field, value) => {
    setFormData(prev => {
      const btns = [...(prev.buttons || [])];
      btns[index] = { ...btns[index], [field]: value };
      return { ...prev, buttons: btns };
    });
  };

  const removeButton = (index) => {
    setFormData(prev => ({
      ...prev,
      buttons: (prev.buttons || []).filter((_, i) => i !== index)
    }));
  };

  const handleEdit = (popup) => {
    setEditingPopup(popup);
    setFormData({
      title: popup.title,
      message: popup.message,
      icon: popup.icon || '📢',
      type: popup.type,
      frequency: popup.frequency,
      is_active: popup.is_active,
      button_text: popup.button_text || 'Entendi',
      priority: popup.priority || 0,
      start_date: popup.start_date?.split('T')[0] || '',
      end_date: popup.end_date?.split('T')[0] || '',
      buttons: popup.buttons || []
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.message) {
      toast.error('Preencha título e mensagem');
      return;
    }

    const data = {
      ...formData,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
    };

    if (editingPopup) {
      updateMutation.mutate({ id: editingPopup.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const typeLabels = {
    info: { label: 'Info', color: 'bg-blue-100 text-blue-800' },
    warning: { label: 'Alerta', color: 'bg-yellow-100 text-yellow-800' },
    success: { label: 'Sucesso', color: 'bg-green-100 text-green-800' },
    announcement: { label: 'Anúncio', color: 'bg-purple-100 text-purple-800' },
  };

  const frequencyLabels = {
    once: 'Uma vez',
    daily: 'Diário',
    weekly: 'Semanal',
    always: 'Sempre'
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-[#0A66C2]" />
              Gerenciar Popups
            </h1>
            <p className="text-slate-500 mt-1">Crie e gerencie popups de avisos no app</p>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-[#0A66C2] hover:bg-[#004182] rounded-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Popup
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : popups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum popup criado ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {popups.map(popup => (
              <Card key={popup.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{popup.icon || '📢'}</span>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                          {popup.title}
                        </h3>
                        {popup.is_active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Eye className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                        {popup.message}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={typeLabels[popup.type]?.color}>
                          {typeLabels[popup.type]?.label}
                        </Badge>
                        <Badge variant="outline">
                          {frequencyLabels[popup.frequency]}
                        </Badge>
                        {popup.priority > 0 && (
                          <Badge className="bg-orange-100 text-orange-800">
                            Prioridade: {popup.priority}
                          </Badge>
                        )}
                      </div>
                      {popup.buttons?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {popup.buttons.map((btn, i) => btn.url && (
                            <a key={i} href={btn.url} target="_blank" rel="noopener noreferrer">
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                {btn.label || btn.url}
                              </Badge>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(popup)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (confirm('Remover este popup?')) {
                            deleteMutation.mutate(popup.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Criar/Editar */}
        <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPopup ? 'Editar Popup' : 'Novo Popup'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Novo Nome!"
                  />
                </div>
                <div>
                  <Label>Ícone (emoji ou URL)</Label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="📢"
                  />
                </div>
              </div>

              <div>
                <Label>Mensagem *</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Mensagem do popup..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Alerta</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="announcement">Anúncio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Frequência</Label>
                  <Select value={formData.frequency} onValueChange={(v) => setFormData(prev => ({ ...prev, frequency: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Uma vez</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="always">Sempre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Prioridade</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Início (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Data Fim (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Texto do Botão de Fechar</Label>
                <Input
                  value={formData.button_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                  placeholder="Entendi"
                />
              </div>

              {/* Botões com Links */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" /> Botões com Link
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addButton} className="h-7 text-xs gap-1">
                    <Plus className="w-3 h-3" /> Adicionar Botão
                  </Button>
                </div>
                {(formData.buttons || []).length === 0 && (
                  <p className="text-xs text-slate-400 italic">Nenhum botão de link adicionado</p>
                )}
                {(formData.buttons || []).map((btn, index) => (
                  <div key={index} className="flex gap-2 items-center p-2 bg-slate-50 rounded-lg border">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Texto do botão"
                        value={btn.label}
                        onChange={e => updateButton(index, 'label', e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Input
                        placeholder="URL (https://...)"
                        value={btn.url}
                        onChange={e => updateButton(index, 'url', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <select
                      value={btn.style || 'primary'}
                      onChange={e => updateButton(index, 'style', e.target.value)}
                      className="h-8 px-2 text-xs rounded border bg-white flex-shrink-0"
                    >
                      <option value="primary">Primário</option>
                      <option value="outline">Outline</option>
                      <option value="ghost">Sutil</option>
                    </select>
                    {btn.url && (
                      <a href={btn.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-blue-500">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    )}
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 flex-shrink-0"
                      onClick={() => removeButton(index)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label>Popup Ativo</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleCloseDialog} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-[#0A66C2] hover:bg-[#004182]"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}