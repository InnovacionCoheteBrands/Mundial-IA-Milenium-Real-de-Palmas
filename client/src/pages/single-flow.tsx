import { useRef, useState, useCallback, useEffect, type ChangeEvent } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import {
  ChevronRight,
  Check,
  Camera,
  RotateCcw,
  SwitchCamera,
  AlertCircle,
  AlertTriangle,
  Download,
  Share2,
  Home,
  Loader2,
  Sparkles,
  Trophy,
  ImageIcon,
} from "lucide-react";
import { useApp, type FlowStep } from "@/lib/app-context";
import { TEAMS, teamInfo, type TeamId } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import backgroundImage from "@assets/bg_stadium_abstract_2.png";
import trophyImage from "@assets/ChatGPT_Image_6_ene_2026,_15_32_44_1767829210783.png";
import mileniumLogo from "@assets/logo_milenium__1767829210784.png";
import realDePalmasLogo from "@assets/image_1781283435018.png";

const teamFlags: Record<TeamId, string> = {
  mexico: "https://flagcdn.com/w80/mx.png",
  usa: "https://flagcdn.com/w80/us.png",
  canada: "https://flagcdn.com/w80/ca.png",
  spain: "https://flagcdn.com/w80/es.png",
  england: "https://flagcdn.com/w80/gb-eng.png",
  brazil: "https://flagcdn.com/w80/br.png",
  argentina: "https://flagcdn.com/w80/ar.png",
  portugal: "https://flagcdn.com/w80/pt.png",
};

const MAX_IMAGE_WIDTH = 1200;
const JPEG_QUALITY = 0.85;
const CAMERA_ASPECT_RATIO = 16 / 9;
const CAMERA_ASPECT_RATIO_CSS = "16 / 9";

function getCenteredCropRect(sourceWidth: number, sourceHeight: number, targetRatio = CAMERA_ASPECT_RATIO) {
  const sourceRatio = sourceWidth / sourceHeight;

  if (sourceRatio > targetRatio) {
    const width = sourceHeight * targetRatio;
    return {
      sx: (sourceWidth - width) / 2,
      sy: 0,
      sw: width,
      sh: sourceHeight,
    };
  }

  const height = sourceWidth / targetRatio;
  return {
    sx: 0,
    sy: (sourceHeight - height) / 2,
    sw: sourceWidth,
    sh: height,
  };
}

