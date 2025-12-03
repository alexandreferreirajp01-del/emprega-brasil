import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ThumbsUp, MessageSquare, Share2, Bookmark, MoreHorizontal, 
  Trash2, Edit, Globe, Send, ChevronDown, ChevronUp
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function PostCard({ post, user, onRefresh, onEdit }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showFullContent, setShowFullContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReplies, setShowReplies] = useState({});

  const isOwner = user?.email === post.author_email;
  const isAdmin = user?.role === 'admin' || user?.subscription_type === 'admin';

  useEffect(() => {
    if (!user) return;
    
    const checkUserActions = async () => {
      try {
        const [likes, saves] = await Promise.all([
          base44.entities.SocialLike.filter({ post_id: post.id, user_email: user.email }),
          base44.entities.SocialSave.filter({ post_id: post.id, user_email: user.email })
        ]);
        setLiked(likes.length > 0);
        setSaved(saves.length > 0);
      } catch (e) {}
    };
    checkUserActions();
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user || loading) return;
    setLoading(true);
    
    try {
      if (liked) {
        const likes = await base44.entities.SocialLike.filter({ post_id: post.id, user_email: user.email });
        if (likes[0]) {
          await base44.entities.SocialLike.delete(likes[0].id);
          setLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
          await base44.entities.SocialPost.update(post.id, { likes_count: Math.max(0, likesCount - 1) });
        }
      } else {
        await base44.entities.SocialLike.create({ post_id: post.id, user_email: user.email });
        setLiked(true);
        setLikesCount(prev => prev + 1);
        await base44.entities.SocialPost.update(post.id, { likes_count: likesCount + 1 });
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || loading) return;
    setLoading(true);
    
    try {
      if (saved) {
        const saves = await base44.entities.SocialSave.filter({ post_id: post.id, user_email: user.email });
        if (saves[0]) {
          await base44.entities.SocialSave.delete(saves[0].id);
          setSaved(false);
        }
      } else {
        await base44.entities.SocialSave.create({ post_id: post.id, user_email: user.email });
        setSaved(true);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Vagas Abertas PB',
        text: post.content?.slice(0, 100),
        url: window.location.origin + createPageUrl('Social')
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + createPageUrl('Social'));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Excluir esta publicação?')) return;
    try {
      await base44.entities.SocialPost.delete(post.id);
      onRefresh?.();
    } catch (e) {}
  };

  const loadComments = async () => {
    try {
      const data = await base44.entities.SocialComment.filter(
        { post_id: post.id, status: 'active' },
        '-created_date',
        100
      );
      setComments(data || []);
    } catch (e) {}
  };

  const handleToggleComments = () => {
    if (!showComments) loadComments();
    setShowComments(!showComments);
  };

  const handleComment = async () => {
    if (!newComment.trim() || !user) return;
    setLoading(true);
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
    setLoading(false);
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim() || !user) return;
    setLoading(true);
    try {
      await base44.entities.SocialComment.create({
        post_id: post.id,
        parent_id: parentId,
        author_email: user.email,
        author_name: user.full_name,
        author_photo: user.profile_photo,
        content: replyText.trim()
      });
      setReplyTo(null);
      setReplyText('');
      loadComments();
    } catch (e) {}
    setLoading(false);
  };

  const parentComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

  const contentTruncated = post.content?.length > 300 && !showFullContent;

  const getPlanBadge = (subscriptionType, role) => {
    if (role === 'admin' || subscriptionType === 'admin') {
      return <Badge className="bg-purple-100 text-purple-700 text-xs">Admin</Badge>;
    }
    if (subscriptionType === 'recruiter') {
      return <Badge className="bg-blue-100 text-blue-700 text-xs">Recrutador</Badge>;
    }
    if (subscriptionType === 'premium') {
      return <Badge className="bg-green-100 text-green-700 text-xs">Premium</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-600 text-xs">Básico</Badge>;
  };

  return (
    <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start justify-between p-4">
          <Link 
            to={`${createPageUrl('SocialProfile')}?email=${post.author_email}`}
            className="flex items-center gap-3"
          >
            <Avatar className="w-12 h-12 border-2 border-slate-100">
              <AvatarImage src={post.author_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white font-semibold">
                {post.author_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800 hover:text-[#0056ff]">
                  {post.author_name || 'Usuário'}
                </span>
              </div>
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
                {isOwner && (
                  <DropdownMenuItem onClick={() => onEdit?.(post)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
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
          <div className="border-t border-b border-slate-100">
            <img src={post.image_url} alt="" className="w-full max-h-[500px] object-cover" />
          </div>
        )}

        {/* Stats */}
        {(likesCount > 0 || (post.comments_count || 0) > 0) && (
          <div className="px-4 py-2 flex items-center justify-between text-sm text-slate-500 border-t border-slate-100">
            {likesCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-5 h-5 bg-[#0056ff] rounded-full flex items-center justify-center">
                  <ThumbsUp className="w-3 h-3 text-white" />
                </span>
                {likesCount}
              </span>
            )}
            {(post.comments_count || 0) > 0 && (
              <button onClick={handleToggleComments} className="hover:text-[#0056ff] hover:underline">
                {post.comments_count} comentário{post.comments_count !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-2 py-1 border-t border-slate-100 flex items-center">
          <Button 
            variant="ghost"
            onClick={handleLike}
            disabled={loading || !user}
            className={`flex-1 rounded-lg h-10 ${liked ? 'text-[#0056ff]' : 'text-slate-600'}`}
          >
            <ThumbsUp className={`w-5 h-5 mr-2 ${liked ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">Curtir</span>
          </Button>
          <Button 
            variant="ghost"
            onClick={handleToggleComments}
            className="flex-1 rounded-lg text-slate-600 h-10"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Comentar</span>
          </Button>
          <Button 
            variant="ghost"
            onClick={handleSave}
            disabled={loading || !user}
            className={`flex-1 rounded-lg h-10 ${saved ? 'text-yellow-500' : 'text-slate-600'}`}
          >
            <Bookmark className={`w-5 h-5 mr-2 ${saved ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">Salvar</span>
          </Button>
          <Button 
            variant="ghost"
            onClick={handleShare}
            className="flex-1 rounded-lg text-slate-600 h-10"
          >
            <Share2 className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Compartilhar</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-slate-100 p-4 space-y-4">
            {/* New Comment Input */}
            {user && (
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.profile_photo} />
                  <AvatarFallback className="bg-slate-200 text-xs">{user.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="flex-1 rounded-full bg-slate-100 border-0"
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                />
                <Button 
                  size="icon"
                  onClick={handleComment}
                  disabled={!newComment.trim() || loading}
                  className="rounded-full bg-[#0056ff] hover:bg-[#0044cc] h-9 w-9"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {parentComments.map(comment => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex gap-2">
                    <Link to={`${createPageUrl('SocialProfile')}?email=${comment.author_email}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.author_photo} />
                        <AvatarFallback className="bg-slate-200 text-xs">{comment.author_name?.[0]}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="bg-slate-100 rounded-xl px-3 py-2">
                        <Link to={`${createPageUrl('SocialProfile')}?email=${comment.author_email}`}>
                          <span className="font-semibold text-sm hover:underline">{comment.author_name}</span>
                        </Link>
                        <p className="text-sm text-slate-700">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 px-2">
                        <span>{moment(comment.created_date).fromNow()}</span>
                        <button onClick={() => setReplyTo(comment.id)} className="font-medium hover:text-[#0056ff]">
                          Responder
                        </button>
                      </div>
                      
                      {/* Reply Input */}
                      {replyTo === comment.id && (
                        <div className="flex items-center gap-2 mt-2 ml-2">
                          <Input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escreva sua resposta..."
                            className="flex-1 rounded-full bg-slate-50 border text-sm h-8"
                            onKeyDown={(e) => e.key === 'Enter' && handleReply(comment.id)}
                          />
                          <Button 
                            size="sm"
                            onClick={() => handleReply(comment.id)}
                            disabled={!replyText.trim() || loading}
                            className="rounded-full bg-[#0056ff] h-8 px-3"
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>
                      )}

                      {/* Replies */}
                      {getReplies(comment.id).length > 0 && (
                        <div className="mt-2 ml-2">
                          <button 
                            onClick={() => setShowReplies({...showReplies, [comment.id]: !showReplies[comment.id]})}
                            className="text-xs text-[#0056ff] flex items-center gap-1"
                          >
                            {showReplies[comment.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {getReplies(comment.id).length} resposta{getReplies(comment.id).length !== 1 ? 's' : ''}
                          </button>
                          {showReplies[comment.id] && (
                            <div className="space-y-2 mt-2">
                              {getReplies(comment.id).map(reply => (
                                <div key={reply.id} className="flex gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={reply.author_photo} />
                                    <AvatarFallback className="bg-slate-200 text-xs">{reply.author_name?.[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
                                    <span className="font-semibold text-xs">{reply.author_name}</span>
                                    <p className="text-xs text-slate-700">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}