import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenAI, Modality } from "@google/genai";
import { teamInfo, type TeamId } from "@shared/schema";
import sharp from "sharp";
import path from "path";
import fs from "fs";

type ResultLogoAsset = {
  key: "trophy" | "realDePalmas" | "milenium";
  buffer: Buffer;
  targetHeightRatio: number;
  maxWidthRatio: number;
};

function loadLogoAsset(
  key: ResultLogoAsset["key"],
  fileName: string,
  targetHeightRatio: number,
  maxWidthRatio: number,
): ResultLogoAsset | null {
  const assetPath = path.join(process.cwd(), "attached_assets", fileName);
  if (!fs.existsSync(assetPath)) {
    console.warn(`Result logo asset missing: ${assetPath}`);
    return null;
  }

  return {
    key,
    buffer: fs.readFileSync(assetPath),
    targetHeightRatio,
    maxWidthRatio,
  };
}

const RESULT_LOGO_ASSETS: ResultLogoAsset[] = [
  loadLogoAsset("trophy", "ChatGPT_Image_6_ene_2026,_15_32_44_1767829210783.png", 0.12, 0.18),
  loadLogoAsset("realDePalmas", "image_1781283435018.png", 0.12, 0.2),
  loadLogoAsset("milenium", "logo_milenium__1767829210784.png", 0.1, 0.18),
].filter((asset): asset is ResultLogoAsset => asset !== null);

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

    if (RESULT_LOGO_ASSETS.length === 0) return imageBase64;

    const padding = Math.floor(Math.min(metadata.width, metadata.height) * 0.03);
    const gap = Math.max(12, Math.floor(metadata.width * 0.018));
    const separatorWidth = Math.max(2, Math.floor(metadata.width * 0.002));

    const resizedLogos = await Promise.all(
      RESULT_LOGO_ASSETS.map(async (asset) => {
        const resized = await sharp(asset.buffer)
          .resize(
            Math.floor(metadata.width * asset.maxWidthRatio),
            Math.floor(metadata.height * asset.targetHeightRatio),
            { fit: "inside" },
          )
          .toBuffer();

        const logoMeta = await sharp(resized).metadata();
        return {
          key: asset.key,
          input: resized,
          width: logoMeta.width || Math.floor(metadata.width * asset.maxWidthRatio),
          height: logoMeta.height || Math.floor(metadata.height * asset.targetHeightRatio),
        };
      }),
    );

    const logosHeight = Math.max(...resizedLogos.map((logo) => logo.height));
    const contentWidth =
      resizedLogos.reduce((sum, logo) => sum + logo.width, 0) +
      gap * (resizedLogos.length - 1) +
      separatorWidth * (resizedLogos.length - 1);
    const barHorizontalPadding = Math.max(20, Math.floor(metadata.width * 0.025));
    const barVerticalPadding = Math.max(14, Math.floor(metadata.height * 0.02));
    const barWidth = Math.min(metadata.width - padding * 2, contentWidth + barHorizontalPadding * 2);
    const barHeight = logosHeight + barVerticalPadding * 2;
    const barLeft = Math.floor((metadata.width - barWidth) / 2);
    const barTop = metadata.height - barHeight - padding;
    const barInnerLeft = barLeft + Math.floor((barWidth - contentWidth) / 2);

    const overlaySvg = `
      <svg width="${barWidth}" height="${barHeight}" viewBox="0 0 ${barWidth} ${barHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${barWidth}" height="${barHeight}" rx="${Math.floor(barHeight / 2)}" fill="rgba(0,0,0,0.52)" />
      </svg>
    `;

    const composites: sharp.OverlayOptions[] = [
      {
        input: Buffer.from(overlaySvg),
        left: barLeft,
        top: barTop,
      },
    ];

    let cursorLeft = barInnerLeft;
    for (let index = 0; index < resizedLogos.length; index += 1) {
      const logo = resizedLogos[index];
      const logoTop = barTop + Math.floor((barHeight - logo.height) / 2);

      composites.push({
        input: logo.input,
        left: cursorLeft,
        top: logoTop,
      });

      cursorLeft += logo.width;

      if (index < resizedLogos.length - 1) {
        const separatorHeight = Math.floor(logosHeight * 0.75);
        const separatorTop = barTop + Math.floor((barHeight - separatorHeight) / 2);
        const separatorSvg = `
          <svg width="${separatorWidth}" height="${separatorHeight}" viewBox="0 0 ${separatorWidth} ${separatorHeight}" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="${separatorWidth}" height="${separatorHeight}" rx="${Math.ceil(separatorWidth / 2)}" fill="rgba(255,255,255,0.28)" />
          </svg>
        `;

        cursorLeft += gap;
        composites.push({
          input: Buffer.from(separatorSvg),
          left: cursorLeft,
          top: separatorTop,
        });
        cursorLeft += separatorWidth + gap;
      }
    }

    const watermarkedBuffer = await mainImage
      .composite(composites)
      .jpeg({ quality: 92 })
      .toBuffer();

    return `data:image/jpeg;base64,${watermarkedBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Watermark error:", error);
    return imageBase64;
  }
}

let _aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (_aiClient) return _aiClient;
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  if (!apiKey || !baseUrl) {
    throw new Error("AI integration not configured. Please ensure Gemini AI integration is set up.");
  }
  _aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: { apiVersion: "", baseUrl },
  });
  return _aiClient;
}

function getJerseyDescription(team: TeamId): string {
  const descriptions: Record<TeamId, string> = {
    mexico: "Mexico national football team jersey: dark green (forest green) body with a subtle geometric/Aztec-inspired pattern, thin red and white vertical stripes on the sides, 'FMF' crest on the left chest, Adidas logo on the right chest. Home jersey style.",
    usa: "United States (USMNT) national football team jersey: white body with bold red and blue color-block panels on the sides and shoulders, USSF crest on the left chest, Nike swoosh on the right chest. Modern home kit.",
    canada: "Canada national football team jersey: bold red body with white accents, Canada Soccer crest on the left chest, Nike swoosh on the right chest. Solid red home kit with minimal detailing.",
    spain: "Spain national football team jersey (La Roja): rich red (deep crimson) body with yellow collar trim and cuffs, RFEF crest on the left chest, Adidas logo on the right chest. Classic Spanish home kit.",
    england: "England national football team jersey (Three Lions): clean white body with subtle red St. George cross detailing on the collar or sleeves, Three Lions crest on the left chest, Nike swoosh on the right chest. Classic all-white home kit.",
    brazil: "Brazil national football team jersey (SeleÃ§Ã£o): bright canary yellow body with green collar and trim, CBF crest on the left chest, Nike swoosh on the right chest. Iconic yellow and green Brazilian home kit.",
    argentina: "Argentina national football team jersey (La Albiceleste): light blue and white vertical stripes of equal width, AFA crest on the left chest, Adidas logo on the right chest. The iconic Messi-era sky blue and white striped home kit.",
    portugal: "Portugal national football team jersey: dark green (bottle green) body with FPF crest on the left chest, Nike swoosh on the right chest. Dark green Portuguese away/third kit or alternately: deep red home kit with FPF crest.",
  };
  return descriptions[team];
}

function getTransformationPrompt(team: TeamId): string {
  const teamData = teamInfo[team];

  return `You are editing a REAL uploaded photo, not creating a new person. Treat the uploaded image as the single source of truth for identity and anatomy. The final result must look like a realistic sports celebration photograph edited from the original photo.

