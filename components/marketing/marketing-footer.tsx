import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { LinkedinIcon, InstagramIcon, FacebookIcon, WhatsappIcon } from "@/components/shared/social-icons";

const CREATOR_NAME = "Youssef Kheir Allah";
const SOCIAL_LINKS = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/gen-hex-0158bb431/", Icon: LinkedinIcon },
  { name: "Instagram", href: "https://www.instagram.com/gen_hex0", Icon: InstagramIcon },
  { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61593995577602", Icon: FacebookIcon },
  { name: "WhatsApp", href: "https://wa.me/201149078874", Icon: WhatsappIcon },
];

export async function MarketingFooter() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <Logo height={40} />
        <nav className="flex items-center gap-6">
          <Link href="/courses" className="hover:text-foreground">
            {isAr ? "الدورات" : "Courses"}
          </Link>
          <Link href="/sign-in" className="hover:text-foreground">
            {isAr ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {SOCIAL_LINKS.map(({ name, href, Icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              className="text-muted-foreground transition-colors hover:text-[#00BCC8]"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} GENHEX</p>
          <p>
            {isAr ? "تم الإنشاء بواسطة " : "Created by "}
            <span className="font-medium text-foreground">{CREATOR_NAME}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
