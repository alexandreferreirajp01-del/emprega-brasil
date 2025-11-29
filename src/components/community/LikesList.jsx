import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart } from "lucide-react";

export default function LikesList({ isOpen, onClose, likes = [], users = [] }) {
  // Mapear likes com dados dos usuários
  const likesWithUsers = likes.map(like => {
    const user = users.find(u => u.email === like.user_email);
    return {
      ...like,
      user_name: user?.full_name || like.user_email?.split('@')[0] || 'Usuário',
      user_photo: user?.profile_photo
    };
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            Curtidas ({likes.length})
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px]">
          {likesWithUsers.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Nenhuma curtida ainda</p>
          ) : (
            <div className="space-y-3">
              {likesWithUsers.map((like, index) => (
                <div key={like.id || index} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={like.user_photo} />
                    <AvatarFallback className="bg-[#0056ff] text-white text-sm">
                      {like.user_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-slate-800">{like.user_name}</p>
                    <p className="text-xs text-slate-400">{like.user_email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}