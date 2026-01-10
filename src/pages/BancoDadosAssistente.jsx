import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Trash2, Download, MessageCircle, User, Bot, Calendar, Image as ImageIcon, File } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TimeAgo from "@/components/common/TimeAgo";

export default function BancoDadosAssistente() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['chat-history'],
    queryFn: () => base44.entities.ChatHistory.list('-created_date', 10000)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ChatHistory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-history']);
      alert('Mensagem excluída com sucesso!');
    }
  });

  // Agrupar por conversa
  const conversations = {};
  history.forEach(msg => {
    if (!conversations[msg.conversation_id]) {
      conversations[msg.conversation_id] = [];
    }
    conversations[msg.conversation_id].push(msg);
  });

  const filteredHistory = history.filter(msg => 
    msg.message_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportData = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-assistente-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 pt-6 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Banco de Dados do Assistente</h1>
              <p className="text-white/80 text-sm">Histórico completo de conversas com a IA</p>
            </div>
            <Button onClick={exportData} variant="outline" className="text-white border-white hover:bg-white/20">
              <Download className="w-4 h-4 mr-2" />Exportar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Barra de pesquisa */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por mensagem ou usuário..."
              className="pl-11 h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{history.length}</p>
                  <p className="text-sm text-slate-500">Total de Mensagens</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Object.keys(conversations).length}</p>
                  <p className="text-sm text-slate-500">Conversas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{history.filter(m => m.message_role === 'assistant').length}</p>
                  <p className="text-sm text-slate-500">Respostas da IA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de mensagens */}
        <Card className="rounded-xl">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Carregando...</div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Nenhuma mensagem encontrada</div>
            ) : (
              <div className="divide-y dark:divide-slate-700">
                {filteredHistory.map((msg) => (
                  <div key={msg.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.message_role === 'user' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {msg.message_role === 'user' ? (
                          <User className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Bot className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {msg.message_role === 'user' ? msg.user_email : 'Assistente'}
                            </span>
                            <span className="text-xs text-slate-400">
                              <TimeAgo date={msg.created_date} />
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Excluir esta mensagem?')) {
                                deleteMutation.mutate(msg.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                          {msg.message_content}
                        </p>

                        {/* Arquivos anexados */}
                        {msg.file_urls && msg.file_urls.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.file_urls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-200"
                              >
                                {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <ImageIcon className="w-3 h-3" />
                                ) : (
                                  <File className="w-3 h-3" />
                                )}
                                Arquivo {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}