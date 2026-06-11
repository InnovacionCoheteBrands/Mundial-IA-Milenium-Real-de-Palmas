import { useRef, useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Check,
  Camera,
  RotateCcw,
  SwitchCamera,
  AlertCircle,
  Download,
  Share2,
  Home,
  AlertTriangle,
  Loader2,
  Sparkles,
  Trophy,
  ImageIcon,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { TEAMS, teamInfo, type TeamId } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import backgroundImage from "@assets/Captura_de_pantalla_2026-01-05_171649_1767827562768.png";
import trophyImage from "@assets/ChatGPT_Image_6_ene_2026,_15_32_44_1767829210783.png";
import mileniumLogo from "@assets/logo_milenium__1767829210784.png";
import qrGallery from "@assets/qr-images-gallery.png";

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

const MAX_IMAGE_WIDTH = 800;
const JPEG_QUALITY = 0.5;

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
            <span className="text-[8px] font-black text-white uppercase tracking-wider leading-none">PASO 1</span>
          </div>
          <span className="text-lg leading-none">⚽</span>
          <span className="text-[9px] font-bold text-white uppercase text-center leading-tight tracking-wide">
            ELIGE TU<br />EQUIPO
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 px-1 py-2.5">
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-sm px-1.5 py-0.5 mb-0.5 border border-green-400/30">
            <span className="text-[8px] font-black text-white uppercase tracking-wider leading-none">PASO 2</span>
          </div>
          <span className="text-lg leading-none">📸</span>
          <span className="text-[9px] font-bold text-green-400 uppercase text-center leading-tight tracking-wide">
            TÓMATE<br />LA FOTO
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 px-1 py-2.5">
          <div className="promo-badge rounded-sm px-1.5 py-0.5 mb-0.5">
            <span className="text-[8px] font-black text-white uppercase tracking-wider leading-none">PASO 3</span>
          </div>
          <span className="text-lg leading-none">🏆</span>
          <span className="text-[9px] font-bold text-white uppercase text-center leading-tight tracking-wide">
            DESCARGA<br />TU IMAGEN
          </span>
        </div>
      </div>
      <p className="text-center text-[9px] text-white/40 pb-1.5 tracking-wide">
        Tecnología de COHETE BRANDS
      </p>
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

        <p className="text-[10px] text-white/40 tracking-wide">
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
          <p className="text-[10px] font-bold text-green-400 uppercase tracking-[0.25em] mb-0.5">
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
                <span className={`text-[10px] font-semibold leading-tight sm:text-xs ${isSelected ? "text-green-300" : "text-white/80"}`}>
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
        <p className="text-[10px] text-white/40 tracking-wide uppercase">⚽ Copa del Mundo 2026 ⚽</p>
      </div>
    </div>
  );
}

