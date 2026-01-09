import { Layout } from "@/components/layout";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Link2, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";

const formSchema = insertSettingsSchema.omit({ userId: true });
type FormData = z.infer<typeof formSchema>;

export default function Settings() {
  const { settings, updateSettings, isUpdating } = useSettings();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  useEffect(() => {
    if (settings) {
      reset({
        n8nWebhookUrl: settings.n8nWebhookUrl || undefined,
        voximplantAccountId: settings.voximplantAccountId || undefined,
        voximplantApiKey: settings.voximplantApiKey || undefined,
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: FormData) => {
    updateSettings(data);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground">Настройки</h1>
        <p className="text-muted-foreground">Конфигурация интеграций автоматизации и Voximplant</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Voximplant Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <Phone className="w-5 h-5" />
              </div>
              <CardTitle>Voximplant Телефония</CardTitle>
            </div>
            <CardDescription>Настройки провайдера для совершения звонков.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="voximplantAccountId">Account ID</Label>
                <Input id="voximplantAccountId" placeholder="12345678" {...register("voximplantAccountId")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voximplantApiKey">API Key</Label>
                <Input id="voximplantApiKey" type="password" placeholder="API Key" {...register("voximplantApiKey")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Webhook Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
                <Link2 className="w-5 h-5" />
              </div>
              <CardTitle>Custom Автоматизация</CardTitle>
            </div>
            <CardDescription>Webhook URL для отправки событий звонков.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="n8nWebhookUrl">Webhook URL</Label>
              <Input id="n8nWebhookUrl" placeholder="https://yourdomain.com/webhook/..." {...register("n8nWebhookUrl")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end sticky bottom-4 bg-background/80 backdrop-blur-md p-4 rounded-xl border border-border shadow-lg z-30">
          <Button type="submit" size="lg" disabled={isUpdating} className="w-full sm:w-auto min-w-[150px]">
            {isUpdating ? "Сохранение..." : "Сохранить Настройки"}
          </Button>
        </div>
      </form>
    </Layout>
  );
}
