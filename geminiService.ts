import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AppType, TextGenerationResult, AspectRatio, ProjectInfo, SceneData, BrandingResult } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

// Shared strict negative prompt for image generation
const STRICT_NEGATIVE_PROMPT = "no text, no writing, no watermark, no logo, no signature, no typography, high quality, photorealistic, 8k, hdr, deformed hands, bad anatomy, close up face, wide shot, full body, standing far away, small figure";

// Townhouse needs full body, so we remove "full body" and "wide shot" from negative prompt
const TOWNHOUSE_NEGATIVE_PROMPT = "no text, no writing, no watermark, no logo, no signature, no typography, high quality, photorealistic, 8k, hdr, deformed hands, bad anatomy, close up face, cropped head, cropped feet, portrait shot, close up, floating character, ghost, looking away, back to camera, profile view";

// Schema for Branding Master Output
const brandingMasterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hookHeadline: { type: Type.STRING, description: "A catchy, curiosity-inducing headline for the video topic." },
    hashtags: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "5-10 relevant hashtags." 
    },
    masterVisualPrompt: { type: Type.STRING, description: "The single prompt to generate the master image." },
    variations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          title: { type: Type.STRING },
          script: { type: Type.STRING },
          veoPrompt: { type: Type.STRING }
        },
        required: ["id", "title", "script", "veoPrompt"]
      }
    }
  },
  required: ["hookHeadline", "hashtags", "masterVisualPrompt", "variations"]
};

// Schema for Multi-Scene Output (Land & Townhouse)
const scenesResponseSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER },
      title: { type: Type.STRING },
      script: { type: Type.STRING },
      visualPrompt: { type: Type.STRING },
      veoPrompt: { type: Type.STRING } 
    },
    required: ["id", "title", "script", "visualPrompt", "veoPrompt"]
  }
};

/**
 * 1. APP THƯƠNG HIỆU (BRANDING)
 */
