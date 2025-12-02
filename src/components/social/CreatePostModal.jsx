import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Image, Video, Link as LinkIcon, Trophy, Briefcase, 
  Loader2, Upload, X 
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CreatePostModal({ open, onOpenChange, user }) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // Carregar dados
  useEffect(() => {
    if (!open) return;
    
    const loadData = async () => {
      try {
        if (postType === 'job_share') {
          const jobsResult = await base44.entities.Job.list('-created_date', 50);
          setJobs(jobsResult || []);
        }
        
        if (user?.email) {
          const profilesResult = await base44.entities.UserProfile.list('-created_date', 200);
          const profile = profilesResult.find(p => p.user_email === user.email);
          setUserProfile(profile || null);
        }
      } catch (e) {
        console.warn('Erro ao carregar dados:', e);
      }
    };
    
    loadData();
  }, [open, postType, user?.email]);

  const handleCreatePost = async () => {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await base44.entities.SocialPost.create({
        author_email: user.email,
        author_name: user.full_name,
        author_photo: user.profile_photo,
        author_occupation: userProfile?.occupation || '',
        content,
        post_type: postType,
        image_url: postType === 'image' ? imageUrl : '',
        video_url: postType === 'video' ? videoUrl : '',
        link_url: postType === 'text' && linkUrl ? linkUrl : '',
        shared_job_id: postType === 'job_share' ? selectedJobId : ''
      });

      // Notificar seguidores
      try {
        const followsResult = await base44.entities.Follow.list('-created_date', 500);
        const followers = followsResult.filter(f => f.following_email === user.email);
        
        for (const follower of followers.slice(0, 20)) {
          await base44.entities.SocialNotification.create({
            user_email: follower.follower_email,
            from_email: user.email,
            from_name: user.full_name,
            from_photo: user.profile_photo,
            type: 'new_post',
            message: `${user.full_name || 'Alguém'} fez uma nova publicação`
          });
        }
      } catch (e) {
        console.warn('Erro ao notificar seguidores:', e);
      }
      
      resetForm();
      onOpenChange(false);
    } catch (e) {
      console.warn('Erro ao criar post:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      setPostType('image');
    } catch (error) {
      console.error('Erro no upload:', error);
    }
    setUploading(false);
  };

  const resetForm = () => {
    setContent('');
    setPostType('text');
    setImageUrl('');
    setVideoUrl('');
    setLinkUrl('');
    setSelectedJobId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Publicação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Author Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user?.profile_photo} />
              <AvatarFallback className="bg-[#0056ff] text-white">
                {user?.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-800">{user?.full_name}</p>
              <p className="text-sm text-slate-500">{userProfile?.occupation || 'Profissional'}</p>
            </div>
          </div>

          {/* Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que você quer compartilhar?"
            className="min-h-[120px] text-base resize-none"
          />

          {/* Media Preview */}
          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="" className="w-full h-48 object-cover rounded-xl" />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => { setImageUrl(''); setPostType('text'); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {postType === 'video' && (
            <div className="space-y-2">
              <Label>URL do Vídeo (YouTube)</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          )}

          {postType === 'achievement' && (
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-700 mb-2">
                <Trophy className="w-5 h-5" />
                <span className="font-medium">Compartilhar Conquista</span>
              </div>
              <p className="text-sm text-yellow-600">
                Descreva sua conquista profissional acima!
              </p>
            </div>
          )}

          {postType === 'job_share' && (
            <div className="space-y-2">
              <Label>Selecione uma vaga para compartilhar</Label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border"
              >
                <option value="">Selecione...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.company}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Post Type Buttons */}
          <div className="flex flex-wrap gap-2">
            <input
              type="file"
              accept="image/*"
              id="image-upload"
              className="hidden"
              onChange={handleImageUpload}
            />
            <label htmlFor="image-upload">
              <Button 
                type="button" 
                variant={postType === 'image' ? 'default' : 'outline'} 
                size="sm" 
                className="rounded-full cursor-pointer"
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Image className="w-4 h-4 mr-2" />}
                  Foto
                </span>
              </Button>
            </label>
            <Button
              type="button"
              variant={postType === 'video' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setPostType(postType === 'video' ? 'text' : 'video')}
            >
              <Video className="w-4 h-4 mr-2" />
              Vídeo
            </Button>
            <Button
              type="button"
              variant={postType === 'achievement' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setPostType(postType === 'achievement' ? 'text' : 'achievement')}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Conquista
            </Button>
            <Button
              type="button"
              variant={postType === 'job_share' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setPostType(postType === 'job_share' ? 'text' : 'job_share')}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Vaga
            </Button>
          </div>

          {/* Submit */}
          <Button
            onClick={handleCreatePost}
            disabled={!content.trim() || isSubmitting}
            className="w-full h-12 bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Publicar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}