import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Link as LinkIcon, Copy, Trash2, Plus, Check, X, Loader2, ArrowLeft
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function GerenciarLinksEspeciais() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  const [newLink, setNewLink] = useState({
    url: '',
    action_type: 'enable_basic',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser?.role !== 'admin' && currentUser?.subscription_type !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(currentUser);

      const linksData = await base44.entities.SpecialLink.list('-created_date', 100);
      setLinks(linksData || []);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const createSpecialLink = async () => {
    if (!newLink.url || !newLink.action_type) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setCreating(true);
    try {
      await base44.entities.SpecialLink.create({
        url: newLink.url,
        action_type: newLink.action_type,
        description: newLink.description,
        is_enabled: true
      });

      toast.success('Link especial criado com sucesso!');
      setNewLink({ url: '', action_type: 'enable_basic', description: '' });
      loadData();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar link');
    } finally {
      setCreating(false);
    }
  };

  const toggleLink = async (linkId, currentStatus) => {
    try {
      await base44.entities.SpecialLink.update(linkId, { is_enabled: !currentStatus });
      toast.success(currentStatus ? 'Link desativado' : 'Link ativado');
      loadData();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar link');
    }
  };

  const deleteLink = async (linkId) => {
    if (!confirm('Tem certeza que deseja excluir este link?')) return;
    
    try {
      await base44.entities.SpecialLink.delete(linkId);
      toast.success('Link excluído');
      loadData();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao excluir link');
    }
  };

  const actionTypeConfig = {
    enable_basic: { label: 'Habilitar Básico', color: 'bg-blue-100 text-blue-700' },
    enable_premium: { label: 'Habilitar Premium', color: 'bg-yellow-100 text-yellow-700' },
    enable_recruiter: { label: 'Habilitar Recrutador', color: 'bg-purple-100 text-purple-700' }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Links Especiais</h1>
            <p className="text-slate-500 text-sm">Gerencie links que habilitam planos automaticamente</p>
          </div>
        </div>
      </div>

      {/* Criar Novo Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Plus className="w-6 h-6 text-[#0A66C2]" />
            Criar Novo Link Especial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>URL do Link</Label>
              <Input
                placeholder="ex: empregabrasil.site/home"
                value={newLink.url}
                onChange={(e) => setNewLink({...newLink, url: e.target.value})}
              />
            </div>

            <div>
              <Label>Ação Automática</Label>
              <select
                value={newLink.action_type}
                onChange={(e) => setNewLink({...newLink, action_type: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border bg-white"
              >
                <option value="enable_basic">Habilitar Plano Básico</option>
                <option value="enable_premium">Habilitar Premium</option>
                <option value="enable_recruiter">Habilitar Recrutador</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Descrição (opcional)</Label>
            <Input
              placeholder="Ex: Link para campanha de marketing"
              value={newLink.description}
              onChange={(e) => setNewLink({...newLink, description: e.target.value})}
            />
          </div>

          <Button
            onClick={createSpecialLink}
            disabled={creating}
            className="w-full bg-[#0A66C2] hover:bg-[#004182]"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Criar Link
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <LinkIcon className="w-6 h-6 text-[#0A66C2]" />
            Links Especiais ({links.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum link especial criado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => {
                const config = actionTypeConfig[link.action_type];

                return (
                  <div
                    key={link.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      link.is_enabled
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={config.color}>
                            {config.label}
                          </Badge>
                          
                          {link.is_enabled && (
                            <Badge className="bg-green-100 text-green-700">
                              <Check className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          )}

                          {!link.is_enabled && (
                            <Badge className="bg-red-100 text-red-700">
                              <X className="w-3 h-3 mr-1" />
                              Desativado
                            </Badge>
                          )}
                        </div>

                        <div className="p-3 bg-slate-100 rounded-lg font-mono text-sm break-all">
                          {link.url}
                        </div>

                        <div className="text-sm text-slate-600 space-y-1">
                          {link.description && <p>📝 {link.description}</p>}
                          <p>🕐 Criado: {new Date(link.created_date).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(link.url);
                            toast.success('URL copiada!');
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>

                        <Switch
                          checked={link.is_enabled}
                          onCheckedChange={() => toggleLink(link.id, link.is_enabled)}
                        />

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteLink(link.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}