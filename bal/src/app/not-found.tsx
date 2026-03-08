import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl px-4 py-16">
      <Card className="w-full p-8 text-center">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">404</div>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-3 text-slate-600">The requested page does not exist in the current league app.</p>
        <div className="mt-6">
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
