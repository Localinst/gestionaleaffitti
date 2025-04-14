# Gestionale Affitti

Applicazione web per la gestione di proprietà immobiliari in affitto, inquilini e transazioni finanziarie.

## Funzionalità

- **Gestione Proprietà**: Aggiungi, visualizza e gestisci le tue proprietà immobiliari
- **Gestione Inquilini**: Tieni traccia degli inquilini per ogni proprietà
- **Gestione Transazioni**: Registra entrate e uscite legate agli affitti
- **Dashboard**: Visualizza statistiche e indicatori di performance

## Tecnologie Utilizzate

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend**: Node.js
- **Database**: Supabase (PostgreSQL)
- **Autenticazione**: JWT

## Installazione

```bash
# Clona il repository
git clone https://github.com/tuoutente/gestionale-affitti.git
cd gestionale-affitti

# Installa le dipendenze
npm install

# Configurazione ambiente
cp .env.example .env.local
```

Dopo aver copiato il file `.env.example` in `.env.local`, modifica i valori con le tue credenziali.

## Configurazione

1. Crea un account su [Supabase](https://supabase.com/) se non ne hai già uno
2. Crea un nuovo progetto in Supabase
3. Ottieni l'URL e la chiave anonima del progetto
4. Inserisci queste informazioni nel tuo file `.env.local`

## Avvio dell'applicazione

```bash
# Modalità sviluppo
npm run dev

# Build per produzione
npm run build

# Anteprima build produzione
npm run preview
```

## Struttura del Progetto

```
src/
├── components/     # Componenti React
├── context/        # Context API per lo stato globale
├── lib/            # Utility e configurazioni
├── pages/          # Pagine dell'applicazione
└── services/       # Servizi per API e logica business
```

## Deploy

Per il deploy in produzione:

1. Assicurati di aver completato la build: `npm run build`
2. I file statici generati nella cartella `dist` possono essere ospitati su qualsiasi servizio di hosting (Netlify, Vercel, GitHub Pages, ecc.)

## Contribuire

Se desideri contribuire, segui questi passaggi:

1. Fai un fork del repository
2. Crea un branch con la tua feature: `git checkout -b feature/nome-feature`
3. Commit delle tue modifiche: `git commit -m 'Aggiungi nuova feature'`
4. Push al branch: `git push origin feature/nome-feature`
5. Apri una Pull Request

## Licenza

Questo progetto è rilasciato sotto licenza MIT.
