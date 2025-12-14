import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Sparkles, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESET_COLORS = [
  { name: 'Azul', start: '#2563eb', end: '#1d4ed8' },
  { name: 'Roxo', start: '#9333ea', end: '#7e22ce' },
  { name: 'Verde', start: '#16a34a', end: '#15803d' },
  { name: 'Laranja', start: '#ea580c', end: '#c2410c' },
  { name: 'Vermelho', start: '#dc2626', end: '#b91c1c' },
  { name: 'Rosa', start: '#ec4899', end: '#db2777' },
  { name: 'Ciano', start: '#0891b2', end: '#0e7490' },
  { name: 'Preto', start: '#0f172a', end: '#000000' },
];

const PRESET_BADGES = [
  { name: 'Amarelo', bg: '#fbbf24', text: '#78350f' },
  { name: 'Vermelho', bg: '#ef4444', text: '#ffffff' },
  { name: 'Azul', bg: '#3b82f6', text: '#ffffff' },
  { name: 'Verde', bg: '#10b981', text: '#ffffff' },
  { name: 'Roxo', bg: '#a855f7', text: '#ffffff' },
  { name: 'Laranja', bg: '#f97316', text: '#ffffff' },
];

export default function ColorPickerModal({ isOpen, onClose, mode = 'gradient', onSave, initialColors = {}, initialColor = '#0A66C2' }) {
  const [gradientStart, setGradientStart] = useState(initialColors.gradientStart || '#2563eb');
  const [gradientEnd, setGradientEnd] = useState(initialColors.gradientEnd || '#1d4ed8');
  const [badgeBg, setBadgeBg] = useState(initialColors.badgeBg || '#fbbf24');
  const [badgeText, setBadgeText] = useState(initialColors.badgeText || '#78350f');
  const [singleColor, setSingleColor] = useState(initialColor);

  const handleSave = () => {
    if (mode === 'gradient') {
      onSave({ gradientStart, gradientEnd });
    } else if (mode === 'badge') {
      onSave({ badgeBg, badgeText });
    } else if (mode === 'single') {
      onSave(singleColor);
    }
    onClose();
  };

  const applyPresetGradient = (preset) => {
    setGradientStart(preset.start);
    setGradientEnd(preset.end);
  };

  const applyPresetBadge = (preset) => {
    setBadgeBg(preset.bg);
    setBadgeText(preset.text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            {mode === 'gradient' ? 'Escolher Cores do Gradiente' : mode === 'badge' ? 'Escolher Cores do Badge' : 'Escolher Cor'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'single' ? (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-semibold mb-3 block">Selecione a Cor</Label>
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1">
                  <HexColorPicker 
                    color={singleColor} 
                    onChange={setSingleColor}
                    style={{ width: '100%', height: '200px' }}
                  />
                </div>
                <div className="space-y-3 w-full md:w-auto">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">HEX</Label>
                    <Input
                      value={singleColor}
                      onChange={(e) => setSingleColor(e.target.value)}
                      className="font-mono w-full md:w-40"
                    />
                  </div>
                  <div 
                    className="w-full md:w-40 h-20 rounded-lg border-2 border-slate-200"
                    style={{ backgroundColor: singleColor }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : mode === 'gradient' ? (
          <div className="space-y-6">
            <div className="relative">
              <div 
                className="w-full h-32 rounded-2xl shadow-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`
                }}
              >
                <Sparkles className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs font-mono text-slate-700">
                {gradientStart} → {gradientEnd}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Cores Sugeridas</p>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPresetGradient(preset)}
                    className="group relative h-16 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                    style={{
                      background: `linear-gradient(to right, ${preset.start}, ${preset.end})`
                    }}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                      <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Tabs defaultValue="start" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="start">Cor Inicial</TabsTrigger>
                <TabsTrigger value="end">Cor Final</TabsTrigger>
              </TabsList>
              <TabsContent value="start" className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1">
                    <HexColorPicker color={gradientStart} onChange={setGradientStart} style={{ width: '100%', height: '200px' }} />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Código HEX</label>
                      <input
                        type="text"
                        value={gradientStart}
                        onChange={(e) => setGradientStart(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm font-mono mt-1"
                      />
                    </div>
                    <div 
                      className="w-24 h-24 rounded-lg shadow-md border-2 border-white"
                      style={{ backgroundColor: gradientStart }}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="end" className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1">
                    <HexColorPicker color={gradientEnd} onChange={setGradientEnd} style={{ width: '100%', height: '200px' }} />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Código HEX</label>
                      <input
                        type="text"
                        value={gradientEnd}
                        onChange={(e) => setGradientEnd(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm font-mono mt-1"
                      />
                    </div>
                    <div 
                      className="w-24 h-24 rounded-lg shadow-md border-2 border-white"
                      style={{ backgroundColor: gradientEnd }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center p-8 bg-slate-50 rounded-2xl">
              <Badge 
                className="text-lg px-6 py-2"
                style={{ 
                  backgroundColor: badgeBg,
                  color: badgeText,
                  border: 'none'
                }}
              >
                <Tag className="w-5 h-5 mr-2" />
                Texto do Badge
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Combinações Sugeridas</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_BADGES.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPresetBadge(preset)}
                    className="group relative h-16 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all flex items-center justify-center"
                    style={{ backgroundColor: preset.bg }}
                  >
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: preset.text }}
                    >
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Tabs defaultValue="bg" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bg">Cor de Fundo</TabsTrigger>
                <TabsTrigger value="text">Cor do Texto</TabsTrigger>
              </TabsList>
              <TabsContent value="bg" className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1">
                    <HexColorPicker color={badgeBg} onChange={setBadgeBg} style={{ width: '100%', height: '200px' }} />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Código HEX</label>
                      <input
                        type="text"
                        value={badgeBg}
                        onChange={(e) => setBadgeBg(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm font-mono mt-1"
                      />
                    </div>
                    <div 
                      className="w-24 h-24 rounded-lg shadow-md border-2 border-white"
                      style={{ backgroundColor: badgeBg }}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="text" className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1">
                    <HexColorPicker color={badgeText} onChange={setBadgeText} style={{ width: '100%', height: '200px' }} />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Código HEX</label>
                      <input
                        type="text"
                        value={badgeText}
                        onChange={(e) => setBadgeText(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm font-mono mt-1"
                      />
                    </div>
                    <div 
                      className="w-24 h-24 rounded-lg shadow-md border-2 border-white"
                      style={{ backgroundColor: badgeText }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Aplicar Cores
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}