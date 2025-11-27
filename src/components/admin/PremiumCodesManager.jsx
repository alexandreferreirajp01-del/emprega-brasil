import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Key, Plus, Copy, Trash2, Check, Loader2, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function PremiumCodesManager({ showToast }) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const queryClient = useQueryClient();

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['premium-codes'],
    queryFn: async () => {
      try {
        return await base44.entities.PremiumCode.list('-created_date', 500) || [];
      } catch (e) {
        console.error('Erro ao carregar códigos:', e);
        return [];
      }
    },
  });

  const createCodeMutation = useMutation({
    mutationFn: async (data) => {
      const codesToCreate = [];
      for (let i = 0; i < data.quantity; i++) {
        codesToCreate.push({
          code: generateCode(),
          is_used: false,
          notes: data.notes
        });
      }
      return base44.entities.PremiumCode.bulkCreate(codesToCreate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premium-codes'] });
      setNotes('');
      showToast?.(`${quantity} código(s) gerado(s) com sucesso!`);
    },
    onError: () => showToast?.('Erro ao gerar códigos', 'error')
  });

  const deleteCodeMutation = useMutation({
    mutationFn: (id) => base44.entities.PremiumCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premium-codes'] });
      showToast?.('Código excluído!');
    },
  });

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCodes = codes.filter(c => 
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.notes?.toLowerCase().includes(search.toLowerCase()) ||
    c.used_by?.toLowerCase().includes(search.toLowerCase())
  );

  const unusedCodes = codes.filter(c => !c.is_used);
  const usedCodes = codes.filter(c => c.is_used);

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100">Total de Códigos</p>
                <p className="text-3xl font-bold mt-1">{codes.length}</p>
              </div>
              <Key className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100">Disponíveis</p>
                <p className="text-3xl font-bold mt-1">{unusedCodes.length}</p>
              </div>
              <Check className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-100">Utilizados</p>
                <p className="text-3xl font-bold mt-1">{usedCodes.length}</p>
              </div>
              <Key className="w-10 h-10 text-slate-200 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gerar novos códigos */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#0056ff]" />
            Gerar Códigos Premium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-slate-600 mb-1 block">Quantidade</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="rounded-lg"
              />
            </div>
            <div className="flex-[2] min-w-[300px]">
              <label className="text-sm text-slate-600 mb-1 block">Observações (opcional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Campanha Black Friday"
                className="rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => createCodeMutation.mutate({ quantity, notes })}
                disabled={createCodeMutation.isPending}
                className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl h-10"
              >
                {createCodeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Gerar {quantity} Código{quantity > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de códigos */}
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Códigos Gerados</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              <AnimatePresence>
                {filteredCodes.map((code) => (
                  <motion.div
                    key={code.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      code.is_used ? 'bg-slate-100' : 'bg-green-50 border border-green-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        code.is_used ? 'bg-slate-200' : 'bg-green-100'
                      }`}>
                        <Key className={`w-5 h-5 ${code.is_used ? 'text-slate-400' : 'text-green-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <code className={`text-lg font-mono font-bold ${
                            code.is_used ? 'text-slate-400 line-through' : 'text-slate-800'
                          }`}>
                            {code.code}
                          </code>
                          <Badge className={code.is_used ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-green-700'}>
                            {code.is_used ? 'Usado' : 'Disponível'}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          {code.is_used ? (
                            <>Usado por: {code.used_by} em {new Date(code.used_at).toLocaleDateString('pt-BR')}</>
                          ) : (
                            <>Criado em: {new Date(code.created_date).toLocaleDateString('pt-BR')}</>
                          )}
                          {code.notes && <span className="ml-2 text-slate-400">• {code.notes}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!code.is_used && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(code.code)}
                          className="rounded-lg"
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCodeMutation.mutate(code.id)}
                        className="text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredCodes.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum código encontrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}