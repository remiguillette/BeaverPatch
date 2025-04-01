import React from 'react';
import i18n from '@/lib/i18n';
import ConnectionStatus from './ConnectionStatus';
import { NetworkStatus } from '@/lib/types';

interface FooterProps {
  networkStatus: NetworkStatus;
}

const Footer: React.FC<FooterProps> = ({ networkStatus }) => {
  const getNetworkStatusText = (status: NetworkStatus): string => {
    switch (status) {
      case 'excellent':
        return i18n.t('connection.network.excellent');
      case 'good':
        return i18n.t('connection.network.good');
      case 'fair':
        return i18n.t('connection.network.fair');
      case 'poor':
        return i18n.t('connection.network.poor');
      case 'none':
        return i18n.t('connection.network.none');
      default:
        return i18n.t('connection.network.none');
    }
  };

  return (
    <footer className="bg-[#1E1E1E] p-2 flex justify-between items-center border-t border-[#2D2D2D] text-sm">
      <div className="flex items-center">
        <div className="flex items-center mr-4">
          <div className="flex items-center">
            <ConnectionStatus />
          </div>
        </div>
        
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          <span>5G: {getNetworkStatusText(networkStatus)}</span>
        </div>
      </div>
      
      <div>
        <span>{i18n.t('application.version')}</span>
      </div>
    </footer>
  );
};

export default Footer;
