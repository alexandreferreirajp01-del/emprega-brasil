import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Trash2, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function FeedPost({ post, user }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: likes = [] } = useQuery({
    queryKey: ['post-likes', post.id],
    queryFn: () => base44.entities.CommunityLike.filter({ post_id: post.id }),
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['post-comments', post.id],
    queryFn: () => base44.entities.CommunityComment.filter({ post_id: post.id }, 'created_date'),
    enabled: showComments,
  });

  const userLiked = likes.some(l => l.user_email === user?.email);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (userLiked) {
        const like = likes.find(l => l.user_email === user.email);
        if (like) await base44.entities.CommunityLike.delete(like.id);
      } else {
        await base44.entities.CommunityLike.create({
          post_id: post.id,
          user_email: user.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-likes', post.id] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content) => base44.entities.CommunityComment.create({
      post_id: post.id,
      author_email: user.email,
      author_name: user.full_name || 'Usuário',
      author_photo: user.profile_photo || '',
      content
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', post.id] });
      setNewComment('');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: () => base44.entities.CommunityPost.delete(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => base44.entities.CommunityComment.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', post.id] });
    },
  });

  const canDelete = user?.email === post.author_email || 
    user?.role === 'admin' || 
    user?.subscription_type === 'admin';

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment.trim());
  };

  return (
    <Card className="rounded-xl overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white">
                {post.author_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-800">{post.author_name}</p>
              <p className="text-xs text-slate-500">{moment(post.created_date).fromNow()}</p>
            </div>
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deletePostMutation.mutate()}
              className="text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-slate-700 mb-3 whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Image */}
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt="" 
            className="w-full rounded-xl mb-3 max-h-96 object-cover"
          />
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => likeMutation.mutate()}
            className={`rounded-lg ${userLiked ? 'text-red-500' : 'text-slate-600'}`}
          >
            <Heart className={`w-5 h-5 mr-1 ${userLiked ? 'fill-current' : ''}`} />
            {likes.length}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="rounded-lg text-slate-600"
          >
            <MessageCircle className="w-5 h-5 mr-1" />
            {comments.length || post.comments_count || 0}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Comment Input */}
            <div className="flex gap-2">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={user?.profile_photo} />
                <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                  {user?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Escreva um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="rounded-xl"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                />
                <Button
                  size="icon"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || commentMutation.isPending}
                  className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                >
                  {commentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Comments List */}
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={comment.author_photo} />
                      <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                        {comment.author_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-slate-100 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-slate-800">{comment.author_name}</p>
                        {(user?.email === comment.author_email || user?.role === 'admin') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">{comment.content}</p>
                      <p className="text-xs text-slate-400 mt-1">{moment(comment.created_date).fromNow()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}