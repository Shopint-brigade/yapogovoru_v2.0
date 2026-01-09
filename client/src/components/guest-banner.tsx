import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function GuestBanner() {
  const { user } = useAuth();

  if (!user || user.access !== 'guest') {
    return null;
  }

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Гостевой доступ
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
            У вас ограниченный доступ к функциям платформы. Свяжитесь с администратором для получения полного доступа.
          </p>
        </div>
      </div>
    </div>
  );
}
