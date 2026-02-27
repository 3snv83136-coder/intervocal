
import React, { useEffect, useCallback } from 'react';
import { EstimateData, EstimateLineItem } from '../types';

interface EstimateFormProps {
  estimate: EstimateData;
  onUpdate: (data: EstimateData) => void;
}

const Input: React.FC<{ label: string; name: string; type?: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string, placeholder?: string }> = 
  ({ label, name, value, onChange, type = 'text', className = '', placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <input name={name} value={value} onChange={onChange} type={type} placeholder={placeholder} className={`bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800 ${className}`} />
  </div>
);

const PREDEFINED_SERVICES = [
  'Curage complet du réseau',
  'Inspection caméra des canalisations',
  'Débouchage manuel',
  'Hydrocurage haute pression',
  'Remplacement de section de canalisation',
  'Création de regard de visite'
];

const EstimateForm: React.FC<EstimateFormProps> = ({ estimate, onUpdate }) => {

  const calculateTotals = useCallback((lineItems: EstimateLineItem[], vatRate: number): Partial<EstimateData> => {
    const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;
    return { subtotal, vatAmount, total };
  }, []);

  const updateEstimate = (updates: Partial<EstimateData>) => {
    const updatedEstimate = { ...estimate, ...updates };
    onUpdate(updatedEstimate);
  };
  
  useEffect(() => {
      const { subtotal, vatAmount, total } = calculateTotals(estimate.lineItems, estimate.vatRate);
      if(subtotal !== estimate.subtotal || vatAmount !== estimate.vatAmount || total !== estimate.total) {
          updateEstimate({ subtotal, vatAmount, total });
      }
  }, [estimate.lineItems, estimate.vatRate, calculateTotals]);


  const handleLineItemChange = (id: string, field: keyof EstimateLineItem, value: string | number) => {
    const updatedItems = estimate.lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const quantity = field === 'quantity' ? Number(value) : item.quantity;
          const unitPrice = field === 'unitPrice' ? Number(value) : item.unitPrice;
          updatedItem.total = quantity * unitPrice;
        }
        return updatedItem;
      }
      return item;
    });
    updateEstimate({ lineItems: updatedItems });
  };
  
  const addLineItem = () => {
    const newItem: EstimateLineItem = { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, total: 0 };
    updateEstimate({ lineItems: [...estimate.lineItems, newItem] });
  };

  const removeLineItem = (id: string) => {
    updateEstimate({ lineItems: estimate.lineItems.filter(item => item.id !== id) });
  };
  
  const handleVatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVatRate = Number(e.target.value) || 0;
      const { subtotal, vatAmount, total } = calculateTotals(estimate.lineItems, newVatRate);
      updateEstimate({ vatRate: newVatRate, subtotal, vatAmount, total });
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h3 className="text-sm font-heading font-bold text-[#004a99] uppercase tracking-wider mb-3">Lignes du Devis</h3>
        <div className="space-y-4">
          {estimate.lineItems.map((item) => {
            const isCustomDescription = !PREDEFINED_SERVICES.includes(item.description);
            return (
              <div key={item.id} className="bg-white border border-slate-200 p-4 rounded-lg relative group">
                <button onClick={() => removeLineItem(item.id)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                    <select
                      value={isCustomDescription ? 'custom' : item.description}
                      onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value === 'custom' ? '' : e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                    >
                      <option value="">-- Sélectionner une prestation --</option>
                      {PREDEFINED_SERVICES.map(service => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                      <option value="custom">Autre...</option>
                    </select>
                    {isCustomDescription && (
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                        placeholder="Description personnalisée"
                        className="mt-2 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Quantité" name="quantity" type="number" value={item.quantity} onChange={(e) => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                    <Input label="Prix Unitaire HT" name="unitPrice" type="number" value={item.unitPrice} onChange={(e) => handleLineItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="text-right text-xs font-bold text-slate-600">
                    Total Ligne HT: {item.total.toFixed(2)} €
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={addLineItem} className="w-full mt-4 bg-blue-100 text-blue-800 text-xs font-black py-2.5 rounded-lg uppercase tracking-wider hover:bg-blue-200 transition-colors">+ Ajouter une ligne</button>
      </div>

      <div>
        <h3 className="text-sm font-heading font-bold text-[#004a99] uppercase tracking-wider mb-3">Totaux & Conditions</h3>
         <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-4">
             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-3 rounded-lg text-center">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SOUS-TOTAL HT</p>
                     <p className="font-black text-lg text-slate-800">{estimate.subtotal.toFixed(2)} €</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-lg text-center">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">MONTANT TVA</p>
                     <p className="font-black text-lg text-slate-800">{estimate.vatAmount.toFixed(2)} €</p>
                 </div>
             </div>
             <div className="bg-[#004a99] p-4 rounded-lg text-center">
                 <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">TOTAL TTC</p>
                 <p className="font-black text-2xl text-white">{estimate.total.toFixed(2)} €</p>
             </div>
            <Input label="Taux de TVA (%)" name="vatRate" type="number" value={estimate.vatRate} onChange={handleVatChange} />
            <Input label="Validité de l'offre" name="validity" value={estimate.validity} onChange={(e) => updateEstimate({ validity: e.target.value })} />
            <Input label="Conditions de paiement" name="paymentConditions" value={estimate.paymentConditions} onChange={(e) => updateEstimate({ paymentConditions: e.target.value })} />
         </div>
      </div>
    </div>
  );
};

export default EstimateForm;
