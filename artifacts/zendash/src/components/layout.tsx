import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Server,
  HardDrive,
  Users,
  Settings,
  LogOut,
  Terminal,
  Plus,
  Shield,
} from "lucide-react";
import { Button } from "./ui/button";
import ServerWizard from "./ServerWizard";
import { useQueryClient } from "@tanstack/react-query";
import { getListServersQueryKey } from "@workspace/api-client-react";

const adminNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/servers", label: "Servers", icon: Server },
  { href: "/nodes", label: "Nodes", icon: HardDrive },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

const userNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/servers", label: "My Servers", icon: Server },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const queryClient = useQueryClient();

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const initials = user
    ? (user.firstName?.[0] ?? user.username?.[0] ?? "A").toUpperCase()
    : "A";

  function handleWizardSuccess() {
    queryClient.invalidateQueries({ queryKey: getListServersQueryKey() });
  }

  return (
    <>
      {showWizard && (
        <ServerWizard
          onClose={() => setShowWizard(false)}
          onSuccess={handleWizardSuccess}
        />
      )}

      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
        <aside className="w-64 border-r border-border bg-card flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-border">
            <Terminal className="w-6 h-6 text-primary mr-3" />
            <span className="font-bold text-lg tracking-tight font-mono">ZenDash</span>
            {isAdmin && (
              <span className="ml-auto">
                <Shield className="w-4 h-4 text-primary" />
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                location === item.href ||
                (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </div>
                </Link>
              );
            })}

            {!isAdmin && (
              <button
                onClick={() => setShowWizard(true)}
                className="w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-primary/80 hover:bg-primary/10 hover:text-primary mt-2 border border-dashed border-primary/30"
              >
                <Plus className="w-4 h-4 mr-3" />
                Create Server
              </button>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{initials}</span>
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate font-mono">
                    @{user?.username}
                    {isAdmin && <span className="ml-1 text-primary">·admin</span>}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </>
  );
}
