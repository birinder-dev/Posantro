import ScrollCog from "@/components/ScrollCog";

const PLACEHOLDER_SECTIONS = [
  {
    title: "Posantro",
    subtitle: "Post + Yantra — Scroll down to turn the side cogwheel.",
  },
  {
    title: "Automated Posts",
    subtitle: "Placeholder section 2 — watch the center fin glow brightest.",
  },
  {
    title: "Slide Builder",
    subtitle: "Placeholder section 3 — each scroll rotates the gear.",
  },
  {
    title: "Overlapping Canvas",
    subtitle: "Placeholder section 4 — future workspace.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 pr-20">
      <ScrollCog />

      {PLACEHOLDER_SECTIONS.map((section, idx) => (
        <section
          key={section.title}
          className="min-h-screen flex flex-col justify-center px-8 md:px-16 border-b border-zinc-900"
        >
          <span className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
            0{idx + 1}
          </span>
          <h1 className="text-4xl md:text-5xl font-semibold mb-3">
            {section.title}
          </h1>
          <p className="text-zinc-400 max-w-md">{section.subtitle}</p>
        </section>
      ))}
    </main>
  );
}
