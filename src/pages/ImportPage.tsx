import { ExcelImportWizard } from "@/components/import/ExcelImportWizard";
import { AppLayout } from "@/components/layout/AppLayout";

export default function ImportPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Importazione Dati</h1>
        <ExcelImportWizard />
      </div>
    </AppLayout>
  );
} 