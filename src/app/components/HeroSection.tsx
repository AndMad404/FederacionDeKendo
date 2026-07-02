const highPriorityImageProps = { fetchpriority: "high" } as const;

function HeroBanner() {
  return (
    <header className="relative flex h-[clamp(520px,calc(100svh_-_4rem_-_10px),680px)] items-stretch overflow-hidden rounded-2xl sm:rounded-3xl [@media_(orientation:landscape)_and_(max-height:480px)]:h-[calc(100svh_-_3rem_-_6px)] [@media_(min-width:768px)_and_(min-height:640px)]:h-full [@media_(min-width:768px)_and_(min-height:640px)]:min-h-0">
      <picture className="absolute inset-0 h-full w-full">
        <source
          srcSet="/images/gallery/thumbs/kendo-gallery-08-480.webp 480w, /images/gallery/kendo-gallery-08-960.webp 960w, /images/gallery/kendo-gallery-08-1600.webp 1600w"
          sizes="100vw"
          type="image/webp"
        />
        <img
          src="/images/gallery/kendo-gallery-08.jpg"
          alt="Kendo en el dojo"
          width={1600}
          height={1201}
          className="absolute inset-0 h-full w-full object-cover object-[center_70%] [@media_(orientation:portrait)_and_(max-width:767px)]:h-[125%] [@media_(orientation:portrait)_and_(max-width:767px)]:-translate-y-[20%] [@media_(orientation:portrait)_and_(max-width:767px)]:object-[56%]"
          loading="eager"
          {...highPriorityImageProps}
        />
      </picture>

      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

      <div className="relative z-10 flex w-full flex-col justify-between gap-3 px-4 py-4 text-center sm:px-6 [@media_(orientation:landscape)_and_(max-height:480px)]:gap-2 [@media_(orientation:landscape)_and_(max-height:480px)]:px-2 [@media_(orientation:landscape)_and_(max-height:480px)]:py-2 [@media_(min-width:768px)_and_(min-height:640px)]:px-10 [@media_(min-width:768px)_and_(min-height:640px)]:py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-blue-500/70 bg-black/70 px-3 py-3 shadow-2xl sm:px-5 [@media_(orientation:landscape)_and_(max-height:480px)]:px-2 [@media_(orientation:landscape)_and_(max-height:480px)]:pt-px [@media_(orientation:landscape)_and_(max-height:480px)]:pb-1 [@media_(min-width:768px)_and_(min-height:640px)]:rounded-3xl [@media_(min-width:768px)_and_(min-height:640px)]:px-10 [@media_(min-width:768px)_and_(min-height:640px)]:py-5">
          <h1
            id="home-title"
            className="text-xl font-bold leading-tight tracking-wide text-white sm:text-2xl [@media_(min-width:768px)_and_(min-height:640px)]:text-[clamp(1.5rem,4vw,2.75rem)]"
          >
            FEDERACIÓN DE ASOCIACIONES DE KENDO
          </h1>
        </div>

        <div className="mx-auto flex max-w-2xl flex-col items-center gap-1 rounded-2xl border border-blue-500/70 bg-black/70 px-3 py-3 shadow-2xl sm:px-5 [@media_(orientation:landscape)_and_(max-height:480px)]:px-2 [@media_(orientation:landscape)_and_(max-height:480px)]:pt-px [@media_(orientation:landscape)_and_(max-height:480px)]:pb-1 [@media_(min-width:768px)_and_(min-height:640px)]:rounded-3xl [@media_(min-width:768px)_and_(min-height:640px)]:px-10 [@media_(min-width:768px)_and_(min-height:640px)]:py-5">
          <h2 className="text-lg font-semibold leading-tight tracking-tight text-white sm:text-xl [@media_(min-width:768px)_and_(min-height:640px)]:text-[clamp(1.25rem,3vw,2rem)]">
            EL CAMINO DE LA ESPADA
            <br />
            剣道
          </h2>

          <p className="max-w-sm text-sm leading-snug text-white sm:max-w-md [@media_(min-width:768px)_and_(min-height:640px)]:text-base [@media_(min-width:768px)_and_(min-height:640px)]:leading-relaxed">
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
    <section
      aria-labelledby="home-title"
      className="[@media_(min-width:768px)_and_(min-height:640px)]:h-full"
    >
      <HeroBanner />
    </section>
  );
}
