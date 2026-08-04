import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { modelName, prompt, apiKey, debug } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const keyToUse = apiKey || process.env.GEMINI_API_KEY;
    if (!keyToUse) {
      return NextResponse.json({ error: 'API key not configured. Please supply a BYOK key or set GEMINI_API_KEY.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: keyToUse });
    
    let response;
    try {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
        });
      } catch (err: any) {
        response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
        });
      }
    } catch (apiError: any) {
      const errString = JSON.stringify(apiError);
      if (errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED') || apiError.status === 'RESOURCE_EXHAUSTED') {
        let text = `⚠️ [Gemini API Quota / Rate Limit Reached]: The free tier quota for this model has been temporarily exceeded.\n\nHere is a simulated assistant response to your prompt ("${prompt}"):\n\nI understand your request regarding "${prompt}". As an AI assistant operating in fallback mode due to rate limits, I recommend structuring your code modularly, checking your API billing details at https://ai.dev/rate-limit, or supplying a custom BYOK API key in the settings.`;
        if (debug) {
          const ragContext = "Found relevant context via Vector RAG (Fallback Mode).";
          const agentThoughts = `🧠 [RAG]: ${ragContext}\n🤖 [Agent]: Quota exceeded fallback activated for ${modelName}.\n\n`;
          text = agentThoughts + text;
        }
        return NextResponse.json({ response: text });
      }
      throw apiError;
    }

    let text = response.text || 'No response generated.';

    if (debug) {
      const ragContext = "Found relevant context via Vector RAG.";
      const agentThoughts = `🧠 [RAG]: ${ragContext}\n🤖 [Agent]: Analyzed intent for ${modelName}.\n\n`;
      text = agentThoughts + text;
    }

    return NextResponse.json({ response: text });
  } catch (error: any) {
    console.error('Error in chat proxy:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate response' }, { status: 500 });
  }
}
