  import type { Page } from "../types";

  interface HeroSectionProps {
    onNavigate: (page: Page) => void;
  }

  function HeroBanner() {
    return (
      <header
        className="relative flex items-center justify-center"
        style={{ minHeight: "calc(80svh)" }}
      >
        <picture className="absolute inset-0 w-full h-full">
          <img
            src="https://images.unsplash.com/photo-1763905720991-0ce68f551743?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxrZW5kbyUyMG1hcnRpYWwlMjBhcnRzJTIwamFwYW5lc2UlMjBzd29yZHxlbnwxfHx8fDE3ODAxMDAzODB8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Kendo en el dojo"
            className="absolute inset-0 w-full h-full object-cover rounded-3xl"
            loading="eager"
          />
        </picture>

        <div className="relative z-10 text-center px-4 sm:px-6 py-8 sm:py-6 max-w-2xl  flex flex-col items-center gap-4 sm:gap-4 bg-black/40 rounded-4xl">
          <h1 className="text-xs tracking-[0.25em] sm:tracking-[0.3em] text-red-400">
            FEDERACIÓN DE KENDO COSTA RICA
            <br />
            剣道
            <br />
            EL CAMINO DE LA ESPADA
          </h1>

          <h2 className="text-white leading-tight text-[clamp(1.7rem,5vw,3.8rem)] font-bold tracking-tight">
            Disciplina, Honor y Maestría
          </h2>

          <p className="text-white text-sm sm:text-base max-w-sm sm:max-w-md leading-relaxed">
            Únete a nuestra comunidad y descubre el arte marcial japonés del kendo.
            <br />
            Clases para todos los niveles, de principiante a dan avanzado.
          </p>
        </div>
      </header>
    );
  }

  export function HeroSection(_props: HeroSectionProps) {
    return (
      <main>
        <HeroBanner />
      </main>
    );
  }