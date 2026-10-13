import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { siteMeta } from "@/lib/site-meta";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: siteMeta({
      title: "Hackathon videos — FOLIO",
      description:
        "Download FOLIO pitch and demo videos for Colosseum World's Fair.",
      path: "/videos",
    }),
  }),
  component: Page,
});

const FILES = [
  {
    id: "pitch",
    title: "Pitch video",
    duration: "1:11",
    href: "/videos/FOLIO-pitch.mp4",
    filename: "FOLIO-pitch.mp4",
    note: "Founder intro · ≤2 min · upload as Pitch video",
  },
  {
    id: "demo",
    title: "Demo video",
    duration: "1:37",
    href: "/videos/FOLIO-demo.mp4",
    filename: "FOLIO-demo.mp4",
    note: "Live product walkthrough · ≤3 min · upload as Demo video",
  },
] as const;

function Page() {
  return (
    <PublicShell
      tone="network"
      eyebrow="World's Fair"
      title="Download pitch & demo"
      intro="Unlisted YouTube or Loom uploads for the Colosseum form. Preview here, then download the MP4s."
    >
      <div className="fx-video-dl">
        {FILES.map((f) => (
          <article key={f.id} className="fx-video-dl-item">
            <header className="fx-video-dl-head">
              <h2>{f.title}</h2>
              <p>
                {f.duration} · {f.note}
              </p>
            </header>
            <video
              className="fx-video-dl-player"
              controls
              playsInline
              preload="metadata"
              src={f.href}
            >
              <track kind="captions" />
            </video>
            <div className="fx-video-dl-actions">
              <a
                className="fx-btn fx-btn-primary"
                href={f.href}
                download={f.filename}
              >
                Download {f.filename}
              </a>
              <a className="fx-btn" href={f.href} target="_blank" rel="noreferrer">
                Open file
              </a>
            </div>
          </article>
        ))}
        <p className="fx-video-dl-foot">
          Form fields: Demo video + Pitch video · Live product{" "}
          <Link to="/">folio-tawny-one.vercel.app</Link> ·{" "}
          <Link to="/network">Network</Link>
        </p>
      </div>
    </PublicShell>
  );
}
