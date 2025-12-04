import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Bold, Italic, Underline, Link2, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Type, Palette, X, AlertCircle, CheckCircle2
} from "lucide-react";

const COLORS = [
  '#000000', '#374151', '#6B7280', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#0056ff'
];

// Limite máximo de caracteres (texto puro, sem HTML)
const MAX_CHARS = 100000;

// Função para extrair texto puro do HTML
const getPlainTextLength = (html) => {
  if (!html) return 0;
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return (temp.textContent || temp.innerText || '').length;
};

export default function NewsRichTextEditor({ value, onChange, maxChars = MAX_CHARS }) {
  const editorRef = useRef(null);
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkColor, setLinkColor] = useState('#0056ff');
  const [linkUnderline, setLinkUnderline] = useState(true);
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [savedSelection, setSavedSelection] = useState(null);

  // Calcular caracteres usados (apenas texto, sem HTML)
  const charCount = useMemo(() => getPlainTextLength(value), [value]);
  const charPercent = (charCount / maxChars) * 100;
  const isOverLimit = charCount > maxChars;
  const isWarning = charPercent >= 80 && !isOverLimit;

  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleChange();
  }, []);

  const handleChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange());
    }
  };

  const restoreSelection = () => {
    if (savedSelection) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedSelection);
    }
  };

  const handleLinkClick = () => {
    saveSelection();
    setShowLinkPopup(true);
  };

  const applyLink = () => {
    if (!linkUrl) return;
    
    restoreSelection();
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      const link = document.createElement('a');
      link.href = linkUrl;
      link.textContent = selectedText;
      link.style.color = linkColor;
      link.style.textDecoration = linkUnderline ? 'underline' : 'none';
      link.style.fontWeight = '500';
      if (linkNewTab) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      
      range.deleteContents();
      range.insertNode(link);
      
      selection.removeAllRanges();
    }
    
    setShowLinkPopup(false);
    setLinkUrl('');
    handleChange();
    editorRef.current?.focus();
  };

  const ToolbarButton = ({ icon: Icon, command, value, title }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        execCommand(command, value);
      }}
      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="border rounded-xl overflow-hidden bg-white" translate="no">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-slate-50">
        <ToolbarButton icon={Bold} command="bold" title="Negrito" />
        <ToolbarButton icon={Italic} command="italic" title="Itálico" />
        <ToolbarButton icon={Underline} command="underline" title="Sublinhado" />
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        <select
          onChange={(e) => execCommand('formatBlock', e.target.value)}
          className="h-8 px-2 rounded-lg border text-sm bg-white"
          defaultValue=""
        >
          <option value="" disabled>Título</option>
          <option value="p">Normal</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
        </select>
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-2 hover:bg-slate-100 rounded-lg" title="Cor do texto">
              <Palette className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-6 gap-1">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => execCommand('foreColor', color)}
                  className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Alinhar à esquerda" />
        <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Centralizar" />
        <ToolbarButton icon={AlignRight} command="justifyRight" title="Alinhar à direita" />
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        <ToolbarButton icon={List} command="insertUnorderedList" title="Lista" />
        <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Lista numerada" />
        <ToolbarButton icon={Quote} command="formatBlock" value="blockquote" title="Citação" />
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        <Popover open={showLinkPopup} onOpenChange={setShowLinkPopup}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={handleLinkClick}
              className="p-2 hover:bg-slate-100 rounded-lg flex items-center gap-1 text-blue-600"
              title="Inserir link"
            >
              <Link2 className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Link</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Aplicar Link na Frase</h4>
                <button type="button" onClick={() => setShowLinkPopup(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">URL do Link</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Cor do Destaque</Label>
                <div className="flex gap-1 flex-wrap">
                  {COLORS.slice(3).map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setLinkColor(color)}
                      className={`w-6 h-6 rounded border-2 transition-transform ${linkColor === color ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs">Sublinhado</Label>
                <Switch checked={linkUnderline} onCheckedChange={setLinkUnderline} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs">Abrir em nova aba</Label>
                <Switch checked={linkNewTab} onCheckedChange={setLinkNewTab} />
              </div>
              
              <Button onClick={applyLink} className="w-full h-9 bg-blue-600 hover:bg-blue-700" disabled={!linkUrl}>
                Aplicar Link
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleChange}
        onBlur={handleChange}
        onPaste={(e) => {
          // Permitir colar mas verificar depois
          setTimeout(handleChange, 0);
        }}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        className={`min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none ${isOverLimit ? 'bg-red-50 border-red-300' : ''}`}
        style={{ 
          lineHeight: '1.7',
          wordBreak: 'break-word'
        }}
      />
      
      {/* Contador de caracteres */}
      <div className={`flex items-center justify-between px-3 py-2 text-xs border-t ${
        isOverLimit ? 'bg-red-50 text-red-600' : isWarning ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
      }`}>
        <div className="flex items-center gap-2">
          {isOverLimit ? (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Limite excedido! Reduza o texto para salvar.</span>
            </>
          ) : isWarning ? (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Aproximando do limite</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span>Dentro do limite</span>
            </>
          )}
        </div>
        <div className="font-mono">
          <span className={isOverLimit ? 'font-bold' : ''}>{charCount.toLocaleString()}</span>
          <span className="text-slate-400"> / {maxChars.toLocaleString()}</span>
        </div>
      </div>
      
      <style>{`
        [contenteditable] a {
          cursor: pointer;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #3B82F6;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #4B5563;
          font-style: italic;
        }
        [contenteditable] h1 { font-size: 1.5rem; font-weight: bold; margin: 0.5rem 0; }
        [contenteditable] h2 { font-size: 1.25rem; font-weight: bold; margin: 0.5rem 0; }
        [contenteditable] h3 { font-size: 1.1rem; font-weight: bold; margin: 0.5rem 0; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 1.5rem; margin: 0.5rem 0; }
        [contenteditable] li { margin: 0.25rem 0; }
      `}</style>
    </div>
  );
}