import React from "react";

// © 2023 Giuseppe Totire. Tutti i diritti riservati.
export type Author = {
  name: string;
  initials: string;
  image?: string;
  title: string;
  bio: string;
};

export type Guide = {
  id: number;
  title: string;
  slug: string;
  image: string;
  fullImage?: string;
  description: string;
  date: string;
  readTime: string;
  tags: string[];
  author: Author;
  featured?: boolean;
  content: React.ReactNode;
};

export const authors = {
  marco: {
    name: "Marco Rossi",
    initials: "MR",
    title: "Consulente Indipendente di Immobili",
    bio: "Marco è un consulente indipendente con oltre 10 anni di esperienza nel settore immobiliare. Si occupa di consulenza strategica per proprietari di immobili in affitto."
  },
  laura: {
    name: "Laura Bianchi",
    initials: "LB",
    title: "Avvocato Specializzato",
    bio: "Laura è un'avvocatessa indipendente specializzata in diritto immobiliare. Fornisce consulenza legale a proprietari di immobili e agenzie immobiliari."
  },
  paolo: {
    name: "Paolo Verdi",
    initials: "PV",
    title: "Analista Indipendente di Mercato",
    bio: "Paolo è un analista indipendente che studia le tendenze del mercato immobiliare per fornire consigli strategici ai proprietari di immobili."
  }
};

