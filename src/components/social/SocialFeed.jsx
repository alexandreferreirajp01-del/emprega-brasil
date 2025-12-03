import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

import SocialPostCard from "./SocialPostCard";

export default function SocialFeed({ user }) {
  const [newPost, setNewPost] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => base44.entities.SocialPost.filter({ status: 'active' }, '-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      setNewPost('');
      setImageUrl('');
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (e) {}
    setUploading(false);
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    createMutation.mutate({
      author_email: user.email,
      author_name: user.full_name,
      author_photo: user.profile_photo,
      content: newPost.trim(),
      image_url: imageUrl || null
    });
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'likes') return (b.likes_count || 0) - (a.likes_count || 0);
    if (sortBy === 'comments') return (b.comments_count || 0) - (a.comments_count || 0);
    return new Date(b.created_date) - new Date(a.created_date);
  });

  return (
    <div className="p-4 space-y-4">
      {/* Create Post */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.profile_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white">
                {user?.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="O que você quer compartilhar?"
                className="min-h-[80px] resize-none border-slate-200"
              />
              {imageUrl && (
                <div className="relative">
                  <img src={imageUrl} alt="" className="w-full max-h-48 object-cover rounded-lg" />
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => setImageUrl('')}
                  >
                    Remover
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <div className="flex items-center gap-2 text-slate-500 hover:text-[#0056ff]">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Image className="w-5 h-5" />}
                    <span className="text-sm">Foto</span>
                  </div>
                </label>
                <Button 
                  onClick={handlePost}
                  disabled={!newPost.trim() || createMutation.isPending}
                  className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sort */}
      <div className="flex justify-end">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="likes">Mais curtidos</SelectItem>
            <SelectItem value="comments">Mais comentados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          Nenhuma publicação ainda. Seja o primeiro a publicar!
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map(post => (
            <SocialPostCard key={post.id} post={post} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}