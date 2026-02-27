import React, { useRef, useMemo, useState, useEffect } from 'react';
import { ReportData, CompanyInfo, OperationPhase } from '../types';
import SignaturePad from './SignaturePad';
import { TECHNICAL_TERMS } from '../constants';
import { QRCodeCanvas } from 'qrcode.react';

// --- Helper Components for Clean Layout ---

const SectionCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className="" }) => (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md shadow-gray-900/5 no-cut ${className}`}>
        {children}
    </div>
);


const SectionTitle: React.FC<{ number: string; title:string }> = ({ number, title }) => (
  <div className="border-b-2 border-blue-600 pb-2 mb-6 no-cut">
    <h2 className="text-lg font-black text-blue-800 uppercase tracking-wider">{number}. {title}</h2>
  </div>
);

const InfoGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="no-cut">
    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
    <p className="text-sm font-semibold text-gray-900">{value || '-'}</p>
  </div>
);

const PhaseBlock: React.FC<{ phase: OperationPhase }> = ({ phase }) => (
  <div className="bg-white shadow-md shadow-gray-900/5 border border-gray-200 rounded-xl mb-4 text-[11px] no-cut overflow-hidden">
    <div className="border-l-4 border-blue-500 p-4">
        <h4 className="font-bold text-sm mb-2 text-gray-800">{phase.title}</h4>
        <div className="space-y-1 text-gray-700">
          <p><strong>• Contexte :</strong> {phase.context}</p>
          <p><strong>• Action :</strong> {phase.action}</p>
          {phase.constat && <p><strong>• Constat :</strong> {phase.constat}</p>}
          {phase.constatsList && phase.constatsList.length > 0 && (
            <div>
              <p><strong>• Constats :</strong></p>
              <ul className="list-disc list-inside pl-4">
                {phase.constatsList.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </div>
    </div>
  </div>
);

const AvisTechniqueBlock: React.FC<{ avis: ReportData['avisTechnique'] }> = ({ avis }) => (
  <div className="bg-orange-50 border border-orange-200 shadow-md shadow-orange-900/10 rounded-xl text-[11px] no-cut overflow-hidden mb-6">
     <div className="border-l-4 border-orange-500 p-5">
        <h3 className="font-black text-orange-800 text-sm mb-3 flex items-center uppercase tracking-wide">
          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
          {avis.title}
        </h3>
        <div className="space-y-2 text-orange-900/80">
          <div className="no-cut">
            <strong>Description :</strong>
            <div 
              className="mt-1 prose prose-sm max-w-none text-orange-900/80"
              dangerouslySetInnerHTML={{ __html: avis.description }}
            />
          </div>
          <p className="no-cut"><strong>Diagnostic Final :</strong> {avis.diagnosticFinal}</p>
          <p className="no-cut"><strong>Recommandation :</strong> {avis.recommandation}</p>
        </div>
     </div>
  </div>
);

const DiagnosticBadge: React.FC<{ diagnostic: 'FONCTIONNEL' | 'À REMPLACER' | 'OBSERVATION' }> = ({ diagnostic }) => {
  const styles = {
    'FONCTIONNEL': 'bg-green-100 text-green-800 border-green-200',
    'À REMPLACER': 'bg-red-100 text-red-800 border-red-200',
    'OBSERVATION': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };
  return (
    <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border ${styles[diagnostic]}`}>{diagnostic.replace('_', ' ')}</span>
  );
};


// --- Main Preview Component ---

