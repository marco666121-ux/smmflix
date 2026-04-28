import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Admin from "./pages/Admin.tsx";
import ServiceDetail from "./pages/ServiceDetail.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "@/hooks/useAuth";
import { BanGate } from "@/components/BanGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BanGate>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BanGate>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
