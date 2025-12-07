import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import PasswordDialog from "@/components/common/PasswordDialog";

const MASTER_PASSWORD = "Alex2026$";

export default function UserEditDialog({ user, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMasterDialog, setShowMasterDialog] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || 'PB',
        password: user.password || '',
        subscription_type: user.subscription_type || 'basic',
        access_status: user.access_status || 'approved'
      });
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = () => {
    setShowMasterDialog(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      await base44.asServiceRole.entities.User.update(user.id, formData);
      toast.success('Usuário atualizado com sucesso!');
      if (onSave) onSave();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
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