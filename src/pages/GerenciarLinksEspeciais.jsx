 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/src/pages/GerenciarLinksEspeciais.jsx b/src/pages/GerenciarLinksEspeciais.jsx
index 22926c13e3b7337f0ec9e1f41405af1437ab6181..542fea455e2f8dc036319e1dcbd7b9a3d0144d26 100644
--- a/src/pages/GerenciarLinksEspeciais.jsx
+++ b/src/pages/GerenciarLinksEspeciais.jsx
@@ -1,290 +1,385 @@
 import React, { useState, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Switch } from "@/components/ui/switch";
-import { 
-  Link as LinkIcon, Copy, Trash2, Plus, Check, X, Loader2, ArrowLeft
+import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
+import {
+  Link as LinkIcon, Copy, Trash2, Plus, Check, X, Loader2, ArrowLeft, Crown, Users
 } from "lucide-react";
 import { base44 } from "@/api/base44Client";
 import { toast } from "sonner";
 import { createPageUrl } from "@/utils";
 import { Link } from "react-router-dom";
 
+const DEFAULT_LINK = {
+  slug: '',
+  action_type: 'premium_trial',
+  description: '',
+  trial_days: 0,
+  trial_hours: 0,
+  trial_minutes: 0,
+};
+
 export default function GerenciarLinksEspeciais() {
-  const [user, setUser] = useState(null);
   const [links, setLinks] = useState([]);
+  const [users, setUsers] = useState([]);
   const [loading, setLoading] = useState(true);
   const [creating, setCreating] = useState(false);
-  
-  const [newLink, setNewLink] = useState({
-    url: '',
-    action_type: 'enable_basic',
-    description: ''
-  });
+  const [newLink, setNewLink] = useState(DEFAULT_LINK);
 
   useEffect(() => {
     loadData();
   }, []);
 
   const loadData = async () => {
     try {
+      setLoading(true);
       const currentUser = await base44.auth.me();
       if (currentUser?.role !== 'admin' && currentUser?.subscription_type !== 'admin') {
         window.location.href = createPageUrl('Home');
         return;
       }
-      setUser(currentUser);
 
-      const linksData = await base44.entities.SpecialLink.list('-created_date', 100);
+      const [linksData, usersData] = await Promise.all([
+        base44.entities.SpecialLink.list('-created_date', 500),
+        base44.entities.User.list('-created_date', 2000),
+      ]);
+
       setLinks(linksData || []);
+      setUsers(usersData || []);
     } catch (error) {
       console.error('Erro:', error);
       toast.error('Erro ao carregar dados');
     } finally {
       setLoading(false);
     }
   };
 
   const createSpecialLink = async () => {
-    if (!newLink.url || !newLink.action_type) {
-      toast.error('Preencha todos os campos obrigatórios');
+    const slug = (newLink.slug || '').trim().replace(/^\/+/, '');
+
+    if (!slug) {
+      toast.error('Informe o slug do link');
+      return;
+    }
+
+    const durationMinutes = (Number(newLink.trial_days) * 24 * 60) +
+      (Number(newLink.trial_hours) * 60) +
+      Number(newLink.trial_minutes);
+
+    if (durationMinutes <= 0) {
+      toast.error('Defina uma duração maior que 0 (dias/horas/minutos)');
       return;
     }
 
     setCreating(true);
     try {
       await base44.entities.SpecialLink.create({
-        url: newLink.url,
-        action_type: newLink.action_type,
+        slug,
+        url: slug, // compatibilidade com versão anterior
+        action_type: 'premium_trial',
         description: newLink.description,
-        is_enabled: true
+        trial_days: Number(newLink.trial_days) || 0,
+        trial_hours: Number(newLink.trial_hours) || 0,
+        trial_minutes: Number(newLink.trial_minutes) || 0,
+        is_enabled: true,
+        used_count: 0,
       });
 
-      toast.success('Link especial criado com sucesso!');
-      setNewLink({ url: '', action_type: 'enable_basic', description: '' });
+      toast.success('Link de teste premium criado com sucesso!');
+      setNewLink(DEFAULT_LINK);
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
-    
+
     try {
       await base44.entities.SpecialLink.delete(linkId);
       toast.success('Link excluído');
       loadData();
     } catch (error) {
       console.error('Erro:', error);
       toast.error('Erro ao excluir link');
     }
   };
 
-  const actionTypeConfig = {
-    enable_basic: { label: 'Habilitar Básico', color: 'bg-blue-100 text-blue-700' },
-    enable_premium: { label: 'Habilitar Premium', color: 'bg-yellow-100 text-yellow-700' },
-    enable_recruiter: { label: 'Habilitar Recrutador', color: 'bg-purple-100 text-purple-700' }
+  const getUsersFromLink = (link) => {
+    const linkId = link.id;
+    const slug = link.slug || link.url;
+
+    return users.filter((u) => {
+      if (u.premium_trial_link_id === linkId) return true;
+      if (u.premium_trial_link_slug && slug && u.premium_trial_link_slug === slug) return true;
+
+      const consumed = Array.isArray(u.trial_consumed_links) ? u.trial_consumed_links : [];
+      return consumed.includes(linkId);
+    });
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
-            <h1 className="text-2xl font-bold">Links Especiais</h1>
-            <p className="text-slate-500 text-sm">Gerencie links que habilitam planos automaticamente</p>
+            <h1 className="text-2xl font-bold">Links Especiais Premium</h1>
+            <p className="text-slate-500 text-sm">Crie links de teste premium com tempo limitado e monitore conversão</p>
           </div>
         </div>
       </div>
 
-      {/* Criar Novo Link */}
-      <Card>
-        <CardHeader>
-          <CardTitle className="flex items-center gap-3">
-            <Plus className="w-6 h-6 text-[#0A66C2]" />
-            Criar Novo Link Especial
-          </CardTitle>
-        </CardHeader>
-        <CardContent className="space-y-4">
-          <div className="grid md:grid-cols-2 gap-4">
-            <div>
-              <Label>URL do Link</Label>
-              <Input
-                placeholder="ex: empregabrasil.site/home"
-                value={newLink.url}
-                onChange={(e) => setNewLink({...newLink, url: e.target.value})}
-              />
-            </div>
-
-            <div>
-              <Label>Ação Automática</Label>
-              <select
-                value={newLink.action_type}
-                onChange={(e) => setNewLink({...newLink, action_type: e.target.value})}
-                className="w-full h-10 px-3 rounded-lg border bg-white"
+      <Tabs defaultValue="links">
+        <TabsList className="grid w-full grid-cols-2">
+          <TabsTrigger value="links" className="gap-2"><LinkIcon className="w-4 h-4" /> Links</TabsTrigger>
+          <TabsTrigger value="usuarios" className="gap-2"><Users className="w-4 h-4" /> Usuários por link</TabsTrigger>
+        </TabsList>
+
+        <TabsContent value="links" className="space-y-4 mt-4">
+          <Card>
+            <CardHeader>
+              <CardTitle className="flex items-center gap-3">
+                <Plus className="w-6 h-6 text-[#0A66C2]" />
+                Criar Link de Teste Premium
+              </CardTitle>
+            </CardHeader>
+            <CardContent className="space-y-4">
+              <div className="grid md:grid-cols-2 gap-4">
+                <div>
+                  <Label>Slug do Link</Label>
+                  <Input
+                    placeholder="ex: testesusuarios123"
+                    value={newLink.slug}
+                    onChange={(e) => setNewLink({ ...newLink, slug: e.target.value })}
+                  />
+                  <p className="text-xs text-slate-500 mt-1">
+                    URL final: {window.location.origin}/{newLink.slug || 'seu-slug'}
+                  </p>
+                </div>
+
+                <div>
+                  <Label>Tipo</Label>
+                  <Input value="Teste Premium temporário" disabled />
+                </div>
+              </div>
+
+              <div className="grid grid-cols-3 gap-3">
+                <div>
+                  <Label>Dias</Label>
+                  <Input type="number" min="0" value={newLink.trial_days}
+                    onChange={(e) => setNewLink({ ...newLink, trial_days: e.target.value })} />
+                </div>
+                <div>
+                  <Label>Horas</Label>
+                  <Input type="number" min="0" value={newLink.trial_hours}
+                    onChange={(e) => setNewLink({ ...newLink, trial_hours: e.target.value })} />
+                </div>
+                <div>
+                  <Label>Minutos</Label>
+                  <Input type="number" min="0" value={newLink.trial_minutes}
+                    onChange={(e) => setNewLink({ ...newLink, trial_minutes: e.target.value })} />
+                </div>
+              </div>
+
+              <div>
+                <Label>Descrição (opcional)</Label>
+                <Input
+                  placeholder="Ex: Campanha Abril - Trial Premium"
+                  value={newLink.description}
+                  onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
+                />
+              </div>
+
+              <Button
+                onClick={createSpecialLink}
+                disabled={creating}
+                className="w-full bg-[#0A66C2] hover:bg-[#004182]"
               >
-                <option value="enable_basic">Habilitar Plano Básico</option>
-                <option value="enable_premium">Habilitar Premium</option>
-                <option value="enable_recruiter">Habilitar Recrutador</option>
-              </select>
-            </div>
-          </div>
+                {creating ? (
+                  <>
+                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
+                    Criando...
+                  </>
+                ) : (
+                  <>
+                    <Plus className="w-5 h-5 mr-2" />
+                    Criar Link
+                  </>
+                )}
+              </Button>
+            </CardContent>
+          </Card>
 
-          <div>
-            <Label>Descrição (opcional)</Label>
-            <Input
-              placeholder="Ex: Link para campanha de marketing"
-              value={newLink.description}
-              onChange={(e) => setNewLink({...newLink, description: e.target.value})}
-            />
-          </div>
+          <Card>
+            <CardHeader>
+              <CardTitle className="flex items-center gap-3">
+                <Crown className="w-6 h-6 text-yellow-500" />
+                Links de Teste ({links.length})
+              </CardTitle>
+            </CardHeader>
+            <CardContent>
+              {links.length === 0 ? (
+                <div className="text-center py-12 text-slate-500">
+                  <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
+                  <p>Nenhum link de teste criado ainda</p>
+                </div>
+              ) : (
+                <div className="space-y-3">
+                  {links.map((link) => {
+                    const slug = link.slug || link.url;
+                    const fullUrl = `${window.location.origin}/${slug}`;
 
-          <Button
-            onClick={createSpecialLink}
-            disabled={creating}
-            className="w-full bg-[#0A66C2] hover:bg-[#004182]"
-          >
-            {creating ? (
-              <>
-                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
-                Criando...
-              </>
-            ) : (
-              <>
-                <Plus className="w-5 h-5 mr-2" />
-                Criar Link
-              </>
-            )}
-          </Button>
-        </CardContent>
-      </Card>
-
-      {/* Lista de Links */}
-      <Card>
-        <CardHeader>
-          <CardTitle className="flex items-center gap-3">
-            <LinkIcon className="w-6 h-6 text-[#0A66C2]" />
-            Links Especiais ({links.length})
-          </CardTitle>
-        </CardHeader>
-        <CardContent>
-          {links.length === 0 ? (
-            <div className="text-center py-12 text-slate-500">
-              <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
-              <p>Nenhum link especial criado ainda</p>
-            </div>
-          ) : (
-            <div className="space-y-3">
-              {links.map((link) => {
-                const config = actionTypeConfig[link.action_type];
-
-                return (
-                  <div
-                    key={link.id}
-                    className={`p-4 rounded-xl border-2 transition-all ${
-                      link.is_enabled
-                        ? 'bg-white border-slate-200'
-                        : 'bg-slate-50 border-slate-300 opacity-60'
-                    }`}
-                  >
-                    <div className="flex items-start justify-between gap-4">
-                      <div className="flex-1 space-y-3">
-                        <div className="flex items-center gap-3 flex-wrap">
-                          <Badge className={config.color}>
-                            {config.label}
-                          </Badge>
-                          
-                          {link.is_enabled && (
-                            <Badge className="bg-green-100 text-green-700">
-                              <Check className="w-3 h-3 mr-1" />
-                              Ativo
-                            </Badge>
-                          )}
-
-                          {!link.is_enabled && (
-                            <Badge className="bg-red-100 text-red-700">
-                              <X className="w-3 h-3 mr-1" />
-                              Desativado
-                            </Badge>
-                          )}
-                        </div>
+                    return (
+                      <div
+                        key={link.id}
+                        className={`p-4 rounded-xl border-2 transition-all ${
+                          link.is_enabled
+                            ? 'bg-white border-slate-200'
+                            : 'bg-slate-50 border-slate-300 opacity-60'
+                        }`}
+                      >
+                        <div className="flex items-start justify-between gap-4">
+                          <div className="flex-1 space-y-3">
+                            <div className="flex items-center gap-2 flex-wrap">
+                              <Badge className="bg-yellow-100 text-yellow-700">Teste Premium</Badge>
+                              <Badge className="bg-blue-100 text-blue-700">
+                                ⏱️ {Number(link.trial_days || 0)}d {Number(link.trial_hours || 0)}h {Number(link.trial_minutes || 0)}m
+                              </Badge>
+                              <Badge className="bg-slate-100 text-slate-700">👥 Usos: {Number(link.used_count || 0)}</Badge>
 
-                        <div className="p-3 bg-slate-100 rounded-lg font-mono text-sm break-all">
-                          {link.url}
-                        </div>
+                              {link.is_enabled ? (
+                                <Badge className="bg-green-100 text-green-700">
+                                  <Check className="w-3 h-3 mr-1" /> Ativo
+                                </Badge>
+                              ) : (
+                                <Badge className="bg-red-100 text-red-700">
+                                  <X className="w-3 h-3 mr-1" /> Desativado
+                                </Badge>
+                              )}
+                            </div>
+
+                            <div className="p-3 bg-slate-100 rounded-lg font-mono text-sm break-all">
+                              {fullUrl}
+                            </div>
 
-                        <div className="text-sm text-slate-600 space-y-1">
-                          {link.description && <p>📝 {link.description}</p>}
-                          <p>🕐 Criado: {new Date(link.created_date).toLocaleString('pt-BR')}</p>
+                            <div className="text-sm text-slate-600 space-y-1">
+                              {link.description && <p>📝 {link.description}</p>}
+                              <p>🕐 Criado: {new Date(link.created_date).toLocaleString('pt-BR')}</p>
+                            </div>
+                          </div>
+
+                          <div className="flex items-center gap-2">
+                            <Button
+                              variant="outline"
+                              size="sm"
+                              onClick={() => {
+                                navigator.clipboard.writeText(fullUrl);
+                                toast.success('URL copiada!');
+                              }}
+                            >
+                              <Copy className="w-4 h-4" />
+                            </Button>
+
+                            <Switch
+                              checked={!!link.is_enabled}
+                              onCheckedChange={() => toggleLink(link.id, link.is_enabled)}
+                            />
+
+                            <Button
+                              variant="outline"
+                              size="sm"
+                              onClick={() => deleteLink(link.id)}
+                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
+                            >
+                              <Trash2 className="w-4 h-4" />
+                            </Button>
+                          </div>
                         </div>
                       </div>
+                    );
+                  })}
+                </div>
+              )}
+            </CardContent>
+          </Card>
+        </TabsContent>
 
-                      <div className="flex items-center gap-2">
-                        <Button
-                          variant="outline"
-                          size="sm"
-                          onClick={() => {
-                            navigator.clipboard.writeText(link.url);
-                            toast.success('URL copiada!');
-                          }}
-                        >
-                          <Copy className="w-4 h-4" />
-                        </Button>
-
-                        <Switch
-                          checked={link.is_enabled}
-                          onCheckedChange={() => toggleLink(link.id, link.is_enabled)}
-                        />
-
-                        <Button
-                          variant="outline"
-                          size="sm"
-                          onClick={() => deleteLink(link.id)}
-                          className="text-red-600 hover:bg-red-50"
-                        >
-                          <Trash2 className="w-4 h-4" />
-                        </Button>
-                      </div>
+        <TabsContent value="usuarios" className="space-y-4 mt-4">
+          {links.map((link) => {
+            const linkUsers = getUsersFromLink(link);
+            const slug = link.slug || link.url;
+
+            return (
+              <Card key={`users-${link.id}`}>
+                <CardHeader>
+                  <CardTitle className="flex items-center justify-between">
+                    <span className="text-base font-semibold">/{slug}</span>
+                    <Badge className="bg-slate-100 text-slate-700">{linkUsers.length} usuário(s)</Badge>
+                  </CardTitle>
+                </CardHeader>
+                <CardContent>
+                  {linkUsers.length === 0 ? (
+                    <p className="text-sm text-slate-500">Nenhum usuário entrou por este link ainda.</p>
+                  ) : (
+                    <div className="space-y-2">
+                      {linkUsers.map((u) => (
+                        <div key={u.id} className="p-3 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2">
+                          <div>
+                            <p className="font-medium text-slate-800">{u.full_name || 'Sem nome'}</p>
+                            <p className="text-sm text-slate-600">{u.email}</p>
+                          </div>
+                          <div className="text-sm text-slate-600">
+                            <p>Plano atual: <strong>{u.subscription_type || 'basic'}</strong></p>
+                            {u.premium_trial_started_at && (
+                              <p>Início: {new Date(u.premium_trial_started_at).toLocaleString('pt-BR')}</p>
+                            )}
+                            {u.premium_trial_expires_at && (
+                              <p>Término: {new Date(u.premium_trial_expires_at).toLocaleString('pt-BR')}</p>
+                            )}
+                          </div>
+                        </div>
+                      ))}
                     </div>
-                  </div>
-                );
-              })}
-            </div>
-          )}
-        </CardContent>
-      </Card>
+                  )}
+                </CardContent>
+              </Card>
+            );
+          })}
+        </TabsContent>
+      </Tabs>
     </div>
   );
-}
\ No newline at end of file
+}
 
EOF
)
