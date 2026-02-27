

import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: base64Audio,
                },
              },
              {
                text: `Tu es un expert en débouchage de canalisations. Analyse cet enregistrement d'une intervention.
                
                TA MISSION :
                1. TRANSCRIPTION : Transcris fidèlement et intégralement tout ce qui est dit dans l'audio.
                2. COMPILATION : Extrais les informations pour remplir le rapport structuré ci-dessous.
                
                CONSIGNES DE COMPILATION :
                - Identifie le client, l'adresse et le type d'intervention.
                - Détaille la Phase 1 (Débouchage) et la Phase 2 (Inspection).
                - Pour chaque anomalie citée (ex: coudes à 90°, racines, cassure), crée une entrée dans 'investigations'.
                - Identifie si l'intervention est sous garantie.
                - Si des réparations sont nécessaires, génère des lignes de devis claires dans l'objet 'estimate'.
                - Utilise un ton technique et professionnel pour les champs structurés.
                
                IMPORTANT : Ne te soucie pas du texte existant, base-toi uniquement sur cet audio pour générer un nouveau rapport complet.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rawTranscription: { type: Type.STRING, description: "La transcription intégrale de l'audio" },
              client: { type: Type.STRING },
              chantier: { type: Type.STRING },
              adresse: { type: Type.STRING },
              date: { type: Type.STRING, description: "Date formatée en français" },
              typeIntervention: { type: Type.STRING, enum: ["Dépannage", "Curage", "Inspection", "Maintenance", "Raccordement", "Autre"] },
              intervenant: { type: Type.STRING },
              objet: { type: Type.STRING },
              zoneIntervention: { type: Type.STRING },
              configuration: { type: Type.STRING },
              phase1: {
                type: Type.OBJECT,
                properties: { title: { type: Type.STRING }, context: { type: Type.STRING }, action: { type: Type.STRING }, constat: { type: Type.STRING } },
                required: ["title", "context", "action", "constat"]
              },
              phase2: {
                type: Type.OBJECT,
                properties: { title: { type: Type.STRING }, context: { type: Type.STRING }, action: { type: Type.STRING }, constatsList: { type: Type.ARRAY, items: { type: Type.STRING } } },
                required: ["title", "context", "action", "constatsList"]
              },
              avisTechnique: {
                type: Type.OBJECT,
                properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, diagnosticFinal: { type: Type.STRING }, recommandation: { type: Type.STRING } },
                required: ["title", "description", "diagnosticFinal", "recommandation"]
              },
              investigations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    defect: { type: Type.STRING },
                    location: { type: Type.STRING },
                    description: { type: Type.STRING },
                    diagnostic: { type: Type.STRING, enum: ["FONCTIONNEL", "À REMPLACER", "OBSERVATION"] },
                  },
                  required: ["id", "defect", "location", "description", "diagnostic"]
                }
              },
              preconisations: {
                type: Type.OBJECT,
                properties: { rectification: { type: Type.ARRAY, items: { type: Type.STRING } }, maintenance: { type: Type.ARRAY, items: { type: Type.STRING } } },
                required: ["rectification", "maintenance"]
              },
              garantie: { type: Type.BOOLEAN },
              estimate: {
                type: Type.OBJECT,
                properties: {
                  lineItems: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING }, description: { type: Type.STRING }, quantity: { type: Type.NUMBER }, unitPrice: { type: Type.NUMBER }, total: { type: Type.NUMBER }
                      },
                      required: ["id", "description", "quantity", "unitPrice", "total"]
                    }
                  }
                },
                required: ["lineItems"]
              }
            },
            required: ["rawTranscription", "client", "adresse", "typeIntervention", "investigations", "avisTechnique", "phase1", "phase2", "preconisations", "garantie", "estimate"]
          }
        }
      });

      const textOutput = response.text || "{}";
      const generatedData = JSON.parse(textOutput);
      
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
    } catch (err) {
      console.error("Erreur de traitement AI:", err);
      alert("Le traitement vocal a échoué. Assurez-vous de bien décrire les étapes de l'intervention.");
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
