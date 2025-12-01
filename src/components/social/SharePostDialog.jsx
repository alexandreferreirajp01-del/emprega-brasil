import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, MessageCircle, Facebook, Send } from "lucide-react";

// Instagram icon component
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function SharePostDialog({ open, onOpenChange, post }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/Social?post=${post?.id}`;
  const shareText = `Confira no Vagas Abertas PB`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleInstagram = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    alert('Link copiado! Cole no Instagram.');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] sm:max-w-sm p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Compartilhar</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2 py-3">
          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] text-slate-600">WhatsApp</span>
          </button>

          <button
            onClick={handleInstagram}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-full flex items-center justify-center">
              <InstagramIcon />
            </div>
            <span className="text-[10px] text-slate-600">Instagram</span>
          </button>

          <button
            onClick={handleTelegram}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-10 h-10 bg-[#0088cc] rounded-full flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] text-slate-600">Telegram</span>
          </button>

          <button
            onClick={handleFacebook}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center">
              <Facebook className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] text-slate-600">Facebook</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <div className="flex-1 p-2 bg-slate-100 rounded-lg text-xs text-slate-500 truncate">
            {shareUrl.length > 35 ? shareUrl.substring(0, 35) + '...' : shareUrl}
          </div>
          <Button 
            onClick={handleCopyLink} 
            size="sm" 
            variant={copied ? "default" : "outline"} 
            className={`rounded-lg h-8 px-3 ${copied ? 'bg-green-500 hover:bg-green-600' : ''}`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}