import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen w-full bg-[#030303] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute inset-0 bg-black/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]"></div>
      
      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-8 relative z-10 shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-6 border border-[#222] shadow-[0_0_15px_rgba(0,255,0,0.1)]">
          <Terminal className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold font-mono tracking-tight text-white mb-2">ZenDash</h1>
        <p className="text-[#888] font-mono text-sm mb-8">Secure operator terminal. Authenticate to proceed.</p>
        
        <Button 
          onClick={() => login()} 
          className="w-full h-12 text-black bg-primary hover:bg-primary/90 font-mono font-bold tracking-wider text-sm transition-all"
        >
          INITIATE LOGIN SEQUENCE
        </Button>
      </div>
    </div>
  );
}
