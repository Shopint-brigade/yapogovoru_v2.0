import { Layout } from "@/components/layout";
import { useCalls } from "@/hooks/use-calls";
import { useBatches } from "@/hooks/use-batches";
import { useAgents } from "@/hooks/use-agents";
import { Phone, Search, SortAsc } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Calls() {
  const { calls } = useCalls();
  const { batches } = useBatches();
  const { agents } = useAgents();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [filterStatus, setFilterStatus] = useState("all");

  // Get unique statuses from calls
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(calls.map(call => call.status));
    return Array.from(statuses).sort();
  }, [calls]);

  // Filter and sort calls
  const filteredAndSortedCalls = useMemo(() => {
    let filtered = [...calls];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(call =>
        call.phoneNumber.toLowerCase().includes(search) ||
        call.elevenLabsCallId?.toLowerCase().includes(search) ||
        call.id.toString().includes(search)
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(call => call.status === filterStatus);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "status":
          return a.status.localeCompare(b.status);
        case "phone":
          return a.phoneNumber.localeCompare(b.phoneNumber);
        default:
          return 0;
      }
    });

    return filtered;
  }, [calls, searchTerm, sortBy, filterStatus]);

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Все Звонки</h1>
            <p className="text-muted-foreground">История звонков по всем кампаниям</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium">
            {filteredAndSortedCalls.length} из {calls.length}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-card rounded-xl border border-border">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Поиск</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Телефон, ID звонка..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Статус</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Сортировка</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Дата: Новые → Старые</SelectItem>
                <SelectItem value="date-asc">Дата: Старые → Новые</SelectItem>
                <SelectItem value="status">По статусу</SelectItem>
                <SelectItem value="phone">По номеру телефона</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-6">
        {filteredAndSortedCalls.map((call) => {
          const batch = batches.find(b => b.id === call.batchId);
          const agent = batch ? agents.find(a => a.id === batch.agentId) : null;

          return (
            <div
              key={call.id}
              className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    call.status === 'completed' || call.status === 'answered'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : call.status === 'failed'
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : call.status === 'calling'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    <Phone className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-foreground">{call.phoneNumber}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        call.status === 'completed' || call.status === 'answered'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : call.status === 'failed'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : call.status === 'calling'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {call.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {batch && (
                        <span>Кампания: {batch.name}</span>
                      )}
                      {agent && (
                        <span>Агент: {agent.name}</span>
                      )}
                      <span>{new Date(call.createdAt).toLocaleString('ru-RU')}</span>
                    </div>

                    {call.elevenLabsCallId && (
                      <div className="mt-2 text-xs font-mono text-muted-foreground">
                        ID: {call.elevenLabsCallId}
                      </div>
                    )}

                    {call.recordingUrl && (
                      <div className="mt-2">
                        <a
                          href={call.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          📼 Прослушать запись
                        </a>
                      </div>
                    )}

                    {call.transcript && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-foreground">
                        <span className="font-semibold">Транскрипт:</span> {call.transcript}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {calls.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Нет звонков</h3>
            <p className="text-muted-foreground mt-2">
              Звонки появятся здесь после запуска кампаний
            </p>
          </div>
        )}

        {calls.length > 0 && filteredAndSortedCalls.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Ничего не найдено</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Попробуйте изменить параметры поиска или фильтры
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
