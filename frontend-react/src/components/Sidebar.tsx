import { Link, useRouterState } from "@tanstack/react-router";
import { LineChart, Layers3, Activity, Gauge, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const syncAuthState = () => {
      setEmail(localStorage.getItem("equirisk_email"));
    };

    syncAuthState();

    window.addEventListener("authChanged", syncAuthState);

    return () => {
      window.removeEventListener("authChanged", syncAuthState);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("equirisk_token");
    localStorage.removeItem("equirisk_email");

    setEmail(null);
    window.dispatchEvent(new Event("authChanged"));

    window.location.href = "/auth";
  };

  const items = [
    { to: "/", label: "Single Trade Pricing", icon: Gauge },
    { to: "/portfolio", label: "Portfolio Risk", icon: Layers3 },
    { to: "/scenario", label: "Scenario Risk", icon: Activity },
    ...(!email
      ? [{ to: "/auth", label: "Login / Register", icon: LockKeyhole }]
      : []),
  ] as const;

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-md">
          <LineChart className="h-5 w-5 text-primary-foreground" />
        </div>

        <div className="leading-tight">
          <div className="font-semibold tracking-tight">EquiRisk</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Quant Risk Analytics
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Workbench
        </div>

        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;

          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border text-[11px] text-muted-foreground space-y-2">
        <div>
          <div className="font-medium text-sidebar-foreground">EquiRisk v1.0</div>
          <div>Equity Derivatives Desk</div>
        </div>

        {email && (
          <div className="pt-2 border-t border-sidebar-border/60">
            <div className="text-sidebar-foreground font-medium break-all">
              {email}
            </div>

            <button
              className="mt-2 text-xs text-red-400 hover:text-red-300"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}