import React, { useRef, useState } from 'react';
import { Loader2, Upload, Link as LinkIcon, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ImageUploadButton({ onInsert }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [dragging, setDragging] = useState(false);

  const doUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const tid = toast.loading('Enviando imagem...');
    try {
      // Read as base64 data URL
      const dataUrl = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      const { file_url } = await base44.integrations.Core.UploadFile({ file: dataUrl });

      if (!file_url) throw new Error('URL não retornada');
      onInsert(file_url);
      toast.success('Imagem enviada!', { id: tid });
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Falha no upload. Tente usar URL externa.', { id: tid });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  };

  const handleInsertUrl = () => {
    const url = urlValue.trim();
    if (!url) return;
    onInsert(url);
    setUrlValue('');
    setShowUrl(false);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Área de drop */}
      <div
        className={`relative flex flex-col items-center justify-center gap-3 p-6 transition-colors cursor-pointer ${dragging ? 'bg-blue-50 border-2 border-dashed border-blue-400' : 'hover:bg-slate-50'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-slate-500">Enviando...</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">Clique ou arraste uma imagem aqui</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, GIF, WEBP, SVG, BMP — qualquer formato</p>
            </div>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="*"
          className="hidden"
          onChange={handleFileChange}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Divisor + opção URL */}
      <div className="border-t border-slate-100 px-4 py-3">
        {showUrl ? (
          <div className="flex gap-2 items-center">
            <Input
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="flex-1 h-9 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleInsertUrl()}
              autoFocus
            />
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-9" onClick={handleInsertUrl}>Inserir</Button>
            <button type="button" onClick={() => setShowUrl(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowUrl(true)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Ou inserir por URL
          </button>
        )}
      </div>
    </div>
  );
}