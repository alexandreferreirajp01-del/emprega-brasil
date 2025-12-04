import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, FileText, Loader2, BookOpen, FileSpreadsheet, File } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

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

export default function BibliotecaSection({ user }) {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');

  const { data: materiais = [], isLoading } = useQuery({
    queryKey: ['materiais-biblioteca'],
    queryFn: () => base44.entities.MaterialBiblioteca.list('-created_date', 100)
  });

  const materiaisFiltrados = materiais.filter(m => {
    const matchBusca = !busca || 
      m.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
      m.descricao?.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoriaFiltro === 'todos' || m.categoria === categoriaFiltro;
    return matchBusca && matchCategoria;
  });

  const handleDownload = async (material) => {
    if (material.arquivo_url) {
      window.open(material.arquivo_url, '_blank');
      // Incrementar contador
      try {
        await base44.entities.MaterialBiblioteca.update(material.id, {
          downloads: (material.downloads || 0) + 1
        });
      } catch (e) {}
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar material..."
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas Categorias</SelectItem>
            {Object.entries(CATEGORIAS).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {materiaisFiltrados.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Nenhum material encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {materiaisFiltrados.map((material) => {
            const cat = CATEGORIAS[material.categoria] || CATEGORIAS.outros;
            const Icon = cat.icon;
            return (
              <Card key={material.id} className="rounded-xl hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {material.imagem_capa && (
                    <img
                      src={material.imagem_capa}
                      alt={material.titulo}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.cor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{material.titulo}</h3>
                      {material.descricao && (
                        <p className="text-sm text-slate-500 line-clamp-2 mt-1">{material.descricao}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={cat.cor}>{cat.label}</Badge>
                        {material.downloads > 0 && (
                          <span className="text-xs text-slate-400">{material.downloads} downloads</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(material)}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}