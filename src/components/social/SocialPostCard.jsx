import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  ThumbsUp, MessageCircle, Share2, Bookmark, MoreHorizontal, 
  Trash2, Send, Loader2, Globe
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function SocialPostCard({ post, user }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const queryClient = useQueryClient();

  const isOwner = user?.email === post.author_email;
  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      try {
        const [likes, saves] = await Promise.all([
          base44.entities.SocialLike.filter({ post_id: post.id, user_email: user.email }),
          base44.entities.SocialSave.filter({ post_id: post.id, user_email: user.email })
        ]);
        setLiked(likes.length > 0);
        setSaved(saves.length > 0);
      } catch (e) {}
    };
    checkStatus();
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user) return;
    try {
      if (liked) {
        const likes = await base44.entities.SocialLike.filter({ post_id: post.id, user_email: user.email });
        if (likes[0]) await base44.entities.SocialLike.delete(likes[0].id);
        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        await base44.entities.SocialPost.update(post.id, { likes_count: Math.max(0, likesCount - 1) });
      } else {
        await base44.entities.SocialLike.create({ post_id: post.id, user_email: user.email });
        setLiked(true);
        setLikesCount(prev => prev + 1);
        await base44.entities.SocialPost.update(post.id, { likes_count: likesCount + 1 });
      }
    } catch (e) {}
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      if (saved) {
        const saves = await base44.entities.SocialSave.filter({ post_id: post.id, user_email: user.email });
        if (saves[0]) await base44.entities.SocialSave.delete(saves[0].id);
        setSaved(false);
      } else {
        await base44.entities.SocialSave.create({ post_id: post.id, user_email: user.email });
        setSaved(true);
      }
    } catch (e) {}
  };

  const handleDelete = async () => {
    if (!confirm('Excluir esta publicação?')) return;
    try {
      await base44.entities.SocialPost.delete(post.id);
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    } catch (e) {}
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Vagas Abertas PB',
        text: post.content?.slice(0, 100),
        url: window.location.origin + createPageUrl('SocialPost') + '?id=' + post.id
      });
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await base44.entities.SocialComment.filter({ post_id: post.id, status: 'active' }, 'created_date', 100);
      setComments(data || []);
    } catch (e) {}
    setLoadingComments(false);
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      await base44.entities.SocialComment.create({
        post_id: post.id,
        parent_id: replyTo?.id || null,
        author_email: user.email,
        author_name: user.full_name,
        author_photo: user.profile_photo,
        content: newComment.trim()
      });
      await base44.entities.SocialPost.update(post.id, { comments_count: (post.comments_count || 0) + 1 });
      setNewComment('');
      setReplyTo(null);
      loadComments();
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    } catch (e) {}
  };

  const openComments = () => {
    setShowComments(true);
    loadComments();
  };

  const contentTruncated = post.content?.length > 300 && !showFullContent;

  const mainComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

  return (
    <>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-start justify-between p-4">
            <Link to={`${createPageUrl('SocialProfile')}?email=${post.author_email}`} className="flex items-start gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={post.author_photo} />
                <AvatarFallback className="bg-[#0056ff] text-white font-semibold">
                  {post.author_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="font-semibold text-slate-800 hover:text-[#0056ff] hover:underline">
                  {post.author_name || 'Usuário'}
                </span>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>{moment(post.created_date).fromNow()}</span>
                  <span>•</span>
                  <Globe className="w-3 h-3" />
                </div>
              </div>
            </Link>
            
            {(isOwner || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="w-5 h-5 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          {post.content && (
            <div className="px-4 pb-3">
              <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                {contentTruncated ? post.content.slice(0, 300) + '...' : post.content}
              </p>
              {post.content.length > 300 && (
                <button 
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-[#0056ff] text-sm font-medium mt-1 hover:underline"
                >
                  {showFullContent ? 'ver menos' : 'ver mais'}
                </button>
              )}
            </div>
          )}

          {/* Image */}
          {post.image_url && (
            <div className="border-t border-b">
              <img src={post.image_url} alt="" className="w-full max-h-[500px] object-cover" />
            </div>
          )}

          {/* Stats */}
          {(likesCount > 0 || (post.comments_count || 0) > 0) && (
            <div className="px-4 py-2 flex items-center justify-between text-sm text-slate-500 border-t">
              {likesCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-5 h-5 bg-[#0056ff] rounded-full flex items-center justify-center">
                    <ThumbsUp className="w-3 h-3 text-white" />
                  </span>
                  {likesCount}
                </span>
              )}
              {(post.comments_count || 0) > 0 && (
                <button onClick={openComments} className="hover:text-[#0056ff] hover:underline">
                  {post.comments_count} comentário{post.comments_count !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="px-2 py-1 border-t flex items-center">
            <Button 
              variant="ghost"
              onClick={handleLike}
              className={`flex-1 rounded-lg ${liked ? 'text-[#0056ff]' : 'text-slate-600'}`}
            >
              <ThumbsUp className={`w-5 h-5 mr-2 ${liked ? 'fill-current' : ''}`} />
              Curtir
            </Button>
            <Button 
              variant="ghost"
              onClick={openComments}
              className="flex-1 rounded-lg text-slate-600"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Comentar
            </Button>
            <Button 
              variant="ghost"
              onClick={handleSave}
              className={`flex-1 rounded-lg ${saved ? 'text-[#0056ff]' : 'text-slate-600'}`}
            >
              <Bookmark className={`w-5 h-5 mr-2 ${saved ? 'fill-current' : ''}`} />
              Salvar
            </Button>
            <Button 
              variant="ghost"
              onClick={handleShare}
              className="flex-1 rounded-lg text-slate-600"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Compartilhar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Comentários</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {loadingComments ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
            ) : mainComments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Nenhum comentário ainda.</div>
            ) : (
              mainComments.map(comment => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={comment.author_photo} />
                      <AvatarFallback className="bg-slate-200 text-sm">{comment.author_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-slate-100 rounded-xl px-4 py-2">
                        <span className="font-semibold text-sm">{comment.author_name}</span>
                        <p className="text-sm text-slate-700">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 px-2">
                        <span className="text-xs text-slate-500">{moment(comment.created_date).fromNow()}</span>
                        <button 
                          onClick={() => setReplyTo(comment)}
                          className="text-xs text-slate-500 hover:text-[#0056ff] font-medium"
                        >
                          Responder
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Replies */}
                  {getReplies(comment.id).map(reply => (
                    <div key={reply.id} className="flex gap-3 ml-12">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={reply.author_photo} />
                        <AvatarFallback className="bg-slate-200 text-xs">{reply.author_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-slate-100 rounded-xl px-3 py-2">
                          <span className="font-semibold text-xs">{reply.author_name}</span>
                          <p className="text-xs text-slate-700">{reply.content}</p>
                        </div>
                        <span className="text-xs text-slate-500 ml-2">{moment(reply.created_date).fromNow()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="pt-4 border-t space-y-2">
            {replyTo && (
              <div className="flex items-center justify-between bg-slate-100 rounded-lg px-3 py-2">
                <span className="text-sm text-slate-600">Respondendo a {replyTo.author_name}</span>
                <button onClick={() => setReplyTo(null)} className="text-xs text-slate-500 hover:text-red-500">Cancelar</button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profile_photo} />
                <AvatarFallback className="bg-slate-200 text-xs">{user?.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? "Escreva uma resposta..." : "Adicione um comentário..."}
                className="flex-1 rounded-full bg-slate-100 border-0"
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              <Button 
                size="icon"
                onClick={handleComment}
                disabled={!newComment.trim()}
                className="rounded-full bg-[#0056ff] hover:bg-[#0044cc]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}