import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted px-4 py-12">
      <Link href="/">
        <Logo height={52} />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
