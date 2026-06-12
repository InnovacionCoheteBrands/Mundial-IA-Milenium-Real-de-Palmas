import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenAI, Modality } from "@google/genai";
import { teamInfo, type TeamId } from "@shared/schema";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const WATERMARK_PATH = path.join(process.cwd(), "attached_assets", "logo_milenium__1767829210784.png");

async function addWatermarkToImage(imageBase64: string): Promise<string> {
  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    
    const mainImage = sharp(imageBuffer);
    const metadata = await mainImage.metadata();
    
    if (!metadata.width || !metadata.height) {
      console.log("Could not get image metadata, returning original");
      return imageBase64;
    }

    const logoBuffer = fs.readFileSync(WATERMARK_PATH);
    const logoMaxWidth = Math.floor(metadata.width * 0.2);
    const logoMaxHeight = Math.floor(metadata.height * 0.15);
    
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoMaxWidth, logoMaxHeight, { fit: "inside" })
      .toBuffer();
    
    const logoMeta = await sharp(resizedLogo).metadata();
    const logoWidth = logoMeta.width || logoMaxWidth;
    const logoHeight = logoMeta.height || logoMaxHeight;
    
    const padding = Math.floor(Math.min(metadata.width, metadata.height) * 0.03);
    const left = metadata.width - logoWidth - padding;
    const top = metadata.height - logoHeight - padding;

    const watermarkedBuffer = await mainImage
      .composite([
        {
          input: resizedLogo,
          left,
          top,
        },
      ])
      .jpeg({ quality: 92 })
      .toBuffer();

    return `data:image/jpeg;base64,${watermarkedBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Watermark error:", error);
    return imageBase64;
  }
}

function getAIClient() {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  
  if (!apiKey || !baseUrl) {
    throw new Error("AI integration not configured. Please ensure Gemini AI integration is set up.");
  }
  
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion: "",
      baseUrl,
    },
  });
}

function getJerseyDescription(team: TeamId): string {
  const descriptions: Record<TeamId, string> = {
    mexico: "Mexico national football team jersey: dark green (forest green) body with a subtle geometric/Aztec-inspired pattern, thin red and white vertical stripes on the sides, 'FMF' crest on the left chest, Adidas logo on the right chest. Home jersey style.",
    usa: "United States (USMNT) national football team jersey: white body with bold red and blue color-block panels on the sides and shoulders, USSF crest on the left chest, Nike swoosh on the right chest. Modern home kit.",
    canada: "Canada national football team jersey: bold red body with white accents, Canada Soccer crest on the left chest, Nike swoosh on the right chest. Solid red home kit with minimal detailing.",
    spain: "Spain national football team jersey (La Roja): rich red (deep crimson) body with yellow collar trim and cuffs, RFEF crest on the left chest, Adidas logo on the right chest. Classic Spanish home kit.",
    england: "England national football team jersey (Three Lions): clean white body with subtle red St. George cross detailing on the collar or sleeves, Three Lions crest on the left chest, Nike swoosh on the right chest. Classic all-white home kit.",
    brazil: "Brazil national football team jersey (Seleção): bright canary yellow body with green collar and trim, CBF crest on the left chest, Nike swoosh on the right chest. Iconic yellow and green Brazilian home kit.",
    argentina: "Argentina national football team jersey (La Albiceleste): light blue and white vertical stripes of equal width, AFA crest on the left chest, Adidas logo on the right chest. The iconic Messi-era sky blue and white striped home kit.",
    portugal: "Portugal national football team jersey: dark green (bottle green) body with FPF crest on the left chest, Nike swoosh on the right chest. Dark green Portuguese away/third kit or alternately: deep red home kit with FPF crest.",
  };
  return descriptions[team];
}

function getTransformationPrompt(team: TeamId): string {
  const teamData = teamInfo[team];
  const jerseyDesc = getJerseyDescription(team);

  return `You are a world-class professional photo retouching artist specializing in hyperrealistic digital compositing. Your task is to perform a MINIMAL, PRECISION photo edit — not to generate a new image.

