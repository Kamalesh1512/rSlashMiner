import OpenAI from "openai";


export const openai = new OpenAI({
    apiKey: process.env.NEXT_OPENAI_API_KEY!,
  });
  