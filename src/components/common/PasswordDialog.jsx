import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import PasswordInput from "./PasswordInput";

const ADMIN_PASSWORD = "Vagas2026#";

export default function PasswordDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  masterPassword,
  title = "Confirmação Necessária",
  description = "Digite a senha de administrador para continuar"
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setLoading(true);
    setError('');
    
    const correctPassword = masterPassword || ADMIN_PASSWORD;
    setTimeout(() => {
      if (password === correctPassword) {
        onSuccess();
        setPassword('');
        onOpenChange(false);
      } else {
        setError('Senha incorreta');
      }
      setLoading(false);
    }, 100);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">{description}</p>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !password}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Verificando...
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}