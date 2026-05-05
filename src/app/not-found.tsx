import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-background p-8 text-center">
        <div className="space-y-3">
          <p className="font-display text-5xl font-bold">404</p>
          <h1 className="text-xl">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            We couldn't find the page you were looking for.
          </p>
          <Link
            href="/tr"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
