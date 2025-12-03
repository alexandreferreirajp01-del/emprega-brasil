import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Flag
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
    <Card className="rounded-2xl bg-white shadow-sm border-0">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Link 
            to={`${createPageUrl('SocialProfile')}?email=${post.author_email}`}
            className="flex items-center gap-3"
          >
            <Avatar className="w-11 h-11">
              <AvatarImage src={post.author_photo || author?.profile_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white font-semibold">
                {post.author_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-slate-800">{post.author_name || 'Usuário'}</p>
                <UserBadge user={author} />
              </div>
              <p className="text-xs text-slate-500">{moment(post.created_date).fromNow()}</p>
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
            <p className="text-sm text-slate-700 whitespace-pre-line">
              {contentTruncated ? post.content.slice(0, 200) + '...' : post.content}
            </p>
            {post.content.length > 200 && (
              <button 
                onClick={() => setShowFullContent(!showFullContent)}
                className="text-[#0056ff] text-sm font-medium mt-1"
              >
                {showFullContent ? 'Ver menos' : 'Ver mais'}
              </button>
            )}
          </div>
        )}

        {/* Image/Video */}
        {post.image_url && (
          <div className="relative">
            <img 
              src={post.image_url} 
              alt="" 
              className="w-full max-h-[400px] object-cover"
              onDoubleClick={handleLike}
            />
          </div>
        )}
        
        {post.video_url && (
          <div className="relative">
            <video 
              src={post.video_url} 
              controls 
              className="w-full max-h-[400px]"
            />
          </div>
        )}

        {/* Actions */}
        <div className="p-4 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLiking}
                className={`rounded-full px-3 ${liked ? 'text-red-500' : 'text-slate-600'}`}
              >
                <Heart className={`w-5 h-5 mr-1.5 ${liked ? 'fill-current' : ''}`} />
                <span className="text-sm">{likesCount > 0 ? likesCount : ''}</span>
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => onCommentClick?.(post)}
                className="rounded-full px-3 text-slate-600"
              >
                <MessageCircle className="w-5 h-5 mr-1.5" />
                <span className="text-sm">{post.comments_count > 0 ? post.comments_count : ''}</span>
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="rounded-full px-3 text-slate-600"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Likes count clickable */}
          {likesCount > 0 && (
            <button 
              onClick={() => onLikesClick?.(post)}
              className="text-sm text-slate-500 mt-2 hover:text-[#0056ff]"
            >
              {likesCount} curtida{likesCount !== 1 ? 's' : ''}
            </button>
          )}

          {/* Comments count */}
          {(post.comments_count || 0) > 0 && (
            <button 
              onClick={() => onCommentClick?.(post)}
              className="text-sm text-slate-500 block hover:text-[#0056ff]"
            >
              Ver {post.comments_count} comentário{post.comments_count !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}