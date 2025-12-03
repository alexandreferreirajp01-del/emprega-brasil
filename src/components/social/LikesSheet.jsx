import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UserBadge from "./UserBadge";

export default function LikesSheet({ post, user, allUsers, isOpen, onClose }) {
  const [likes, setLikes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && post) {
      loadLikes();
    }
  }, [isOpen, post]);

  const loadLikes = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.SocialLike.filter(
        { post_id: post.id },
        '-created_date',
        100
      );
      setLikes(data || []);
    } catch (e) {}
    setIsLoading(false);
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
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-center p-4 border-b relative">
          <div className="w-10 h-1 bg-slate-300 rounded-full absolute top-2" />
          <h2 className="font-semibold">Curtidas</h2>
          <button onClick={onClose} className="absolute right-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Likes List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : likes.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Nenhuma curtida ainda
            </p>
          ) : (
            <div className="divide-y">
              {likes.map((like) => {
                const likeUser = allUsers?.find(u => u.email === like.user_email);
                return (
                  <Link 
                    key={like.id}
                    to={`${createPageUrl('SocialProfile')}?email=${like.user_email}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={like.user_photo || likeUser?.profile_photo} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {like.user_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{like.user_name || likeUser?.full_name}</p>
                      <UserBadge user={likeUser} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}