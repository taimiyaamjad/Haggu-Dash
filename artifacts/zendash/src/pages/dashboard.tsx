import { useGetDashboardSummary, useGetDashboardActivity, getGetDashboardSummaryQueryKey, getGetDashboardActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Play, Square, Users, HardDrive, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  
  const { data: activities, isLoading: isLoadingActivity } = useGetDashboardActivity({
    query: { queryKey: getGetDashboardActivityQueryKey() }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-mono text-foreground mb-1">System Overview</h1>
        <p className="text-muted-foreground text-sm">Real-time status of your Pterodactyl infrastructure.</p>
      </div>

      {summary && !summary.configured && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-destructive">Pterodactyl Not Configured</h3>
            <p className="text-sm text-destructive/80 mt-1">Please configure your panel URL and API key in settings to connect.</p>
            <Link href="/settings">
              <span className="text-sm font-medium text-destructive underline mt-2 inline-block cursor-pointer">Go to Settings →</span>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Servers" value={summary?.totalServers} icon={Server} loading={isLoadingSummary} />
        <StatCard title="Running" value={summary?.runningServers} icon={Play} loading={isLoadingSummary} color="text-primary" />
        <StatCard title="Stopped" value={summary?.stoppedServers} icon={Square} loading={isLoadingSummary} color="text-destructive" />
        <StatCard title="Nodes" value={summary?.totalNodes} icon={HardDrive} loading={isLoadingSummary} />
        <StatCard title="Users" value={summary?.totalUsers} icon={Users} loading={isLoadingSummary} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold font-mono">Recent Activity</h2>
        <Card className="bg-card border-border shadow-none">
          <CardContent className="p-0">
            {isLoadingActivity ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full bg-accent/50" />)}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="divide-y divide-border">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.description}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-2">
                          <span className="font-mono text-primary/80">{activity.serverName || 'System'}</span>
                          <span>•</span>
                          <span>by {activity.userName || 'System'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {format(new Date(activity.createdAt), "MMM d, HH:mm:ss")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No recent activity.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading, color = "text-muted-foreground" }: any) {
  return (
    <Card className="bg-card border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`w-4 h-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16 bg-accent/50" />
        ) : (
          <div className="text-3xl font-bold font-mono tracking-tight">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
