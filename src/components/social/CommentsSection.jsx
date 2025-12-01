import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CommentsSection({ post, user, onRefresh }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['post-comments', post.id],
    queryFn: async () => {
      return await base44.entities.SocialComment.filter(
        { post_id: post.id, status: 'active' },
        '-created_date',
        50
      ) || [];
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.SocialComment.create({
        post_id: post.id,
        author_email: user.email,
        author_name: user.full_name,
        author_photo: user.profile_photo,
        content: newComment
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
      queryClient.invalidateQueries({ queryKey: ['post-comments', post.id] });
      onRefresh?.();
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

  return (
    <div className="mt-4 pt-4 border-t space-y-4">
      {/* Add Comment */}
      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user?.profile_photo} />
          <AvatarFallback className="bg-[#0056ff] text-white text-sm">
            {user?.full_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentário..."
            className="rounded-full"
            onKeyPress={(e) => e.key === 'Enter' && newComment.trim() && addCommentMutation.mutate()}
          />
          <Button
            size="icon"
            onClick={() => addCommentMutation.mutate()}
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className="rounded-full bg-[#0056ff] hover:bg-[#0044cc] h-10 w-10"
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
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Link to={`${createPageUrl('SocialProfile')}?email=${comment.author_email}`}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.author_photo} />
                  <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                    {comment.author_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Link 
                    to={`${createPageUrl('SocialProfile')}?email=${comment.author_email}`}
                    className="font-medium text-sm text-slate-800 hover:text-[#0056ff]"
                  >
                    {comment.author_name}
                  </Link>
                  <span className="text-xs text-slate-400">{formatDate(comment.created_date)}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}