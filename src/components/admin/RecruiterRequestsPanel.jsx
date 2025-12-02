import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Check, X, Clock, Briefcase, Newspaper, Users, Sparkles, 
  Home, Edit, Eye, Loader2, AlertCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import moment from 'moment';

const REQUEST_TYPE_CONFIG = {
  job: { label: 'Vaga Normal', icon: Briefcase, color: 'bg-blue-100 text-blue-700' },
  job_ai: { label: 'Vaga por IA', icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
  job_homeoffice: { label: 'Home Office', icon: Home, color: 'bg-green-100 text-green-700' },
  news: { label: 'Notícia', icon: Newspaper, color: 'bg-red-100 text-red-700' },
  social_post: { label: 'Post Social', icon: Users, color: 'bg-pink-100 text-pink-700' },
  edit: { label: 'Edição', icon: Edit, color: 'bg-amber-100 text-amber-700' }
};

export default function RecruiterRequestsPanel({ showToast }) {
  const [viewRequest, setViewRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['recruiter-requests'],
    queryFn: async () => {
      const result = await base44.entities.RecruiterRequest.list('-created_date', 500);
      return result || [];
    },
    staleTime: 30000,
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (request) => {
      // Atualizar status da solicitação
      await base44.entities.RecruiterRequest.update(request.id, {
        status: 'approved',
        reviewed_at: new Date().toISOString()
      });

      // Criar o conteúdo real baseado no tipo
      const content = request.full_content;
      if (content) {
        switch (request.request_type) {
          case 'job':
          case 'job_ai':
          case 'job_homeoffice':
            await base44.entities.Job.create(content);
            break;
          case 'news':
            await base44.entities.News.create(content);
            break;
          case 'social_post':
            await base44.entities.SocialPost.create({ ...content, status: 'active' });
            break;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-requests'] });
      showToast('Solicitação aprovada e publicada!');
      setViewRequest(null);
    },
    onError: () => showToast('Erro ao aprovar', 'error')
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      await base44.entities.RecruiterRequest.update(requestId, {
        status: 'rejected',
        reviewed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-requests'] });
      showToast('Solicitação rejeitada');
      setViewRequest(null);
    },
    onError: () => showToast('Erro ao rejeitar', 'error')
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return moment(dateStr).format('DD/MM/YYYY HH:mm');
  };

  const RequestCard = ({ request, showActions = true }) => {
    const config = REQUEST_TYPE_CONFIG[request.request_type] || REQUEST_TYPE_CONFIG.job;
    const Icon = config.icon;

    return (
      <Card className="rounded-xl hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={request.recruiter_photo} />
              <AvatarFallback className="bg-purple-100 text-purple-700">
                {request.recruiter_name?.[0] || 'R'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-medium text-slate-800 truncate">{request.recruiter_name}</p>
                <Badge className={`${config.color} text-xs`}>
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
              
              <p className="text-sm text-slate-500 truncate mb-1">{request.recruiter_email}</p>
              
              <p className="font-medium text-slate-700 line-clamp-2">{request.title}</p>
              
              {request.content_preview && (
                <p className="text-sm text-slate-500 line-clamp-2 mt-1">{request.content_preview}</p>
              )}
              
              <p className="text-xs text-slate-400 mt-2">
                <Clock className="w-3 h-3 inline mr-1" />
                {formatDate(request.created_date)}
              </p>
            </div>
          </div>

          {showActions && (
            <div className="flex gap-2 mt-4 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewRequest(request)}
                className="flex-1 rounded-lg"
              >
                <Eye className="w-4 h-4 mr-1" />
                Visualizar
              </Button>
              <Button
                size="sm"
                onClick={() => approveRequestMutation.mutate(request)}
                disabled={approveRequestMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg"
              >
                <Check className="w-4 h-4 mr-1" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectRequestMutation.mutate(request.id)}
                disabled={rejectRequestMutation.isPending}
                className="rounded-lg text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-xl bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-700">{pendingRequests.length}</p>
            <p className="text-sm text-amber-600">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-700">{approvedRequests.length}</p>
            <p className="text-sm text-green-600">Aprovadas</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-700">{rejectedRequests.length}</p>
            <p className="text-sm text-red-600">Rejeitadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 rounded-xl p-1">
          <TabsTrigger value="pending" className="rounded-lg">
            <Clock className="w-4 h-4 mr-2" />
            Pendentes
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white border-0 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-lg">
            <Check className="w-4 h-4 mr-2" />
            Aprovadas
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg">
            <X className="w-4 h-4 mr-2" />
            Rejeitadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingRequests.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhuma solicitação pendente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {approvedRequests.map(request => (
                <RequestCard key={request.id} request={request} showActions={false} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="rejected">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {rejectedRequests.map(request => (
                <RequestCard key={request.id} request={request} showActions={false} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* View Request Dialog */}
      <Dialog open={!!viewRequest} onOpenChange={() => setViewRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          
          {viewRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <Avatar>
                  <AvatarImage src={viewRequest.recruiter_photo} />
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {viewRequest.recruiter_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{viewRequest.recruiter_name}</p>
                  <p className="text-sm text-slate-500">{viewRequest.recruiter_email}</p>
                </div>
                <Badge className={REQUEST_TYPE_CONFIG[viewRequest.request_type]?.color}>
                  {REQUEST_TYPE_CONFIG[viewRequest.request_type]?.label}
                </Badge>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Título</h4>
                <p className="text-slate-700">{viewRequest.title}</p>
              </div>

              {viewRequest.content_preview && (
                <div>
                  <h4 className="font-semibold mb-2">Preview</h4>
                  <p className="text-slate-600 whitespace-pre-line">{viewRequest.content_preview}</p>
                </div>
              )}

              {viewRequest.full_content && (
                <div>
                  <h4 className="font-semibold mb-2">Conteúdo Completo</h4>
                  <pre className="bg-slate-100 p-4 rounded-xl text-sm overflow-x-auto">
                    {JSON.stringify(viewRequest.full_content, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => approveRequestMutation.mutate(viewRequest)}
                  disabled={approveRequestMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {approveRequestMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Aprovar e Publicar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => rejectRequestMutation.mutate(viewRequest.id)}
                  disabled={rejectRequestMutation.isPending}
                  className="flex-1 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}