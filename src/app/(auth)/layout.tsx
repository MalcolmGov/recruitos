import { Flame } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
          <Flame className="size-4" />
        </span>
        RecruitOS
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
