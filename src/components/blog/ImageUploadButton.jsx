import React, { useRef, useState } from 'react';
import { Loader2, Upload, Link as LinkIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const UPLOAD_URL = 'https://api.base44.com/api/apps/692a4c2d5228a0792af288b2/storage/upload';

async function uploadFileToStorage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('base44_token') || sessionStorage.getItem('base44_token') || '';

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload falhou: ${res.status} ${text}`);
  }

  const data = await res.json();
  // The API may return { file_url } or { url } or { public_url }
  const url = data.file_url || data.url || data.public_url;
  if (!url) throw new Error('URL não retornada pelo servidor');
  return url;
}

export default function ImageUploadButton({ onInsert }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [dragging, setDragging] = useState(false);

  const doUpload = async (file) => {
    if (!file || uploading) return;
    setUploading(true);
    const tid = toast.loading('Enviando imagem...');
    try {
      const url = await uploadFileToStorage(file);
      onInsert(url);
      toast.success('Imagem enviada!', { id: tid });
    } catch (err) {
      console.error('Upload error:', err);
      // Fallback: try base64 via SDK
      try {
        const { base44 } = await import('@/api/base44Client');
        const dataUrl = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
        const result = await base44.integrations.Core.UploadFile({ file: dataUrl });
        const fileUrl = result?.file_url || result?.url;
        if (!fileUrl) throw new Error('Sem URL');
        onInsert(fileUrl);
        toast.success('Imagem enviada!', { id: tid });
      } catch (err2) {
        console.error('Fallback upload error:', err2);
        toast.error('Falha no upload. Tente inserir por URL.', { id: tid });
      }
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
      {/* Drop area */}
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
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, GIF, WEBP, SVG, BMP</p>
            </div>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* URL option */}
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