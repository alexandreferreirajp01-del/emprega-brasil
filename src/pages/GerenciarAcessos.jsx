import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Link as LinkIcon, Copy, Trash2, Plus, Check, X, 
  Calendar, User, Shield, Crown, Loader2, ExternalLink
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function GerenciarAcessos() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [premiumLinkEnabled, setPremiumLinkEnabled] = useState(true);
  
  const [newLink, setNewLink] = useState({
    type: 'premium',
    notes: '',
    single_use: true,
    expires_in_days: null
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

      const linksData = await base44.entities.AccessLink.list('-created_date', 1000);
      setLinks(linksData);

      // Carregar estado do link Premium principal
      const config = localStorage.getItem('premium_link_enabled');
      setPremiumLinkEnabled(config !== 'false');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const createAccessLink = async () => {
    setCreating(true);
    try {
      const code = generateCode();
      let expires_at = null;
      
      if (newLink.expires_in_days) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + parseInt(newLink.expires_in_days));
        expires_at = expireDate.toISOString();
      }

      await base44.entities.AccessLink.create({
        code,
        link_type: newLink.type,
        is_single_use: newLink.single_use,
        notes: newLink.notes,
        expires_at
      });

      toast.success('Link criado com sucesso!');
      setNewLink({ type: 'premium', notes: '', single_use: true, expires_in_days: null });
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
      await base44.entities.AccessLink.update(linkId, { is_active: !currentStatus });
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
      await base44.entities.AccessLink.delete(linkId);
      toast.success('Link excluído');
      loadData();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao excluir link');
    }
  };

  const copyLink = (code) => {
    const url = `${window.location.origin}${createPageUrl('Premium')}?code=${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const togglePremiumLink = () => {
    const newState = !premiumLinkEnabled;
    setPremiumLinkEnabled(newState);
    localStorage.setItem('premium_link_enabled', newState.toString());
    toast.success(newState ? 'Link Premium ativado' : 'Link Premium desativado');
  };

  const premiumMainLink = `${window.location.origin}${createPageUrl('Premium')}?status=success`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  const linkTypeConfig = {
    premium: { label: 'Premium', color: 'bg-yellow-100 text-yellow-700', icon: Crown },
    recruiter: { label: 'Recrutador', color: 'bg-blue-100 text-blue-700', icon: Shield },
    admin: { label: 'Admin', color: 'bg-red-100 text-red-700', icon: User }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Link Premium Principal */}
      <Card className="border-2 border-[#0A66C2]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-500" />
              Link Premium Principal
            </div>
            <Switch checked={premiumLinkEnabled} onCheckedChange={togglePremiumLink} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border">
            <div className="flex items-center justify-between gap-4">
              <code className="text-sm flex-1 break-all">{premiumMainLink}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(premiumMainLink);
                  toast.success('Link copiado!');
                }}
                disabled={!premiumLinkEnabled}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge className={premiumLinkEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
              {premiumLinkEnabled ? 'Ativado' : 'Desativado'}
            </Badge>
            <span className="text-slate-600">• Uso ilimitado • Não expira</span>
          </div>
        </CardContent>
      </Card>

      {/* Criar Novo Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Plus className="w-6 h-6 text-[#0A66C2]" />
            Criar Novo Link de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Acesso</Label>
              <select
                value={newLink.type}
                onChange={(e) => setNewLink({...newLink, type: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border bg-white"
              >
                <option value="premium">Premium</option>
                <option value="recruiter">Recrutador</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <Label>Expiração (dias)</Label>
              <Input
                type="number"
                placeholder="Opcional (vazio = sem expiração)"
                value={newLink.expires_in_days || ''}
                onChange={(e) => setNewLink({...newLink, expires_in_days: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={newLink.single_use}
              onCheckedChange={(checked) => setNewLink({...newLink, single_use: checked})}
            />
            <Label>Uso único (desativa após primeiro uso)</Label>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              placeholder="Ex: Link para João Silva - Cliente especial"
              value={newLink.notes}
              onChange={(e) => setNewLink({...newLink, notes: e.target.value})}
              rows={3}
            />
          </div>

          <Button
            onClick={createAccessLink}
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
                Gerar Link
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LinkIcon className="w-6 h-6 text-[#0A66C2]" />
              Links de Acesso ({links.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum link criado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => {
                const config = linkTypeConfig[link.link_type];
                const Icon = config.icon;
                const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
                const isUsed = link.used_by && link.is_single_use;

                return (
                  <div
                    key={link.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      link.is_active && !isExpired && !isUsed
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={config.color}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          
                          {link.is_single_use && (
                            <Badge variant="outline">Uso Único</Badge>
                          )}

                          {link.is_active && !isExpired && !isUsed && (
                            <Badge className="bg-green-100 text-green-700">
                              <Check className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          )}

                          {!link.is_active && (
                            <Badge className="bg-red-100 text-red-700">
                              <X className="w-3 h-3 mr-1" />
                              Desativado
                            </Badge>
                          )}

                          {isExpired && (
                            <Badge className="bg-orange-100 text-orange-700">
                              <Calendar className="w-3 h-3 mr-1" />
                              Expirado
                            </Badge>
                          )}

                          {isUsed && (
                            <Badge className="bg-purple-100 text-purple-700">
                              <User className="w-3 h-3 mr-1" />
                              Usado
                            </Badge>
                          )}
                        </div>

                        <div className="p-3 bg-slate-100 rounded-lg font-mono text-sm break-all">
                          {window.location.origin}{createPageUrl('Premium')}?code={link.code}
                        </div>

                        <div className="text-sm text-slate-600 space-y-1">
                          {link.notes && <p>📝 {link.notes}</p>}
                          {link.expires_at && (
                            <p>⏰ Expira: {new Date(link.expires_at).toLocaleDateString('pt-BR')}</p>
                          )}
                          {link.used_by && (
                            <p>✅ Usado por: {link.used_by} em {new Date(link.used_at).toLocaleString('pt-BR')}</p>
                          )}
                          <p>🕐 Criado: {new Date(link.created_date).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(link.code)}
                          disabled={!link.is_active || isExpired || isUsed}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>

                        <Switch
                          checked={link.is_active}
                          onCheckedChange={() => toggleLink(link.id, link.is_active)}
                          disabled={isExpired || isUsed}
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