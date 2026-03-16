import { Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function GuestBanner() {
  const { isAuthenticated, openLoginModal } = useAuth();

  if (isAuthenticated) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-cfo-amber/10 border-b border-cfo-amber/30 text-xs font-mono">
      <div className="flex items-center gap-2 text-cfo-amber">
        <Lock size={11} />
        <span>View-Only Mode — save and edit operations require login</span>
      </div>
      <button
        type="button"
        onClick={openLoginModal}
        className="shrink-0 px-3 py-1 rounded bg-cfo-amber/20 border border-cfo-amber/40 text-cfo-amber hover:bg-cfo-amber/30 transition-colors font-semibold text-[11px]"
        data-ocid="guest.login_button"
      >
        Login to unlock
      </button>
    </div>
  );
}
