import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

// Interfaccia per i dati dettagliati di una proprietà
interface PropertyDetailData {
  property: {
    id: number;
    name: string;
    units: number;
    unitNames?: string[];
  };
  summary: {
    income: number;
    expenses: number;
    net: number;
    occupancyRate: number;
    netMarginPercent: number | string;
    tenantCount: number;
  };
  costsByCategory: Array<{
    category: string;
    count: number;
    total: number;
    average: number;
  }>;
  currentTenants: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    unit: string;
    status: 'active' | 'late' | 'pending';
    startDate?: string;
    endDate?: string;
    rentAmount: number;
  }>;
  recentMaintenance: Array<{
    date: string;
    amount: number;
    description: string;
    category: string;
  }>;
}

interface PropertyPerformanceData {
  propertyId: string;
  propertyName: string;
  income: number;
  expenses: number;
  occupancyRate: number;
}

interface PropertyDetailSelectorProps {
  propertyData: PropertyPerformanceData[];
  startDate: Date | null;
  endDate: Date | null;
}

export function PropertyDetailSelector({
  propertyData,
  startDate,
  endDate
}: PropertyDetailSelectorProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [propertyDetail, setPropertyDetail] = useState<PropertyDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  // Carica i dettagli quando la proprietà viene selezionata
  useEffect(() => {
    if (!selectedPropertyId) {
      setPropertyDetail(null);
      return;
    }

    const loadPropertyDetail = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (startDate) params.startDate = startDate.toISOString().split('T')[0];
        if (endDate) params.endDate = endDate.toISOString().split('T')[0];

        const data = await api.reports.getPropertyDetail(selectedPropertyId, params);
        setPropertyDetail(data);
      } catch (error) {
        console.error("Errore nel caricamento dei dettagli:", error);
        toast({
          title: "Errore",
          description: "Non è stato possibile caricare i dettagli della proprietà",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPropertyDetail();
  }, [selectedPropertyId, startDate, endDate]);

  if (propertyData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-32 flex items-center justify-center">
            <p className="text-muted-foreground">Nessuna proprietà disponibile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector Card */}
      <Card>
        <CardHeader>
          <CardTitle>Seleziona una Proprietà</CardTitle>
          <CardDescription>Visualizza i dettagli completi per una proprietà specifica</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">Proprietà</label>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder="Scegli una proprietà" />
              </SelectTrigger>
              <SelectContent>
                {propertyData.map((prop) => (
                  <SelectItem key={prop.propertyId} value={prop.propertyId}>
                    {prop.propertyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dettagli Proprietà */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="h-32 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                <span className="text-sm text-muted-foreground">Caricamento dettagli...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : propertyDetail ? (
        <>
          {/* Info Proprietà */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{propertyDetail.property.name}</CardTitle>
              <CardDescription>
                {propertyDetail.property.units} unità {propertyDetail.property.unitNames && propertyDetail.property.unitNames.length > 0 ? `(${propertyDetail.property.unitNames.join(', ')})` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Entrate</p>
                <p className="text-2xl font-bold text-green-600">€{propertyDetail.summary.income.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uscite</p>
                <p className="text-2xl font-bold text-red-500">€{propertyDetail.summary.expenses.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Margine Netto</p>
                <p className={`text-2xl font-bold ${propertyDetail.summary.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  €{propertyDetail.summary.net.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Margine %</p>
                <p className={`text-2xl font-bold ${parseFloat(propertyDetail.summary.netMarginPercent as string) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {propertyDetail.summary.netMarginPercent}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupancy</p>
                <p className="text-2xl font-bold">{propertyDetail.summary.occupancyRate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inquilini Attuali</p>
                <p className="text-2xl font-bold">{propertyDetail.summary.tenantCount}/{propertyDetail.property.units}</p>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Costi per Categoria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Breakdown Costi per Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-2 font-semibold">Categoria</th>
                      <th className="pb-2 font-semibold text-right">Numero</th>
                      <th className="pb-2 font-semibold text-right">Totale</th>
                      <th className="pb-2 font-semibold text-right">Media</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertyDetail.costsByCategory.length > 0 ? (
                      propertyDetail.costsByCategory.map((cost) => (
                        <tr key={cost.category} className="border-b last:border-0">
                          <td className="py-3">{cost.category}</td>
                          <td className="py-3 text-right">{cost.count}</td>
                          <td className="py-3 text-right font-medium">€{cost.total.toLocaleString()}</td>
                          <td className="py-3 text-right">€{cost.average.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-muted-foreground">
                          Nessun costo registrato
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Inquilini Attuali */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Inquilini Attuali
              </CardTitle>
            </CardHeader>
            <CardContent>
              {propertyDetail.currentTenants.length > 0 ? (
                <div className="space-y-4">
                  {propertyDetail.currentTenants.map((tenant) => (
                    <div key={tenant.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{tenant.name}</p>
                          <p className="text-sm text-muted-foreground">Unità: {tenant.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{tenant.rentAmount.toLocaleString()}/mese</p>
                          <p className={`text-sm font-medium ${tenant.status === 'active' ? 'text-green-600' : 'text-orange-600'}`}>
                            {tenant.status === 'active' ? 'Attivo' : tenant.status === 'late' ? 'In Ritardo' : 'Sospeso'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>📧 {tenant.email}</p>
                        <p>📱 {tenant.phone}</p>
                        {tenant.startDate && tenant.endDate && (
                          <p>📅 {new Date(tenant.startDate).toLocaleDateString('it-IT')} - {new Date(tenant.endDate).toLocaleDateString('it-IT')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nessun inquilino attivo</p>
              )}
            </CardContent>
          </Card>

          {/* Manutenzione Recente */}
          {propertyDetail.recentMaintenance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Manutenzione Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-2 font-semibold">Data</th>
                      <th className="pb-2 font-semibold">Descrizione</th>
                      <th className="pb-2 font-semibold text-right">Importo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertyDetail.recentMaintenance.map((maintenance, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-3">{new Date(maintenance.date).toLocaleDateString('it-IT')}</td>
                        <td className="py-3">{maintenance.description}</td>
                        <td className="py-3 text-right font-medium">€{maintenance.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="h-32 flex items-center justify-center">
              <p className="text-muted-foreground">Seleziona una proprietà per visualizzare i dettagli</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
