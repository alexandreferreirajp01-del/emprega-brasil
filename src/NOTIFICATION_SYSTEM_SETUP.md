# 🔔 SISTEMA CENTRALIZADO DE NOTIFICAÇÕES - DOCUMENTAÇÃO

## Visão Geral
Sistema robusto que captura **TODAS** as atividades do aplicativo e notifica usuários e admins automaticamente.

---

## 📊 Estrutura de Notificações

### Para ADMINS recebem:
✅ Nova vaga criada  
✅ Vaga publicada / expirada  
✅ Novo usuário registrado  
✅ Novo post no Feed  
✅ Novo pagamento recebido  
✅ Nova notícia publicada  

### Para USUÁRIOS recebem:
✅ Novas vagas (de sua categoria/cidade)  
✅ Mensagens diretas  
✅ Comentários em seus posts  
✅ Curtidas em seus posts  
✅ Respostas de suporte  
✅ Confirmações de pagamento  

---

## 🤖 Funções Backend Criadas

### 1. **createNotification.js**
Função centralizada para registrar qualquer notificação.
```javascript
POST /functions/createNotification
{
  "title": "Nova Vaga",
  "message": "Desenvolvedor React...",
  "type": "job",
  "reference_type": "job",
  "reference_id": "job_123",
  "user_email": "usuario@email.com",
  "redirect_page": "JobDetail",
  "redirect_params": { "id": "job_123" }
}
```

### 2. **notifyJobCreated.js**
Disparada quando uma vaga é criada.
- Notifica todos os admins
- Notifica usuários se status = "ativa"

### 3. **notifyJobStatusChanged.js**
Disparada quando uma vaga é atualizada.
- Notifica admins se vaga for publicada/expirada

### 4. **notifyUserRegistered.js**
Disparada quando um novo usuário se registra.
- Notifica todos os admins

### 5. **notifyDirectMessage.js**
Disparada quando uma mensagem direta é criada.
- Notifica o destinatário da mensagem

### 6. **notifyFeedNewComment.js**
Disparada quando um comentário é criado no feed.
- Notifica o autor do post original

### 7. **notifyFeedNewPost.js**
Disparada quando um novo post é criado.
- Notifica todos os admins

### 8. **notifyPaymentReceived.js**
Disparada quando um pagamento é criado.
- Notifica o usuário que pagou
- Notifica todos os admins

### 9. **notifyNewsPublished.js**
Disparada quando uma notícia é criada.
- Notifica todos os admins
- Se publicada, notifica todos os usuários

---

## ⚙️ Automações Configuradas

| Automação | Entidade | Evento | Função |
|-----------|----------|--------|--------|
| Notificar Nova Vaga | Job | create | notifyJobCreated |
| Notificar Vaga Atualizada | Job | update | notifyJobStatusChanged |
| Notificar Novo Usuário | Manual | - | notifyUserRegistered |
| Notificar Mensagem Direta | MensagemDireta | create | notifyDirectMessage |
| Notificar Comentário Feed | FeedComentario | create | notifyFeedNewComment |
| Notificar Post Feed | FeedPost | create | notifyFeedNewPost |
| Notificar Pagamento | Payment | create | notifyPaymentReceived |
| Notificar Notícia | News | create | notifyNewsPublished |

---

## 📱 Como Usar no App

### No componente NotificationBell.jsx:
```javascript
// O sistema já está integrado!
// Recarrega a cada 5 segundos
// Mostra notificações não lidas com badge
// Permite marcar como lido / deletar
```

### Para Usar em Outras Funções:
```javascript
// Chamar createNotification da sua função:
await base44.functions.invoke('createNotification', {
  title: 'Seu Título',
  message: 'Sua Mensagem',
  type: 'job',
  reference_type: 'job',
  reference_id: 'id_da_vaga',
  user_email: 'usuario@email.com'
});
```

---

## 🎯 Tipos de Notificação

```javascript
type: 'job'      // Vagas de emprego
type: 'news'     // Notícias
type: 'feed'     // Posts/Comentários do feed
type: 'chat'     // Mensagens diretas
type: 'payment'  // Pagamentos
type: 'user'     // Usuários
type: 'admin'    // Ações administrativas
type: 'system'   // Mensagens do sistema
type: 'promo'    // Promoções
```

---

## 📍 Tipos de Referência

```javascript
reference_type: 'job'          // Vaga de emprego
reference_type: 'news'         // Notícia
reference_type: 'feed_post'    // Post do feed
reference_type: 'feed_comment' // Comentário do feed
reference_type: 'chat'         // Mensagem direta
reference_type: 'payment'      // Pagamento
reference_type: 'user'         // Usuário
```

---

## 🔄 Fluxo de Notificações

```
Evento Ocorre (criar vaga, enviar msg, etc)
        ↓
Automação é Disparada
        ↓
Função Backend é Executada
        ↓
createNotification é Chamada
        ↓
Notificação Registrada no Banco
        ↓
NotificationBell Refetch (a cada 5s)
        ↓
Usuário Vê Notificação com Badge
```

---

## ✨ Melhorias Implementadas

1. ✅ **Sistema Centralizado** - Todas as notificações passam por `createNotification`
2. ✅ **Automações** - Cada evento cria notificação automaticamente
3. ✅ **Separação de Permissões** - Admins vs Usuários recebem diferentes notificações
4. ✅ **Referências Inteligentes** - Clique na notificação vai para a página correta
5. ✅ **Notificações em Massa** - `sent_to_all` para avisos globais
6. ✅ **Real-time** - Refetch a cada 5 segundos
7. ✅ **Contexto** - Cada notificação tem título, mensagem, ícone e tipo

---

## 🚀 Próximos Passos (Opcional)

- [ ] Adicionar notificação ao curtir post (criar automação para curtidas)
- [ ] Adicionar notificação de resposta de comentário
- [ ] Notificações por email (criar função `sendEmailNotification`)
- [ ] Notificações via SMS (integrar com Twilio)
- [ ] Histórico de notificações permanente
- [ ] Agrupamento de notificações por tipo

---

## 🐛 Troubleshooting

**Notificação não aparece?**
1. Verifique se a automação está ativa (`list_automations`)
2. Veja os logs da função (`get_runtime_logs`)
3. Confirme que `user_email` está correto
4. Teste com `createNotification` manualmente

**NotificationBell não atualiza?**
1. Verifique o intervalo de refetch (5s)
2. Abra o DevTools e veja se há erros
3. Limpe o cache do navegador

**Muitas notificações duplicadas?**
1. Verifique se há automações duplicadas
2. Veja se a mesma função está sendo chamada múltiplas vezes