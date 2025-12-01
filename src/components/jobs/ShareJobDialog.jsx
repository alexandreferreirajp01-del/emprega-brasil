import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, MessageCircle, Facebook, Instagram, Share2 } from "lucide-react";

export default function ShareJobDialog({ open, onOpenChange, job }) {
  const [copied, setCopied] = useState(false);
  
  if (!job) return null;
  
  const jobUrl = `${window.location.origin}/Jobs?id=${job.id}`;
  const shareText = `🔥 Vaga: ${job.title}\n🏢 ${job.company || 'Empresa'}\n📍 ${job.city || 'Paraíba'}\n\nConfira: ${jobUrl}`;
  
  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };
  
  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`, '_blank');
  };
  
  const shareInstagram = () => {
    // Instagram não tem share direto, copiar para stories
    copyLink();
    alert('Link copiado! Cole nos seus stories do Instagram.');
  };
  
  const copyLink = () => {
    navigator.clipboard.writeText(jobUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#0056ff]" />
            Compartilhar Vaga
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-600 font-medium">{job.title}</p>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={shareWhatsApp}
              className="h-14 bg-[#25D366] hover:bg-[#20bd5a] rounded-xl"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp
            </Button>
            
            <Button
              onClick={shareFacebook}
              className="h-14 bg-[#1877F2] hover:bg-[#166fe5] rounded-xl"
            >
              <Facebook className="w-5 h-5 mr-2" />
              Facebook
            </Button>
            
            <Button
              onClick={shareInstagram}
              className="h-14 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 rounded-xl"
            >
              <Instagram className="w-5 h-5 mr-2" />
              Instagram
            </Button>
            
            <Button
              onClick={copyLink}
              variant="outline"
              className="h-14 rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2 text-green-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copiar Link
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}