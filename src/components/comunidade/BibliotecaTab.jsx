import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, FileText, Book, File, Grid, ExternalLink, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIAS = {
  ebooks: { label: 'eBooks', icon: Book, cor: 'bg-purple-100 text-purple-700' },
  guias_entrevista: { label: 'Guias de Entrevista', icon: FileText, cor: 'bg-blue-100 text-blue-700' },
  kits_curriculo: { label: 'Kits de Currículo', icon: File, cor: 'bg-green-100 text-green-700' },
  planilhas: { label: 'Planilhas', icon: Grid, cor: 'bg-orange-100 text-orange-700' },
  pdfs_estudo: { label: 'PDFs de Estudo', icon: FileText, cor: 'bg-red-100 text-red-700' },
  modelos_prontos: { label: 'Modelos Prontos', icon: File, cor: 'bg-indigo-100 text-indigo-700' },
  ferramentas: { label: 'Ferramentas Úteis', icon: ExternalLink, cor: 'bg-teal-100 text-teal-700' }
};

export default function BibliotecaTab({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await base44.entities.BibliotecaItem.list('-created_date', 100);
        setItems(lista || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const handleDownload = async (item) => {
    try {
      await base44.entities.BibliotecaItem.update(item.id, {
        downloads: (item.downloads || 0) + 1
      });
      window.open(item.arquivo_url, '_blank');
    } catch (e) {
      window.open(item.arquivo_url, '_blank');
    }
  };

  const itemsFiltrados = items.filter(item => {
    const matchBusca = item.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
                       item.descricao?.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoriaFiltro === 'todas' || item.categoria === categoriaFiltro;
    return matchBusca && matchCategoria;
  });

  if (loading) {
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar materiais..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Categorias</SelectItem>
            {Object.entries(CATEGORIAS).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Items */}
      {itemsFiltrados.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="p-8 text-center">
            <Book className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              {busca || categoriaFiltro !== 'todas' 
                ? 'Nenhum material encontrado com esses filtros.' 
                : 'Biblioteca vazia. Novos materiais serão adicionados em breve!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {itemsFiltrados.map((item) => {
            const cat = CATEGORIAS[item.categoria] || CATEGORIAS.ebooks;
            const IconCat = cat.icon;
            
            return (
              <Card key={item.id} className="rounded-xl hover:shadow-lg transition-shadow overflow-hidden">
                {item.imagem_capa && (
                  <div className="h-32 bg-slate-100">
                    <img 
                      src={item.imagem_capa} 
                      alt={item.titulo} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <Badge className={`${cat.cor} mb-2`}>
                    <IconCat className="w-3 h-3 mr-1" />
                    {cat.label}
                  </Badge>
                  <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{item.titulo}</h3>
                  {item.descricao && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{item.descricao}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {item.downloads || 0} downloads
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => handleDownload(item)}
                      className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}