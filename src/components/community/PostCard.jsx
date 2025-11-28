import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Send, MoreHorizontal, Trash2, Flag, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PostCard({ 
  post, 
  comments = [], 
  likes = [], 
  currentUser, 
  onLike, 
  onComment, 
  onDelete,
  onMention,
  isAdmin = false 
}) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');

  const postLikes = likes.filter(l => l.post_id === post.id).length;
  const postComments = comments.filter(c => c.post_id === post.id);
  const hasLiked = likes.some(l => l.post_id === post.id && l.user_email === currentUser?.email);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR');
  };

  // Renderizar conteúdo com menções clicáveis
  const renderContent = (content) => {
    if (!content) return null;
    
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // É uma menção
        return (
          <span 
            key={index}
            className="text-[#0056ff] font-medium cursor-pointer hover:underline"
            onClick={() => onMention && onMention(part)}
          >
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setNewComment(value);
    
    // Detectar se está digitando uma menção
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      if (!afterAt.includes(' ')) {
        setShowMentions(true);
        setMentionSearch(afterAt.toLowerCase());
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    onComment(post.id, newComment);
    setNewComment('');
    setShowMentions(false);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vagas Abertas Paraíba - Comunidade',
          text: post.content?.substring(0, 100) + '...',
          url: shareUrl
        });
      } catch (e) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-slate-100">
              <AvatarImage src={post.author_photo} />
              <AvatarFallback className="bg-gradient-to-br from-[#0056ff] to-[#0044cc] text-white font-semibold">
                {post.author_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-800">{post.author_name}</p>
              <p className="text-sm text-slate-500">{formatDate(post.created_date)}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal className="w-5 h-5 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem 
                  onClick={() => onDelete && onDelete(post.id)}
                  className="cursor-pointer text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
              {!isAdmin && (
                <DropdownMenuItem className="cursor-pointer text-amber-600">
                  <Flag className="w-4 h-4 mr-2" />
                  Denunciar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {renderContent(post.content)}
          </p>
        </div>

        {/* Post Image */}
        {post.image_url && (
          <div className="relative">
            <img 
              src={post.image_url} 
              alt="Post" 
              className="w-full object-cover max-h-[500px]"
            />
          </div>
        )}

        {/* Engagement Stats */}
        {(postLikes > 0 || postComments.length > 0) && (
          <div className="px-4 py-2 flex items-center justify-between text-sm text-slate-500 border-t">
            {postLikes > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <Heart className="w-3 h-3 text-white fill-white" />
                </div>
                <span>{postLikes}</span>
              </div>
            )}
            {postComments.length > 0 && (
              <button 
                onClick={() => setShowComments(!showComments)}
                className="hover:underline"
              >
                {postComments.length} comentário{postComments.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center border-t border-b">
          <button
            onClick={() => onLike && onLike(post.id)}
            disabled={!currentUser}
            className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${
              hasLiked 
                ? 'text-red-500' 
                : 'text-slate-500 hover:text-red-500 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">Curtir</span>
          </button>
          
          <div className="w-px h-8 bg-slate-200" />
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-[#0056ff] hover:bg-slate-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Comentar</span>
          </button>
          
          <div className="w-px h-8 bg-slate-200" />
          
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-green-500 hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Compartilhar</span>
          </button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-50"
            >
              {/* Comment Input */}
              {currentUser && (
                <div className="p-4 border-b relative">
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={currentUser?.profile_photo} />
                      <AvatarFallback className="bg-[#0056ff] text-white text-xs">
                        {currentUser?.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newComment}
                        onChange={handleCommentChange}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                        placeholder="Escreva um comentário... Use @ para mencionar"
                        className="w-full px-4 py-2.5 pr-12 rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0056ff] border"
                      />
                      <Button
                        size="icon"
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim()}
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-[#0056ff] hover:bg-[#0044cc] h-8 w-8"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {postComments.length === 0 ? (
                  <p className="text-center text-slate-400 py-4">
                    Seja o primeiro a comentar!
                  </p>
                ) : (
                  postComments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={comment.author_photo} />
                        <AvatarFallback className="bg-slate-300 text-slate-600 text-xs">
                          {comment.author_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                          <p className="font-semibold text-sm text-slate-800">{comment.author_name}</p>
                          <p className="text-sm text-slate-600">{renderContent(comment.content)}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-1 px-2">
                          <span className="text-xs text-slate-400">{formatDate(comment.created_date)}</span>
                          <button className="text-xs text-slate-500 hover:text-slate-700 font-medium">
                            Curtir
                          </button>
                          <button className="text-xs text-slate-500 hover:text-slate-700 font-medium">
                            Responder
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}