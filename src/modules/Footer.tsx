import { useState, type FormEvent } from "react";
import {
  FooterBurger,
  FooterFries,
  FooterLogo,
  IconInstagram,
  IconTelegram,
  IconTiktok,
  IconVk,
} from "../assets/images";
import { useI18n } from "../i18n/useI18n";
import { useSettings, useSubscribeNewsletter } from "../api/hooks";

const Footer = () => {
  const { t } = useI18n();
  const { data: settings } = useSettings();
  const subscribe = useSubscribeNewsletter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Links come from the admin Settings page; an icon is shown only when its link is filled in.
  const socials = [
    { name: "Instagram", icon: IconInstagram, href: settings?.instagramUrl },
    { name: "TikTok", icon: IconTiktok, href: settings?.tiktokUrl },
    { name: "Telegram", icon: IconTelegram, href: settings?.telegramUrl },
    { name: "VK", icon: IconVk, href: settings?.vkUrl },
  ].filter((s): s is { name: string; icon: string; href: string } => Boolean(s.href));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || subscribe.isPending) return;
    try {
      await subscribe.mutateAsync(value);
      setEmail("");
      setMessage({ ok: true, text: t("footer.subscribed") });
    } catch {
      setMessage({ ok: false, text: t("footer.subscribeFailed") });
    }
  };

  return (
    <footer className="mt-auto text-white">
      {/* curved top edge: an arc in the footer colour that blends into the body below */}
      <svg
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        aria-hidden
        className="block h-10 w-full fill-[#1F1F1F] md:h-16"
      >
        <path d="M0,64 L0,60 Q720,-28 1440,60 L1440,64 Z" />
      </svg>

      <div className="bg-[#1F1F1F]">
        {/* container keeps the food art close to the content, like the reference */}
        <div className="relative mx-auto max-w-330 px-6 ">
          {/* wrappers hold the centering transform; the images float inside them */}
          <div className="pointer-events-none absolute top-1/2 left-6 hidden w-72 -translate-y-1/2 lg:block">
            <img
              src={FooterBurger}
              alt=""
              aria-hidden
              draggable={false}
              className="w-full select-none will-change-transform motion-safe:animate-float"
            />
          </div>
          <div className="pointer-events-none absolute top-1/2 right-6 hidden w-60 -translate-y-1/2 lg:block">
            <img
              src={FooterFries}
              alt=""
              aria-hidden
              draggable={false}
              className="w-full select-none will-change-transform motion-safe:animate-float"
              style={{ animationDuration: "6s", animationDelay: "-2.2s" }} // offset from the burger so they drift independently
            />
          </div>

          <div className="mx-auto flex max-w-xl flex-col items-center py-20 text-center">
            <img src={FooterLogo} alt="Yumero" className="h-20 w-auto" />

            <p className="mt-8 max-w-lg font-semibold leading-relaxed text-[#e6e6e6]">
              {t("footer.tagline")}
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 flex w-full max-w-sm items-stretch gap-2"
            >
              <label htmlFor="footer-email" className="sr-only">
                {t("footer.email")}
              </label>
              <input
                id="footer-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage(null);
                }}
                placeholder="your@email.com"
                autoComplete="email"
                className="placeholder:font-semibold min-w-0 flex-1 rounded-lg bg-[#3a3a3a] px-4 py-2.5 text-sm text-white outline-none transition-shadow placeholder:text-[#9a9a9a] focus:ring-2 focus:ring-white/40"
              />
              <button
                type="submit"
                disabled={subscribe.isPending}
                className="shrink-0 cursor-pointer rounded-lg bg-[#ff0099] px-5 py-2.5 text-sm font-semibold text-white transition-all  hover:bg-[#ff2bab] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60"
              >
                {t("footer.contact")}
              </button>
            </form>
            {message && (
              <p className={`mt-3 text-sm ${message.ok ? "text-[#77FF00]" : "text-[#ff9b9b]"}`} role="status">
                {message.text}
              </p>
            )}

            {socials.length > 0 && (
            <ul className="mt-10 flex items-center gap-6">
              {socials.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    aria-label={s.name}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md opacity-70 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    <img
                      src={s.icon}
                      alt=""
                      className="size-7"
                      draggable={false}
                    />
                  </a>
                </li>
              ))}
            </ul>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