interface ReportPreviewProps {
  data: ReportData;
  company: CompanyInfo;
  onUpdate: (data: Partial<ReportData>) => void;
  isGeneratingPdf: boolean;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ data, company, onUpdate, isGeneratingPdf }) => {
  const [paginatedReport, setPaginatedReport] = useState<React.ReactNode[][] | null>(null);

  const ReportHeader = () => (
    <header className="flex justify-between items-start pb-8 border-b-2 border-gray-200 mb-8">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-[#004a99]">{company.name}</h1>
        <p className="text-sm text-gray-600 font-medium">{company.address}</p>
      </div>
      <div className="text-right">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt="Logo" className="max-h-16 max-w-[200px] object-contain mb-2 ml-auto" />
        ) : (
          <div className="w-32 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 font-bold mb-2">Logo</div>
        )}
        <p className="text-xs text-gray-500">{company.phone}</p>
        <p className="text-xs text-gray-500">{company.email}</p>
      </div>
    </header>
  );

  const ReportFooter = ({ pageNumber = 1, totalPages = 1 }: { pageNumber?: number, totalPages?: number }) => (
    <footer className="text-center text-[8px] text-gray-400 border-t pt-3 mt-auto">
      <p>{company.name} - Rapport d'intervention ID: {data.id} - Page {pageNumber}{totalPages > 1 ? ` sur ${totalPages}`: ''}</p>
    </footer>
  );
  
  const handleSignatureSave = (key: 'signatureClient' | 'signatureTechnicien', value: string) => {
    onUpdate({ [key]: value });
  };

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const reportSections = useMemo(() => [
    <SectionCard key="info">
      <SectionTitle number="1" title="Informations Chantier" />
      <InfoGrid>
        <InfoItem label="Client" value={data.client} />
        <InfoItem label="Chantier" value={data.chantier} />
        <InfoItem label="Adresse" value={data.adresse} />
        <InfoItem label="Date" value={data.date} />
        <InfoItem label="Intervenant" value={data.intervenant} />
        <InfoItem label="Objet de l'intervention" value={data.objet} />
      </InfoGrid>
    </SectionCard>,

    <SectionCard key="loc-access">
      <SectionTitle number="2" title="Localisation et Accès" />
      <div className="text-[11px] text-gray-800 space-y-3">
        <div className="no-cut"><h4 className="font-bold mb-1">Zone d'intervention :</h4><p>{data.zoneIntervention}</p></div>
        <div className="no-cut"><h4 className="font-bold mb-1">Configuration du réseau :</h4><p>{data.configuration}</p></div>
      </div>
    </SectionCard>,

    <SectionCard key="ops-summary">
      <SectionTitle number="3" title="Résumé des Opérations" /><PhaseBlock phase={data.phase1} /><PhaseBlock phase={data.phase2} />
    </SectionCard>,

    <AvisTechniqueBlock key="avis" avis={data.avisTechnique} />,

    <SectionCard key="analysis">
      <SectionTitle number="4" title="Analyse Détaillée" />
      <div className="overflow-x-auto"><table className="w-full text-[10px] border-collapse"><thead><tr className="bg-gray-100"><th className="p-3 text-left font-bold uppercase text-gray-600 tracking-wider border-b-2 border-gray-200">Défaut Détecté</th><th className="p-3 text-left font-bold uppercase text-gray-600 tracking-wider border-b-2 border-gray-200">Localisation</th><th className="p-3 text-left font-bold uppercase text-gray-600 tracking-wider border-b-2 border-gray-200">Description</th><th className="p-3 text-center font-bold uppercase text-gray-600 tracking-wider border-b-2 border-gray-200">Diagnostic</th></tr></thead><tbody>{data.investigations.map((row) => (<tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50"><td className="p-3 font-semibold text-gray-800 align-top">{row.defect}</td><td className="p-3 text-gray-600 align-top">{row.location}</td><td className="p-3 text-gray-600 align-top">{row.description}</td><td className="p-3 text-center align-middle"><DiagnosticBadge diagnostic={row.diagnostic} /></td></tr>))}</tbody></table></div>
    </SectionCard>,

    <SectionCard key="preconisations">
      <SectionTitle number="5" title="Préconisations de Travaux" /><div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px]"><div><h4 className="font-bold text-blue-700 mb-2">A. Travaux de Rectification</h4><ul className="list-disc list-inside space-y-1 text-gray-700">{data.preconisations.rectification.map((item, i) => <li key={i} className="no-cut">{item}</li>)}</ul></div><div><h4 className="font-bold text-blue-700 mb-2">B. Maintenance & Entretien</h4><ul className="list-disc list-inside space-y-1 text-gray-700">{data.preconisations.maintenance.map((item, i) => <li key={i} className="no-cut">{item}</li>)}</ul></div></div>
    </SectionCard>,
    
    <SectionCard key="lexicon">
      <SectionTitle number="6" title="Lexique Technique" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {TECHNICAL_TERMS.map((term, i) => (
          <div key={i} className="text-[9px] no-cut">
            <span className="font-black text-blue-800 uppercase block mb-1">{term.term}</span>
            <span className="text-gray-600 leading-tight">{term.definition}</span>
          </div>
        ))}
      </div>
    </SectionCard>,

    <SectionCard key="garantie">
      <div className="text-[11px] text-gray-800 no-cut"><p><strong>Garantie : </strong>{data.garantie ? 'Les travaux sont couverts par notre garantie standard.' : "L'intervention de débouchage ne peut être garantie en raison des défauts structurels identifiés. La garantie s'appliquera après réalisation des travaux de rectification recommandés."}</p></div>
    </SectionCard>,

    <SectionCard key="google-review" className="!bg-blue-50 !border-blue-200">
      <div className="flex items-center justify-between">
        <div className="pr-4">
          <h3 className="text-sm font-black text-blue-800 uppercase mb-1 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Votre avis compte !
          </h3>
          <p className="text-[10px] text-blue-900/80 leading-tight">
            Satisfait de notre intervention ? Laissez-nous un avis sur Google en scannant le QR code ci-contre. Votre retour est précieux pour nous aider à améliorer nos services.
          </p>
        </div>
        {company.googleReviewUrl ? (
          <div className="bg-white p-1.5 rounded-lg shadow-sm shrink-0">
            <QRCodeCanvas value={company.googleReviewUrl} size={60} />
          </div>
        ) : (
          <div className="bg-white/50 p-2 rounded-lg border border-blue-100/50 shrink-0 text-[8px] text-blue-400 text-center w-[60px] h-[60px] flex items-center justify-center">
            Lien non<br/>configuré
          </div>
        )}
      </div>
    </SectionCard>,

    <SectionCard key="signatures">
      <div className="grid grid-cols-2 gap-8"><SignaturePad label="Signature Client" onSave={(val) => handleSignatureSave('signatureClient', val)} initialValue={data.signatureClient} /><SignaturePad label="Signature Technicien" onSave={(val) => handleSignatureSave('signatureTechnicien', val)} initialValue={data.signatureTechnicien} /></div>
    </SectionCard>,
  ], [data, company]);

  useEffect(() => {
    if (isGeneratingPdf) {
      const PAGE_CONTENT_HEIGHT_PX = 850; // Approx content height in pixels for an A4 page (297mm - margins - header/footer)
      const pages: React.ReactNode[][] = [];
      let currentPageContent: React.ReactNode[] = [];
      let currentPageHeight = 0;

      sectionRefs.current.forEach((sectionEl, index) => {
        if (!sectionEl) return;
        const sectionHeight = sectionEl.offsetHeight;
        if (currentPageHeight + sectionHeight > PAGE_CONTENT_HEIGHT_PX && currentPageContent.length > 0) {
          pages.push(currentPageContent);
          currentPageContent = [];
          currentPageHeight = 0;
        }
        currentPageContent.push(reportSections[index]);
        currentPageHeight += sectionHeight;
      });

      if (currentPageContent.length > 0) {
        pages.push(currentPageContent);
      }
      setPaginatedReport(pages);
    } else {
      setPaginatedReport(null);
    }
  }, [isGeneratingPdf, reportSections]);

  const EstimatePage = () => {
    const totalPages = (paginatedReport?.length || 0) + (data.estimate.lineItems.length > 0 ? 1 : 0);
    const currentPage = (paginatedReport?.length || 0) + 1;
    return (
      <div className="page-a4 font-body mt-5">
        <ReportHeader />
        <main className="flex-grow">
          <div className="text-center mb-10"><h2 className="font-heading text-2xl font-extrabold text-gray-800">DEVIS ESTIMATIF</h2><p className="text-sm text-gray-500">Référence du dossier : {data.id}</p></div>
          <SectionCard><InfoGrid><InfoItem label="Client" value={data.client} /><InfoItem label="Chantier" value={data.chantier} /><InfoItem label="Adresse" value={data.adresse} /><InfoItem label="Date du devis" value={data.date} /></InfoGrid></SectionCard>
          <table className="w-full text-sm mb-8 no-cut"><thead className="bg-gray-100"><tr><th className="p-3 text-left font-bold text-gray-600 uppercase tracking-wider text-[10px]">Description</th><th className="p-3 w-24 text-center font-bold text-gray-600 uppercase tracking-wider text-[10px]">Qté</th><th className="p-3 w-32 text-right font-bold text-gray-600 uppercase tracking-wider text-[10px]">P.U. HT</th><th className="p-3 w-32 text-right font-bold text-gray-600 uppercase tracking-wider text-[10px]">Total HT</th></tr></thead><tbody>{data.estimate.lineItems.map(item => (<tr key={item.id} className="border-b border-gray-100 text-gray-800"><td className="p-3 align-top">{item.description}</td><td className="p-3 text-center align-top">{item.quantity}</td><td className="p-3 text-right align-top">{item.unitPrice.toFixed(2)} €</td><td className="p-3 text-right align-top font-semibold">{item.total.toFixed(2)} €</td></tr>))}</tbody></table>
          <div className="flex justify-end no-cut"><div className="w-full max-w-sm"><div className="flex justify-between py-2 border-b text-gray-800"><span className="font-semibold">SOUS-TOTAL HT</span><span>{data.estimate.subtotal.toFixed(2)} €</span></div><div className="flex justify-between py-2 border-b text-gray-800"><span className="font-semibold">TVA ({data.estimate.vatRate}%)</span><span>{data.estimate.vatAmount.toFixed(2)} €</span></div><div className="flex justify-between py-3 bg-gray-100 px-4 rounded-lg mt-2 text-gray-900"><span className="font-black text-lg">TOTAL TTC</span><span className="font-black text-lg">{data.estimate.total.toFixed(2)} €</span></div></div></div>
          <div className="text-[9px] text-gray-500 mt-12 no-cut"><p className="no-cut"><strong>Validité de l'offre :</strong> {data.estimate.validity}</p><p className="no-cut"><strong>Conditions de paiement :</strong> {data.estimate.paymentConditions}</p></div>
        </main>
        <ReportFooter pageNumber={currentPage} totalPages={totalPages} />
      </div>
    );
  };

  return (
    <div id="report-container" className={`${isGeneratingPdf ? 'pdf-render' : ''}`}>
      {!paginatedReport ? (
        // Render for screen view and for measuring
        <div className="page-a4 font-body">
          <ReportHeader />
          <main className="flex-grow">
            {reportSections.map((section, index) => (
              <div key={index} ref={el => { sectionRefs.current[index] = el; }}>
                {section}
              </div>
            ))}
          </main>
          <ReportFooter totalPages={data.estimate.lineItems.length > 0 ? 2 : 1} />
        </div>
      ) : (
        // Render paginated report for PDF generation
        paginatedReport.map((pageContent, index) => (
          <div key={index} className="page-a4 font-body">
            <ReportHeader />
            <main className="flex-grow">
              {pageContent}
            </main>
            <ReportFooter pageNumber={index + 1} totalPages={paginatedReport.length + (data.estimate.lineItems.length > 0 ? 1 : 0)} />
          </div>
        ))
      )}

      {data.estimate.lineItems.length > 0 && <EstimatePage />}
    </div>
  );
};

export default ReportPreview;