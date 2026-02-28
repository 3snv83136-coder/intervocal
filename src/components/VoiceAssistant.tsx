

import React, { useState, useRef } from 'react';
import { ReportData, EstimateData } from '../types';

interface VoiceAssistantProps {
  onDataGenerated: (data: ReportData) => void;
  onProcessingStateChange: (isProcessing: boolean) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onDataGenerated, onProcessingStateChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erreur d'accès au micro:", err);
      alert("Impossible d'accéder au microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processAudio = async (audioBlob: Blob) => {
    onProcessingStateChange(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const response = await fetch('/api/processVoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Audio }),
      });

      if (!response.ok) {
        const text = await response.text();
        let msg = 'Le traitement vocal a échoué.';
        try {
          const errBody = JSON.parse(text) as { error?: string };
          if (errBody?.error) msg = errBody.error;
        } catch {
          if (response.status === 404) msg = 'Route API introuvable. Vérifiez le déploiement.';
          else if (response.status >= 500) msg = 'Erreur serveur. Vérifiez que GEMINI_API_KEY est définie sur Vercel.';
        }
        throw new Error(msg);
      }

      const generatedData = await response.json();
      
      if (generatedData.investigations) {
        generatedData.investigations = generatedData.investigations.map((inv: any, idx: number) => ({ ...inv, id: String(Date.now() + idx) }));
      }

      const defaultEstimate: EstimateData = { lineItems: [], subtotal: 0, vatRate: 20, vatAmount: 0, total: 0, validity: "1 mois", paymentConditions: "Acompte de 30% à la commande" };
      if (generatedData.estimate && generatedData.estimate.lineItems) {
        let subtotal = 0;
        generatedData.estimate.lineItems = generatedData.estimate.lineItems.map((item: any, idx: number) => {
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unitPrice) || 0;
            const total = quantity * unitPrice;
            subtotal += total;
            return { ...item, id: String(Date.now() + idx), quantity, unitPrice, total };
        });
        const vatRate = 20;
        const vatAmount = subtotal * (vatRate / 100);
        const total = subtotal + vatAmount;
        generatedData.estimate = { ...defaultEstimate, ...generatedData.estimate, subtotal, vatRate, vatAmount, total };
      } else {
        generatedData.estimate = defaultEstimate;
      }

      onDataGenerated(generatedData as ReportData);
    } catch (err: any) {
      console.error("Erreur de traitement AI:", err);
      const msg = err?.message || "Le traitement vocal a échoué. Vérifiez la clé Gemini sur Vercel et réessayez.";
      alert(msg);
    } finally {
      onProcessingStateChange(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {isRecording && (
        <div className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse uppercase tracking-widest shadow-lg">
          Microphone Activé...
        </div>
      )}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] transition-all active:scale-90 ${
          isRecording 
            ? 'bg-red-600 hover:bg-red-700 ring-8 ring-red-100 scale-110' 
            : 'bg-[#0066CC] hover:bg-blue-700 hover:scale-105'
        }`}
      >
        {isRecording ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
        )}
      </button>
      <div className="text-center">
        <span className="text-xs font-extrabold text-[#0066CC] bg-white border border-blue-100 px-3 py-1 rounded-full shadow-sm uppercase tracking-tighter">
          {isRecording ? "Arrêter la dictée" : "Compil & Transcris"}
        </span>
      </div>
    </div>
  );
};

export default VoiceAssistant;
