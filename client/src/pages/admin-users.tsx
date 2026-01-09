import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Users as UsersIcon, AlertCircle, Edit, Shield, ChevronDown, ChevronUp, Bot } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User, Agent } from "@shared/schema";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedAccess, setSelectedAccess] = useState<string>("");
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [viewingAgent, setViewingAgent] = useState<Agent | null>(null);

  // Redirect non-admins
  if (user?.access !== 'admin') {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Доступ запрещен!</strong> Эта страница доступна только администраторам.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });

  // Update user access mutation
  const updateAccessMutation = useMutation({
    mutationFn: async ({ userId, access }: { userId: number; access: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/access`, {
        method: 'PATCH',
        body: JSON.stringify({ access }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update user access');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
      toast({
        title: "Успешно",
        description: "Уровень доступа обновлен",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch agents for a specific user
  const { data: userAgents = [] } = useQuery<Agent[]>({
    queryKey: ['admin-user-agents', expandedUserId],
    queryFn: async () => {
      if (!expandedUserId) return [];
      const res = await fetch(`/api/admin/users/${expandedUserId}/agents`);
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
    enabled: !!expandedUserId,
  });

  const handleEditUser = (u: User) => {
    setEditingUser(u);
    setSelectedAccess(u.access);
  };

  const handleSaveAccess = () => {
    if (editingUser && selectedAccess) {
      updateAccessMutation.mutate({
        userId: editingUser.id,
        access: selectedAccess,
      });
    }
  };

  const getRoleBadgeColor = (access: string) => {
    switch (access) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'subscriber':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'user':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'guest':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (access: string) => {
    switch (access) {
      case 'admin':
        return 'Администратор';
      case 'subscriber':
        return 'Подписчик';
      case 'user':
        return 'Пользователь';
      case 'guest':
        return 'Гость';
      default:
        return access;
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Управление Пользователями</h1>
            <p className="text-muted-foreground">Просмотр и редактирование пользователей</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Загрузка пользователей...</p>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Пользователи не найдены</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((u) => {
            const isExpanded = expandedUserId === u.id;
            const agents = isExpanded ? userAgents : [];

            return (
              <Collapsible
                key={u.id}
                open={isExpanded}
                onOpenChange={(open) => setExpandedUserId(open ? u.id : null)}
              >
                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {u.username || 'Без имени'}
                            {u.id === user.id && (
                              <span className="ml-2 text-sm font-normal text-muted-foreground">(Вы)</span>
                            )}
                          </CardTitle>
                          <CardDescription>
                            ID: {u.id} • Telegram: {u.telegramId}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(u.access)}`}>
                          {getRoleLabel(u.access)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(u)}
                          disabled={u.id === user.id} // Can't edit your own access
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Изменить
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground">Лимит звонков</p>
                        <p className="font-semibold">{u.usage}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Бонус канала</p>
                        <p className="font-semibold">{u.channelBonusReceived ? 'Получен' : 'Не получен'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Дата регистрации</p>
                        <p className="font-semibold">
                          {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>

                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full">
                        <Bot className="w-4 h-4 mr-2" />
                        {isExpanded ? 'Скрыть агентов' : 'Показать агентов'}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 ml-2" />
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-4">
                      {agents.length === 0 ? (
                        <div className="text-center py-8 border rounded-lg bg-muted/30">
                          <Bot className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">У пользователя нет агентов</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {agents.map((agent) => (
                            <div
                              key={agent.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-card"
                            >
                              <div className="flex items-center gap-3">
                                <Bot className="w-5 h-5 text-primary" />
                                <div>
                                  <p className="font-medium">{agent.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    ID: {agent.id} • {agent.phoneNumber || 'Нет номера'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingAgent(agent)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Просмотр
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Edit Access Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить уровень доступа</DialogTitle>
            <DialogDescription>
              Изменение уровня доступа для {editingUser?.username || 'пользователя'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Уровень доступа</label>
            <Select value={selectedAccess} onValueChange={setSelectedAccess}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guest">Гость (1 агент, 10 записей)</SelectItem>
                <SelectItem value="user">Пользователь (2 агента, 100 записей)</SelectItem>
                <SelectItem value="subscriber">Подписчик (∞ агентов, 1000 записей)</SelectItem>
                <SelectItem value="admin">Администратор (полный доступ)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Отмена
            </Button>
            <Button onClick={handleSaveAccess} disabled={updateAccessMutation.isPending}>
              {updateAccessMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Agent Dialog */}
      <Dialog open={!!viewingAgent} onOpenChange={(open) => !open && setViewingAgent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Просмотр Агента</DialogTitle>
            <DialogDescription>
              Информация об агенте {viewingAgent?.name}
            </DialogDescription>
          </DialogHeader>
          {viewingAgent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Название</label>
                  <p className="text-base font-semibold">{viewingAgent.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID Агента</label>
                  <p className="text-base font-mono">{viewingAgent.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Номер телефона</label>
                  <p className="text-base">{viewingAgent.phoneNumber || 'Не указан'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ElevenLabs Agent ID</label>
                  <p className="text-base font-mono text-xs">{viewingAgent.agentId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Voximplant Application ID</label>
                  <p className="text-base">{viewingAgent.voximplantApplicationId || 'Не указан'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Voximplant Rule ID</label>
                  <p className="text-base">{viewingAgent.voximplantRuleId || 'Не указан'}</p>
                </div>
              </div>

              {viewingAgent.agentVariables && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Переменные</label>
                  <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(viewingAgent.agentVariables), null, 2)}
                  </pre>
                </div>
              )}

              {viewingAgent.voximplantCode && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Voximplant Code</label>
                  <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto max-h-64">
                    {viewingAgent.voximplantCode}
                  </pre>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Дата создания</label>
                <p className="text-base">{new Date(viewingAgent.createdAt).toLocaleString('ru-RU')}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingAgent(null)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
