import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings, useTestPterodactylConnection, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Save, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useGetSettings({ 
    query: { queryKey: getGetSettingsQueryKey() } 
  });
  
  const updateSettings = useUpdateSettings();
  const testConnection = useTestPterodactylConnection();
  
  const [panelUrl, setPanelUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; version?: string | null } | null>(null);

  useEffect(() => {
    if (settings) {
      setPanelUrl(settings.panelUrl || "");
      // Don't set API key, it's write-only from client perspective
      // We just show a placeholder if they have one configured
    }
  }, [settings]);

  const handleSave = () => {
    const data: { panelUrl?: string; apiKey?: string } = { panelUrl };
    if (apiKey) data.apiKey = apiKey;
    
    updateSettings.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Settings saved successfully" });
        setApiKey(""); // Clear the input after save
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to save settings", description: err.error, variant: "destructive" });
      }
    });
  };

  const handleTest = () => {
    setTestResult(null);
    testConnection.mutate({}, {
      onSuccess: (res) => {
        setTestResult(res);
      },
      onError: (err) => {
        setTestResult({ success: false, message: err.error });
      }
    });
  };

  if (isLoading) return null;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">Configure panel connection and preferences.</p>
      </div>

      <Card className="bg-card border-border shadow-none">
        <CardHeader>
          <CardTitle className="font-mono">Pterodactyl Connection</CardTitle>
          <CardDescription>Connect Haggu Dash to your Pterodactyl application API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="panelUrl" className="font-mono text-xs uppercase text-muted-foreground">Panel URL</Label>
            <Input 
              id="panelUrl" 
              placeholder="https://panel.example.com" 
              className="bg-background border-border font-mono text-sm"
              value={panelUrl}
              onChange={(e) => setPanelUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">The full URL to your Pterodactyl instance.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="font-mono text-xs uppercase text-muted-foreground">Application API Key</Label>
            <div className="relative">
              <Input 
                id="apiKey" 
                type={showApiKey ? "text" : "password"}
                placeholder={settings?.hasApiKey ? "••••••••••••••••••••••••••••••••" : "ptlc_..."} 
                className="bg-background border-border font-mono text-sm pr-10"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Create an Application API key in your panel admin area. Requires read/write on most endpoints.</p>
          </div>

          {testResult && (
            <div className={`p-4 rounded-md border ${testResult.success ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'}`}>
              <div className="flex items-start">
                {testResult.success ? <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 mr-3" /> : <XCircle className="w-5 h-5 text-destructive mt-0.5 mr-3" />}
                <div>
                  <h4 className={`text-sm font-medium ${testResult.success ? 'text-primary' : 'text-destructive'}`}>
                    {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                  </h4>
                  <p className={`text-sm mt-1 ${testResult.success ? 'text-primary/80' : 'text-destructive/80'}`}>
                    {testResult.message}
                  </p>
                  {testResult.version && <p className="text-xs font-mono mt-2 text-primary/70">Panel Version: {testResult.version}</p>}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border pt-6">
          <Button variant="outline" onClick={handleTest} disabled={testConnection.isPending || updateSettings.isPending} className="font-mono">
            {testConnection.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Test Connection
          </Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending} className="font-mono bg-primary text-primary-foreground hover:bg-primary/90">
            {updateSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
