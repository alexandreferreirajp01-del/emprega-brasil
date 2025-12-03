import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Heart, MessageCircle, UserPlus, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadNotifications(currentUser.email);
    } catch (e) {
      window.location.href = createPageUrl('Splash');
    }
  };

  const loadNotifications = async (email) => {
    try {
      // Get likes on user's posts
      const [posts, likes, comments, follows] = await Promise.all([
        base44.entities.SocialPost.filter({ author_email: email }),
        base44.entities.SocialLike.list('-created_date', 100),
        base44.entities.SocialComment.list('-created_date', 100),
        base44.entities.Follow.filter({ following_email: email })
      ]);

      const postIds = posts?.map(p => p.id) || [];
      
      const notifs = [];
      
      // Likes on my posts
      likes?.forEach(like => {
        if (postIds.includes(like.post_id) && like.user_email !== email) {
          notifs.push({
            id: like.id,
            type: 'like',
            user_email: like.user_email,
            user_name: like.user_name,
            user_photo: like.user_photo,
            post_id: like.post_id,
            created_date: like.created_date
          });
        }
      });

      // Comments on my posts
      comments?.forEach(comment => {
        if (postIds.includes(comment.post_id) && comment.author_email !== email) {
          notifs.push({
            id: comment.id,
            type: 'comment',
            user_email: comment.author_email,
            user_name: comment.author_name,
            user_photo: comment.author_photo,
            post_id: comment.post_id,
            content: comment.content,
            created_date: comment.created_date
          });
        }
      });

      // New followers
      follows?.forEach(follow => {
        if (follow.follower_email !== email) {
          notifs.push({
            id: follow.id,
            type: 'follow',
            user_email: follow.follower_email,
            created_date: follow.created_date
          });
        }
      });

      // Sort by date
      notifs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      // Get user data for followers
      const userEmails = [...new Set(notifs.filter(n => n.type === 'follow').map(n => n.user_email))];
      if (userEmails.length > 0) {
        const users = await base44.entities.User.list('-created_date', 500);
        notifs.forEach(n => {
          if (n.type === 'follow') {
            const u = users?.find(u => u.email === n.user_email);
            n.user_name = u?.full_name;
            n.user_photo = u?.profile_photo;
          }
        });
      }

      setNotifications(notifs.slice(0, 50));
    } catch (e) {}
    setLoading(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  const getMessage = (notif) => {
    switch (notif.type) {
      case 'like': return 'curtiu sua publicação';
      case 'comment': return `comentou: "${notif.content?.slice(0, 30)}${notif.content?.length > 30 ? '...' : ''}"`;
      case 'follow': return 'começou a seguir você';
      default: return '';
    }
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
        <div className="flex items-center gap-3 p-4">
          <Link to={createPageUrl('Social')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg">Notificações</h1>
        </div>
      </header>

      {/* Notifications */}
      <div className="max-w-lg mx-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma notificação ainda</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map(notif => (
              <Link
                key={`${notif.type}-${notif.id}`}
                to={notif.type === 'follow' 
                  ? `${createPageUrl('SocialProfile')}?email=${notif.user_email}`
                  : `${createPageUrl('PostDetail')}?id=${notif.post_id}`
                }
                className="flex items-center gap-3 p-4 hover:bg-slate-50"
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={notif.user_photo} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {notif.user_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                    {getIcon(notif.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{notif.user_name || 'Alguém'}</span>
                    {' '}{getMessage(notif)}
                  </p>
                  <p className="text-xs text-slate-400">{moment(notif.created_date).fromNow()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}