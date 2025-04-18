import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n' // Importa e inizializza i18n

createRoot(document.getElementById("root")!).render(<App />);
