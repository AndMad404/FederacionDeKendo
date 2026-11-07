import { Link } from "react-router";
import { UpcomingEventsSection } from "./UpcomingEventsSection";
import { PageTitle } from "./PageTitle";
import {
  actionControlSurfaceClass,
  textButtonInteractionClass,
} from "../styles/shared";
import { useLanguage } from "../config/i18n";

const imageVersion = "v=20260704-0120";
const heroActionClass = `control-primary inline-flex min-h-11 min-w-0 items-center justify-center rounded-full border px-2 py-2 text-sm font-bold leading-snug text-center sm:shrink-0 sm:whitespace-nowrap sm:px-3 md:px-5 md:text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-site-on-dark ${textButtonInteractionClass}`;
const heroSecondaryActionClass = `${heroActionClass} border-site-on-dark/70 bg-site-navy/80 text-site-on-dark hover:border-site-surface hover:bg-site-surface hover:text-site-navy`;

function HeroBanner() {
  const { copy } = useLanguage();
  return (
    <header className="relative my-2 flex h-[clamp(520px,calc(100svh_-_4rem_-_10px),680px)] items-stretch overflow-hidden rounded-xl land-sm:h-auto land-sm:min-h-[calc(100svh_-_3rem_-_6px)] tall-md:h-auto tall-md:min-h-[230px] tall-md:flex-1 tablet-fit:h-[348px] tablet-fit:min-h-0 tablet-fit:flex-none">
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
        <div className="mx-auto flex min-h-[28rem] w-full max-w-3xl flex-col justify-between text-site-on-dark md:min-h-[20rem] md:justify-around land-sm:mx-0 land-sm:block land-sm:min-h-0 land-tall:mx-0">
          <PageTitle
            id="home-title"
            tone="media"
            density="flush"
            decoration="none"
            casing="normal"
            className="mx-auto max-w-xl text-3xl sm:text-4xl land-sm:mx-0 land-sm:text-left land-tall:mx-0 land-tall:text-left"
            allowWrap
          >
            {copy.home.title}
          </PageTitle>
          <p className="mx-auto max-w-xl text-lg font-bold leading-snug sm:text-xl land-sm:mx-0 land-sm:mt-5 land-tall:mx-0">
            {copy.home.lead}
          </p>
          <p className="mx-auto max-w-xl leading-relaxed text-site-subtle land-sm:mx-0 land-sm:mt-3 land-tall:mx-0">
            {copy.home.description}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-nowrap sm:justify-center sm:gap-3 land-sm:mt-5 land-sm:justify-start land-tall:justify-start">
            <Link
              to={copy.nav.links[3].path}
              className={heroSecondaryActionClass}
            >
              {copy.home.dojos}
            </Link>
            <Link
              to={copy.nav.links[1].path}
              className={`${heroActionClass} ${actionControlSurfaceClass} hover:border-site-on-dark/70 hover:bg-site-action hover:text-site-on-dark`}
            >
              {copy.home.events}
            </Link>
            <Link to="/eventos/pasados/" className={heroSecondaryActionClass}>
              {copy.archive.title}
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
