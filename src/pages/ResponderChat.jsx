import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Headphones, Send, Loader2, ArrowLeft, Search,
  Crown, Briefcase, User, RefreshCw, X, Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

const TYPE_BADGE = {
  basic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  premium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  recruiter: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  dono: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  visitor: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function ResponderChat() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef(null);
  const selectedIdRef = useRef(null);
  const replyInputRef = useRef(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  // Auth check
  useEffect(() => {
    base44.auth.me()
      .then(user => {
        const isAdmin = user.role === 'admin' ||
          user.subscription_type === 'admin' ||
          user.subscription_type === 'dono' ||
          user.email === 'alexandreferreirajp01@gmail.com';
        if (!isAdmin) { window.location.href = createPageUrl('Home'); return; }
        setAdminUser(user);
        setLoading(false);
      })
      .catch(() => { window.location.href = createPageUrl('Splash'); });
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const convs = await base44.entities.SupportConversation.list('-last_message_at', 300);
      setConversations(convs || []);
    } catch (e) {
      console.error('Error loading conversations:', e);
    }
  }, []);

  useEffect(() => {
    if (!adminUser) return;
    loadConversations();
  }, [adminUser, loadConversations]);

  // Real-time: conversations list
  useEffect(() => {
    if (!adminUser) return;
    const unsub = base44.entities.SupportConversation.subscribe((event) => {
      if (event.type === 'create') {
        setConversations(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setConversations(prev =>
          prev
            .map(c => c.id === event.id ? { ...c, ...event.data } : c)
            .sort((a, b) =>
              new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date)
            )
        );
      }
    });
    return unsub;
  }, [adminUser]);

  // Load messages when selecting a conversation
  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }

    const load = async () => {
      setLoadingMsgs(true);
      try {
        const msgs = await base44.entities.SupportMessage.filter(
          { conversation_id: selectedId }, 'created_date', 500
        );
        setMessages(msgs || []);
        // Mark as read
        base44.functions.invoke('supportSystem', {
          action: 'mark_read_by_admin',
          conversation_id: selectedId,
        }).catch(() => {});
        setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, unread_admin: 0 } : c));
      } catch (e) {
        console.error('Error loading messages:', e);
      } finally {
        setLoadingMsgs(false);
        setTimeout(() => replyInputRef.current?.focus(), 100);
      }
    };
    load();
  }, [selectedId]);

  // Scroll to bottom
  useEffect(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages.length]);

  // Real-time: messages
  useEffect(() => {
    if (!adminUser) return;

    const unsub = base44.entities.SupportMessage.subscribe((event) => {
      if (event.type !== 'create') return;
      const convId = event.data?.conversation_id;

      // Add to messages if conversation is open
      if (convId === selectedIdRef.current) {
        setMessages(prev => {
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
          if (prev.find(m => m.id === event.id)) return prev;
          return [...prev, event.data];
        });
        // Auto-mark as read if this conversation is selected
        if (event.data.sender_role === 'user') {
          base44.functions.invoke('supportSystem', {
            action: 'mark_read_by_admin',
            conversation_id: convId,
          }).catch(() => {});
        }
      }

      // Update conversation preview for unread (user messages only)
      if (event.data.sender_role === 'user') {
        setConversations(prev =>
          prev
            .map(c => {
              if (c.id !== convId) return c;
              return {
                ...c,
                last_message: event.data.message,
                last_message_at: event.data.created_date,
                unread_admin: c.id === selectedIdRef.current ? 0 : (c.unread_admin || 0) + 1,
              };
            })
            .sort((a, b) =>
              new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date)
            )
        );
      }
    });
    return unsub;
  }, [adminUser]);

  const handleSendReply = useCallback(async () => {
    const text = reply.trim();
    if (!text || !selectedId || sending) return;

    const selectedConv = conversations.find(c => c.id === selectedId);
    setReply('');
    setSending(true);

    // Optimistic
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      conversation_id: selectedId,
      sender_email: adminUser.email,
      sender_name: adminUser.full_name || 'Suporte',
      sender_role: 'admin',
      message: text,
      created_date: new Date().toISOString(),
    }]);

    try {
      await base44.functions.invoke('supportSystem', {
        action: 'send_admin_message',
        conversation_id: selectedId,
        message: text,
        target_user_email: selectedConv?.user_email,
        target_user_name: selectedConv?.user_name,
        current_unread_user: selectedConv?.unread_user || 0,
      });
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setReply(text);
    } finally {
      setSending(false);
      replyInputRef.current?.focus();
    }
  }, [reply, selectedId, sending, adminUser, conversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_admin || 0), 0);
  const selectedConv = conversations.find(c => c.id === selectedId);
  const filtered = conversations.filter(c =>
    c.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  const showChatPane = selectedId && isMobile;
  const showListPane = !isMobile || !selectedId;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 pt-4 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => selectedId ? setSelectedId(null) : navigate(-1)}
            className="text-white hover:bg-white/20 mb-3 -ml-2 h-9"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {selectedId && isMobile ? 'Conversas' : 'Voltar'}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Headphones className="w-6 h-6" />
                Central de Suporte
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
                {totalUnread > 0 && (
                  <span className="text-yellow-300 ml-2 font-semibold">• {totalUnread} não lida{totalUnread !== 1 ? 's' : ''}</span>
                )}
              </p>
            </div>
            <Button
              onClick={loadConversations}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 md:px-4 -mt-10">
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex"
          style={{ height: 'calc(100vh - 200px)', minHeight: 500 }}
        >
          {/* Sidebar */}
          {showListPane && (
            <div className={`flex flex-col border-r dark:border-slate-700 ${isMobile ? 'w-full' : 'w-72 flex-shrink-0'}`}>
              <div className="p-3 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar conversa..."
                    className="pl-9 h-9 rounded-full text-sm bg-white dark:bg-slate-700"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {filtered.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Headphones className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Nenhuma conversa</p>
                    <p className="text-xs mt-1">Aguardando mensagens de suporte</p>
                  </div>
                ) : (
                  filtered.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedId(conv.id)}
                      className={`w-full p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b dark:border-slate-700/50 text-left ${
                        selectedId === conv.id
                          ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500'
                          : ''
                      }`}
                    >
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarFallback className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm font-bold">
                          {conv.user_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                            {conv.user_name || conv.user_email}
                          </span>
                          {conv.unread_admin > 0 && (
                            <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                              {conv.unread_admin > 9 ? '9+' : conv.unread_admin}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {conv.last_message || 'Sem mensagens'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-[10px] px-1.5 py-0 ${TYPE_BADGE[conv.user_type] || TYPE_BADGE.visitor}`}>
                            {conv.user_type}
                          </Badge>
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {formatTime(conv.last_message_at)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </div>
          )}

          {/* Chat pane */}
          {(!isMobile || showChatPane) && (
            <div className="flex-1 flex flex-col min-w-0">
              {selectedConv ? (
                <>
                  {/* Chat header */}
                  <div className="px-4 py-3 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedId(null)}
                      className="md:hidden h-8 w-8 p-0 -ml-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarFallback className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm font-bold">
                        {selectedConv.user_name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight">
                        {selectedConv.user_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {selectedConv.user_email}
                      </p>
                    </div>
                    <Badge className={`text-[10px] flex-shrink-0 ${TYPE_BADGE[selectedConv.user_type] || TYPE_BADGE.visitor}`}>
                      {selectedConv.user_type}
                    </Badge>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`w-2 h-2 rounded-full ${selectedConv.status === 'open' ? 'bg-green-500' : selectedConv.status === 'pending_reply' ? 'bg-yellow-500' : 'bg-slate-400'}`} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{selectedConv.status}</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 space-y-2 overscroll-contain"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    {loadingMsgs ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                      </div>
                    ) : (
                      <>
                        {messages.length === 0 && (
                          <div className="text-center py-12 text-slate-400">
                            <Circle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Nenhuma mensagem ainda</p>
                          </div>
                        )}
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.sender_role === 'user' && (
                              <Avatar className="w-6 h-6 flex-shrink-0 mb-0.5">
                                <AvatarFallback className="bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                                  {selectedConv.user_name?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm break-words ${
                              msg.sender_role === 'admin'
                                ? 'bg-green-600 text-white rounded-br-sm'
                                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-600/50 rounded-bl-sm'
                            } ${msg.id?.startsWith('temp_') ? 'opacity-60' : ''}`}>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                              <p className={`text-[10px] mt-1 text-right ${
                                msg.sender_role === 'admin' ? 'text-green-200' : 'text-slate-400 dark:text-slate-500'
                              }`}>
                                {formatTime(msg.created_date)}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Reply input */}
                  <div className="px-3 py-2.5 border-t dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
                    <div className="flex gap-2 items-center">
                      <input
                        ref={replyInputRef}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                        placeholder={`Responder ${selectedConv.user_name?.split(' ')[0] || ''}...`}
                        disabled={sending}
                        maxLength={3000}
                        className="flex-1 h-10 px-4 rounded-full text-sm border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:opacity-50 transition-all"
                      />
                      <button
                        onClick={handleSendReply}
                        disabled={!reply.trim() || sending}
                        className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-md active:scale-90"
                      >
                        {sending
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Send className="w-4 h-4" />
                        }
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 ml-1">
                      ↩ Enter para enviar • Usuário receberá notificação e e-mail
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Headphones className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-lg">Central de Suporte</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Selecione uma conversa para responder
                    </p>
                    {totalUnread > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-3">
                        {totalUnread} mensagen{totalUnread !== 1 ? 's' : ''} não lida{totalUnread !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}