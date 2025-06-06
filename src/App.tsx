import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Import Navigate
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ReviewFilePage from "./pages/ReviewFilePage";
import HistoryPage from "./pages/HistoryPage";
import Login from "./pages/Login"; // Import the Login page
import { supabase } from "@/integrations/supabase/client"; // Import your Supabase client
import { SessionContextProvider } from '@supabase/auth-ui-react'; // Import SessionContextProvider
import { useEffect, useState } from "react"; // Import useState and useEffect
import { Session } from "@supabase/supabase-js"; // Import Session type

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Add loading state for initial session check

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // Set loading to false after initial check
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // No need to set loading here, it's only for the initial check
    });

    // Cleanup the subscription
    return () => subscription.unsubscribe();
  }, []); // Empty dependency array means this runs once on mount

  // Show a loading indicator while checking the initial session
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={session}> {/* Wrap with SessionContextProvider */}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes - Redirect to login if no session */}
              <Route
                path="/"
                element={session ? <Index /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/review-file/:fileId"
                element={session ? <ReviewFilePage /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/history"
                element={session ? <HistoryPage /> : <Navigate to="/login" replace />}
              />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </SessionContextProvider>
  );
};

export default App;