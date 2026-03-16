import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export function LoginModal() {
  const { showLoginModal, closeLoginModal, login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  if (!showLoginModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(password);
    if (!ok) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      setPassword("");
      setError(false);
    }
  };

  const handleClose = () => {
    closeLoginModal();
    setPassword("");
    setError(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
      data-ocid="login.modal"
    >
      <div
        className={`relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl ${
          shake ? "animate-shake" : ""
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="login.close_button"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            Unlock Full Access
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your password to save and edit
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="modal-password"
              className="text-foreground/80 text-sm"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="modal-password"
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
                className="text-destructive text-xs flex items-center gap-1"
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
