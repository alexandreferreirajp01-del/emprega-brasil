import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ThumbsUp, MessageSquare, Share2, MoreHorizontal, Trash2, Flag,
  Globe, Send
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
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
import { Input } from "@/components/ui/input";
import UserBadge from "./UserBadge";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function FeedPostCard({ post, user, allUsers, onRefresh }) {
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const author = allUsers?.find(u => u.email === post.author_email);
  const isOwner = user?.email === post.author_email;
  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';

  useEffect(() => {
    const checkLike = async () => {
      if (!user) return;
      try {
        const likes = await base44.entities.SocialLike.filter({ 
          post_id: post.id, 
          user_email: user.email 
        });
        setLiked(likes.length > 0);
      } catch (e) {}
    };
    checkLike();
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    
    try {
      if (liked) {
        const likes = await base44.entities.SocialLike.filter({ 
          post_id: post.id, 
          user_email: user.email 
        });
        if (likes[0]) {
          await base44.entities.SocialLike.delete(likes[0].id);
          setLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
          await base44.entities.SocialPost.update(post.id, {
            likes_count: Math.max(0, (post.likes_count || 1) - 1)
          });
        }
      } else {
        await base44.entities.SocialLike.create({
          post_id: post.id,
          user_email: user.email,
          user_name: user.full_name,
          user_photo: user.profile_photo
        });
        setLiked(true);
        setLikesCount(prev => prev + 1);
        await base44.entities.SocialPost.update(post.id, {
          likes_count: (post.likes_count || 0) + 1
        });
      }
    } catch (e) {}
    setIsLiking(false);
  };

  const handleDelete = async () => {
    if (!confirm('Excluir esta publicação?')) return;
    try {
      await base44.entities.SocialPost.delete(post.id);
      onRefresh?.();
    } catch (e) {}
  };

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({
        title: 'Vagas Abertas PB',
        text: post.content?.slice(0, 100),
        url: window.location.origin + createPageUrl('PostDetail') + '?id=' + post.id
      });
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await base44.entities.SocialComment.filter(
        { post_id: post.id, status: 'active' },
        '-created_date',
        50
      );
      setComments(data || []);
    } catch (e) {}
    setLoadingComments(false);
  };

  const handleComment = async () => {
    if (!newComment.trim() || sendingComment) return;
    setSendingComment(true);
    try {
      await base44.entities.SocialComment.create({
        post_id: post.id,
        author_email: user.email,
        author_name: user.full_name,
        author_photo: user.profile_photo,
        content: newComment.trim()
      });
      await base44.entities.SocialPost.update(post.id, {
        comments_count: (post.comments_count || 0) + 1
      });
      setNewComment('');
      loadComments();
    } catch (e) {}
    setSendingComment(false);
  };

  const openComments = () => {
    setShowComments(true);
    loadComments();
  };

  const contentTruncated = post.content?.length > 300 && !showFullContent;

  return (
    <>
      <Card className="bg-white shadow-sm">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-start justify-between p-4">
            <Link 
              to={`${createPageUrl('SocialProfile')}?email=${post.author_email}`}
              className="flex items-start gap-3"
            >
              <Avatar className="w-12 h-12">
                <AvatarImage src={post.author_photo || author?.profile_photo} />
                <AvatarFallback className="bg-[#0056ff] text-white font-semibold">
                  {post.author_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 hover:text-[#0056ff] hover:underline">
                    {post.author_name || 'Usuário'}
                  </span>
                  <UserBadge user={author} />
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>{moment(post.created_date).fromNow()}</span>
                  <span>•</span>
                  <Globe className="w-3 h-3" />
                </div>
              </div>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="w-5 h-5 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                {(isOwner || isAdmin) && (
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Flag className="w-4 h-4 mr-2" />
                  Denunciar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

          {/* Media */}
          {post.image_url && (
            <div className="border-t border-b">
              <img 
                src={post.image_url} 
                alt="" 
                className="w-full max-h-[500px] object-cover"
              />
            </div>
          )}
          
          {post.video_url && (
            <div className="border-t border-b">
              <video 
                src={post.video_url} 
                controls 
                className="w-full max-h-[500px]"
              />
            </div>
          )}

          {/* Engagement Stats */}
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
              disabled={isLiking}
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
              <MessageSquare className="w-5 h-5 mr-2" />
              Comentar
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
              <div className="text-center py-8 text-slate-500">Carregando...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nenhum comentário ainda. Seja o primeiro!
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <Link to={`${createPageUrl('SocialProfile')}?email=${comment.author_email}`}>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={comment.author_photo} />
                      <AvatarFallback className="bg-slate-200 text-sm">
                        {comment.author_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 bg-slate-100 rounded-xl px-4 py-2">
                    <Link 
                      to={`${createPageUrl('SocialProfile')}?email=${comment.author_email}`}
                      className="font-semibold text-sm hover:underline"
                    >
                      {comment.author_name}
                    </Link>
                    <p className="text-sm text-slate-700">{comment.content}</p>
                    <span className="text-xs text-slate-500">{moment(comment.created_date).fromNow()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profile_photo} />
              <AvatarFallback className="bg-slate-200 text-xs">
                {user?.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              className="flex-1 rounded-full bg-slate-100 border-0"
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            />
            <Button 
              size="icon"
              onClick={handleComment}
              disabled={!newComment.trim() || sendingComment}
              className="rounded-full bg-[#0056ff] hover:bg-[#0044cc]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}