This is PHOTO RETOUCHING, not image generation. The input photo is the source of truth. You are making exactly THREE targeted changes and NOTHING else.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 1 — JERSEY REPLACEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Replace the shirt/clothing of EVERY person visible in the photo with the official ${teamData.name} national football team jersey.

Jersey to apply: ${jerseyDesc}

Technical execution requirements:
• The jersey fabric must follow the natural folds, creases, and wrinkles of the person's actual body shape and posture — NOT a flat overlay
• Match the exact lighting direction, shadows, and ambient light already present in the photo
• Where skin is exposed (collar area, forearms, hands) preserve the exact original skin tone at the exact original boundary
• The jersey seams, collar, and cuffs must align naturally with the person's neck, shoulders, and wrists
• Result: viewer cannot tell the jersey was added — it must look like the person was always wearing it

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 2 — FIFA WORLD CUP TROPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Add the official FIFA World Cup Trophy to the scene — held naturally by one of the people in the photo.

Trophy description: The iconic 36.8 cm solid 18-karat gold trophy. Two human figures with outstretched arms supporting the Earth globe on top. Highly reflective polished gold surface with realistic specular highlights and environmental reflections.

Technical execution requirements:
• The trophy must be gripped at the base or stem by the person's actual hand/arm — use the existing arm position in the photo to determine the most natural placement
• The trophy must cast a shadow consistent with the photo's light source direction
• The gold surface must show reflections of the surrounding environment (not a flat gold color)
• The person's fingers must realistically wrap around the trophy stem — correct occlusion and perspective
• Result: trophy looks like it was physically present in the original photo shoot

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 3 — STADIUM BACKGROUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Replace the background entirely with a hyperrealistic FIFA World Cup stadium scene. The person(s) must appear naturally placed inside the stadium environment — either in the stands among cheering fans, or at pitch-side near the green field.

Stadium scene details:
• A massive, modern, fully packed football stadium under bright stadium floodlights
• Tens of thousands of fans in colorful jerseys visible in the stands, creating a wall of color and energy
• Vivid green grass pitch visible in the foreground or background
• Celebratory confetti, streamers, or ticker tape falling through the air
• Warm golden stadium lighting with dramatic rim/back lighting on the subjects
• Wide-angle stadium architecture visible (multiple tiers of seating, scoreboard, stadium roof)
• Atmosphere: victory celebration — the final whistle has just blown

Technical execution requirements (CRITICAL for avoiding collage effect):
• The edge between the person(s) and the new background must be SEAMLESSLY BLENDED — no hard cutout edges, no halos, no fringing. Use realistic edge softening that mimics how a camera lens captures foreground subjects against bright backgrounds.
• Apply a SHALLOW DEPTH OF FIELD: the background must be realistically blurred (bokeh effect, ~f/2.8 equivalent), as if photographed with a portrait lens. This is the most important technique for making background compositing look real.
• The stadium background lighting must MATCH the lighting direction already on the person's face and body — if the original photo has frontal lighting, the stadium background must show a corresponding frontal light source direction.
• Add subtle atmospheric haze, lens flare, or bloom from the stadium floodlights to unify the foreground and background color temperature.
• The person(s) must feel EMBEDDED IN the stadium — not pasted in front of it. Scale the stadium background so the subjects are positioned naturally within the scene (not floating or disproportionately large).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DO NOT CHANGE — ABSOLUTE PRESERVATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The following must be preserved PIXEL-PERFECT:

FACES: Every face in the photo must be reproduced exactly — identical bone structure, exact eye shape and color, exact nose, exact mouth, exact skin tone, exact complexion, exact facial hair (beard/stubble/mustache), exact expression. NO face regeneration. NO "similar" faces — EXACT faces.

BODIES: Every person's body type, proportions, height, weight/build, and posture must remain identical to the input.

