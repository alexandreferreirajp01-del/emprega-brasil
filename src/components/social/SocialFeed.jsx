import React from 'react';
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeedPostCard from "./FeedPostCard";

export default function SocialFeed({ posts, user, allUsers, onRefresh }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="font-semibold text-slate-700 mb-2">Nenhuma publicação ainda</h3>
        <p className="text-slate-500 text-sm">
          Seja o primeiro a compartilhar algo com a comunidade!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <FeedPostCard 
          key={post.id}
          post={post}
          user={user}
          allUsers={allUsers}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}