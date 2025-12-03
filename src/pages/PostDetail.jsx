import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  Trash2, Flag, Loader2
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
import moment from "moment";
import UserBadge from "@/components/social/UserBadge";

export default function PostDetail() {
  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  useEffect(() => {
    checkAuth();
  }, [postId]);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadData(currentUser.email);
    } catch (e) {
      window.location.href = createPageUrl('Splash');
    }
  };

  const loadData = async (email) => {
    try {
      const [postData, commentsData, likesData, usersData] = await Promise.all([
        base44.entities.SocialPost.filter({ id: postId }),
        base44.entities.SocialComment.filter({ post_id: postId, status: 'active' }, '-created_date', 100),
        base44.entities.SocialLike.filter({ post_id: postId }),
        base44.entities.User.list('-created_date', 500)
      ]);
      
      setPost(postData?.[0]);
      setComments(commentsData || []);
      setLikes(likesData || []);
      setAllUsers(usersData || []);
      setLiked(likesData?.some(l => l.user_email === email));
    } catch (e) {}
    setLoading(false);
  };

  const handleLike = async () => {
    try {
      if (liked) {
        const myLike = likes.find(l => l.user_email === user.email);
        if (myLike) {
          await base44.entities.SocialLike.delete(myLike.id);
          setLikes(prev => prev.filter(l => l.id !== myLike.id));
          setLiked(false);
        }
      } else {
        const newLike = await base44.entities.SocialLike.create({
          post_id: postId,
          user_email: user.email,
          user_name: user.full_name,
          user_photo: user.profile_photo
        });
        setLikes(prev => [...prev, newLike]);
        setLiked(true);
      }
    } catch (e) {}
  };

  const handleComment = async () => {
    if (!newComment.trim() || isSending) return;
    
    setIsSending(true);
    try {
      const comment = await base44.entities.SocialComment.create({
        post_id: postId,
        author_email: user.email,
        author_name: user.full_name,
        author_photo: user.profile_photo,
        content: newComment.trim()
      });
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (e) {}
    setIsSending(false);
  };

  const handleDelete = async () => {
    if (!confirm('Excluir esta publicação?')) return;
    try {
      await base44.entities.SocialPost.delete(postId);
      window.location.href = createPageUrl('Social');
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <p className="text-slate-500 mb-4">Publicação não encontrada</p>
        <Link to={createPageUrl('Social')}>
          <Button>Voltar</Button>
        </Link>
      </div>
    );
  }

  const authorUser = allUsers.find(u => u.email === post.author_email);
  const isOwner = user?.email === post.author_email;
  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="flex items-center gap-3 p-3">
          <Link to={createPageUrl('Social')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Publicação</h1>
        </div>
      </header>

      {/* Post */}
      <div className="max-w-lg mx-auto">
        {/* Author */}
        <div className="flex items-center justify-between p-3">
          <Link 
            to={`${createPageUrl('SocialProfile')}?email=${post.author_email}`}
            className="flex items-center gap-3"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author_photo || authorUser?.profile_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white font-semibold">
                {post.author_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.author_name}</p>
              <p className="text-xs text-slate-500">{moment(post.created_date).fromNow()}</p>
            </div>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
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

        {/* Image */}
        {post.image_url && (
          <div className="bg-black">
            <img src={post.image_url} alt="" className="w-full max-h-[600px] object-contain" />
          </div>
        )}

        {/* Actions */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button onClick={handleLike}>
                <Heart className={`w-7 h-7 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <MessageCircle className="w-7 h-7" />
              <Send className="w-7 h-7" />
            </div>
            <Bookmark className="w-7 h-7" />
          </div>

          <p className="font-semibold text-sm">{likes.length} curtidas</p>

          {/* Content */}
          {post.content && (
            <div className="mt-2">
              <span className="font-semibold text-sm mr-2">{post.author_name}</span>
              <span className="text-sm whitespace-pre-line">{post.content}</span>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-2 uppercase">
            {moment(post.created_date).format('D [de] MMMM [de] YYYY')}
          </p>
        </div>

        {/* Comments */}
        <div className="border-t">
          <div className="p-3 space-y-3">
            {comments.map(comment => (
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
                  <p className="text-sm">
                    <Link 
                      to={`${createPageUrl('SocialProfile')}?email=${comment.author_email}`}
                      className="font-semibold mr-2"
                    >
                      {comment.author_name}
                    </Link>
                    {comment.content}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {moment(comment.created_date).fromNow()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
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
            className="flex-1 border-0 bg-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
          />
          <Button 
            variant="ghost" 
            onClick={handleComment}
            disabled={!newComment.trim() || isSending}
            className="text-[#0056ff] font-semibold"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publicar'}
          </Button>
        </div>
      </div>
    </div>
  );
}