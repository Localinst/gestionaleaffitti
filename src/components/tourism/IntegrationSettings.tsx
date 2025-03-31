import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { getPropertyIntegrations, addIcalIntegration, deleteIntegration, syncIntegration, generateExportToken } from '../../services/integration-api';
import { Copy, AlertCircle, CheckCircle, Palmtree, Calendar, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from "../ui/use-toast";
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface Integration {
  id: number;
  user_id: string;
  property_id: number;
  integration_type: string;
  external_id: string | null;
  sync_url: string;
  credentials: string;
  last_sync: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function IntegrationSettings() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [icalUrl, setIcalUrl] = useState('');
  const [icalName, setIcalName] = useState('');
  const [exportUrl, setExportUrl] = useState('');
  const [exportToken, setExportToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  // Carica le integrazioni al caricamento del componente
  useEffect(() => {
    if (propertyId) {
      loadIntegrations();
      getExportToken();
    }
  }, [propertyId]);

  // Carica le integrazioni esistenti
  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      const data = await getPropertyIntegrations(propertyId || '');
      setIntegrations(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile caricare le integrazioni",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Genera URL di esportazione con token
  const getExportToken = async () => {
    try {
      const response = await generateExportToken(propertyId || '');
      setExportToken(response.token);
      
      // Costruisci l'URL completo
      const baseUrl = window.location.origin.includes('localhost') 
        ? 'http://localhost:3000' 
        : 'https://gestionale-affitti-api.onrender.com'; // Adjust this to your actual production API URL
      
      setExportUrl(`${baseUrl}/api/integrations/export/${propertyId}?token=${response.token}`);
    } catch (error) {
      console.error('Errore nella generazione del token:', error);
    }
  };

  // Aggiunge un nuovo calendario iCal
  const handleAddIcal = async () => {
    if (!icalUrl) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Inserisci un URL iCal valido",
      });
      return;
    }

    try {
      setIsLoading(true);
      await addIcalIntegration(propertyId || '', icalUrl, icalName || 'Calendario esterno');
      toast({
        title: "Calendario aggiunto",
        description: "Il calendario è stato aggiunto con successo",
      });
      setIcalUrl('');
      setIcalName('');
      loadIntegrations();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile aggiungere il calendario. Verifica che l'URL sia valido.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sincronizza un'integrazione
  const handleSync = async (integrationId: number) => {
    try {
      setIsSyncing({ ...isSyncing, [integrationId]: true });
      await syncIntegration(integrationId.toString());
      toast({
        title: "Sincronizzazione completata",
        description: "Il calendario è stato sincronizzato con successo",
      });
      loadIntegrations();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile sincronizzare il calendario",
      });
    } finally {
      setIsSyncing({ ...isSyncing, [integrationId]: false });
    }
  };

  // Elimina un'integrazione
  const handleDelete = async (integrationId: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa integrazione?')) {
      return;
    }
    
    try {
      await deleteIntegration(integrationId.toString());
      toast({
        title: "Integrazione eliminata",
        description: "L'integrazione è stata eliminata con successo",
      });
      loadIntegrations();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile eliminare l'integrazione",
      });
    }
  };

  // Formatta i nomi delle integrazioni
  const getIntegrationName = (integration: Integration) => {
    try {
      const credentials = JSON.parse(integration.credentials);
      return credentials.name || 'Calendario esterno';
    } catch (e) {
      return 'Calendario esterno';
    }
  };

  // Renderizza data dell'ultimo aggiornamento
  const renderLastSync = (lastSync: string) => {
    try {
      return formatDistanceToNow(new Date(lastSync), { addSuffix: true, locale: it });
    } catch (e) {
      return 'Data sconosciuta';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integrazioni Canali</h2>
          <p className="text-muted-foreground">Sincronizza le prenotazioni con Airbnb, Booking ed altri siti</p>
        </div>
        <Palmtree className="h-8 w-8 text-primary" />
      </div>
      
      <Separator className="my-4" />

      <Tabs defaultValue="export">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export">Esporta Calendario</TabsTrigger>
          <TabsTrigger value="import">Importa Calendari</TabsTrigger>
          <TabsTrigger value="existing">Integrazioni ({integrations.filter(i => i.external_id !== 'export').length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="export" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Esporta il tuo calendario</CardTitle>
              <CardDescription>
                Usa questo URL per sincronizzare le tue prenotazioni con Airbnb, Booking.com o altri servizi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-url">URL iCal da copiare</Label>
                <div className="flex gap-2">
                  <Input id="export-url" value={exportUrl} readOnly className="flex-1" />
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(exportUrl);
                      toast({
                        title: "URL copiato",
                        description: "L'URL è stato copiato negli appunti"
                      });
                    }}
                    variant="outline"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copia
                  </Button>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Come usare questo URL</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal pl-5 space-y-1 mt-2">
                    <li>Copia l'URL sopra</li>
                    <li>Su Airbnb: vai su "Calendario" → "Sincronizzazione con altri calendari" → "Importa"</li>
                    <li>Su Booking.com: vai su "Extranet" → "Calendario" → "Sincronizzazione" → "Importa"</li>
                    <li>Incolla l'URL e salva</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-2 mt-4">
                <Button 
                  onClick={getExportToken}
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Genera nuovo token
                </Button>
                <p className="text-sm text-muted-foreground">
                  Se rigenerato, gli URL precedenti smetteranno di funzionare.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Importa calendari esterni</CardTitle>
              <CardDescription>
                Aggiungi calendari iCal da Airbnb, Booking.com o altri siti per importare automaticamente le prenotazioni.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ical-name">Nome del calendario</Label>
                  <Input 
                    id="ical-name" 
                    placeholder="Es. Airbnb, Booking.com" 
                    value={icalName}
                    onChange={(e) => setIcalName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="ical-url">URL iCal</Label>
                  <Input 
                    id="ical-url" 
                    placeholder="https://..." 
                    value={icalUrl}
                    onChange={(e) => setIcalUrl(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleAddIcal} 
                  disabled={isLoading}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Aggiungi Calendario
                </Button>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Come ottenere l'URL iCal</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Airbnb: vai su "Calendario" → "Esporta Calendario" → Copia l'URL</li>
                    <li>Booking.com: vai su "Extranet" → "Calendario" → "Sincronizzazione" → "Esporta"</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="existing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrazioni attive</CardTitle>
              <CardDescription>
                Gestisci le tue integrazioni esistenti con canali esterni.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integrations.filter(i => i.external_id !== 'export').length === 0 ? (
                <div className="bg-muted p-4 rounded-md flex items-center justify-center flex-col">
                  <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-center text-muted-foreground">
                    Nessuna integrazione configurata.<br />
                    Vai alla scheda "Importa Calendari" per aggiungere la tua prima integrazione.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {integrations
                    .filter(i => i.external_id !== 'export')
                    .map(integration => (
                      <div key={integration.id} className="p-4 border rounded-md shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium flex items-center">
                              {getIntegrationName(integration)}
                              <Badge variant="outline" className="ml-2">
                                {integration.integration_type.toUpperCase()}
                              </Badge>
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Ultimo aggiornamento: {renderLastSync(integration.last_sync)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[300px]">
                              {integration.sync_url}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSync(integration.id)}
                              disabled={isSyncing[integration.id]}
                            >
                              <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing[integration.id] ? 'animate-spin' : ''}`} />
                              {isSyncing[integration.id] ? 'Sincronizzazione...' : 'Sincronizza'}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDelete(integration.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 