function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let width = img.width;
      let height = img.height;
      if (width > MAX_IMAGE_WIDTH) {
        height = (height * MAX_IMAGE_WIDTH) / width;
        width = MAX_IMAGE_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function PromoStrip() {
  return (
    <div className="w-full bg-black/75 border-t border-green-500/40 backdrop-blur-sm">
      <div className="flex items-stretch divide-x divide-white/15 max-w-sm mx-auto">
        <div className="flex-1 flex flex-col items-center gap-1 px-1 py-2.5">
          <div className="promo-badge rounded-sm px-1.5 py-0.5 mb-0.5">
            <span className="text-[11px] font-black text-white uppercase tracking-wider leading-none">PASO 1</span>
          </div>
          <span className="text-lg leading-none">⚽</span>
          <span className="text-[11px] font-bold text-white uppercase text-center leading-tight tracking-wide">
            ELIGE TU<br />EQUIPO
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 px-1 py-2.5">
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-sm px-1.5 py-0.5 mb-0.5 border border-green-400/30">
            <span className="text-[11px] font-black text-white uppercase tracking-wider leading-none">PASO 2</span>
          </div>
          <span className="text-lg leading-none">📸</span>
          <span className="text-[11px] font-bold text-green-400 uppercase text-center leading-tight tracking-wide">
            TÓMATE<br />LA FOTO
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 px-1 py-2.5">
          <div className="promo-badge rounded-sm px-1.5 py-0.5 mb-0.5">
            <span className="text-[11px] font-black text-white uppercase tracking-wider leading-none">PASO 3</span>
          </div>
          <span className="text-lg leading-none">🏆</span>
          <span className="text-[11px] font-bold text-white uppercase text-center leading-tight tracking-wide">
            DESCARGA<br />TU IMAGEN
          </span>
        </div>
      </div>
      <p className="text-center text-[11px] text-white/40 pb-1.5 tracking-wide">
        Tecnología de COHETE BRANDS
      </p>
    </div>
  );
}

const FLOW_STEPS_WITH_DOTS: FlowStep[] = ["team", "capture", "processing", "result"];

function StepDots({ current }: { current: FlowStep }) {
  if (!FLOW_STEPS_WITH_DOTS.includes(current)) return null;
  const idx = FLOW_STEPS_WITH_DOTS.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-1.5 pt-2 pb-0.5">
      {FLOW_STEPS_WITH_DOTS.map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i < idx ? "bg-green-500 w-4 h-1.5" : i === idx ? "bg-green-400 w-6 h-1.5" : "bg-white/20 w-1.5 h-1.5"
          }`}
        />
      ))}
    </div>
  );
}

function IntroContent({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-0">
      <div className="flex flex-col items-center gap-3 px-4 pt-5 pb-4 text-center">
        <p className="text-xs text-white/70 font-semibold tracking-[0.2em] uppercase drop-shadow">
          Activa tu cámara para comenzar
        </p>

        <Button
          size="lg"
          onClick={onContinue}
          className="gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 border border-green-400/50 px-8 py-5 text-base font-black text-white uppercase tracking-widest shadow-lg shadow-green-900/50"
          data-testid="button-comenzar"
        >
          <Camera className="h-5 w-5" />
          ¡COMENZAR!
        </Button>

        <p className="text-[11px] text-white/40 tracking-wide">
          Necesitamos acceso a tu cámara
        </p>
      </div>

      <PromoStrip />
    </div>
  );
}

function TeamContent({ onContinue }: { onContinue: () => void }) {
  const { selectedTeam, setSelectedTeam } = useApp();

  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-col gap-3 px-3 pt-4 pb-3 sm:gap-4 sm:px-4 sm:pt-5">
        <div className="text-center">
          <p className="text-[11px] font-bold text-green-400 uppercase tracking-[0.25em] mb-0.5">
            — Selecciona —
          </p>
          <h2 className="text-xl font-black text-white uppercase tracking-tight drop-shadow-lg sm:text-2xl stadium-headline-accent">
            TU EQUIPO
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {TEAMS.map((team) => {
            const info = teamInfo[team];
            const isSelected = selectedTeam === team;

            return (
              <button
                key={team}
                className={`relative flex flex-col items-center gap-0.5 rounded-md p-1.5 transition-all hover-elevate active-elevate-2 sm:gap-1 sm:p-2 ${
                  isSelected
                    ? "bg-green-500/20 ring-2 ring-green-400 shadow-lg shadow-green-500/20"
                    : "bg-black/30 border border-white/10 hover:bg-black/50"
                }`}
                onClick={() => setSelectedTeam(team)}
                data-testid={`card-team-${team}`}
              >
                {isSelected && (
                  <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white sm:-right-1 sm:-top-1 sm:h-5 sm:w-5">
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </div>
                )}
                <div className="h-6 w-10 overflow-hidden rounded-sm shadow-sm sm:h-8 sm:w-12">
                  <img
                    src={teamFlags[team]}
                    alt={info.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className={`text-[11px] font-semibold leading-tight sm:text-xs ${isSelected ? "text-green-300" : "text-white/80"}`}>
                  {info.name}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          size="lg"
          disabled={!selectedTeam}
          onClick={onContinue}
          className="w-full gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 border border-green-400/50 py-5 font-black text-white uppercase tracking-widest shadow-lg shadow-green-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
          data-testid="button-continue"
        >
          Continuar
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="w-full border-t border-white/10 bg-black/40 py-2 text-center">
        <p className="text-[11px] text-white/40 tracking-wide uppercase">⚽ Copa del Mundo 2026 ⚽</p>
      </div>
    </div>
  );
}

function CaptureContent({ onContinue }: { onContinue: () => void }) {
  const { selectedTeam, setCapturedImage } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraSession, setCameraSession] = useState(0);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const teamColors = selectedTeam ? teamInfo[selectedTeam].colors : null;

  const stopStream = useCallback((mediaStream: MediaStream | null) => {
    mediaStream?.getTracks().forEach((track) => track.stop());
  }, []);

  const stopCamera = useCallback(() => {
    setIsCameraReady(false);

    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, [stopStream]);

  const startCamera = useCallback(async () => {
    const requestId = cameraRequestRef.current + 1;
    cameraRequestRef.current = requestId;

    try {
      stopCamera();
      setHasPermission(null);
      setError(null);

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (requestId !== cameraRequestRef.current) {
        stopStream(mediaStream);
        return;
      }

      streamRef.current = mediaStream;
      setHasPermission(true);
      setCameraSession((prev) => prev + 1);
    } catch (err) {
      if (requestId !== cameraRequestRef.current) return;
      console.error("Camera error:", err);
      setHasPermission(false);
      setError("No se pudo acceder a la cámara.");
    }
  }, [facingMode, stopCamera, stopStream]);

  useEffect(() => {
    startCamera();
    return () => {
      cameraRequestRef.current += 1;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (hasPermission !== true || capturedPreview || !streamRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const activeStream = streamRef.current;
    const activeRequestId = cameraRequestRef.current;
    let cancelled = false;

    const markVideoReady = async () => {
      try {
        await video.play();
      } catch {
        // Some browsers settle autoplay after metadata is already available.
      }

      if (cancelled) return;
      if (cameraRequestRef.current !== activeRequestId) return;
      if (streamRef.current !== activeStream) return;
      if (video.videoWidth <= 0 || video.videoHeight <= 0) return;

      setIsCameraReady(true);
    };

    setIsCameraReady(false);

    if (video.srcObject !== activeStream) {
      video.srcObject = activeStream;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0 && video.videoHeight > 0) {
      void markVideoReady();
      return () => {
        cancelled = true;
      };
    }

    const handleLoadedMetadata = () => {
      void markVideoReady();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [cameraSession, capturedPreview, hasPermission]);

  const switchCamera = () => setFacingMode((prev) => (prev === "user" ? "environment" : "user"));

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw <= 0 || vh <= 0) return;

    const { sx, sy, sw, sh } = getCenteredCropRect(vw, vh);

    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    setCapturedPreview(canvas.toDataURL("image/jpeg", 0.9));
  };

  const retakePhoto = () => {
    setCapturedPreview(null);
    startCamera();
  };

  const confirmPhoto = async () => {
    if (capturedPreview) {
      setIsCompressing(true);
      stopCamera();
      try {
        const compressedImage = await compressImage(capturedPreview);
        setCapturedImage(compressedImage);
        onContinue();
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        stopCamera();
        setCapturedPreview(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const borderStyle = {
    borderColor: teamColors?.primary ?? "#22c55e",
    borderWidth: "3px",
    borderStyle: "solid" as const,
    boxShadow: `0 0 20px ${teamColors?.primary ?? "#22c55e"}40`,
  };

  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-col gap-2 px-3 pt-3 pb-2 sm:px-4">
        {/* Title */}
        <div className="text-center">
          <p className="text-[11px] font-bold text-green-400 uppercase tracking-[0.25em] mb-0.5">— Captura —</p>
          <h2 className="text-lg font-black text-white uppercase tracking-tight drop-shadow-lg sm:text-xl stadium-headline-accent">
            TU FOTO
          </h2>
          <p className="text-[11px] text-white/50">
            {isMobile ? "Toma o sube una foto" : "Usa la cámara o sube una foto"}
          </p>
        </div>

        {/* Camera preview */}
        <div
          className="relative w-full overflow-hidden rounded-lg"
          style={{ ...borderStyle, aspectRatio: CAMERA_ASPECT_RATIO_CSS, maxHeight: "55vh" }}
          data-testid="card-camera-preview"
        >
          {capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Foto capturada"
              className="absolute inset-0 h-full w-full object-cover object-center"
              data-testid="img-captured-preview"
            />
          ) : hasPermission === false ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 p-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-xs font-semibold text-white/80">{error}</p>
              <p className="text-[11px] text-white/50">Usa el botón de abajo para subir una foto</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-200 ${isCameraReady ? "opacity-100" : "opacity-0"}`}
                data-testid="video-camera"
              />
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                </div>
              )}
            </>
          )}

          {hasPermission && !capturedPreview && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
              onClick={switchCamera}
              disabled={hasPermission !== true}
              data-testid="button-switch-camera"
            >
              <SwitchCamera className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Buttons */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
          data-testid="input-file-upload"
        />
        {capturedPreview ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="default"
              className="flex-1 gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={retakePhoto}
              disabled={isCompressing}
              data-testid="button-retake"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Volver</span>
            </Button>
            <Button
              size="default"
              className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-green-500 font-black text-white uppercase tracking-wider shadow-lg shadow-green-900/50 border border-green-400/50"
              onClick={confirmPhoto}
              disabled={isCompressing}
              data-testid="button-confirm"
            >
              {isCompressing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span>Preparando</span></>
              ) : (
                <><Sparkles className="h-4 w-4" /><span>¡Transformar!</span></>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            {hasPermission && (
              <Button
                size="default"
                className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-green-500 font-black text-white uppercase tracking-wider shadow-lg shadow-green-900/50 border border-green-400/50"
                onClick={capturePhoto}
                disabled={!isCameraReady}
                data-testid="button-capture"
              >
                <Camera className="h-4 w-4" />
                <span>Capturar</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="default"
              className={`gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 ${hasPermission ? "flex-1" : "w-full"}`}
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-upload"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Subir foto</span>
            </Button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="w-full border-t border-white/10 bg-black/40 py-1.5 text-center">
        <p className="text-[11px] text-white/40 tracking-wide uppercase">⚽ Copa del Mundo 2026 ⚽</p>
      </div>
    </div>
  );
}
function ProcessingContent({ onComplete }: { onComplete: () => void }) {
  const { selectedTeam, capturedImage, setTransformedImage, setError } = useApp();
  const hasStartedRef = useRef(false);
  const teamColors = selectedTeam ? teamInfo[selectedTeam].colors : null;

  const processImage = useCallback(async () => {
    if (!selectedTeam || !capturedImage) return;
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/transform", { team: selectedTeam, image: capturedImage });
      const data = await response.json();
      if (data.transformedImage) {
        setTransformedImage(data.transformedImage);
        setError(null);
      } else {
        throw new Error("No se recibió la imagen transformada");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setError(errorMessage);
      setTransformedImage(null);
    } finally {
      onComplete();
    }
  }, [selectedTeam, capturedImage, setTransformedImage, setError, onComplete]);

  useEffect(() => { processImage(); }, [processImage]);

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-8 text-center sm:gap-6 sm:py-10">
      <div className="relative">
        <div
          className="absolute inset-0 animate-ping rounded-full opacity-25"
          style={{ backgroundColor: teamColors?.primary ?? "#22c55e" }}
        />
        <div
          className="absolute inset-0 scale-125 animate-pulse rounded-full opacity-15"
          style={{ backgroundColor: teamColors?.primary ?? "#22c55e" }}
        />
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/20 sm:h-24 sm:w-24"
          style={{
            backgroundColor: teamColors?.primary ?? "#22c55e",
            boxShadow: `0 0 40px ${teamColors?.primary ?? "#22c55e"}60`,
          }}
        >
          <Loader2 className="h-10 w-10 animate-spin text-white sm:h-12 sm:w-12" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold text-green-400 uppercase tracking-[0.25em]">— Procesando —</p>
        <h2
          className="text-2xl font-black text-white uppercase tracking-tight drop-shadow-lg stadium-headline-accent sm:text-3xl"
          data-testid="text-processing-title"
        >
          TRANSFORMANDO
        </h2>
        <p className="text-sm text-white/60" data-testid="text-processing-subtitle">
          Creando tu retrato mundialista
          {selectedTeam && ` de ${teamInfo[selectedTeam].name}`}…
        </p>
      </div>

      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 animate-bounce rounded-full"
            style={{ backgroundColor: teamColors?.primary ?? "#22c55e", animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <div className="w-full border-t border-white/10 pt-4">
        <p className="text-[11px] text-white/30 uppercase tracking-widest">⚽ Magia del Mundial ⚽</p>
      </div>
    </div>
  );
}

function ResultContent({ onHome, onRetake }: { onHome: () => void; onRetake: () => void }) {
  const { selectedTeam, transformedImage, capturedImage, error } = useApp();
  const { toast } = useToast();

  const teamColors = selectedTeam ? teamInfo[selectedTeam].colors : null;
  const hasError = error !== null || !transformedImage;
  const displayImage = transformedImage || capturedImage;

  const handleDownload = async () => {
    const img = transformedImage || capturedImage;
    if (!img) return;
    try {
      const blob = await fetch(img).then((r) => r.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fan-mundialista-${selectedTeam || "foto"}.jpg`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      toast({ title: "Imagen descargada", description: "Tu retrato mundialista se ha guardado." });
    } catch {
      const a = document.createElement("a");
      a.href = img;
      a.download = `fan-mundialista-${selectedTeam || "foto"}.jpg`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleShare = async () => {
    const img = transformedImage || capturedImage;
    if (!img) return;
    try {
      const blob = await fetch(img).then((r) => r.blob());
      const file = new File([blob], `fan-mundialista-${selectedTeam}.jpg`, { type: "image/jpeg" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Mi retrato mundialista" });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-sm text-white/60">{error || "Hubo un problema al procesar tu foto."}</p>
        <button
          onClick={onRetake}
          className="flex items-center gap-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors px-5 py-2"
          data-testid="button-retry-home"
        >
          <Camera className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wide">Tomar otra foto</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0" data-testid="card-result">

      {/* ── Title section ── */}
      <div className="px-4 pt-3 pb-2 text-center">
        <p className="text-[11px] font-bold text-green-400 uppercase tracking-[0.25em]">— ¡Listo! —</p>
        <h2 className="text-lg font-black text-white uppercase tracking-tight drop-shadow-lg stadium-headline-accent" data-testid="text-result-title">
          Tu Retrato Mundialista
        </h2>
        {selectedTeam && (
          <p className="text-[11px] text-white/60 mt-0.5 uppercase tracking-widest">
            {teamInfo[selectedTeam].flag} Fan de {teamInfo[selectedTeam].name}
          </p>
        )}
      </div>

      {/* ── Image + QR row ── */}
      <div className="flex flex-row items-stretch gap-3 px-3 pb-3">

        {/* Image — guaranteed 16:9 from server */}
        <div
          className="relative flex-1 min-w-0 aspect-video overflow-hidden rounded-lg"
          style={{
            borderColor: teamColors?.primary ?? "#22c55e",
            borderWidth: "3px",
            borderStyle: "solid",
            boxShadow: `0 0 20px ${teamColors?.primary ?? "#22c55e"}50`,
          }}
          data-testid="card-result-image"
        >
          <img
            src={displayImage!}
            alt="Retrato mundialista"
            className="w-full h-full object-contain bg-black"
            data-testid="img-result"
          />
        </div>

        {/* QR panel — hidden on mobile, visible on sm+ */}
        <div className="hidden sm:flex flex-col items-center justify-center gap-2 rounded-lg bg-black/50 border border-white/15 backdrop-blur-sm px-3 py-3 min-w-[90px]">
          <div className="rounded-lg bg-white p-2">
            <QRCode
              value={`${window.location.origin}/images`}
              size={72}
              bgColor="#ffffff"
              fgColor="#000000"
              data-testid="img-qr-gallery"
            />
          </div>
          <p className="text-[11px] font-bold text-white/70 text-center uppercase tracking-wide leading-tight">
            Escanea para ver<br />todas las fotos
          </p>
        </div>

      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-col gap-2 px-3 pb-3">
        {/* Download — primary */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-500 active:scale-[0.98] transition-all px-4 py-2.5"
            data-testid="button-download"
          >
            <Download className="h-4 w-4 text-white" />
            <span className="text-sm font-black text-white uppercase tracking-wider">Descargar</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all px-3 py-2.5"
            data-testid="button-share"
          >
            <Share2 className="h-4 w-4 text-white" />
          </button>
        </div>
        {/* Secondary: retry + home */}
        <div className="flex gap-2">
          <button
            onClick={onRetake}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 transition-all px-3 py-2"
            data-testid="button-retry"
          >
            <RotateCcw className="h-3.5 w-3.5 text-white/70" />
            <span className="text-xs font-bold text-white/70 uppercase tracking-wide">Tomar otra foto</span>
          </button>
          <button
            onClick={onHome}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 transition-all px-3 py-2"
            data-testid="button-home"
          >
            <Home className="h-3.5 w-3.5 text-white/50" />
            <span className="text-xs text-white/50 uppercase tracking-wide">Inicio</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default function SingleFlowPage() {
  const [, navigate] = useLocation();
  const { currentStep, goToNextStep, reset, setCurrentStep, setCapturedImage, setTransformedImage, setError } = useApp();

  const handleHome = () => { reset(); };

  const handleRetake = () => {
    setCapturedImage(null);
    setTransformedImage(null);
    setError(null);
    setCurrentStep("capture");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "intro":    return <IntroContent onContinue={goToNextStep} />;
      case "team":     return <TeamContent onContinue={goToNextStep} />;
      case "capture":  return <CaptureContent onContinue={goToNextStep} />;
      case "processing": return <ProcessingContent onComplete={goToNextStep} />;
      case "result":   return <ResultContent onHome={handleHome} onRetake={handleRetake} />;
      default:         return <IntroContent onContinue={goToNextStep} />;
    }
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* Stadium photo base */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      {/* Sky-to-grass gradient overlay matching flyer style */}
      <div className="fixed inset-0 stadium-overlay" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header: trophy + Real de Palmas + Milenium in a single row */}
        <header className="flex shrink-0 items-center justify-center gap-2 pt-2 pb-1 px-3 sm:pt-3 sm:gap-3">
          <img
            src={trophyImage}
            alt="Copa del Mundial"
            className="h-10 w-auto object-contain drop-shadow-2xl sm:h-12"
            data-testid="img-trophy"
          />
          <div className="h-8 w-px bg-white/20 sm:h-10" />
          <img
            src={realDePalmasLogo}
            alt="Real de Palmas Residencial"
            className="h-10 w-auto object-contain drop-shadow-lg sm:h-12"
            data-testid="img-real-de-palmas-logo"
          />
          <div className="h-8 w-px bg-white/20 sm:h-10" />
          <img
            src={mileniumLogo}
            alt="Milenium"
            className="h-8 w-auto object-contain drop-shadow-lg sm:h-10"
            data-testid="img-milenium-logo"
          />
        </header>

        {/* Main title */}
        <div className="relative z-10 shrink-0 flex flex-col items-center text-center px-4 pt-1 pb-1">
          <p className="text-[11px] font-bold text-white/80 tracking-[0.25em] uppercase drop-shadow-md">
            TU FOTO IDEAL ESTÁ A
          </p>
          <h1
            className="text-2xl font-black uppercase leading-none tracking-tight stadium-headline-xl sm:text-3xl md:text-4xl"
            data-testid="text-headline"
          >
            UN GOL DE&nbsp;⚽&nbsp;DISTANCIA
          </h1>
        </div>

        <main className="flex flex-1 min-h-0 flex-col items-center justify-center px-2 py-1 sm:px-4 sm:py-2">
          {/* Card: transparent dark panel */}
          <div className="w-full max-w-sm max-h-full flex flex-col overflow-hidden rounded-xl border border-white/15 bg-black/50 backdrop-blur-md shadow-2xl sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
            <StepDots current={currentStep} />
            {renderStepContent()}
          </div>
        </main>

        <footer className="shrink-0 py-1.5 text-center">
          <button
            onClick={() => navigate("/tus-imagenes")}
            className="text-[11px] text-white/15 transition-colors hover:text-white/35"
            data-testid="link-admin"
          >
            Admin
          </button>
        </footer>
      </div>
    </div>
  );
}
