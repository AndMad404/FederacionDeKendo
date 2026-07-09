import { UpcomingEventsSection } from "./UpcomingEventsSection";

const highPriorityImageProps = { fetchpriority: "high" } as const;
const imageVersion = "v=20260704-0120";

function HeroBanner() {
  return (
    <header className="relative flex h-[clamp(520px,calc(100svh_-_4rem_-_10px),680px)] items-stretch overflow-hidden rounded-2xl sm:rounded-3xl [@media_(orientation:landscape)_and_(max-height:640px)]:h-auto [@media_(orientation:landscape)_and_(max-height:640px)]:min-h-[calc(100svh_-_3rem_-_6px)] [@media_(min-width:768px)_and_(min-height:640px)]:h-auto [@media_(min-width:768px)_and_(min-height:640px)]:min-h-[300px] [@media_(min-width:768px)_and_(min-height:640px)]:flex-1">
      <picture className="absolute inset-0 h-full w-full">
        <source
          srcSet={`/images/hero/kendo-hero-formacion-480.webp?${imageVersion} 480w, /images/hero/kendo-hero-formacion-960.webp?${imageVersion} 960w, /images/hero/kendo-hero-formacion-1500.webp?${imageVersion} 1500w`}
          sizes="100vw"
          type="image/webp"
        />
        <img
          src={`/images/hero/kendo-hero-formacion-1500.webp?${imageVersion}`}
          alt="Grupo de practicantes de kendo reunidos despues de una actividad"
          width={1500}
          height={750}
          className="absolute inset-0 h-full w-full object-cover object-center lg:object-[50%_42%]"
          loading="eager"
          {...highPriorityImageProps}
        />
      </picture>

      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

      <div className="relative z-10 flex w-full flex-col justify-between gap-3 px-4 py-4 text-center sm:px-6 [@media_(orientation:landscape)_and_(max-height:640px)]:gap-2 [@media_(orientation:landscape)_and_(max-height:640px)]:px-2 [@media_(orientation:landscape)_and_(max-height:640px)]:py-2 [@media_(min-width:768px)_and_(min-height:640px)]:px-10 [@media_(min-width:768px)_and_(min-height:640px)]:py-4">
        <div className="mx-auto max-w-3xl rounded-2xl border border-blue-500/70 bg-black/70 p-3">
          <h1
            id="home-title"
            className="text-lg font-bold leading-tight tracking-wide text-white sm:text-xl [@media_(min-width:768px)_and_(min-height:640px)]:text-[clamp(1.25rem,3vw,2rem)]"
          >
            KENDO
            <span className="hidden sm:inline"> - </span>
            <br className="sm:hidden" />
            EL CAMINO DE LA ESPADA
          </h1>
        </div>

        <div className="mx-auto flex max-w-2xl flex-col items-center gap-1 rounded-2xl border border-blue-500/70 bg-black/70 px-3 py-3">
          <h2 className="text-lg font-semibold leading-tight tracking-tight text-white sm:text-xl [@media_(min-width:768px)_and_(min-height:640px)]:text-[clamp(1.25rem,3vw,2rem)]">

          </h2>

          <p className="max-w-sm text-lg leading-snug text-white sm:max-w-md [@media_(min-width:768px)_and_(min-height:640px)]:text-lg [@media_(min-width:768px)_and_(min-height:640px)]:leading-relaxed">
            <b>
              La Federacion de asociaciones de kendo 
            </b> 
              &nbsp;te invita a descubrir este arte marcial japonés.
            <br />
              Clases para todos los niveles y edades.
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
      className="[@media_(min-width:768px)_and_(min-height:640px)]:flex [@media_(min-width:768px)_and_(min-height:640px)]:h-full [@media_(min-width:768px)_and_(min-height:640px)]:flex-col [@media_(min-width:768px)_and_(min-height:640px)]:overflow-y-auto"
    >
      <HeroBanner />
      <UpcomingEventsSection />
    </section>
  );
}
