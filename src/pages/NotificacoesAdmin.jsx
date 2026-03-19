import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, Bell, BellOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const NOTIFICATION_TYPES = [
  { id: 'new_user', label: 'Novos Usuários', description: 'Notificação quando um novo usuário se registra' },
  { id: 'user_login', label: 'Logins de Usuários', description: 'Notificação quando usuários fazem login' },
  { id: 'feed_post', label: 'Posts no Feed', description: 'Notificação quando há novas postagens no Feed' },
  { id: 'feed_comment', label: 'Comentários no Feed', description: 'Notificação quando há novos comentários' },
  { id: 'occurrence', label: 'Ocorrências', description: 'Notificação quando vagas são reportadas' },
  { id: 'chat_message', label: 'Mensagens no Chat', description: 'Notificação quando há mensagens no suporte' },
];

export default function NotificacoesAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                       user.subscription_type === 'admin' || 
                       user.role === 'admin';
        
        if (!isAdmin) {
          window.location.href = createPageUrl('Home');
          return;
        }

        // Carregar configurações salvas
        const saved = localStorage.getItem('admin_notifications_settings');
        if (saved) {
          setSettings(JSON.parse(saved));
        } else {
          // Inicializar com todas as notificações ativadas
          const initial = {};
          NOTIFICATION_TYPES.forEach(type => {
            initial[type.id] = true;
          });
          setSettings(initial);
        }
      } catch (error) {
        window.location.href = createPageUrl('Splash');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleToggle = (id) => {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem('admin_notifications_settings', JSON.stringify(settings));
    toast.success('Configurações salvas!');
    setTimeout(() => {
      setSaving(false);
    }, 500);
  };

  const enableAll = () => {
    const allEnabled = {};
    NOTIFICATION_TYPES.forEach(type => {
      allEnabled[type.id] = true;
    });
    setSettings(allEnabled);
  };

  const disableAll = () => {
    const allDisabled = {};
    NOTIFICATION_TYPES.forEach(type => {
      allDisabled[type.id] = false;
    });
    setSettings(allDisabled);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeCount = Object.values(settings).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 dark:from-slate-800 dark:to-slate-900 pt-6 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Notificações de Admin</h1>
          <p className="text-white/80 text-sm mt-1">Configure quais notificações você deseja receber no sininho</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Status Card */}
        <Card className="dark:bg-slate-800 dark:border-slate-700 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  activeCount > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  {activeCount > 0 ? (
                    <Bell className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <BellOff className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {activeCount} de {NOTIFICATION_TYPES.length} ativas
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {activeCount === 0 ? 'Nenhuma notificação ativa' : 
                     activeCount === NOTIFICATION_TYPES.length ? 'Todas as notificações ativas' :
                     'Algumas notificações ativas'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={enableAll}
                  variant="outline"
                  size="sm"
                  className="dark:bg-slate-700 dark:border-slate-600"
                >
                  Ativar todas
                </Button>
                <Button
                  onClick={disableAll}
                  variant="outline"
                  size="sm"
                  className="dark:bg-slate-700 dark:border-slate-600"
                >
                  Desativar todas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="dark:bg-slate-800 dark:border-slate-700 mb-4">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Tipos de Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {NOTIFICATION_TYPES.map((type) => (
              <div 
                key={type.id} 
                className="flex items-start gap-3 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <Switch
                  checked={settings[type.id] !== false}
                  onCheckedChange={() => handleToggle(type.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-800 dark:text-white">{type.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{type.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-semibold"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}