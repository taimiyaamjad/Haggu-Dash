import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useGetServer, useGetServerResources, useSendServerPowerAction, useSendServerCommand, getGetServerQueryKey, getGetServerResourcesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RotateCcw, PowerOff, Terminal as TerminalIcon, ChevronLeft, Cpu, MemoryStick, HardDrive, Network } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatBytes, formatUptime } from "@/lib/format";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [command, setCommand] = useState("");
  
  // Keep history for charts
  const [history, setHistory] = useState<any[]>([]);
  
  const { data: server, isLoading: isLoadingServer } = useGetServer(id, {
    query: { queryKey: getGetServerQueryKey(id) }
  });

  const { data: resources, isLoading: isLoadingResources } = useGetServerResources(id, {
    query: { 
      queryKey: getGetServerResourcesQueryKey(id), 
      refetchInterval: 5000 
    }
  });

  // Update history when resources change
  useMemo(() => {
    if (resources?.resources) {
      setHistory(prev => {
        const newEntry = {
          time: new Date().toLocaleTimeString(),
          cpu: resources.resources.cpuAbsolute,
          memory: resources.resources.memoryBytes / (1024 * 1024), // MB
          networkRx: resources.resources.networkRxBytes / 1024, // KB
          networkTx: resources.resources.networkTxBytes / 1024, // KB
        };
        const next = [...prev, newEntry];
        if (next.length > 20) return next.slice(next.length - 20); // Keep last 20 data points
        return next;
      });
    }
  }, [resources]);

  const powerAction = useSendServerPowerAction();
  const sendCommand = useSendServerCommand();

  const handlePowerAction = (signal: 'start'|'stop'|'restart'|'kill') => {
    powerAction.mutate({ serverId: id, data: { signal } }, {
      onSuccess: () => toast({ title: `Signal ${signal} sent` }),
      onError: (err) => toast({ title: "Failed to send power action", description: err.error, variant: "destructive" })
    });
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    sendCommand.mutate({ serverId: id, data: { command } }, {
      onSuccess: () => {
        setCommand("");
        toast({ title: "Command sent" });
      },
      onError: (err) => toast({ title: "Failed to send command", description: err.error, variant: "destructive" })
    });
  };

  if (isLoadingServer) {
    return <div className="p-8"><Skeleton className="h-8 w-64 mb-8 bg-accent/50" /></div>;
  }

  if (!server) {
    return <div className="p-8 text-center text-muted-foreground">Server not found.</div>;
  }

  const status = resources?.currentState || server.status || 'offline';
  const isRunning = status === 'running';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-2 text-muted-foreground text-sm font-mono hover:text-foreground transition-colors w-fit">
        <Link href="/servers" className="flex items-center">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to servers
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-3xl font-bold font-mono text-foreground">{server.name}</h1>
            <Badge variant="outline" className={`font-mono ${
              status === 'running' ? 'bg-primary/10 text-primary border-primary/20' : 
              status === 'starting' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
              status === 'offline' ? 'bg-destructive/10 text-destructive border-destructive/20' :
              'bg-muted text-muted-foreground border-border'
            }`}>
              {status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-sm">{server.identifier} • Node: {server.node}</p>
        </div>

        <div className="flex items-center space-x-2 bg-card p-1 rounded-md border border-border">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => handlePowerAction('start')} disabled={isRunning}>
            <Play className="w-4 h-4 mr-2" /> Start
          </Button>
          <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-500 hover:bg-orange-500/10" onClick={() => handlePowerAction('restart')} disabled={!isRunning}>
            <RotateCcw className="w-4 h-4 mr-2" /> Restart
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handlePowerAction('stop')} disabled={!isRunning}>
            <Square className="w-4 h-4 mr-2" /> Stop
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handlePowerAction('kill')} disabled={!isRunning}>
            <PowerOff className="w-4 h-4 mr-2" /> Kill
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResourceChartCard 
          title="CPU Usage" 
          icon={Cpu} 
          currentValue={resources ? `${resources.resources.cpuAbsolute.toFixed(2)}%` : '---'} 
          subtext={`Limit: ${server.limits.cpu === 0 ? 'Unlimited' : `${server.limits.cpu}%`}`}
          color="hsl(var(--chart-1))"
          data={history}
          dataKey="cpu"
          domain={[0, server.limits.cpu === 0 ? 100 : server.limits.cpu]}
        />
        <ResourceChartCard 
          title="Memory" 
          icon={MemoryStick} 
          currentValue={resources ? formatBytes(resources.resources.memoryBytes) : '---'} 
          subtext={`Limit: ${server.limits.memory === 0 ? 'Unlimited' : `${server.limits.memory} MB`}`}
          color="hsl(var(--chart-2))"
          data={history}
          dataKey="memory"
          domain={[0, server.limits.memory === 0 ? 'auto' : server.limits.memory]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResourceCard 
          title="Disk" 
          icon={HardDrive} 
          value={resources ? formatBytes(resources.resources.diskBytes) : '---'} 
          subtext={`Limit: ${server.limits.disk === 0 ? 'Unlimited' : `${server.limits.disk} MB`}`}
          color="text-purple-500"
        />
        <ResourceCard 
          title="Network (Rx/Tx)" 
          icon={Network} 
          value={resources ? `${formatBytes(resources.resources.networkRxBytes)} / ${formatBytes(resources.resources.networkTxBytes)}` : '---'} 
          subtext={resources ? `Uptime: ${formatUptime(resources.resources.uptime)}` : 'Offline'}
          color="text-yellow-500"
        />
      </div>

      <Card className="bg-[#0a0a0a] border-border shadow-none flex flex-col h-[500px]">
        <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center space-x-2">
          <TerminalIcon className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm font-mono text-muted-foreground font-normal">Console</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-4 overflow-y-auto font-mono text-sm text-gray-300">
          <div className="opacity-50 italic">Console output requires WebSocket connection (not implemented in this view). Use the command input below to send commands.</div>
        </CardContent>
        <div className="p-4 border-t border-border/50 bg-black/50">
          <form onSubmit={handleCommand} className="flex space-x-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">{">"}</span>
              <Input 
                className="pl-8 bg-[#111] border-[#333] font-mono focus-visible:ring-1 focus-visible:ring-primary text-primary"
                placeholder="Type a command..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={!isRunning || sendCommand.isPending}
              />
            </div>
            <Button type="submit" disabled={!isRunning || !command.trim() || sendCommand.isPending} className="font-mono">Send</Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

function ResourceChartCard({ title, icon: Icon, currentValue, subtext, color, data, dataKey, domain }: any) {
  return (
    <Card className="bg-card border-border shadow-none overflow-hidden flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xs font-mono text-muted-foreground uppercase">{title}</CardTitle>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground mt-1">{currentValue}</div>
          <p className="text-xs text-muted-foreground font-mono mt-1">{subtext}</p>
        </div>
        <Icon className="w-8 h-8 opacity-20" style={{ color }} />
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px', fontFamily: 'var(--app-font-mono)', fontSize: '12px' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              labelStyle={{ display: 'none' }}
            />
            <YAxis domain={domain} hide />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color-${dataKey})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ResourceCard({ title, icon: Icon, value, subtext, color }: any) {
  return (
    <Card className="bg-card border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-mono text-muted-foreground uppercase">{title}</CardTitle>
        <Icon className={`w-4 h-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono tracking-tight text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground font-mono mt-1">{subtext}</p>
      </CardContent>
    </Card>
  );
}
