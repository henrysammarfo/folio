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
      eyebrow="Approve gate · 21st WebGL + shaders.com probe"
      title="Shader studies — connected for real."
      intro="Live WebGL from 21st.dev MCP (get_component id 24346, FOLIO palettes). shaders.com key is probed honestly — Clerk still gates their REST. Pick one, then reply in chat."
    >
      <p className="mb-4 text-sm opacity-80">
        Shaders.com:{" "}
        <StatusBadge tone={status.keyPresent ? (status.reachable ? "green" : "amber") : "amber"}>
          {status.keyPresent
            ? status.reachable
              ? "key + API ok"
              : "key set · API gated"
            : "SHADERS_API_KEY missing"}
        </StatusBadge>{" "}
        · {status.detail}
      </p>
      <p className="mb-4 text-sm opacity-80">
        21st:{" "}
        <StatusBadge tone={data.twentyFirstConfigured ? "green" : "amber"}>
          {data.twentyFirstConfigured ? "MCP + WebGL wired" : "key missing"}
        </StatusBadge>{" "}
        · {data.shaderNote}
      </p>

      <LabApprovePanel kind="shaders" ids={[...LAB_SHADER_IDS]} />

      <div className="lab-grid">
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
        <div className="lab-21st-gallery lab-21st-gallery-wide mt-8">
          {data.shaderHits
            .filter((h) => h.previewUrl)
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
