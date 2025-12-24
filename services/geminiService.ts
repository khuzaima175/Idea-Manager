import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Idea } from "../types";
import { blobToBase64 } from "../utils/audioUtils";

const TEXT_MODEL = "gemini-3-flash-preview";
const IMAGE_MODEL = "gemini-2.5-flash-image";

export const processAudioIdea = async (
  audioBlob: Blob,
  onProgress?: (msg: string) => void
): Promise<Omit<Idea, 'id' | 'createdAt' | 'isFavorite'>> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing. Please set GEMINI_API_KEY in .env.local");

  // Use the specific initialization pattern from the working version
  const ai = new (GoogleGenAI as any)({ apiKey });

  onProgress?.("Transcribing & Extracting Insight...");
  const base64Audio = await blobToBase64(audioBlob);
  const mimeType = audioBlob.type || 'audio/webm';

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Audio } },
        { text: "Analyze this voice note and return a structured JSON object. Include: title, transcript, summary, actionItems, tags, category (Work/Personal/Creative/Other), and an imagePrompt." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          transcript: { type: Type.STRING },
          summary: { type: Type.STRING },
          actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          category: { type: Type.STRING, enum: ['Work', 'Personal', 'Creative', 'Other'] },
          imagePrompt: { type: Type.STRING }
        },
        required: ['title', 'transcript', 'summary', 'actionItems', 'tags', 'category', 'imagePrompt']
      }
    }
  });

  const analysis = JSON.parse(response.text || '{}');

  onProgress?.("Generating Visual Identity...");
  let imageUrl = undefined;
  try {
    const imageResp = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts: [{ text: `Minimalist, cinematic, abstract 3D art representating: ${analysis.imagePrompt}. Dark theme, glowing accents.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    console.log("Image Generation Response:", imageResp);

    const imgPart = imageResp.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
    if (imgPart?.inlineData) {
      imageUrl = `data:image/png;base64,${imgPart.inlineData.data}`;
    }
  } catch (e: any) {
    if (e.message?.includes('429') || e.status === 429) {
      console.error("IMAGE GENERATION FAILED (429): Quota Exceeded.");
      console.info("NOTE: Models like 'gemini-2.5-flash-image' often have restricted quotas (often 0) for external API keys compared to the managed AI Studio environment.");
      console.info("This is why it works in the AI Studio App Maker but fails here. You may need to wait for public availability or check your tier.");
    } else {
      console.warn("Image generation failed", e);
    }
  }

  return { ...analysis, imageUrl };
};

export const createIdeaChat = (idea: Idea): Chat => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new (GoogleGenAI as any)({ apiKey });
  return ai.chats.create({
    model: TEXT_MODEL,
    config: {
      systemInstruction: `You are an expert brainstorming partner. You are helping the user with their idea: "${idea.title}". 
      Context: ${idea.summary}. 
      Transcript: ${idea.transcript}. 
      Help them expand on this, find flaws, or suggest tools. Keep responses concise and inspiring.`,
    }
  });
};