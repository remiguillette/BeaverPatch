import React from 'react';
import i18n from '@/lib/i18n';
import { useConnectionStatus } from '@/lib/socket';
import { ConnectionStatus as ConnectionStatusType } from '@/lib/types';

interface ConnectionStatusProps {
  large?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ large = false }) => {
  const status = useConnectionStatus();
  
  const getColorClass = (status: ConnectionStatusType): string => {
    switch (status) {
      case 'connected':
        return 'bg-[#4CAF50]';
      case 'reconnecting':
        return 'bg-[#FFC107]';
      case 'disconnected':
        return 'bg-[#F44336]';
      default:
        return 'bg-[#F44336]';
    }
  };
  
  const getStatusText = (status: ConnectionStatusType): string => {
    switch (status) {
      case 'connected':
        return i18n.t('connection.status.connected');
      case 'reconnecting':
        return i18n.t('connection.status.reconnecting');
      case 'disconnected':
        return i18n.t('connection.status.disconnected');
      default:
        return i18n.t('connection.status.disconnected');
    }
  };
  
  return (
    <div className="flex items-center">
      <div className={`h-${large ? '3' : '2'} w-${large ? '3' : '2'} rounded-full ${getColorClass(status)} mr-${large ? '2' : '1'} animate-pulse`}></div>
      <span className={large ? 'text-lg' : 'text-sm'}>{getStatusText(status)}</span>
    </div>
  );
};

export default ConnectionStatus;
