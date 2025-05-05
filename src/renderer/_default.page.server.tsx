import { renderToString } from 'react-dom/server'
import { escapeInject, dangerouslySkipEscape } from 'vite-plugin-ssr/server'
import { HelmetProvider, HelmetServerState } from 'react-helmet-async'
import { StaticRouter } from 'react-router-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from '../App'

export { render }
export { passToClient }

const passToClient = ['pageProps', 'urlPathname']

async function render(pageContext: any) {
  const { Page, pageProps } = pageContext
  const queryClient = new QueryClient()
  const helmetContext = {}

  const pageHtml = renderToString(
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <StaticRouter location={pageContext.urlPathname}>
          <App>
            <Page {...pageProps} />
          </App>
        </StaticRouter>
      </QueryClientProvider>
    </HelmetProvider>
  )

  const { helmet } = helmetContext as { helmet: HelmetServerState }

  const documentHtml = escapeInject`<!DOCTYPE html>
    <html ${dangerouslySkipEscape(helmet.htmlAttributes.toString())}>
      <head>
        ${dangerouslySkipEscape(helmet.title.toString())}
        ${dangerouslySkipEscape(helmet.meta.toString())}
        ${dangerouslySkipEscape(helmet.link.toString())}
      </head>
      <body ${dangerouslySkipEscape(helmet.bodyAttributes.toString())}>
        <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`

  return {
    documentHtml,
    pageContext: {
      // Possiamo passare dati aggiuntivi al client
      pageProps
    }
  }
} 