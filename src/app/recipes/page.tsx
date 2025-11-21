"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { listRecipes } from "@/lib/recipes";
import FullScreenLoader from "@/components/FullScreenLoader";
import type { RecipeDocument } from "@/types/recipe";

export default function RecipesPage() {
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [recipes, setRecipes] = useState<RecipeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const tagFilters = [
    "High Protein",
    "Low Carb",
    "Vegetarian",
    "Vegan",
    "Quick Prep",
    "Gluten Free",
    "Dairy Free",
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(userRef);
        const packageTier = snapshot.data()?.packageTier;

        if (!packageTier) {
          router.replace("/packages");
          return;
        }

        setAuthorized(true);
      } catch (accessError) {
        console.error("Failed to verify user package:", accessError);
        setError("Unable to verify your access. Please refresh.");
      } finally {
        setCheckingAccess(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRecipes();
      setRecipes(data);
    } catch (fetchError) {
      console.error("Failed to load recipes:", fetchError);
      setError("We couldn't load the recipes. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    void loadRecipes();
  }, [authorized, loadRecipes]);

  const filteredRecipes = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const matchesSearch = searchTerm
        ? recipe.title.toLowerCase().includes(searchTerm)
        : true;
      const matchesTags =
        activeTags.length === 0 ||
        activeTags.some((tag) =>
          recipe.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
        );
      return matchesSearch && matchesTags;
    });
  }, [activeTags, recipes, search]);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag]
    );
  }, []);

  const visibleRecipes = filteredRecipes;

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
          Checking access…
        </p>
      </div>
    );
  }

  if (!authorized) {
    return <FullScreenLoader />;
  }

  return (
    <div className="min-h-screen bg-[#050505] px-6 py-12 text-white sm:px-10 lg:px-16">
      <header className="mx-auto max-w-5xl text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-foreground/60">
          MacroMinded Recipe Library
        </p>
        <h1 className="mt-3 text-4xl font-bold uppercase tracking-[0.18em] sm:text-5xl">
          Fuel Your Plan
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm uppercase tracking-[0.25em] text-foreground/60">
          High-impact meals curated by our coaching team. Each dish is optimized
          for recovery, adherence, and flavor.
        </p>
      </header>

      {error && (
        <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-accent/50 bg-muted/70 px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          {error}
        </div>
      )}

      <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title..."
            className="w-full rounded-full border border-border/70 bg-background/20 px-5 py-3 text-sm uppercase tracking-[0.3em] text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none sm:max-w-sm"
          />
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setActiveTags([]);
            }}
            className="mt-2 rounded-full border border-border/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent sm:mt-0"
          >
            Reset Filters
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {tagFilters.map((tag) => {
            const isActive = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] transition ${
                  isActive
                    ? "border-[#D7263D] bg-[#D7263D]/10 text-[#D7263D]"
                    : "border-white/20 text-white/70 hover:border-[#D7263D] hover:text-[#D7263D]"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="mx-auto mt-10 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`recipe-skeleton-${index}`}
              className="h-80 animate-pulse rounded-3xl border border-border/70 bg-muted/40"
            />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="mx-auto mt-16 max-w-4xl rounded-3xl border border-border/70 bg-muted/50 px-8 py-10 text-center text-xs uppercase tracking-[0.28em] text-foreground/60">
          More recipes are being curated by the team. Check back soon.
        </div>
      ) : (
        <section className="mx-auto mt-12 grid max-w-6xl gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRecipes.length === 0 && (
            <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-xs uppercase tracking-[0.3em] text-white/70">
              No recipes match your filters yet.
            </div>
          )}
          {visibleRecipes.map((recipe) => (
            <motion.article
              key={recipe.id}
              whileHover={{ scale: 1.03, rotate: 0.2 }}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-[#0F0F0F] shadow-[0_0_60px_-30px_rgba(215,38,61,0.45)]"
            >
              <Link href={`/recipes/${recipe.id}`} className="flex h-full flex-col">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-3xl bg-black">
                  {recipe.imageURL ? (
                    <Image
                      src={recipe.imageURL}
                      alt={recipe.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#111] to-[#1c1c1c] text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                      Coach photo in transit
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-4 px-5 py-5">
                  <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.28em] text-white/70">
                    <span className="rounded-full border border-[#D7263D] bg-[#D7263D]/15 px-3 py-1 text-[#D7263D]">
                      {recipe.tags[0] ?? "Balanced"}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {recipe.calories} kcal
                    </span>
                  </div>
                  <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-white">
                    {recipe.title}
                  </h2>
                  <p className="flex-1 text-sm uppercase tracking-[0.2em] text-white/60">
                    {recipe.description.slice(0, 90)}
                    {recipe.description.length > 90 ? "…" : ""}
                  </p>
                  <div className="flex gap-3 text-[0.7rem] uppercase tracking-[0.3em] text-white/80">
                    <MacroBadge label="P" value={recipe.protein} suffix="g" />
                    <MacroBadge label="C" value={recipe.carbs} suffix="g" />
                    <MacroBadge label="F" value={recipe.fats} suffix="g" />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </section>
      )}
    </div>
  );
}

function MacroBadge({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <span className="inline-flex min-w-[70px] items-center justify-center rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-semibold text-white">
      {label}: {value}
      {suffix}
    </span>
  );
}

