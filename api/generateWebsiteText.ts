import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  try {
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyString = Buffer.concat(chunks).toString("utf8") || "{}";
    const body = JSON.parse(bodyString);

    const data = body?.data;
    if (!data) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Missing data" }));
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }));
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Rédige un article court et professionnel (environ 150-200 mots) pour la section "Nos Réalisations" du site internet d'une entreprise de débouchage de canalisation. 
Utilise les données suivantes :
- Client : ${data.client}
- Ville : ${data.adresse}
- Problème : ${data.avisTechnique?.description}
- Travaux effectués : ${data.phase1?.action} et ${data.phase2?.action}
- Diagnostic final : ${data.avisTechnique?.diagnosticFinal}
- Conseil : ${data.avisTechnique?.recommandation}

CONSIGNES :
1. Donne un titre accrocheur.
2. Utilise un ton professionnel, rassurant et expert.
3. Optimise pour le SEO avec des mots comme 'débouchage', 'curage', 'inspection caméra', 'problème d'évacuation'.
4. Ne mentionne pas de noms propres de techniciens.
5. Termine par une invitation à contacter l'entreprise.`,
    });

    const text = (response as any).text || "Texte généré par l'IA.";

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ text }));
  } catch (error) {
    console.error("Erreur Gemini API:", error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "La génération du texte a échoué." }));
  }
}

