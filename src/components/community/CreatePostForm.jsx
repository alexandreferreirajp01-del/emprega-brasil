import React, { useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Video, Smile, X, Loader2, Camera, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CreatePostForm({ user, onSubmit, isSubmitting }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const fileInputRef = useRef(null);

  const handleContentChange = (e) => {
    const value = e.target.value;
    setContent(value);
    
    // Detectar menções
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      if (!afterAt.includes(' ') && afterAt.length > 0) {
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    e.target.value = '';
    setUploadingImage(true);
    
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result?.file_url) {
        setImageUrl(result.file_url);
      }
    } catch (err) {
      console.error('Erro ao carregar imagem:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl) return;
    
    onSubmit({
      content,
      image_url: imageUrl,
      author_name: user?.full_name || 'Usuário',
      author_email: user?.email,
      author_photo: user?.profile_photo,
      status: 'pending',
      likes_count: 0,
      comments_count: 0
    });
    
    setContent('');
    setImageUrl('');
  };

  const removeImage = () => {
    setImageUrl('');
  };

  return (
    <Card className="rounded-2xl shadow-lg border-0 overflow-hidden">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center gap-3 p-4 pb-2">
            <Avatar className="w-12 h-12 ring-2 ring-slate-100">
              <AvatarImage src={user?.profile_photo} />
              <AvatarFallback className="bg-gradient-to-br from-[#0056ff] to-[#0044cc] text-white font-semibold">
                {user?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">{user?.full_name || 'Usuário'}</p>
              <p className="text-sm text-slate-500">Compartilhar publicação</p>
            </div>
          </div>

          {/* Content Input */}
          <div className="px-4">
            <Textarea
              value={content}
              onChange={handleContentChange}
              placeholder="No que você está pensando? Use @ para mencionar alguém..."
              className="border-0 focus-visible:ring-0 resize-none text-lg placeholder:text-slate-400 min-h-[100px] p-0"
            />
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="relative mx-4 mt-3 rounded-xl overflow-hidden">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="w-full max-h-80 object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={removeImage}
                className="absolute top-2 right-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Upload Progress */}
          {uploadingImage && (
            <div className="mx-4 mt-3 p-4 bg-slate-100 rounded-xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-[#0056ff]" />
              <span className="text-sm text-slate-600">Carregando imagem...</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between p-4 border-t mt-4">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="rounded-xl text-green-600 hover:bg-green-50"
              >
                <Image className="w-5 h-5 mr-2" />
                Foto
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="rounded-xl text-blue-600 hover:bg-blue-50"
              >
                <Camera className="w-5 h-5 mr-2" />
                Câmera
              </Button>
            </div>

            <Button
              type="submit"
              disabled={(!content.trim() && !imageUrl) || isSubmitting || uploadingImage}
              className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl px-6"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Publicar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}