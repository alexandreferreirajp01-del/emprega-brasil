import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import {
  X, Search, Users, Check, ChevronRight, ChevronLeft, Send,
  Paperclip, Link2, Image, Trash2, Loader2, CheckCircle,
  AlertCircle, FileText, User, MessageSquare, Eye
} from 'lucide-react';

// ─── Step 1: Seleção de Usuários ─────────────────────────────────────────────
function StepSelectUsers({ users, selected, onToggle, onSelectAll, onClearAll, onNext }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || u.subscription_type === typeFilter || (!u.subscription_type && typeFilter === 'basic');
    return matchSearch && matchType;
  });

  const typeOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'basic', label: 'Básico' },
    { value: 'premium', label: 'Premium' },
    { value: 'recruiter', label: 'Recrutador' },
    { value: 'admin', label: 'Admin' },
  ];

  const isAllFilteredSelected = filtered.length > 0 && filtered.every(u => selected.has(u.id));

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {typeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                typeFilter === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} usuários visíveis • <strong className="text-indigo-600">{selected.size} selecionados</strong></span>
          <div className="flex gap-3">
            <button
              onClick={() => isAllFilteredSelected ? filtered.forEach(u => onToggle(u, false)) : filtered.forEach(u => onToggle(u, true))}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {isAllFilteredSelected ? 'Desmarcar visíveis' : 'Selecionar visíveis'}
            </button>
            {selected.size > 0 && (
              <button onClick={onClearAll} className="text-red-500 font-semibold hover:underline">Limpar</button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-slate-700">
            {filtered.map(u => {
              const isSelected = selected.has(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => onToggle(u, !isSelected)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    {u.profile_photo ? (
                      <AvatarImage src={u.profile_photo} alt={u.full_name} />
                    ) : (
                      <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                        {u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{u.full_name || 'Sem nome'}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <Badge className="text-[10px] px-1.5 flex-shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {u.subscription_type || 'basic'}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        <Button
          onClick={onNext}
          disabled={selected.size === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          Próximo: Compor Mensagem
          <ChevronRight className="w-4 h-4" />
        </Button>
        {selected.size === 0 && (
          <p className="text-xs text-slate-400 text-center mt-2">Selecione ao menos 1 usuário</p>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Compor Mensagem ──────────────────────────────────────────────────
function StepCompose({ message, setMessage, attachments, setAttachments, onNext, onBack }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return {
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: file_url,
            name: file.name,
            size: file.size,
          };
        })
      );
      setAttachments(prev => [...prev, ...uploaded]);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    setAttachments(prev => [...prev, { type: 'link', url: finalUrl, name: finalUrl }]);
    setLinkInput('');
    setShowLinkInput(false);
  };

  const removeAttachment = (i) => setAttachments(prev => prev.filter((_, idx) => idx !== i));

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
            Mensagem *
          </label>
          <textarea
            className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 min-h-[180px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder-slate-400"
            placeholder="Escreva sua mensagem aqui...

Você pode usar múltiplos parágrafos, incluir informações importantes, dicas, avisos, etc."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-400">Markdown é suportado</span>
            <span className={`text-xs ${message.length > 2000 ? 'text-red-500' : 'text-slate-400'}`}>
              {message.length}/2000
            </span>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
            Anexos ({attachments.length})
          </label>

          {attachments.length > 0 && (
            <div className="space-y-2 mb-3">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                    {att.type === 'image' ? (
                      <Image className="w-4 h-4 text-indigo-600" />
                    ) : att.type === 'link' ? (
                      <Link2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  {att.type === 'image' && (
                    <img src={att.url} alt={att.name} className="w-12 h-8 object-cover rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-white truncate">{att.name}</p>
                    {att.size && <p className="text-[10px] text-slate-400">{formatSize(att.size)}</p>}
                    {att.type === 'link' && <p className="text-[10px] text-blue-500 truncate">{att.url}</p>}
                  </div>
                  <button onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.zip"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
              {uploading ? 'Enviando...' : 'Arquivo / Foto'}
            </button>
            <button
              onClick={() => setShowLinkInput(!showLinkInput)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              Link
            </button>
          </div>

          {showLinkInput && (
            <div className="mt-2 flex gap-2">
              <Input
                className="flex-1 h-9 text-sm rounded-xl"
                placeholder="https://..."
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addLink()}
              />
              <Button size="sm" onClick={addLink} disabled={!linkInput.trim()} className="bg-indigo-600 text-white h-9">
                Adicionar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowLinkInput(false); setLinkInput(''); }} className="h-9">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2 flex-shrink-0">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={!message.trim() || message.length > 2000}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          Revisar e Enviar
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Resumo + Confirmação ────────────────────────────────────────────
function StepConfirm({ selectedUsers, message, attachments, sending, results, onSend, onBack, onClose }) {
  if (results) {
    const successCount = results.filter(r => r.ok).length;
    const failCount = results.filter(r => !r.ok).length;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${failCount === 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
          {failCount === 0
            ? <CheckCircle className="w-10 h-10 text-green-500" />
            : <AlertCircle className="w-10 h-10 text-amber-500" />
          }
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          {failCount === 0 ? 'Mensagens enviadas!' : 'Envio concluído com avisos'}
        </h3>
        <p className="text-slate-500 mb-6 text-sm">
          <span className="text-green-600 font-bold">{successCount} enviadas</span>
          {failCount > 0 && <> · <span className="text-red-500 font-bold">{failCount} falhas</span></>}
        </p>
        {failCount > 0 && (
          <div className="w-full bg-red-50 dark:bg-red-900/20 rounded-xl p-3 mb-4 text-left">
            <p className="text-xs font-bold text-red-600 mb-2">Falhas:</p>
            {results.filter(r => !r.ok).map((r, i) => (
              <p key={i} className="text-xs text-red-500 truncate">{r.email}: {r.error}</p>
            ))}
          </div>
        )}
        <Button onClick={onClose} className="bg-indigo-600 text-white w-full">Fechar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary header */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
          <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" /> Resumo do Envio
          </h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
              <p className="text-2xl font-bold text-indigo-600">{selectedUsers.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Destinatários</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
              <p className="text-2xl font-bold text-slate-700 dark:text-white">{message.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Caracteres</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600">{attachments.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Anexos</p>
            </div>
          </div>
        </div>

        {/* Message preview */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Preview da Mensagem</p>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-3 max-h-40 overflow-y-auto">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{message}</p>
          </div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Anexos</p>
            <div className="space-y-1.5">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                  {att.type === 'image' ? <Image className="w-3.5 h-3.5 text-indigo-500" /> : att.type === 'link' ? <Link2 className="w-3.5 h-3.5 text-blue-500" /> : <FileText className="w-3.5 h-3.5 text-slate-500" />}
                  <span className="truncate">{att.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recipients list */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Destinatários ({selectedUsers.length})</p>
          <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-slate-200 dark:border-slate-600 p-2 bg-slate-50 dark:bg-slate-800">
            {selectedUsers.map(u => (
              <div key={u.id} className="flex items-center gap-2">
                <Avatar className="w-7 h-7 flex-shrink-0">
                  {u.profile_photo
                    ? <AvatarImage src={u.profile_photo} />
                    : <AvatarFallback className="text-[10px] bg-slate-200">{u.full_name?.[0] || '?'}</AvatarFallback>
                  }
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700 dark:text-white truncate">{u.full_name || 'Sem nome'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 flex gap-2 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Esta ação enviará mensagem interna + email para <strong>{selectedUsers.length} usuário(s)</strong>. Não pode ser desfeita.</span>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2 flex-shrink-0">
        <Button variant="outline" onClick={onBack} disabled={sending} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button
          onClick={onSend}
          disabled={sending}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          {sending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
            : <><Send className="w-4 h-4" /> Confirmar e Enviar</>
          }
        </Button>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
const STEPS = ['Destinatários', 'Mensagem', 'Confirmar'];

export default function BulkMessageWizard({ users = [], onClose }) {
  const [step, setStep] = useState(0);
  const [selectedMap, setSelectedMap] = useState(new Map()); // id -> user
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  const selectedSet = new Set(selectedMap.keys());
  const selectedUsers = Array.from(selectedMap.values());

  const toggleUser = (u, add) => {
    setSelectedMap(prev => {
      const next = new Map(prev);
      if (add) next.set(u.id, u);
      else next.delete(u.id);
      return next;
    });
  };

  const clearAll = () => setSelectedMap(new Map());

  const handleSend = async () => {
    setSending(true);
    const sendResults = [];
    const conversa_id_base = `admin_broadcast_${Date.now()}`;

    for (const u of selectedUsers) {
      try {
        // 1. Notificação interna
        await base44.entities.Notification.create({
          title: '📨 Mensagem do Administrador',
          message: message.slice(0, 200) + (message.length > 200 ? '...' : ''),
          type: 'admin',
          user_email: u.email,
          sent_to_all: false,
          redirect_page: 'Mensagens',
        });

        // 2. Mensagem direta
        const conversa_id = [u.email, 'admin'].sort().join('__');
        await base44.entities.MensagemDireta.create({
          conversa_id,
          remetente_email: 'admin',
          remetente_nome: 'Administrador',
          destinatario_email: u.email,
          destinatario_nome: u.full_name || 'Usuário',
          conteudo: message + (attachments.length > 0
            ? '\n\n📎 Anexos:\n' + attachments.map(a => `• ${a.name}: ${a.url}`).join('\n')
            : ''),
          lida: false,
          message_type: 'direct',
        });

        // 3. Email via backend
        await base44.functions.invoke('sendAdminMessage', {
          targetEmail: u.email,
          targetName: u.full_name || 'Usuário',
          messageContent: message,
          attachments: attachments.map(a => ({ type: a.type, url: a.url, name: a.name })),
        });

        sendResults.push({ email: u.email, ok: true });
      } catch (err) {
        console.error(`Erro ao enviar para ${u.email}:`, err);
        sendResults.push({ email: u.email, ok: false, error: err.message || 'Erro desconhecido' });
      }
    }

    setSending(false);
    setResults(sendResults);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-white" />
          <div>
            <h2 className="text-white font-bold text-sm">Enviar Mensagem em Massa</h2>
            <p className="text-white/70 text-[11px]">{selectedUsers.length} selecionado(s)</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Steps indicator */}
      {!results && (
        <div className="flex border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          {STEPS.map((label, i) => (
            <div
              key={i}
              className={`flex-1 py-2.5 text-center text-xs font-semibold border-b-2 transition-colors ${
                i === step
                  ? 'border-indigo-600 text-indigo-600'
                  : i < step
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] mr-1.5 ${
                i < step ? 'bg-green-100 text-green-600' : i === step ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        {step === 0 && (
          <StepSelectUsers
            users={users}
            selected={selectedSet}
            onToggle={toggleUser}
            onSelectAll={() => users.forEach(u => toggleUser(u, true))}
            onClearAll={clearAll}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepCompose
            message={message}
            setMessage={setMessage}
            attachments={attachments}
            setAttachments={setAttachments}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepConfirm
            selectedUsers={selectedUsers}
            message={message}
            attachments={attachments}
            sending={sending}
            results={results}
            onSend={handleSend}
            onBack={() => setStep(1)}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}