/**
 * BlogEditor - Editor rico de texto no estilo Word
 * Suporte a: negrito, itálico, sublinhado, títulos, listas, links clicáveis,
 * imagens, vídeos (YouTube), alinhamento, cores, tabelas.
 */
import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Youtube,
  Heading1, Heading2, Heading3, Minus, Code, Quote, Strikethrough,
  Subscript, Superscript, Table, Undo, Redo, Type
} from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ImageUploadButton from "@/components/blog/ImageUploadButton";
import { Loader2 } from "lucide-react";

const ToolBtn = ({ onClick, title, active, children }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm ${active ? 'bg-slate-200 dark:bg-slate-600 text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 mx-0.5" />;

export default function BlogEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [linkText, setLinkText] = React.useState('');
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [imageOpen, setImageOpen] = React.useState(false);
  const [uploadingImg, setUploadingImg] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState('');
  const [videoOpen, setVideoOpen] = React.useState(false);
  const savedRange = useRef(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, []);

  const exec = (command, val = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreRange = () => {
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    editorRef.current?.focus();
  };

  const insertLink = () => {
    restoreRange();
    const url = linkUrl.trim();
    if (!url) return;
    const text = linkText.trim() || url;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      exec('createLink', url);
    } else {
      const link = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#0A66C2;text-decoration:underline;">${text}</a>`;
      document.execCommand('insertHTML', false, link);
    }
    setLinkOpen(false);
    setLinkUrl('');
    setLinkText('');
    handleInput();
  };

  const insertImage = () => {
    restoreRange();
    if (!imageUrl.trim()) return;
    const html = `<figure style="margin:1em 0;text-align:center;"><img src="${imageUrl}" style="max-width:100%;border-radius:8px;" alt="imagem" /><figcaption style="font-size:0.8em;color:#64748b;margin-top:4px;">Imagem</figcaption></figure>`;
    document.execCommand('insertHTML', false, html);
    setImageOpen(false);
    setImageUrl('');
    handleInput();
  };

  const insertVideo = () => {
    restoreRange();
    const url = videoUrl.trim();
    if (!url) return;
    let videoId = '';
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (m) videoId = m[1];
    const html = videoId
      ? `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1em 0;border-radius:8px;"><iframe src="https://www.youtube.com/embed/${videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:8px;" allowfullscreen></iframe></div>`
      : `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#0A66C2;">${url}</a>`;
    document.execCommand('insertHTML', false, html);
    setVideoOpen(false);
    setVideoUrl('');
    handleInput();
  };

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset input so same file can be selected again
    e.target.value = '';
    const toastId = toast.loading('Enviando imagem...');
    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: base64 });
      restoreRange();
      const html = `<figure style="margin:1em 0;text-align:center;"><img src="${file_url}" style="max-width:100%;border-radius:8px;" alt="imagem" /></figure>`;
      document.execCommand('insertHTML', false, html);
      handleInput();
      toast.success('Imagem inserida!', { id: toastId });
    } catch (err) {
      toast.error('Erro ao fazer upload da imagem', { id: toastId });
    }
  };

  const insertTable = () => {
    restoreRange();
    const html = `<table style="width:100%;border-collapse:collapse;margin:1em 0;">
      <thead><tr style="background:#f1f5f9;">
        <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;">Coluna 1</th>
        <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;">Coluna 2</th>
        <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;">Coluna 3</th>
      </tr></thead>
      <tbody>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;">Dado</td><td style="border:1px solid #cbd5e1;padding:8px;">Dado</td><td style="border:1px solid #cbd5e1;padding:8px;">Dado</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;">Dado</td><td style="border:1px solid #cbd5e1;padding:8px;">Dado</td><td style="border:1px solid #cbd5e1;padding:8px;">Dado</td></tr>
      </tbody>
    </table><p></p>`;
    document.execCommand('insertHTML', false, html);
    handleInput();
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
      {/* Toolbar */}
      <div className="border-b border-slate-200 dark:border-slate-700 p-2 flex flex-wrap gap-0.5 bg-slate-50 dark:bg-slate-800/80">
        
        {/* Undo/Redo */}
        <ToolBtn onClick={() => exec('undo')} title="Desfazer (Ctrl+Z)"><Undo className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('redo')} title="Refazer (Ctrl+Y)"><Redo className="w-3.5 h-3.5" /></ToolBtn>
        <Divider />

        {/* Fontes */}
        <select
          className="h-8 text-xs border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-1"
          onChange={e => exec('fontSize', e.target.value)}
          defaultValue=""
          title="Tamanho da fonte"
        >
          <option value="" disabled>Tamanho</option>
          <option value="1">Muito pequeno</option>
          <option value="2">Pequeno</option>
          <option value="3">Normal</option>
          <option value="4">Médio</option>
          <option value="5">Grande</option>
          <option value="6">Maior</option>
          <option value="7">Enorme</option>
        </select>
        <Divider />

        {/* Títulos */}
        <ToolBtn onClick={() => exec('formatBlock', '<h1>')} title="Título 1"><Heading1 className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<h2>')} title="Título 2"><Heading2 className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<h3>')} title="Título 3"><Heading3 className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<p>')} title="Parágrafo"><Type className="w-3.5 h-3.5" /></ToolBtn>
        <Divider />

        {/* Formatação */}
        <ToolBtn onClick={() => exec('bold')} title="Negrito (Ctrl+B)"><Bold className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Itálico (Ctrl+I)"><Italic className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Sublinhado (Ctrl+U)"><Underline className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('strikeThrough')} title="Tachado"><Strikethrough className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('subscript')} title="Subscrito"><Subscript className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('superscript')} title="Sobrescrito"><Superscript className="w-3.5 h-3.5" /></ToolBtn>
        <Divider />

        {/* Cores */}
        <div className="flex items-center gap-0.5">
          <span className="text-xs text-slate-500 px-1">A</span>
          <input type="color" title="Cor do texto" className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            onChange={e => exec('foreColor', e.target.value)} defaultValue="#000000" />
          <span className="text-xs text-slate-500 px-1 ml-1">bg</span>
          <input type="color" title="Cor de fundo" className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            onChange={e => exec('hiliteColor', e.target.value)} defaultValue="#ffffff" />
        </div>
        <Divider />

        {/* Alinhamento */}
        <ToolBtn onClick={() => exec('justifyLeft')} title="Alinhar à esquerda"><AlignLeft className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyCenter')} title="Centralizar"><AlignCenter className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyRight')} title="Alinhar à direita"><AlignRight className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyFull')} title="Justificar"><AlignJustify className="w-3.5 h-3.5" /></ToolBtn>
        <Divider />

        {/* Listas */}
        <ToolBtn onClick={() => exec('insertUnorderedList')} title="Lista com marcadores"><List className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('insertOrderedList')} title="Lista numerada"><ListOrdered className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('indent')} title="Aumentar recuo">›</ToolBtn>
        <ToolBtn onClick={() => exec('outdent')} title="Diminuir recuo">‹</ToolBtn>
        <Divider />

        {/* Extras */}
        <ToolBtn onClick={() => exec('formatBlock', '<blockquote>')} title="Citação"><Quote className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<pre>')} title="Código"><Code className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('insertHorizontalRule')} title="Linha horizontal"><Minus className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={insertTable} title="Inserir tabela"><Table className="w-3.5 h-3.5" /></ToolBtn>
        <Divider />

        {/* Link */}
        <Popover open={linkOpen} onOpenChange={(o) => { if (o) saveRange(); setLinkOpen(o); }}>
          <PopoverTrigger asChild>
            <button type="button" title="Inserir link" className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-300">
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" side="bottom">
            <div className="space-y-2">
              <Label className="text-xs">Texto do link (opcional)</Label>
              <Input value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Texto clicável" className="h-8 text-sm" />
              <Label className="text-xs">URL *</Label>
              <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="h-8 text-sm" onKeyDown={e => e.key === 'Enter' && insertLink()} />
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setLinkOpen(false)}>Cancelar</Button>
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={insertLink}>Inserir</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Imagem URL */}
        <Popover open={imageOpen} onOpenChange={(o) => { if (o) saveRange(); setImageOpen(o); }}>
          <PopoverTrigger asChild>
            <button type="button" title="Inserir imagem por URL" className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-300">
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" side="bottom">
            <div className="space-y-2">
              <Label className="text-xs">URL da imagem</Label>
              <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="h-8 text-sm" />
              <p className="text-xs text-slate-500">ou</p>
              <Label className="w-full cursor-pointer">
                <div className="h-8 border border-dashed border-slate-300 rounded flex items-center justify-center text-xs text-slate-500 hover:bg-slate-50">
                  📁 Upload do computador
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
              </Label>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setImageOpen(false)}>Cancelar</Button>
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={insertImage}>Inserir</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Vídeo YouTube */}
        <Popover open={videoOpen} onOpenChange={(o) => { if (o) saveRange(); setVideoOpen(o); }}>
          <PopoverTrigger asChild>
            <button type="button" title="Inserir vídeo do YouTube" className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-red-600">
              <Youtube className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" side="bottom">
            <div className="space-y-2">
              <Label className="text-xs">URL do YouTube</Label>
              <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="h-8 text-sm" />
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setVideoOpen(false)}>Cancelar</Button>
                <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={insertVideo}>Inserir</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Área de edição */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={(e) => setTimeout(handleInput, 0)}
        className="min-h-[400px] p-4 text-slate-800 dark:text-slate-100 focus:outline-none prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed"
        style={{ wordBreak: 'break-word' }}
        data-placeholder="Comece a escrever seu post aqui..."
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #0A66C2;
          padding-left: 1rem;
          color: #475569;
          font-style: italic;
          margin: 1rem 0;
        }
        [contenteditable] pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 8px;
          font-family: monospace;
          overflow-x: auto;
        }
        [contenteditable] h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] h3 { font-size: 1.2em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] a { color: #0A66C2; text-decoration: underline; }
        [contenteditable] ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
        [contenteditable] ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        [contenteditable] table { width: 100%; border-collapse: collapse; }
        [contenteditable] td, [contenteditable] th { border: 1px solid #cbd5e1; padding: 8px; }
      `}</style>
    </div>
  );
}