=== HIGHEST PRIORITY: PRESERVE IDENTITY EXACTLY ===
The people in the uploaded photo must remain unmistakably the same real people.
- Preserve each face exactly: facial structure, eyes, nose, mouth, jawline, cheeks, eyebrows, ears, skin tone, age, expression, and likeness.
- Preserve hairstyle, hairline, glasses, jewelry, beard, makeup, and visible personal traits.
- Preserve tattoos, moles, scars, piercings, bracelets, watches, fingernails, and all visible identifying marks.
- Do NOT beautify, stylize, redraw, re-age, de-age, slim, enlarge, or improve the people.
- Do NOT replace any face, invent any face, blend faces, or make anyone look like a different person.
- The faces must stay instantly recognizable to someone who knows the original people.

=== PRESERVE BODY AND PEOPLE COUNT ===
- Keep ALL people from the original image.
- Do NOT add or remove people.
- Preserve body type, body proportions, height, hands, arms, legs, and overall anatomy.
- Preserve exact limb proportions, shoulder width, arm size, hand size, finger count, tattoos on arms or hands, and visible body details.
- Preserve the original camera perspective and subject scale as much as possible.
- Do NOT turn this into a different body, different person, or different anatomy.

=== POSE FLEXIBILITY: ONLY MINIMAL AND ONLY IF NEEDED ===
You may make a very small, natural pose adjustment ONLY if necessary so ONE person can hold the FIFA World Cup Trophy convincingly.
- Allowed: slight arm reposition, slight shoulder rotation, slight hand adjustment, slight torso adjustment.
- Not allowed: dramatic new pose, different stance, dance pose, exaggerated movement, major head turn, major body rotation, or changing the group arrangement.
- If the trophy can be added without changing pose, keep the original pose unchanged.

