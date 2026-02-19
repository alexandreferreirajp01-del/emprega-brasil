import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Link as LinkIcon, Copy, Trash2, Plus, Check, X,
  Calendar, User, Shield, Crown, Loader2, Briefcase,
  Users, TrendingUp, DollarSign, Star, Edit, RefreshCw,
  ChevronLeft
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function GerenciarAcessos() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [premiumLinkEnabled, setPremiumLinkEnabled] = useState(true);
  const [basicLinkEnabled, setBasicLinkEnabled] = useState(true);
  const [showAddAffiliate, setShowAddAffiliate] = useState(false);
  const [showEditAffiliate, setShowEditAffiliate] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [savingAffiliate, setSavingAffiliate] = useState(false);

  const [newLink, setNewLink] = useState({
    type: 'premium', notes: '', single_use: true, expires_in_days: null
  });

  const [newAffiliate, setNewAffiliate] = useState({
    user_email: '', user_name: '', commission_percent: 10, payment_info: '', notes: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      if (currentUser?.role !== 'admin' && currentUser?.subscription_type !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(currentUser);

      const [linksData, affiliatesData, usersData] = await Promise.all([
        base44.entities.AccessLink.list('-created_date', 1000),
        base44.entities.Affiliate.list('-created_date', 500),
        base44.entities.User.list('-created_date', 1000)
      ]);

      setLinks(linksData || []);
      setAffiliates(affiliatesData || []);
      setAllUsers(usersData || []);

      setPremiumLinkEnabled(localStorage.getItem('premium_link_enabled') !== 'false');
      setBasicLinkEnabled(localStorage.getItem('basic_link_enabled') !== 'false');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();

  const createAccessLink = async () => {
    setCreating(true);
    try {
      const code = generateCode();
      let expires_at = null;
      if (newLink.expires_in_days) {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(newLink.expires_in_days));
        expires_at = d.toISOString();
      }
      await base44.entities.AccessLink.create({
        code, link_type: newLink.type, is_single_use: newLink.single_use,
        notes: newLink.notes, expires_at
      });
      toast.success('Link criado!');
      setNewLink({ type: 'premium', notes: '', single_use: true, expires_in_days: null });
      loadData();
    } catch (e) {
      toast.error('Erro ao criar link');
    } finally {
      setCreating(false);
    }
  };

  const toggleLink = async (id, current) => {
    try {
      await base44.entities.AccessLink.update(id, { is_active: !current });
      toast.success(current ? 'Desativado' : 'Ativado');
      loadData();
    } catch { toast.error('Erro ao atualizar'); }
  };

  const deleteLink = async (id) => {
    if (!confirm('Excluir este link?')) return;
    try {
      await base44.entities.AccessLink.delete(id);
      toast.success('Link excluído');
      loadData();
    } catch { toast.error('Erro ao excluir'); }
  };

  const copyLink = (code) => {
    const url = `${window.location.origin}${createPageUrl('Premium')}?code=${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const copyAffiliateLink = (code) => {
    const url = `${window.location.origin}${createPageUrl('Subscription')}?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Link de afiliado copiado!');
  };

  const addAffiliate = async () => {
    if (!newAffiliate.user_email) { toast.error('Selecione um usuário'); return; }
    setSavingAffiliate(true);
    try {
      const code = 'AF' + generateCode().slice(0, 6);
      await base44.entities.Affiliate.create({
        ...newAffiliate,
        affiliate_code: code,
        status: 'active',
        total_referrals: 0, total_conversions: 0, total_earned: 0, total_paid: 0
      });
      toast.success('Afiliado adicionado!');
      setShowAddAffiliate(false);
      setNewAffiliate({ user_email: '', user_name: '', commission_percent: 10, payment_info: '', notes: '' });
      setUserSearch('');
      loadData();
    } catch (e) {
      toast.error('Erro ao adicionar afiliado');
    } finally {
      setSavingAffiliate(false);
    }
  };

  const updateAffiliate = async () => {
    if (!selectedAffiliate) return;
    setSavingAffiliate(true);
    try {
      await base44.entities.Affiliate.update(selectedAffiliate.id, selectedAffiliate);
      toast.success('Afiliado atualizado!');
      setShowEditAffiliate(false);
      setSelectedAffiliate(null);
      loadData();
    } catch {
      toast.error('Erro ao atualizar');
    } finally {
      setSavingAffiliate(false);
    }
  };

  const deleteAffiliate = async (id) => {
    if (!confirm('Remover este afiliado?')) return;
    try {
      await base44.entities.Affiliate.delete(id);
      toast.success('Afiliado removido');
      loadData();
    } catch { toast.error('Erro ao remover'); }
  };

  const premiumMainLink = `${window.location.origin}${createPageUrl('Premium')}?status=success`;
  const basicMainLink = 'https://empregabrasil.site/home';

  const linkTypeConfig = {
    premium: { label: 'Premium', color: 'bg-yellow-100 text-yellow-700', icon: Crown },
    recruiter: { label: 'Recrutador', color: 'bg-blue-100 text-blue-700', icon: Shield },
    admin: { label: 'Admin', color: 'bg-red-100 text-red-700', icon: User }
  };

  const filteredUsers = allUsers.filter(u =>
    (u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
     u.email?.toLowerCase().includes(userSearch.toLowerCase())) &&
    !affiliates.find(a => a.user_email === u.email)
  );

  const totalEarned = affiliates.reduce((s, a) => s + (a.total_earned || 0), 0);
  const totalPaid = affiliates.reduce((s, a) => s + (a.total_paid || 0), 0);
  const totalConversions = affiliates.reduce((s, a) => s + (a.total_conversions || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Gerenciar Acessos</h1>
          <p className="text-sm text-slate-500">Links de acesso e programa de afiliados</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData} className="ml-auto">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="links">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="links" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" /> Links de Acesso
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Afiliados
          </TabsTrigger>
        </TabsList>

        {/* ===== ABA LINKS ===== */}
        <TabsContent value="links" className="space-y-4 mt-4">
          {/* Link Premium */}
          <Card className="border-2 border-yellow-400">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Link Premium Principal
                </div>
                <Switch checked={premiumLinkEnabled} onCheckedChange={() => {
                  const v = !premiumLinkEnabled;
                  setPremiumLinkEnabled(v);
                  localStorage.setItem('premium_link_enabled', v.toString());
                  toast.success(v ? 'Ativado' : 'Desativado');
                }} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                <code className="text-xs flex-1 break-all text-slate-700">{premiumMainLink}</code>
                <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                  onClick={() => { navigator.clipboard.writeText(premiumMainLink); toast.success('Copiado!'); }}
                  disabled={!premiumLinkEnabled}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Link Básico */}
          <Card className="border-2 border-blue-400">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  Link Básico Principal
                </div>
                <Switch checked={basicLinkEnabled} onCheckedChange={() => {
                  const v = !basicLinkEnabled;
                  setBasicLinkEnabled(v);
                  localStorage.setItem('basic_link_enabled', v.toString());
                  toast.success(v ? 'Ativado' : 'Desativado');
                }} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                <code className="text-xs flex-1 break-all text-slate-700">{basicMainLink}</code>
                <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                  onClick={() => { navigator.clipboard.writeText(basicMainLink); toast.success('Copiado!'); }}
                  disabled={!basicLinkEnabled}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Criar Link */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0A66C2]" /> Criar Novo Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <select value={newLink.type} onChange={e => setNewLink({...newLink, type: e.target.value})}
                    className="w-full h-9 px-2 text-sm rounded-lg border bg-white mt-1">
                    <option value="premium">Premium</option>
                    <option value="recruiter">Recrutador</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Expiração (dias)</Label>
                  <Input type="number" placeholder="Sem expiração" className="h-9 text-sm mt-1"
                    value={newLink.expires_in_days || ''}
                    onChange={e => setNewLink({...newLink, expires_in_days: e.target.value})} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newLink.single_use}
                  onCheckedChange={v => setNewLink({...newLink, single_use: v})} />
                <Label className="text-sm">Uso único</Label>
              </div>
              <Textarea placeholder="Observações..." rows={2} className="text-sm"
                value={newLink.notes} onChange={e => setNewLink({...newLink, notes: e.target.value})} />
              <Button onClick={createAccessLink} disabled={creating} className="w-full bg-[#0A66C2] hover:bg-[#004182]">
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Gerar Link
              </Button>
            </CardContent>
          </Card>

          {/* Lista */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="w-5 h-5" /> Links ({links.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {links.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">Nenhum link criado</p>
              ) : (
                <div className="space-y-3">
                  {links.map((link) => {
                    const cfg = linkTypeConfig[link.link_type] || linkTypeConfig.premium;
                    const Icon = cfg.icon;
                    const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
                    const isUsed = link.used_by && link.is_single_use;
                    const inactive = !link.is_active || isExpired || isUsed;
                    return (
                      <div key={link.id} className={`p-3 rounded-xl border ${inactive ? 'opacity-60 bg-slate-50' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-1 mb-2">
                              <Badge className={cfg.color + ' text-xs'}>
                                <Icon className="w-3 h-3 mr-1" />{cfg.label}
                              </Badge>
                              {link.is_single_use && <Badge variant="outline" className="text-xs">Uso Único</Badge>}
                              {link.is_active && !isExpired && !isUsed && <Badge className="bg-green-100 text-green-700 text-xs">Ativo</Badge>}
                              {!link.is_active && <Badge className="bg-red-100 text-red-700 text-xs">Desativado</Badge>}
                              {isExpired && <Badge className="bg-orange-100 text-orange-700 text-xs">Expirado</Badge>}
                              {isUsed && <Badge className="bg-purple-100 text-purple-700 text-xs">Usado</Badge>}
                            </div>
                            <div className="p-2 bg-slate-100 rounded text-xs font-mono break-all">
                              {window.location.origin}{createPageUrl('Premium')}?code={link.code}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                              {link.notes && <p>📝 {link.notes}</p>}
                              {link.expires_at && <p>⏰ Expira: {new Date(link.expires_at).toLocaleDateString('pt-BR')}</p>}
                              {link.used_by && <p>✅ Usado: {link.used_by}</p>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <Button variant="outline" size="icon" className="h-7 w-7"
                              onClick={() => copyLink(link.code)} disabled={inactive}>
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Switch checked={link.is_active}
                              onCheckedChange={() => toggleLink(link.id, link.is_active)}
                              disabled={isExpired || isUsed} className="scale-75" />
                            <Button variant="outline" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-50"
                              onClick={() => deleteLink(link.id)}>
                              <Trash2 className="w-3 h-3" />
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
        </TabsContent>

        {/* ===== ABA AFILIADOS ===== */}
        <TabsContent value="affiliates" className="space-y-4 mt-4">
          {/* Cards de resumo */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 bg-blue-50">
              <CardContent className="p-3 text-center">
                <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-blue-700">{affiliates.filter(a => a.status === 'active').length}</p>
                <p className="text-xs text-blue-600">Ativos</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-green-50">
              <CardContent className="p-3 text-center">
                <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-green-700">{totalConversions}</p>
                <p className="text-xs text-green-600">Vendas</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-yellow-50">
              <CardContent className="p-3 text-center">
                <DollarSign className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-yellow-700">R${(totalEarned - totalPaid).toFixed(0)}</p>
                <p className="text-xs text-yellow-600">A Pagar</p>
              </CardContent>
            </Card>
          </div>

          {/* Botão adicionar */}
          <Button onClick={() => setShowAddAffiliate(true)} className="w-full bg-[#0A66C2] hover:bg-[#004182]">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Afiliado
          </Button>

          {/* Lista de afiliados */}
          {affiliates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 text-sm">Nenhum afiliado cadastrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {affiliates.map((aff) => (
                <Card key={aff.id} className={`${aff.status !== 'active' ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(aff.user_name || aff.user_email || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-slate-800">{aff.user_name || aff.user_email}</p>
                          <Badge className={
                            aff.status === 'active' ? 'bg-green-100 text-green-700 text-xs' :
                            aff.status === 'suspended' ? 'bg-red-100 text-red-700 text-xs' :
                            'bg-slate-100 text-slate-700 text-xs'
                          }>
                            {aff.status === 'active' ? 'Ativo' : aff.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            <Star className="w-2.5 h-2.5 mr-1" />{aff.commission_percent}% comissão
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{aff.user_email}</p>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="bg-slate-50 rounded p-1.5 text-center">
                            <p className="text-xs font-bold text-slate-700">{aff.total_referrals || 0}</p>
                            <p className="text-[10px] text-slate-500">Indicações</p>
                          </div>
                          <div className="bg-green-50 rounded p-1.5 text-center">
                            <p className="text-xs font-bold text-green-700">{aff.total_conversions || 0}</p>
                            <p className="text-[10px] text-green-600">Vendas</p>
                          </div>
                          <div className="bg-yellow-50 rounded p-1.5 text-center">
                            <p className="text-xs font-bold text-yellow-700">R${((aff.total_earned || 0) - (aff.total_paid || 0)).toFixed(0)}</p>
                            <p className="text-[10px] text-yellow-600">A Pagar</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 p-2 bg-slate-50 rounded">
                          <code className="text-[10px] text-slate-600 flex-1 break-all">
                            {window.location.origin}{createPageUrl('Subscription')}?ref={aff.affiliate_code}
                          </code>
                          <Button variant="ghost" size="icon" className="h-6 w-6"
                            onClick={() => copyAffiliateLink(aff.affiliate_code)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7"
                          onClick={() => { setSelectedAffiliate({...aff}); setShowEditAffiliate(true); }}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-50"
                          onClick={() => deleteAffiliate(aff.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Adicionar Afiliado */}
      <Dialog open={showAddAffiliate} onOpenChange={setShowAddAffiliate}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Afiliado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Buscar usuário</Label>
              <Input placeholder="Nome ou email..." className="mt-1"
                value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            </div>
            {userSearch && (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {filteredUsers.slice(0, 20).map(u => (
                  <button key={u.id}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-0 flex items-center gap-2 ${newAffiliate.user_email === u.email ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      setNewAffiliate(prev => ({...prev, user_email: u.email, user_name: u.full_name || u.email}));
                      setUserSearch(u.full_name || u.email);
                    }}>
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                      {(u.full_name || u.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{u.full_name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    {newAffiliate.user_email === u.email && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-slate-500 text-sm py-4">Nenhum usuário encontrado</p>
                )}
              </div>
            )}
            {newAffiliate.user_email && (
              <div className="p-2 bg-blue-50 rounded-lg text-sm text-blue-700">
                ✅ Selecionado: <strong>{newAffiliate.user_name}</strong>
              </div>
            )}
            <div>
              <Label className="text-sm">Comissão (%)</Label>
              <Input type="number" min={1} max={100} className="mt-1"
                value={newAffiliate.commission_percent}
                onChange={e => setNewAffiliate(prev => ({...prev, commission_percent: parseFloat(e.target.value) || 10}))} />
            </div>
            <div>
              <Label className="text-sm">Dados para pagamento</Label>
              <Input placeholder="PIX, banco, conta..." className="mt-1"
                value={newAffiliate.payment_info}
                onChange={e => setNewAffiliate(prev => ({...prev, payment_info: e.target.value}))} />
            </div>
            <div>
              <Label className="text-sm">Observações</Label>
              <Textarea rows={2} className="mt-1 text-sm"
                value={newAffiliate.notes}
                onChange={e => setNewAffiliate(prev => ({...prev, notes: e.target.value}))} />
            </div>
            <Button onClick={addAffiliate} disabled={savingAffiliate || !newAffiliate.user_email}
              className="w-full bg-[#0A66C2] hover:bg-[#004182]">
              {savingAffiliate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Adicionar Afiliado
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Afiliado */}
      <Dialog open={showEditAffiliate} onOpenChange={setShowEditAffiliate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Afiliado</DialogTitle>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Afiliado</Label>
                <p className="text-sm font-medium mt-1 p-2 bg-slate-50 rounded">{selectedAffiliate.user_name} — {selectedAffiliate.user_email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Comissão (%)</Label>
                  <Input type="number" min={1} max={100} className="mt-1"
                    value={selectedAffiliate.commission_percent}
                    onChange={e => setSelectedAffiliate(prev => ({...prev, commission_percent: parseFloat(e.target.value)}))} />
                </div>
                <div>
                  <Label className="text-sm">Status</Label>
                  <select className="w-full h-9 px-2 text-sm rounded-lg border bg-white mt-1"
                    value={selectedAffiliate.status}
                    onChange={e => setSelectedAffiliate(prev => ({...prev, status: e.target.value}))}>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="suspended">Suspenso</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Total Ganho (R$)</Label>
                  <Input type="number" className="mt-1"
                    value={selectedAffiliate.total_earned}
                    onChange={e => setSelectedAffiliate(prev => ({...prev, total_earned: parseFloat(e.target.value) || 0}))} />
                </div>
                <div>
                  <Label className="text-sm">Total Pago (R$)</Label>
                  <Input type="number" className="mt-1"
                    value={selectedAffiliate.total_paid}
                    onChange={e => setSelectedAffiliate(prev => ({...prev, total_paid: parseFloat(e.target.value) || 0}))} />
                </div>
              </div>
              <div>
                <Label className="text-sm">Dados para pagamento</Label>
                <Input className="mt-1"
                  value={selectedAffiliate.payment_info || ''}
                  onChange={e => setSelectedAffiliate(prev => ({...prev, payment_info: e.target.value}))} />
              </div>
              <div>
                <Label className="text-sm">Observações</Label>
                <Textarea rows={2} className="mt-1 text-sm"
                  value={selectedAffiliate.notes || ''}
                  onChange={e => setSelectedAffiliate(prev => ({...prev, notes: e.target.value}))} />
              </div>
              <Button onClick={updateAffiliate} disabled={savingAffiliate} className="w-full bg-[#0A66C2] hover:bg-[#004182]">
                {savingAffiliate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}