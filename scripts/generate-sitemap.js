import { createWriteStream } from 'fs'
import { resolve } from 'path'
import { Feed } from 'feed'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { SitemapStream, streamToPromise } from 'sitemap'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configurazione
const SITE_URL = process.env.VITE_SITE_URL || 'https://tenoris360.com'
const DIST_DIR = resolve(__dirname, '../dist')

// Funzione per generare la sitemap
async function generateSitemap() {
  console.log('Generazione sitemap in corso...')
  
  // Crea stream per la sitemap
  const sitemap = new SitemapStream({ hostname: SITE_URL })
  
  // Aggiungi le pagine principali
  sitemap.write({
    url: '/',
    changefreq: 'monthly',
    priority: 1.0,
    lastmod: new Date().toISOString()
  })
  
  // Pagine dell'applicazione
  const appPages = [
    { url: '/dashboard', changefreq: 'daily', priority: 0.9 },
    { url: '/properties', changefreq: 'daily', priority: 0.9 },
    { url: '/tenants', changefreq: 'daily', priority: 0.9 },
    { url: '/transactions', changefreq: 'daily', priority: 0.9 },
    { url: '/activities', changefreq: 'daily', priority: 0.8 },
    { url: '/documents', changefreq: 'daily', priority: 0.8 },
    { url: '/settings', changefreq: 'monthly', priority: 0.7 },
    { url: '/reports', changefreq: 'weekly', priority: 0.8 },
    { url: '/profile', changefreq: 'monthly', priority: 0.7 },
    { url: '/calendar', changefreq: 'daily', priority: 0.8 }
  ]
  
  // Aggiungi le pagine dell'applicazione
  appPages.forEach(page => {
    sitemap.write({
      url: page.url,
      changefreq: page.changefreq,
      priority: page.priority,
      lastmod: new Date().toISOString()
    })
  })
  
  // Pagine informative
  const infoPages = [
    { url: '/blog', changefreq: 'weekly', priority: 0.8 },
    { url: '/guide', changefreq: 'monthly', priority: 0.8 },
    { url: '/supporto', changefreq: 'monthly', priority: 0.6 },
    { url: '/pricing', changefreq: 'monthly', priority: 0.8 },
    { url: '/privacy', changefreq: 'yearly', priority: 0.5 },
    { url: '/termini', changefreq: 'yearly', priority: 0.5 },
    { url: '/cookie', changefreq: 'yearly', priority: 0.5 }
  ]
  
  // Aggiungi le pagine informative
  infoPages.forEach(page => {
    sitemap.write({
      url: page.url,
      changefreq: page.changefreq,
      priority: page.priority,
      lastmod: new Date().toISOString()
    })
  })
  
  // Articoli del blog
  const blogPosts = [
    {
      url: '/blog/come-massimizzare-i-rendimenti-dai-tuoi-immobili-in-affitto',
      date: new Date('2025-03-20')
    },
    {
      url: '/blog/guida-completa-ai-contratti-di-locazione-in-italia',
      date: new Date('2025-02-15')
    },
    {
      url: '/blog/le-migliori-pratiche-per-la-gestione-degli-inquilini',
      date: new Date('2025-01-18')
    }
  ]
  
  // Aggiungi gli articoli del blog
  blogPosts.forEach(post => {
    sitemap.write({
      url: post.url,
      lastmod: post.date.toISOString(),
      changefreq: 'yearly',
      priority: 0.7
    })
  })
  
  // Guide
  const guides = [
    {
      url: '/guide/ottimizzare-la-gestione-degli-affitti-brevi',
      date: new Date('2025-03-12')
    },
    {
      url: '/guide/adempimenti-fiscali-per-proprietari-di-immobili',
      date: new Date('2025-02-20')
    },
    {
      url: '/guide/massimizzare-occupazione-affitti-brevi',
      date: new Date('2025-01-25')
    },
    {
      url: '/guide/tipologie-contratti-affitto',
      date: new Date('2025-01-10')
    }
  ]
  
  // Aggiungi le guide
  guides.forEach(guide => {
    sitemap.write({
      url: guide.url,
      lastmod: guide.date.toISOString(),
      changefreq: 'yearly',
      priority: 0.7
    })
  })
  
  // Pagina 404
  sitemap.write({
    url: '/404',
    changefreq: 'yearly',
    priority: 0.1,
    lastmod: new Date().toISOString()
  })
  
  // Chiudi lo stream della sitemap
  sitemap.end()
  
  // Crea il file della sitemap
  const sitemapXML = await streamToPromise(sitemap)
  createWriteStream(resolve(DIST_DIR, 'sitemap.xml')).write(sitemapXML.toString())
  console.log('Sitemap generata con successo in', resolve(DIST_DIR, 'sitemap.xml'))
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
    await generateSitemap()
    await generateRSS()
    console.log('Sitemap e RSS generati con successo!')
  } catch (error) {
    console.error('Errore durante la generazione:', error)
    process.exit(1)
  }
}

generate() 