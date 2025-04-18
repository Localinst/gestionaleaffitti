import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { LandingNav } from "@/components/layout/LandingNav";

// Componente di base per tutte le pagine legali
const LegalPageLayout = ({ 
  title, 
  description, 
  children 
}: { 
  title: string;
  description: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />

      <main className="flex-1">
        <section className="py-8 md:py-16 bg-muted/30">
          <div className="container px-3 md:px-6">
            <div className="flex flex-col gap-2 mb-6 md:mb-8">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-2 md:mb-4">
                <ArrowLeft className="h-4 w-4" />
                <span>Torna alla home</span>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tighter sm:text-4xl">
                {title}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-[700px]">
                {description}
              </p>
            </div>

            <div className="prose prose-stone dark:prose-invert max-w-none">
              {children}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted py-8">
        <div className="container px-3 md:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tenoris360. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Pagina Privacy Policy
export const PrivacyPolicy = () => {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="Informazioni su come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali."
    >
      <div className="space-y-6">
        <section>
          <h2>Introduzione</h2>
          <p>
            La presente Privacy Policy descrive come Tenoris360 ("noi", "nostro" o "Tenoris360") raccoglie, utilizza e condivide le informazioni che otteniamo quando utilizzi il nostro sito web e i servizi associati (collettivamente, i "Servizi").
          </p>
          <p>
            Utilizziamo i tuoi dati personali per fornirti e migliorare i nostri Servizi. Utilizzando i Servizi, accetti la raccolta e l'utilizzo delle informazioni in conformità con questa politica.
          </p>
        </section>

        <section>
          <h2>Informazioni che raccogliamo</h2>
          <p>
            Raccogliamo diversi tipi di informazioni per vari scopi al fine di fornirti e migliorare i nostri Servizi:
          </p>
          <h3>Dati personali</h3>
          <p>
            Durante l'utilizzo dei nostri Servizi, potremmo chiederti di fornirci alcune informazioni di identificazione personale che possono essere utilizzate per contattarti o identificarti ("Dati personali"). Le informazioni di identificazione personale possono includere, ma non sono limitate a:
          </p>
          <ul>
            <li>Nome e cognome</li>
            <li>Indirizzo email</li>
            <li>Numero di telefono</li>
            <li>Indirizzo, Stato, Provincia, CAP, Città</li>
            <li>Informazioni di pagamento</li>
          </ul>

          <h3>Dati di utilizzo</h3>
          <p>
            Raccogliamo anche informazioni su come i Servizi vengono utilizzati ("Dati di utilizzo"). Questi Dati di utilizzo possono includere informazioni come l'indirizzo IP del tuo computer, il tipo di browser, la versione del browser, le pagine dei nostri Servizi che visiti, l'ora e la data della tua visita, il tempo trascorso su tali pagine, identificatori unici del dispositivo e altri dati diagnostici.
          </p>
        </section>

        <section>
          <h2>Utilizzo dei dati</h2>
          <p>
            Tenoris360 utilizza i dati raccolti per vari scopi:
          </p>
          <ul>
            <li>Per fornire e mantenere i nostri Servizi</li>
            <li>Per informarti sulle modifiche ai nostri Servizi</li>
            <li>Per consentirti di partecipare alle funzionalità interattive dei nostri Servizi quando scegli di farlo</li>
            <li>Per fornire assistenza ai clienti</li>
            <li>Per raccogliere analisi o informazioni preziose in modo da poter migliorare i nostri Servizi</li>
            <li>Per monitorare l'utilizzo dei nostri Servizi</li>
            <li>Per rilevare, prevenire e affrontare problemi tecnici</li>
          </ul>
        </section>

        <section>
          <h2>Conservazione dei dati</h2>
          <p>
            Tenoris360 conserverà i tuoi Dati personali solo per il tempo necessario agli scopi indicati nella presente Privacy Policy. Conserveremo e utilizzeremo i tuoi Dati personali nella misura necessaria per adempiere ai nostri obblighi legali, risolvere controversie e far rispettare i nostri accordi legali e le nostre politiche.
          </p>
        </section>

        <section>
          <h2>Trasferimento dei dati</h2>
          <p>
            Le tue informazioni, inclusi i Dati personali, possono essere trasferite e mantenute su computer situati al di fuori del tuo stato, provincia, paese o altra giurisdizione governativa in cui le leggi sulla protezione dei dati possono differire da quelle della tua giurisdizione.
          </p>
          <p>
            Il tuo consenso a questa Privacy Policy seguito dalla tua invio di tali informazioni rappresenta il tuo accordo a tale trasferimento.
          </p>
        </section>

        <section>
          <h2>Divulgazione dei dati</h2>
          <p>
            Tenoris360 può divulgare i tuoi Dati personali in buona fede credendo che tale azione sia necessaria per:
          </p>
          <ul>
            <li>Adempiere a un obbligo legale</li>
            <li>Proteggere e difendere i diritti o la proprietà di Tenoris360</li>
            <li>Prevenire o indagare su possibili illeciti in relazione ai Servizi</li>
            <li>Proteggere la sicurezza personale degli utenti dei Servizi o del pubblico</li>
            <li>Proteggere dalla responsabilità legale</li>
          </ul>
        </section>

        <section>
          <h2>Sicurezza dei dati</h2>
          <p>
            La sicurezza dei tuoi dati è importante per noi, ma ricorda che nessun metodo di trasmissione su Internet o metodo di archiviazione elettronica è sicuro al 100%. Sebbene ci sforziamo di utilizzare mezzi commercialmente accettabili per proteggere i tuoi Dati personali, non possiamo garantirne la sicurezza assoluta.
          </p>
        </section>

        <section>
          <h2>I tuoi diritti sulla protezione dei dati</h2>
          <p>
            Tenoris360 intende intraprendere misure ragionevoli per consentirti di correggere, modificare, eliminare o limitare l'utilizzo dei tuoi Dati personali.
          </p>
          <p>
            Se desideri essere informato su quali Dati personali deteniamo su di te e se desideri che vengano rimossi dai nostri sistemi, ti preghiamo di contattarci.
          </p>
          <p>
            In determinate circostanze, hai i seguenti diritti sulla protezione dei dati:
          </p>
          <ul>
            <li>Il diritto di accedere, aggiornare o eliminare le informazioni che abbiamo su di te</li>
            <li>Il diritto di rettifica</li>
            <li>Il diritto di opporsi</li>
            <li>Il diritto di restrizione</li>
            <li>Il diritto alla portabilità dei dati</li>
            <li>Il diritto di ritirare il consenso</li>
          </ul>
        </section>

        <section>
          <h2>Modifiche a questa Privacy Policy</h2>
          <p>
            Potremmo aggiornare la nostra Privacy Policy di tanto in tanto. Ti informeremo di eventuali modifiche pubblicando la nuova Privacy Policy in questa pagina.
          </p>
          <p>
            Ti consigliamo di rivedere periodicamente questa Privacy Policy per eventuali modifiche. Le modifiche a questa Privacy Policy sono efficaci quando vengono pubblicate su questa pagina.
          </p>
        </section>

        <section>
          <h2>Contattaci</h2>
          <p>
            Se hai domande su questa Privacy Policy, contattaci:
          </p>
          <ul>
            <li>Via email: privacy@tenoris360.it</li>
            <li>Visitando questa pagina sul nostro sito web: www.tenoris360.it/contatti</li>
          </ul>
        </section>
      </div>
    </LegalPageLayout>
  );
};

// Pagina Termini di Servizio
export const TerminiServizio = () => {
  return (
    <LegalPageLayout
      title="Termini di Servizio"
      description="I termini e le condizioni che regolano l'utilizzo della piattaforma Tenoris360."
    >
      <div className="space-y-6">
        <section>
          <h2>1. Accettazione dei termini</h2>
          <p>
            Accedendo o utilizzando il servizio Tenoris360, l'utente accetta di essere vincolato dai presenti Termini. Se non si accettano tutti i termini e le condizioni, non si è autorizzati a utilizzare il Servizio.
          </p>
        </section>

        <section>
          <h2>2. Descrizione del servizio</h2>
          <p>
            Tenoris360 è una piattaforma di gestione degli affitti che consente agli utenti di gestire proprietà, inquilini, contratti e pagamenti.
          </p>
          <p>
            Ci riserviamo il diritto di modificare o interrompere, temporaneamente o permanentemente, il Servizio o qualsiasi parte di esso con o senza preavviso.
          </p>
        </section>

        <section>
          <h2>3. Iscrizione</h2>
          <p>
            Per utilizzare alcune funzionalità del nostro Servizio, è necessario registrarsi con noi. Durante la registrazione l'utente accetta di fornire informazioni accurate, complete e aggiornate.
          </p>
          <p>
            L'utente è responsabile del mantenimento della riservatezza del proprio account e della password e di limitare l'accesso al proprio computer, ed è responsabile di tutte le attività che si verificano sotto il proprio account.
          </p>
        </section>

        <section>
          <h2>4. Pagamenti e abbonamenti</h2>
          <p>
            Alcune funzionalità del Servizio sono disponibili solo tramite l'acquisto di un abbonamento. Gli abbonamenti si rinnovano automaticamente alla fine del periodo specificato a meno che non venga annullato in anticipo.
          </p>
          <p>
            I prezzi degli abbonamenti possono variare di volta in volta. Qualsiasi modifica dei prezzi sarà comunicata all'utente prima che entri in vigore.
          </p>
        </section>

        <section>
          <h2>5. Proprietà intellettuale</h2>
          <p>
            Il Servizio e i suoi contenuti originali, funzionalità e funzionalità sono e rimarranno di esclusiva proprietà di Tenoris360 e dei suoi licenziatari.
          </p>
          <p>
            Il Servizio è protetto da copyright, marchio e altre leggi sia italiane che estere. I nostri marchi non possono essere utilizzati in relazione a qualsiasi prodotto o servizio senza il previo consenso scritto di Tenoris360.
          </p>
        </section>

        <section>
          <h2>6. Contenuti degli utenti</h2>
          <p>
            Gli utenti possono fornire contenuti quando utilizzano il Servizio. Conservi tutti i diritti sui tuoi contenuti, ma ci concedi il diritto di utilizzarli per operare e migliorare il Servizio.
          </p>
          <p>
            Non puoi pubblicare contenuti illegali, offensivi o che violano i diritti altrui. Ci riserviamo il diritto di rimuovere qualsiasi contenuto a nostra discrezione.
          </p>
        </section>

        <section>
          <h2>7. Limitazione di responsabilità</h2>
          <p>
            In nessun caso Tenoris360, i suoi amministratori, dipendenti o agenti saranno responsabili per qualsiasi danno diretto, indiretto, incidentale, speciale o consequenziale derivante dall'utilizzo o dall'incapacità di utilizzare il Servizio.
          </p>
        </section>

        <section>
          <h2>8. Indennizzo</h2>
          <p>
            L'utente accetta di difendere, indennizzare e tenere indenne Tenoris360 da e contro qualsiasi reclamo, danno, obbligazione, perdita, responsabilità, costo o debito, e spese derivanti da: (i) l'utilizzo e l'accesso al Servizio; (ii) la violazione di qualsiasi termine dei presenti Termini; (iii) la violazione di qualsiasi diritto di terzi, compreso senza limitazioni qualsiasi diritto d'autore, di proprietà o di privacy.
          </p>
        </section>

        <section>
          <h2>9. Modifiche ai termini</h2>
          <p>
            Ci riserviamo il diritto, a nostra esclusiva discrezione, di modificare o sostituire questi Termini in qualsiasi momento. Se una revisione è rilevante, cercheremo di fornire un preavviso di almeno 30 giorni prima che i nuovi termini entrino in vigore.
          </p>
        </section>

        <section>
          <h2>10. Legge applicabile</h2>
          <p>
            Questi Termini saranno regolati e interpretati in conformità con le leggi italiane, senza riguardo alle sue disposizioni sui conflitti di legge.
          </p>
          <p>
            La nostra incapacità di far valere qualsiasi diritto o disposizione di questi Termini non sarà considerata una rinuncia a tali diritti.
          </p>
        </section>

        <section>
          <h2>11. Contatti</h2>
          <p>
            Se hai domande su questi Termini, contattaci:
          </p>
          <ul>
            <li>Via email: info@tenoris360.it</li>
            <li>Visitando questa pagina sul nostro sito web: www.tenoris360.it/contatti</li>
          </ul>
        </section>
      </div>
    </LegalPageLayout>
  );
};

// Pagina Cookie Policy
export const CookiePolicy = () => {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="Informazioni sui cookie e le tecnologie di tracciamento utilizzate sul nostro sito."
    >
      <div className="space-y-6">
        <section>
          <h2>Cosa sono i cookie</h2>
          <p>
            I cookie sono piccoli file di testo che i siti web visitati dagli utenti inviano ai loro terminali, dove vengono memorizzati per essere ritrasmessi agli stessi siti in occasione di visite successive. I cookie sono utilizzati per diverse finalità, hanno caratteristiche diverse, e possono essere utilizzati sia dal titolare del sito che si sta visitando, sia da terze parti.
          </p>
        </section>

        <section>
          <h2>Tipologie di cookie utilizzati da Tenoris360</h2>
          <p>
            Di seguito troverai tutte le informazioni sui cookie installati attraverso questo sito, e le indicazioni necessarie su come gestire le tue preferenze.
          </p>

          <h3>Cookie tecnici</h3>
          <p>
            Questa tipologia di cookie permette il corretto funzionamento di alcune sezioni del sito. Sono di due categorie: persistenti e di sessione:
          </p>
          <ul>
            <li>persistenti: una volta chiuso il browser non vengono distrutti ma rimangono fino ad una data di scadenza preimpostata</li>
            <li>di sessione: vengono distrutti ogni volta che il browser viene chiuso</li>
          </ul>
          <p>
            Questi cookie, inviati sempre dal nostro dominio, sono necessari a visualizzare correttamente il sito e in relazione ai servizi tecnici offerti, verranno quindi sempre utilizzati e inviati, a meno che l'utente non modifichi le impostazioni nel proprio browser (inficiando così la visualizzazione delle pagine del sito).
          </p>

          <h3>Cookie analitici</h3>
          <p>
            I cookie in questa categoria vengono utilizzati per collezionare informazioni sull'uso del sito. Tenoris360 userà queste informazioni in merito ad analisi statistiche anonime al fine di migliorare l'utilizzo del sito e per rendere i contenuti più interessanti e attinenti ai desideri dell'utente. Questa tipologia di cookie raccoglie dati in forma anonima sull'attività dell'utenza e su come è arrivata sul sito. I cookie analitici sono inviati dal sito stesso o da domini di terze parti.
          </p>

          <h3>Cookie di analisi di servizi di terze parti</h3>
          <p>
            Questi cookie sono utilizzati al fine di raccogliere informazioni sull'uso del sito da parte degli utenti in forma anonima quali: pagine visitate, tempo di permanenza, origini del traffico di provenienza, provenienza geografica, età, genere e interessi ai fini di campagne di marketing. Questi cookie sono inviati da domini di terze parti esterni al sito.
          </p>

          <h3>Cookie per integrare prodotti e funzioni di software di terze parti</h3>
          <p>
            Questa tipologia di cookie integra funzionalità sviluppate da terzi all'interno delle pagine del sito come le icone e le preferenze espresse nei social network al fine di condivisione dei contenuti del sito o per l'uso di servizi software di terze parti (come i software per generare le mappe e ulteriori software che offrono servizi aggiuntivi). Questi cookie sono inviati da domini di terze parti e da siti partner che offrono le loro funzionalità tra le pagine del sito.
          </p>
        </section>

        <section>
          <h2>Come disabilitare i cookie mediante configurazione del browser</h2>
          <p>
            Se desideri approfondire le modalità con le quali il tuo browser memorizza i cookie durante la tua navigazione, ti invitiamo a seguire questi link sui siti dei rispettivi fornitori:
          </p>
          <ul>
            <li>Mozilla Firefox</li>
            <li>Google Chrome</li>
            <li>Internet Explorer</li>
            <li>Safari</li>
            <li>Safari iOS (dispositivi mobile)</li>
            <li>Opera</li>
          </ul>
        </section>

        <section>
          <h2>Cookie di terze parti</h2>
          <p>
            Il presente sito funge anche da intermediario per cookie di terze parti, utilizzati per fornire servizi aggiuntivi ed utili. Questa privacy policy non si applica ai servizi forniti da terze parti, e questo sito non ha alcun controllo sui loro cookie, interamente gestiti dalle terze parti. Il contratto di cessione dati avviene direttamente tra l'utente e le terze parti, per cui l'acquisizione del consenso per detti cookie è, ovviamente, a carico delle terze parti, mentre questo sito non partecipa in alcun modo a tale cessione.
          </p>
        </section>

        <section>
          <h2>Modifiche alla presente cookie policy</h2>
          <p>
            La presente Cookie Policy potrebbe essere soggetta a modifiche nel tempo, anche connesse all'eventuale entrata in vigore di nuove normative di settore, all'aggiornamento o erogazione di nuovi servizi ovvero ad intervenute innovazioni tecnologiche, pertanto ti invitiamo a consultare periodicamente questa pagina.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}; 