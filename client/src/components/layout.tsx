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
  Shield,
  Bell,
  User,
  Search,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GuestBanner } from "@/components/guest-banner";
import { Input } from "@/components/ui/input";

const TopNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href} className={cn(
      "font-mono text-sm transition-colors px-2 py-1",
      isActive ? "text-primary" : "text-foreground hover:text-primary"
    )}>
      <span className="text-muted-foreground">[</span> {children} <span className="text-muted-foreground">]</span>
    </Link>
  );
};

const SidebarLink = ({ href, icon: Icon, children, collapsible }: { href: string; icon: any; children: React.ReactNode; collapsible?: boolean }) => {
  const [location] = useLocation();
  const isActive = location === href;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Link href={href} className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-none transition-all duration-100 group font-mono text-xs",
      isActive
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    )}>
      <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="flex-1">{children}</span>
      {collapsible && <ChevronDown className="w-3 h-3" />}
    </Link>
  );
};

const SidebarSection = ({ title }: { title: string }) => (
  <div className="px-3 py-2 font-mono text-[10px] uppercase text-muted-foreground tracking-wider">
    {title}
  </div>
);

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header Bar */}
      <header className="h-14 bg-card border-b-2 border-border flex items-center px-4 gap-4 sticky top-0 z-50">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary flex items-center justify-center">
            <span className="font-pixel text-[8px] text-primary-foreground">Y</span>
          </div>
          <div className="flex flex-col">
            <span className="font-pixel text-[11px] text-foreground leading-none">
              YAPOGOVORU
            </span>
            <span className="font-mono text-[7px] text-muted-foreground leading-none mt-0.5">
              by nart automates
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          <TopNavLink href="/">Главная</TopNavLink>
          <TopNavLink href="/agents">Агенты</TopNavLink>
          <TopNavLink href="/batches">Пакеты</TopNavLink>
        </nav>

        {/* Right Icons */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notification Bell */}
          <button className="relative w-8 h-8 flex items-center justify-center border-2 border-border hover:border-primary transition-colors bg-background">
            <Bell className="w-4 h-4 text-foreground" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary flex items-center justify-center">
              <span className="font-pixel text-[6px] text-primary-foreground">1</span>
            </span>
          </button>

          {/* User Profile */}
          <button className="w-8 h-8 flex items-center justify-center border-2 border-border hover:border-primary transition-colors bg-background">
            <User className="w-4 h-4 text-foreground" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center border-2 border-border hover:border-primary transition-colors bg-background"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className={cn(
          "w-56 bg-card border-r-2 border-border flex flex-col overflow-y-auto transition-transform duration-300 md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0 absolute inset-y-0 z-40" : "-translate-x-full md:relative"
        )}>
          {/* Main Section */}
          <div className="py-4">
            <SidebarSection title="Main" />
            <div className="space-y-1">
              <SidebarLink href="/" icon={LayoutDashboard}>Главная</SidebarLink>
              <SidebarLink href="/agents" icon={Users}>Агенты</SidebarLink>
              <SidebarLink href="/batches" icon={PhoneCall}>Пакеты звонков</SidebarLink>
              <SidebarLink href="/calls" icon={Phone}>Все Звонки</SidebarLink>
              <SidebarLink href="/settings" icon={SettingsIcon}>Настройки</SidebarLink>
              {user?.access === 'admin' && (
                <SidebarLink href="/admin" icon={Shield}>Админ</SidebarLink>
              )}
            </div>
          </div>

          {/* User Info at Bottom */}
          <div className="mt-auto border-t-2 border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary flex items-center justify-center">
                <span className="font-pixel text-[8px] text-primary-foreground">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] font-medium truncate text-foreground">
                  {user?.username || "Пользователь"}
                </p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-destructive hover:bg-destructive/10 transition-colors font-mono text-[10px]"
            >
              <LogOut className="w-3 h-3" />
              <span>Выход</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <GuestBanner />
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
