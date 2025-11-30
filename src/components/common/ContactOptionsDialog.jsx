import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, X } from "lucide-react";

// Função para formatar número de WhatsApp corretamente
export function formatWhatsAppLink(phone) {
  if (!phone) return null;
  
  // Remover tudo que não é número
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Se começar com 0, remover
  if (cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  // Se não tiver código do país (55), adicionar
  if (!cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone;
  }
  
  return `https://wa.me/${cleanPhone}`;
}

// Função para extrair contatos do link de candidatura e descrição
export function extractContacts(job) {
  const contacts = {
    whatsapp: null,
    email: null,
    site: null
  };
  
  const applicationLink = job?.application_link || '';
  const description = job?.description || '';
  const additionalInfo = job?.additional_info || '';
  const allText = `${applicationLink} ${description} ${additionalInfo}`;
  
  // Verificar WhatsApp no link
  if (applicationLink.includes('wa.me')) {
    // Extrair número do link wa.me
    const match = applicationLink.match(/wa\.me\/(\d+)/);
    if (match) {
      let phone = match[1];
      // Garantir que tem código do país
      if (!phone.startsWith('55') && phone.length <= 11) {
        phone = '55' + phone;
      }
      contacts.whatsapp = `https://wa.me/${phone}`;
    }
  }
  
  // Procurar telefones na descrição/info se não encontrou no link
  if (!contacts.whatsapp) {
    // Padrão para telefones brasileiros: (83) 99999-9999 ou 83999999999
    const phoneRegex = /(?:\(?\d{2}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}/g;
    const phones = allText.match(phoneRegex);
    if (phones && phones.length > 0) {
      const cleanPhone = phones[0].replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        contacts.whatsapp = formatWhatsAppLink(cleanPhone);
      }
    }
  }
  
  // Verificar Email no link
  if (applicationLink.includes('mailto:')) {
    contacts.email = applicationLink;
  }
  
  // Procurar emails na descrição/info
  if (!contacts.email) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = allText.match(emailRegex);
    if (emails && emails.length > 0) {
      contacts.email = `mailto:${emails[0]}`;
    }
  }
  
  // Verificar site no link
  if (applicationLink && !applicationLink.includes('wa.me') && !applicationLink.includes('mailto:')) {
    if (applicationLink.startsWith('http')) {
      contacts.site = applicationLink;
    }
  }
  
  return contacts;
}

export default function ContactOptionsDialog({ open, onOpenChange, job }) {
  const contacts = extractContacts(job);
  
  const hasWhatsApp = !!contacts.whatsapp;
  const hasEmail = !!contacts.email;
  const hasSite = !!contacts.site;
  const contactCount = [hasWhatsApp, hasEmail, hasSite].filter(Boolean).length;
  
  // Se só tem um contato, abrir direto
  const handleSingleContact = () => {
    if (contactCount === 1) {
      if (hasWhatsApp) window.open(contacts.whatsapp, '_blank');
      else if (hasEmail) window.open(contacts.email, '_blank');
      else if (hasSite) window.open(contacts.site, '_blank');
    }
  };
  
  // Se só tem um contato, não mostrar dialog
  React.useEffect(() => {
    if (open && contactCount === 1) {
      handleSingleContact();
      onOpenChange(false);
    }
  }, [open, contactCount]);
  
  if (contactCount === 0) {
    return null;
  }
  
  if (contactCount === 1) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Como deseja entrar em contato?</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          {hasWhatsApp && (
            <Button
              onClick={() => {
                window.open(contacts.whatsapp, '_blank');
                onOpenChange(false);
              }}
              className="h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-lg"
            >
              <MessageCircle className="w-6 h-6 mr-3" />
              WhatsApp
            </Button>
          )}
          
          {hasEmail && (
            <Button
              onClick={() => {
                window.open(contacts.email, '_blank');
                onOpenChange(false);
              }}
              className="h-14 bg-[#0056ff] hover:bg-[#0044cc] text-white rounded-xl text-lg"
            >
              <Mail className="w-6 h-6 mr-3" />
              E-mail
            </Button>
          )}
          
          {hasSite && (
            <Button
              onClick={() => {
                window.open(contacts.site, '_blank');
                onOpenChange(false);
              }}
              variant="outline"
              className="h-14 rounded-xl text-lg"
            >
              Site / Link Externo
            </Button>
          )}
        </div>
        
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="text-slate-500"
        >
          Cancelar
        </Button>
      </DialogContent>
    </Dialog>
  );
}