import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, description, trend, className }: StatsCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-none p-4 border border-border hover:border-primary transition-all duration-200",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-none bg-primary/10 text-primary border border-primary/20">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <h3 className="text-muted-foreground font-mono text-xs mb-2">{title}</h3>
        <p className="text-3xl font-pixel text-foreground">{value}</p>
        {description && <p className="font-mono text-xs text-muted-foreground mt-2">{description}</p>}
      </div>
    </div>
  );
}
