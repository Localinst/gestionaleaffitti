import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTutorial } from '@/context/TutorialContext';
import { Step } from 'react-joyride';

// Stili comuni per riutilizzo
const titleStyle = { color: '#1e3a8a', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' };
const textStyle = { fontSize: '15px', lineHeight: '1.5' };
const listStyle = { fontSize: '14px', paddingLeft: '20px', lineHeight: '1.4', marginTop: '8px' };

// Mappa delle pagine con i rispettivi tutorial
const PAGE_TUTORIALS: Record<string, Step[]> = {
  '/dashboard': [
    {
      target: '[data-tutorial="dashboard-overview"]',
      content: (
        <div>
          <h2 style={titleStyle}>📊 Dashboard Overview</h2>
          <p style={textStyle}>Questa è la dashboard principale che mostra tutte le informazioni rilevanti.</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tutorial="dashboard-stats"]',
      content: (
        <div>
          <h2 style={titleStyle}>📈 Statistiche</h2>
          <p style={textStyle}>Qui puoi vedere le statistiche principali sui tuoi immobili e inquilini:</p>
          <ul style={listStyle}>
            <li>Dati delle proprietà</li>
            <li>Informazioni sugli inquilini</li>
            <li>Incassi mensili</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
  ],
  '/properties': [
    {
      target: '[data-tutorial="properties-list"]',
      content: (
        <div>
          <h2 style={titleStyle}>🏠 Elenco Proprietà</h2>
          <p style={textStyle}>Qui puoi visualizzare tutte le tue proprietà in affitto:</p>
          <ul style={listStyle}>
            <li>Visualizza dettagli di ogni proprietà</li>
            <li>Modifica le informazioni</li>
            <li>Controlla lo stato di occupazione</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tutorial="properties-add"]',
      content: (
        <div>
          <h2 style={titleStyle}>➕ Aggiungi Proprietà</h2>
          <p style={textStyle}>Clicca qui per aggiungere una nuova proprietà al tuo portafoglio.</p>
          <p style={textStyle}>Potrai inserire tutti i dettagli come indirizzo, tipo di immobile e unità disponibili.</p>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
    },
  ],
  '/tenants': [
    {
      target: '[data-tutorial="tenants-list"]',
      content: (
        <div>
          <h2 style={titleStyle}>👥 Elenco Inquilini</h2>
          <p style={textStyle}>Qui puoi visualizzare tutti i tuoi inquilini:</p>
          <ul style={listStyle}>
            <li>Informazioni di contatto</li>
            <li>Immobili occupati</li>
            <li>Stato dei pagamenti</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tutorial="tenants-add"]',
      content: (
        <div>
          <h2 style={titleStyle}>➕ Aggiungi Inquilino</h2>
          <p style={textStyle}>Clicca qui per aggiungere un nuovo inquilino.</p>
          <p style={textStyle}>Potrai inserire tutte le informazioni necessarie e associarlo a una proprietà.</p>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
    },
  ],
  '/transactions': [
    {
      target: '[data-tutorial="transactions-list"]',
      content: (
        <div>
          <h2 style={titleStyle}>💰 Elenco Transazioni</h2>
          <p style={textStyle}>Qui puoi visualizzare tutte le transazioni finanziarie:</p>
          <ul style={listStyle}>
            <li>Affitti ricevuti</li>
            <li>Spese di manutenzione</li>
            <li>Bilancio complessivo</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
  ],
};

export function usePageTutorial() {
  const location = useLocation();
  const { setSteps } = useTutorial();
  const currentPath = location.pathname;

  useEffect(() => {
    console.log('usePageTutorial: pathname attuale:', currentPath);
    
    // Trova il tutorial specifico per questa pagina
    const tutorialSteps = PAGE_TUTORIALS[currentPath];
    
    if (tutorialSteps) {
      console.log('usePageTutorial: Trovati steps per questa pagina:', tutorialSteps);
      // Imposta gli step senza avviare il tutorial (verrà avviato dal click)
      setSteps(tutorialSteps);
    }
  }, [currentPath, setSteps]);

  return null;
} 