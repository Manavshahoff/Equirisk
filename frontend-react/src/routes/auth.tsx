import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, LockKeyhole, UserPlus } from "lucide-react";

import { loginUser, registerUser } from "@/api/equiriskApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("manav@test.com");
  const [password, setPassword] = useState("test123");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response =
        mode === "login"
          ? await loginUser({ email, password })
          : await registerUser({ email, password });

      localStorage.setItem("equirisk_token", response.access_token);
      localStorage.setItem("equirisk_email", email);

      window.dispatchEvent(new Event("authChanged"));


      toast.success(mode === "login" ? "Login successful" : "Account created");

      navigate({ to: "/portfolio" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Authentication failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-card/80 border-border/80 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            {mode === "login" ? "Login to EquiRisk" : "Create EquiRisk Account"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Access your saved trades and portfolio risk runs.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              placeholder="manav@test.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              placeholder="test123"
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use 6 to 72 characters.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : mode === "login" ? (
              <>
                <LockKeyhole className="h-4 w-4" />
                Login
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Register
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  className="text-primary font-medium hover:underline"
                  onClick={() => setMode("register")}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  className="text-primary font-medium hover:underline"
                  onClick={() => setMode("login")}
                >
                  Login
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}