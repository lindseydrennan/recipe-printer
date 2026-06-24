import RecipeForm from "@/components/RecipeForm";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-6 py-20 bg-background">
      <div className="w-full max-w-xl">
        <p className="text-xs font-semibold tracking-[0.1em] uppercase text-burnt-orange mb-4">
          Recipe Printer
        </p>

        <h1 className="font-serif text-4xl font-normal leading-tight tracking-tight text-dark-green mb-4">
          Print any recipe,<br />beautifully.
        </h1>

        <p className="text-base text-copy leading-relaxed mb-10">
          Paste a recipe URL and get a clean, formatted PDF — 8.5×11, ready to
          print and keep.
        </p>

        <RecipeForm />

        <p className="mt-6 text-xs text-borders">
          Works with most major recipe sites. If a site blocks scrapers the download won&apos;t appear.
        </p>
      </div>
    </main>
  );
}
