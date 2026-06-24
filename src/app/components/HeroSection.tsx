function HeroBanner() {
  return (
    <header className="relative flex min-h-[80svh] items-stretch overflow-hidden rounded-3xl">
      <picture className="absolute inset-0 h-full w-full">
        <source srcSet="/images/gallery/kendo-gallery-08.webp" type="image/webp" />
        <img
          src="/images/gallery/kendo-gallery-08.jpg"
          alt="Kendo en el dojo"
          width={1600}
          height={1201}
          className="absolute inset-0 h-full w-full object-cover object-[center_70%]"
          loading="eager"
          fetchpriority="high"
        />
      </picture>

      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

      <div className="relative z-10 flex w-full flex-col justify-between px-4 py-8 text-center sm:px-6 md:px-10 md:py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-blue-500/70 bg-black/70 px-4 py-5 shadow-2xl sm:px-8 md:px-10">
          <h1 className="text-[clamp(1.5rem,4vw,2.75rem)] font-bold leading-tight tracking-wide text-white">
            FEDERACIÓN DE ASOCIACIONES DE KENDO
          </h1>
        </div>

        <div className="mx-auto flex max-w-2xl flex-col items-center gap-1 rounded-3xl border border-blue-500/70 bg-black/70 px-4 py-5 shadow-2xl sm:px-8 md:px-10">
          <h2 className="text-[clamp(1.25rem,3vw,2rem)] font-semibold leading-tight tracking-tight text-white">
            EL CAMINO DE LA ESPADA
            <br />
            剣道           
          </h2>

          <p className="max-w-sm text-sm leading-relaxed text-white sm:max-w-md sm:text-base">
            Únete a nuestra comunidad y descubre este arte marcial japonés.
            <br />
            Clases para todos los niveles, de principiante a dan avanzado.
          </p>
        </div>
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
