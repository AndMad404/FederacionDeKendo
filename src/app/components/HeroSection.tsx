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

        <div className="relative z-10 text-center px-4 sm:px-6 py-8 sm:py-6 max-w-2xl flex flex-col items-center gap-4 sm:gap-4 bg-black/40 rounded-4xl">
          <h1 className="text-red-400 leading-tight text-[clamp(1.5rem,4vw,2.75rem)] font-bold tracking-wide">
            FEDERACIÓN DE KENDO COSTA RICA
          </h1>

          <h2 className="text-white leading-tight text-[clamp(1.25rem,3vw,2rem)] font-semibold tracking-tight">
            剣道
            <br />
            EL CAMINO DE LA ESPADA
          </h2>

          <p className="text-white text-sm sm:text-base max-w-sm sm:max-w-md leading-relaxed">
            Únete a nuestra comunidad y descubre este arte marcial japonés.
            <br />
            Clases para todos los niveles, de principiante a dan avanzado.
          </p>
        </div>
      </header>
    );
  }

  export function HeroSection() {
    return (
      <main>
        <HeroBanner />
      </main>
    );
  }
