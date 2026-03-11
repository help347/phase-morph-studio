import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import phase1 from "@/assets/phase1.jpg";
import phase2 from "@/assets/phase2.jpg";
import phase3 from "@/assets/phase3.jpg";
import phase4 from "@/assets/phase4.jpg";

interface Phase {
  src: string;
  label: string;
}

const defaultPhases: Phase[] = [
  { src: phase1, label: "Site Preparation" },
  { src: phase2, label: "Foundation" },
  { src: phase3, label: "Structural Framing" },
  { src: phase4, label: "Completed" },
];

const PhaseViewer = () => {
  const [phases, setPhases] = useState<Phase[]>(defaultPhases);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastScrollRef = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= phases.length || index === currentIndex || isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setProgress(index / (phases.length - 1));
      setTimeout(() => setIsTransitioning(false), 800);
    },
    [currentIndex, isTransitioning, phases.length]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  // Scroll navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastScrollRef.current < 900) return;
      lastScrollRef.current = now;
      if (e.deltaY > 0) goNext();
      else goPrev();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [goNext, goPrev]);

  // Touch navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 40) return;
      if (absDy > absDx) {
        dy < 0 ? goNext() : goPrev();
      } else {
        dx < 0 ? goNext() : goPrev();
      }
      touchStartRef.current = null;
    };
    const onMove = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchmove", onMove);
    };
  }, [goNext, goPrev]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") goNext();
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhases: Phase[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newPhases.push({ src: url, label: file.name.replace(/\.[^.]+$/, "") });
    });
    setPhases((prev) => [...prev, ...newPhases]);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden select-none"
      style={{ background: "hsl(var(--overlay-dark))" }}
    >
      {/* Images stack */}
      {phases.map((phase, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-all duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            opacity: i === currentIndex ? 1 : 0,
            transform: i === currentIndex ? "scale(1)" : "scale(1.05)",
            zIndex: i === currentIndex ? 1 : 0,
          }}
        >
          <img
            src={phase.src}
            alt={phase.label}
            className="w-full h-full object-contain md:object-cover"
          />
        </div>
      ))}

      {/* Vignette + grain */}
      <div className="absolute inset-0 vignette-mobile md:vignette pointer-events-none z-[2]" />
      <div className="absolute inset-0 film-grain pointer-events-none z-[2]" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 md:p-6">
        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-shadow-heavy text-foreground font-['Space_Grotesk']">
          Construction Timeline
        </h1>
        <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-secondary/80 backdrop-blur-sm border border-border hover:bg-secondary transition text-sm text-secondary-foreground">
          <Upload size={16} />
          <span className="hidden sm:inline">Upload</span>
          <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {/* Phase info - bottom left */}
      <div
        className="absolute bottom-16 md:bottom-12 left-4 md:left-8 z-10 transition-all duration-500"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? "translateY(20px)" : "translateY(0)",
        }}
      >
        <div className="bg-background/60 backdrop-blur-md rounded-xl px-4 py-3 md:px-6 md:py-4 border border-border/50">
          <p className="text-xs md:text-sm font-mono text-primary tracking-widest uppercase">
            Phase {currentIndex + 1} / {phases.length}
          </p>
          <h2 className="text-xl md:text-3xl font-bold text-foreground mt-1 text-shadow-heavy">
            {phases[currentIndex].label}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1 w-24 md:w-40 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${(progress) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Transforming indicator */}
      {isTransitioning && (
        <div className="absolute bottom-16 md:bottom-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-background/60 backdrop-blur-md rounded-full px-4 py-2 border border-primary/30">
          <Loader2 size={16} className="animate-spin text-primary" />
          <span className="text-sm text-primary font-mono tracking-wider">Transforming</span>
        </div>
      )}

      {/* Vertical timeline - right side */}
      <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10">
        <div className="bg-background/40 backdrop-blur-xl rounded-2xl border border-border/40 px-3 py-4 md:px-4 md:py-6 flex flex-col items-center">
          {phases.map((phase, i) => (
            <div key={i} className="flex flex-col items-center">
              <button
                onClick={() => goTo(i)}
                className="group relative flex items-center gap-3 cursor-pointer"
              >
                {/* Dot with ring */}
                <div className="relative">
                  <div
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full transition-all duration-500 ${
                      i === currentIndex
                        ? "bg-primary phase-glow scale-110"
                        : i < currentIndex
                        ? "bg-primary/70"
                        : "bg-muted-foreground/25"
                    }`}
                  />
                  {i === currentIndex && (
                    <div className="absolute -inset-1.5 rounded-full border border-primary/40 animate-pulse" />
                  )}
                </div>

                {/* Label - always visible on desktop, hover on mobile */}
                <div
                  className={`absolute right-8 md:right-10 whitespace-nowrap transition-all duration-300 ${
                    i === currentIndex
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 md:group-hover:opacity-100 translate-x-2 md:group-hover:translate-x-0"
                  }`}
                >
                  <div className="bg-background/70 backdrop-blur-md rounded-lg px-3 py-1.5 border border-border/50 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono tracking-wider uppercase ${
                        i === currentIndex ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="w-px h-3 bg-border/60" />
                    <span
                      className={`text-xs md:text-sm font-medium ${
                        i === currentIndex ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {phase.label}
                    </span>
                  </div>
                </div>
              </button>

              {/* Connector */}
              {i < phases.length - 1 && (
                <div className="relative w-[2px] h-6 md:h-8 my-1">
                  <div className="absolute inset-0 bg-muted-foreground/15 rounded-full" />
                  <div
                    className="absolute top-0 left-0 w-full rounded-full transition-all duration-700 bg-primary"
                    style={{
                      height: i < currentIndex ? "100%" : "0%",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom scroll hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-muted-foreground text-xs font-mono tracking-wider opacity-60">
        <span className="hidden md:inline">Scroll or use arrow keys</span>
        <span className="md:hidden">Swipe to navigate</span>
      </div>
    </div>
  );
};

export default PhaseViewer;
