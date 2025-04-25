import ProtectedPricing from '@/pages/ProtectedPricing';

const router = createBrowserRouter([
  // ... existing routes ...
  
  // Pagina protetta per l'abbonamento
  {
    path: "/subscribe",
    element: <ProtectedRoute><ProtectedPricing /></ProtectedRoute>,
  },
  
  // ... existing routes ...
]); 