import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, api } from '@/services/api';
import { generateActivitiesFromContracts } from '@/lib/activities';
import { PageHeader, SectionHeader } from '@/components/layout/AppLayout';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Check, X, RotateCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

const ActivitiesPage = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<{ id: number; name: string }[]>([]);
  const [tenants, setTenants] = useState<{ id: number; name: string }[]>([]);

  // Form state
  const [formData, setFormData] = useState<Omit<Activity, 'id'>>({
    description: '',
    property_id: '',
    tenant_id: '',
    date: new Date().toISOString(),
    type: 'other',
    priority: 'medium',
    status: 'pending',
  });

  // Carica attività
  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await api.activities.getAll();
      setActivities(data);
      // client-side: mostra toast per attività in scadenza entro 7 giorni
      try {
        const now = new Date();
        const soon = new Date();
        soon.setDate(now.getDate() + 7);
        const upcoming = data.filter((a: Activity) => {
          const d = new Date(a.date);
          return d >= now && d <= soon && a.status === 'pending';
        });
        if (upcoming.length > 0) {
          toast({
            title: t('activities.notifications.upcomingTitle', { count: upcoming.length }),
            description: t('activities.notifications.upcomingDesc'),
          });
        }
      } catch (e) {
        // non-blocking
        console.error('Error checking upcoming activities for notifications', e);
      }
    } catch (error) {
      console.error('Errore nel caricamento delle attività:', error);
      toast({
        variant: 'destructive',
        title: t("activities.errors.loading"),
        description: t("activities.errors.loading"),
      });
    } finally {
      setLoading(false);
    }
  };

  // Carica proprietà e inquilini all'avvio
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carica proprietà
        const propertiesData = await api.properties.getAll();
        setProperties(
          propertiesData.map(p => ({ id: p.id, name: p.name }))
        );
        
        // Carica inquilini
        const tenantsData = await api.tenants.getAll();
        setTenants(
          tenantsData.map(t => ({ id: t.id, name: t.name }))
        );
        
  // Carica attività
  await loadActivities();
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        toast({
          variant: 'destructive',
          title: t("errors.general"),
          description: t("activities.errors.loadingData"),
        });
      }
    };
    
    loadData();
  }, [toast, t]);

  // Rigenera attività da contratti (stesso comportamento del dashboard)
  const handleRegenerate = async () => {
    try {
      const created = await generateActivitiesFromContracts();
      await loadActivities();
      toast({
        title: t('activities.success.regenerated'),
        description: t('activities.success.regeneratedDesc', { count: created.length }),
      });
    } catch (error) {
      console.error('Errore nella rigenerazione delle attività:', error);
      toast({
        variant: 'destructive',
        title: t('errors.general'),
        description: t('activities.errors.regenerate'),
      });
    }
  };

  // Gestione form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData({
        ...formData,
        date: date.toISOString(),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Crea la nuova attività
      await api.activities.create(formData);
      
      // Resetta il form
      setFormData({
        description: '',
        property_id: '',
        tenant_id: '',
        date: new Date().toISOString(),
        type: 'other',
        priority: 'medium',
        status: 'pending',
      });
      
      // Ricarica le attività
      loadActivities();
      
      toast({
        title: t("common.status.success"),
        description: t("activities.success.activityAdded"),
      });
    } catch (error) {
      console.error('Errore nella creazione dell\'attività:', error);
      toast({
        variant: 'destructive',
        title: t("errors.general"),
        description: t("errors.general"),
      });
    }
  };

  // Aggiorna stato attività
  const handleUpdateStatus = async (id: number, status: Activity['status']) => {
    try {
      await api.activities.updateStatus(id, status);
      
      // Aggiorna localmente
      setActivities(prevActivities => 
        prevActivities.map(activity => 
          activity.id === id ? { ...activity, status } : activity
        )
      );
      
      toast({
        title: t("common.status.success"),
        description: t("activities.success.statusUpdate"),
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello stato:', error);
      toast({
        variant: 'destructive',
        title: t("errors.general"),
        description: t("activities.errors.statusUpdate"),
      });
    }
  };

  // Render colori priority
  const getPriorityColor = (priority: Activity['priority']) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render colori status
  const getStatusColor = (status: Activity['status']) => {
    switch(status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Funzione per ordinare e raggruppare le attività
  const getGroupedActivities = () => {
    if (!activities.length) return { pastPending: [], future: [], pastCompleted: [] };
    
    const now = new Date();
    
    // Attività passate non completate (pending)
    const pastPending = activities
      .filter(activity => 
        new Date(activity.date) < now && 
        activity.status === 'pending'
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Attività future (solo quelle in attesa)
    const future = activities
      .filter(activity => 
        new Date(activity.date) >= now &&
        activity.status === 'pending'
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Attività completate o ignorate (sia passate che future)
    const pastCompleted = activities
      .filter(activity => 
        activity.status === 'completed' || activity.status === 'dismissed'
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { pastPending, future, pastCompleted };
  };

  // Ottieni le attività raggruppate
  const { pastPending, future, pastCompleted } = getGroupedActivities();

  // Verifica se una sezione è vuota
  const hasActivities = pastPending.length > 0 || future.length > 0 || pastCompleted.length > 0;

  return (
    <AppLayout>
      <div className="container mx-auto p-2 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Attività" 
            description="Gestisci e inserisci manualmente le attività del tuo immobile" 
          />
          <div className="ml-4">
            <Button onClick={handleRegenerate} variant="outline">
              Rigenera attività
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form inserimento attività */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Inserisci nuova attività</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Descrivi l'attività..."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="property">Proprietà</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('property_id', value)}
                    value={String(formData.property_id)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona proprietà" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(property => (
                        <SelectItem key={property.id} value={String(property.id)}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant">Inquilino (opzionale)</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('tenant_id', value)}
                    value={String(formData.tenant_id || 'none')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona inquilino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessun inquilino</SelectItem>
                      {tenants.map(tenant => (
                        <SelectItem key={tenant.id} value={String(tenant.id)}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Calendar
                    mode="single"
                    selected={new Date(formData.date)}
                    onSelect={handleDateChange}
                    locale={it}
                    className="w-full border rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('type', value)}
                    value={formData.type}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract_expiration">Scadenza contratto</SelectItem>
                      <SelectItem value="rent_payment">Pagamento affitto</SelectItem>
                      <SelectItem value="maintenance">Manutenzione</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorità</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('priority', value as Activity['priority'])}
                    value={formData.priority}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona priorità" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Bassa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="w-full">
                  Aggiungi attività
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tabella attività */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Attività</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Caricamento...</div>
              ) : !hasActivities ? (
                <div className="text-center py-4">
                  Nessuna attività trovata. Aggiungi la tua prima attività!
                </div>
              ) : (
                <div className="space-y-8">
                  
                  {/* Attività passate in attesa */}
                  {pastPending.length > 0 && (
                    <div>
                      <SectionHeader 
                        title={t("activities.pastPending.title")}
                        description={t("activities.pastPending.description")}
                      />
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("activities.fields.description")}</TableHead>
                              <TableHead>{t("activities.fields.property")}</TableHead>
                              <TableHead>{t("activities.fields.date")}</TableHead>
                              <TableHead>{t("activities.fields.priority")}</TableHead>
                              <TableHead>{t("activities.fields.status")}</TableHead>
                              <TableHead>{t("activities.fields.actions")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pastPending.map((activity) => (
                              <TableRow key={activity.id} className="bg-yellow-50">
                                <TableCell className="font-medium text-sm py-1">{activity.description}</TableCell>
                                <TableCell>{activity.property_name || "N/A"}</TableCell>
                                <TableCell>{new Date(activity.date).toLocaleDateString('it-IT')}</TableCell>
                                <TableCell>
                                  <Badge className={getPriorityColor(activity.priority)}>
                                    {activity.priority === 'high' ? t("activities.priority.high") : 
                                     activity.priority === 'medium' ? t("activities.priority.medium") : t("activities.priority.low")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${getStatusColor(activity.status)} whitespace-nowrap`}>
                                    {activity.status === 'pending' ? t("activities.status.pending") : 
                                     activity.status === 'completed' ? t("activities.status.completed") : t("activities.status.dismissed")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleUpdateStatus(activity.id, 'completed')}
                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          >
                                            <Check className="h-5 w-5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{t("activities.actions.markCompleted")}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleUpdateStatus(activity.id, 'dismissed')}
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <X className="h-5 w-5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{t("activities.actions.markDismissed")}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Attività future */}
                  {future.length > 0 && (
                    <div>
                      <SectionHeader 
                        title={t("activities.future.title")}
                        description={t("activities.future.description")}
                      />
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("activities.fields.description")}</TableHead>
                              <TableHead>{t("activities.fields.property")}</TableHead>
                              <TableHead>{t("activities.fields.date")}</TableHead>
                              <TableHead>{t("activities.fields.priority")}</TableHead>
                              <TableHead>{t("activities.fields.status")}</TableHead>
                              <TableHead>{t("activities.fields.actions")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {future.map((activity) => (
                              <TableRow key={activity.id}>
                                <TableCell className="font-medium py-1">{activity.description}</TableCell>
                                <TableCell>{activity.property_name || "N/A"}</TableCell>
                                <TableCell>{new Date(activity.date).toLocaleDateString('it-IT')}</TableCell>
                                <TableCell>
                                  <Badge className={getPriorityColor(activity.priority)}>
                                    {activity.priority === 'high' ? t("activities.priority.high") : 
                                     activity.priority === 'medium' ? t("activities.priority.medium") : t("activities.priority.low")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${getStatusColor(activity.status)} whitespace-nowrap`}>
                                    {activity.status === 'pending' ? t("activities.status.pending") : 
                                     activity.status === 'completed' ? t("activities.status.completed") : t("activities.status.dismissed")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    {activity.status === 'pending' && (
                                      <>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleUpdateStatus(activity.id, 'completed')}
                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                              >
                                                <Check className="h-5 w-5" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{t("activities.actions.markCompleted")}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleUpdateStatus(activity.id, 'dismissed')}
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                              >
                                                <X className="h-5 w-5" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{t("activities.actions.markDismissed")}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </>
                                    )}
                                    {activity.status !== 'pending' && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => handleUpdateStatus(activity.id, 'pending')}
                                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            >
                                              <RotateCcw className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{t("activities.actions.reopen")}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Attività passate completate */}
                  {pastCompleted.length > 0 && (
                    <div>
                      <SectionHeader 
                        title={t("activities.completed.title")}
                        description={t("activities.completed.description")}
                      />
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("activities.fields.description")}</TableHead>
                              <TableHead>{t("activities.fields.property")}</TableHead>
                              <TableHead>{t("activities.fields.date")}</TableHead>
                              <TableHead>{t("activities.fields.priority")}</TableHead>
                              <TableHead>{t("activities.fields.status")}</TableHead>
                              <TableHead>{t("activities.fields.actions")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pastCompleted.map((activity) => (
                              <TableRow key={activity.id} className="text-muted-foreground">
                                <TableCell className="text-xs text-muted-foreground py-1">{activity.description}</TableCell>
                                <TableCell>{activity.property_name || "N/A"}</TableCell>
                                <TableCell>{new Date(activity.date).toLocaleDateString('it-IT')}</TableCell>
                                <TableCell>
                                  <Badge className={getPriorityColor(activity.priority)}>
                                    {activity.priority === 'high' ? t("activities.priority.high") : 
                                     activity.priority === 'medium' ? t("activities.priority.medium") : t("activities.priority.low")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${getStatusColor(activity.status)} whitespace-nowrap`}>
                                    {activity.status === 'pending' ? t("activities.status.pending") : 
                                     activity.status === 'completed' ? t("activities.status.completed") : t("activities.status.dismissed")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleUpdateStatus(activity.id, 'completed')}
                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          >
                                            <Check className="h-5 w-5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{t("activities.actions.markCompleted")}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleUpdateStatus(activity.id, 'dismissed')}
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <X className="h-5 w-5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{t("activities.actions.markDismissed")}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ActivitiesPage;