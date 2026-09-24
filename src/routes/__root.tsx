import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportRuntimeError } from "../lib/runtime-error-reporting";
import { CookieConsentBanner } from "@/components/cookie-consent";
import { ConsentAnalytics } from "@/components/consent-analytics";
import { FolioMark } from "@/components/folio-brand";
import { siteMeta } from "@/lib/site-meta";

function NotFoundComponent() {
  return (
    <div className="error-screen">
      <div className="error-screen-card">
        <FolioMark className="error-screen-mark" />
        <p className="error-screen-code">404</p>
        <h1>Page not found</h1>
        <p>That link doesn’t exist — or it moved. Head back to the desk.</p>
        <div className="error-screen-actions">
          <Link to="/desk" className="error-btn-primary">
            Open desk
          </Link>
          <Link to="/" className="error-btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportRuntimeError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="error-screen">
      <div className="error-screen-card">
        <FolioMark className="error-screen-mark" />
        <h1>This page didn’t load</h1>
        <p>Something went wrong on our end. Try again or go home.</p>
        <div className="error-screen-actions">
          <button
            type="button"
            className="error-btn-primary"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a href="/" className="error-btn-secondary">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0EA5C9" },
      { name: "author", content: "Henry Sam Marfo" },
      ...siteMeta(),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/folio-mark.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "apple-touch-icon", href: "/folio-mark.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <CookieConsentBanner />
      <ConsentAnalytics />
    </QueryClientProvider>
  );
}
