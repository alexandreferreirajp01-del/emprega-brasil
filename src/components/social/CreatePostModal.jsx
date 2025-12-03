import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CreatePostModal({ open, onClose, user, onSuccess, editPost }) {
  const [content, setContent] = useState(editPost?.content || '');
  const [imageUrl, setImageUrl] = useState(editPost?.image_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (e) {}
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setSaving(true);
    try {
      if (editPost) {
        await base44.entities.SocialPost.update(editPost.id, {
          content: content.trim(),
          image_url: imageUrl || null
        });
      } else {
        await base44.entities.SocialPost.create({
          author_email: user.email,
          author_name: user.full_name,
          author_photo: user.profile_photo,
          content: content.trim(),
          image_url: imageUrl || null
        });
      }
      setContent('');
      setImageUrl('');
      onSuccess?.();
      onClose();
    } catch (e) {}
    setSaving(false);
  };

  const handleClose = () => {
    setContent(editPost?.content || '');
    setImageUrl(editPost?.image_url || '');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editPost ? 'Editar publicação' : 'Criar publicação'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user?.profile_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white">
                {user?.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-800">{user?.full_name}</p>
              <p className="text-xs text-slate-500">Público</p>
            </div>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="No que você está pensando?"
            className="min-h-[150px] resize-none border-0 text-lg focus-visible:ring-0 p-0"
          />

          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="" className="w-full rounded-xl max-h-64 object-cover" />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 rounded-full"
                onClick={() => setImageUrl('')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Image className="w-5 h-5 text-green-600" />
                  )}
                  <span className="text-sm">Foto</span>
                </div>
              </label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || saving}
              className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl px-6"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editPost ? 'Salvar' : 'Publicar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}