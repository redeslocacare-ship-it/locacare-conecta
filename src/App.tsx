import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/layout/AppShell";
import DashboardPage from "@/pages/Dashboard";
import SyncPage from "@/pages/Sync";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import ClientesPage from "@/pages/admin/ClientesPage";
import PoltronasPage from "@/pages/admin/PoltronasPage";
import PlanosPage from "@/pages/admin/PlanosPage";
import LocacoesPage from "@/pages/admin/LocacoesPage";
import ConteudosPage from "@/pages/admin/ConteudosPage";
import UsuariosPage from "@/pages/admin/UsuariosPage";

const queryClient = new QueryClient();

// Main App Component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/app"
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="sync" element={<SyncPage />} />
            </Route>

            {/* <Route path="/site" element={<Index />} /> */}

            <Route path="/auth" element={<Navigate to="/login" replace />} />

            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="poltronas" element={<PoltronasPage />} />
              <Route path="planos" element={<PlanosPage />} />
              <Route path="locacoes" element={<LocacoesPage />} />
              <Route path="conteudos" element={<ConteudosPage />} />
              <Route path="usuarios" element={<UsuariosPage />} />
            </Route>

            {/* atalho */}
            <Route path="/dashboard" element={<Navigate to="/admin" replace />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
