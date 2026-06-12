import { useListNodes, getListNodesQueryKey, useGetSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Server, ShieldAlert, MemoryStick } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/format";
import { AlertCircle } from "lucide-react";

export default function Nodes() {
  const { data: settings } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const { data: nodes, isLoading } = useListNodes({ 
    query: { queryKey: getListNodesQueryKey(), enabled: settings?.configured } 
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-foreground mb-1">Infrastructure Nodes</h1>
        <p className="text-muted-foreground text-sm">Physical machines running your servers.</p>
      </div>

      {settings && !settings.configured && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-destructive">Pterodactyl Not Configured</h3>
            <p className="text-sm text-destructive/80 mt-1">Please configure your panel URL and API key in settings to view nodes.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-card border-border shadow-none">
              <CardHeader className="pb-2"><Skeleton className="h-6 w-32 bg-accent/50" /></CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full bg-accent/50" />
                <Skeleton className="h-4 w-2/3 bg-accent/50" />
              </CardContent>
            </Card>
          ))
        ) : nodes?.length === 0 ? (
          <div className="col-span-full p-8 text-center border border-dashed border-border rounded-md text-muted-foreground">
            No nodes found.
          </div>
        ) : (
          nodes?.map((node) => (
            <Card key={node.id} className="bg-card border-border shadow-none hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-bold font-mono text-foreground">{node.name}</CardTitle>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{node.fqdn}</p>
                </div>
                {node.maintenanceMode ? (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 font-mono text-xs">MAINTENANCE</Badge>
                ) : (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">ONLINE</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4 mt-2">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-muted-foreground font-mono"><MemoryStick className="w-4 h-4 mr-2" /> Memory</span>
                    <span className="font-mono text-foreground">{node.memory} MB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-muted-foreground font-mono"><HardDrive className="w-4 h-4 mr-2" /> Disk</span>
                    <span className="font-mono text-foreground">{node.disk} MB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-muted-foreground font-mono"><Server className="w-4 h-4 mr-2" /> Scheme</span>
                    <span className="font-mono text-foreground">{node.scheme}://</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-between text-xs text-muted-foreground font-mono">
                  <span>UUID: {node.uuid.substring(0, 8)}...</span>
                  <span>Port: {node.daemonListen}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
