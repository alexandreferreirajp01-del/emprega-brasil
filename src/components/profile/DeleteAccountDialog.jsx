import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function DeleteAccountDialog({ isOpen, onClose, user }) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    
    if (confirmEmail !== user?.email) {
      setError('Email não corresponde. Digite exatamente: ' + user?.email);
      return;
    }

    const finalConfirm = window.confirm(
      '⚠️ ÚLTIMA CONFIRMAÇÃO\n\n' +
      'Você tem CERTEZA ABSOLUTA que deseja deletar sua conta?\n\n' +
      'Esta ação é IRREVERSÍVEL e você perderá:\n' +
      '• Todos os seus dados\n' +
      '• Seu histórico de vagas\n' +
      '• Seus favoritos\n' +
      '• Sua assinatura premium (se houver)\n\n' +
      'Digite OK para confirmar'
    );

    if (!finalConfirm) return;

    setIsDeleting(true);
    try {
      const response = await base44.functions.invoke('deleteUserAccount', {
        confirmEmail: confirmEmail
      });

      if (response.data.success) {
        alert('✅ Sua conta foi deletada com sucesso. Você será redirecionado.');
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = createPageUrl('Splash');
      } else {
        setError(response.data.error || 'Erro ao deletar conta');
      }
    } catch (err) {
      setError('Erro ao deletar conta: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl text-red-600">Deletar Conta</DialogTitle>
              <DialogDescription className="text-sm">
                Ação permanente e irreversível
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ Aviso Importante</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Todos os seus dados serão permanentemente deletados</li>
              <li>• Você perderá acesso a vagas favoritas e histórico</li>
              <li>• Sua assinatura premium será cancelada</li>
              <li>• Esta ação NÃO pode ser desfeita</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-email">
              Digite seu email para confirmar:
            </Label>
            <Input
              id="confirm-email"
              type="email"
              placeholder={user?.email}
              value={confirmEmail}
              onChange={(e) => {
                setConfirmEmail(e.target.value);
                setError('');
              }}
              className="h-11 rounded-xl"
              disabled={isDeleting}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 h-11 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting || confirmEmail !== user?.email}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700 rounded-xl"
            >
              {isDeleting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deletando...</>
              ) : (
                'Deletar Conta'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}