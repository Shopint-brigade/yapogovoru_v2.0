import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  Phone,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Shield
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GuestBanner } from "@/components/guest-banner";

const SidebarLink = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-3 py-3 rounded-none transition-all duration-200 group font-mono text-sm",
      isActive
        ? "bg-primary text-primary-foreground border-l-4 border-primary"
        : "text-muted-foreground hover:bg-accent hover:text-foreground hover:border-l-2 hover:border-muted"
    )}>
      <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
      <span>{children}</span>
    </Link>
  );
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card z-50 sticky top-0">
        <div className="font-pixel text-sm text-foreground">
          Nart <span className="text-primary">automates</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed md:sticky md:top-0 inset-0 z-40 w-full md:w-72 bg-card border-r border-border h-[calc(100vh-64px)] md:h-screen flex flex-col transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0 mt-16 md:mt-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="hidden md:flex p-6 items-center gap-2 border-b border-border">
          <div className="w-8 h-8 rounded-none bg-primary flex items-center justify-center text-primary-foreground font-pixel text-xs">
            N
          </div>
          <div className="font-pixel text-sm text-foreground">
            Nart <span className="text-primary">automates</span>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          <SidebarLink href="/" icon={LayoutDashboard}>Главная</SidebarLink>
          <SidebarLink href="/agents" icon={Users}>Агенты</SidebarLink>
          <SidebarLink href="/batches" icon={PhoneCall}>Пакеты звонков</SidebarLink>
          <SidebarLink href="/calls" icon={Phone}>Все Звонки</SidebarLink>
          <SidebarLink href="/settings" icon={SettingsIcon}>Настройки</SidebarLink>
          {user?.access === 'admin' && (
            <SidebarLink href="/admin" icon={Shield}>Администрирование</SidebarLink>
          )}
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-none bg-accent border border-border">
            <div className="w-10 h-10 rounded-none bg-primary flex items-center justify-center text-primary-foreground font-pixel text-xs">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-medium truncate text-foreground">{user?.username || "Пользователь"}</p>
              <p className="font-mono text-xs text-muted-foreground truncate">ID: {user?.telegramId}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-none text-destructive hover:bg-destructive/10 transition-colors font-mono text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Выход</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <GuestBanner />
        <div className="p-4 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
