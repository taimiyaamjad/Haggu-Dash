import { useState } from "react";
import { Terminal, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import ServerWizard from "@/components/ServerWizard";

type Tab = "login" | "register";

export default function Login() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [showWizard, setShowWizard] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    if (regPassword !== regConfirm) {
      setRegError("Passwords do not match");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters");
      return;
    }
    setRegLoading(true);
    try {
      await register({
        email: regEmail.trim(),
        username: regUsername.trim(),
        password: regPassword,
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
      });
      setShowWizard(true);
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <>
      {showWizard && (
        <ServerWizard onClose={() => setShowWizard(false)} />
      )}

      <div className="min-h-screen w-full bg-[#030303] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-black/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

        <div className="w-full max-w-md bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg relative z-10 shadow-2xl overflow-hidden">
          <div className="flex flex-col items-center pt-8 pb-4 px-8">
            <div className="w-14 h-14 bg-[#111] rounded-2xl flex items-center justify-center mb-4 border border-[#222] shadow-[0_0_15px_rgba(0,255,0,0.1)]">
              <Terminal className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-mono tracking-tight text-white mb-1">ZenDash</h1>
            <p className="text-[#666] font-mono text-xs">Pterodactyl Control Panel</p>
          </div>

          <div className="flex border-b border-[#1f1f1f] mx-0">
            <button
              onClick={() => { setTab("login"); setLoginError(""); }}
              className={`flex-1 py-3 text-sm font-mono font-semibold tracking-wider transition-colors ${tab === "login" ? "text-primary border-b-2 border-primary" : "text-[#555] hover:text-[#888]"}`}
            >
              LOGIN
            </button>
            <button
              onClick={() => { setTab("register"); setRegError(""); }}
              className={`flex-1 py-3 text-sm font-mono font-semibold tracking-wider transition-colors ${tab === "register" ? "text-primary border-b-2 border-primary" : "text-[#555] hover:text-[#888]"}`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          <div className="p-8">
            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="bg-red-950/40 border border-red-800/60 rounded px-3 py-2 text-red-400 text-xs font-mono">
                    ✗ {loginError}
                  </div>
                )}
                <div>
                  <label className="block text-[#888] text-xs font-mono mb-1.5 tracking-wider">EMAIL / USERNAME</label>
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin"
                    required
                    className="w-full bg-[#111] border border-[#252525] rounded px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#444] focus:outline-none focus:border-primary/60 focus:bg-[#0f0f0f] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#888] text-xs font-mono mb-1.5 tracking-wider">PASSWORD</label>
                  <div className="relative">
                    <input
                      type={showLoginPw ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#111] border border-[#252525] rounded px-3 py-2.5 pr-10 text-sm text-white font-mono placeholder:text-[#444] focus:outline-none focus:border-primary/60 focus:bg-[#0f0f0f] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPw(!showLoginPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors"
                    >
                      {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-11 text-black bg-primary hover:bg-primary/90 font-mono font-bold tracking-wider text-sm transition-all mt-2"
                >
                  {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "AUTHENTICATE"}
                </Button>
                <p className="text-center text-[#444] text-xs font-mono pt-1">
                  Default setup: <span className="text-[#666]">admin / admin123</span>
                </p>
              </form>
            )}

            {tab === "register" && (
              <form onSubmit={handleRegister} className="space-y-3">
                {regError && (
                  <div className="bg-red-950/40 border border-red-800/60 rounded px-3 py-2 text-red-400 text-xs font-mono">
                    ✗ {regError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#888] text-xs font-mono mb-1.5 tracking-wider">FIRST NAME</label>
                    <input
                      type="text"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder="John"
                      required
                      className="w-full bg-[#111] border border-[#252525] rounded px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#444] focus:outline-none focus:border-primary/60 focus:bg-[#0f0f0f] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#888] text-xs font-mono mb-1.5 tracking-wider">LAST NAME</label>
                    <input
                      type="text"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="Doe"
                      required
                      className="w-full bg-[#111] border border-[#252525] rounded px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#444] focus:outline-none focus:border-primary/60 focus:bg-[#0f0f0f] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#888] text-xs font-mono mb-1.5 tracking-wider">EMAIL</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="w-full bg-[#111] border border-[#252525] rounded px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#444] focus:outline-none focus:border-primary/60 focus:bg-[#0f0f0f] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#888] text-xs font-mono mb-1.5 tracking-wider">USERNAME</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="john_doe"
                    required
                    minLength={3}
                    className="w-full bg-[#111] border border-[#252525] rounded px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#444] focus:outline-none focus:border-primary/60 focus:bg-[#0f0f0f] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#888] text-xs font-mono mb-1.5 tracking-wider">PASSWORD</label>
                  <div className="relative">
                    <input
                      type={showRegPw ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      className="w-full bg-[#111] border border-[#252525] rounded px-3 py-2.5 pr-10 text-sm text-white font-mono placeholder:text-[#444] focus:outline-none focus:border-primary/60 focus:bg-[#0f0f0f] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPw(!showRegPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors"
                    >
                      {showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[#888] text-xs font-mono mb-1.5 tracking-wider">CONFIRM PASSWORD</label>
                  <input
                    type={showRegPw ? "text" : "password"}
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full bg-[#111] border border-[#252525] rounded px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#444] focus:outline-none focus:border-primary/60 focus:bg-[#0f0f0f] transition-colors"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={regLoading}
                  className="w-full h-11 text-black bg-primary hover:bg-primary/90 font-mono font-bold tracking-wider text-sm transition-all mt-1"
                >
                  {regLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "CREATE ACCOUNT"}
                </Button>
                <p className="text-center text-[#444] text-xs font-mono">
                  Pterodactyl panel must be configured first
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
