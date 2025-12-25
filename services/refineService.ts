import { GoogleGenAI } from "@google/genai";
import { Idea } from "../types";

const MODEL_NAME = "gemini-2.0-flash";

export const refineIdea = async (idea: Idea): Promise<Partial<Idea>> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
    Current Idea:
    Title: ${idea.title}
    Summary: ${idea.summary}
    Current Action Items: ${idea.actionItems.join(", ")}
    
    Tasks:
    1. Improve the title to be more punchy and inspiring.
    2. Expand the summary with more depth (add one more paragraph of creative insight).
    3. Add 3 more high-impact action items.
    4. Suggest 2 new relevant tags.

    Return the result in JSON format with fields: title, expandedSummary, additionalActionItems, newTags.
  `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                systemInstruction: "You are an idea catalyst. Your goal is to take an existing idea and expand it, finding hidden connections, potential obstacles, and more creative angles.",
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from Gemini");
        const data = JSON.parse(text);

        return {
            title: data.title,
            summary: data.expandedSummary,
            actionItems: [...idea.actionItems, ...data.additionalActionItems],
            tags: Array.from(new Set([...idea.tags, ...data.newTags]))
        };
    } catch (error) {
        console.error("Refine API Error:", error);
        throw error;
    }
};
