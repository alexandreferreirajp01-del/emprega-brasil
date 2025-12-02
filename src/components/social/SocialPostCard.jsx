import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, MessageCircle, Share2, MoreVertical, Flag, Trash2, 
  Briefcase, ExternalLink, Trophy
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReportDialog from "./ReportDialog";
import SharePostDialog from "./SharePostDialog";
import PlanBadge from "./PlanBadge";

export default function SocialPostCard({ post, user, likesCount = 0, userLiked = false, onRefresh }) {
  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [authorUser, setAuthorUser] = useState(null);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carregar dados uma vez
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const [usersResult, likesResult, commentsResult] = await Promise.all([
          base44.entities.User.list('-created_date', 500),
          base44.entities.SocialLike.list('-created_date', 2000),
          base44.entities.SocialComment.list('-created_date', 2000)
        ]);
        
        if (isMounted) {
          const author = usersResult.find(u => u.email === post.author_email);
          setAuthorUser(author || null);
          
          const postLikes = likesResult.filter(l => l.post_id === post.id);
          setLikes(postLikes);
          
          const postComments = commentsResult.filter(c => 
            c.post_id === post.id && (c.status === 'active' || !c.status)
          );
          setComments(postComments);
        }
      } catch (e) {
        console.warn('Erro ao carregar dados do post:', e);
      }
    };
    
    loadData();
    return () => { isMounted = false; };
  }, [post.id, post.author_email]);

  const realLikesCount = likes.length;
  const realCommentsCount = comments.length;
  const realUserLiked = likes.some(l => l.user_email === user?.email);

  const handleLike = async () => {
    if (isLiking || !user) return;
    setIsLiking(true);
    
    try {
      if (realUserLiked) {
        const userLike = likes.find(l => l.user_email === user.email);
        if (userLike) {
          await base44.entities.SocialLike.delete(userLike.id);
          setLikes(prev => prev.filter(l => l.id !== userLike.id));
        }
      } else {
        const newLike = await base44.entities.SocialLike.create({
          post_id: post.id,
          user_email: user.email
        });
        setLikes(prev => [...prev, newLike]);
        
        if (post.author_email !== user.email) {
          await base44.entities.SocialNotification.create({
            user_email: post.author_email,
            from_email: user.email,
            from_name: user.full_name,
            from_photo: user.profile_photo,
            type: 'like',
            post_id: post.id,
            message: `${user.full_name || 'Alguém'} curtiu sua publicação`
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao curtir:', e);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    
    try {
      await base44.entities.SocialPost.delete(post.id);
      onRefresh?.();
    } catch (e) {
      console.warn('Erro ao deletar:', e);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-BR');
  };

  const isOwner = post.author_email === user?.email;
  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';

  return (
    <Card className="rounded-xl overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <Link to={`${createPageUrl('SocialProfile')}?email=${post.author_email}`} className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={post.author_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white">
                {post.author_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-800 hover:text-[#0056ff]">
                  {post.author_name || 'Usuário'}
                </p>
                <PlanBadge user={authorUser} />
              </div>
              <p className="text-sm text-slate-500">
                {post.author_occupation || 'Profissional'} • {formatDate(post.created_date)}
              </p>
            </div>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(isOwner || isAdmin) && (
                <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
              {!isOwner && (
                <DropdownMenuItem onClick={() => setShowReport(true)}>
                  <Flag className="w-4 h-4 mr-2" />
                  Denunciar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="mb-4">
          {post.post_type === 'achievement' && (
            <Badge className="bg-yellow-100 text-yellow-700 mb-2">
              <Trophy className="w-3 h-3 mr-1" />
              Conquista
            </Badge>
          )}
          
          <p className="text-slate-700 whitespace-pre-line">{post.content}</p>
          
          {post.image_url && (
            <img 
              src={post.image_url} 
              alt="" 
              className="mt-3 rounded-xl max-h-96 w-full object-cover"
            />
          )}
          
          {post.video_url && (
            <div className="mt-3 rounded-xl overflow-hidden">
              <iframe 
                src={post.video_url.replace('watch?v=', 'embed/')} 
                className="w-full h-64"
                allowFullScreen
              />
            </div>
          )}
          
          {post.link_url && (
            <a 
              href={post.link_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-slate-100"
            >
              <ExternalLink className="w-4 h-4 text-[#0056ff]" />
              <span className="text-sm text-[#0056ff] truncate">{post.link_url}</span>
            </a>
          )}
          
          {post.post_type === 'job_share' && post.shared_job_id && (
            <Link to={`${createPageUrl('JobDetail')}?id=${post.shared_job_id}`}>
              <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100">
                <div className="flex items-center gap-2 text-[#0056ff]">
                  <Briefcase className="w-4 h-4" />
                  <span className="font-medium">Ver vaga compartilhada</span>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
          <span>{realLikesCount} curtida{realLikesCount !== 1 ? 's' : ''}</span>
          <span>{realCommentsCount} comentário{realCommentsCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t">
          <Button
            variant="ghost"
            onClick={handleLike}
            disabled={isLiking}
            className={`flex-1 rounded-xl ${realUserLiked ? 'text-red-500 hover:text-red-600' : 'text-slate-600'}`}
          >
            <Heart className={`w-5 h-5 mr-2 ${realUserLiked ? 'fill-current' : ''}`} />
            Curtir
          </Button>
          <Link to={`${createPageUrl('PostDetail')}?id=${post.id}`} className="flex-1">
            <Button
              variant="ghost"
              className="w-full rounded-xl text-slate-600"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Comentar
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={() => setShowShare(true)}
            className="flex-1 rounded-xl text-slate-600"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Compartilhar
          </Button>
        </div>

        {/* Comments removed - now opens in PostDetail page */}
      </CardContent>

      <ReportDialog 
        open={showReport} 
        onOpenChange={setShowReport}
        contentType="post"
        contentId={post.id}
        user={user}
      />

      <SharePostDialog
        open={showShare}
        onOpenChange={setShowShare}
        post={post}
      />
    </Card>
  );
}