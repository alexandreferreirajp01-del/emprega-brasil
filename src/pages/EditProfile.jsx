import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function EditProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({
    bio: '',
    occupation: '',
    city: '',
    linkedin_url: '',
    instagram_url: '',
    portfolio_url: '',
    skills: []
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadProfile(currentUser.email);
    } catch (e) {
      window.location.href = createPageUrl('Splash');
    }
  };

  const loadProfile = async (email) => {
    try {
      const profileData = await base44.entities.UserProfile.filter({ user_email: email });
      const existing = profileData?.[0];
      setProfile(existing);
      if (existing) {
        setForm({
          bio: existing.bio || '',
          occupation: existing.occupation || '',
          city: existing.city || '',
          linkedin_url: existing.linkedin_url || '',
          instagram_url: existing.instagram_url || '',
          portfolio_url: existing.portfolio_url || '',
          skills: existing.skills || []
        });
      }
    } catch (e) {}
    setLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_photo: file_url });
      setUser(prev => ({ ...prev, profile_photo: file_url }));
      toast.success('Foto atualizada!');
    } catch (e) {
      toast.error('Erro ao enviar foto');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, form);
      } else {
        await base44.entities.UserProfile.create({
          user_email: user.email,
          ...form
        });
      }
      toast.success('Perfil salvo!');
      window.location.href = `${createPageUrl('SocialProfile')}?email=${user.email}`;
    } catch (e) {
      toast.error('Erro ao salvar');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Link to={`${createPageUrl('SocialProfile')}?email=${user?.email}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">Editar perfil</h1>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[#0056ff] hover:bg-[#0044cc] rounded-xl"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Photo */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user?.profile_photo} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                {user?.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 bg-[#0056ff] text-white rounded-full p-2 cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </label>
          </div>
          <p className="text-sm text-[#0056ff] mt-2">Alterar foto</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={user?.full_name || ''} disabled className="bg-slate-100" />
          </div>

          <div>
            <Label>Biografia</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Conte um pouco sobre você..."
              maxLength={150}
            />
            <p className="text-xs text-slate-400 mt-1">{form.bio.length}/150</p>
          </div>

          <div>
            <Label>Ocupação</Label>
            <Input
              value={form.occupation}
              onChange={(e) => setForm({ ...form, occupation: e.target.value })}
              placeholder="Ex: Desenvolvedor, Designer..."
            />
          </div>

          <div>
            <Label>Cidade</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Ex: João Pessoa - PB"
            />
          </div>

          <div>
            <Label>LinkedIn</Label>
            <Input
              value={form.linkedin_url}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <Label>Instagram</Label>
            <Input
              value={form.instagram_url}
              onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <Label>Portfólio/Site</Label>
            <Input
              value={form.portfolio_url}
              onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label>Habilidades (separadas por vírgula)</Label>
            <Input
              value={form.skills?.join(', ') || ''}
              onChange={(e) => setForm({ 
                ...form, 
                skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
              })}
              placeholder="Ex: JavaScript, React, Design..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}