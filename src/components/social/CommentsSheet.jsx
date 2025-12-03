import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Send, Loader2, Heart, MoreHorizontal, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CommentsSheet({ post, user, isOpen, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && post) {
      loadComments();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, post]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.SocialComment.filter(
        { post_id: post.id, status: 'active' },
        '-created_date',
        100
      );
      setComments(data || []);
    } catch (e) {}
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!newComment.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await base44.entities.SocialComment.create({
        post_id: post.id,
        author_email: user.email,
        author_name: user.full_name,
        author_photo: user.profile_photo,
        content: newComment.trim()
      });
      
      // Update post comments count
      await base44.entities.SocialPost.update(post.id, {
        comments_count: (post.comments_count || 0) + 1
      });
      
      setNewComment('');
      loadComments();
    } catch (e) {
      alert('Erro ao comentar');
    }
    setIsSending(false);
  };

  const handleDelete = async (commentId) => {
    try {
      await base44.entities.SocialComment.delete(commentId);
      await base44.entities.SocialPost.update(post.id, {
        comments_count: Math.max(0, (post.comments_count || 1) - 1)
      });
      loadComments();
    } catch (e) {}
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
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-center p-4 border-b relative">
          <div className="w-10 h-1 bg-slate-300 rounded-full absolute top-2" />
          <h2 className="font-semibold">Comentários</h2>
          <button onClick={onClose} className="absolute right-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Link to={`${createPageUrl('SocialProfile')}?email=${comment.author_email}`}>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.author_photo} />
                    <AvatarFallback className="bg-slate-200 text-xs">
                      {comment.author_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="bg-slate-100 rounded-2xl px-3 py-2">
                    <Link 
                      to={`${createPageUrl('SocialProfile')}?email=${comment.author_email}`}
                      className="font-semibold text-sm hover:underline"
                    >
                      {comment.author_name}
                    </Link>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-1 px-2">
                    <span className="text-xs text-slate-500">
                      {moment(comment.created_date).fromNow()}
                    </span>
                    {(user?.email === comment.author_email || user?.role === 'admin') && (
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t flex items-center gap-3 bg-white">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profile_photo} />
            <AvatarFallback className="bg-slate-200 text-xs">
              {user?.full_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <Input
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione um comentário..."
            className="flex-1 rounded-full bg-slate-100 border-0"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!newComment.trim() || isSending}
            className="rounded-full bg-[#0056ff] hover:bg-[#0044cc]"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}