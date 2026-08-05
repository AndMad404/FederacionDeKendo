import { focusRingClass } from "../styles/shared";
import { useLanguage } from "../config/i18n";

export function Footer() {
  const { copy } = useLanguage();
  return (
    <footer className="bg-site-navy text-site-on-dark">
      <div className="mx-auto grid max-w-6xl grid-cols-1 justify-items-center gap-5 p-2.5 text-center md:grid-cols-2 md:gap-10">
        <section
          aria-labelledby="footer-purpose-title"
          className="flex max-w-md flex-col items-center gap-3 md:gap-2"
        >
          <h2
            id="footer-purpose-title"
            className="flex items-baseline gap-1 text-lg font-extrabold tracking-widest"
          >
            {copy.footer.purposeTitle}{" "}
            <span className="text-lg font-bold text-site-accent-on-dark">
              KENDO
            </span>
          </h2>
          <p className="leading-relaxed">
            {copy.footer.purpose}
          </p>
        </section>

        <section
          aria-labelledby="footer-contact-title"
          className="flex max-w-md flex-col items-center gap-3 md:gap-2"
        >
          <h2
            id="footer-contact-title"
            className="text-center text-lg font-bold tracking-wide"
          >
            {copy.footer.contacts}
          </h2>
          <ul className="flex flex-col gap-1 text-base">
            <li>
              <a
                className={`underline-offset-4 hover:text-site-accent-soft hover:underline ${focusRingClass}`}
                href="mailto:secretaria.fedekendo@outlook.com"
              >
                secretaria.fedekendo@outlook.com
              </a>
            </li>
          </ul>
        </section>
      </div>
      <div className="px-4 pb-4 md:pb-3">
        <p className="text-center text-xs text-site-on-dark/50">
          <span>{copy.footer.copyright}</span>{" "}
          <span className="block sm:inline">{copy.footer.rights}</span>
        </p>
      </div>
    </footer>
  );
}
