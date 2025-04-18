import React, { useState } from "react";
import { Bell, Check, Trash2, Filter } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Tipi di notifica per il sistema
type NotificationType = "pagamento" | "scadenza" | "contratto" | "sistema" | "inquilino";

// Interfaccia per una notifica
interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: NotificationType;
}

// Dati di esempio per le notifiche
const sampleNotifications: Notification[] = [
  {
    id: "1",
    title: "Pagamento ricevuto",
    message: "È stato registrato un pagamento di €500 per l'appartamento in Via Roma 10.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minuti fa
    read: false,
    type: "pagamento"
  },
  {
    id: "2",
    title: "Contratto in scadenza",
    message: "Il contratto per la proprietà in Via Milano 23 scadrà tra 30 giorni.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 ore fa
    read: false,
    type: "scadenza"
  },
  {
    id: "3",
    title: "Nuovo messaggio dall'inquilino",
    message: "Mario Rossi ha inviato una richiesta di manutenzione.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 giorno fa
    read: true,
    type: "inquilino"
  },
  {
    id: "4",
    title: "Contratto firmato",
    message: "Il contratto per Via Napoli 45 è stato firmato digitalmente da entrambe le parti.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 giorni fa
    read: true,
    type: "contratto"
  },
  {
    id: "5",
    title: "Aggiornamento del sistema",
    message: "Abbiamo aggiornato Tenoris360 con nuove funzionalità. Scopri di più!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 giorni fa
    read: true,
    type: "sistema"
  }
];

// Funzione per formattare la data
const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);
  
  if (diffMin < 60) {
    return `${diffMin} min fa`;
  } else if (diffHrs < 24) {
    return `${diffHrs} ore fa`;
  } else if (diffDays === 1) {
    return "Ieri";
  } else if (diffDays < 7) {
    return `${diffDays} giorni fa`;
  } else {
    return date.toLocaleDateString("it-IT", { 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    });
  }
};

// Funzione per ottenere colore e icona per il tipo di notifica
const getNotificationStyles = (type: NotificationType) => {
  switch (type) {
    case "pagamento":
      return { color: "bg-green-100 text-green-700", icon: "💰" };
    case "scadenza":
      return { color: "bg-yellow-100 text-yellow-700", icon: "⏰" };
    case "contratto":
      return { color: "bg-blue-100 text-blue-700", icon: "📝" };
    case "inquilino":
      return { color: "bg-purple-100 text-purple-700", icon: "👤" };
    case "sistema":
      return { color: "bg-gray-100 text-gray-700", icon: "🔔" };
    default:
      return { color: "bg-gray-100 text-gray-700", icon: "🔔" };
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [activeTab, setActiveTab] = useState<"tutte" | "nonlette">("tutte");
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Filtra notifiche in base alla tab selezionata
  const displayedNotifications = activeTab === "tutte" 
    ? notifications 
    : notifications.filter(n => !n.read);
  
  // Segna come letta una notifica
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  // Segna tutte come lette
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };
  
  // Elimina una notifica
  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };
  
  // Elimina tutte le notifiche
  const deleteAllNotifications = () => {
    setNotifications([]);
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <PageHeader
          title="Notifiche"
          description="Gestisci le tue notifiche e rimanere aggiornato"
          icon={<Bell className="h-6 w-6" />}
        >
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Azioni
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Segna tutte come lette
                </DropdownMenuItem>
                <DropdownMenuItem onClick={deleteAllNotifications}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina tutte
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </PageHeader>
        
        <Tabs defaultValue="tutte" className="mt-6" onValueChange={(value) => setActiveTab(value as "tutte" | "nonlette")}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="tutte">Tutte</TabsTrigger>
              <TabsTrigger value="nonlette">
                Non lette
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="tutte">
            <NotificationsList 
              notifications={displayedNotifications} 
              onMarkAsRead={markAsRead} 
              onDelete={deleteNotification} 
            />
          </TabsContent>
          
          <TabsContent value="nonlette">
            <NotificationsList 
              notifications={displayedNotifications} 
              onMarkAsRead={markAsRead} 
              onDelete={deleteNotification} 
            />
          </TabsContent>
        </Tabs>
        
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10">
            <Bell className="h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">Nessuna notifica</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tutte le notifiche appariranno qui quando saranno disponibili.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationsList({ notifications, onMarkAsRead, onDelete }: NotificationsListProps) {
  return (
    <div className="space-y-4">
      {notifications.map(notification => {
        const { color, icon } = getNotificationStyles(notification.type);
        
        return (
          <Card 
            key={notification.id} 
            className={`${notification.read ? "bg-card" : "bg-accent"} transition-colors`}
          >
            <CardHeader className="pb-2 flex flex-row justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${notification.read ? "opacity-70" : ""}`}>
                    {icon}
                  </span>
                  <CardTitle className="text-base font-medium">
                    {notification.title}
                  </CardTitle>
                  {!notification.read && (
                    <Badge variant="secondary" className="ml-2">Nuova</Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  {formatTimestamp(notification.timestamp)}
                </CardDescription>
              </div>
              <div className="flex items-start space-x-1">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onMarkAsRead(notification.id)}
                    className="h-7 w-7"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(notification.id)}
                  className="h-7 w-7"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{notification.message}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 