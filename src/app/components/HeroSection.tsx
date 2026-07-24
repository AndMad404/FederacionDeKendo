import { Link } from "react-router";
import { UpcomingEventsSection } from "./UpcomingEventsSection";
import { PageTitle } from "./PageTitle";
import {
  focusRingClass,
  panelSurfaceClass,
} from "../styles/shared";

const imageVersion = "v=20260704-0120";

function HeroBanner() {
  return (
    <header className="relative flex h-[clamp(520px,calc(100svh_-_4rem_-_10px),680px)] items-stretch overflow-hidden rounded-3xl land-sm:h-auto land-sm:min-h-[calc(100svh_-_3rem_-_6px)] tall-md:h-auto tall-md:min-h-[230px] tall-md:flex-1">
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
          fetchpriority="high"
        />
      </picture>

      <div className="absolute inset-0 bg-site-overlay/30" aria-hidden="true" />

      <div className="relative z-10 flex w-full flex-col justify-between gap-3 p-4 text-center sm:px-6 land-sm:gap-2 land-sm:px-2 land-sm:py-2 tall-md:px-10 tall-md:py-4">
        <div className="mx-auto max-w-3xl text-site-on-dark">
          <PageTitle id="home-title" className="normal-case" allowWrap>
            Federación de Asociaciones
            <span className="block sm:inline"> de Kendo</span>
          </PageTitle>
        </div>

        <div className={`mx-auto flex max-w-2xl flex-col items-center rounded-2xl p-3 text-site-on-dark ${panelSurfaceClass}`}>
          <h2 className="max-w-sm text-lg leading-snug sm:max-w-md tall-md:leading-relaxed">
            Te invitamos a descubrir este arte marcial japonés.
            <br />
            Clases para todos los niveles y edades.
            <br />
            <Link
              to="/afiliados/"
              className={`inline-flex min-h-11 items-center justify-center font-semibold text-site-action-soft underline decoration-site-action/70 underline-offset-4 transition-colors hover:text-site-accent ${focusRingClass}`}
            >
              Conoce nuestros dojos afiliados
            </Link>
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
