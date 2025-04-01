import React, { useContext } from 'react';
import i18n from '@/lib/i18n';
import ConnectionStatus from './ConnectionStatus';
import { NetworkStatus } from '@/lib/types';
import { AgentPositionContext } from '@/lib/contexts/AgentPositionContext';

interface FooterProps {
  networkStatus: NetworkStatus;
}

const Footer: React.FC<FooterProps> = ({ networkStatus }) => {
  const { agentPosition } = useContext(AgentPositionContext);

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
      <div className="flex items-center flex-wrap">
        <div className="flex items-center mr-4">
          <div className="flex items-center">
            <ConnectionStatus />
          </div>
        </div>
        
        <div className="flex items-center mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          <span>5G: {getNetworkStatusText(networkStatus)}</span>
        </div>

        {agentPosition && (
          <div className="flex items-center">
            <div className="bg-[#f89422] text-black p-1 rounded-full mr-2 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.5-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.9 2 11 2 11.3V16c0 .6.4 1 1 1h1"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <div className="text-xs">
              <span className="opacity-75">Position: </span>
              <span className="font-bold">{agentPosition.lat.toFixed(6)}, {agentPosition.lng.toFixed(6)}</span>
            </div>
          </div>
        )}
      </div>
      
      <div>
        <span>{i18n.t('application.version')}</span>
      </div>
    </footer>
  );
};

export default Footer;
