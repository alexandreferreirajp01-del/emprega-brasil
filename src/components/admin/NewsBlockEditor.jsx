import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Trash2, ChevronUp, ChevronDown, Image, FileText, 
  Upload, Loader2, X, GripVertical
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import NewsRichTextEditor from "./NewsRichTextEditor";

export default function NewsBlockEditor({ blocks, onChange }) {
  const [uploading, setUploading] = useState({});

  const addBlock = (type) => {
    const newBlock = {
      id: Date.now().toString(),
      type,
      order: blocks.length,
      image_url: '',
      content: ''
    };
    onChange([...blocks, newBlock]);
  };

  const removeBlock = (index) => {
    const updated = blocks.filter((_, i) => i !== index);
    onChange(updated.map((b, i) => ({ ...b, order: i })));
  };

  const moveBlock = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    const updated = [...blocks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated.map((b, i) => ({ ...b, order: i })));
  };

  const updateBlock = (index, field, value) => {
    const updated = [...blocks];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;
    
    setUploading(prev => ({ ...prev, [index]: true }));
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result?.file_url) {
        updateBlock(index, 'image_url', result.file_url);
      }
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
    } finally {
      setUploading(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Botões para adicionar blocos */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={() => addBlock('image')}
          className="rounded-xl"
        >
          <Image className="w-4 h-4 mr-2" />
          Adicionar Imagem
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => addBlock('content')}
          className="rounded-xl"
        >
          <FileText className="w-4 h-4 mr-2" />
          Adicionar Texto
        </Button>
      </div>

      {/* Lista de blocos */}
      <div className="space-y-3">
        {blocks.map((block, index) => (
          <Card key={block.id || index} className="rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors">
            <CardContent className="p-4">
              {/* Header do bloco */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">
                    {block.type === 'image' ? '🖼️ Imagem' : '📝 Texto'} - Bloco {index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(index, 'up')}
                    disabled={index === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(index, 'down')}
                    disabled={index === blocks.length - 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlock(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Conteúdo do bloco */}
              {block.type === 'image' ? (
                <div className="space-y-3">
                  {block.image_url && (
                    <div className="relative">
                      <img 
                        src={block.image_url} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => updateBlock(index, 'image_url', '')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(index, e.target.files?.[0])}
                      />
                      <div className={`h-10 px-4 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors ${uploading[index] ? 'bg-blue-50 border-blue-300' : 'border-slate-300'}`}>
                        {uploading[index] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-sm text-blue-600">Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-600">Upload</span>
                          </>
                        )}
                      </div>
                    </label>
                    <Input
                      value={block.image_url || ''}
                      onChange={(e) => updateBlock(index, 'image_url', e.target.value)}
                      placeholder="Ou cole a URL..."
                      className="flex-1 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <NewsRichTextEditor
                  value={block.content || ''}
                  onChange={(html) => updateBlock(index, 'content', html)}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-xl">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum bloco adicionado</p>
          <p className="text-sm">Clique nos botões acima para adicionar imagens ou textos</p>
        </div>
      )}
    </div>
  );
}