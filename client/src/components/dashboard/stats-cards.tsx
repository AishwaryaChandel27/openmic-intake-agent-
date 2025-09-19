import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, AlertTriangle, Clock, Bot, TrendingUp, TrendingDown } from "lucide-react";

interface StatsData {
  activeCalls: number;
  crisisFlags: number;
  avgResponseTime: string;
  activeBots: number;
  avgDuration: number;
}

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Calls Today",
      value: stats?.activeCalls || 0,
      icon: Phone,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      trend: "+12%",
      trendLabel: "from yesterday",
      trendIcon: TrendingUp,
      trendColor: "text-secondary",
      testId: "stat-active-calls"
    },
    {
      title: "Crisis Flags",
      value: stats?.crisisFlags || 0,
      icon: AlertTriangle,
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      trend: "2 urgent",
      trendLabel: "require review",
      trendColor: "text-destructive",
      testId: "stat-crisis-flags"
    },
    {
      title: "Avg Response Time",
      value: stats?.avgResponseTime || "1.2s",
      icon: Clock,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      trend: "-0.3s",
      trendLabel: "improvement",
      trendIcon: TrendingDown,
      trendColor: "text-secondary",
      testId: "stat-response-time"
    },
    {
      title: "Active Bots",
      value: stats?.activeBots || 0,
      icon: Bot,
      iconBg: "bg-accent/10",
      iconColor: "text-accent-foreground",
      trend: "All systems",
      trendLabel: "operational",
      trendColor: "text-secondary",
      testId: "stat-active-bots"
    },
  ];

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trendIcon;
        
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground" data-testid={stat.testId}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${stat.iconColor} w-6 h-6`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {TrendIcon && <TrendIcon className={`w-4 h-4 mr-1 ${stat.trendColor}`} />}
                <span className={`${stat.trendColor} font-medium`}>{stat.trend}</span>
                <span className="text-muted-foreground ml-2">{stat.trendLabel}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
