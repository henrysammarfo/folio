import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";
import { LabApprovePanel } from "@/components/lab-approve-panel";
import { ShaderBackground, type ShaderLabVariant } from "@/components/lab/shader-background";
import { LAB_SHADER_IDS } from "@/lib/lab-pick";
import { probeShadersApi } from "@/lib/lab/shaders-status";
import {
  isTwentyFirstConfigured,
  searchTwentyFirstComponents,
  type TwentyFirstHit,
} from "@/lib/lab/twentyfirst";

export const Route = createFileRoute("/lab/shaders")({
  head: () => ({
    meta: [
      { title: "Lab · Shaders — FOLIO" },
      {
        name: "description",
        content:
          "Approve-gated shader studies. 21st.dev WebGL plasma + SHADERS_API_KEY probe.",
      },
    ],
  }),
  loader: async () => {
    const [status, shaderSearch] = await Promise.all([
      probeShadersApi(),
      isTwentyFirstConfigured()
        ? searchTwentyFirstComponents(
            "shader background grain noise liquid plasma WebGL",
            6,
          )
        : Promise.resolve({ ok: false as const, reason: "API_KEY_21ST missing" }),
    ]);
    return {
      status,
      twentyFirstConfigured: isTwentyFirstConfigured(),
      shaderHits: shaderSearch.ok ? shaderSearch.hits : ([] as TwentyFirstHit[]),
      shaderNote: shaderSearch.ok
        ? `21st MCP · ${shaderSearch.hits.length} shader hits (WebGL plasma adapted in-lab)`
        : shaderSearch.reason,
    };
  },
  component: Page,
});

const CANDIDATES: Array<{
  id: ShaderLabVariant;
  title: string;
  note: string;
}> = [
  {
    id: "ink-ledger",
    title: "Ink ledger dawn",
    note: "21st.dev Shader Builder Plasma (id 24346) retinted to glacial FOLIO ink. Live WebGL canvas — not a CSS gradient fake.",
  },
  {
    id: "ledger-mist",
    title: "Ledger mist",
    note: "Same connected WebGL path, paper→ink mist palette. Pairs with display type; no purple glow.",
  },
  {
    id: "aurora-grid",
    title: "Quiet aurora grid",
    note: "Low-chroma teal field for network/status surfaces — secondary only, not a hero replacement.",
  },
];

function Page() {
  const data = Route.useLoaderData();
  const status = data.status;

  return (
    <PublicShell
      compactIntro
      eyebrow="Approve gate · 21st WebGL + shaders.com probe"
      title="Look at the WebGL. Then pick."
      intro="Live 21st.dev Plasma (id 24346) retinted to FOLIO ink. shaders.com key probed honestly — Clerk still gates REST. Visuals first."
    >
      <div className="lab-status-row">
        <StatusBadge tone={status.keyPresent ? (status.reachable ? "green" : "amber") : "amber"}>
          {status.keyPresent
            ? status.reachable
              ? "shaders.com ok"
              : "shaders.com keyed · API gated"
            : "SHADERS_API_KEY missing"}
        </StatusBadge>
        <StatusBadge tone={data.twentyFirstConfigured ? "green" : "amber"}>
          {data.twentyFirstConfigured ? "21st MCP + WebGL wired" : "API_KEY_21ST missing"}
        </StatusBadge>
        <span>{status.detail}</span>
        <span>· {data.shaderNote}</span>
      </div>

      <div className="lab-stage-stack">
        <div className="lab-grid" style={{ marginTop: 0 }}>
          {CANDIDATES.map((c) => (
            <article key={c.id} className="lab-card">
              <StatusBadge tone="amber">{c.id}</StatusBadge>
              <h3>{c.title}</h3>
              <div className="lab-swatch lab-swatch-live" aria-hidden>
                <ShaderBackground variant={c.id} className="lab-swatch-canvas" />
              </div>
              <p className="text-sm opacity-80">{c.note}</p>
            </article>
          ))}
        </div>

        {data.shaderHits.length > 0 ? (
          <div className="lab-21st-gallery lab-21st-gallery-wide">
            {data.shaderHits
              .filter((h) => h.previewUrl)
              .filter((h) => {
                const blob = `${h.name} ${h.description ?? ""}`.toLowerCase();
                // Keep approve board clean — no purple-neon AI-slop thumbs
                return !/purple|neon|violet|glow line/i.test(blob);
              })
              .slice(0, 4)
              .map((h) => (
                <figure key={String(h.id)}>
                  <img src={h.previewUrl!} alt="" loading="lazy" />
                  <figcaption>
                    21st · {h.name}
                    {h.author ? ` · @${h.author}` : ""} · id {h.id}
                  </figcaption>
                </figure>
              ))}
          </div>
        ) : null}
      </div>

      <LabApprovePanel kind="shaders" ids={[...LAB_SHADER_IDS]} />

      <p className="mt-6 text-sm opacity-80">
        Key present does not invent shaders.com frames — we label Clerk/API failures
        honestly and ship the 21st WebGL path that actually runs.{" "}
        <Link to="/" className="underline">
          Back to production hero
        </Link>
      </p>
    </PublicShell>
  );
}
