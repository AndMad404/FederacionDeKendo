  function HeroBanner() {
    return (
      <header
        className="relative flex items-start justify-center pt-[18svh] sm:pt-[20svh]"
        style={{ minHeight: "calc(80svh)" }}
      >
        <picture className="absolute inset-0 w-full h-full">
          <source srcSet="/images/gallery/kendo-gallery-08.webp" type="image/webp" />
          <img
            src="/images/gallery/kendo-gallery-08.jpg"
            alt="Kendo en el dojo"
            width={1600}
            height={1201}
            className="absolute inset-0 w-full h-full rounded-3xl object-cover object-[center_70%]"
            loading="eager"
            fetchPriority="high"
          />
        </picture>

        <div className="absolute inset-0 rounded-3xl bg-black/30" aria-hidden="true" />

        <div className="relative z-10 text-center px-4 sm:px-6 py-8 sm:py-6 max-w-2xl flex flex-col items-center gap-4 sm:gap-4 bg-black/70 rounded-4xl border border-blue-500">
          <h1 className="text-red-400 leading-tight text-[clamp(1.5rem,4vw,2.75rem)] font-bold tracking-wide">
            FEDERACIÓN DE ASOCIACIONES DE KENDO
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
