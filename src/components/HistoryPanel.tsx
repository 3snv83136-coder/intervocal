import React from 'react';
import { ReportData } from '../types';

interface HistoryPanelProps {
  reports: ReportData[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ reports, onLoad, onDelete, onNew }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <button 
          onClick={onNew}
          className="w-full bg-blue-600 text-white text-sm font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nouveau Rapport
        </button>
      </div>
      <h3 className="text-sm font-heading font-bold text-[#004a99] uppercase tracking-wider mb-3">
        Historique des Rapports
      </h3>
      {reports.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center bg-white border-dashed border-2 border-slate-200 rounded-xl p-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mb-3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <p className="text-sm font-semibold text-slate-600">Aucun rapport sauvegardé.</p>
            <p className="text-xs text-slate-400 mt-1">Créez votre premier rapport pour le voir ici.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto -mr-3 pr-2 space-y-2">
          {reports.map(report => (
            <div key={report.id} className="bg-white p-3 rounded-lg border border-slate-200 group hover:border-blue-500 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="font-bold text-sm text-slate-800">{report.client || "Client non défini"}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{formatDate(report.timestamp)}</p>
                       <p className="text-[9px] mt-1 font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full inline-block">{report.intervenant}</p>
                  </div>
                  <button 
                      onClick={() => onDelete(report.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 p-1.5 rounded-full transition-opacity"
                      title="Supprimer ce rapport"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
              </div>
               <button 
                  onClick={() => onLoad(report.id)} 
                  className="w-full text-center mt-2 bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-md hover:bg-blue-100 hover:text-blue-800 transition-colors"
               >
                  Charger
               </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
