import { hydrateRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { App } from '../App'

export const clientRouting = true
export const hydrationCanBeAborted = true

let root: any
export async function render(pageContext: any) {
  const { Page, pageProps } = pageContext
  const queryClient = new QueryClient()

  const page = (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App>
            <Page {...pageProps} />
          </App>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  )

  const container = document.getElementById('root')
  if (container.innerHTML === '' || !root) {
    root = hydrateRoot(container, page)
  } else {
    root.render(page)
  }
} 