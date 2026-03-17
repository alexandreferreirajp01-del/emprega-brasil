import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import PasswordDialog from "@/components/common/PasswordDialog";

const MASTER_PASSWORD = "Vagas2026#";

export default function UserEditDialog({ user, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({});
  const formDataRef = useRef({});
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMasterDialog, setShowMasterDialog] = useState(false);

  useEffect(() => {
    if (user) {
      const initial = {
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || 'PB',
        password: user.password || '',
        subscription_type: user.subscription_type || 'basic',
        access_status: user.access_status || 'approved',
        premium_tier: user.premium_tier || '',
        premium_activated_at: user.premium_activated_at ? user.premium_activated_at.slice(0, 10) : '',
        premium_expires_at: user.premium_expires_at ? user.premium_expires_at.slice(0, 10) : '',
      };
      setFormData(initial);
      formDataRef.current = initial;
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      formDataRef.current = next;
      return next;
    });
  };

  const handleSaveClick = () => {
    setShowMasterDialog(true);
  };

  const handleConfirmSave = async () => {
    setShowMasterDialog(false);
    setSaving(true);
    try {
      // Usar ref para garantir dados mais recentes (evita closure stale)
      const data = formDataRef.current;

      // Validação básica
      if (!data.full_name || data.full_name.trim().length < 3) {
        toast.error('Nome deve ter no mínimo 3 caracteres');
        setSaving(false);
        return;
      }

      if (data.password && data.password.length < 6) {
        toast.error('Senha deve ter no mínimo 6 caracteres');
        setSaving(false);
        return;
      }

      // Montar payload limpo
      const payload = { ...data };
      // Converter datas YYYY-MM-DD para ISO sem problema de timezone
      payload.premium_activated_at = payload.premium_activated_at
        ? `${payload.premium_activated_at}T12:00:00.000Z`
        : null;
      payload.premium_expires_at = payload.premium_expires_at
        ? `${payload.premium_expires_at}T12:00:00.000Z`
        : null;
      // Se não é premium, limpar tier
      if (payload.subscription_type !== 'premium') {
        payload.premium_tier = null;
        payload.premium_activated_at = null;
        payload.premium_expires_at = null;
      }
      // Remover senha se vazia
      if (!payload.password) delete payload.password;

      // Atualizar no banco
      await base44.asServiceRole.entities.User.update(user.id, payload);
      
      toast.success('✅ Usuário atualizado com sucesso!');
      if (onSave) onSave();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('❌ Erro ao atualizar usuário. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome Completo */}
            <div>
              <Label>Nome Completo</Label>
              <Input
                value={formData.full_name || ''}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Email */}
            <div>
              <Label>E-mail</Label>
              <Input
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="mt-1"
                disabled
              />
              <p className="text-xs text-slate-500 mt-1">E-mail não pode ser alterado</p>
            </div>

            {/* Telefone */}
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={formData.state || ''}
                  onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                  maxLength={2}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <Label>Senha</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password || ''}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Digite para alterar a senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            {/* Tipo de Conta */}
            <div>
              <Label>Tipo de Conta</Label>
              <select
                value={formData.subscription_type || 'basic'}
                onChange={(e) => handleChange('subscription_type', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 mt-1"
              >
                <option value="basic">Básico</option>
                <option value="premium">Premium</option>
                <option value="recruiter">Recrutador</option>
                <option value="admin">Admin</option>
                <option value="dono">Dono</option>
              </select>
            </div>

            {/* Subtipo Premium */}
            {formData.subscription_type === 'premium' && (
              <div>
                <Label>Subtipo Premium</Label>
                <select
                  value={formData.premium_tier || ''}
                  onChange={(e) => handleChange('premium_tier', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 mt-1"
                >
                  <option value="">— Selecione o tipo —</option>
                  <option value="padrao">🟡 Premium Padrão — R$27,00/mês</option>
                  <option value="select">🔵 Premium Select — R$9,90/mês</option>
                  <option value="unlimited">🟣 Premium Unlimited — R$59,00/trimestral</option>
                </select>
              </div>
            )}

            {/* Datas do Premium */}
            {formData.subscription_type === 'premium' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data de Ativação</Label>
                  <Input
                    type="date"
                    value={formData.premium_activated_at || ''}
                    onChange={(e) => handleChange('premium_activated_at', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Data de Expiração</Label>
                  <Input
                    type="date"
                    value={formData.premium_expires_at || ''}
                    onChange={(e) => handleChange('premium_expires_at', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Status de Acesso */}
            <div>
              <Label>Status de Acesso</Label>
              <select
                value={formData.access_status || 'approved'}
                onChange={(e) => handleChange('access_status', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 mt-1"
              >
                <option value="pending">Pendente</option>
                <option value="approved">Aprovado</option>
                <option value="blocked">Bloqueado</option>
              </select>
            </div>

            {/* Info do Registro */}
            <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Criado em:</strong> {new Date(user.created_date).toLocaleString('pt-BR')}</p>
              {user.updated_date && (
                <p><strong>Atualizado em:</strong> {new Date(user.updated_date).toLocaleString('pt-BR')}</p>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveClick}
              disabled={saving}
              className="flex-1 bg-[#0056ff] hover:bg-[#0044cc]"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Senha Master */}
      <PasswordDialog
        open={showMasterDialog}
        onOpenChange={setShowMasterDialog}
        onSuccess={handleConfirmSave}
        masterPassword={MASTER_PASSWORD}
        title="Confirmar Alterações"
        description="Digite a senha master para salvar as alterações"
      />
    </>
  );
}