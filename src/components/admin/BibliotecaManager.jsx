import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Edit, X, Loader2, Upload, Save, BookOpen, FileText, FileSpreadsheet, File, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CATEGORIAS = {
  ebooks: { label: 'eBooks', icon: BookOpen, cor: 'bg-blue-100 text-blue-700' },
  guias_entrevista: { label: 'Guias de Entrevista', icon: FileText, cor: 'bg-green-100 text-green-700' },
  kits_curriculo: { label: 'Kits de Currículo', icon: File, cor: 'bg-purple-100 text-purple-700' },
  planilhas: { label: 'Planilhas', icon: FileSpreadsheet, cor: 'bg-orange-100 text-orange-700' },
  pdfs_estudo: { label: 'PDFs de Estudo', icon: FileText, cor: 'bg-red-100 text-red-700' },
  modelos_prontos: { label: 'Modelos Prontos', icon: File, cor: 'bg-teal-100 text-teal-700' },
  apostilas: { label: 'Apostilas', icon: BookOpen, cor: 'bg-indigo-100 text-indigo-700' },
  outros: { label: 'Outros', icon: File, cor: 'bg-slate-100 text-slate-700' }
};

export default function BibliotecaManager({ showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: 'ebooks',
    tipo_arquivo: 'pdf',
    arquivo_url: '',
    imagem_capa: ''
  });
  const queryClient = useQueryClient();

  const { data: materiais = [], isLoading } = useQuery({
    queryKey: ['admin-biblioteca'],
    queryFn: () => base44.entities.MaterialBiblioteca.list('-created_date', 200)
  });

  const criarMutation = useMutation({
    mutationFn: (data) => base44.entities.MaterialBiblioteca.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-biblioteca'] });
      resetForm();
      showToast('Material adicionado com sucesso!');
    },
    onError: () => showToast('Erro ao adicionar material', 'error')
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaterialBiblioteca.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-biblioteca'] });
      resetForm();
      showToast('Material atualizado!');
    },
    onError: () => showToast('Erro ao atualizar', 'error')
  });

  const deletarMutation = useMutation({
    mutationFn: (id) => base44.entities.MaterialBiblioteca.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-biblioteca'] });
      showToast('Material excluído!');
    }
  });

  const resetForm = () => {
    setForm({ titulo: '', descricao: '', categoria: 'ebooks', tipo_arquivo: 'pdf', arquivo_url: '', imagem_capa: '' });
    setShowForm(false);
    setEditando(null);
  };

  const handleEditar = (material) => {
    setForm({
      titulo: material.titulo || '',
      descricao: material.descricao || '',
      categoria: material.categoria || 'ebooks',
      tipo_arquivo: material.tipo_arquivo || 'pdf',
      arquivo_url: material.arquivo_url || '',
      imagem_capa: material.imagem_capa || ''
    });
    setEditando(material.id);
    setShowForm(true);
  };

  const handleUpload = async (e, campo) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, [campo]: file_url }));
      showToast('Arquivo enviado!');
    } catch {
      showToast('Erro ao enviar arquivo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.titulo || !form.arquivo_url) {
      showToast('Preencha título e arquivo', 'error');
      return;
    }
    if (editando) {
      atualizarMutation.mutate({ id: editando, data: form });
    } else {
      criarMutation.mutate({ ...form, downloads: 0 });
    }
  };

  return (
    <div className="space-y-6">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Material
        </Button>
      ) : (
        <Card className="rounded-xl">
          <CardHeader className="bg-blue-600 text-white rounded-t-xl flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {editando ? 'Editar Material' : 'Novo Material'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Nome do material"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição do material..."
                  className="rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIAS).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Arquivo</Label>
                  <Select value={form.tipo_arquivo} onValueChange={(v) => setForm({ ...form, tipo_arquivo: v })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">Word (DOCX)</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                      <SelectItem value="pptx">PowerPoint (PPTX)</SelectItem>
                      <SelectItem value="zip">ZIP</SelectItem>
                      <SelectItem value="link">Link Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Arquivo *</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.arquivo_url}
                    onChange={(e) => setForm({ ...form, arquivo_url: e.target.value })}
                    placeholder="URL do arquivo ou faça upload"
                    className="rounded-lg flex-1"
                  />
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'arquivo_url')} />
                    <Button type="button" variant="outline" className="rounded-lg" asChild>
                      <span>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}</span>
                    </Button>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imagem de Capa (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.imagem_capa}
                    onChange={(e) => setForm({ ...form, imagem_capa: e.target.value })}
                    placeholder="URL da imagem"
                    className="rounded-lg flex-1"
                  />
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'imagem_capa')} />
                    <Button type="button" variant="outline" className="rounded-lg" asChild>
                      <span><Upload className="w-4 h-4" /></span>
                    </Button>
                  </label>
                </div>
                {form.imagem_capa && (
                  <img src={form.imagem_capa} alt="Preview" className="w-32 h-24 object-cover rounded-lg mt-2" />
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl" disabled={criarMutation.isPending || atualizarMutation.isPending}>
                  {(criarMutation.isPending || atualizarMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {editando ? 'Salvar' : 'Adicionar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Materiais Cadastrados ({materiais.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : materiais.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Nenhum material cadastrado.</p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {materiais.map((material) => {
                  const cat = CATEGORIAS[material.categoria] || CATEGORIAS.outros;
                  return (
                    <div key={material.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        {material.imagem_capa ? (
                          <img src={material.imagem_capa} alt="" className="w-12 h-12 object-cover rounded-lg" />
                        ) : (
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${cat.cor}`}>
                            <cat.icon className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-800">{material.titulo}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={cat.cor}>{cat.label}</Badge>
                            <span className="text-xs text-slate-500">{material.downloads || 0} downloads</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditar(material)} className="rounded-lg">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deletarMutation.mutate(material.id)} className="rounded-lg text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}