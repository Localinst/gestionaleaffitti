import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// I componenti Stripe sono stati disabilitati poiché il servizio è ora gratuito
// Questi componenti sono solo segnaposto e non effettuano mai pagamenti reali

// Componente fittizio per sostituire il form di pagamento
const CheckoutForm = ({ planType }: { planType: 'monthly' | 'annual' }) => {
  return (
    <div className="text-center p-4">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-xl font-medium mb-2">Servizio Gratuito</h3>
      <p className="text-muted-foreground mb-4">
        Il nostro servizio è ora completamente gratuito. Non è necessario alcun pagamento.
      </p>
      <Link to="/register">
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
          Registrati Gratuitamente
        </Button>
      </Link>
    </div>
  );
};

// Componente wrapper fittizio
export const StripePaymentForm = ({ planType }: { planType: 'monthly' | 'annual' }) => {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          Servizio Gratuito
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          Tutte le funzionalità sono ora disponibili gratuitamente per tutti gli utenti
        </p>
        <CheckoutForm planType={planType} />
      </CardContent>
    </Card>
  );
};

// Componente pulsante fittizio
export const StripeCheckoutButton = ({ planType }: { planType: 'monthly' | 'annual' }) => {
  return (
    <div>
      <Link to="/register">
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
          Registrati Gratuitamente
        </Button>
      </Link>
    </div>
  );
}; 