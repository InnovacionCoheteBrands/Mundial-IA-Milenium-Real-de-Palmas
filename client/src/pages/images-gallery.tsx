import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Image as ImageIcon, Home } from "lucide-react";
import { Link } from "wouter";
import { type Transformation, teamInfo, type TeamId } from "@shared/schema";
import backgroundImage from "@assets/bg_stadium_abstract_2.png";
import trophyImage from "@assets/ChatGPT_Image_6_ene_2026,_15_32_44_1767829210783.png";
import mileniumLogo from "@assets/logo_milenium__1767829210784.png";
import realDePalmasLogo from "@assets/image_1781283435018.png";

export default function ImagesGallery() {
  const { data: transformations, isLoading } = useQuery<Transformation[]>({
    queryKey: ["/api/images"],
    refetchOnMount: "always",
    staleTime: 0,
  });

  const handleDownload = (imageUrl: string, id: number, team: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `fan-mundialista-${team}-${id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="fixed inset-0 stadium-overlay" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header: trophy + Real de Palmas + Milenium in a single row */}
        <header className="flex items-center justify-center gap-3 pt-4 pb-2 px-4 sm:pt-6 sm:gap-4">
          <img
            src={trophyImage}
            alt="Copa del Mundial"
            className="h-12 w-auto object-contain drop-shadow-2xl sm:h-14 md:h-16"
            data-testid="img-trophy"
          />
          <div className="h-10 w-px bg-white/20 sm:h-12" />
          <img
            src={realDePalmasLogo}
            alt="Real de Palmas Residencial"
            className="h-10 w-auto object-contain drop-shadow-lg sm:h-14 md:h-16"
            data-testid="img-real-de-palmas-logo"
          />
          <div className="h-10 w-px bg-white/20 sm:h-12" />
          <img
            src={mileniumLogo}
            alt="Milenium"
            className="h-8 w-auto object-contain drop-shadow-lg sm:h-10 md:h-12"
            data-testid="img-milenium-logo"
          />
          <Link href="/" className="absolute right-4 sm:right-6">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 border border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <Home className="h-4 w-4" />
              Inicio
            </Button>
          </Link>
        </header>

        {/* Title */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 pt-2 pb-3">
          <p className="text-[10px] font-bold text-green-400 uppercase tracking-[0.25em] mb-0.5">
            {"\u2014 Galer\u00eda \u2014"}
          </p>
          <h1
            className="text-2xl font-black text-white uppercase tracking-tight drop-shadow-lg sm:text-3xl md:text-4xl stadium-headline-accent"
            data-testid="text-gallery-title"
          >
            {"GALER\u00cdA DE FANS"}
          </h1>
          <p className="text-[10px] text-white/50 mt-0.5 uppercase tracking-widest">
            {"\u26BD Copa del Mundo 2026 \u26BD"}
          </p>
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[16/9] w-full rounded-xl bg-white/10" />
                ))}
              </div>
            ) : !transformations || transformations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full border border-green-500/40 bg-black/40 p-4 mb-4">
                  <ImageIcon className="h-12 w-12 text-green-400" />
                </div>
                <h2
                  className="mb-2 text-xl font-black text-white uppercase tracking-widest"
                  data-testid="text-empty-state"
                >
                  {"SIN IM\u00c1GENES A\u00daN"}
                </h2>
                <p className="text-sm text-white/60">
                  {"Las transformaciones realizadas aparecer\u00e1n aqu\u00ed"}
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-center text-xs text-white/60 uppercase tracking-widest">
                  {transformations.length} {"im\u00e1genes guardadas"}
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {transformations.map((transformation) => {
                    const team = transformation.team as TeamId;
                    const teamData = teamInfo[team];

                    return (
                      <Card
                        key={transformation.id}
                        className="group relative aspect-[16/9] overflow-hidden rounded-xl border border-white/15 bg-black/50 backdrop-blur-sm"
                        data-testid={`card-image-${transformation.id}`}
                      >
                        <img
                          src={transformation.transformedImageUrl}
                          alt={`Fan de ${teamData?.name || team}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />

                        <div className="absolute right-3 top-3 z-10 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-10 w-10 rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
                            onClick={() =>
                              handleDownload(
                                transformation.transformedImageUrl,
                                transformation.id,
                                transformation.team
                              )
                            }
                            data-testid={`button-download-${transformation.id}`}
                          >
                            <Download className="h-6 w-6" />
                          </Button>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                          <p className="text-xs font-bold text-white tracking-wide">
                            {teamData?.name || team}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </main>

        <footer className="py-2 text-center">
          <p className="text-[10px] text-white/20 tracking-wide uppercase">
            {"\u26BD Tecnolog\u00eda de COHETE BRANDS \u26BD"}
          </p>
        </footer>
      </div>
    </div>
  );
}
