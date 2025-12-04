import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Plus, Trash2, Save, Loader2, Image, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CriadorPortfolio({ user }) {
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [novoProjeto, setNovoProjeto] = useState({ titulo: '', descricao: '', link_projeto: '', imagem_url: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await base44.entities.PortfolioUsuario.filter({ user_email: user.email });
        setProjetos(lista || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user?.email) carregar();
  }, [user]);

  const adicionarProjeto = async () => {
    if (!novoProjeto.titulo) return;
    setSalvando(true);
    try {
      const novo = await base44.entities.PortfolioUsuario.create({
        ...novoProjeto,
        user_email: user.email
      });
      setProjetos([...projetos, novo]);
      setNovoProjeto({ titulo: '', descricao: '', link_projeto: '', imagem_url: '' });
      setShowForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
    }
  };

  const removerProjeto = async (id) => {
    try {
      await base44.entities.PortfolioUsuario.delete(id);
      setProjetos(projetos.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNovoProjeto({ ...novoProjeto, imagem_url: file_url });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="bg-orange-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <Briefcase className="w-5 h-5" />
          Meu Portfólio
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700 rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Projeto
          </Button>
        )}

        {showForm && (
          <div className="p-4 bg-slate-50 rounded-xl space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={novoProjeto.titulo} onChange={(e) => setNovoProjeto({...novoProjeto, titulo: e.target.value})} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={novoProjeto.descricao} onChange={(e) => setNovoProjeto({...novoProjeto, descricao: e.target.value})} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Link</Label>
              <Input value={novoProjeto.link_projeto} onChange={(e) => setNovoProjeto({...novoProjeto, link_projeto: e.target.value})} placeholder="https://..." className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Imagem</Label>
              <div className="flex gap-2 items-center">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  <Button type="button" variant="outline" className="rounded-lg" asChild>
                    <span><Image className="w-4 h-4 mr-2" />Upload</span>
                  </Button>
                </label>
                {novoProjeto.imagem_url && <img src={novoProjeto.imagem_url} alt="" className="w-16 h-16 object-cover rounded-lg" />}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={adicionarProjeto} disabled={!novoProjeto.titulo || salvando} className="bg-orange-600 hover:bg-orange-700 rounded-lg">
                {salvando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="rounded-lg">Cancelar</Button>
            </div>
          </div>
        )}

        {projetos.length === 0 ? (
          <p className="text-center text-slate-500 py-8">Nenhum projeto ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projetos.map((projeto) => (
              <Card key={projeto.id} className="rounded-xl overflow-hidden">
                {projeto.imagem_url && (
                  <img src={projeto.imagem_url} alt={projeto.titulo} className="w-full h-32 object-cover" />
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800">{projeto.titulo}</h4>
                      {projeto.descricao && <p className="text-sm text-slate-500 mt-1">{projeto.descricao}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removerProjeto(projeto.id)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {projeto.link_projeto && (
                    <a href={projeto.link_projeto} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 mt-2">
                      <ExternalLink className="w-3 h-3" />Ver
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}