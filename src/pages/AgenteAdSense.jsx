import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Bot, Loader2, Trash2, Zap, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import MessageBubble from "@/components/chat/MessageBubble";

const QUICK_PROMPTS = [
  { label: "Análise Completa", text: "Faça uma análise completa do site Vagas Abertas PB verificando todos os requisitos do Google AdSense.", icon: Zap, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "Verificar Políticas", text: "Verifique se o site atende a todas as políticas do Google AdSense e liste o que está em conformidade e o que precisa ser corrigido.", icon: CheckCircle, color: "bg-green-50 text-green-700 border-green-200" },
  { label: "Problemas Críticos", text: "Quais são os problemas mais críticos que podem impedir ou prejudicar a aprovação do AdSense no site?", icon: AlertTriangle, color: "bg-red-50 text-red-700 border-red-200" },
  { label: "Otimizar Receita", text: "Como posso otimizar os anúncios AdSense para maximizar o RPM e a receita no site de vagas de emprego?", icon: TrendingUp, color: "bg-purple-50 text-purple-700 border-purple-200" },
];

export default function AgenteAdSense() {
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const conv = await base44.agents.createConversation({
          agent_name: "adsense_specialist",
          metadata: { name: "Análise AdSense - " + new Date().toLocaleDateString('pt-BR') }
        });
        setConversation(conv);
        setMessages(conv.messages || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsubscribe;
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || sending || !conversation) return;
    setInput('');
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: msg });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const clearConversation = async () => {
    if (!confirm('Limpar conversa e iniciar nova análise?')) return;
    setLoading(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "adsense_specialist",
        metadata: { name: "Análise AdSense - " + new Date().toLocaleDateString('pt-BR') }
      });
      setConversation(conv);
      setMessages(conv.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1D2226] to-[#383E45] dark:from-slate-800 dark:to-slate-950 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Agente AdSense</h1>
                <p className="text-white/60 text-xs">Especialista em monetização Google AdSense</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10" onClick={clearConversation} title="Nova conversa">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col px-4 py-4 gap-4">
        {/* Quick Prompts */}
        {messages.length === 0 && !loading && (
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 text-center">Escolha uma análise rápida ou faça sua pergunta:</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(qp.text)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-medium transition-all hover:shadow-sm ${qp.color}`}
                >
                  <qp.icon className="w-4 h-4 flex-shrink-0" />
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <Card className="flex-1 rounded-2xl dark:bg-slate-800 border-0 shadow-lg overflow-hidden">
          <CardContent className="p-4 flex flex-col h-full min-h-[400px]">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center">
                  <Bot className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-white">Especialista AdSense pronto!</p>
                  <p className="text-sm text-slate-400 mt-1">Faça uma pergunta ou use os atalhos acima</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}
                {sending && (
                  <div className="flex gap-2 items-center text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analisando...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Faça uma pergunta sobre AdSense..."
            className="flex-1 rounded-xl h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            disabled={sending || loading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending || loading}
            className="h-12 px-4 rounded-xl bg-[#1D4371] hover:bg-[#0F2744]"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}