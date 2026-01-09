import { useEffect, useRef } from "react";

interface TelegramLoginProps {
  botUsername: string;
  onAuth: (user: any) => void;
  buttonSize?: "large" | "medium" | "small";
  cornerRadius?: number;
  requestAccess?: boolean;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth?: (user: any) => void;
    };
  }
}

export function TelegramLogin({
  botUsername,
  onAuth,
  buttonSize = "large",
  cornerRadius = 20,
  requestAccess = true,
}: TelegramLoginProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create global callback function
    window.TelegramLoginWidget = {
      dataOnauth: (user: any) => {
        console.log("Telegram auth successful:", user);
        onAuth(user);
      },
    };

    // Load Telegram widget script
    if (containerRef.current && !containerRef.current.querySelector("script")) {
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", botUsername);
      script.setAttribute("data-size", buttonSize);
      script.setAttribute("data-radius", cornerRadius.toString());
      script.setAttribute("data-request-access", requestAccess ? "write" : "");
      script.setAttribute("data-onauth", "TelegramLoginWidget.dataOnauth(user)");
      script.async = true;

      containerRef.current.appendChild(script);
    }

    return () => {
      // Cleanup
      delete window.TelegramLoginWidget;
    };
  }, [botUsername, buttonSize, cornerRadius, requestAccess, onAuth]);

  return (
    <div ref={containerRef} className="flex justify-center">
      {/* Telegram widget will be inserted here */}
    </div>
  );
}
