import React, { createContext, useState, ReactNode } from 'react';

interface AgentPosition {
  lat: number;
  lng: number;
}

interface AgentPositionContextType {
  agentPosition: AgentPosition | null;
  updateAgentPosition: (position: AgentPosition) => void;
}

export const AgentPositionContext = createContext<AgentPositionContextType>({
  agentPosition: null,
  updateAgentPosition: () => {}
});

interface AgentPositionProviderProps {
  children: ReactNode;
}

export const AgentPositionProvider: React.FC<AgentPositionProviderProps> = ({ children }) => {
  const [agentPosition, setAgentPosition] = useState<AgentPosition | null>(null);

  const updateAgentPosition = (position: AgentPosition) => {
    setAgentPosition(position);
  };

  return (
    <AgentPositionContext.Provider value={{ agentPosition, updateAgentPosition }}>
      {children}
    </AgentPositionContext.Provider>
  );
};