function CaptureContent({ onContinue }: { onContinue: () => void }) {
  const { selectedTeam, setCapturedImage } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const teamColors = selectedTeam ? teamInfo[selectedTeam].colors : null;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      const videoConstraints = isMobile
        ? { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 }, aspectRatio: { ideal: 9 / 16 } }
        : { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 }, aspectRatio: { ideal: 16 / 9 } };

      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
      streamRef.current = mediaStream;
      setHasPermission(true);
      setError(null);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("Camera error:", err);
      setHasPermission(false);
      setError("No se pudo acceder a la cámara.");
    }
  }, [facingMode, stopCamera, isMobile]);

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (hasPermission) startCamera();
  }, [facingMode, hasPermission, startCamera]);

  const switchCamera = () => setFacingMode((prev) => (prev === "user" ? "environment" : "user"));

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
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

  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-col gap-3 px-3 pt-4 pb-3 sm:gap-4 sm:px-4 sm:pt-5">
        <div className="text-center">
          <p className="text-[10px] font-bold text-green-400 uppercase tracking-[0.25em] mb-0.5">
            — Captura —
          </p>
          <h2 className="text-xl font-black text-white uppercase tracking-tight drop-shadow-lg sm:text-2xl stadium-headline-accent">
            TU FOTO
          </h2>
          <p className="text-[10px] text-white/50 mt-0.5">
            {isMobile ? "Toma una foto vertical" : "Toma una foto horizontal"}
          </p>
        </div>

        <div
          className={`relative w-full overflow-hidden rounded-md sm:rounded-lg ${isMobile ? "aspect-[3/4]" : "aspect-video"}`}
          style={{
            borderColor: teamColors?.primary ?? "#22c55e",
            borderWidth: "3px",
            borderStyle: "solid",
            boxShadow: `0 0 20px ${teamColors?.primary ?? "#22c55e"}40`,
          }}
          data-testid="card-camera-preview"
        >
          {capturedPreview ? (
            <img src={capturedPreview} alt="Foto capturada" className="h-full w-full object-cover" data-testid="img-captured-preview" />
          ) : hasPermission === false ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black/60 p-4 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm text-white/70">{error}</p>
              <p className="text-xs text-white/50">Por favor permite el acceso a la cámara para continuar</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full ${isMobile ? "object-contain bg-black" : "object-cover"} ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              data-testid="video-camera"
            />
          )}

          {hasPermission && !capturedPreview && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
              onClick={switchCamera}
              data-testid="button-switch-camera"
            >
              <SwitchCamera className="h-4 w-4" />
            </Button>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex flex-col gap-2">
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
                Volver
              </Button>
              <Button
                size="default"
                className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-green-500 font-black text-white uppercase tracking-wider shadow-lg shadow-green-900/50 border border-green-400/50"
                onClick={confirmPhoto}
                disabled={isCompressing}
                data-testid="button-confirm"
              >
                {isCompressing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Preparando...</>
                ) : (
                  <><Sparkles className="h-4 w-4" />¡Transformar!</>
                )}
              </Button>
            </div>
          ) : (
            hasPermission && (
              <Button
                size="default"
                className="w-full gap-2 bg-gradient-to-r from-green-600 to-green-500 font-black text-white uppercase tracking-wider shadow-lg shadow-green-900/50 border border-green-400/50"
                onClick={capturePhoto}
                data-testid="button-capture"
              >
                <Camera className="h-5 w-5" />
                Capturar Foto
              </Button>
            )
          )}
        </div>
      </div>

      <div className="w-full border-t border-white/10 bg-black/40 py-2 text-center">
        <p className="text-[10px] text-white/40 tracking-wide uppercase">⚽ Copa del Mundo 2026 ⚽</p>
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
        <p className="text-[10px] font-bold text-green-400 uppercase tracking-[0.25em]">— Procesando —</p>
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
        <p className="text-[10px] text-white/30 uppercase tracking-widest">⚽ Magia del Mundial ⚽</p>
      </div>
    </div>
  );
}

