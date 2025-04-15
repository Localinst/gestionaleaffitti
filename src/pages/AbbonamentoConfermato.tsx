import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const AbbonamentoConfermato: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle size={80} className="text-green-500" />
          </div>
          <CardTitle className="text-2xl">Servizio Gratuito Confermato!</CardTitle>
          <CardDescription>
            Hai accesso a tutte le funzionalità del Gestionale Affitti gratuitamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-2">Dettagli servizio</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Piano: <span className="font-medium">Completo</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Costo: <span className="font-medium text-green-600">€0 - Gratuito</span>
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Grazie per esserti registrato al nostro servizio. Inizia subito a gestire i tuoi affitti!
            </p>
            
            <div className="flex flex-col gap-3">
              <Link to="/dashboard">
                <Button className="w-full">Vai alla dashboard</Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full">Torna alla home</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AbbonamentoConfermato; 