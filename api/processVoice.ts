import { GoogleGenAI, Type } from "@google/genai";

const VOICE_PROMPT = `Tu es un expert en débouchage de canalisations. Analyse cet enregistrement d'une intervention.

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

IMPORTANT : Ne te soucie pas du texte existant, base-toi uniquement sur cet audio pour générer un nouveau rapport complet.`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  try {
    let body: { base64Audio?: string };
    if (req.body && typeof req.body === "object" && "base64Audio" in req.body) {
      body = req.body as { base64Audio?: string };
    } else {
      const chunks: Uint8Array[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const bodyString = Buffer.concat(chunks).toString("utf8") || "{}";
      body = JSON.parse(bodyString);
    }

    const base64Audio = body?.base64Audio;
    if (!base64Audio) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Missing base64Audio" }));
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }));
    }

    const ai = new GoogleGenAI({ apiKey });
    // Modèles supportés pour generateContent + audio (v1beta) : éviter gemini-1.5-pro (404)
    const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b"];
    let lastError: unknown;
    let response: { text?: string } | undefined;

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "audio/webm",
                data: base64Audio,
              },
            },
            {
              text: VOICE_PROMPT,
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
              required: ["title", "context", "action", "constat"],
            },
            phase2: {
              type: Type.OBJECT,
              properties: { title: { type: Type.STRING }, context: { type: Type.STRING }, action: { type: Type.STRING }, constatsList: { type: Type.ARRAY, items: { type: Type.STRING } } },
              required: ["title", "context", "action", "constatsList"],
            },
            avisTechnique: {
              type: Type.OBJECT,
              properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, diagnosticFinal: { type: Type.STRING }, recommandation: { type: Type.STRING } },
              required: ["title", "description", "diagnosticFinal", "recommandation"],
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
                required: ["id", "defect", "location", "description", "diagnostic"],
              },
            },
            preconisations: {
              type: Type.OBJECT,
              properties: { rectification: { type: Type.ARRAY, items: { type: Type.STRING } }, maintenance: { type: Type.ARRAY, items: { type: Type.STRING } } },
              required: ["rectification", "maintenance"],
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
                      id: { type: Type.STRING },
                      description: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                      unitPrice: { type: Type.NUMBER },
                      total: { type: Type.NUMBER },
                    },
                    required: ["id", "description", "quantity", "unitPrice", "total"],
                  },
                },
              },
              required: ["lineItems"],
            },
          },
          required: ["rawTranscription", "client", "adresse", "typeIntervention", "investigations", "avisTechnique", "phase1", "phase2", "preconisations", "garantie", "estimate"],
            },
          },
        });
        break;
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (!response) {
      throw lastError ?? new Error("Aucun modèle Gemini n'a répondu.");
    }

    const textOutput = (response as any).text || "{}";
    const generatedData = JSON.parse(textOutput);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify(generatedData));
  } catch (error: any) {
    console.error("Erreur processVoice API:", error);
    const message =
      process.env.GEMINI_API_KEY
        ? (error?.message || String(error)) || "Le traitement vocal a échoué."
        : "Clé API manquante : ajoutez GEMINI_API_KEY dans les variables d'environnement Vercel (Production et Preview).";
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: message }));
  }
}
