import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import i18n from '@/lib/i18n';
import { WantedPerson } from '@/lib/types';
import { format } from 'date-fns';

const WantedPersonPanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: wantedPersons, isLoading, error } = useQuery({
    queryKey: ['/api/wanted-persons', searchTerm],
    queryFn: async () => {
      const url = searchTerm 
        ? `/api/wanted-persons?query=${encodeURIComponent(searchTerm)}` 
        : '/api/wanted-persons';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch wanted persons');
      }
      return response.json() as Promise<WantedPerson[]>;
    }
  });
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-[#1E1E1E]">
        <h2 className="text-2xl font-bold">{i18n.t('wantedPersons.title')}</h2>
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="p-4 bg-[#1E1E1E] border-b border-[#2D2D2D]">
          <div className="relative">
            <input 
              type="text" 
              placeholder={i18n.t('wantedPersons.searchPlaceholder')} 
              className="w-full p-3 pl-10 rounded-lg text-lg bg-[#2D2D2D] border border-[#3D3D3D] text-[#f89422]"
              value={searchTerm}
              onChange={handleSearch}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-2 top-3 text-[#f89422] opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40 text-[#f89422]">
              {i18n.t('common.loading')}...
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-40 text-red-500">
              {i18n.t('wantedPersons.searchError')}
            </div>
          ) : wantedPersons && wantedPersons.length > 0 ? (
            wantedPersons.map((person) => (
              <div key={person.id} className="bg-[#1E1E1E] p-4 rounded-lg flex items-start">
                <div className="w-24 h-24 bg-[#2D2D2D] rounded-lg mr-4 flex-shrink-0 flex items-center justify-center text-[#f89422] opacity-60">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="text-xl font-bold">{person.name}</h3>
                    <span className={`px-2 py-1 ${person.dangerLevel === 'Dangereux' ? 'bg-[#f89422] text-[#121212]' : 'bg-[#2D2D2D] text-[#f89422]'} rounded text-sm font-bold`}>
                      {person.dangerLevel}
                    </span>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>
                      <span className="text-sm opacity-70">{i18n.t('wantedPersons.personDetails.id')}</span>
                      <span className="ml-1">{person.personId}</span>
                    </div>
                    <div>
                      <span className="text-sm opacity-70">{i18n.t('wantedPersons.personDetails.age')}</span>
                      <span className="ml-1">{person.age}</span>
                    </div>
                    <div>
                      <span className="text-sm opacity-70">{i18n.t('wantedPersons.personDetails.height')}</span>
                      <span className="ml-1">{person.height} {i18n.t('common.cm')}</span>
                    </div>
                    <div>
                      <span className="text-sm opacity-70">{i18n.t('wantedPersons.personDetails.weight')}</span>
                      <span className="ml-1">{person.weight} {i18n.t('common.kg')}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-sm opacity-70">{i18n.t('wantedPersons.personDetails.lastLocation')}</div>
                    <div>{person.lastLocation} - {format(new Date(person.lastSeen), 'dd/MM/yyyy')}</div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-sm opacity-70">{i18n.t('wantedPersons.personDetails.warrants')}</div>
                    <div>{person.warrants}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex justify-center items-center h-40 text-[#f89422] opacity-70">
              {i18n.t('wantedPersons.noResults')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WantedPersonPanel;
