import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Database, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function AdminUtilities() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleUpdateStates = async () => {
    if (!confirm('Atualizar UF de todas as vagas antigas?')) return;
    
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await base44.functions.invoke('updateJobStates');
      setResult(response.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNoContact = async () => {
    if (!confirm('ATENÇÃO: Isso vai deletar TODAS as vagas sem informações de contato (email, telefone, site ou link). Continuar?')) return;
    
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await base44.functions.invoke('deleteJobsWithoutContact');
      setResult(response.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Configuracoes')}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-2 -ml-2">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Utilidades Admin</h1>
          <p className="text-white/70 text-sm">Ferramentas de manutenção e atualização</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Atualizar Estados (UF)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Atualiza o campo "state" de todas as vagas antigas que foram criadas antes da instalação deste campo, baseando-se na cidade.
            </p>
            <Button 
              onClick={handleUpdateStates}
              disabled={loading}
              className="w-full bg-[#0A66C2] hover:bg-[#004182]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              Atualizar Estados
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Deletar Vagas Sem Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              <strong className="text-red-600">ATENÇÃO:</strong> Deleta todas as vagas que não possuem informações de contato (email, telefone, site ou link). Esta ação é irreversível.
            </p>
            <Button 
              onClick={handleDeleteNoContact}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Deletar Vagas Sem Contato
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900">{result.message}</p>
                  {result.updated !== undefined && (
                    <div className="text-sm text-green-700 mt-2 space-y-1">
                      <p>• Atualizadas: {result.updated}</p>
                      <p>• Ignoradas: {result.skipped}</p>
                      <p>• Total: {result.total}</p>
                    </div>
                  )}
                  {result.deleted !== undefined && (
                    <div className="text-sm text-green-700 mt-2 space-y-1">
                      <p>• Deletadas: {result.deleted}</p>
                      <p>• Mantidas: {result.kept}</p>
                      <p>• Total: {result.total}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Erro</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}