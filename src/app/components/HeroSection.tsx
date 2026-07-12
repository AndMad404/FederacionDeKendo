import { UpcomingEventsSection } from "./UpcomingEventsSection";
import { PageTitle } from "./PageTitle";

const highPriorityImageProps = { fetchpriority: "high" } as const;
const imageVersion = "v=20260704-0120";

function HeroBanner() {
  return (
    <header className="relative flex h-[clamp(520px,calc(100svh_-_4rem_-_10px),680px)] items-stretch overflow-hidden rounded-2xl sm:rounded-3xl land-sm:h-auto land-sm:min-h-[calc(100svh_-_3rem_-_6px)] tall-md:h-auto tall-md:min-h-[300px] tall-md:flex-1">
      <picture className="absolute inset-0 h-full w-full">
        <source
          srcSet={`/images/hero/kendo-hero-formacion-480.webp?${imageVersion} 480w, /images/hero/kendo-hero-formacion-960.webp?${imageVersion} 960w, /images/hero/kendo-hero-formacion-1500.webp?${imageVersion} 1500w`}
          sizes="100vw"
          type="image/webp"
        />
        <img
          src={`/images/hero/kendo-hero-formacion-1500.webp?${imageVersion}`}
          alt="Grupo de practicantes de kendo reunidos después de una actividad"
          width={1500}
          height={750}
          className="absolute inset-0 h-full w-full object-cover object-center lg:object-[50%_42%]"
          loading="eager"
          {...highPriorityImageProps}
        />
      </picture>

      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

      <div className="relative z-10 flex w-full flex-col justify-between gap-3 px-4 py-4 text-center sm:px-6 land-sm:gap-2 land-sm:px-2 land-sm:py-2 tall-md:px-10 tall-md:py-4">
        <div className="mx-auto max-w-3xl text-white">
          <PageTitle id="home-title" className="normal-case">
            KENDO
            <span className="hidden sm:inline"> - </span>
            <br className="sm:hidden" />
            EL CAMINO DE LA ESPADA
          </PageTitle>
        </div>

        <div className="mx-auto flex max-w-2xl flex-col items-center gap-1 rounded-2xl border border-blue-500/70 bg-black/70 px-3 py-3 text-white">
          <h2 className="max-w-sm text-lg leading-snug sm:max-w-md tall-md:leading-relaxed">
            <b>
              La Federación de Asociaciones de Kendo
            </b>
            &nbsp;te invita a descubrir este arte marcial japonés.
            <br />
            Clases para todos los niveles y edades.
          </h2>
        </div>
      </div>
    </header>
  );
}

export function HeroSection() {
  return (
    <section
      aria-labelledby="home-title"
      className="tall-md:flex tall-md:h-full tall-md:flex-col tall-md:overflow-y-auto"
    >
      <HeroBanner />
      <UpcomingEventsSection />
    </section>
  );
}
