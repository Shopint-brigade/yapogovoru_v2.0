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
      "bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold font-display text-foreground tracking-tight">{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
      </div>
    </div>
  );
}
