import { Link } from "react-router";
import { UpcomingEventsSection } from "./UpcomingEventsSection";
import { PageTitle } from "./PageTitle";
import {
  focusRingClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../styles/shared";
import { useLanguage } from "../config/i18n";

const imageVersion = "v=20260704-0120";

function HeroBanner() {
  const { copy } = useLanguage();
  return (
    <header className="relative my-2 flex h-[clamp(520px,calc(100svh_-_4rem_-_10px),680px)] items-stretch overflow-hidden rounded-xl land-sm:h-auto land-sm:min-h-[calc(100svh_-_3rem_-_6px)] tall-md:h-auto tall-md:min-h-[230px] tall-md:flex-1">
      <picture className="absolute inset-0">
        <source
          srcSet={`/images/hero/kendo-hero-formacion-480.webp?${imageVersion} 480w, /images/hero/kendo-hero-formacion-960.webp?${imageVersion} 960w, /images/hero/kendo-hero-formacion-1500.webp?${imageVersion} 1500w`}
          sizes="100vw"
          type="image/webp"
        />
        <img
          src={`/images/hero/kendo-hero-formacion-1500.webp?${imageVersion}`}
          alt={copy.home.heroAlt}
          width={1500}
          height={750}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          fetchpriority="high"
        />
      </picture>

      <div
        className="absolute inset-0 bg-gradient-to-r from-site-navy/85 via-site-navy/60 to-site-navy/30"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-3 text-center land-sm:text-left land-tall:text-left">
        <div className="mx-auto flex min-h-[28rem] max-w-xl flex-col justify-between text-site-on-dark md:min-h-[20rem] md:justify-around land-sm:mx-0 land-sm:block land-sm:min-h-0 land-tall:mx-0">
          <PageTitle
            id="home-title"
            tone="media"
            density="flush"
            decoration="none"
            casing="normal"
            className="mx-auto text-3xl sm:text-4xl land-sm:mx-0 land-sm:text-left land-tall:mx-0 land-tall:text-left"
            allowWrap
          >
            {copy.home.title}
          </PageTitle>
          <p className="text-lg font-bold leading-snug sm:text-xl land-sm:mt-5">
            {copy.home.lead}
          </p>
          <p className="leading-relaxed text-site-subtle land-sm:mt-3">
            {copy.home.description}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row land-sm:mt-5 land-sm:justify-start land-tall:justify-start">
            <Link
              to={copy.nav.links[3].path}
              className={`${primaryButtonClass} ${focusRingClass}`}
            >
              {copy.home.dojos}
            </Link>
            <Link
              to={copy.nav.links[1].path}
              className={`${secondaryButtonClass} ${focusRingClass}`}
            >
              {copy.home.events}
            </Link>
          </div>
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
