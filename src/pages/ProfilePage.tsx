import React, { useState, useEffect } from "react";
import { User, Camera, Mail, Save, Lock, CreditCard } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// Interfaccia per i dati utente (solo campi rilevanti disponibili)
interface UserProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string; // Avatar opzionale
  // Campi aggiuntivi che potrebbero essere in user_metadata
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfileData>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Stati per il cambio password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      setFormData({});
    }
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    console.log("Salvataggio dati (simulato):", formData);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsEditing(false);
    setIsSaving(false);
    toast.success("Profilo aggiornato con successo (simulato)");
  };
  
  const handleCancel = () => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
    setIsEditing(false);
  };

  // Funzione per gestire il cambio password (con chiamata API reale)
  const handlePasswordChange = async () => {
    // Validazione base (invariata)
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Compila tutti i campi password.");
      return;
    }
    if (newPassword.length < 6) {
       toast.error("La nuova password deve essere lunga almeno 6 caratteri.");
       return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("La nuova password e la conferma non coincidono.");
      return;
    }

    setIsPasswordSaving(true);
    // Rimosso toast.info qui, mostreremo successo/errore dopo la chiamata

    try {
      // Recupera il token JWT
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error("Errore di autenticazione", { description: "Token non trovato. Effettua il login." });
        setIsPasswordSaving(false); // Interrompi se manca il token
        return;
      }

      // Chiama l'endpoint API del backend per cambiare la password
      const response = await fetch('/api/auth/password', { // Usa il percorso relativo
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          currentPassword: currentPassword, 
          newPassword: newPassword 
        })
      });

      // Gestisci la risposta
      if (!response.ok) {
        // Prova a leggere il messaggio di errore dal JSON del backend
        let errorData = { error: `Errore HTTP ${response.status}` };
        try {
          errorData = await response.json();
        } catch (e) { /* Ignora se non è JSON */ }
        
        console.error('Errore API durante il cambio password:', response.status, errorData);
        // Mostra l'errore specifico dal backend, se disponibile
        throw new Error(errorData.error || `Errore ${response.status} durante l'aggiornamento`);
      }

      // Se la risposta è OK (es. 200)
      const result = await response.json(); // Legge { message: '...' }
      toast.success("Password aggiornata con successo!", { description: result.message });
      
      // Resetta i campi dopo il successo
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error: any) {
      console.error("Errore durante l'aggiornamento della password (fetch):", error);
      toast.error("Errore durante l'aggiornamento della password", {
        // Usa il messaggio dall'errore lanciato nel blocco if (!response.ok)
        description: error.message || "Si è verificato un errore imprevisto.", 
      });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  if (isAuthLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Skeleton className="lg:col-span-1 h-[400px]" />
            <Skeleton className="lg:col-span-2 h-[500px]" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4">Errore: Utente non trovato.</div>
      </AppLayout>
    );
  }
  
  const avatarFallback = formData.name 
      ? formData.name.split(' ').map(n => n[0]).join('') 
      : user.email[0].toUpperCase();
  
  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-start mb-6">
          <PageHeader
            title="Profilo Utente"
            description="Gestisci le tue informazioni personali e preferenze"
          />
          <div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} size="sm">
                Modifica Profilo
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleSave} size="sm" variant="default" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Salvataggio...' : 'Salva'}
                </Button>
                <Button onClick={handleCancel} size="sm" variant="outline" disabled={isSaving}>
                  Annulla
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center pb-6">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.avatar} />
                  <AvatarFallback className="text-2xl">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                  disabled={!isEditing || isSaving}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <h3 className="text-xl font-semibold">{formData.name || user.name}</h3>
              <Badge variant="secondary" className="mt-1 capitalize">{formData.role || user.role}</Badge>
              
              <Separator className="my-4" />
              
              <div className="w-full space-y-3 text-left">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm break-all">{formData.email || user.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="lg:col-span-2">
            <Tabs defaultValue="informazioni">
              <TabsList className="mb-4">
                <TabsTrigger value="informazioni">Informazioni</TabsTrigger>
                <TabsTrigger value="sicurezza">Sicurezza</TabsTrigger>
                <TabsTrigger value="fatturazione" disabled>Fatturazione (WIP)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="informazioni">
                <Card>
                  <CardHeader>
                    <CardTitle>Dettagli Profilo</CardTitle>
                    <CardDescription>
                      Modifica il tuo nome e altri dettagli (salvataggio simulato).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          placeholder="Il tuo nome" 
                          value={formData.name || ''}
                          onChange={handleInputChange} 
                          disabled={!isEditing || isSaving} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          placeholder="La tua email" 
                          value={formData.email || ''} 
                          readOnly
                          disabled 
                          className="text-muted-foreground"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="sicurezza">
                <Card>
                  <CardHeader>
                    <CardTitle>Sicurezza dell'Account</CardTitle>
                    <CardDescription>
                      Aggiorna la tua password.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Password Attuale</Label>
                      <Input 
                        id="current-password" 
                        name="currentPassword" 
                        type="password" 
                        placeholder="Inserisci la tua password attuale" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={isPasswordSaving}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nuova Password</Label>
                        <Input 
                          id="new-password" 
                          name="newPassword" 
                          type="password" 
                          placeholder="Inserisci una nuova password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={isPasswordSaving} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Conferma Password</Label>
                        <Input 
                          id="confirm-password" 
                          name="confirmPassword" 
                          type="password" 
                          placeholder="Conferma la nuova password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isPasswordSaving} 
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button 
                        onClick={handlePasswordChange} 
                        disabled={isPasswordSaving}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        {isPasswordSaving ? 'Aggiornamento...' : 'Aggiorna Password'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="fatturazione">
                <Card>
                  <CardHeader>
                    <CardTitle>Informazioni di Fatturazione</CardTitle>
                    <CardDescription>
                      Gestisci il tuo piano e pagamenti (funzionalità da implementare).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 opacity-50 cursor-not-allowed">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div><h3 className="font-medium">Piano Attuale: ...</h3></div>
                        <Button variant="outline" disabled>Cambia Piano</Button>
                      </div>
                    </div>
                    <div><h3 className="text-lg font-medium mb-2">Metodo di Pagamento</h3>...</div>
                    <div><h3 className="text-lg font-medium mb-2">Fatture</h3>...</div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 