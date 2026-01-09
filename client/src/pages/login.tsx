import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { TelegramLogin } from "@/components/telegram-login";

// Get bot username from environment or use placeholder
const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "";

export default function Login() {
  const { login, isLoggingIn, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const handleTelegramAuth = (telegramUser: any) => {
    login(telegramUser);
  };

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-3xl" />

      <div className="max-w-md w-full bg-card/80 backdrop-blur-xl border border-border shadow-2xl rounded-3xl p-8 md:p-12 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-blue-400 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <span className="text-3xl font-bold text-white font-display">N</span>
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground mb-3">
            Nart <span className="text-primary">automates</span>
          </h1>
          <p className="text-muted-foreground">
            Автоматизация звонков с помощью ИИ
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-xl border border-border/50 text-sm text-muted-foreground text-center">
            Для входа используйте ваш Telegram аккаунт
          </div>

          {/* Telegram Login Widget */}
          {TELEGRAM_BOT_USERNAME ? (
            <TelegramLogin
              botUsername={TELEGRAM_BOT_USERNAME}
              onAuth={handleTelegramAuth}
              buttonSize="large"
              cornerRadius={12}
            />
          ) : (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400 text-center">
              ⚠️ Telegram бот не настроен. Обратитесь к администратору.
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground mt-8">
            Нажимая кнопку, вы соглашаетесь с условиями использования сервиса
          </p>
        </div>
      </div>
    </div>
  );
}
