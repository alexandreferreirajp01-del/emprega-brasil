import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader2, Headphones } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FloatingSupportChat() {
  const [user, setUser] = useState(undefined); // undefined=loading, null=not logged
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isOpenRef = useRef(false);
  const conversationRef = useRef(null);

  // Keep refs in sync
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);

  // Auth check on mount
  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => setUser(null));
  }, []);

  // Auto-open from URL param (after admin notification click)
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('support') === 'open') {
      setIsOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('support');
      window.history.replaceState({}, '', url.toString());
    }
  }, [user]);

  // Open via custom event (from SupportButton in footer)
  useEffect(() => {
    const handler = () => { setIsOpen(true); setUnreadCount(0); };
    window.addEventListener('open_support_chat', handler);
    return () => window.removeEventListener('open_support_chat', handler);
  }, []);

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Init conversation when chat opens
  useEffect(() => {
    if (!isOpen || !user || conversation || initializing) return;

    const init = async () => {
      setInitializing(true);
      try {
        const { data } = await base44.functions.invoke('supportSystem', {
          action: 'get_or_create_conversation',
        });

        const conv = data.conversation;
        setConversation(conv);

        // Load existing messages
        const msgs = await base44.entities.SupportMessage.filter(
          { conversation_id: conv.id },
          'created_date',
          200
        );
        setMessages(msgs || []);

        // Mark as read if there were unread messages
        if (conv.unread_user > 0) {
          setUnreadCount(0);
          base44.functions.invoke('supportSystem', {
            action: 'mark_read_by_user',
            conversation_id: conv.id,
          }).catch(() => {});
        }
      } catch (e) {
        console.error('Support chat init error:', e);
      } finally {
        setInitializing(false);
      }
    };

    init();
  }, [isOpen, user, conversation, initializing]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversation?.id || !user) return;

    const unsubscribe = base44.entities.SupportMessage.subscribe((event) => {
      if (event.data?.conversation_id !== conversation.id) return;

      if (event.type === 'create') {
        setMessages(prev => {
          // Replace matching optimistic (temp) message
          const tempIdx = prev.findIndex(m =>
            m.id?.startsWith('temp_') &&
            m.message === event.data.message &&
            m.sender_role === event.data.sender_role
          );
          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = event.data;
            return updated;
          }
          // Dedup check
          if (prev.find(m => m.id === event.id)) return prev;
          return [...prev, event.data];
        });

        // Handle unread for admin messages
        if (event.data.sender_role === 'admin') {
          if (isOpenRef.current) {
            base44.functions.invoke('supportSystem', {
              action: 'mark_read_by_user',
              conversation_id: conversationRef.current?.id,
            }).catch(() => {});
          } else {
            setUnreadCount(c => c + 1);
          }
        }
      }
    });

    return unsubscribe;
  }, [conversation?.id, user]);

  // Init unread count from conversation
  useEffect(() => {
    if (!conversation || isOpen) return;
    setUnreadCount(conversation.unread_user || 0);
  }, [conversation?.id]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
    // Mark read when opening
    if (conversationRef.current?.id) {
      base44.functions.invoke('supportSystem', {
        action: 'mark_read_by_user',
        conversation_id: conversationRef.current.id,
      }).catch(() => {});
    }
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !conversation) return;

    setInput('');
    setSending(true);

    // Optimistic UI
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      conversation_id: conversation.id,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      sender_role: 'user',
      message: text,
      created_date: new Date().toISOString(),
    }]);

    try {
      await base44.functions.invoke('supportSystem', {
        action: 'send_user_message',
        conversation_id: conversation.id,
        message: text,
        current_unread_admin: conversation.unread_admin || 0,
      });
      // Update local conv ref
      setConversation(prev => prev ? { ...prev, unread_admin: (prev.unread_admin || 0) + 1 } : prev);
    } catch {
      // Rollback optimistic
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, sending, conversation, user]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Still loading auth
  if (user === undefined) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-20 right-3 md:bottom-6 md:right-6 z-[9985]">
          <button
            onClick={handleOpen}
            className="relative bg-gradient-to-br from-green-500 to-emerald-600 text-white p-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95"
            title="Falar com o Suporte"
          >
            <Headphones className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-3 md:bottom-6 md:right-6 w-[calc(100vw-24px)] md:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
          style={{ zIndex: 9985, height: 380, maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Suporte Vagas PB</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-200 rounded-full animate-pulse inline-block" />
                  <p className="text-green-100 text-xs">Estamos online</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/15 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900 overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {initializing ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-green-500" />
              </div>
            ) : !user ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-4">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                  <Headphones className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Faça login para usar o suporte</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Entre em contato com nossa equipe</p>
                  <Link
                    to={createPageUrl('Splash')}
                    className="inline-block px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-full hover:bg-green-700 transition-colors"
                  >
                    Entrar / Cadastrar
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Headphones className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Olá, {user?.full_name?.split(' ')[0] || 'usuário'}! 👋
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Como podemos ajudar você hoje?
                    </p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${msg.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender_role === 'admin' && (
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5">
                        <Headphones className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm break-words ${
                      msg.sender_role === 'user'
                        ? 'bg-green-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-600 rounded-bl-sm'
                    } ${msg.id?.startsWith('temp_') ? 'opacity-70' : ''}`}>
                      {msg.sender_role === 'admin' && (
                        <p className="text-[10px] font-bold text-green-600 dark:text-green-400 mb-1 uppercase tracking-wide">
                          {msg.sender_name}
                        </p>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-[10px] mt-1 text-right ${
                        msg.sender_role === 'user' ? 'text-green-200' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {formatTime(msg.created_date)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {user && (
            <div className="px-3 py-2.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva sua mensagem..."
                  disabled={sending || initializing || !conversation}
                  maxLength={2000}
                  className="flex-1 h-10 px-4 rounded-full text-sm border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:opacity-50 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending || !conversation}
                  className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-md active:scale-90"
                >
                  {sending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}