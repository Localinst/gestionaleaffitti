import { useAnalytics } from "@/hooks/useAnalytics";

interface AnalyticsWrapperProps {
  children: React.ReactNode;
}

/**
 * Componente wrapper che inizializza e gestisce l'analytics per l'intera applicazione
 */
const AnalyticsWrapper: React.FC<AnalyticsWrapperProps> = ({ children }) => {
  // Inizializza gli analytics
  useAnalytics();

  // Semplicemente renderizza i figli
  return <>{children}</>;
};

export default AnalyticsWrapper; 