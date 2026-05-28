import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pingBackend, API_BASE_URL } from "@/api/equiriskApi";
import { cn } from "@/lib/utils";

export function Header() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const checkingRef = useRef(false);

  const check = useCallback(async () => {
    if (checkingRef.current) return;

    checkingRef.current = true;
    setStatus("checking");

    try {
      const ok = await pingBackend();
      setStatus(ok ? "online" : "offline");
    } catch {
      setStatus("offline");
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    check();

    const id = window.setInterval(() => {
      check();
    }, 60000);

    return () => {
      window.clearInterval(id);
    };
  }, [check]);

  return (
    <header className="h-16 border-b border-border bg-card/40 backdrop-blur px-6 flex items-center justify-between">
      <div>
        <div className="text-sm text-muted-foreground">Equity Derivatives</div>
        <h1 className="text-base font-semibold tracking-tight">Risk & Pricing Workbench</h1>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline" className="border-warning/40 text-warning bg-warning/10">
          UAT
        </Badge>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-secondary/40 text-xs">
          <Circle
            className={cn(
              "h-2.5 w-2.5 fill-current",
              status === "online" && "text-positive",
              status === "offline" && "text-negative",
              status === "checking" && "text-muted-foreground animate-pulse",
            )}
          />

          <span className="text-muted-foreground">API</span>

          <span className="font-medium">
            {status === "online"
              ? "Connected"
              : status === "offline"
                ? "Offline"
                : "Checking..."}
          </span>

          <span className="text-muted-foreground hidden lg:inline">· {API_BASE_URL}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={check}
          aria-label="Refresh status"
          disabled={status === "checking"}
        >
          <RefreshCw
            className={cn("h-4 w-4", status === "checking" && "animate-spin")}
          />
        </Button>
      </div>
    </header>
  );
}