import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";
import PropertiesPage from "./components/properties/PropertiesPage";
import TenantsPage from "./components/tenants/TenantsPage";
import TransactionsPage from "./components/transactions/TransactionsPage";
import ContractsPage from "./components/contracts/ContractsPage";
import DashboardPage from '@/components/dashboard/DashboardPage';
import ReportPage from "./components/dashboard/ReportPage";

// Configurazione avanzata di QueryClient con gestione della cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disabilita il caching
      staleTime: 0,
      // Effettua nuove richieste al remount dei componenti
      refetchOnMount: true,
      // Effettua nuove richieste al cambio di finestra
      refetchOnWindowFocus: true,
      // Effettua nuove richieste alla riconnessione
      refetchOnReconnect: true,
      // Ritentare fino a 2 volte in caso di errore
      retry: 2,
      // Non mantenere i dati precedenti durante le nuove richieste
      keepPreviousData: false,
      // Disabilita la cache
      cacheTime: 0,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <AuthProvider>
            <Routes>
              {/* Rotte pubbliche */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Rotte protette */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/properties" element={
                <ProtectedRoute>
                  <PropertiesPage />
                </ProtectedRoute>
              } />
              <Route path="/tenants" element={
                <ProtectedRoute>
                  <TenantsPage />
                </ProtectedRoute>
              } />
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              } />
              <Route path="/contracts" element={
                <ProtectedRoute>
                  <ContractsPage />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <ReportPage />
                </ProtectedRoute>
              } />
              
              {/* Pagina non trovata */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
