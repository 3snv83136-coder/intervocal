import React, { useState, useCallback, useEffect } from 'react';
import { INITIAL_REPORT_DATA, DEFAULT_COMPANY } from './constants';
import { ReportData, CompanyInfo } from './types';
import ReportPreview from './components/ReportPreview';
import ReportForm from './components/ReportForm';
import EstimateForm from './components/EstimateForm';
import VoiceAssistant from './components/VoiceAssistant';
import SettingsForm from './components/SettingsForm';
import HistoryPanel from './components/HistoryPanel';
import TechnicalLexicon from './components/TechnicalLexicon';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

type Tab = 'edit' | 'history' | 'settings';
type FormTab = 'report' | 'estimate';
type ViewMode = 'edit' | 'preview';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('edit');
  const [formTab, setFormTab] = useState<FormTab>('report');
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [data, setData] = useState<ReportData>({ ...INITIAL_REPORT_DATA, id: `report-${Date.now()}` });
  const [history, setHistory] = useState<ReportData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('debouchepro_v3_theme', newTheme);
  };
  
  // Website Text & Lexicon Features
  const [webText, setWebText] = useState<string>("");
  const [showWebModal, setShowWebModal] = useState(false);
  const [showLexicon, setShowLexicon] = useState(false);

  useEffect(() => {
    const savedCompany = localStorage.getItem('debouchepro_v3_company');
    if (savedCompany) {
      try { setCompany(JSON.parse(savedCompany)); } catch (e) {}
    }
    const savedHistoryJSON = localStorage.getItem('debouchepro_v3_history');
    if (savedHistoryJSON) {
        try { 
            const savedHistory = JSON.parse(savedHistoryJSON);
            if (Array.isArray(savedHistory) && savedHistory.length > 0) {
                setHistory(savedHistory);
                setData(savedHistory[0]);
            }
        } catch (e) { console.error("Failed to load history", e); }
    }
    const savedTheme = localStorage.getItem('debouchepro_v3_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);
  
  const handleUpdate = useCallback((newData: Partial<ReportData>) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []);
  
  const handleCompanyUpdate = useCallback((newCompany: Partial<CompanyInfo>) => {
    const updatedCompany = {...company, ...newCompany};
    setCompany(updatedCompany);
    localStorage.setItem('debouchepro_v3_company', JSON.stringify(updatedCompany));
  }, [company]);
  
  const handleSaveReport = useCallback(() => {
    setIsSaving(true);
    const updatedData = { ...data, timestamp: Date.now() };
    setData(updatedData);
    const historyIndex = history.findIndex(report => report.id === updatedData.id);
    let newHistory = [...history];
    if (historyIndex > -1) {
      newHistory[historyIndex] = updatedData;
    } else {
      newHistory.unshift(updatedData);
    }
    setHistory(newHistory);
    localStorage.setItem('debouchepro_v3_history', JSON.stringify(newHistory));
    setTimeout(() => {
      setIsSaving(false);
      setViewMode('preview');
    }, 1000);
  }, [data, history]);

  const handleNewReport = useCallback(() => {
    setData({ 
      ...INITIAL_REPORT_DATA, 
      id: `report-${Date.now()}`,
    });
    setActiveTab('edit');
    setFormTab('report');
    setViewMode('edit');
  }, []);

  const handleLoadReport = useCallback((id: string) => {
    const reportToLoad = history.find(report => report.id === id);
    if (reportToLoad) {
      setData(reportToLoad);
      setActiveTab('edit');
      setFormTab('report');
      setViewMode('edit');
    }
  }, [history]);

  const handleDeleteReport = useCallback((id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.")) return;
    const newHistory = history.filter(report => report.id !== id);
    setHistory(newHistory);
    localStorage.setItem('debouchepro_v3_history', JSON.stringify(newHistory));
    if (data.id === id) {
      if (newHistory.length > 0) {
        setData(newHistory[0]);
      } else {
        setData({ ...INITIAL_REPORT_DATA, id: `report-${Date.now()}` });
      }
    }
  }, [history, data.id]);

  const handleGeneratePDF = async () => {
    const container = document.getElementById('report-container');
    if (!container) return;
    setPdfLoading(true);
    setViewMode('preview');
    try {
      await new Promise(r => setTimeout(r, 500));
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      const pages = container.querySelectorAll('.page-a4');
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', width: page.offsetWidth, height: page.offsetHeight });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, '', 'FAST');
      }
      pdf.save(`Rapport-${data.client.replace(/\s/g, '_')}-${data.id}.pdf`);
    } catch (error) {
      console.error("Erreur PDF:", error);
      alert("Erreur de génération PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleGenerateWebsiteText = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/generateWebsiteText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error('Réponse API non valide');
      }

      const json = await response.json();
      setWebText(json.text || "Erreur de génération.");
      setShowWebModal(true);
    } catch (error) {
      console.error("Erreur génération texte web:", error);
      alert("La génération du texte a échoué.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-100 overflow-x-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      <aside className={`no-print w-full md:w-[380px] lg:w-[420px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen overflow-y-auto sticky top-0 flex flex-col z-50 ${viewMode === 'preview' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 bg-[#00334e]">
          <div className="flex flex-col items-center mb-6">
            {company.logoUrl && (
              <img src={company.logoUrl} alt="Logo" className="h-24 w-auto mb-2 drop-shadow-lg" />
            )}
            <div className="text-center">
              <h1 className="text-lg font-heading font-extrabold text-white uppercase tracking-tight leading-tight">{company.name}</h1>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">{company.address}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-5 bg-white/10 p-2 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
                <button onClick={handleSaveReport} disabled={isSaving} title="Enregistrer & Valider" className={`p-2 rounded-lg transition-colors ${isSaving ? 'bg-green-500' : 'bg-white/20 hover:bg-white/30'}`}>
                 {isSaving ? 
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                   :
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                 }
               </button>
               <button onClick={handleGenerateWebsiteText} title="Générer texte pour site internet" className="p-2 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
               </button>
               <button onClick={() => setViewMode('preview')} title="Prévisualiser le rapport" className="p-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
               </button>
               <button onClick={handleGeneratePDF} title="Exporter en PDF" className="p-2 bg-red-500 hover:bg-red-400 rounded-lg transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               </button>
               <button onClick={() => window.open('https://drive.google.com/', '_blank')} title="Ouvrir Google Drive" className="p-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M22 10v6M2 10v6M12 2v20M2 10l10-8 10 8M2 16l10 8 10-8"/></svg>
               </button>
            </div>
            <button onClick={() => setShowLexicon(true)} title="Lexique Technique" className="p-2 bg-slate-100/20 hover:bg-slate-100/30 rounded-lg transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </button>
          </div>

          <div className="flex bg-black/20 rounded-xl p-1 gap-1">
            <button onClick={() => setActiveTab('edit')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'edit' ? 'bg-white text-[#00334e]' : 'text-blue-100 hover:bg-white/10'}`}>Édition</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'history' ? 'bg-white text-[#00334e]' : 'text-blue-100 hover:bg-white/10'}`}>Historique</button>
            <button onClick={() => setActiveTab('settings')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white text-[#00334e]' : 'text-blue-100 hover:bg-white/10'}`}>Paramètres</button>
          </div>
        </div>

        <div className="flex-1 p-5 bg-slate-50/50 dark:bg-slate-800/50">
          {(activeTab === 'history' || activeTab === 'settings') && (
            <button 
              onClick={() => setActiveTab('edit')} 
              className="w-full mb-6 py-2.5 bg-slate-100 border border-slate-200 text-[#00334e] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Retour au Rapport
            </button>
          )}

          {activeTab === 'edit' && (
            <>
              <div className="flex bg-slate-200 rounded-lg p-1 gap-1 mb-4">
                <button onClick={() => setFormTab('report')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${formTab === 'report' ? 'bg-white shadow-sm text-[#00334e]' : 'text-slate-500'}`}>Rapport</button>
                <button onClick={() => setFormTab('estimate')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${formTab === 'estimate' ? 'bg-white shadow-sm text-[#00334e]' : 'text-slate-500'}`}>Devis</button>
              </div>
              <div className="mb-4 md:hidden">
                <button onClick={() => setViewMode('preview')} className="w-full py-3 bg-[#00334e] text-white rounded-xl text-xs font-black shadow-lg hover:bg-blue-900 transition-colors">VOIR LE DOCUMENT</button>
              </div>
              {formTab === 'report' && <ReportForm data={data} onUpdate={handleUpdate} />}
              {formTab === 'estimate' && <EstimateForm estimate={data.estimate} onUpdate={(newEstimate) => handleUpdate({ estimate: newEstimate })} />}
            </>
          )}
          {activeTab === 'history' && <HistoryPanel reports={history} onLoad={handleLoadReport} onDelete={handleDeleteReport} onNew={handleNewReport} />}
          {activeTab === 'settings' && <SettingsForm company={company} onUpdate={handleCompanyUpdate} theme={theme} onToggleTheme={toggleTheme} />}
        </div>

        {isProcessing && <div className="fixed inset-0 bg-[#00334e]/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-white"><div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div><h2 className="text-xl font-heading uppercase animate-pulse">Analyse IA en cours...</h2></div>}
        {pdfLoading && <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-[#00334e]"><div className="w-10 h-10 border-4 border-[#00334e] border-t-transparent rounded-full animate-spin mb-3"></div><p className="text-sm font-bold uppercase tracking-wider">Génération du PDF...</p></div>}
      </aside>

      <main className={`flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto ${viewMode === 'edit' ? 'hidden md:block' : 'block'}`}>
        <div className="no-print w-full max-w-[210mm] mx-auto flex justify-between items-center mb-4 md:hidden">
            <button onClick={() => setViewMode('edit')} className="text-[#00334e] font-black text-xs uppercase flex items-center gap-1 p-2 rounded-lg bg-white border border-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg> Modifier
            </button>
            <button onClick={handleGeneratePDF} disabled={pdfLoading} className="text-xs font-bold uppercase text-white bg-blue-600 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span>PDF</span>
            </button>
        </div>
        <div className="hidden md:flex w-full max-w-[210mm] justify-end items-center mb-4 mx-auto gap-3">
             <button onClick={() => setViewMode('edit')} className="text-xs font-bold uppercase text-[#00334e] dark:text-slate-200 bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Retour à l'édition</button>
             <button onClick={handleGeneratePDF} disabled={pdfLoading} className="text-xs font-bold uppercase text-white bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-300">
                {pdfLoading ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                )}
                Générer le PDF
            </button>
        </div>
        <div className="print-full-width">
          <ReportPreview data={data} company={company} onUpdate={handleUpdate} isGeneratingPdf={pdfLoading}/>
        </div>
      </main>

      <TechnicalLexicon isOpen={showLexicon} onClose={() => setShowLexicon(false)} />

      {/* Web Text Modal */}
      {showWebModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-amber-500 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Rédaction pour votre Site</h3>
                <p className="text-xs opacity-80 font-bold">Texte optimisé pour vos réalisations / blog</p>
              </div>
              <button onClick={() => setShowWebModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <textarea 
                className="w-full h-80 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium leading-relaxed text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                value={webText}
                onChange={(e) => setWebText(e.target.value)}
              />
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(webText);
                  alert("Texte copié !");
                }}
                className="flex-1 bg-[#00334e] text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                Copier le texte
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`no-print fixed bottom-6 right-6 z-[60] transition-all duration-300 ${viewMode === 'preview' || activeTab !== 'edit' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <VoiceAssistant onDataGenerated={(d) => {setData({...INITIAL_REPORT_DATA, ...d, id: `report-${Date.now()}`}); setViewMode('preview');}} onProcessingStateChange={setIsProcessing} />
      </div>
    </div>
  );
};

export default App;