import { useState, useEffect } from "react";
import { X, Shield, User, Mail, Calendar, Info, RotateCw, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { SecureCookie } from "@/lib/security";

// Tipo per gli utenti
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLogin: string | null;
  status: "active" | "inactive" | "pending";
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionStartTime] = useState(new Date());
  
  const { toast } = useToast();
  const { user: _currentUser } = useAuth();
  
  const logAdminAction = (action: string, details: string) => {
    console.log(`[ADMIN LOG] ${new Date().toISOString()} - ${action}: ${details}`);
    const actionLog = {
      action,
      details,
      timestamp: new Date().toISOString(),
      adminUser: _currentUser?.email || 'N/A'
    };
    SecureCookie.set("last_admin_action", JSON.stringify(actionLog), 1);
  };
  
  useEffect(() => {
    fetchUsers();
    logAdminAction("session_start", `Accesso pagina admin da ${_currentUser?.email || 'utente sconosciuto'}`);

    return () => {
      const sessionDuration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000);
      logAdminAction("session_end", `Durata sessione: ${sessionDuration} secondi`);
    };
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Recupera il token di autenticazione da localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
          // Se non c'è token, non dovrebbe nemmeno essere qui grazie a ProtectedRoute,
          // ma aggiungiamo un controllo per sicurezza.
          toast({
            title: "Errore di Autenticazione",
            description: "Token non trovato. Effettua nuovamente il login.",
            variant: "destructive"
          });
          setLoading(false);
          return; 
      }

      // Chiama l'endpoint API del backend per ottenere gli utenti
      const response = await fetch('/api/admin/users', { // Assicurati che il percorso API sia corretto
        method: 'GET',
        headers: {
          // Invia il token JWT per l'autenticazione e l'autorizzazione nel backend
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });

      if (!response.ok) {
        // Prova a leggere l'errore JSON dal backend, se presente
        let errorData = { error: `Errore HTTP ${response.status}` };
        try {
            errorData = await response.json();
        } catch (e) { /* Ignora se il corpo non è JSON */ }
        
        console.error('Errore API durante il recupero degli utenti:', response.status, errorData);
        throw new Error(errorData.error || `Errore ${response.status} durante il recupero degli utenti`);
      }

      // Parsa la risposta JSON che contiene l'array di utenti
      const fetchedUsers: User[] = await response.json();

      // Aggiorna lo stato con gli utenti recuperati
      setUsers(fetchedUsers);
      logAdminAction("fetch_users", `Recuperati ${fetchedUsers.length} utenti dall'API backend`);

    } catch (error: any) {
      // Gestione generica degli errori (rete, parsing JSON, errori lanciati manualmente)
      console.error('Errore durante il recupero degli utenti (API Call):', error);
      toast({
        title: "Errore Recupero Utenti",
        description: error.message || "Impossibile recuperare la lista degli utenti dal server.",
        variant: "destructive"
      });
    } finally {
      // Assicurati che il loading sia impostato a false in ogni caso
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Intl.DateTimeFormat("it-IT", {
        dateStyle: "short",
        timeStyle: "short"
      }).format(new Date(dateString));
    } catch (e) {
      return "Data non valida";
    }
  };

  const renderStatus = (status: string) => {
    let color = "bg-gray-500";
    if (status === "active") color = "bg-green-500";
    if (status === "pending") color = "bg-yellow-500";
    if (status === "inactive") color = "bg-red-500";
    return (
      <Badge variant="secondary" className={`capitalize ${color} text-white hover:${color}`}>
        {status === 'active' ? 'Attivo' : status === 'pending' ? 'In attesa' : 'Inattivo'}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" || 
      user.status === activeTab;
      
    return matchesSearch && matchesTab;
  });

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background text-foreground min-h-screen">
      <Card className="border-border shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4 bg-card">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">Pannello Admin - Gestione Utenti</CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            Admin: {_currentUser?.email || 'N/A'}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RotateCw className="h-8 w-8 animate-spin text-primary mr-2" />
              Caricamento utenti...
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                <TabsList>
                  <TabsTrigger value="all">Tutti ({users.length})</TabsTrigger>
                  <TabsTrigger value="active">Attivi ({users.filter(u => u.status === 'active').length})</TabsTrigger>
                  <TabsTrigger value="pending">In Attesa ({users.filter(u => u.status === 'pending').length})</TabsTrigger>
                  <TabsTrigger value="inactive">Inattivi ({users.filter(u => u.status === 'inactive').length})</TabsTrigger>
                </TabsList>
                <div className="relative w-full md:w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search"
                    placeholder="Cerca per nome o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-full"
                  />
                </div>
              </div>

              <TabsContent value={activeTab}>
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[100px]"><User className="inline-block mr-1 h-4 w-4"/> ID Utente</TableHead>
                        <TableHead><User className="inline-block mr-1 h-4 w-4"/> Nome</TableHead>
                        <TableHead><Mail className="inline-block mr-1 h-4 w-4"/> Email</TableHead>
                        <TableHead><Calendar className="inline-block mr-1 h-4 w-4"/> Registrato il</TableHead>
                        <TableHead><Calendar className="inline-block mr-1 h-4 w-4"/> Ultimo Login</TableHead>
                        <TableHead><Info className="inline-block mr-1 h-4 w-4"/> Stato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium text-xs">{user.id.substring(0, 8)}...</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell>{formatDate(user.lastLogin)}</TableCell>
                            <TableCell>{renderStatus(user.status)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Nessun utente trovato.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <Card className="mt-8 border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-500" />
                Log Attività Admin (Ultima Azione)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                {JSON.stringify(JSON.parse(SecureCookie.get("last_admin_action") || '{}'), null, 2)}
              </pre>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers; 