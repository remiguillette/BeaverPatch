import React, { useState } from 'react';
import i18n from '@/lib/i18n';
import { PanelType, NetworkStatus } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GPSPanel from '@/components/panels/GPSPanel';
import AccidentReportPanel from '@/components/panels/AccidentReportPanel';
import TrafficViolationPanel from '@/components/panels/TrafficViolationPanel';
import WantedPersonPanel from '@/components/panels/WantedPersonPanel';
import PrintReportsPanel from '@/components/panels/PrintReportsPanel';

const Home: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelType>('gps');
  // In a real application, this would be determined by actual network conditions
  // but for this implementation, we're keeping it static
  const networkStatus: NetworkStatus = 'excellent';
  
  const handlePanelChange = (panel: PanelType) => {
    setActivePanel(panel);
  };
  
  return (
    <div className="flex flex-col h-screen w-screen bg-[#121212] text-[#f89422]">
      <Header />
      
      {/* Panel Navigation */}
      <div className="bg-[#1E1E1E] flex justify-center space-x-4 py-3 px-4">
        <button 
          className={`px-6 py-2 rounded-lg font-bold transition duration-200 ${
            activePanel === 'gps' 
              ? 'bg-[#f89422] text-[#121212]' 
              : 'bg-[#2D2D2D] text-[#f89422]'
          }`}
          onClick={() => handlePanelChange('gps')}
        >
          {i18n.t('panels.gps')}
        </button>
        <button 
          className={`px-6 py-2 rounded-lg font-bold transition duration-200 ${
            activePanel === 'accident-report' 
              ? 'bg-[#f89422] text-[#121212]' 
              : 'bg-[#2D2D2D] text-[#f89422]'
          }`}
          onClick={() => handlePanelChange('accident-report')}
        >
          {i18n.t('panels.accidentReport')}
        </button>
        <button 
          className={`px-6 py-2 rounded-lg font-bold transition duration-200 ${
            activePanel === 'violation-report' 
              ? 'bg-[#f89422] text-[#121212]' 
              : 'bg-[#2D2D2D] text-[#f89422]'
          }`}
          onClick={() => handlePanelChange('violation-report')}
        >
          {i18n.t('panels.trafficViolation')}
        </button>
        <button 
          className={`px-6 py-2 rounded-lg font-bold transition duration-200 ${
            activePanel === 'wanted-persons' 
              ? 'bg-[#f89422] text-[#121212]' 
              : 'bg-[#2D2D2D] text-[#f89422]'
          }`}
          onClick={() => handlePanelChange('wanted-persons')}
        >
          {i18n.t('panels.wantedPersons')}
        </button>
        <button 
          className={`px-6 py-2 rounded-lg font-bold transition duration-200 ${
            activePanel === 'print-reports' 
              ? 'bg-[#f89422] text-[#121212]' 
              : 'bg-[#2D2D2D] text-[#f89422]'
          }`}
          onClick={() => handlePanelChange('print-reports')}
        >
          {i18n.t('panels.printReports')}
        </button>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {activePanel === 'gps' && <GPSPanel />}
        {activePanel === 'accident-report' && <AccidentReportPanel />}
        {activePanel === 'violation-report' && <TrafficViolationPanel />}
        {activePanel === 'wanted-persons' && <WantedPersonPanel />}
        {activePanel === 'print-reports' && <PrintReportsPanel />}
      </main>
      
      <Footer networkStatus={networkStatus} />
    </div>
  );
};

export default Home;
