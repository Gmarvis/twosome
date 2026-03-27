import { BrowserRouter, Routes, Route } from "react-router";
import { useEffect, useState, useCallback } from "react";
import { auth } from "./container";
import { useAuthStore } from "./hooks/use-auth-store";
import { ErrorBoundary } from "./components/error-boundary";
import { SplashScreen } from "./components/ui/splash-screen";
import { Home } from "./routes/home";
import { Setup } from "./routes/setup";
import { Room } from "./routes/room";
import { Play } from "./routes/play";
import { Finished } from "./routes/finished";
import { AuthCallback } from "./routes/auth-callback";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Check for existing session
    auth.getCurrentUser().then((user) => {
      if (user) {
        setUser(user);
      } else {
        // Auto sign-in anonymously
        auth.signInAnonymously().then(setUser).catch(() => setLoading(false));
      }
    });

    // Listen for auth changes
    const unsubscribe = auth.onAuthStateChange(setUser);
    return unsubscribe;
  }, [setUser, setLoading]);

  return <>{children}</>;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <SplashScreen visible={!splashDone} onFinish={handleSplashFinish} />
        <AuthProvider>
          <div className="min-h-dvh bg-bg flex flex-col items-center">
            <div className="w-full max-w-md min-h-dvh flex flex-col">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/room/:code" element={<Room />} />
                <Route path="/play/:roomId" element={<Play />} />
                <Route path="/finished/:roomId" element={<Finished />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
              </Routes>
            </div>
          </div>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
