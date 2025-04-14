import type { Step } from 'react-joyride';

export const dashboardTutorial: Step[] = [
  {
    target: 'body',
    content: 'Benvenuto nel Gestionale Affitti! Ti guideremo attraverso le funzionalità principali dell\'applicazione.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.nav-menu',
    content: 'Qui puoi navigare tra le diverse sezioni dell\'applicazione. Il menu si adatta automaticamente al tuo schermo.',
    placement: 'bottom',
  },
  {
    target: '.search-bar',
    content: 'Usa questa barra di ricerca per trovare rapidamente proprietà, inquilini o prenotazioni. La ricerca è in tempo reale!',
    placement: 'bottom',
  },
  {
    target: '.quick-actions',
    content: 'Queste sono le azioni rapide più utilizzate. Puoi accedervi facilmente da qui per svolgere le operazioni più comuni.',
    placement: 'right',
  },
  {
    target: '.stats-cards',
    content: 'Qui puoi vedere un riepilogo delle tue attività: proprietà attive, inquilini, prenotazioni e incassi del mese.',
    placement: 'bottom',
  },
  {
    target: '.recent-activities',
    content: 'Mantieni sotto controllo le ultime attività: pagamenti, prenotazioni, manutenzioni e molto altro.',
    placement: 'left',
  },
];

export const propertiesTutorial: Step[] = [
  {
    target: 'body',
    content: 'Benvenuto nella sezione Proprietà! Qui puoi gestire tutte le tue proprietà in modo efficiente.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.add-property-button',
    content: 'Clicca qui per aggiungere una nuova proprietà. Potrai inserire tutti i dettagli necessari, inclusi documenti e foto.',
    placement: 'bottom',
  },
  {
    target: '.property-filters',
    content: 'Usa questi filtri per trovare rapidamente le proprietà che ti interessano. Puoi filtrare per stato, tipo, prezzo e molto altro.',
    placement: 'bottom',
  },
  {
    target: '.property-card',
    content: 'Ogni card mostra le informazioni principali della proprietà. Clicca per vedere i dettagli completi, inclusi documenti, inquilini e manutenzioni.',
    placement: 'right',
  },
  {
    target: '.property-actions',
    content: 'Da qui puoi gestire rapidamente la proprietà: visualizzare i documenti, gestire gli inquilini, programmare manutenzioni e molto altro.',
    placement: 'bottom',
  },
];

export const tenantsTutorial: Step[] = [
  {
    target: 'body',
    content: 'Benvenuto nella sezione Inquilini! Qui puoi gestire tutti i tuoi inquilini e le loro informazioni.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.add-tenant-button',
    content: 'Clicca qui per aggiungere un nuovo inquilino. Potrai inserire tutti i dati necessari, inclusi documenti e garanti.',
    placement: 'bottom',
  },
  {
    target: '.tenant-filters',
    content: 'Usa questi filtri per trovare rapidamente gli inquilini che ti interessano. Puoi filtrare per stato, proprietà, data di scadenza e molto altro.',
    placement: 'bottom',
  },
  {
    target: '.tenant-card',
    content: 'Ogni card mostra le informazioni principali dell\'inquilino. Clicca per vedere i dettagli completi, inclusi pagamenti, contratti e comunicazioni.',
    placement: 'right',
  },
  {
    target: '.tenant-actions',
    content: 'Da qui puoi gestire rapidamente l\'inquilino: visualizzare i pagamenti, gestire i contratti, inviare comunicazioni e molto altro.',
    placement: 'bottom',
  },
];

export const tourismTutorial: Step[] = [
  {
    target: 'body',
    content: 'Benvenuto nella sezione Turismo! Qui puoi gestire le prenotazioni turistiche e il calendario delle disponibilità.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.add-booking-button',
    content: 'Clicca qui per aggiungere una nuova prenotazione. Potrai gestire check-in, check-out, ospiti e servizi aggiuntivi.',
    placement: 'bottom',
  },
  {
    target: '.booking-filters',
    content: 'Usa questi filtri per trovare rapidamente le prenotazioni che ti interessano. Puoi filtrare per data, stato, proprietà e molto altro.',
    placement: 'bottom',
  },
  {
    target: '.booking-card',
    content: 'Ogni card mostra le informazioni principali della prenotazione. Clicca per vedere i dettagli completi, inclusi ospiti, pagamenti e servizi.',
    placement: 'right',
  },
  {
    target: '.calendar-view',
    content: 'Visualizza e gestisci le disponibilità delle tue proprietà turistiche. Puoi bloccare periodi, gestire prenotazioni e sincronizzare con altri calendari.',
    placement: 'bottom',
  },
  {
    target: '.booking-actions',
    content: 'Da qui puoi gestire rapidamente la prenotazione: inviare conferme, gestire i pagamenti, comunicare con gli ospiti e molto altro.',
    placement: 'bottom',
  },
]; 