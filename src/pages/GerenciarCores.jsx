import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Loader2, Save, Palette, RefreshCw, Eye, Check, Plus, Trash2
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ColorPickerModal from "@/components/admin/ColorPickerModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function GerenciarCores() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTheme, setEditingTheme] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [currentColorField, setCurrentColorField] = useState('');
  const [formData, setFormData] = useState({
    theme_name: '',
    primary_color: '#0A66C2',
    primary_dark: '#004182',
    secondary_color: '#057642',
    accent_color: '#F9C846',
    background_color: '#F3F2EF',
    text_primary: '#1D2226',
    text_secondary: '#666666',
    button_primary_bg: '#0A66C2',
    button_primary_text: '#FFFFFF',
    button_secondary_bg: '#FFFFFF',
    button_secondary_text: '#0A66C2',
    is_active: false
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        const isAdmin = currentUser?.email === 'alexandreferreirajp01@gmail.com' || 
                       currentUser?.role === 'admin' || 
                       currentUser?.subscription_type === 'admin';
        
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }
        
        setUser(currentUser);
        setLoading(false);
      } catch (e) {
        window.location.href = createPageUrl('Splash');
      }
    };
    checkAuth();
  }, []);

  const { data: themes = [], isLoading: themesLoading } = useQuery({
    queryKey: ['app-themes'],
    queryFn: () => base44.entities.AppTheme.list('-created_date', 100),
    enabled: !loading
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AppTheme.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-themes'] });
      toast.success('Tema criado com sucesso!');
      setEditDialog(false);
      setEditingTheme(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao criar tema: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AppTheme.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-themes'] });
      toast.success('Tema atualizado com sucesso!');
      setEditDialog(false);
      setEditingTheme(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao atualizar tema: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AppTheme.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-themes'] });
      toast.success('Tema excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir tema: ' + error.message);
    }
  });

  const activateMutation = useMutation({
    mutationFn: async (themeId) => {
      // Desativar todos os temas
      const allThemes = await base44.entities.AppTheme.list();
      for (const theme of allThemes) {
        if (theme.is_active) {
          await base44.entities.AppTheme.update(theme.id, { is_active: false });
        }
      }
      // Ativar o tema selecionado
      await base44.entities.AppTheme.update(themeId, { is_active: true });
      return themeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-themes'] });
      toast.success('Tema ativado! Recarregue a página para ver as mudanças.');
    },
    onError: (error) => {
      toast.error('Erro ao ativar tema: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      theme_name: '',
      primary_color: '#0A66C2',
      primary_dark: '#004182',
      secondary_color: '#057642',
      accent_color: '#F9C846',
      background_color: '#F3F2EF',
      text_primary: '#1D2226',
      text_secondary: '#666666',
      button_primary_bg: '#0A66C2',
      button_primary_text: '#FFFFFF',
      button_secondary_bg: '#FFFFFF',
      button_secondary_text: '#0A66C2',
      is_active: false
    });
  };

  const handleEdit = (theme) => {
    setEditingTheme(theme);
    setFormData({ ...theme });
    setEditDialog(true);
  };

  const handleNew = () => {
    setEditingTheme(null);
    resetForm();
    setEditDialog(true);
  };

  const handleSave = () => {
    if (!formData.theme_name) {
      toast.error('Nome do tema é obrigatório');
      return;
    }

    if (editingTheme) {
      updateMutation.mutate({ id: editingTheme.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openColorPicker = (field) => {
    setCurrentColorField(field);
    setColorPickerOpen(true);
  };

  const handleColorSave = (color) => {
    setFormData(prev => ({ ...prev, [currentColorField]: color }));
    setColorPickerOpen(false);
  };

  if (loading || themesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const colorFields = [
    { key: 'primary_color', label: 'Cor Primária', desc: 'Cor principal da aplicação' },
    { key: 'primary_dark', label: 'Cor Primária Escura', desc: 'Variação escura da primária' },
    { key: 'secondary_color', label: 'Cor Secundária', desc: 'Cor secundária/sucesso' },
    { key: 'accent_color', label: 'Cor de Destaque', desc: 'Cor de alerta/destaque' },
    { key: 'background_color', label: 'Cor de Fundo', desc: 'Fundo geral da aplicação' },
    { key: 'text_primary', label: 'Texto Principal', desc: 'Cor do texto principal' },
    { key: 'text_secondary', label: 'Texto Secundário', desc: 'Cor do texto secundário' },
    { key: 'button_primary_bg', label: 'Fundo Botão Primário', desc: 'Fundo do botão principal' },
    { key: 'button_primary_text', label: 'Texto Botão Primário', desc: 'Texto do botão principal' },
    { key: 'button_secondary_bg', label: 'Fundo Botão Secundário', desc: 'Fundo do botão secundário' },
    { key: 'button_secondary_text', label: 'Texto Botão Secundário', desc: 'Texto do botão secundário' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Gerenciar Cores</h1>
                <p className="text-sm text-slate-500">Personalize as cores da aplicação</p>
              </div>
            </div>
            <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Tema
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {themes.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-12 text-center">
              <Palette className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhum tema criado</h3>
              <p className="text-slate-500 mb-4">Crie seu primeiro tema de cores</p>
              <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Tema
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {themes.map((theme) => (
              <Card key={theme.id} className={`rounded-2xl ${theme.is_active ? 'ring-2 ring-green-500' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex-shrink-0"
                        style={{ backgroundColor: theme.primary_color }}
                      />
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">{theme.theme_name}</h3>
                        {theme.is_active && (
                          <div className="flex items-center gap-1 text-green-600 text-sm">
                            <Check className="w-4 h-4" />
                            <span>Tema Ativo</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!theme.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => activateMutation.mutate(theme.id)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Ativar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(theme)}
                      >
                        <Palette className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este tema?')) {
                            deleteMutation.mutate(theme.id);
                          }
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Preview de cores */}
                  <div className="grid grid-cols-6 gap-2">
                    <div className="text-center">
                      <div className="w-full h-12 rounded-lg mb-1" style={{ backgroundColor: theme.primary_color }} />
                      <p className="text-xs text-slate-500">Primária</p>
                    </div>
                    <div className="text-center">
                      <div className="w-full h-12 rounded-lg mb-1" style={{ backgroundColor: theme.primary_dark }} />
                      <p className="text-xs text-slate-500">Primária Escura</p>
                    </div>
                    <div className="text-center">
                      <div className="w-full h-12 rounded-lg mb-1" style={{ backgroundColor: theme.secondary_color }} />
                      <p className="text-xs text-slate-500">Secundária</p>
                    </div>
                    <div className="text-center">
                      <div className="w-full h-12 rounded-lg mb-1" style={{ backgroundColor: theme.accent_color }} />
                      <p className="text-xs text-slate-500">Destaque</p>
                    </div>
                    <div className="text-center">
                      <div className="w-full h-12 rounded-lg mb-1 border" style={{ backgroundColor: theme.background_color }} />
                      <p className="text-xs text-slate-500">Fundo</p>
                    </div>
                    <div className="text-center">
                      <div className="w-full h-12 rounded-lg mb-1 border flex items-center justify-center" style={{ backgroundColor: theme.button_primary_bg, color: theme.button_primary_text }}>
                        <span className="text-xs font-semibold">Botão</span>
                      </div>
                      <p className="text-xs text-slate-500">Botão 1º</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTheme ? 'Editar Tema' : 'Novo Tema'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Nome do Tema */}
            <div>
              <Label>Nome do Tema *</Label>
              <Input
                value={formData.theme_name}
                onChange={(e) => setFormData({ ...formData, theme_name: e.target.value })}
                placeholder="Ex: Tema Azul, Tema Escuro"
                className="mt-1"
              />
            </div>

            {/* Campos de Cores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colorFields.map((field) => (
                <div key={field.key} className="border rounded-xl p-4">
                  <Label className="text-sm font-semibold">{field.label}</Label>
                  <p className="text-xs text-slate-500 mb-2">{field.desc}</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-slate-200 cursor-pointer"
                      style={{ backgroundColor: formData[field.key] }}
                      onClick={() => openColorPicker(field.key)}
                    />
                    <div className="flex-1">
                      <Input
                        value={formData[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        placeholder="#000000"
                        className="font-mono text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openColorPicker(field.key)}
                    >
                      <Palette className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="border rounded-xl p-6 bg-slate-50">
              <h4 className="font-semibold mb-4">Preview</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    style={{
                      backgroundColor: formData.button_primary_bg,
                      color: formData.button_primary_text
                    }}
                  >
                    Botão Primário
                  </Button>
                  <Button
                    variant="outline"
                    style={{
                      backgroundColor: formData.button_secondary_bg,
                      color: formData.button_secondary_text,
                      borderColor: formData.button_primary_bg
                    }}
                  >
                    Botão Secundário
                  </Button>
                </div>
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: formData.background_color }}
                >
                  <p style={{ color: formData.text_primary }} className="font-semibold mb-1">
                    Texto Principal
                  </p>
                  <p style={{ color: formData.text_secondary }} className="text-sm">
                    Texto secundário de exemplo
                  </p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Salvar Tema
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Color Picker Modal */}
      <ColorPickerModal
        isOpen={colorPickerOpen}
        onClose={() => setColorPickerOpen(false)}
        mode="single"
        initialColor={formData[currentColorField]}
        onSave={handleColorSave}
      />
    </div>
  );
}