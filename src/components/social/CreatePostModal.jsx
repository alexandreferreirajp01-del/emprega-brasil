import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  X, Image, Loader2, Globe
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CreatePostModal({ user, isOpen, onClose, onSuccess }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (e) {
      alert('Erro ao enviar imagem');
    }
    setIsUploading(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl) return;
    
    setIsSubmitting(true);
    try {
      await base44.entities.SocialPost.create({
        author_email: user.email,
        author_name: user.full_name,
        author_photo: user.profile_photo,
        content: content.trim(),
        image_url: imageUrl || undefined,
        post_type: imageUrl ? 'image' : 'text',
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0
      });
      
      setContent('');
      setImageUrl('');
      onSuccess?.();
      onClose();
    } catch (e) {
      alert('Erro ao publicar');
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setContent('');
    setImageUrl('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">Criar publicação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user?.profile_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white font-semibold">
                {user?.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-800">{user?.full_name}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Globe className="w-3 h-3" />
                <span>Público</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Sobre o que você quer falar?"
            className="min-h-[120px] border-0 p-0 text-base resize-none focus-visible:ring-0"
            autoFocus
          />

          {/* Image Preview */}
          {imageUrl && (
            <div className="relative rounded-xl overflow-hidden border">
              <img src={imageUrl} alt="" className="w-full max-h-64 object-cover" />
              <button 
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="flex items-center justify-center p-6 bg-slate-100 rounded-xl">
              <Loader2 className="w-5 h-5 animate-spin text-[#0056ff]" />
              <span className="ml-2 text-sm text-slate-600">Enviando imagem...</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <label className="cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <div className="flex items-center gap-2 text-slate-600">
                <Image className="w-5 h-5 text-green-600" />
                <span className="text-sm">Foto</span>
              </div>
            </label>

            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !imageUrl)}
              className="bg-[#0056ff] hover:bg-[#0044cc] text-white rounded-full px-6"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Publicar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}