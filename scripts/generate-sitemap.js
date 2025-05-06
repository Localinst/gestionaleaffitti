import { createWriteStream, copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { Feed } from 'feed'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configurazione
const SITE_URL = process.env.VITE_SITE_URL || 'https://tenoris360.com'
const PUBLIC_DIR = resolve(__dirname, '../public')
const DIST_DIR = resolve(__dirname, '../dist')

// Funzione per copiare la sitemap esistente invece di generarne una nuova
async function copySitemap() {
  const publicSitemapPath = resolve(PUBLIC_DIR, 'sitemap.xml')
  const distSitemapPath = resolve(DIST_DIR, 'sitemap.xml')
  
  if (existsSync(publicSitemapPath)) {
    try {
      copyFileSync(publicSitemapPath, distSitemapPath)
      console.log('Sitemap esistente copiata con successo da public a dist!')
      return true
    } catch (error) {
      console.error('Errore durante la copia della sitemap:', error)
      return false
    }
  } else {
    console.error('File sitemap.xml non trovato in public/. Impossibile copiare.')
    return false
  }
}

// Funzione per generare il feed RSS
async function generateRSS() {
  const feed = new Feed({
    title: 'Tenoris360 - Software Gestione Affitti',
    description: 'Software gestione affitti e gestionale locazioni per proprietari e agenzie immobiliari. Programma gestione immobili in affitto, software contratti di locazione e sistema di gestione locativa completo.',
    id: SITE_URL,
    link: SITE_URL,
    language: 'it',
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `Tutti i diritti riservati ${new Date().getFullYear()}, Tenoris360`,
    author: {
      name: 'Tenoris360',
      email: 'tenoris360help@gmail.com',
      link: SITE_URL
    }
  })

  // Aggiungi articoli di esempio al feed
  feed.addItem({
    title: 'Come massimizzare i rendimenti dai tuoi immobili in affitto',
    id: `${SITE_URL}/blog/come-massimizzare-i-rendimenti-dai-tuoi-immobili-in-affitto`,
    link: `${SITE_URL}/blog/come-massimizzare-i-rendimenti-dai-tuoi-immobili-in-affitto`,
    description: 'Scopri le strategie più efficaci per aumentare il rendimento dei tuoi immobili in locazione, dall\'ottimizzazione dei costi alla gestione efficiente.',
    date: new Date('2025-03-20'),
  })

  feed.addItem({
    title: 'Guida completa ai contratti di locazione in Italia',
    id: `${SITE_URL}/blog/guida-completa-ai-contratti-di-locazione-in-italia`,
    link: `${SITE_URL}/blog/guida-completa-ai-contratti-di-locazione-in-italia`,
    description: 'Tutto quello che devi sapere sui contratti di locazione in Italia: tipologie, normative aggiornate e adempimenti fiscali per proprietari di immobili.',
    date: new Date('2025-02-15'),
  })

  feed.addItem({
    title: 'Le migliori pratiche per la gestione degli inquilini',
    id: `${SITE_URL}/blog/le-migliori-pratiche-per-la-gestione-degli-inquilini`,
    link: `${SITE_URL}/blog/le-migliori-pratiche-per-la-gestione-degli-inquilini`,
    description: 'Consigli pratici per stabilire relazioni positive con gli inquilini, prevenire i problemi più comuni e gestire efficacemente il rapporto locativo.',
    date: new Date('2025-01-18'),
  })

  // Genera il file RSS
  createWriteStream(resolve(DIST_DIR, 'rss.xml')).write(feed.rss2())
  console.log('Feed RSS generato con successo!')
}

// Esegui la generazione
async function generate() {
  try {
    await copySitemap()
    await generateRSS()
    console.log('Sitemap e RSS generati con successo!')
  } catch (error) {
    console.error('Errore durante la generazione:', error)
    process.exit(1)
  }
}

generate() 