import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, description, trend, className }: StatsCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className={cn(
      // Base card styling with pixel borders
      "bg-card border-2 border-border",
      // Hover effect with glow
      "hover:border-primary hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]",
      // Transition
      "transition-all duration-200",
      // Padding
      "p-6",
      className
    )}>
      {/* Title at top */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-xs uppercase text-muted-foreground tracking-wider">
          {title}
        </h3>
        {trend && (
          <div className="p-1 border border-border bg-background">
            {getTrendIcon()}
          </div>
        )}
      </div>

      {/* Large Value */}
      <div className="flex items-center gap-3 mb-2">
        <p className="font-pixel text-4xl text-foreground leading-none">
          {value}
        </p>
        {/* Optional trend arrow next to number */}
        {trend === "up" && (
          <div className="text-success">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 0L12 6H0L6 0Z" />
            </svg>
          </div>
        )}
        {trend === "down" && (
          <div className="text-destructive">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 12L0 6H12L6 12Z" />
            </svg>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="font-mono text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
