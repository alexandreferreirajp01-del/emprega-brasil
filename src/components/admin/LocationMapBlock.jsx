import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LocationMapBlock({ formData, setFormData, showWarning = false }) {
  return (
    <Card className="rounded-xl border-2 border-blue-100 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          📍 Localização no Mapa
        </CardTitle>
        <p className="text-sm text-slate-600">Defina como sua vaga aparecerá no mapa</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle Exibir no Mapa */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
          <input
            type="checkbox"
            checked={formData.showOnMap ?? true}
            onChange={(e) => setFormData(prev => ({ ...prev, showOnMap: e.target.checked }))}
            className="w-5 h-5 text-blue-600 rounded"
          />
          <div>
            <Label className="text-sm font-medium">Exibir esta vaga no mapa</Label>
            <p className="text-xs text-slate-500">(recomendado para melhor visibilidade)</p>
          </div>
        </div>

        {formData.showOnMap && (
          <>
            {/* Tipo de Localização */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de localização</Label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-blue-300 transition-colors"
                  style={{ borderColor: (formData.locationType || 'CIDADE') === 'CIDADE' ? '#3b82f6' : '#e2e8f0' }}>
                  <input
                    type="radio"
                    name="locationType"
                    value="CIDADE"
                    checked={(formData.locationType || 'CIDADE') === 'CIDADE'}
                    onChange={(e) => setFormData(prev => ({ ...prev, locationType: e.target.value }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm">🏙️ Geral (Cidade)</div>
                    <div className="text-xs text-slate-500">Pino no centro da cidade</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-blue-300 transition-colors"
                  style={{ borderColor: formData.locationType === 'BAIRRO' ? '#3b82f6' : '#e2e8f0' }}>
                  <input
                    type="radio"
                    name="locationType"
                    value="BAIRRO"
                    checked={formData.locationType === 'BAIRRO'}
                    onChange={(e) => setFormData(prev => ({ ...prev, locationType: e.target.value }))}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">📍 Aproximada (Bairro)</div>
                    <div className="text-xs text-slate-500 mb-2">Pino no centro do bairro</div>
                    {formData.locationType === 'BAIRRO' && (
                      <Input
                        value={formData.neighborhood || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                        placeholder="Nome do bairro"
                        className="h-9 mt-1"
                      />
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-blue-300 transition-colors"
                  style={{ borderColor: formData.locationType === 'EXATA' ? '#3b82f6' : '#e2e8f0' }}>
                  <input
                    type="radio"
                    name="locationType"
                    value="EXATA"
                    checked={formData.locationType === 'EXATA'}
                    onChange={(e) => setFormData(prev => ({ ...prev, locationType: e.target.value }))}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">🎯 Exata (Endereço completo)</div>
                    <div className="text-xs text-slate-500 mb-2">Pino exato no endereço</div>
                    {formData.locationType === 'EXATA' && (
                      <Input
                        value={formData.addressText || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, addressText: e.target.value }))}
                        placeholder="Rua, número, CEP"
                        className="h-9 mt-1"
                      />
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-blue-300 transition-colors"
                  style={{ borderColor: formData.locationType === 'REMOTO' ? '#3b82f6' : '#e2e8f0' }}>
                  <input
                    type="radio"
                    name="locationType"
                    value="REMOTO"
                    checked={formData.locationType === 'REMOTO'}
                    onChange={(e) => setFormData(prev => ({ ...prev, locationType: e.target.value }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm">💻 Online / Remoto</div>
                    <div className="text-xs text-slate-500">Sem pino no mapa</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Aviso se falta informação */}
            {showWarning && (!formData.city || !formData.state) && formData.locationType !== 'REMOTO' && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-900">Atenção: Falta informação de localização</p>
                  <p className="text-orange-700 text-xs mt-1">Preencha cidade e estado para que a vaga apareça no mapa</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}