export const guides: Guide[] = [
  {
    id: 1,
    title: "Guida completa alla gestione degli affitti brevi",
    slug: "guida-affitti-brevi",
    image: "/images/guides/affitti-brevi.jpg",
    fullImage: "/images/guides/affitti-brevi-full.jpg",
    description: "Tutto quello che devi sapere per ottimizzare la gestione dei tuoi affitti brevi e massimizzare il rendimento.",
    date: "15 Maggio 2023",
    readTime: "12 min",
    tags: ["Affitti brevi", "Ottimizzazione", "Rendimento"],
    author: authors.marco,
    featured: true,
    content: (
      <>
        <h2>Introduzione agli affitti brevi</h2>
        <p>
          Il mercato degli affitti brevi ha visto una crescita esponenziale negli ultimi anni. 
          Questa guida ti aiuterà a navigare questo settore in continua evoluzione, fornendoti 
          strategie pratiche per massimizzare il rendimento delle tue proprietà.
        </p>
        
        <h3>Vantaggi degli affitti brevi</h3>
        <p>
          Gli affitti a breve termine offrono numerosi vantaggi rispetto ai tradizionali 
          contratti di locazione a lungo termine. Tra i principali benefici troviamo:
        </p>
        <ul>
          <li>Rendimenti potenzialmente più elevati</li>
          <li>Maggiore flessibilità nella gestione della proprietà</li>
          <li>Possibilità di utilizzare l'immobile personalmente quando desiderato</li>
          <li>Minore rischio di inquilini problematici a lungo termine</li>
        </ul>
        
        <h3>Sfide da considerare</h3>
        <p>
          Nonostante i vantaggi, la gestione di affitti brevi presenta anche alcune sfide significative:
        </p>
        <ul>
          <li>Gestione più intensiva e frequente</li>
          <li>Possibile stagionalità della domanda</li>
          <li>Normative locali a volte restrittive</li>
          <li>Maggiori costi di gestione e manutenzione</li>
        </ul>
        
        <h2>Ottimizzazione del prezzo</h2>
        <p>
          Uno degli aspetti più critici nella gestione degli affitti brevi è la definizione 
          della giusta strategia di prezzo. Un'analisi approfondita del mercato locale e dei 
          competitors è essenziale per massimizzare l'occupazione e il rendimento.
        </p>
        
        <h3>Analisi del mercato locale</h3>
        <p>
          Prima di stabilire i prezzi, è fondamentale:
        </p>
        <ul>
          <li>Studiare gli annunci simili nella stessa zona</li>
          <li>Identificare i periodi di alta e bassa stagione</li>
          <li>Comprendere le tariffe medie giornaliere per tipologie simili di proprietà</li>
          <li>Considerare eventi speciali che possono influenzare la domanda</li>
        </ul>
        
        <h2>Aspetti legali e fiscali</h2>
        <p>
          La conformità alle normative locali è un aspetto fondamentale nella gestione degli 
          affitti brevi. È importante essere a conoscenza di:
        </p>
        <ul>
          <li>Regolamenti comunali specifici per gli affitti brevi</li>
          <li>Obblighi di registrazione e comunicazione agli enti locali</li>
          <li>Normative sulla tassa di soggiorno</li>
          <li>Aspetti fiscali e dichiarativi</li>
        </ul>
        
        <h2>Conclusioni</h2>
        <p>
          La gestione professionale degli affitti brevi richiede dedizione, attenzione ai 
          dettagli e un approccio strutturato. Con una strategia ben pianificata, 
          è possibile ottimizzare significativamente i rendimenti delle tue proprietà.
        </p>
      </>
    )
  },
  {
    id: 2,
    title: "Adempimenti fiscali per proprietari di immobili in affitto",
    slug: "adempimenti-fiscali-affitti",
    image: "/images/guides/adempimenti-fiscali.jpg",
    description: "Una panoramica completa sugli obblighi fiscali per chi possiede e affitta immobili in Italia.",
    date: "3 Giugno 2023",
    readTime: "10 min",
    tags: ["Fiscalità", "Tasse", "Normative"],
    author: authors.laura,
    content: (
      <>
        <h2>Introduzione agli adempimenti fiscali</h2>
        <p>
          La gestione degli aspetti fiscali relativi agli immobili in affitto è un elemento 
          cruciale per ogni proprietario. Questa guida offre una panoramica chiara delle principali 
          responsabilità fiscali e dei potenziali benefici.
        </p>
        
        <h3>Regime fiscale ordinario vs. cedolare secca</h3>
        <p>
          In Italia, i proprietari di immobili possono scegliere tra due regimi fiscali principali:
        </p>
        <ul>
          <li>Regime ordinario: l'affitto viene sommato agli altri redditi e tassato secondo gli scaglioni IRPEF</li>
          <li>Cedolare secca: imposta sostitutiva con aliquota fissa (21% per contratti a canone libero, 10% per contratti a canone concordato)</li>
        </ul>
        
        <h3>Vantaggi della cedolare secca</h3>
        <p>
          La cedolare secca offre numerosi vantaggi:
        </p>
        <ul>
          <li>Semplificazione degli adempimenti fiscali</li>
          <li>Esenzione dall'imposta di registro e di bollo</li>
          <li>Prevedibilità del carico fiscale</li>
          <li>Possibile risparmio fiscale rispetto al regime ordinario</li>
        </ul>
        
        <h2>Dichiarazione dei redditi</h2>
        <p>
          Indipendentemente dal regime scelto, i redditi da locazione devono essere dichiarati annualmente:
        </p>
        <ul>
          <li>Quadro RB del modello 730 o Redditi PF</li>
          <li>Indicazione specifica per gli immobili concessi in locazione</li>
          <li>Dichiarazione separata per ciascun immobile</li>
        </ul>
        
        <h2>Conclusioni</h2>
        <p>
          Una gestione accurata degli aspetti fiscali è fondamentale per ottimizzare il rendimento 
          degli investimenti immobiliari e evitare potenziali problemi con l'amministrazione fiscale. 
          Mantenere una documentazione organizzata e rimanere aggiornati sulle normative può aiutarti 
          a navigare con successo il complesso panorama fiscale italiano.
        </p>
      </>
    )
  },
  {
    id: 3,
    title: "Come massimizzare l'occupazione dei tuoi immobili",
    slug: "massimizzare-occupazione-immobili",
    image: "/images/guides/occupazione-immobili.jpg",
    description: "Strategie efficaci per aumentare il tasso di occupazione e massimizzare i rendimenti dei tuoi immobili in affitto.",
    date: "22 Luglio 2023",
    readTime: "8 min",
    tags: ["Marketing", "Ottimizzazione", "Rendimento"],
    author: authors.paolo,
    featured: true,
    content: (
      <>
        <h2>Introduzione all'ottimizzazione dell'occupazione</h2>
        <p>
          Massimizzare il tasso di occupazione è uno degli obiettivi principali per ogni proprietario 
          di immobili. In questa guida, esploreremo strategie efficaci per aumentare la visibilità 
          delle tue proprietà e attirare più inquilini di qualità.
        </p>
        
        <h3>Presentazione professionale dell'immobile</h3>
        <p>
          La prima impressione è fondamentale nel mercato degli affitti:
        </p>
        <ul>
          <li>Fotografie professionali che valorizzino gli spazi</li>
          <li>Descrizioni dettagliate e coinvolgenti</li>
          <li>Virtual tour per offrire un'esperienza immersiva</li>
          <li>Video di presentazione per creare connessione emotiva</li>
        </ul>
        
        <h3>Strategie di marketing multi-canale</h3>
        <p>
          Una presenza su diversi canali aumenta significativamente la visibilità:
        </p>
        <ul>
          <li>Presenza su portali immobiliari principali</li>
          <li>Utilizzo strategico dei social media</li>
          <li>Marketing locale nella zona dell'immobile</li>
          <li>Programmi di referral per inquilini esistenti</li>
        </ul>
        
        <h2>Ottimizzazione del prezzo</h2>
        <p>
          Il pricing strategico è essenziale per bilanciare occupazione e rendimento:
        </p>
        <ul>
          <li>Analisi continua dei prezzi di mercato</li>
          <li>Strategie di prezzo stagionali</li>
          <li>Offerte speciali per periodi di bassa occupazione</li>
          <li>Sconti per soggiorni prolungati</li>
        </ul>
        
        <h2>Fidelizzazione degli inquilini</h2>
        <p>
          Mantenere gli inquilini esistenti è spesso più efficiente che trovarne di nuovi:
        </p>
        <ul>
          <li>Servizio clienti eccellente e reattivo</li>
          <li>Manutenzione preventiva dell'immobile</li>
          <li>Programmi di fedeltà per soggiorni ripetuti</li>
          <li>Personalizzazione dell'esperienza</li>
        </ul>
        
        <h2>Conclusioni</h2>
        <p>
          Massimizzare l'occupazione richiede un approccio strategico e metodico. 
          Implementando le strategie descritte in questa guida, puoi significativamente 
          aumentare la visibilità e l'attrattività dei tuoi immobili, migliorando i tassi 
          di occupazione e, di conseguenza, i rendimenti.
        </p>
      </>
    )
  },
  {
    id: 4,
    title: "Contratti di locazione: Guida alle tipologie e normative",
    slug: "contratti-locazione-guida",
    image: "/images/guides/contratti-locazione.jpg",
    description: "Una panoramica completa delle diverse tipologie di contratti di locazione e delle relative normative in Italia.",
    date: "11 Settembre 2023",
    readTime: "15 min",
    tags: ["Contratti", "Normative", "Legale"],
    author: authors.laura,
    content: (
      <>
        <h2>Introduzione ai contratti di locazione</h2>
        <p>
          La scelta del contratto di locazione più adatto è fondamentale per tutelare i propri 
          interessi e ottimizzare la gestione dell'immobile. Questa guida esplora le principali 
          tipologie di contratti disponibili in Italia.
        </p>
        
        <h3>Contratto a canone libero (4+4)</h3>
        <p>
          Il contratto a canone libero rappresenta la soluzione più flessibile:
        </p>
        <ul>
          <li>Durata iniziale di 4 anni con rinnovo automatico per altri 4</li>
          <li>Libertà nella determinazione del canone</li>
          <li>Possibilità di aggiornamento ISTAT annuale</li>
          <li>Limitazioni al recesso da parte del locatore</li>
        </ul>
        
        <h3>Contratto a canone concordato (3+2)</h3>
        <p>
          Questo tipo di contratto offre vantaggi fiscali significativi:
        </p>
        <ul>
          <li>Durata minima di 3 anni con rinnovo automatico per altri 2</li>
          <li>Canone determinato in base agli accordi territoriali</li>
          <li>Agevolazioni fiscali importanti (cedolare secca al 10%)</li>
          <li>Riduzione dell'IMU e dell'imposta di registro</li>
        </ul>
        
        <h2>Contratti transitori e per studenti</h2>
        <p>
          Per esigenze temporanee esistono soluzioni specifiche:
        </p>
        <h3>Contratto transitorio</h3>
        <ul>
          <li>Durata da 1 a 18 mesi</li>
          <li>Necessità di comprovata esigenza temporanea</li>
          <li>Canone generalmente in linea con gli accordi territoriali</li>
        </ul>
        
        <h3>Contratto per studenti universitari</h3>
        <ul>
          <li>Durata da 6 mesi a 3 anni</li>
          <li>Destinato a studenti iscritti a corsi universitari</li>
          <li>Rinnovo automatico solo per studenti ancora in corso</li>
        </ul>
        
        <h2>Conclusioni</h2>
        <p>
          La scelta del contratto più appropriato dipende dalle specifiche esigenze di 
          proprietario e inquilino. Una gestione efficiente degli aspetti contrattuali 
          può migliorare significativamente l'esperienza di locazione per tutte le parti 
          coinvolte e proteggere i tuoi interessi a lungo termine.
        </p>
      </>
    )
  }
];

export default guides; 