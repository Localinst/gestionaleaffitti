import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/context/AuthContext";
import { TutorialProvider } from "@/context/TutorialContext";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import { SubscriptionProvider } from './context/SubscriptionContext';
import { SettingsProvider } from './context/SettingsContext';
import { TourGuide } from "@/components/tour/TourGuide";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SubscriptionRoute } from "@/components/auth/SubscriptionRoute";
import CookieConsent from "@/components/CookieConsent";
import AnalyticsWrapper from "@/components/AnalyticsWrapper";
import DataPrefetcher from "@/components/DataPrefetcher";
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
import { PrivacyPolicy, TerminiServizio, CookiePolicy, RefundPolicy } from './pages/Legali';
import ImportPage from './pages/ImportPage';
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import InfoPage from "./pages/InfoPage";
import AdminUsers from './pages/AdminUsers';
import AdminDashboard from './pages/AdminDashboard';
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import ProtectedPricing from './pages/ProtectedPricing';
import { useEffect } from "react";
import { setupAxiosInterceptors } from './services/api';

// Inizializza gli interceptor di Axios
setupAxiosInterceptors();

// Configurazione avanzata di QueryClient con gestione della cache ottimizzata
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mantiene i dati freschi per 5 minuti (300000ms)
      staleTime: 5 * 60 * 1000,
      
      // Mantiene i dati in cache per 30 minuti
      gcTime: 30 * 60 * 1000,
      
      // Effettua nuove richieste al remount dei componenti solo se i dati sono obsoleti (stale)
      refetchOnMount: 'always',
      
      // Non effettuare nuove richieste automaticamente al cambio di finestra se i dati non sono obsoleti
      refetchOnWindowFocus: false,
      
      // Effettua nuove richieste alla riconnessione solo se necessario
      refetchOnReconnect: true,
      
      // Ritentare fino a 2 volte in caso di errore
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HelmetProvider>
          <Toaster />
          <Sonner />
          <Router>
            <DataPrefetcher>
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

                            {/* Nuova rotta admin dashboard */}
                            <Route 
                              path="/admin-8b5c127e3f/dashboard" 
                              element={
                                <ProtectedRoute requiredRole="admin">
                                  <AdminDashboard />
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
                            <Route path="/rimborsi" element={<RefundPolicy />} />
                            <Route path="/features" element={<LandingPage />} />
                            <Route path="/testimonials" element={<LandingPage />} />
                            
                            {/* Rotte protette */}
                            <Route path="/subscribe" element={
                              <ProtectedRoute>
                                <ProtectedPricing />
                              </ProtectedRoute>
                            } />
                            
                            <Route path="/dashboard" element={
                              <SubscriptionRoute>
                                <DashboardPage />
                              </SubscriptionRoute>
                            } />
                            <Route path="/properties" element={
                              <SubscriptionRoute>
                                <PropertiesPage />
                              </SubscriptionRoute>
                            } />
                            <Route path="/tenants" element={
                              <SubscriptionRoute>
                                <TenantsPage />
                              </SubscriptionRoute>
                            } />
                            <Route path="/transactions" element={
                              <SubscriptionRoute>
                                <TransactionsPage />
                              </SubscriptionRoute>
                            } />
                            <Route path="/contracts" element={
                              <SubscriptionRoute>
                                <ContractsPage />
                              </SubscriptionRoute>
                            } />
                            <Route path="/reports" element={
                              <SubscriptionRoute>
                                <ReportPage />
                              </SubscriptionRoute>
                            } />
                            <Route path="/activities" element={
                              <SubscriptionRoute>
                                <ActivitiesPage />
                              </SubscriptionRoute>
                            } />
                            <Route path="/tourism/bookings" element={
                              <SubscriptionRoute>
                                <BookingsPage />
                              </SubscriptionRoute>
                            } />
                            <Route path="/tourism/properties" element={
                              <SubscriptionRoute>
                                <TourismPropertiesPage />
                              </SubscriptionRoute>
                            } />
                            <Route path="/tourism/property/:propertyId" element={
                              <SubscriptionRoute>
                                <PropertyDetails />
                              </SubscriptionRoute>
                            } />
                            <Route path="/import" element={
                              <SubscriptionRoute>
                                <ImportPage />
                              </SubscriptionRoute>
                            } />
                            
                            {/* Queste pagine potrebbero essere accessibili anche senza abbonamento, dipende dalle tue necessità */}
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
            </DataPrefetcher>
          </Router>
        </HelmetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
