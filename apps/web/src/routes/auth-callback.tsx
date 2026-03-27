import { useEffect } from "react";
import { useNavigate } from "react-router";
import { auth } from "@/container";
import { useAuthStore } from "@/hooks/use-auth-store";

export function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (user) setUser(user);
      navigate("/", { replace: true });
    });
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="font-mono text-xs text-ink-50">signing you in...</p>
    </div>
  );
}
