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
    <header className="relative my-2 flex h-[clamp(520px,calc(100svh_-_4rem_-_10px),680px)] items-stretch overflow-hidden rounded-xl land-sm:h-auto land-sm:min-h-[calc(100svh_-_3rem_-_6px)] tall-md:h-auto tall-md:min-h-[230px] tall-md:flex-1 tablet-fit:min-h-[348px]">
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
        className="absolute inset-0 bg-linear-to-b from-site-navy/30 to-site-navy/38 md:from-site-navy/26 md:to-site-navy/34"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-site-navy/53 xl:max-[1600px]:bg-site-navy/76 [mask-image:radial-gradient(ellipse_92%_82%_at_var(--hero-shade-x,50%)_50%,black_0%,#000c_36%,#0005_72%,transparent_100%)] xl:[mask-image:radial-gradient(ellipse_48rem_82%_at_var(--hero-shade-x,50%)_50%,black_0%,#000c_36%,#0005_72%,transparent_100%)] land-sm:max-md:[--hero-shade-x:35%]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-3 text-center md:max-xl:items-stretch land-sm:max-md:text-left">
        <div className="mx-auto flex min-h-[28rem] w-full max-w-3xl flex-col justify-between text-site-on-dark md:min-h-0 md:justify-around md:max-xl:gap-3 md:max-xl:py-5 page-fit:gap-3 land-sm:max-md:mx-0 land-sm:max-md:block land-sm:max-md:min-h-0">
          <PageTitle
            id="home-title"
            tone="media"
            density="flush"
            decoration="none"
            casing="normal"
            className="mx-auto max-w-xl text-3xl sm:text-4xl md:max-w-none md:-translate-y-3 land-sm:max-md:mx-0 land-sm:max-md:text-left"
            allowWrap
          >
            {copy.home.title}
          </PageTitle>
          <div className="mx-auto grid w-full max-w-xl gap-3 text-center [&>p]:text-xl [&>p]:font-normal [&>p]:leading-snug land-sm:max-md:mx-0 land-sm:max-md:mt-5">
            <p>{copy.home.lead}</p>
            <p>{copy.home.description}</p>
          </div>
          <div className="mx-auto grid w-full max-w-64 gap-2 sm:flex sm:max-w-none sm:flex-nowrap sm:justify-center sm:gap-3 land-sm:max-md:mt-5 land-sm:max-md:justify-start">
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