export const generateBrandAssets = async (
  agentImage: string | null,
  topic: string,
  background: string,
  style: string,
  tone: string,
  quantity: number
): Promise<BrandingResult> => {
  const ai = getAiClient();

  const systemInstruction = `
    ROLE: Personal Branding Expert & Creative Director.
    TASK: 
    1. Create ONE Master Visual Prompt for a personal brand expert video series.
    2. Create a Catchy Hook Headline & Hashtags.
    3. Create ${quantity} unique video scripts based on the user's content topic.
    
    INPUT CONTEXT:
    - Content Topic: "${topic}"
    - Background: "${background}"
    - Style: "${style}"
    - Tone: "${tone}"
    
    OUTPUT REQUIREMENTS:
    A. HOOK & HASHTAGS (Vietnamese for Hook):
    - Hook Headline: Short, punchy, curiosity-inducing or addressing a pain point.
    - Hashtags: 5-10 trending tags related to ${topic} and personal branding.

    B. MASTER VISUAL PROMPT (English):
    - SUBJECT: Professional expert (preserve identity), Mid-shot (Waist-up), SITTING COMFORTABLY or STANDING RELAXED.
    - ACTION: Looking directly at camera, engaging hand gestures.
    - BACKGROUND: ${background}. High-end cinematic lighting.
    - STRICTLY: NO TEXT, NO LOGOS.
    
    C. VARIATIONS (Array of ${quantity}):
    - Based on topic "${topic}", create ${quantity} different sub-topics/angles.
    - SCRIPT (Vietnamese): Natural spoken language, expert tone (~40 words).
    - VEO PROMPT (English): Describe subtle motion (e.g., "Speaker smiles and nods").
  `;

  const parts: any[] = [{ text: "Generate personal branding plan." }];

  if (agentImage) {
    parts.push({ inlineData: { mimeType: "image/png", data: agentImage } });
    parts.push({ text: "Reference Identity (Keep facial features exactly)" });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: brandingMasterSchema,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate branding assets.");

  try {
    return JSON.parse(text) as BrandingResult;
  } catch (e) {
    console.error("JSON Parse Error", e);
    throw new Error("Invalid JSON from AI");
  }
};

/**
 * 2. APP ĐẤT NỀN (LAND)
 */
export const generateRealEstateMaterials = async (
  appId: AppType,
  agentImage: string | null,
  projectImages: string[],
  info: ProjectInfo,
  clothingDescription: string,
  numScenes: number = 3
): Promise<SceneData[]> => {
  const ai = getAiClient();
  
  const systemInstruction = `
    ROLE: Expert Real Estate Video Director.
    TASK: Create a ${numScenes}-scene video script and visual prompts for a Land Investment project.
    
    INPUT DATA:
    - Description: "${info.description}"
    - Utilities: "${info.utilities}"
    - CTA: "${info.cta}"
    - Agent Look: ${clothingDescription}
    
    OUTPUT FORMAT: JSON Array of exactly ${numScenes} Scenes.
    Flow: Intro -> Location -> Utilities -> Potential -> CTA.
    
    STRICT RULES:
    1. SCRIPT (Vietnamese): 
       - Punchy, sales-oriented, ~25 words per scene.
    
    2. VISUAL PROMPT (English) - FRAMING:
      * **MID-SHOT (Waist-up)**: Strictly Professional TV News Anchor style.
      * Agent Position: "Strictly at the right 1/3 of the frame".
      * Background: "The left 2/3 displays [specific scene context based on project images]".
      * NO TEXT, NO LOGOS within the generated image.

    3. VEO PROMPT (English) - ANTI-DISTORTION & STABILITY (Updated for Veo 3):
       - **STRUCTURE**: Start with "Static shot of professional news anchor...".
       - **KEYWORDS**: Must include "minimal head movement", "locked facial features", "consistent face", "no morphing", "high fidelity preservation".
       - **ACTION**: "Subtle hand gestures while speaking", "Maintaining direct eye contact".
       - **NO**: No walking, no turning, no background morphing.
  `;

  const parts: any[] = [{ text: "Analyze attached images and generate video scenes." }];

  if (agentImage) {
    parts.push({ inlineData: { mimeType: "image/png", data: agentImage } });
    parts.push({ text: "Agent Reference Image (Face)" });
  }

  projectImages.forEach((img, idx) => {
    parts.push({ inlineData: { mimeType: "image/png", data: img } });
    parts.push({ text: `Project Context Image #${idx + 1}` });
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: scenesResponseSchema,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate scenes.");

  try {
    return JSON.parse(text) as SceneData[];
  } catch (e) {
    throw new Error("Invalid JSON from AI");
  }
};

/**
 * 3. APP NHÀ PHỐ (TOWNHOUSE)
 * STRICT FULL BODY & IDENTITY LOCK & BACKGROUND PRESERVATION
 */
export const generateTownhouseMaterials = async (
  agentImage: string | null,
  projectImages: string[],
  info: ProjectInfo,
  outfit: string,
  numScenes: number = 3
): Promise<SceneData[]> => {
  const ai = getAiClient();
  
  const systemInstruction = `
    ROLE: Interior Design Reviewer & Architect.
    TASK: Create a ${numScenes}-scene video tour for a Townhouse/Apartment.
    
    INPUT DATA:
    - House Info: "${info.description}"
    - Highlight: "${info.utilities}"
    - Agent Outfit: "${outfit}"
    
    OUTPUT FORMAT: JSON Array of exactly ${numScenes} Scenes.
    
    STRICT RULES:
    1. SCRIPT (Vietnamese):
       - EXACTLY ~22 words per scene (approx 8 seconds spoken).
       - Tone: Sophisticated, architectural, inviting.
    
    2. VISUAL PROMPT (English) - FRONT-FACING PRIORITY:
       - **STRICT IDENTITY LOCK**: "Use Image 1 (Agent face) as the core structural reference. All facial landmarks (nose shape, eye distance, jawline) MUST remain 99% identical."
       - **BACKGROUND**: DO NOT imagine a new background. Use the provided project image as the EXACT background.
       - **FRAMING**: "FULL BODY STANDING SHOT".
       - **PRIORITY: FRONT-FACING ENGAGEMENT**:
          * The character MUST ALWAYS face the camera with DIRECT EYE CONTACT.
          * DO NOT look away at the house features. The character is a host speaking TO the audience.
          * The character should be standing in different parts of the house (living room, balcony, kitchen) but ALWAYS looking and speaking directly to the viewers/camera.
       - **FACE CLARITY**: "Ensure the face is not too small; it must be sharp and recognizable despite the full-body framing."
       - NO TEXT, NO LOGOS.
       
    3. VEO PROMPT (English) - ANTI-DISTORTION & STABILITY OPTIMIZED:
       - **CRITICAL STRUCTURE**: Start strictly with "Static shot of [Character Description]..." or "Slow subtle camera movement...".
       - **ANTI-DISTORTION KEYWORDS**: Must include "minimal head movement", "locked facial features", "consistent face", "no morphing", "high fidelity preservation".
       - **CONTEXTUAL ACTION**: The movement must be subtle but match the script context.
         * If script is welcoming: "Character smiles gently at the camera, slight hand gesture."
         * If script mentions a detail: "Character gestures openly to the side with open palm, but keeps eyes locked on the camera."
       - **PROHIBITED**: No walking, no turning around, no fast movements, no looking away.
       - **QUALITY**: Photorealistic, 4k, cinematic lighting.
  `;

  const parts: any[] = [{ text: "Analyze the interior images and generate the review tour." }];

  if (agentImage) {
    parts.push({ inlineData: { mimeType: "image/png", data: agentImage } });
    parts.push({ text: "STRICT IDENTITY LOCK: This is the REFERENCE FACE. The output character MUST look exactly like this person." });
  }

  projectImages.forEach((img, idx) => {
    parts.push({ inlineData: { mimeType: "image/png", data: img } });
    parts.push({ text: `Interior Image #${idx + 1} (USE AS BACKGROUND)` });
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: scenesResponseSchema,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate townhouse scenes.");

  try {
    return JSON.parse(text) as SceneData[];
  } catch (e) {
    throw new Error("Invalid JSON from AI");
  }
};

/**
 * REGENERATE IMAGE WITH FEEDBACK (NEW)
 */
export const regenerateSceneImage = async (
  originalVisualPrompt: string,
  userFeedback: string,
  aspectRatio: AspectRatio,
  agentImageBase64?: string | null,
  backgroundImageBase64?: string | null
): Promise<string> => {
  const ai = getAiClient();

  // Combine original intent with user feedback
  const refinedPrompt = `
    EDIT REQUEST: ${userFeedback}. 
    BASE SCENE CONTEXT: ${originalVisualPrompt}.
    
    STRICT CONSTRAINTS:
    1. PRESERVE IDENTITY: Keep the face from Image 2 EXACTLY.
    2. PRESERVE BACKGROUND: Keep the room/environment from Image 1 EXACTLY.
    3. EXECUTE CHANGE: Only modify the character's pose/expression or camera angle as requested by the EDIT REQUEST.
    4. QUALITY: Photorealistic, 4k, HDR.
  `;

  const parts: any[] = [];

  // Order matters: Background first (Context), Agent second (Identity)
  if (backgroundImageBase64) {
    parts.push({ inlineData: { mimeType: "image/png", data: backgroundImageBase64 } });
  }
  if (agentImageBase64) {
    parts.push({ inlineData: { mimeType: "image/png", data: agentImageBase64 } });
  }

  parts.push({ text: refinedPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { imageConfig: { aspectRatio } }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return part.inlineData.data;
  }
  throw new Error("Failed to regenerate image.");
};

/**
 * SHARED IMAGE GENERATOR
 */
export const generateCharacterImage = async (
  visualPrompt: string, 
  aspectRatio: AspectRatio,
  referenceImageBase64?: string | null,
  backgroundImageBase64?: string | null
): Promise<string> => {
  const ai = getAiClient();
  
  // Detect App Context from Prompt Keywords
  const promptLower = visualPrompt.toLowerCase();
  
  let poseInstruction = "";
  let negativePrompt = STRICT_NEGATIVE_PROMPT;
  let contextInstruction = "";

  // Strict check for Townhouse context
  if (backgroundImageBase64) {
    // TOWNHOUSE: 100% BACKGROUND + FULL BODY + FRONT FACING
    poseInstruction = `
      TASK: INSERT CHARACTER INTO EXISTING IMAGE.
      BACKGROUND: Use IMAGE 1 (Context) as the EXACT background. Do not modify the room structure.
      CHARACTER: Use IMAGE 2 (Face) for Strict Identity Lock (99% Match).
      FRAMING: FULL BODY STANDING SHOT. Head to toe visible.
      PLACEMENT: Character stands naturally on the floor of the room in IMAGE 1.
      LIGHTING: Match the lighting of IMAGE 1. Ensure face is well-lit.
      INTERACTION: Character MUST LOOK DIRECTLY AT THE CAMERA. Direct Eye Contact.
      FACE QUALITY: Ensure the face is sharp and recognizable despite the full-body framing.
    `;
    negativePrompt = TOWNHOUSE_NEGATIVE_PROMPT;
  } else if (promptLower.includes('sitting') || promptLower.includes('expert')) {
    // BRANDING STYLE
    poseInstruction = `
      FRAMING: Mid-shot (Waist-up).
      POSE: SITTING comfortably or Standing relaxed. Hands visible and gesturing naturally.
      COMPOSITION: Subject centered or rule-of-thirds.
      EYES: Direct eye contact.
      STYLE: Personal Brand, YouTube Expert.
    `;
  } else {
    // LAND STYLE
    poseInstruction = `
      FRAMING: Professional TV News Anchor MID-SHOT (Waist-up only). DO NOT SHOW LEGS.
      COMPOSITION: Subject positioned strictly at the 1/3 vertical line.
      POSE: Standing or sitting erect.
      EYES: Direct eye contact.
      STYLE: TV News Broadcast.
    `;
  }

  const enhancedPrompt = `${poseInstruction} ${visualPrompt}. ${negativePrompt}`;

  const parts: any[] = [];
  
  // Order of images matters for instruction reference
  if (backgroundImageBase64) {
      parts.push({
        inlineData: { mimeType: "image/png", data: backgroundImageBase64 }
      });
      contextInstruction += "IMAGE 1: Background Context. ";
  }
  
  if (referenceImageBase64) {
    parts.push({
      inlineData: { mimeType: "image/png", data: referenceImageBase64 }
    });
    contextInstruction += "IMAGE 2: Face Reference. ";
  }
  
  // Append context info to prompt if needed, though usually instructions above handle it
  parts.push({ text: enhancedPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { 
      imageConfig: { aspectRatio } 
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return part.inlineData.data;
  }
  throw new Error("No image data");
};

/**
 * Legacy Support Function
 */
const singleResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    visualPrompt: { type: Type.STRING },
    script: { type: Type.STRING },
    veoPrompt: { type: Type.STRING }
  },
  required: ["visualPrompt", "script", "veoPrompt"],
};

export const generateMaterials = async (
  appId: AppType, 
  portraitImageBase64?: string | null,
  projectImagesBase64: string[] = []
): Promise<TextGenerationResult> => {
  const ai = getAiClient();
  const instruction = "Generate Interior Design assets. Script in Vietnamese. Visual Prompt in English (No text).";
  const parts: any[] = [{ text: "Generate assets." }];
  if (portraitImageBase64) parts.push({ inlineData: { mimeType: "image/png", data: portraitImageBase64 } });
  if (projectImagesBase64.length > 0) {
     projectImagesBase64.forEach(img => parts.push({ inlineData: { mimeType: "image/png", data: img } }));
  }
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction: instruction,
      responseMimeType: "application/json",
      responseSchema: singleResponseSchema,
    },
  });
  const text = response.text;
  if (!text) throw new Error("No response");
  return JSON.parse(text) as TextGenerationResult;
};