function ResultContent({ onRetry, onHome }: { onRetry: () => void; onHome: () => void }) {
  const { selectedTeam, transformedImage, capturedImage, error } = useApp();
  const { toast } = useToast();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const teamColors = selectedTeam ? teamInfo[selectedTeam].colors : null;
  const hasError = error !== null || !transformedImage;
  const displayImage = transformedImage || capturedImage;

  const handleDownload = async () => {
    const imageToDownload = transformedImage || capturedImage;
    if (!imageToDownload) return;
    try {
      const response = await fetch(imageToDownload);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `fan-mundialista-${selectedTeam || "foto"}.jpg`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(blobUrl); }, 100);
      toast({ title: "Imagen descargada", description: "Tu retrato mundialista se ha guardado correctamente." });
    } catch {
      const link = document.createElement("a");
      link.href = imageToDownload;
      link.download = `fan-mundialista-${selectedTeam || "foto"}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    const imageToShare = transformedImage || capturedImage;
    if (!imageToShare) return;
    try {
      const blob = await fetch(imageToShare).then((r) => r.blob());
      const file = new File([blob], `fan-mundialista-${selectedTeam}.jpg`, { type: "image/jpeg" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Mi retrato mundialista",
          text: `Mira mi transformación como fan de ${selectedTeam ? teamInfo[selectedTeam].name : "mi equipo"}!`,
        });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-col gap-3 px-3 pt-4 pb-3 sm:gap-4 sm:px-4 sm:pt-5">
        <div className="text-center">
          <p className="text-[10px] font-bold text-green-400 uppercase tracking-[0.25em] mb-0.5">
            {hasError ? "— Error —" : "— ¡Listo! —"}
          </p>
          <h2
            className="text-xl font-black text-white uppercase tracking-tight drop-shadow-lg sm:text-2xl stadium-headline-accent"
            data-testid="text-result-title"
          >
            {hasError ? "OCURRIÓ UN ERROR" : "TU RETRATO"}
          </h2>
          {selectedTeam && !hasError && (
            <p className="text-[10px] text-white/60 mt-0.5 uppercase tracking-widest">
              Fan de {teamInfo[selectedTeam].name}
            </p>
          )}
        </div>

        {hasError ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400" />
            <p className="text-sm text-white/60">{error || "Hubo un problema al procesar tu foto."}</p>
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Foto original"
                className={`w-full max-w-sm rounded-md ${isMobile ? "aspect-[3/4] object-contain bg-black" : "aspect-video object-cover"}`}
                data-testid="img-original-fallback"
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div
              className={`relative w-full overflow-hidden rounded-lg sm:flex-1 ${isMobile ? "aspect-[3/4]" : "aspect-video"}`}
              style={{
                borderColor: teamColors?.primary ?? "#22c55e",
                borderWidth: "3px",
                borderStyle: "solid",
                boxShadow: `0 0 24px ${teamColors?.primary ?? "#22c55e"}50`,
              }}
              data-testid="card-result-image"
            >
              <img
                src={displayImage!}
                alt="Retrato mundialista"
                className={`h-full w-full ${isMobile ? "object-contain bg-black" : "object-cover"}`}
                data-testid="img-result"
              />
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg bg-black/50 border border-white/15 p-3 sm:w-auto backdrop-blur-sm">
              <img src={qrGallery} alt="QR Galería" className="h-20 w-20 sm:h-24 sm:w-24" data-testid="img-qr-gallery" />
              <p className="text-center text-[10px] text-white/50">Escanea para ver<br />todas las fotos</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action strip — style matches flyer promo band */}
      <div className="w-full bg-black/75 border-t border-green-500/40 backdrop-blur-sm">
        <div className="flex items-stretch divide-x divide-white/15 max-w-sm mx-auto">
          {!hasError && (
            <>
              <button
                className="flex-1 flex flex-col items-center gap-1 px-1 py-2.5 hover:bg-white/5 transition-colors"
                onClick={handleDownload}
                data-testid="button-download"
              >
                <div className="promo-badge rounded-sm px-1.5 py-0.5 mb-0.5">
                  <span className="text-[8px] font-black text-white uppercase tracking-wider leading-none">ACCIÓN</span>
                </div>
                <Download className="h-5 w-5 text-white" />
                <span className="text-[9px] font-bold text-white uppercase text-center leading-tight tracking-wide">
                  DESCARGAR
                </span>
              </button>
              <button
                className="flex-1 flex flex-col items-center gap-1 px-1 py-2.5 hover:bg-white/5 transition-colors"
                onClick={handleShare}
                data-testid="button-share"
              >
                <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-sm px-1.5 py-0.5 mb-0.5 border border-green-400/30">
                  <span className="text-[8px] font-black text-white uppercase tracking-wider leading-none">ACCIÓN</span>
                </div>
                <Share2 className="h-5 w-5 text-green-400" />
                <span className="text-[9px] font-bold text-green-400 uppercase text-center leading-tight tracking-wide">
                  COMPARTIR
                </span>
              </button>
            </>
          )}
          <button
            className="flex-1 flex flex-col items-center gap-1 px-1 py-2.5 hover:bg-white/5 transition-colors"
            onClick={onRetry}
            data-testid="button-retry"
          >
            <div className="promo-badge rounded-sm px-1.5 py-0.5 mb-0.5">
              <span className="text-[8px] font-black text-white uppercase tracking-wider leading-none">ACCIÓN</span>
            </div>
            <RotateCcw className="h-5 w-5 text-white" />
            <span className="text-[9px] font-bold text-white uppercase text-center leading-tight tracking-wide">
              OTRA<br />VEZ
            </span>
          </button>
          <button
            className="flex-1 flex flex-col items-center gap-1 px-1 py-2.5 hover:bg-white/5 transition-colors"
            onClick={onHome}
            data-testid="button-home"
          >
            <div className="promo-badge rounded-sm px-1.5 py-0.5 mb-0.5">
              <span className="text-[8px] font-black text-white uppercase tracking-wider leading-none">ACCIÓN</span>
            </div>
            <Home className="h-5 w-5 text-white" />
            <span className="text-[9px] font-bold text-white uppercase text-center leading-tight tracking-wide">
              INICIO
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SingleFlowPage() {
  const [, navigate] = useLocation();
  const { currentStep, setCurrentStep, goToNextStep, reset, setCapturedImage, setTransformedImage, setError } = useApp();

  const handleRetry = () => {
    setCapturedImage(null);
    setTransformedImage(null);
    setError(null);
    setCurrentStep("capture");
  };

  const handleHome = () => { reset(); };

  const renderStepContent = () => {
    switch (currentStep) {
      case "intro":    return <IntroContent onContinue={goToNextStep} />;
      case "team":     return <TeamContent onContinue={goToNextStep} />;
      case "capture":  return <CaptureContent onContinue={goToNextStep} />;
      case "processing": return <ProcessingContent onComplete={goToNextStep} />;
      case "result":   return <ResultContent onRetry={handleRetry} onHome={handleHome} />;
      default:         return <IntroContent onContinue={goToNextStep} />;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Stadium photo base */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      {/* Sky-to-grass gradient overlay matching flyer style */}
      <div className="fixed inset-0 stadium-overlay" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header: trophy + centered logo, Real de Palmas style */}
        <header className="flex flex-col items-center pt-4 pb-2 px-4 sm:pt-6">
          <img
            src={trophyImage}
            alt="Copa del Mundial"
            className="h-16 w-auto object-contain drop-shadow-2xl sm:h-20 md:h-24"
            data-testid="img-trophy"
          />
          <img
            src={mileniumLogo}
            alt="Milenium"
            className="mt-1 h-8 w-auto object-contain drop-shadow-lg sm:h-10 md:h-12"
            data-testid="img-milenium-logo"
          />
          <div className="mt-1 h-px w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </header>

        {/* Main title — Real de Palmas style two-line headline */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 pt-3 pb-4 sm:pt-4 sm:pb-5">
          <p className="text-xs font-bold text-white/80 tracking-[0.25em] uppercase drop-shadow-md sm:text-sm">
            TU FOTO IDEAL ESTÁ A
          </p>
          <h1
            className="text-3xl font-black uppercase leading-none tracking-tight stadium-headline-xl sm:text-4xl md:text-5xl"
            data-testid="text-headline"
          >
            UN GOL DE&nbsp;⚽&nbsp;DISTANCIA
          </h1>
        </div>

        <main className="flex flex-1 flex-col items-center justify-start px-2 pb-4 sm:px-4">
          {/* Card: transparent dark panel, no heavy opaque card */}
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-white/15 bg-black/50 backdrop-blur-md shadow-2xl sm:max-w-md md:max-w-2xl lg:max-w-4xl">
            {renderStepContent()}
          </div>
        </main>

        <footer className="py-2 text-center">
          <button
            onClick={() => navigate("/tus-imagenes")}
            className="text-[10px] text-white/15 transition-colors hover:text-white/35"
            data-testid="link-admin"
          >
            Admin
          </button>
        </footer>
      </div>
    </div>
  );
}
