import { useState } from "react";
import { Link } from "wouter";
import { useListServers, useSendServerPowerAction, getListServersQueryKey, useGetSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RotateCcw, PowerOff, Search, Cpu, MemoryStick, HardDrive, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Servers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data: settings } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  
  const { data: serversData, isLoading, refetch } = useListServers(
    { page, search: search || undefined }, 
    { query: { queryKey: getListServersQueryKey({ page, search: search || undefined }), refetchInterval: 10000, enabled: settings?.configured } }
  );

  const powerAction = useSendServerPowerAction();

  const handlePowerAction = (serverId: string, signal: 'start'|'stop'|'restart'|'kill') => {
    powerAction.mutate({ serverId, data: { signal } }, {
      onSuccess: () => {
        toast({ title: `Signal ${signal} sent` });
        refetch();
      },
      onError: (err) => {
        toast({ title: "Failed to send power action", description: err.error, variant: "destructive" });
      }
    });
  };

  const getStatusBadge = (status: string | null | undefined, suspended: boolean) => {
    if (suspended) return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-mono">SUSPENDED</Badge>;
    switch (status) {
      case 'running': return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono">RUNNING</Badge>;
      case 'starting': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 font-mono">STARTING</Badge>;
      case 'stopping': return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-mono">STOPPING</Badge>;
      case 'offline': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-mono">OFFLINE</Badge>;
      default: return <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-mono">{status?.toUpperCase() || 'UNKNOWN'}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-foreground mb-1">Servers</h1>
          <p className="text-muted-foreground text-sm">Manage and monitor all game servers.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search servers..." 
            className="pl-9 bg-card border-border font-mono text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {settings && !settings.configured && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-destructive">Pterodactyl Not Configured</h3>
            <p className="text-sm text-destructive/80 mt-1">Please configure your panel URL and API key in settings to view servers.</p>
          </div>
        </div>
      )}

      <div className="rounded-md border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-accent/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-mono text-xs text-muted-foreground">NAME</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">STATUS</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">NODE</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">LIMITS</TableHead>
              <TableHead className="text-right font-mono text-xs text-muted-foreground">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-5 w-32 bg-accent/50" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 bg-accent/50" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 bg-accent/50" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40 bg-accent/50" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32 ml-auto bg-accent/50" /></TableCell>
                </TableRow>
              ))
            ) : serversData?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No servers found.
                </TableCell>
              </TableRow>
            ) : (
              serversData?.data.map((server) => (
                <TableRow key={server.uuid} className="border-border hover:bg-accent/30 cursor-pointer group">
                  <TableCell className="font-medium text-foreground">
                    <Link href={`/servers/${server.identifier}`}>
                      <span className="block hover:underline">{server.name}</span>
                    </Link>
                    <span className="text-xs text-muted-foreground font-mono mt-1">{server.identifier}</span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(server.status, server.suspended)}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {server.node}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center" title="Memory Limit"><MemoryStick className="w-3 h-3 mr-1" />{server.limits.memory === 0 ? '∞' : `${server.limits.memory}MB`}</span>
                      <span className="flex items-center" title="CPU Limit"><Cpu className="w-3 h-3 mr-1" />{server.limits.cpu === 0 ? '∞' : `${server.limits.cpu}%`}</span>
                      <span className="flex items-center" title="Disk Limit"><HardDrive className="w-3 h-3 mr-1" />{server.limits.disk === 0 ? '∞' : `${server.limits.disk}MB`}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handlePowerAction(server.identifier, 'start')} title="Start">
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-500 hover:bg-orange-500/10" onClick={() => handlePowerAction(server.identifier, 'restart')} title="Restart">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handlePowerAction(server.identifier, 'stop')} title="Stop">
                        <Square className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handlePowerAction(server.identifier, 'kill')} title="Kill">
                        <PowerOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {serversData?.meta && serversData.meta.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm text-muted-foreground font-mono">Page {page} of {serversData.meta.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(serversData.meta.totalPages, p + 1))} disabled={page === serversData.meta.totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}
