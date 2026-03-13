import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, CheckCircle, AlertCircle, Mail, User, Phone, MapPin, FileText, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SUBSCRIPTION_TYPES = [
  { value: 'basic', label: 'Básico', color: 'text-slate-600' },
  { value: 'premium', label: 'Premium', color: 'text-green-600' },
  { value: 'recruiter', label: 'Recrutador', color: 'text-blue-600' },
  { value: 'admin', label: 'Admin', color: 'text-purple-600' },
  { value: 'dono', label: 'Dono', color: 'text-amber-600' },
];

export default function CadastrarUsuarioModal({ open, onOpenChange, onSuccess }) {
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    phone: '',
    subscription_type: 'basic',
    city: '',
    state: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, message, action }
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'E-mail obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'E-mail inválido';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setResult(null);

    try {
      const resp = await base44.functions.invoke('adminCreateUser', {
        email: form.email.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        subscription_type: form.subscription_type,
        city: form.city.trim(),
        state: form.state.trim(),
        notes: form.notes.trim(),
      });
      const data = resp.data;
      setResult({ success: data.success, message: data.message || data.error, action: data.action });
      if (data.success) {
        onSuccess?.();
        // Limpar form após sucesso
        setTimeout(() => {
          setForm({ email: '', full_name: '', phone: '', subscription_type: 'basic', city: '', state: '', notes: '' });
          setResult(null);
        }, 3000);
      }
    } catch (err) {
      setResult({ success: false, message: err.message || 'Erro desconhecido ao processar.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-indigo-600" />
            </div>
            Cadastrar Usuário Manualmente
          </DialogTitle>
        </DialogHeader>

        {result && (
          <div className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
            result.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {result.success 
              ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            }
            <div>
              <p className="font-semibold">
                {result.action === 'created' ? 'Usuário criado!' 
                  : result.action === 'updated' ? 'Usuário atualizado!'
                  : result.action === 'invited' ? 'Convite enviado!'
                  : result.success ? 'Sucesso!' : 'Erro'}
              </p>
              <p className="text-xs mt-0.5 opacity-80">{result.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Email */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              E-mail <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="email@exemplo.com"
              className={`h-10 rounded-xl ${errors.email ? 'border-red-400' : ''}`}
              disabled={loading}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Nome Completo
            </Label>
            <Input
              value={form.full_name}
              onChange={e => handleChange('full_name', e.target.value)}
              placeholder="Nome do usuário"
              className="h-10 rounded-xl"
              disabled={loading}
            />
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              Telefone / WhatsApp
            </Label>
            <Input
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="(83) 99999-9999"
              className="h-10 rounded-xl"
              disabled={loading}
            />
          </div>

          {/* Tipo de conta */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              Tipo de Conta
            </Label>
            <Select value={form.subscription_type} onValueChange={v => handleChange('subscription_type', v)} disabled={loading}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className={t.color}>{t.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Cidade
              </Label>
              <Input
                value={form.city}
                onChange={e => handleChange('city', e.target.value)}
                placeholder="João Pessoa"
                className="h-10 rounded-xl"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Estado (UF)</Label>
              <Input
                value={form.state}
                onChange={e => handleChange('state', e.target.value.toUpperCase().slice(0,2))}
                placeholder="PB"
                maxLength={2}
                className="h-10 rounded-xl uppercase"
                disabled={loading}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Observações internas
            </Label>
            <textarea
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder="Notas para o admin (não visíveis para o usuário)..."
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">ℹ️ Como funciona:</p>
            <ul className="space-y-0.5 list-disc list-inside opacity-90">
              <li>Se o e-mail já existe, os dados são atualizados.</li>
              <li>Se é novo, um convite é enviado por e-mail.</li>
              <li>O usuário cria a própria senha no primeiro acesso.</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}