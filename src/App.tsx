import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { TutorialProvider } from "@/context/TutorialContext";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import { SubscriptionProvider } from './context/SubscriptionContext';
import { SettingsProvider } from './context/SettingsContext';
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
import ImportPage from './pages/ImportPage';
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import InfoPage from "./pages/InfoPage";
import AdminUsers from './pages/AdminUsers';
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import { useEffect } from "react";

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

// Imposta una Content Security Policy (CSP) per proteggere l'applicazione
const setupCSP = () => {
  if (typeof document !== 'undefined') {
    // Creiamo un meta tag per CSP
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    
    // Definisci una policy CSP restrittiva
    meta.content = [
      // Limita fonti di scripts al proprio dominio
      "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://fonts.googleapis.com 'unsafe-inline' 'unsafe-eval'",
      // Limita fonti di stili
      "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
      // Limita fonti di immagini
      "img-src 'self' data: https://images.unsplash.com",
      // Limita fonti di font
      "font-src 'self' https://fonts.gstatic.com",
      // Limita connessioni a websocket e XHR - aggiunto localhost:3000, onrender e Supabase URL
      "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com http://localhost:3000 https://localhost:3000 https://gestionaleaffitti.onrender.com https://fdufcrgckojbaghdvhgj.supabase.co",
      // Limita form al proprio dominio
      "form-action 'self'",
      // Limita integrazione frame
      "frame-src 'self'",
      // Applica protezione XSS
      "base-uri 'self'",
      // Previeni MIME type sniffing
      "object-src 'none'"
    ].join('; ');
    
    // Aggiungi il meta tag all'head
    document.head.appendChild(meta);
  }
};

const App = () => {
  // Esegui setup CSP al caricamento dell'app
  useEffect(() => {
    setupCSP();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <AuthProvider>
            <SettingsProvider>
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
                        <Route path="/update-password" element={<UpdatePasswordPage />} />
                        
                        {/* Rotta admin segreta protetta */}
                        <Route 
                          path="/admin-8b5c127e3f" 
                          element={
                            <ProtectedRoute requiredRole="admin">
                              <AdminUsers />
                            </ProtectedRoute>
                          } 
                        />
                        
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
                        {/* 
                         * TODO: Implementare le pagine di dettaglio mancanti:
                         * - Dettaglio proprietà (/properties/:id)
                         * - Dettaglio inquilino (/tenants/:id)
                         * - Dettaglio transazione (/transactions/:id)
                         * - Dettaglio contratto (/contracts/:id)
                         *
                         * Le rotte sono state temporaneamente rimosse per evitare errori
                         * fino a quando i componenti corrispondenti non saranno creati.
                         */}
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
                        <Route path="/tourism/properties" element={
                          <ProtectedRoute>
                            <TourismPropertiesPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/tourism/property/:propertyId" element={
                          <ProtectedRoute>
                            <PropertyDetails />
                          </ProtectedRoute>
                        } />
                        <Route path="/import" element={
                          <ProtectedRoute>
                            <ImportPage />
                          </ProtectedRoute>
                        } />
                        
                        {/* Nuove pagine */}
                        <Route path="/notifications" element={
                          <ProtectedRoute>
                            <NotificationsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <SettingsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/info" element={
                          <ProtectedRoute>
                            <InfoPage />
                          </ProtectedRoute>
                        } />
                        
                        {/* Pagina non trovata */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AnalyticsWrapper>
                  </SubscriptionProvider>
                </CookieConsentProvider>
              </TutorialProvider>
            </SettingsProvider>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
