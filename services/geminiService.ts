import { GoogleGenAI } from "@google/genai";

export const generateSafetyInstructions = async (ppeNames: string[]): Promise<string> => {
  try {
    // Initialization with process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Using gemini-2.5-flash for Basic Text Tasks instead of deprecated gemini-1.5-flash
    const model = "gemini-2.5-flash";

    const namesList = ppeNames.join(", ");
    const prompt = `
      Crie instruções concisas e diretas de segurança para o uso conjunto dos seguintes EPIs: ${namesList}.
      Formate a resposta estritamente em texto puro (sem markdown como ** ou ##), dividida em dois parágrafos curtos:
      1. Como usar corretamente estes itens.
      2. Como conservar e quando descartar.
      Seja profissional e técnico, focado em segurança do trabalho no Brasil (Norma NR-6).
    `;

    // Correct usage of generateContent with model name and contents
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    // Correctly accessing .text property
    const text = response.text;

    return text || "Instruções de segurança padrão: Utilize o equipamento conforme treinamento e substitua em caso de danos.";
  } catch (error) {
    console.error("Erro ao gerar instruções com Gemini:", error);
    return "Nota: Verifique o manual do fabricante para instruções detalhadas de segurança.";
  }
};