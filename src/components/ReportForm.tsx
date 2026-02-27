import React, { useState } from 'react';
import { ReportData, InvestigationRow } from '../types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ReportFormProps {
  data: ReportData;
  onUpdate: (data: Partial<ReportData>) => void;
}

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <h3 className="text-sm font-heading font-bold text-[#004a99] uppercase tracking-wider">{title}</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t border-slate-100">
          <div className="space-y-4 mt-4">{children}</div>
        </div>
      )}
    </div>
  );
};

const Input: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean }> = ({ label, name, value, onChange, disabled = false }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <input name={name} value={value} onChange={onChange} disabled={disabled} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500" />
  </div>
);

const TextArea: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number }> = ({ label, name, value, onChange, rows = 3 }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <textarea name={name} value={value} onChange={onChange} rows={rows} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800" />
  </div>
);

const RichTextEditor: React.FC<{ label: string; value: string; onChange: (content: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <div className="bg-white rounded-lg overflow-hidden border border-slate-300">
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={onChange}
        modules={{
          toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
          ],
        }}
        className="text-sm font-semibold text-slate-800"
      />
    </div>
  </div>
);

const ReportForm: React.FC<ReportFormProps> = ({ data, onUpdate }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onUpdate({ [e.target.name]: e.target.value });
  };

  const handleNestedChange = (section: keyof ReportData, field: string, value: any) => {
    onUpdate({ [section]: { ...(data[section] as object), [field]: value } });
  };

  const handleListChange = (section: keyof ReportData, subkey: string, value: string) => {
    onUpdate({
        [section]: {
            ...(data[section] as object),
            [subkey]: value.split('\n')
        }
    });
  }

  const updateInvestigation = (id: string, field: keyof InvestigationRow, value: string) => {
    onUpdate({ investigations: data.investigations.map(inv => inv.id === id ? { ...inv, [field]: value } : inv) });
  };

  const addInvestigation = () => {
    const newRow: InvestigationRow = { id: Date.now().toString(), defect: "", location: "", description: "", diagnostic: "OBSERVATION" };
    onUpdate({ investigations: [...data.investigations, newRow] });
  };

  const removeInvestigation = (id: string) => {
    onUpdate({ investigations: data.investigations.filter(i => i.id !== id) });
  };

  return (
    <div className="space-y-4 pb-10">
      <CollapsibleSection title="1. Infos Chantier" defaultOpen>
        {data.rawTranscription && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 block">Transcription Vocale</label>
            <p className="text-xs text-slate-700 italic leading-relaxed">"{data.rawTranscription}"</p>
          </div>
        )}
        <Input label="Client" name="client" value={data.client} onChange={handleChange} />
        <Input label="Chantier" name="chantier" value={data.chantier} onChange={handleChange} />
        <Input label="Adresse" name="adresse" value={data.adresse} onChange={handleChange} />
        <Input label="Date" name="date" value={data.date} onChange={handleChange} />
        <Input label="Intervenant" name="intervenant" value={data.intervenant} onChange={handleChange} />
        <Input label="Objet" name="objet" value={data.objet} onChange={handleChange} />
      </CollapsibleSection>

      <CollapsibleSection title="2. Localisation et Accès">
        <TextArea label="Zone d'intervention" name="zoneIntervention" value={data.zoneIntervention} onChange={handleChange} />
        <TextArea label="Configuration" name="configuration" value={data.configuration} onChange={handleChange} />
      </CollapsibleSection>

      <CollapsibleSection title="3. Résumé des Opérations">
        <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Phase 1 : Débouchage</h4>
        <TextArea label="Contexte" name="context" value={data.phase1.context} onChange={(e) => handleNestedChange('phase1', e.target.name, e.target.value)} />
        <TextArea label="Action" name="action" value={data.phase1.action} onChange={(e) => handleNestedChange('phase1', e.target.name, e.target.value)} />
        <TextArea label="Constat" name="constat" value={data.phase1.constat} onChange={(e) => handleNestedChange('phase1', e.target.name, e.target.value)} />
        
        <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider pt-4 mt-4 border-t border-slate-100">Phase 2 : Inspection</h4>
        <TextArea label="Contexte" name="context" value={data.phase2.context} onChange={(e) => handleNestedChange('phase2', e.target.name, e.target.value)} />
        <TextArea label="Action" name="action" value={data.phase2.action} onChange={(e) => handleNestedChange('phase2', e.target.name, e.target.value)} />
        <TextArea label="Constats (un par ligne)" name="constatsList" value={data.phase2.constatsList?.join('\n') || ''} onChange={(e) => handleNestedChange('phase2', 'constatsList', e.target.value.split('\n'))} />
      </CollapsibleSection>

      <CollapsibleSection title="Synthèse et Avis Technique">
        <RichTextEditor label="Description Détaillée" value={data.avisTechnique.description} onChange={(content) => handleNestedChange('avisTechnique', 'description', content)} />
        <TextArea label="Diagnostic Final" name="diagnosticFinal" value={data.avisTechnique.diagnosticFinal} onChange={(e) => handleNestedChange('avisTechnique', e.target.name, e.target.value)} rows={4}/>
        <TextArea label="Recommandation" name="recommandation" value={data.avisTechnique.recommandation} onChange={(e) => handleNestedChange('avisTechnique', e.target.name, e.target.value)} rows={4}/>
      </CollapsibleSection>

      <CollapsibleSection title="4. Analyse Détaillée">
        <div className="space-y-4">
          {data.investigations.map((inv) => (
            <div key={inv.id} className="bg-slate-50 border border-slate-200 p-4 rounded-lg relative group">
              <button onClick={() => removeInvestigation(inv.id)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              <div className="grid grid-cols-1 gap-3">
                <Input label="Défaut Détecté" name="defect" value={inv.defect} onChange={(e) => updateInvestigation(inv.id, 'defect', e.target.value)} />
                <Input label="Localisation" name="location" value={inv.location} onChange={(e) => updateInvestigation(inv.id, 'location', e.target.value)} />
                <TextArea label="Description" name="description" value={inv.description} onChange={(e) => updateInvestigation(inv.id, 'description', e.target.value)} rows={2}/>
                <select value={inv.diagnostic} onChange={(e) => updateInvestigation(inv.id, 'diagnostic', e.target.value as any)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800"><option value="FONCTIONNEL">Fonctionnel</option><option value="À REMPLACER">À Remplacer</option><option value="OBSERVATION">Observation</option></select>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addInvestigation} className="w-full mt-4 bg-blue-100 text-blue-800 text-xs font-black py-2.5 rounded-lg uppercase tracking-wider hover:bg-blue-200 transition-colors">+ Ajouter une ligne</button>
      </CollapsibleSection>

       <CollapsibleSection title="5. Préconisations de Travaux">
          <TextArea label="A. Rectification (un par ligne)" name="rectification" value={data.preconisations.rectification.join('\n')} onChange={(e) => handleListChange('preconisations', e.target.name, e.target.value)} rows={5}/>
          <TextArea label="B. Maintenance (un par ligne)" name="maintenance" value={data.preconisations.maintenance.join('\n')} onChange={(e) => handleListChange('preconisations', e.target.name, e.target.value)} rows={4}/>
      </CollapsibleSection>
    </div>
  );
};

export default ReportForm;
