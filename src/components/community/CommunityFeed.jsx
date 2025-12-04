import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Send, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FeedPost from "./FeedPost";

export default function CommunityFeed({ user }) {
  const [newPost, setNewPost] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['community-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 50),
    refetchInterval: 10000,
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.CommunityPost.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setNewPost('');
      setImageUrl('');
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitPost = () => {
    if (!newPost.trim() && !imageUrl) return;
    
    createPostMutation.mutate({
      author_email: user.email,
      author_name: user.full_name || 'Usuário',
      author_photo: user.profile_photo || '',
      content: newPost.trim(),
      image_url: imageUrl,
      likes_count: 0,
      comments_count: 0
    });
  };

  return (
    <div className="space-y-4">
      {/* Create Post */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={user?.profile_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white">
                {user?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="O que você está pensando?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[80px] rounded-xl resize-none"
              />
              
              {imageUrl && (
                <div className="relative">
                  <img src={imageUrl} alt="Preview" className="w-full max-h-48 object-cover rounded-xl" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={() => setImageUrl('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button variant="outline" size="sm" className="rounded-lg" asChild>
                    <span>
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Image className="w-4 h-4 mr-2" />
                      )}
                      {uploading ? 'Enviando...' : 'Foto'}
                    </span>
                  </Button>
                </label>
                
                <Button
                  onClick={handleSubmitPost}
                  disabled={(!newPost.trim() && !imageUrl) || createPostMutation.isPending}
                  className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
                >
                  {createPostMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#0056ff]" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500">Nenhuma publicação ainda. Seja o primeiro a postar!</p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <FeedPost key={post.id} post={post} user={user} />
        ))
      )}
    </div>
  );
}