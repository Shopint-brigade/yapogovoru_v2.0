import { Layout } from "@/components/layout";
import { StatsCard } from "@/components/stats-card";
import { useAgents } from "@/hooks/use-agents";
import { useBatches } from "@/hooks/use-batches";
import { useCalls } from "@/hooks/use-calls";
import { useAuth } from "@/hooks/use-auth";
import { Users, PhoneCall, Activity, Clock, TrendingDown, AlertCircle, Gift, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { agents } = useAgents();
  const { batches } = useBatches();
  const { calls, completedCalls } = useCalls();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(false);

  const activeBatches = batches.filter(b => b.status === "processing").length;

  const usageLimit = user?.usage || 0;
  const currentCalls = calls.length;
  const remainingCalls = usageLimit - currentCalls;
  const isLowOnCalls = remainingCalls < 10 && remainingCalls >= 0;
  const isOutOfCalls = remainingCalls <= 0;

  const handleClaimBonus = async () => {
    setIsClaimingBonus(true);
    try {
      // First check membership
      const checkResponse = await fetch(api.auth.checkChannelMembership.path, {
        method: api.auth.checkChannelMembership.method,
        headers: { 'Content-Type': 'application/json' },
      });

      if (!checkResponse.ok) {
        throw new Error('Failed to check membership');
      }

      const checkData = await checkResponse.json();

      if (!checkData.isMember) {
        toast({
          title: "Подпишитесь на канал",
          description: "Пожалуйста, подпишитесь на канал @nartautomates и попробуйте снова",
          variant: "destructive",
        });
        return;
      }

      if (!checkData.canClaim) {
        toast({
          title: "Бонус уже получен",
          description: "Вы уже получили бонус за подписку на канал",
        });
        return;
      }

      // Claim the bonus
      const claimResponse = await fetch(api.auth.claimBonus.path, {
        method: api.auth.claimBonus.method,
        headers: { 'Content-Type': 'application/json' },
      });

      if (!claimResponse.ok) {
        const error = await claimResponse.json();
        throw new Error(error.message || 'Failed to claim bonus');
      }

      // Refresh user data
      await queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });

      toast({
        title: "Бонус получен! 🎉",
        description: "50 звонков добавлено к вашему лимиту",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось получить бонус",
        variant: "destructive",
      });
    } finally {
      setIsClaimingBonus(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-display text-foreground">Главная</h1>
        <p className="text-muted-foreground">Обзор активности системы и статистика</p>
      </div>

      {/* Usage Alert */}
      {(isLowOnCalls || isOutOfCalls) && (
        <Alert variant={isOutOfCalls ? "destructive" : "default"} className={isLowOnCalls && !isOutOfCalls ? "border-orange-500 bg-orange-50 dark:bg-orange-900/10" : ""}>
          <AlertCircle className={`h-4 w-4 ${isLowOnCalls && !isOutOfCalls ? "text-orange-600" : ""}`} />
          <AlertDescription className={isLowOnCalls && !isOutOfCalls ? "text-orange-600 dark:text-orange-400" : ""}>
            {isOutOfCalls ? (
              <span>
                <strong>Лимит звонков исчерпан!</strong> У вас осталось 0 звонков. Свяжитесь с администратором для увеличения лимита:{" "}
                <a href="https://t.me/cutiecupid90" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  @cutiecupid90
                </a>
              </span>
            ) : (
              <span>
                <strong>Внимание!</strong> У вас осталось всего {remainingCalls} звонков. Для увеличения лимита свяжитесь с администратором:{" "}
                <a href="https://t.me/cutiecupid90" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  @cutiecupid90
                </a>
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Channel Bonus Card */}
      {user && !user.channelBonusReceived && (
        <Card className="border-primary/50 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Получите 50 звонков бесплатно!</CardTitle>
                <CardDescription className="text-base">
                  Подпишитесь на наш Telegram канал и получите бонус
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Подпишитесь на{" "}
              <a
                href="https://t.me/nartautomates"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                @nartautomates
                <ExternalLink className="w-3 h-3" />
              </a>
              {" "}и нажмите кнопку ниже, чтобы получить 50 звонков к вашему лимиту. Это одноразовое предложение!
            </p>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              onClick={handleClaimBonus}
              disabled={isClaimingBonus}
              className="flex-1"
            >
              {isClaimingBonus ? "Проверка..." : "Получить 50 звонков"}
            </Button>
            <Button
              variant="outline"
              asChild
            >
              <a href="https://t.me/nartautomates" target="_blank" rel="noopener noreferrer">
                Перейти к каналу
              </a>
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatsCard
          title="Всего Агентов"
          value={agents.length}
          icon={Users}
          description="Активные ElevenLabs агенты"
        />
        <StatsCard
          title="Пакеты Звонков"
          value={batches.length}
          icon={PhoneCall}
          description="Загруженные CSV файлы"
        />
        <StatsCard
          title="Активные Кампании"
          value={activeBatches}
          icon={Activity}
          description="В процессе обзвона"
          trend={activeBatches > 0 ? "up" : "neutral"}
        />
        <StatsCard
          title="Завершенные Звонки"
          value={completedCalls}
          icon={Clock}
          description="Успешно завершенных звонков"
        />
        <div className={`bg-card rounded-2xl border shadow-sm p-6 ${
          remainingCalls < 10 ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-border'
        }`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${remainingCalls < 10 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
              Осталось Звонков
            </p>
            <TrendingDown className={`w-4 h-4 ${remainingCalls < 10 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
          </div>
          <div className="mt-2">
            <h3 className={`text-3xl font-bold font-display ${
              remainingCalls < 10 ? 'text-red-600 dark:text-red-400' : 'text-foreground'
            }`}>
              {remainingCalls > 0 ? remainingCalls : 0}
            </h3>
            <p className={`text-xs mt-1 ${remainingCalls < 10 ? 'text-red-600/80 dark:text-red-400/80' : 'text-muted-foreground'}`}>
              из {usageLimit} лимит
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display">Последние Пакеты</h2>
            <Link href="/batches" className="text-sm font-medium text-primary hover:underline">
              Все пакеты
            </Link>
          </div>
          
          {batches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <PhoneCall className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Нет активных пакетов</p>
              <Link href="/batches" className="text-primary hover:underline text-sm mt-2 block">
                Создать новый пакет
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {batches.slice(0, 5).map(batch => (
                <div key={batch.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{batch.name}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(batch.createdAt!).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    batch.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    batch.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {batch.status === 'completed' ? 'Завершен' :
                     batch.status === 'processing' ? 'В работе' : 'Ожидание'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display">Активные Агенты</h2>
            <Link href="/agents" className="text-sm font-medium text-primary hover:underline">
              Все агенты
            </Link>
          </div>

          {agents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Нет подключенных агентов</p>
              <Link href="/agents" className="text-primary hover:underline text-sm mt-2 block">
                Добавить агента
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {agents.slice(0, 4).map(agent => (
                <div key={agent.id} className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{agent.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">ID: {agent.agentId}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
