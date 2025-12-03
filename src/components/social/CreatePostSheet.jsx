import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  X, Image, Film, Briefcase, Loader2, Camera
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function CreatePostSheet({ user, isOpen, onClose, onSuccess }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
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
    if (!content.trim() && !imageUrl && !videoUrl) return;
    
    setIsSubmitting(true);
    try {
      await base44.entities.SocialPost.create({
        author_email: user.email,
        author_name: user.full_name,
        author_photo: user.profile_photo,
        content: content.trim(),
        image_url: imageUrl || undefined,
        video_url: videoUrl || undefined,
        post_type: imageUrl ? 'image' : videoUrl ? 'video' : 'text',
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0
      });
      
      setContent('');
      setImageUrl('');
      setVideoUrl('');
      onSuccess?.();
      onClose();
    } catch (e) {
      alert('Erro ao publicar');
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold">Nova publicação</h2>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !imageUrl)}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-5"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publicar'}
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.profile_photo} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {user?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="O que você quer compartilhar?"
                className="border-0 p-0 text-base resize-none focus-visible:ring-0 min-h-[100px]"
                autoFocus
              />
            </div>
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="relative mt-4 rounded-xl overflow-hidden">
              <img src={imageUrl} alt="" className="w-full max-h-64 object-cover" />
              <button 
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4 flex items-center justify-center p-8 bg-slate-100 rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-slate-600">Enviando...</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex items-center gap-4">
          <label className="cursor-pointer hover:bg-slate-100 p-2 rounded-full transition-colors">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            <Image className="w-6 h-6 text-green-600" />
          </label>
          <label className="cursor-pointer hover:bg-slate-100 p-2 rounded-full transition-colors">
            <Camera className="w-6 h-6 text-blue-600" />
          </label>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}