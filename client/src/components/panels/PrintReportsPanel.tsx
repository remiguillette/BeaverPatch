import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { AccidentReport } from '@shared/schema';
import i18n from '@/lib/i18n';

// Définition des interfaces pour les types complexes
interface Vehicle {
  licensePlate: string;
  makeModel: string;
  year: number;
  color: string;
}

// Type étendu pour AccidentReport
interface FullAccidentReport extends Omit<AccidentReport, 'vehicle1' | 'vehicle2'> {
  vehicle1: Vehicle;
  vehicle2?: Vehicle;
}

function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'PPP', { locale: fr });
}

export const PrintReportsPanel: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<FullAccidentReport | null>(null);
  
  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ['/api/accident-reports'],
    queryFn: async () => {
      const res = await fetch('/api/accident-reports');
      if (!res.ok) throw new Error('Erreur lors du chargement des rapports');
      return res.json() as Promise<FullAccidentReport[]>;
    }
  });

  const handlePrint = () => {
    // Ouvrir une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printContent = document.getElementById('print-content');
    if (!printContent) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Rapport d'accident</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            .report-header { margin-bottom: 20px; }
            .label { font-weight: bold; }
            .section { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const ReportList = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{i18n.t('print.selectReport')}</h2>
      
      {reports.length === 0 ? (
        <p>{i18n.t('print.noReports')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {reports.map((report) => (
            <div 
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="p-4 bg-[#2D2D2D] rounded-lg cursor-pointer hover:bg-[#3D3D3D] transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{formatDate(report.dateTime)}</p>
                  <p className="text-sm">{report.location}</p>
                </div>
                <Button variant="outline" size="sm">
                  {i18n.t('print.view')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ReportDetail = () => {
    if (!selectedReport) return null;
    
    // Conversion sécurisée des propriétés du véhicule
    const vehicle1 = selectedReport.vehicle1 as Vehicle;
    const vehicle2 = selectedReport.vehicle2 as Vehicle | undefined;
    
    return (
      <div>
        <div className="flex items-center mb-4 space-x-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedReport(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {i18n.t('print.back')}
          </Button>
          
          <Button onClick={handlePrint} className="ml-auto">
            <Printer className="h-4 w-4 mr-2" />
            {i18n.t('print.print')}
          </Button>
        </div>
        
        <div id="print-content" className="bg-white text-black p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-center mb-6">Rapport d'accident automobile</h1>
          
          <div className="report-header">
            <p className="text-right">ID: {selectedReport.id}</p>
            <p className="text-right">Créé le: {formatDate(selectedReport.createdAt)}</p>
          </div>
          
          <div className="section">
            <h2 className="text-xl font-bold mb-3">Informations sur l'incident</h2>
            <div className="grid">
              <p><span className="label">Date et heure:</span> {formatDate(selectedReport.dateTime)}</p>
              <p><span className="label">Lieu:</span> {selectedReport.location}</p>
              <p><span className="label">Conditions météo:</span> {selectedReport.weatherConditions}</p>
              <p><span className="label">État de la route:</span> {selectedReport.roadConditions}</p>
            </div>
            <p className="mt-3"><span className="label">Description:</span> {selectedReport.description}</p>
          </div>
          
          <div className="section">
            <h2 className="text-xl font-bold mb-3">Véhicule 1</h2>
            <div className="grid">
              <p><span className="label">Plaque d'immatriculation:</span> {vehicle1.licensePlate}</p>
              <p><span className="label">Marque/Modèle:</span> {vehicle1.makeModel}</p>
              <p><span className="label">Année:</span> {vehicle1.year}</p>
              <p><span className="label">Couleur:</span> {vehicle1.color}</p>
            </div>
          </div>
          
          {vehicle2 && (
            <div className="section">
              <h2 className="text-xl font-bold mb-3">Véhicule 2</h2>
              <div className="grid">
                <p><span className="label">Plaque d'immatriculation:</span> {vehicle2.licensePlate}</p>
                <p><span className="label">Marque/Modèle:</span> {vehicle2.makeModel}</p>
                <p><span className="label">Année:</span> {vehicle2.year}</p>
                <p><span className="label">Couleur:</span> {vehicle2.color}</p>
              </div>
            </div>
          )}
          
          <div className="mt-10 text-center">
            <p>Ce rapport est généré automatiquement par le système de rapport d'accidents du Service de police de la région de Niagara.</p>
            <p className="text-sm mt-2">Imprimé le: {format(new Date(), 'Pp', { locale: fr })}</p>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="p-6">Chargement des rapports...</div>;
  if (error) return <div className="p-6 text-red-500">Erreur: Impossible de charger les rapports</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-[#1E1E1E]">
        <h2 className="text-2xl font-bold">{i18n.t('print.title')}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {selectedReport ? <ReportDetail /> : <ReportList />}
      </div>
    </div>
  );
};

export default PrintReportsPanel;