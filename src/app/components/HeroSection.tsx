import type { Page } from "../types";

interface HeroSectionProps {
  onNavigate: (page: Page) => void;
}

function HeroBanner() {
  return (
    <section
      className="relative flex items-center justify-center"
      style={{ minHeight: "calc(70svh)" }}
    >
      <picture className="absolute inset-0 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1763905720991-0ce68f551743?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxrZW5kbyUyMG1hcnRpYWwlMjBhcnRzJTIwamFwYW5lc2UlMjBzd29yZHxlbnwxfHx8fDE3ODAxMDAzODB8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Kendo en el dojo"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-stone-950/10 to-stone-950" />

        <div className="relative z-10 w-full text-center text-white px-4 sm:px-6 py-12 sm:py-16 max-w-2xl mx-auto flex flex-col items-center gap-4 sm:gap-6">
        <p className="text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-red-400">
          剣道 — El camino de la espada
        </p>

        <h1 className="text-white leading-tight text-[clamp(1.7rem,5vw,3.8rem)] font-bold tracking-tight">
          Disciplina, Honor y Maestría
        </h1>

        <p className="text-gray-300 text-sm sm:text-base max-w-sm sm:max-w-md leading-relaxed">
          Únete a nuestra comunidad y descubre el arte marcial
          japonés del kendo. Clases para todos los niveles, de
          principiante a dan avanzado.
        </p>
      </div>
    </section>
  );
}

export function HeroSection(_props: HeroSectionProps) {
  return (
    <main className="pt-16 bg-stone-950">
      <HeroBanner />
    </main>
  );
}