POSES: Every person's arm position, head tilt, stance, and gesture must be preserved exactly.

BACKGROUND: Replace the background with a hyperrealistic World Cup stadium environment (see CHANGE 3 below). Everything EXCEPT the background must remain exactly as in the original photo.

ACCESSORIES: Glasses, hats, jewelry, watches, and all accessories must remain exactly as in the input.

HAIR: Every person's hairstyle, hair color, and hair length must be preserved exactly.

PEOPLE COUNT: The output must contain the exact same number of people as the input — no additions, no removals.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY STANDARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The final result must be INDISTINGUISHABLE from a real photograph taken at a World Cup stadium. No hard cutout edges, no compositing seams, no mismatched lighting, no cartoon or illustrative elements, no AI-generated faces. A viewer should believe the subjects were photographed directly inside the stadium.

PRIORITY ORDER (if any conflict): Preserve faces → Preserve bodies/poses → Apply jersey → Add trophy → Replace background.`;
}

async function cropTo16x9(imageBase64: string): Promise<string> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const image = sharp(buffer);
  const { width, height } = await image.metadata();
  if (!width || !height) return imageBase64;

  const targetAspect = 16 / 9;
  const originalAspect = width / height;

  let cropWidth: number, cropHeight: number;
  if (originalAspect > targetAspect) {
    cropHeight = height;
    cropWidth = Math.round(height * targetAspect);
  } else {
    cropWidth = width;
    cropHeight = Math.round(width / targetAspect);
  }

  const left = Math.round((width - cropWidth) / 2);
  const top = Math.round((height - cropHeight) / 2);

  const croppedBuffer = await image
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .jpeg({ quality: 90 })
    .toBuffer();

  return `data:image/jpeg;base64,${croppedBuffer.toString("base64")}`;
}

async function transformImage(originalImageBase64: string, team: TeamId): Promise<string> {
  const ai = getAIClient();
  const base64Data = originalImageBase64.replace(/^data:image\/\w+;base64,/, "");
  const prompt = getTransformationPrompt(team);
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/transform", async (req, res) => {
    try {
      const { team, image } = req.body;

      if (!team || !image) {
        return res.status(400).json({ error: "Team and image are required" });
      }

      if (!teamInfo[team as TeamId]) {
        return res.status(400).json({ error: "Invalid team selected" });
      }

      console.log(`Starting transformation for team: ${team}`);

      const prompt = getTransformationPrompt(team as TeamId);
      console.log("Using prompt for transformation");

      const transformedImage = await transformImage(image, team as TeamId);
      console.log("Image transformation complete");

      const croppedImage = await cropTo16x9(transformedImage);
      console.log("Cropped to 16:9");

      const watermarkedImage = await addWatermarkToImage(croppedImage);
      console.log("Watermark applied");

      const transformation = await storage.createTransformation({
        team,
        originalImageUrl: image,
        transformedImageUrl: watermarkedImage,
        promptUsed: prompt,
      });

      res.json({
        success: true,
        transformedImage: watermarkedImage,
        transformationId: transformation.id,
      });
    } catch (error) {
      console.error("Transformation error:", error);
      res.status(500).json({
        error: "Failed to transform image",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/transformations", async (req, res) => {
    try {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      const transformations = await storage.getAllTransformations();
      res.json(transformations);
    } catch (error) {
      console.error("Error fetching transformations:", error);
      res.status(500).json({ error: "Failed to fetch transformations" });
    }
  });

  app.get("/api/images", async (req, res) => {
    try {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.set("Surrogate-Control", "no-store");
      const transformations = await storage.getAllTransformations();
      res.json(transformations);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.get("/api/transformations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transformation = await storage.getTransformation(id);

      if (!transformation) {
        return res.status(404).json({ error: "Transformation not found" });
      }

      res.json(transformation);
    } catch (error) {
      console.error("Error fetching transformation:", error);
      res.status(500).json({ error: "Failed to fetch transformation" });
    }
  });

  return httpServer;
}
