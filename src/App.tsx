import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Removed Navigate
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ReviewFilePage from "./pages/ReviewFilePage";
import HistoryPage from "./pages/HistoryPage";
// Removed Login import
// Removed Supabase client import
// Removed SessionContextProvider import
// Removed useState and useEffect imports
// Removed Session type import

const queryClient = new QueryClient();

const App = () => {
  // Removed session and loading state
  // Removed useEffect for auth state

  return (
    // Removed SessionContextProvider
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* All routes are now public */}
            <Route path="/" element={<Index />} />
            <Route path="/review-file/:fileId" element={<ReviewFilePage />} />
            <Route path="/history" element={<HistoryPage />} />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    // Removed closing SessionContextProvider tag
  );
};

export default App;