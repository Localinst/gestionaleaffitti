import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { TutorialProvider } from "@/context/TutorialContext";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import { SubscriptionProvider } from './context/SubscriptionContext';
import { TourGuide } from "@/components/tour/TourGuide";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import CookieConsent from "@/components/CookieConsent";
import AnalyticsWrapper from "@/components/AnalyticsWrapper";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import PropertiesPage from "./components/properties/PropertiesPage";
import TenantsPage from "./components/tenants/TenantsPage";
import TransactionsPage from "./components/transactions/TransactionsPage";
import ContractsPage from "./components/contracts/ContractsPage";
import DashboardPage from '@/components/dashboard/DashboardPage';
import ReportPage from "./components/dashboard/ReportPage";
import ActivitiesPage from "./components/activities/ActivitiesPage";
import BookingsPage from "./components/tourism/BookingsPage";
import PropertyDetails from "./components/tourism/PropertyDetails";
import TourismPropertiesPage from "./components/tourism/PropertiesPage";
import AbbonamentoConfermato from './pages/AbbonamentoConfermato';
import BlogPage from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import Guides from './pages/Guides';
import GuideDetail from './pages/GuideDetail';
import SupportoPage from './pages/Supporto';
import { PrivacyPolicy, TerminiServizio, CookiePolicy } from './pages/Legali';

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
      // keepPreviousData: false, // Proprietà non più supportata
      // Disabilita la cache (rinominato in gcTime nelle versioni recenti)
      gcTime: 0,
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
            <TutorialProvider>
              <CookieConsentProvider>
                <SubscriptionProvider>
                  <AnalyticsWrapper>
                    <TourGuide />
                    <CookieConsent />
                    <Routes>
                      {/* Rotte pubbliche */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/abbonamento-confermato" element={<AbbonamentoConfermato />} />
                      
                      {/* Nuove pagine landing */}
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogDetail />} />
                      <Route path="/guide" element={<Guides />} />
                      <Route path="/guide/:slug" element={<GuideDetail />} />
                      <Route path="/supporto" element={<SupportoPage />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/termini" element={<TerminiServizio />} />
                      <Route path="/cookie" element={<CookiePolicy />} />
                      <Route path="/features" element={<LandingPage />} />
                      <Route path="/testimonials" element={<LandingPage />} />
                      
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
                      <Route path="/activities" element={
                        <ProtectedRoute>
                          <ActivitiesPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/tourism/bookings" element={
                        <ProtectedRoute>
                          <BookingsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/tourism/property/:propertyId" element={
                        <ProtectedRoute>
                          <PropertyDetails />
                        </ProtectedRoute>
                      } />
                      <Route path="/tourism/properties" element={
                        <ProtectedRoute>
                          <TourismPropertiesPage />
                        </ProtectedRoute>
                      } />
                      
                      {/* Pagina non trovata */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AnalyticsWrapper>
                </SubscriptionProvider>
              </CookieConsentProvider>
            </TutorialProvider>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
