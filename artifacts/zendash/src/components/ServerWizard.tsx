import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Server, ChevronRight, Check, X, Cpu, MemoryStick, HardDrive } from "lucide-react";

interface Egg {
  id: number;
  name: string;
  dockerImage: string;
  startup: string;
}

interface Nest {
  id: number;
  name: string;
  description: string | null;
  eggs: Egg[];
}

interface Props {
  onClose: () => void;
  onSuccess?: (serverName: string) => void;
}

type Step = "pick-nest" | "pick-egg" | "name" | "creating" | "done" | "error";

export default function ServerWizard({ onClose, onSuccess }: Props) {
  const [nests, setNests] = useState<Nest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [step, setStep] = useState<Step>("pick-nest");
  const [selectedNest, setSelectedNest] = useState<Nest | null>(null);
  const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
  const [serverName, setServerName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createdName, setCreatedName] = useState("");

  useEffect(() => {
    fetch("/api/eggs", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNests(data);
        else setFetchError("Failed to load game types");
      })
      .catch(() => setFetchError("Failed to connect to Pterodactyl"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!selectedEgg || !selectedNest || !serverName.trim()) return;
    setStep("creating");
    try {
      const res = await fetch("/api/user/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: serverName.trim(),
          nestId: selectedNest.id,
          eggId: selectedEgg.id,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setCreateError(body.error || "Failed to create server");
        setStep("error");
        return;
      }
      setCreatedName(serverName.trim());
      setStep("done");
      onSuccess?.(serverName.trim());
    } catch {
      setCreateError("Network error. Please try again.");
      setStep("error");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-white">Create Your Server</h2>
              <p className="text-xs text-[#555] font-mono">Free starter plan — 2GB RAM · 50% CPU · 10GB Disk</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#444] hover:text-[#888] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-[#555] font-mono text-sm">Loading game types...</p>
            </div>
          )}

          {!loading && fetchError && (
            <div className="py-8 text-center">
              <p className="text-red-400 font-mono text-sm mb-4">{fetchError}</p>
              <p className="text-[#444] text-xs font-mono">Configure Pterodactyl in Settings first</p>
              <Button variant="outline" className="mt-4" onClick={onClose}>Close</Button>
            </div>
          )}

          {!loading && !fetchError && step === "pick-nest" && (
            <div className="space-y-4">
              <p className="text-[#888] text-sm font-mono">Step 1 of 3 — Choose a game category</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {nests.map((nest) => (
                  <button
                    key={nest.id}
                    onClick={() => { setSelectedNest(nest); setStep("pick-egg"); }}
                    className="text-left p-3 bg-[#111] border border-[#1e1e1e] rounded-lg hover:border-primary/40 hover:bg-[#0f1a0f] transition-all group"
                  >
                    <p className="text-sm font-semibold text-white font-mono group-hover:text-primary transition-colors">{nest.name}</p>
                    <p className="text-xs text-[#555] mt-0.5">{nest.eggs.length} variant{nest.eggs.length !== 1 ? "s" : ""}</p>
                  </button>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <Button variant="ghost" className="text-[#555] text-xs font-mono" onClick={onClose}>
                  Skip for now
                </Button>
              </div>
            </div>
          )}

          {!loading && !fetchError && step === "pick-egg" && selectedNest && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep("pick-nest")} className="text-[#555] hover:text-[#888] transition-colors text-xs font-mono">← Back</button>
                <span className="text-[#555] text-xs font-mono">·</span>
                <p className="text-[#888] text-xs font-mono">Step 2 of 3 — Choose a variant for <span className="text-primary">{selectedNest.name}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {selectedNest.eggs.map((egg) => (
                  <button
                    key={egg.id}
                    onClick={() => { setSelectedEgg(egg); setStep("name"); }}
                    className="text-left p-3 bg-[#111] border border-[#1e1e1e] rounded-lg hover:border-primary/40 hover:bg-[#0f1a0f] transition-all group"
                  >
                    <p className="text-sm font-semibold text-white font-mono group-hover:text-primary transition-colors">{egg.name}</p>
                  </button>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <Button variant="ghost" className="text-[#555] text-xs font-mono" onClick={onClose}>
                  Skip for now
                </Button>
              </div>
            </div>
          )}

          {!loading && !fetchError && step === "name" && selectedEgg && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep("pick-egg")} className="text-[#555] hover:text-[#888] transition-colors text-xs font-mono">← Back</button>
                <span className="text-[#555] text-xs font-mono">·</span>
                <p className="text-[#888] text-xs font-mono">Step 3 of 3 — Name your server</p>
              </div>

              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-3 text-xs font-mono space-y-1">
                <div className="text-[#666]">
                  Game: <span className="text-white">{selectedNest?.name} → {selectedEgg.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-[#888] text-xs font-mono mb-1.5 tracking-wider">SERVER NAME</label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="My Awesome Server"
                  maxLength={100}
                  autoFocus
                  className="w-full bg-[#111] border border-[#252525] rounded px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#444] focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>

              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-3">
                <p className="text-xs text-[#555] font-mono mb-2">Allocated resources</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <MemoryStick className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-mono text-white">2 GB RAM</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-mono text-white">50% CPU</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-mono text-white">10 GB Disk</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 text-[#555] font-mono text-xs"
                  onClick={onClose}
                >
                  Skip
                </Button>
                <Button
                  className="flex-1 bg-primary text-black font-mono font-bold hover:bg-primary/90"
                  onClick={handleCreate}
                  disabled={!serverName.trim()}
                >
                  <ChevronRight className="w-4 h-4 mr-1" />
                  Create Server
                </Button>
              </div>
            </div>
          )}

          {step === "creating" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-white font-mono text-sm">Deploying your server...</p>
              <p className="text-[#555] font-mono text-xs">This may take a few seconds</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-white font-mono font-bold text-lg mb-1">Server Created!</p>
                <p className="text-[#666] font-mono text-sm">
                  <span className="text-primary">{createdName}</span> is being set up
                </p>
              </div>
              <Button
                className="bg-primary text-black font-mono font-bold hover:bg-primary/90 mt-2"
                onClick={onClose}
              >
                Go to My Servers
              </Button>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-mono font-bold mb-2">Server Creation Failed</p>
                <p className="text-red-400 font-mono text-xs max-w-xs">{createError}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("name")} className="font-mono text-sm">
                  Try Again
                </Button>
                <Button variant="ghost" onClick={onClose} className="font-mono text-sm text-[#555]">
                  Skip
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
