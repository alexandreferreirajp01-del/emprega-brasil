import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Flag, 
  Bookmark, Send, Play
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
import UserBadge from "./UserBadge";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function PostCard({ post, user, allUsers, onRefresh, onCommentClick, onLikesClick }) {
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showFullContent, setShowFullContent] = useState(false);

  const author = allUsers?.find(u => u.email === post.author_email);
  const isOwner = user?.email === post.author_email;
  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';

  // Check if user liked
  React.useEffect(() => {
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
      }
    } catch (e) {
      console.error(e);
    }
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

  const contentTruncated = post.content?.length > 200 && !showFullContent;

  return (
    <Card className="rounded-none border-x-0 border-t-0 bg-white">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <Link 
            to={`${createPageUrl('SocialProfile')}?email=${post.author_email}`}
            className="flex items-center gap-3"
          >
            <Avatar className="w-10 h-10 ring-2 ring-pink-500 ring-offset-2">
              <AvatarImage src={post.author_photo || author?.profile_photo} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {post.author_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.author_name || 'Usuário'}</p>
              <p className="text-xs text-slate-500">{moment(post.created_date).fromNow()}</p>
            </div>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

        {/* Image/Video */}
        {post.image_url && (
          <div className="relative bg-black">
            <img 
              src={post.image_url} 
              alt="" 
              className="w-full max-h-[500px] object-contain"
              onDoubleClick={handleLike}
            />
          </div>
        )}
        
        {post.video_url && (
          <div className="relative bg-black">
            <video 
              src={post.video_url} 
              controls 
              className="w-full max-h-[500px]"
            />
          </div>
        )}

        {/* Actions */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleLike}
                disabled={isLiking}
                className="hover:opacity-60 transition-opacity"
              >
                <Heart 
                  className={`w-7 h-7 ${liked ? 'fill-red-500 text-red-500' : 'text-slate-800'}`} 
                />
              </button>
              <button 
                onClick={() => onCommentClick?.(post)}
                className="hover:opacity-60 transition-opacity"
              >
                <MessageCircle className="w-7 h-7 text-slate-800" />
              </button>
              <button 
                onClick={handleShare}
                className="hover:opacity-60 transition-opacity"
              >
                <Send className="w-7 h-7 text-slate-800" />
              </button>
            </div>
            <button className="hover:opacity-60 transition-opacity">
              <Bookmark className="w-7 h-7 text-slate-800" />
            </button>
          </div>

          {/* Likes */}
          {likesCount > 0 && (
            <button 
              onClick={() => onLikesClick?.(post)}
              className="font-semibold text-sm mb-1 hover:opacity-60"
            >
              {likesCount} curtida{likesCount !== 1 ? 's' : ''}
            </button>
          )}

          {/* Content */}
          {post.content && (
            <div className="text-sm">
              <span className="font-semibold mr-2">{post.author_name}</span>
              <span className="whitespace-pre-line">
                {contentTruncated ? post.content.slice(0, 200) + '...' : post.content}
              </span>
              {post.content.length > 200 && (
                <button 
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-slate-500 ml-1"
                >
                  {showFullContent ? 'menos' : 'mais'}
                </button>
              )}
            </div>
          )}

          {/* Comments count */}
          {(post.comments_count || 0) > 0 && (
            <button 
              onClick={() => onCommentClick?.(post)}
              className="text-slate-500 text-sm mt-1"
            >
              Ver {post.comments_count} comentário{post.comments_count !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}