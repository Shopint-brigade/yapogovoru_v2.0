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

  // Safe data handling with defaults
  const safeAgents = agents || [];
  const safeBatches = batches || [];
  const safeCalls = calls || [];

  const activeBatches = safeBatches.filter(b => b?.status === "processing").length;

  const usageLimit = user?.usage || 0;
  const currentCalls = safeCalls.length;
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
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="font-pixel text-2xl text-foreground uppercase tracking-wider">Главная</h1>
        <p className="font-mono text-xs text-muted-foreground">Обзор активности системы и статистика</p>
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
          value={safeAgents.length}
          icon={Users}
          description="Активные ElevenLabs агенты"
        />
        <StatsCard
          title="Пакеты Звонков"
          value={safeBatches.length}
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
          value={completedCalls || 0}
          icon={Clock}
          description="Успешно завершенных звонков"
        />
        <StatsCard
          title="Осталось Звонков"
          value={remainingCalls > 0 ? remainingCalls : 0}
          icon={TrendingDown}
          description={`из ${usageLimit} лимит`}
          trend={remainingCalls < 10 ? "down" : "neutral"}
          className={remainingCalls < 10 ? 'border-destructive' : ''}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Последние Пакеты - Table Style */}
        <div className="bg-card border-2 border-border p-0">
          <div className="flex items-center justify-between p-4 border-b-2 border-border bg-accent">
            <h2 className="font-pixel text-[12px] uppercase text-foreground tracking-wider">Последние Пакеты</h2>
            <Link href="/batches" className="font-mono text-[10px] text-primary hover:text-primary/80 transition-colors">
              Все пакеты →
            </Link>
          </div>

          {safeBatches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PhoneCall className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-mono text-xs">Нет активных пакетов</p>
              <Link href="/batches" className="text-primary hover:underline font-mono text-[10px] mt-2 block">
                Создать новый пакет
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border bg-background">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase text-muted-foreground">Название</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase text-muted-foreground">Дата</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase text-muted-foreground">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {safeBatches.slice(0, 5).map((batch, idx) => (
                    <tr key={batch?.id || idx} className={cn(
                      "border-b border-border hover:bg-accent transition-colors",
                      idx === safeBatches.slice(0, 5).length - 1 && "border-b-0"
                    )}>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-foreground">{batch?.name || 'Без названия'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {batch?.createdAt ? new Date(batch.createdAt).toLocaleDateString('ru-RU') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className={cn(
                          "font-pixel text-[8px] px-3 py-1 border-2 transition-colors",
                          batch?.status === 'completed' && "bg-success text-white border-success",
                          batch?.status === 'processing' && "bg-primary text-primary-foreground border-primary",
                          batch?.status === 'pending' && "bg-muted text-foreground border-border"
                        )}>
                          {batch?.status === 'completed' ? 'OK' :
                           batch?.status === 'processing' ? 'RUN' : 'WAIT'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Активные Агенты - Card Style */}
        <div className="bg-card border-2 border-border p-0">
          <div className="flex items-center justify-between p-4 border-b-2 border-border bg-accent">
            <h2 className="font-pixel text-[12px] uppercase text-foreground tracking-wider">Активные Агенты</h2>
            <Link href="/agents" className="font-mono text-[10px] text-primary hover:text-primary/80 transition-colors">
              Все агенты →
            </Link>
          </div>

          {safeAgents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-mono text-xs">Нет подключенных агентов</p>
              <Link href="/agents" className="text-primary hover:underline font-mono text-[10px] mt-2 block">
                Добавить агента
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {safeAgents.slice(0, 4).map((agent, idx) => (
                <div key={agent?.id || idx} className="border-2 border-border p-3 hover:border-primary transition-colors bg-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-mono text-xs text-foreground font-medium">{agent?.name || 'Без названия'}</h4>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          ID: {agent?.agentId ? agent.agentId.slice(0, 8) + '...' : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success"></div>
                      <span className="font-mono text-[10px] text-success">ONLINE</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
