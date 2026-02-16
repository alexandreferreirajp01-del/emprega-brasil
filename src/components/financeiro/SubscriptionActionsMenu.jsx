import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit2, Eye, Trash2, MoreVertical, RefreshCw, X, Lock, Unlock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function SubscriptionActionsMenu({ subscription, onEdit, onView, onRenew, onDelete }) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ ...subscription });
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewData, setRenewData] = useState({ amount: 0, days: 30 });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Garantir que todos os campos obrigatórios estão preenchidos
      const updateData = {
        user_email: editData.user_email,
        user_name: editData.user_name,
        account_type: editData.account_type || 'premium',
        status: editData.status || 'active',
        cycle: editData.cycle || 'monthly',
        amount: editData.amount || 0,
        payment_method: editData.payment_method || 'manual',
        payment_date: editData.payment_date || new Date().toISOString(),
        start_date: editData.start_date || new Date().toISOString(),
        expiration_date: editData.expiration_date,
        days_remaining: editData.days_remaining,
        notes: editData.notes,
        is_active: editData.is_active !== undefined ? editData.is_active : true,
      };

      await base44.entities.Subscription.update(subscription.id, updateData);
      setEditModalOpen(false);
      onEdit?.(updateData);
      window.location.reload();
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja deletar a assinatura de ${subscription.user_name}?`)) return;
    
    setDeleting(true);
    try {
      await base44.entities.Subscription.delete(subscription.id);
      onDelete?.(subscription);
      window.location.reload();
    } catch (error) {
      alert('Erro ao deletar: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleBlock = async () => {
    const newStatus = subscription.status === 'blocked' ? 'active' : 'blocked';
    setSaving(true);
    try {
      await base44.entities.Subscription.update(subscription.id, { status: newStatus });
      window.location.reload();
    } catch (error) {
      alert('Erro ao atualizar status: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRenew = async () => {
    if (!renewData.amount || !renewData.days) {
      alert('Preencha valor e dias para renovação');
      return;
    }

    setSaving(true);
    try {
      // Calcular nova data de vencimento
      const currentExpiration = new Date(subscription.expiration_date || new Date());
      const newExpiration = new Date(currentExpiration.getTime() + renewData.days * 24 * 60 * 60 * 1000);
      const newDaysRemaining = (subscription.days_remaining || 0) + renewData.days;

      // Atualizar assinatura
      await base44.entities.Subscription.update(subscription.id, {
        expiration_date: newExpiration.toISOString(),
        days_remaining: newDaysRemaining,
        status: 'renewing'
      });

      // Registrar na história financeira
      await base44.entities.FinancialHistory.create({
        subscription_id: subscription.id,
        user_email: subscription.user_email,
        user_name: subscription.user_name,
        event_type: 'renewal',
        amount: renewData.amount,
        cycle: subscription.cycle,
        payment_method: subscription.payment_method,
        notes: `Renovação: ${renewData.days} dias adicionados`,
        timestamp: new Date().toISOString()
      });

      setRenewModalOpen(false);
      setRenewData({ amount: 0, days: 30 });
      onRenew?.({ ...subscription, days_remaining: newDaysRemaining });
      window.location.reload();
    } catch (error) {
      alert('Erro ao renovar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onView?.(subscription)}>
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar
          </DropdownMenuItem>
          {subscription.status === 'active' && (
            <DropdownMenuItem onClick={() => setRenewModalOpen(true)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Renovar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleToggleBlock} disabled={saving}>
            {subscription.status === 'blocked' ? (
              <>
                <Unlock className="w-4 h-4 mr-2 text-green-600" />
                <span className="text-green-600">Desbloquear Acesso</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2 text-orange-600" />
                <span className="text-orange-600">Bloquear Acesso</span>
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-red-600" disabled={deleting}>
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Deletando...' : 'Deletar'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Assinatura - {editData.user_name}</DialogTitle>
            <DialogClose />
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Nome do Usuário</label>
              <Input
                value={editData.user_name}
                onChange={(e) => setEditData({ ...editData, user_name: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <Input
                value={editData.user_email}
                disabled
                className="w-full bg-slate-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Tipo de Conta</label>
              <select
                value={editData.account_type}
                onChange={(e) => setEditData({ ...editData, account_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="premium">Premium</option>
                <option value="recruiter">Recrutador</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Status</label>
              <select
                value={editData.status || 'active'}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              >
                <option value="pending">Pendente</option>
                <option value="active">Ativo</option>
                <option value="renewing">Renovando</option>
                <option value="blocked">Bloqueado</option>
                <option value="canceled">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Ciclo</label>
              <select
                value={editData.cycle}
                onChange={(e) => setEditData({ ...editData, cycle: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
                <option value="semiannual">Semestral</option>
                <option value="annual">Anual</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Valor (R$)</label>
              <Input
                type="number"
                value={editData.amount}
                onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Data de Vencimento</label>
              <Input
                type="date"
                value={editData.expiration_date?.split('T')[0]}
                onChange={(e) => setEditData({ ...editData, expiration_date: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Dias Restantes</label>
              <Input
                type="number"
                value={editData.days_remaining || 0}
                onChange={(e) => setEditData({ ...editData, days_remaining: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}