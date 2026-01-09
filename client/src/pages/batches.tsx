import { Layout } from "@/components/layout";
import { useBatches } from "@/hooks/use-batches";
import { useAgents } from "@/hooks/use-agents";
import { useCalls } from "@/hooks/use-calls";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileJson, Phone, Calendar, ArrowRight, Upload, FileText, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBatchSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = insertBatchSchema.omit({ userId: true, status: true }).extend({
  agentId: z.coerce.number() // Ensure number conversion for select
});
type FormData = z.infer<typeof formSchema>;

export default function Batches() {
  const { batches, createBatch, isCreating } = useBatches();
  const { agents } = useAgents();
  const { calls } = useCalls();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [validationSuccess, setValidationSuccess] = useState<boolean>(false);
  const [usageLimitDialogOpen, setUsageLimitDialogOpen] = useState(false);
  const [batchSizeLimitError, setBatchSizeLimitError] = useState<{ recordCount: number; maxBatchSize: number } | null>(null);
  const { toast } = useToast();

  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const csvContent = watch("csvContent");
  const selectedAgent = selectedAgentId ? agents.find(a => a.id === selectedAgentId) : null;

  // Parse agent variables from JSON string
  const getAgentVariables = (agent: any): string[] => {
    if (!agent?.agentVariables) return [];
    try {
      const vars = JSON.parse(agent.agentVariables);
      return Array.isArray(vars) ? vars.map((v: any) => v.name) : [];
    } catch {
      return [];
    }
  };

  // Count records in data
  const countRecords = (data: string): number => {
    if (!data.trim()) return 0;

    try {
      // Try parsing as JSON
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.length;
      }
      return 0;
    } catch (e) {
      // Try parsing as CSV
      try {
        const lines = data.trim().split('\n');
        // Subtract 1 for header row, but ensure we don't go negative
        return Math.max(0, lines.length - 1);
      } catch {
        return 0;
      }
    }
  };

  // Validate data against agent variables
  const validateData = (data: string, requiredVars: string[]): { valid: boolean; error?: string; missingVars?: string[] } => {
    if (!data.trim()) {
      return { valid: false, error: "Данные не могут быть пустыми" };
    }

    try {
      // Try parsing as JSON
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { valid: false, error: "JSON должен быть непустым массивом объектов" };
      }

      const firstRow = parsed[0];
      const dataKeys = Object.keys(firstRow);

      // Check for phone field
      const hasPhone = dataKeys.some(key => key.toLowerCase().includes('phone') || key === 'customer_phone');
      if (!hasPhone) {
        return { valid: false, error: "Данные должны содержать поле с номером телефона (phone, customer_phone)" };
      }

      // Check for required variables
      const missingVars = requiredVars.filter(varName => !dataKeys.includes(varName));
      if (missingVars.length > 0) {
        return { valid: false, error: `Отсутствуют обязательные переменные агента`, missingVars };
      }

      return { valid: true };
    } catch (e) {
      // Try parsing as CSV
      try {
        const lines = data.trim().split('\n');
        if (lines.length < 2) {
          return { valid: false, error: "CSV должен содержать заголовок и минимум одну строку данных" };
        }

        const headers = lines[0].split(',').map(h => h.trim());

        // Check for phone field
        const hasPhone = headers.some(h => h.toLowerCase().includes('phone') || h === 'customer_phone');
        if (!hasPhone) {
          return { valid: false, error: "CSV должен содержать колонку с номером телефона (phone, customer_phone)" };
        }

        // Check for required variables
        const missingVars = requiredVars.filter(varName => !headers.includes(varName));
        if (missingVars.length > 0) {
          return { valid: false, error: `Отсутствуют обязательные переменные агента`, missingVars };
        }

        return { valid: true };
      } catch {
        return { valid: false, error: "Данные должны быть в формате JSON или CSV" };
      }
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // Handle file selection
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // Process uploaded file
  const handleFile = (file: File) => {
    const validTypes = ['application/json', 'text/csv', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(json|csv)$/i)) {
      toast({
        title: "Неверный формат файла",
        description: "Пожалуйста, загрузите файл JSON или CSV",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setValue("csvContent", content);
      setFileName(file.name);

      // Validate if agent is selected
      if (selectedAgent) {
        const requiredVars = getAgentVariables(selectedAgent);
        const validation = validateData(content, requiredVars);
        if (validation.valid) {
          setValidationSuccess(true);
          setValidationError("");
        } else {
          setValidationSuccess(false);
          setValidationError(validation.error + (validation.missingVars ? `: ${validation.missingVars.join(', ')}` : ''));
        }
      }

      toast({
        title: "Файл загружен",
        description: `${file.name} успешно загружен`,
      });
    };
    reader.readAsText(file);
  };

  // Validate data when it changes or agent is selected
  const handleDataChange = (newData: string) => {
    setValue("csvContent", newData);
    if (selectedAgent && newData) {
      const requiredVars = getAgentVariables(selectedAgent);
      const validation = validateData(newData, requiredVars);
      if (validation.valid) {
        setValidationSuccess(true);
        setValidationError("");
      } else {
        setValidationSuccess(false);
        setValidationError(validation.error + (validation.missingVars ? `: ${validation.missingVars.join(', ')}` : ''));
      }
    } else {
      setValidationSuccess(false);
      setValidationError("");
    }
  };

  const onSubmit = (data: FormData) => {
    if (validationError) {
      toast({
        title: "Ошибка валидации",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    // Check usage limit
    const recordCount = countRecords(data.csvContent);
    const currentCallCount = calls.length;
    const userUsageLimit = user?.usage || 0;

    if (currentCallCount + recordCount > userUsageLimit) {
      setUsageLimitDialogOpen(true);
      return;
    }

    createBatch(data, {
      onSuccess: () => {
        setIsOpen(false);
        reset();
        setSelectedAgentId(null);
        setFileName("");
        setValidationError("");
        setValidationSuccess(false);
      },
      onError: (error: Error) => {
        // Check if it's a batch size limit error
        if (error.message.includes('Превышен лимит записей')) {
          // Extract numbers from error message
          const maxMatch = error.message.match(/максимум (\d+) записей/);
          const countMatch = error.message.match(/создать (\d+)/);

          if (maxMatch && countMatch) {
            setBatchSizeLimitError({
              recordCount: parseInt(countMatch[1]),
              maxBatchSize: parseInt(maxMatch[1])
            });
          }
        }
      }
    });
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      reset();
      setSelectedAgentId(null);
      setFileName("");
      setValidationError("");
      setValidationSuccess(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Пакеты Звонков</h1>
          <p className="text-muted-foreground">Управление кампаниями обзвона</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" />
              Создать Пакет
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>Новый Пакет Звонков</DialogTitle>
              <DialogDescription>
                Загрузите данные для обзвона и выберите агента. Формат JSON или CSV.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название кампании</Label>
                <Input id="name" placeholder="Например: Обзвон клиентов Март" {...register("name")} />
                {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentId">Выберите Агента</Label>
                <Controller
                  control={control}
                  name="agentId"
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedAgentId(Number(value));
                        // Re-validate existing data with new agent
                        if (csvContent) {
                          const agent = agents.find(a => a.id === Number(value));
                          if (agent) {
                            const requiredVars = getAgentVariables(agent);
                            const validation = validateData(csvContent, requiredVars);
                            if (validation.valid) {
                              setValidationSuccess(true);
                              setValidationError("");
                            } else {
                              setValidationSuccess(false);
                              setValidationError(validation.error + (validation.missingVars ? `: ${validation.missingVars.join(', ')}` : ''));
                            }
                          }
                        }
                      }}
                      value={field.value?.toString()}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите агента..." />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id.toString()}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.agentId && <span className="text-xs text-destructive">{errors.agentId.message}</span>}

                {selectedAgent && getAgentVariables(selectedAgent).length > 0 && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-semibold mb-1">Обязательные переменные агента:</p>
                    <div className="flex flex-wrap gap-1">
                      {getAgentVariables(selectedAgent).map((varName, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                          {varName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedAgentId && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Загрузить данные</Label>
                      <a
                        href="https://docs.google.com/spreadsheets/d/1d2FN95pIjb_m0qJ_Yj_bwBa7y8qyo74f1ebjczh9cRw/edit?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Шаблон Google Sheets
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* File Drop Zone */}
                    <div
                      onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                        dragActive
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="file"
                        id="file-upload"
                        accept=".json,.csv"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground mb-1">
                          {fileName || "Перетащите файл сюда или нажмите для выбора"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Поддерживаются форматы: JSON, CSV
                        </p>
                      </label>
                      {fileName && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-foreground font-medium">{fileName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="csvContent">Или вставьте данные вручную</Label>
                    <Textarea
                      id="csvContent"
                      placeholder='[{"phone": "+123456789", "customer_name": "Ivan"}]'
                      className="font-mono text-xs min-h-[150px]"
                      value={csvContent || ""}
                      onChange={(e) => handleDataChange(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Формат JSON: массив объектов. Формат CSV: заголовки в первой строке.
                    </p>
                    {errors.csvContent && <span className="text-xs text-destructive">{errors.csvContent.message}</span>}
                  </div>

                  {/* Validation Messages */}
                  {validationError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                  )}

                  {validationSuccess && !validationError && csvContent && (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-900/10">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-600 dark:text-green-400">
                        Данные валидны! Все обязательные переменные присутствуют.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isCreating || !selectedAgentId || !!validationError || !csvContent}
                  className="w-full sm:w-auto"
                >
                  {isCreating ? "Создание..." : "Запустить Кампанию"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Limit Exceeded Dialog */}
      <Dialog open={usageLimitDialogOpen} onOpenChange={setUsageLimitDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive">Лимит звонков достигнут</DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <div className="text-base text-foreground">
                <p className="mb-3">
                  Вы достигли максимального лимита звонков для вашего аккаунта.
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Текущие звонки:</span>
                    <span className="font-semibold">{calls.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Новых записей:</span>
                    <span className="font-semibold">{csvContent ? countRecords(csvContent) : 0}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">Ваш лимит:</span>
                    <span className="font-semibold">{user?.usage || 0}</span>
                  </div>
                </div>
                <p className="mt-4 text-base">
                  Для увеличения лимита звонков, пожалуйста, свяжитесь с администратором:
                </p>
                <a
                  href="https://t.me/cutiecupid90"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Phone className="w-4 h-4" />
                  Написать @cutiecupid90
                </a>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUsageLimitDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {batches.map((batch) => {
          const agent = agents.find(a => a.id === batch.agentId);
          
          return (
            <div key={batch.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:border-primary/50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <FileJson className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-display text-foreground">{batch.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(batch.createdAt!).toLocaleDateString('ru-RU')}
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-foreground font-medium text-xs">
                        Агент: {agent?.name || "Неизвестно"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    batch.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    batch.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {batch.status === 'completed' ? 'Завершен' :
                     batch.status === 'processing' ? 'В работе' : 'Ожидание'}
                  </div>
                  <Button variant="outline" size="icon" className="rounded-xl">
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {batches.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Нет активных пакетов</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
              Создайте пакет звонков, чтобы запустить автоматический обзвон через агента.
            </p>
          </div>
        )}
      </div>

      {/* Batch Size Limit Dialog */}
      <Dialog open={!!batchSizeLimitError} onOpenChange={(open) => !open && setBatchSizeLimitError(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive">Превышен лимит записей в пакете</DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <div className="text-base text-foreground">
                <p className="mb-3">
                  Вы пытаетесь создать пакет, превышающий максимальный лимит записей для вашей роли.
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Записей в пакете:</span>
                    <span className="font-semibold">{batchSizeLimitError?.recordCount || 0}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">Максимальный лимит:</span>
                    <span className="font-semibold">{batchSizeLimitError?.maxBatchSize || 0}</span>
                  </div>
                </div>
                <p className="mt-4 text-base">
                  Для увеличения лимита записей в пакете, пожалуйста, свяжитесь с администратором:
                </p>
                <a
                  href="https://t.me/cutiecupid90"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Phone className="w-4 h-4" />
                  Написать @cutiecupid90
                </a>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBatchSizeLimitError(null)}
              className="w-full sm:w-auto"
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
