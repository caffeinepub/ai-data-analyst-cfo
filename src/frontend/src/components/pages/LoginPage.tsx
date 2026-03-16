import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Lock, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const APP_PASSWORD = "cfo2024";

interface LoginPageProps {
  onLogin: () => void;
  onGuest?: () => void;
}

export function LoginPage({ onLogin, onGuest }: LoginPageProps) {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === APP_PASSWORD) {
      login(password);
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div
        className={`w-full max-w-sm transition-transform ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            CFO.ai
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Virtual CFO for your business
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground/80 text-sm">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  placeholder="Enter password"
                  className={`pl-9 bg-background border-border focus:border-primary ${
                    error ? "border-destructive focus:border-destructive" : ""
                  }`}
                  autoFocus
                  data-ocid="login.input"
                />
              </div>
              {error && (
                <p
                  className="text-destructive text-xs mt-1 flex items-center gap-1"
                  data-ocid="login.error_state"
                >
                  <span>⚠</span> Incorrect password
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              data-ocid="login.submit_button"
            >
              Login
            </Button>
          </form>

          {onGuest && (
            <div className="mt-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onGuest}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors font-medium"
                data-ocid="login.guest_button"
              >
                <Eye size={15} />
                Continue as Guest (View Only)
              </button>
              <p className="text-center text-muted-foreground/60 text-[11px] mt-2">
                Browse and explore — login required to save data
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-muted-foreground/50 text-xs mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-muted-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease; }
      `}</style>
    </div>
  );
}
