import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, MessageCircle, Facebook, Send } from "lucide-react";

// Instagram icon component
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function SharePostDialog({ open, onOpenChange, post }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/Social?post=${post?.id}`;
  const shareText = `Confira essa publicação no Vagas Abertas PB: "${post?.content?.substring(0, 100)}${post?.content?.length > 100 ? '...' : ''}"`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleInstagram = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    alert('Link copiado! Abra o Instagram e cole na sua story ou mensagem.');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Publicação</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          <Button
            onClick={handleWhatsApp}
            className="h-14 bg-[#25D366] hover:bg-[#20bd5a] rounded-xl flex flex-col gap-1"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">WhatsApp</span>
          </Button>

          <Button
            onClick={handleInstagram}
            className="h-14 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 rounded-xl flex flex-col gap-1"
          >
            <InstagramIcon />
            <span className="text-xs">Instagram</span>
          </Button>

          <Button
            onClick={handleTelegram}
            className="h-14 bg-[#0088cc] hover:bg-[#0077b3] rounded-xl flex flex-col gap-1"
          >
            <Send className="w-5 h-5" />
            <span className="text-xs">Telegram</span>
          </Button>

          <Button
            onClick={handleFacebook}
            className="h-14 bg-[#1877F2] hover:bg-[#166fe5] rounded-xl flex flex-col gap-1"
          >
            <Facebook className="w-5 h-5" />
            <span className="text-xs">Facebook</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 bg-slate-100 rounded-lg text-sm text-slate-600 truncate">
            {shareUrl}
          </div>
          <Button onClick={handleCopyLink} variant="outline" className="rounded-lg">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}