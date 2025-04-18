import React, { useState } from "react";
import { User, Camera, Mail, Phone, MapPin, Building, Save, Lock, CreditCard } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// Dati utente fittizi per esempio
const mockUserData = {
  id: "1",
  name: "Mario Rossi",
  email: "mario.rossi@example.com",
  avatar: "", // URL immagine
  phone: "+39 333 1234567",
  company: "Immobiliare Rossi",
  address: "Via Roma 123",
  city: "Milano",
  postalCode: "20100",
  country: "Italia",
  role: "Proprietario",
  memberSince: "Gennaio 2023",
  plan: "Premium",
  accountType: "Business"
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(mockUserData);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(userData);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSave = () => {
    // Qui andrebbe implementata la logica per salvare i dati sul server
    setUserData(formData);
    setIsEditing(false);
    toast.success("Profilo aggiornato con successo");
  };
  
  const handleCancel = () => {
    setFormData(userData);
    setIsEditing(false);
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <PageHeader
          title="Profilo Utente"
          description="Gestisci le tue informazioni personali e preferenze"
          icon={<User className="h-6 w-6" />}
        >
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} size="sm">
              Modifica Profilo
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSave} size="sm" variant="default">
                <Save className="h-4 w-4 mr-2" />
                Salva
              </Button>
              <Button onClick={handleCancel} size="sm" variant="outline">
                Annulla
              </Button>
            </div>
          )}
        </PageHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Colonna sinistra con informazioni generali */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle>Informazioni Personali</CardTitle>
              <CardDescription>
                Il tuo profilo e le informazioni di contatto
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center pb-6">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback className="text-2xl">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                  disabled={!isEditing}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <h3 className="text-xl font-semibold">{userData.name}</h3>
              <Badge variant="secondary" className="mt-1">{userData.role}</Badge>
              
              <Separator className="my-4" />
              
              <div className="w-full space-y-3 text-left">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{userData.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{userData.phone}</span>
                </div>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{userData.company}</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                  <span className="text-sm">
                    {userData.address}, {userData.city}<br />
                    {userData.postalCode}, {userData.country}
                  </span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-sm text-muted-foreground">
                <p>Membro dal {userData.memberSince}</p>
                <p>Piano: {userData.plan}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Colonna destra con tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="informazioni">
              <TabsList className="mb-4">
                <TabsTrigger value="informazioni">Informazioni</TabsTrigger>
                <TabsTrigger value="sicurezza">Sicurezza</TabsTrigger>
                <TabsTrigger value="fatturazione">Fatturazione</TabsTrigger>
              </TabsList>
              
              <TabsContent value="informazioni">
                <Card>
                  <CardHeader>
                    <CardTitle>Dettagli Profilo</CardTitle>
                    <CardDescription>
                      Modifica le tue informazioni personali e di contatto
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
                          value={formData.name} 
                          onChange={handleInputChange} 
                          disabled={!isEditing} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          placeholder="La tua email" 
                          value={formData.email} 
                          onChange={handleInputChange} 
                          disabled={!isEditing} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefono</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          placeholder="Il tuo numero di telefono" 
                          value={formData.phone} 
                          onChange={handleInputChange} 
                          disabled={!isEditing} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Azienda</Label>
                        <Input 
                          id="company" 
                          name="company" 
                          placeholder="Nome dell'azienda" 
                          value={formData.company} 
                          onChange={handleInputChange} 
                          disabled={!isEditing} 
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Indirizzo</Label>
                      <Input 
                        id="address" 
                        name="address" 
                        placeholder="Il tuo indirizzo" 
                        value={formData.address} 
                        onChange={handleInputChange} 
                        disabled={!isEditing} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Città</Label>
                        <Input 
                          id="city" 
                          name="city" 
                          placeholder="Città" 
                          value={formData.city} 
                          onChange={handleInputChange} 
                          disabled={!isEditing} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">CAP</Label>
                        <Input 
                          id="postalCode" 
                          name="postalCode" 
                          placeholder="Codice Postale" 
                          value={formData.postalCode} 
                          onChange={handleInputChange} 
                          disabled={!isEditing} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Paese</Label>
                        <Input 
                          id="country" 
                          name="country" 
                          placeholder="Paese" 
                          value={formData.country} 
                          onChange={handleInputChange} 
                          disabled={!isEditing} 
                        />
                      </div>
                    </div>
                  </CardContent>
                  {isEditing && (
                    <CardFooter className="flex justify-end space-x-2 pt-0">
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Salva Modifiche
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Annulla
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="sicurezza">
                <Card>
                  <CardHeader>
                    <CardTitle>Sicurezza dell'Account</CardTitle>
                    <CardDescription>
                      Gestisci la tua password e le impostazioni di sicurezza
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Conferma Password</Label>
                        <Input 
                          id="confirm-password" 
                          name="confirmPassword" 
                          type="password" 
                          placeholder="Conferma la nuova password" 
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Button>
                        <Lock className="h-4 w-4 mr-2" />
                        Aggiorna Password
                      </Button>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Altre impostazioni di sicurezza</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Gestisci altre impostazioni relative alla sicurezza del tuo account
                      </p>
                      
                      <div className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                          Impostazioni di notifica di sicurezza
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Dispositivi connessi
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Storico attività account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="fatturazione">
                <Card>
                  <CardHeader>
                    <CardTitle>Informazioni di Fatturazione</CardTitle>
                    <CardDescription>
                      Gestisci il tuo piano di abbonamento e i metodi di pagamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Piano Attuale: {userData.plan}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Il tuo abbonamento si rinnova il 15 Giugno 2024
                          </p>
                        </div>
                        <Button variant="outline">Cambia Piano</Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Metodo di Pagamento</h3>
                      <div className="flex items-center p-4 border rounded-lg">
                        <CreditCard className="h-10 w-10 text-muted-foreground mr-4" />
                        <div>
                          <p className="font-medium">Carta di Credito</p>
                          <p className="text-sm text-muted-foreground">**** **** **** 4567</p>
                          <p className="text-sm text-muted-foreground">Scadenza: 12/24</p>
                        </div>
                        <Button variant="ghost" className="ml-auto">Modifica</Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Fatture</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Maggio 2024</p>
                            <p className="text-sm text-muted-foreground">Piano Premium - €29.99</p>
                          </div>
                          <Button variant="ghost" size="sm">Scarica</Button>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Aprile 2024</p>
                            <p className="text-sm text-muted-foreground">Piano Premium - €29.99</p>
                          </div>
                          <Button variant="ghost" size="sm">Scarica</Button>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Marzo 2024</p>
                            <p className="text-sm text-muted-foreground">Piano Premium - €29.99</p>
                          </div>
                          <Button variant="ghost" size="sm">Scarica</Button>
                        </div>
                      </div>
                    </div>
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