=== WHAT TO EDIT ===
1. CLOTHING
   - Replace ONLY the clothing with realistic ${teamData.name} national team jerseys.
   - Every person should wear the jersey naturally and believably.
   - Keep natural folds, shadows, fit, and body alignment.

2. TROPHY
   - Add exactly ONE FIFA World Cup Trophy.
   - The trophy must be held naturally by one real person from the original photo.
   - The trophy must match perspective, scale, lighting, and hand placement.

3. BACKGROUND
   - Replace the background with a realistic World Cup stadium celebration scene from field level or near the edge of the pitch, not a generic flat backdrop.
   - The environment should feel like a live post-match celebration inside the stadium bowl.
   - Show real stadium depth: visible grass or sideline area, stands full of people, bright stadium lights, and atmospheric perspective.
   - Include players or team figures in the background when appropriate, but keep them secondary, believable, and not distracting.
   - Include confetti mainly in the air and across the stands, not as an overwhelming foreground wall.
   - Keep the people from the uploaded photo as the main subject, not the background spectacle.

4. COMPOSITION DIRECTION
   - Aim for a premium sports broadcast look, as if this was captured by a high-end television camera during a World Cup victory celebration.
   - Prefer a more immersive stadium composition: closer to the pitch, stronger depth, more believable crowd, and more wow-factor energy.
   - Avoid the feeling of a pasted subject over a generic stadium stock image.
   - Integrate the subject naturally into the environment with coherent scale, lighting, shadows, and color temperature.

5. BROADCAST CAMERA LOOK
   - The image should feel like a top-tier live TV sports shot: sharp subject, premium lens rendering, believable stadium lighting, and rich contrast.
   - Keep the main person crisp and clearly readable.
   - Allow the background to be slightly softer or subtly out of focus, like a professional telephoto or broadcast camera separation.
   - Use realistic depth, natural highlight rolloff, and a polished televised finish, not artificial filters.
   - The final image should feel impressive, celebratory, and visually striking without looking fake or overprocessed.

6. CELEBRATION ENERGY
   - Show visible victory atmosphere: confetti bursts, crowd excitement, and players or team figures celebrating in the background when appropriate.
   - Confetti should feel dynamic and event-driven, like celebration cannons or bursts in the stadium, not random floating debris everywhere.
   - The stadium should feel alive, triumphant, and high-stakes, as if the team has just won an important match.
   - Keep this energy behind the main subject so the person remains the hero of the shot.

7. OUTPUT FRAMING
   - The final composition must be horizontal landscape, like a television broadcast frame.
   - Prefer a wide 16:9 style composition.
   - Do NOT return a portrait or vertical composition.
   - Keep all people fully and naturally framed inside this horizontal composition.

=== VARIATION WITHOUT LOSING REALISM ===
For each generation, create a different but plausible celebration photo by varying ONLY these elements:
- stadium angle or section
- field-level position or sideline perspective
- visible background players or staff
- confetti density and where it appears in the stands
- lighting mood
- amount of background blur
- lens feel or broadcast framing feel
- crop distance
- trophy placement angle
- jersey wrinkles and fabric behavior
- background energy and celebration intensity

Choose one realistic combination per generation and avoid repeating the exact same composition when another natural option is possible.

=== SCENE VARIATION RULE ===
Use a similar celebration theme every time, but do NOT repeat the exact same stadium layout, same crowd pattern, same trophy angle, same confetti placement, or same camera framing in every result.
Each image should feel like a different real photograph taken in the same kind of event, not the same template reused.

=== VISUAL STYLE ===
- Photorealistic
- Real camera photo
- Natural skin texture
- Realistic lighting and shadows
- High detail
- Cohesive stadium atmosphere
- Premium live-broadcast sports look
- Slight background separation when natural
- No cartoon, painting, 3D render, plastic skin, beauty filter, or fantasy look

=== HARD FAIL CONDITIONS TO AVOID ===
- altered identity
- different face
- different body
- synthetic or generic-looking person
- extra fingers or broken anatomy
- over-stylized image
- fake smile or changed expression
- dramatic pose change
- pasted-on look
- flat or empty background
- repeated template composition
- over-blurred fake portrait look
- unrealistic poster-style compositing
- altered tattoos or missing identifying marks
- portrait output
- cropped-out people or distorted limbs

=== FINAL GOAL ===
Return a realistic, premium, high-impact World Cup victory photo edit where the people are still clearly the exact same people from the uploaded image, now wearing ${teamData.name} jerseys in an immersive stadium celebration scene, with one person holding the World Cup Trophy naturally. The image should feel like an impressive televised sports moment: real, polished, energetic, and wow, while identity accuracy remains more important than spectacle.`;
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
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData,
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
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

      const watermarkedImage = await addWatermarkToImage(transformedImage);
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
