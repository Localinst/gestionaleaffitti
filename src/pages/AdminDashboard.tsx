import { useState } from "react";
import { Shield, LayoutDashboard, BarChart, Activity, ArrowDownToLine, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import AnalyticsStatsDashboard from "@/components/dashboard/AnalyticsStatsDashboard";
import PerformanceAnalyticsDashboard from "@/components/dashboard/PerformanceAnalyticsDashboard";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const { user: currentUser } = useAuth();
  
  const generatePDF = () => {
    // In produzione, questa funzione genererebbe un report PDF delle statistiche
    alert("Generazione report PDF in corso...");
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background text-foreground min-h-screen">
      <Card className="border-border shadow-lg mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4 bg-card">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">Pannello Admin - Dashboard Analytics</CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            Admin: {currentUser?.email || 'N/A'}
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
        <Button onClick={() => setActiveTab("analytics")} variant={activeTab === "analytics" ? "default" : "outline"} className="w-full md:w-auto">
          <BarChart className="h-4 w-4 mr-2" />
          Statistiche Utenti
        </Button>
        <Button onClick={() => setActiveTab("performance")} variant={activeTab === "performance" ? "default" : "outline"} className="w-full md:w-auto">
          <Activity className="h-4 w-4 mr-2" />
          Performance
        </Button>
        <Button onClick={generatePDF} variant="outline" className="w-full md:w-auto ml-auto">
          <ArrowDownToLine className="h-4 w-4 mr-2" />
          Esporta Report
        </Button>
      </div>

      <div className="mb-6">
        <Card>
          <CardContent className="p-6">
            {activeTab === "analytics" && <AnalyticsStatsDashboard />}
            {activeTab === "performance" && <PerformanceAnalyticsDashboard />}
          </CardContent>
        </Card>
      </div>

      
    </div>
  );
};

export default AdminDashboard; 