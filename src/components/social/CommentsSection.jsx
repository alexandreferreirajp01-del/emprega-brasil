import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, MoreVertical, Pencil, Trash2, X, Check, Heart, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CommentsSection({ post, user, onRefresh }) {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['post-comments', post.id],
    queryFn: async () => {
      try {
        return await base44.entities.SocialComment.filter(
          { post_id: post.id, status: 'active' },
          '-created_date',
          100
        ) || [];
      } catch (e) {
        return [];
      }
    },
    refetchInterval: 5000,
  });

  // Get all comment likes
  const { data: commentLikes = [] } = useQuery({
    queryKey: ['comment-likes', post.id],
    queryFn: async () => {
      try {
        // We'll store comment likes in SocialLike with a prefix
        return await base44.entities.SocialLike.filter({}) || [];
      } catch (e) {
        return [];
      }
    },
    refetchInterval: 5000,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (parentId = null) => {
      const content = parentId ? replyContent : newComment;
      await base44.entities.SocialComment.create({
        post_id: post.id,
        author_email: user.email,
        author_name: user.full_name,
        author_photo: user.profile_photo,
        content: parentId ? `@${replyingTo.author_name} ${content}` : content,
        parent_id: parentId || ''
      });

      await base44.entities.SocialPost.update(post.id, {
        comments_count: (post.comments_count || 0) + 1
      });

      if (post.author_email !== user.email) {
        await base44.entities.SocialNotification.create({
          user_email: post.author_email,
          from_email: user.email,
          from_name: user.full_name,
          from_photo: user.profile_photo,
          type: 'comment',
          post_id: post.id,
          message: `${user.full_name || 'Alguém'} comentou sua publicação`
        });
      }
    },
    onSuccess: () => {
      setNewComment('');
      setReplyContent('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['post-comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      onRefresh?.();
    },
  });

  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }) => {
      await base44.entities.SocialComment.update(commentId, {
        content,
        is_edited: true,
        edited_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setEditingId(null);
      setEditContent('');
      queryClient.invalidateQueries({ queryKey: ['post-comments', post.id] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.SocialComment.delete(commentId);
      await base44.entities.SocialPost.update(post.id, {
        comments_count: Math.max((post.comments_count || 1) - 1, 0)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      onRefresh?.();
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const existingLike = commentLikes.find(l => 
        l.post_id === `comment_${commentId}` && l.user_email === user.email
      );
      
      if (existingLike) {
        await base44.entities.SocialLike.delete(existingLike.id);
      } else {
        await base44.entities.SocialLike.create({
          post_id: `comment_${commentId}`,
          user_email: user.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comment-likes', post.id] });
    },
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString('pt-BR');
  };

  const startEditing = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = (commentId) => {
    if (editContent.trim()) {
      editCommentMutation.mutate({ commentId, content: editContent });
    }
  };

  const handleDeleteComment = (e, commentId) => {
    e.preventDefault();
    e.stopPropagation();
    deleteCommentMutation.mutate(commentId);
  };

  const handleEditComment = (e, comment) => {
    e.preventDefault();
    e.stopPropagation();
    startEditing(comment);
  };

  const isOwner = (comment) => comment.author_email === user?.email;
  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';

  const getCommentLikes = (commentId) => {
    return commentLikes.filter(l => l.post_id === `comment_${commentId}`).length;
  };

  const hasLikedComment = (commentId) => {
    return commentLikes.some(l => l.post_id === `comment_${commentId}` && l.user_email === user?.email);
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-4">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">Respondendo a @{replyingTo.author_name}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 ml-auto"
            onClick={() => setReplyingTo(null)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Add Comment */}
      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={user?.profile_photo} />
          <AvatarFallback className="bg-[#0056ff] text-white text-sm">
            {user?.full_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            value={replyingTo ? replyContent : newComment}
            onChange={(e) => replyingTo ? setReplyContent(e.target.value) : setNewComment(e.target.value)}
            placeholder={replyingTo ? `Responder a @${replyingTo.author_name}...` : "Escreva um comentário..."}
            className="rounded-full text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const content = replyingTo ? replyContent : newComment;
                if (content.trim()) addCommentMutation.mutate(replyingTo?.id || null);
              }
            }}
          />
          <Button
            size="icon"
            onClick={() => {
              const content = replyingTo ? replyContent : newComment;
              if (content.trim()) addCommentMutation.mutate(replyingTo?.id || null);
            }}
            disabled={!(replyingTo ? replyContent : newComment).trim() || addCommentMutation.isPending}
            className="rounded-full bg-[#0056ff] hover:bg-[#0044cc] h-9 w-9 flex-shrink-0"
          >
            {addCommentMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-slate-400 text-sm py-4">Nenhum comentário ainda</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Link to={`${createPageUrl('SocialProfile')}?email=${comment.author_email}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={comment.author_photo} />
                  <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                    {comment.author_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <Link 
                        to={`${createPageUrl('SocialProfile')}?email=${comment.author_email}`}
                        className="font-medium text-xs text-slate-800 hover:text-[#0056ff] truncate"
                      >
                        {comment.author_name}
                      </Link>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{formatDate(comment.created_date)}</span>
                      {comment.is_edited && (
                        <span className="text-[10px] text-slate-400 italic flex-shrink-0">(editado)</span>
                      )}
                    </div>
                    
                    {(isOwner(comment) || isAdmin) && editingId !== comment.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          {isOwner(comment) && (
                            <DropdownMenuItem onSelect={(e) => handleEditComment(e, comment)}>
                              <Pencil className="w-3 h-3 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onSelect={(e) => handleDeleteComment(e, comment.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  {editingId === comment.id ? (
                    <div className="mt-2 flex gap-1">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="text-xs h-7 flex-1"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        onClick={() => saveEdit(comment.id)}
                        disabled={editCommentMutation.isPending}
                        className="h-7 w-7 bg-green-500 hover:bg-green-600"
                      >
                        {editCommentMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={cancelEditing}
                        className="h-7 w-7"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 mt-0.5 break-words">{comment.content}</p>
                  )}
                </div>

                {/* Comment Actions */}
                <div className="flex items-center gap-3 mt-1 ml-1">
                  <button
                    onClick={() => likeCommentMutation.mutate(comment.id)}
                    className={`flex items-center gap-1 text-[10px] ${
                      hasLikedComment(comment.id) ? 'text-red-500' : 'text-slate-400'
                    } hover:text-red-500`}
                  >
                    <Heart className={`w-3 h-3 ${hasLikedComment(comment.id) ? 'fill-current' : ''}`} />
                    {getCommentLikes(comment.id) > 0 && getCommentLikes(comment.id)}
                  </button>
                  <button
                    onClick={() => setReplyingTo(comment)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#0056ff]"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Responder
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}