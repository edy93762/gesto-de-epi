import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const generateSafetyInstructions = async (ppeNames: string[]): Promise<string> => {
  try {
    // Utilizando o modelo gemini-1.5-flash como padrão eficiente
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const namesList = ppeNames.join(", ");
    const prompt = `
      Crie instruções concisas e diretas de segurança para o uso conjunto dos seguintes EPIs: ${namesList}.
      Formate a resposta estritamente em texto puro (sem markdown como ** ou ##), dividida em dois parágrafos curtos:
      1. Como usar corretamente estes itens.
      2. Como conservar e quando descartar.
      Seja profissional e técnico, focado em segurança do trabalho no Brasil (Norma NR-6).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "Instruções de segurança padrão: Utilize o equipamento conforme treinamento e substitua em caso de danos.";
  } catch (error) {
    console.error("Erro ao gerar instruções com Gemini:", error);
    return "Nota: Verifique o manual do fabricante para instruções detalhadas de segurança.";
  }
};