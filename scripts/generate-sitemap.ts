import { SitemapStream } from 'sitemap'
import { createWriteStream } from 'fs'
import { resolve } from 'path'
import { Feed } from 'feed'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configurazione
const SITE_URL = process.env.VITE_SITE_URL || 'https://tuodominio.com'
const PUBLIC_DIR = resolve(__dirname, '../dist')

// Funzione per generare la sitemap
async function generateSitemap() {
  const sitemap = new SitemapStream({ hostname: SITE_URL })
  
  // Aggiungi le pagine statiche
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/blog', changefreq: 'daily', priority: 0.8 },
    { url: '/guide', changefreq: 'weekly', priority: 0.7 },
    { url: '/supporto', changefreq: 'monthly', priority: 0.5 },
    { url: '/privacy', changefreq: 'yearly', priority: 0.3 },
    { url: '/termini', changefreq: 'yearly', priority: 0.3 },
    { url: '/cookie', changefreq: 'yearly', priority: 0.3 },
    { url: '/pricing', changefreq: 'weekly', priority: 0.8 },
  ]

  // Aggiungi le pagine alla sitemap
  staticPages.forEach(page => {
    sitemap.write(page)
  })

  // Qui puoi aggiungere le pagine dinamiche dal tuo database
  // Esempio:
  // const blogPosts = await fetchBlogPosts()
  // blogPosts.forEach(post => {
  //   sitemap.write({
  //     url: `/blog/${post.slug}`,
  //     changefreq: 'weekly',
  //     priority: 0.7,
  //     lastmod: post.updatedAt
  //   })
  // })

  sitemap.end()

  // Genera il file sitemap.xml
  const sitemapXML = await new Promise((resolve, reject) => {
    const chunks: any[] = []
    sitemap.on('data', chunk => chunks.push(chunk))
    sitemap.on('end', () => resolve(Buffer.concat(chunks)))
    sitemap.on('error', reject)
  })

  createWriteStream(resolve(PUBLIC_DIR, 'sitemap.xml')).write(sitemapXML)
}

// Funzione per generare il feed RSS
async function generateRSS() {
  const feed = new Feed({
    title: 'Il Tuo Sito',
    description: 'Descrizione del tuo sito',
    id: SITE_URL,
    link: SITE_URL,
    language: 'it',
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `Tutti i diritti riservati ${new Date().getFullYear()}`,
    author: {
      name: 'Il Tuo Nome',
      email: 'email@tuodominio.com',
      link: SITE_URL
    }
  })

  // Qui puoi aggiungere i post del blog dal tuo database
  // Esempio:
  // const blogPosts = await fetchBlogPosts()
  // blogPosts.forEach(post => {
  //   feed.addItem({
  //     title: post.title,
  //     id: `${SITE_URL}/blog/${post.slug}`,
  //     link: `${SITE_URL}/blog/${post.slug}`,
  //     description: post.excerpt,
  //     content: post.content,
  //     date: new Date(post.publishedAt)
  //   })
  // })

  // Genera il file RSS
  createWriteStream(resolve(PUBLIC_DIR, 'rss.xml')).write(feed.rss2())
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