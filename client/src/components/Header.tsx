import React from 'react';
import i18n from '@/lib/i18n';
import ConnectionStatus from './ConnectionStatus';
import WeatherWidget from './WeatherWidget';

const Header: React.FC = () => {
  return (
    <header className="bg-[#1E1E1E] p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold text-[#f89422]">{i18n.t('application.title')}</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        <WeatherWidget />
        <ConnectionStatus large />
      </div>
    </header>
  );
};

export default Header;
