import { Monitor, Palette, Zap, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  delay: number;
};

function FeatureCard({
  title,
  description,
  icon: Icon,
  gradient,
  delay,
}: FeatureCardProps) {
  return (
    <motion.div
      className="relative flex flex-col justify-start items-start w-full max-w-[260px] md:max-w-[300px] group mx-auto"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
    >
      <div
        className="absolute w-full h-[260px] md:h-[300px] opacity-60 rounded-[40px] pointer-events-none"
        style={{ background: gradient, filter: "blur(45px)" }}
        aria-hidden
      />
      <div
        className="relative self-stretch h-[260px] md:h-[300px] rounded-[40px] z-10 overflow-hidden border-8 border-transparent"
        style={{
          background: `linear-gradient(#1A1A1C, #1A1A1C) padding-box, ${gradient} border-box`,
        }}
      >
        <div className="w-full h-full p-7 flex flex-col justify-between">
          <div className="text-white/90">
            <Icon size={32} strokeWidth={2.5} aria-hidden />
          </div>
          <div>
            <h3 className="text-white font-medium text-xl mb-3 tracking-tight">
              {title}
            </h3>
            <p className="text-gray-400 text-[14px] leading-[1.6] font-normal selection:bg-white/20">
              {description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const CARDS: FeatureCardProps[] = [
  {
    title: "Desk",
    description:
      "Holdings, charts, and quotes in one place — sized for phones and wide screens, without operator theater.",
    icon: Monitor,
    delay: 0.1,
    gradient: "linear-gradient(137deg, #FF3D77 0%, #FFB1CE 45%, #FF9D3C 100%)",
  },
  {
    title: "Truth",
    description:
      "Live multipliers checked on-chain. FOLIO refuses to invent a match when either side is dark.",
    icon: Palette,
    delay: 0.2,
    gradient: "linear-gradient(137deg, #FFFFFF 0%, #7DD3FC 45%, #06B6D4 100%)",
  },
  {
    title: "Motion",
    description:
      "Swap tickets and credit reads stay live and labeled — quote-only until broadcast is funded.",
    icon: Zap,
    delay: 0.3,
    gradient: "linear-gradient(137deg, #4361EE 0%, #E0AEFF 45%, #F72585 100%)",
  },
];

export function GlowingFeaturesSection() {
  return (
    <section
      className="min-h-[70vh] bg-[#0A0A0B] flex flex-col items-center justify-center p-6 md:p-12 font-sans"
      aria-label="Product features"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-3 lg:gap-3 w-full max-w-[936px]">
        {CARDS.map((card) => (
          <FeatureCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}
