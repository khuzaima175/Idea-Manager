import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Idea } from "../types";
import { blobToBase64 } from "../utils/audioUtils";

// Primary and fallback models
const TEXT_MODEL_PRIMARY = "gemini-3-flash-preview";
const TEXT_MODEL_FALLBACK = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";

// Helper to generate content with automatic fallback
const generateWithFallback = async (
  ai: GoogleGenAI,
  config: any,
  onFallback?: () => void
): Promise<any> => {
  try {
    // Try primary model first
    return await ai.models.generateContent({
      ...config,
      model: TEXT_MODEL_PRIMARY,
    });
  } catch (error: any) {
    console.warn(`Primary model (${TEXT_MODEL_PRIMARY}) failed:`, error.message || error);

    // Check if it's a quota/rate limit error or any error - fallback regardless
    console.log(`Falling back to ${TEXT_MODEL_FALLBACK}...`);
    onFallback?.();

    return await ai.models.generateContent({
      ...config,
      model: TEXT_MODEL_FALLBACK,
    });
  }
};

export const processAudioIdea = async (
  audioBlob: Blob,
  onProgress?: (msg: string) => void,
  shouldGenerateImage: boolean = true
): Promise<Omit<Idea, 'id' | 'createdAt' | 'isFavorite'>> => {
  if (!process.env.API_KEY) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  onProgress?.("Transcribing & Extracting Insight...");
  const base64Audio = await blobToBase64(audioBlob);
  const mimeType = audioBlob.type || 'audio/webm';

  const response = await generateWithFallback(
    ai,
    {
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
    },
    () => onProgress?.("Retrying with backup model...")
  );

  // Robust JSON parsing: clean potential markdown code blocks
  let jsonStr = response.text || '{}';
  jsonStr = jsonStr.replace(/^```json\n|\n```$/g, '').trim();

  let analysis;
  try {
    analysis = JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON Parsing failed", e);
    // Fallback or re-throw depending on desired UX
    analysis = {
      title: "Untitled Idea",
      transcript: "Could not parse transcript.",
      summary: "AI response format error.",
      actionItems: [],
      tags: [],
      category: "Other",
      imagePrompt: "abstract error concept"
    };
  }

  let imageUrl = undefined;

  // ONLY generate image if the flag is true
  if (shouldGenerateImage) {
    onProgress?.("Generating Visual Identity...");
    try {
      const imageResp = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: { parts: [{ text: `Minimalist, cinematic, abstract 3D art representating: ${analysis.imagePrompt}. Dark theme, glowing accents.` }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      const imgPart = imageResp.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imgPart?.inlineData) {
        imageUrl = `data:image/png;base64,${imgPart.inlineData.data}`;
      }
    } catch (e) {
      console.warn("Image generation failed", e);
      // We fail silently here so the user still gets their text data
    }
  }

  return { ...analysis, imageUrl };
};

// NEW: Process text-based idea input
export const processTextIdea = async (
  inputText: string,
  onProgress?: (msg: string) => void,
  shouldGenerateImage: boolean = true
): Promise<Omit<Idea, 'id' | 'createdAt' | 'isFavorite'>> => {
  if (!process.env.API_KEY) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  onProgress?.("Analyzing your idea...");

  const response = await generateWithFallback(
    ai,
    {
      contents: {
        parts: [
          { text: `Analyze this idea and return a structured JSON object. The user wrote: "${inputText}". Include: title (creative and punchy), transcript (the original input), summary (a rich 2-3 sentence summary), actionItems (3-5 next steps), tags (3-5 relevant keywords), category (Work/Personal/Creative/Other), and an imagePrompt (for generating abstract art).` }
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
    },
    () => onProgress?.("Retrying with backup model...")
  );

  let jsonStr = response.text || '{}';
  jsonStr = jsonStr.replace(/^```json\n|\n```$/g, '').trim();

  let analysis;
  try {
    analysis = JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON Parsing failed", e);
    analysis = {
      title: "Untitled Idea",
      transcript: inputText,
      summary: "Could not analyze the idea.",
      actionItems: [],
      tags: [],
      category: "Other",
      imagePrompt: "abstract concept"
    };
  }

  let imageUrl = undefined;

  if (shouldGenerateImage) {
    onProgress?.("Generating Visual Identity...");
    try {
      const imageResp = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: { parts: [{ text: `Minimalist, cinematic, abstract 3D art representating: ${analysis.imagePrompt}. Dark theme, glowing accents.` }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      const imgPart = imageResp.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imgPart?.inlineData) {
        imageUrl = `data:image/png;base64,${imgPart.inlineData.data}`;
      }
    } catch (e) {
      console.warn("Image generation failed", e);
    }
  }

  return { ...analysis, imageUrl };
};

export const expandIdea = async (idea: Idea): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `You are an expert strategic consultant and creative muse. 
  Perform a "Deep Dive" expansion on this idea.
  
  Title: ${idea.title}
  Category: ${idea.category}
  Summary: ${idea.summary}
  Transcript: ${idea.transcript}

  Instructions:
  1. If Category is 'Work' or 'Personal': Provide a Strategic Roadmap with 3 phases and a "Potential Pitfalls" section.
  2. If Category is 'Creative': Provide 3 "Alternative Variations" or "Sequel Ideas" and a "Mood/Tone" analysis.
  3. If Category is 'Other': Connect this to a broader global trend and suggest a reading topic.
  
  Format: Return PLAIN TEXT with clear UPPERCASE HEADERS (e.g., PHASE 1: INITIATION). Do not use markdown symbols like ** or ##.`;

  const result = await generateWithFallback(ai, { contents: prompt });

  return result.text || "Could not generate expansion.";
};

export const createIdeaChat = (idea: Idea): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: TEXT_MODEL_PRIMARY, // Chat uses primary model (fallback handled per-request)
    config: {
      systemInstruction: `You are an expert brainstorming partner. You are helping the user with their idea: "${idea.title}". 
      Context: ${idea.summary}. 
      Transcript: ${idea.transcript}. 
      Help them expand on this, find flaws, or suggest tools. Keep responses concise and inspiring.`,
    }
  });
};