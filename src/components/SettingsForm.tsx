

import React from 'react';
import { CompanyInfo } from '../types';

interface SettingsFormProps {
  company: CompanyInfo;
  onUpdate: (data: Partial<CompanyInfo>) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ company, onUpdate, theme, onToggleTheme }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
  };

  return (
    <div className="space-y-8 pb-10">
      <section>
        <h3 className="text-sm font-black text-[#004a99] mb-6 border-l-4 border-[#004a99] pl-3 uppercase tracking-widest italic">Interface</h3>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase">Thème Visuel</label>
          <button 
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-left"
          >
            <span className="text-gray-800">{theme === 'light' ? 'Thème Clair' : 'Thème Sombre'}</span>
            <div className="flex items-center gap-2 text-gray-500">
              {theme === 'light' ? 
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> : 
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              }
            </div>
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-black text-[#004a99] mb-6 border-l-4 border-[#004a99] pl-3 uppercase tracking-widest italic">Identité de l'entreprise</h3>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Nom Commercial</label>
            <input name="name" value={company.name} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Slogan / Sous-titre</label>
            <input name="address" value={company.address} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Téléphone</label>
            <input name="phone" value={company.phone} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Email Pro</label>
            <input name="email" value={company.email} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">URL Logo (PNG)</label>
            <input name="logoUrl" value={company.logoUrl} onChange={handleChange} className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-black text-[#004a99] mb-6 border-l-4 border-[#004a99] pl-3 uppercase tracking-widest italic">Avis Client</h3>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase">Lien Avis Google</label>
          <input name="googleReviewUrl" value={company.googleReviewUrl || ''} onChange={handleChange} placeholder="https://g.page/r/..." className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
        </div>
      </section>
    </div>
  );
};

export default SettingsForm;
