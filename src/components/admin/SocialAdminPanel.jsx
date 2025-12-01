import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, MessageSquare, Flag, Trash2, Eye, 
  TrendingUp, Heart, Ban, Check, Loader2
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0056ff', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function SocialAdminPanel({ showToast }) {
  const queryClient = useQueryClient();

  const { data: posts = [] } = useQuery({
    queryKey: ['all-social-posts'],
    queryFn: async () => await base44.entities.SocialPost.list('-created_date', 200) || [],
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['all-reports'],
    queryFn: async () => await base44.entities.Report.filter({ status: 'pending' }, '-created_date', 100) || [],
  });

  const { data: likes = [] } = useQuery({
    queryKey: ['all-social-likes'],
    queryFn: async () => await base44.entities.SocialLike.list('-created_date', 1000) || [],
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => await base44.entities.UserProfile.list('-followers_count', 100) || [],
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      await base44.entities.SocialPost.update(postId, { status: 'removed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-social-posts'] });
      showToast?.('Post removido');
    },
  });

  const dismissReportMutation = useMutation({
    mutationFn: async (reportId) => {
      await base44.entities.Report.update(reportId, { status: 'dismissed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-reports'] });
      showToast?.('Denúncia descartada');
    },
  });

  // Analytics
  const activePosts = posts.filter(p => p.status === 'active');
  const totalLikes = likes.length;
  
  const topPosts = [...activePosts]
    .map(post => ({
      ...post,
      likesCount: likes.filter(l => l.post_id === post.id).length
    }))
    .sort((a, b) => b.likesCount - a.likesCount)
    .slice(0, 5);

  const postsByType = activePosts.reduce((acc, post) => {
    const type = post.post_type || 'text';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(postsByType).map(([name, value]) => ({ name, value }));

  const dailyPosts = activePosts.reduce((acc, post) => {
    const date = post.created_date?.split('T')[0];
    if (date) {
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {});

  const dailyData = Object.entries(dailyPosts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      posts: count
    }));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Posts</p>
                <p className="text-2xl font-bold">{activePosts.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-100">Curtidas</p>
                <p className="text-2xl font-bold">{totalLikes}</p>
              </div>
              <Heart className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100">Perfis</p>
                <p className="text-2xl font-bold">{profiles.length}</p>
              </div>
              <Users className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-100">Denúncias</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <Flag className="w-8 h-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports">
        <TabsList className="bg-slate-100 rounded-xl p-1">
          <TabsTrigger value="reports" className="rounded-lg">
            <Flag className="w-4 h-4 mr-2" />
            Denúncias ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="posts" className="rounded-lg">
            <MessageSquare className="w-4 h-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg">
            <TrendingUp className="w-4 h-4 mr-2" />
            Engajamento
          </TabsTrigger>
        </TabsList>

        {/* Reports */}
        <TabsContent value="reports">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">Denúncias Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Nenhuma denúncia pendente</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {report.content_type}
                            </Badge>
                            <p className="text-sm text-slate-800">{report.reason}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Por: {report.reporter_email}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => dismissReportMutation.mutate(report.id)}
                              className="rounded-lg"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            {report.content_type === 'post' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  deletePostMutation.mutate(report.content_id);
                                  dismissReportMutation.mutate(report.id);
                                }}
                                className="rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts */}
        <TabsContent value="posts">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">Todos os Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {activePosts.slice(0, 50).map((post) => (
                    <div key={post.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-800">{post.author_name}</p>
                        <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">{post.post_type}</Badge>
                          <span className="text-xs text-slate-400">
                            {likes.filter(l => l.post_id === post.id).length} curtidas
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePostMutation.mutate(post.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Posts por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="posts" fill="#0056ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg">Tipos de Post</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-xl md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Posts Mais Curtidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPosts.map((post, i) => (
                    <div key={post.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <span className="w-8 h-8 bg-[#0056ff] text-white rounded-full flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{post.author_name}</p>
                        <p className="text-sm text-slate-500 line-clamp-1">{post.content}</p>
                      </div>
                      <Badge className="bg-red-100 text-red-700">
                        <Heart className="w-3 h-3 mr-1" />
                        {post.likesCount}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}