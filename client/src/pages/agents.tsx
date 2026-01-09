import { Layout } from "@/components/layout";
import { useAgents } from "@/hooks/use-agents";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Bot, Key, Phone, CheckCircle2, Copy, Code2, X, Pencil, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAgentSchema, getRoleLimits } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = insertAgentSchema.omit({ userId: true });
type FormData = z.infer<typeof formSchema>;

interface AgentVariable {
  name: string;
  value?: string;
}

export default function Agents() {
  const { agents, createAgent, updateAgent, deleteAgent, isCreating, isUpdating } = useAgents();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; agentName?: string } | null>(null);
  const [agentVariables, setAgentVariables] = useState<AgentVariable[]>([]);
  const [newVariableName, setNewVariableName] = useState("");
  const [voximplantCode, setVoximplantCode] = useState<string>("");
  const [showCode, setShowCode] = useState(false);
  const { toast } = useToast();

  const userLimits = user ? getRoleLimits(user.access) : null;
  const canDeleteAgents = user?.access === 'admin';
  const hasReachedAgentLimit = userLimits ? agents.length >= userLimits.maxAgents : false;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      telephonyProvider: "voximplant",
    }
  });

  const elevenLabsApiKey = watch("elevenLabsApiKey");
  const agentId = watch("agentId");
  const phoneNumber = watch("phoneNumber");

  const checkConnection = async () => {
    if (!elevenLabsApiKey || !agentId) {
      toast({
        title: "Missing credentials",
        description: "Please enter API Key and Agent ID first",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    setConnectionStatus(null);

    try {
      const response = await fetch('/api/agents/check-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elevenLabsApiKey,
          agentId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConnectionStatus({ success: true, agentName: data.agentName });

        // If variables are returned from API, use them; otherwise keep manual ones
        if (data.variables && data.variables.length > 0) {
          setAgentVariables(data.variables);
          toast({
            title: "Connection successful!",
            description: `Connected to agent: ${data.agentName || 'Unknown'}. Found ${data.variables.length} variables.`,
          });
        } else {
          toast({
            title: "Connection successful!",
            description: `Connected to agent: ${data.agentName || 'Unknown'}. No variables found - you can add them manually below.`,
          });
        }
      } else {
        setConnectionStatus({ success: false });
        toast({
          title: "Connection failed",
          description: data.message || "Failed to connect to ElevenLabs",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setConnectionStatus({ success: false });
      toast({
        title: "Connection error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const addVariable = () => {
    if (!newVariableName.trim()) {
      toast({
        title: "Variable name required",
        description: "Please enter a variable name",
        variant: "destructive",
      });
      return;
    }

    if (agentVariables.some(v => v.name === newVariableName)) {
      toast({
        title: "Variable exists",
        description: "This variable name already exists",
        variant: "destructive",
      });
      return;
    }

    setAgentVariables([...agentVariables, { name: newVariableName, value: "" }]);
    setNewVariableName("");
    toast({
      title: "Variable added",
      description: `Added variable: ${newVariableName}`,
    });
  };

  const removeVariable = (index: number) => {
    const newVars = agentVariables.filter((_, i) => i !== index);
    setAgentVariables(newVars);
    toast({
      title: "Variable removed",
      description: "Variable has been removed",
    });
  };

  const generateVoximplantCode = async () => {
    if (!elevenLabsApiKey || !agentId || !phoneNumber) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and check connection first",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/agents/generate-voximplant-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elevenLabsApiKey,
          agentId,
          phoneNumber,
          variables: agentVariables,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setVoximplantCode(data.code);
        setShowCode(true);
        toast({
          title: "Code generated!",
          description: "Voximplant code has been generated successfully",
        });
      } else {
        toast({
          title: "Generation failed",
          description: data.message || "Failed to generate code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(voximplantCode);
    toast({
      title: "Copied!",
      description: "Voximplant code copied to clipboard",
    });
  };

  const onSubmit = (data: FormData) => {
    if (!connectionStatus?.success) {
      toast({
        title: "Connection required",
        description: "Please check the connection to ElevenLabs first",
        variant: "destructive",
      });
      return;
    }

    const agentData = {
      ...data,
      agentVariables: agentVariables.length > 0 ? JSON.stringify(agentVariables) : undefined,
      voximplantCode: voximplantCode || undefined,
    };

    if (editingAgent !== null) {
      updateAgent({ id: editingAgent, data: agentData }, {
        onSuccess: () => {
          setIsOpen(false);
          setEditingAgent(null);
          reset();
          setConnectionStatus(null);
          setAgentVariables([]);
          setVoximplantCode("");
          setShowCode(false);
        }
      });
    } else {
      createAgent(agentData, {
        onSuccess: () => {
          setIsOpen(false);
          reset();
          setConnectionStatus(null);
          setAgentVariables([]);
          setVoximplantCode("");
          setShowCode(false);
        }
      });
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingAgent(null);
      reset();
      setConnectionStatus(null);
      setAgentVariables([]);
      setVoximplantCode("");
      setShowCode(false);
      setNewVariableName("");
    }
  };

  const handleEditAgent = (agent: any) => {
    setEditingAgent(agent.id);
    reset({
      name: agent.name,
      elevenLabsApiKey: agent.elevenLabsApiKey,
      agentId: agent.agentId,
      phoneNumber: agent.phoneNumber || "",
      telephonyProvider: agent.telephonyProvider,
      voximplantApplicationId: agent.voximplantApplicationId || "",
      voximplantRuleId: agent.voximplantRuleId || "",
    });
    setConnectionStatus({ success: true, agentName: agent.name });
    if (agent.agentVariables) {
      try {
        setAgentVariables(JSON.parse(agent.agentVariables));
      } catch (e) {
        setAgentVariables([]);
      }
    }
    if (agent.voximplantCode) {
      setVoximplantCode(agent.voximplantCode);
      setShowCode(true);
    }
    setIsOpen(true);
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Агенты ElevenLabs</h1>
          <p className="text-muted-foreground">
            Управление голосовыми агентами
            {userLimits && (
              <span className="ml-2 text-xs">
                ({agents.length} / {userLimits.maxAgents === Infinity ? '∞' : userLimits.maxAgents})
              </span>
            )}
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="rounded-xl shadow-lg shadow-primary/20"
              disabled={hasReachedAgentLimit}
            >
              <Plus className="w-5 h-5 mr-2" />
              Добавить Агента
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingAgent !== null ? "Редактировать Агента" : "Новый Агент"}</DialogTitle>
              <DialogDescription>
                Введите данные агента из ElevenLabs. API Key необходим для работы.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <div className="relative">
                  <Bot className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="Например: Продажи Бот" className="pl-9" {...register("name")} />
                </div>
                {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="elevenLabsApiKey">ElevenLabs API Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="elevenLabsApiKey" type="password" placeholder="xi-..." className="pl-9" {...register("elevenLabsApiKey")} />
                </div>
                {errors.elevenLabsApiKey && <span className="text-xs text-destructive">{errors.elevenLabsApiKey.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentId">Agent ID</Label>
                  <Input id="agentId" placeholder="ID агента" {...register("agentId")} />
                  {errors.agentId && <span className="text-xs text-destructive">{errors.agentId.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Номер телефона</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="phoneNumber" placeholder="+79011321156" className="pl-9" {...register("phoneNumber")} />
                  </div>
                  {errors.phoneNumber && <span className="text-xs text-destructive">{errors.phoneNumber.message}</span>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephonyProvider">IP Телефония</Label>
                <Input id="telephonyProvider" value="Voximplant" disabled className="bg-muted" />
                <input type="hidden" {...register("telephonyProvider")} value="voximplant" />
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={checkConnection}
                  disabled={isChecking || !elevenLabsApiKey || !agentId}
                  className="w-full"
                  variant={connectionStatus?.success ? "default" : "outline"}
                >
                  {isChecking ? (
                    "Проверка..."
                  ) : connectionStatus?.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Подключено к {connectionStatus.agentName || "агенту"}
                    </>
                  ) : (
                    "Проверить Подключение"
                  )}
                </Button>
              </div>

              {connectionStatus?.success && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Переменные Агента:</Label>
                    {agentVariables.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                        {agentVariables.map((variable, index) => (
                          <div key={index} className="flex items-center gap-2 bg-background p-2 rounded">
                            <span className="text-foreground flex-1">{variable.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => removeVariable(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mb-3">Переменные не найдены. Добавьте их вручную.</p>
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder="Имя переменной (например: customer_name)"
                        value={newVariableName}
                        onChange={(e) => setNewVariableName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        onClick={addVariable}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {connectionStatus?.success && phoneNumber && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={generateVoximplantCode}
                    className="w-full"
                    variant="secondary"
                  >
                    <Code2 className="w-4 h-4 mr-2" />
                    Сгенерировать Voximplant Код
                  </Button>
                </div>
              )}

              {showCode && voximplantCode && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Voximplant Код:</Label>
                      <Button
                        type="button"
                        onClick={copyCode}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="w-4 w-4 mr-1" />
                        Копировать
                      </Button>
                    </div>
                    <Textarea
                      value={voximplantCode}
                      readOnly
                      className="font-mono text-xs h-64 bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voximplantApplicationId">Voximplant Application ID</Label>
                    <Input
                      id="voximplantApplicationId"
                      placeholder="Введите Application ID из Voximplant"
                      {...register("voximplantApplicationId")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Application ID из вашего приложения в Voximplant
                    </p>
                    {errors.voximplantApplicationId && <span className="text-xs text-destructive">{errors.voximplantApplicationId.message}</span>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voximplantRuleId">Voximplant Rule ID (роутинг)</Label>
                    <Input
                      id="voximplantRuleId"
                      placeholder="Введите Rule ID после создания правила в Voximplant"
                      {...register("voximplantRuleId")}
                    />
                    <p className="text-xs text-muted-foreground">
                      После создания правила роутинга в Voximplant, введите его ID здесь
                    </p>
                    {errors.voximplantRuleId && <span className="text-xs text-destructive">{errors.voximplantRuleId.message}</span>}
                  </div>
                </>
              )}

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  disabled={(isCreating || isUpdating) || !connectionStatus?.success}
                  className="w-full sm:w-auto"
                >
                  {editingAgent !== null
                    ? (isUpdating ? "Обновление..." : "Обновить Агента")
                    : (isCreating ? "Создание..." : "Создать Агента")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agent Limit Alert */}
      {hasReachedAgentLimit && (
        <Alert variant="default" className="border-orange-500 bg-orange-50 dark:bg-orange-900/10">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-600 dark:text-orange-400">
            <strong>Достигнут лимит агентов!</strong> Вы достигли максимального количества агентов ({userLimits?.maxAgents}) для вашей роли.
            Обратитесь к администратору{" "}
            <a href="https://t.me/cutiecupid90" target="_blank" rel="noopener noreferrer" className="underline font-medium">
              @cutiecupid90
            </a>
            {" "}для увеличения лимита.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="group bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-xl text-primary">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => handleEditAgent(agent)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {canDeleteAgents && (
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteAgent(agent.id)}>
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold font-display text-foreground mb-1">{agent.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">Создан: {new Date(agent.createdAt!).toLocaleDateString('ru-RU')}</p>

              <div className="space-y-2 bg-muted/50 p-4 rounded-xl text-xs font-mono text-muted-foreground">
                <div className="flex justify-between">
                  <span>Agent ID:</span>
                  <span className="text-foreground truncate ml-2 max-w-[150px]">{agent.agentId}</span>
                </div>
                {agent.phoneNumber && (
                  <div className="flex justify-between">
                    <span>Телефон:</span>
                    <span className="text-foreground truncate ml-2 max-w-[150px]">{agent.phoneNumber}</span>
                  </div>
                )}
                {agent.voximplantApplicationId && (
                  <div className="flex justify-between">
                    <span>App ID:</span>
                    <span className="text-foreground truncate ml-2 max-w-[150px]">{agent.voximplantApplicationId}</span>
                  </div>
                )}
                {agent.voximplantRuleId && (
                  <div className="flex justify-between">
                    <span>Rule ID:</span>
                    <span className="text-foreground truncate ml-2 max-w-[150px]">{agent.voximplantRuleId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>IP Телефония:</span>
                  <span className="text-foreground">Voximplant</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {agents.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Нет добавленных агентов</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
              Добавьте своего первого агента ElevenLabs, чтобы начать создавать кампании звонков.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
