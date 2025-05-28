import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Session {
  id: string;
  user_id: string;
  email?: string;
  start_time: string;
  end_time: string;
  page_views: number;
  routes: string[];
}

const AdminSessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sessions");
      const data = await res.json();
      setSessions(data);
    } catch (e) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Sessioni Utenti Autenticati</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Caricamento sessioni...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Inizio</TableHead>
                  <TableHead>Fine</TableHead>
                  <TableHead>Pagine Visitate</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.user_id}</TableCell>
                    <TableCell>{session.email || "-"}</TableCell>
                    <TableCell>{new Date(session.start_time).toLocaleString()}</TableCell>
                    <TableCell>{session.end_time ? new Date(session.end_time).toLocaleString() : "-"}</TableCell>
                    <TableCell>{session.page_views}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setSelectedSession(session)}>
                        Visualizza Percorso
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Percorso Sessione</h2>
            <div className="mb-2"><b>User ID:</b> {selectedSession.user_id}</div>
            <div className="mb-2"><b>Email:</b> {selectedSession.email || "-"}</div>
            <div className="mb-2"><b>Inizio:</b> {new Date(selectedSession.start_time).toLocaleString()}</div>
            <div className="mb-2"><b>Fine:</b> {selectedSession.end_time ? new Date(selectedSession.end_time).toLocaleString() : "-"}</div>
            <div className="mb-2"><b>Pagine Visitate:</b> {selectedSession.page_views}</div>
            <div className="mb-2"><b>Percorso:</b></div>
            <ol className="list-decimal list-inside mb-4">
              {selectedSession.routes.map((route, idx) => (
                <li key={idx}>{route}</li>
              ))}
            </ol>
            <Button onClick={() => setSelectedSession(null)} variant="outline">Chiudi</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSessions; 