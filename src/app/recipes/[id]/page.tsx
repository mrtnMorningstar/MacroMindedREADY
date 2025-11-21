"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { getRecipeById } from "@/lib/recipes";
import type { RecipeDocument } from "@/types/recipe";
import FullScreenLoader from "@/components/FullScreenLoader";

export default function RecipeDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const recipeId = params?.id;

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [recipe, setRecipe] = useState<RecipeDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!authorized || !recipeId) return;

    const loadRecipe = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRecipeById(recipeId);
        if (!data) {
          setError("Recipe not found.");
        }
        setRecipe(data);
      } catch (fetchError) {
        console.error("Failed to load recipe:", fetchError);
        setError("Unable to load this recipe. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void loadRecipe();
  }, [authorized, recipeId]);

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
    <div className="min-h-screen bg-background/95 px-6 py-10 text-foreground sm:px-10 lg:px-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Link
          href="/recipes"
          className="text-xs font-semibold uppercase tracking-[0.35em] text-foreground/60 transition hover:text-accent"
        >
          ← Back to all recipes
        </Link>

        {error && (
          <div className="rounded-3xl border border-accent/40 bg-muted/70 px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-6">
            <div className="h-72 animate-pulse rounded-3xl border border-border/70 bg-muted/40" />
            <div className="h-40 animate-pulse rounded-3xl border border-border/70 bg-muted/40" />
          </div>
        ) : recipe ? (
          <>
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-muted/50 shadow-[0_0_80px_-30px_rgba(215,38,61,0.6)]">
              <div className="relative aspect-[5/3] w-full bg-background/40">
                {recipe.imageURL ? (
                  <Image
                    src={recipe.imageURL}
                    alt={recipe.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 80vw"
                    className="object-cover"
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
                    Coach photo in transit
                  </div>
                )}
                <div className="absolute bottom-6 left-6 flex flex-wrap gap-3">
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border/70 bg-background/60 px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6 px-8 py-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-foreground/60">
                    MacroMinded Recipe
                  </p>
                  <h1 className="mt-3 text-4xl font-bold uppercase tracking-[0.2em]">
                    {recipe.title}
                  </h1>
                </div>

                <p className="text-sm uppercase tracking-[0.25em] text-foreground/70">
                  {recipe.description}
                </p>

                <div className="grid gap-4 sm:grid-cols-4">
                  <MacroStat label="Calories" value={`${recipe.calories} kcal`} />
                  <MacroStat label="Protein" value={`${recipe.protein} g`} />
                  <MacroStat label="Carbs" value={`${recipe.carbs} g`} />
                  <MacroStat label="Fats" value={`${recipe.fats} g`} />
                </div>
              </div>
            </div>

            <section className="grid gap-8 rounded-3xl border border-border/70 bg-muted/50 px-8 py-8 shadow-[0_0_70px_-35px_rgba(215,38,61,0.6)] lg:grid-cols-2">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-[0.3em] text-foreground">
                  Ingredients
                </h2>
                <ul className="mt-4 space-y-2 text-sm uppercase tracking-[0.22em] text-foreground/70">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={ingredient} className="flex items-start gap-2">
                      <span className="mt-2 h-1 w-1 rounded-full bg-accent" />
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-bold uppercase tracking-[0.3em] text-foreground">
                  Steps
                </h2>
                <ol className="mt-4 space-y-4 text-sm uppercase tracking-[0.22em] text-foreground/70">
                  {recipe.steps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="text-accent">{index + 1}.</span>
                      <span className="flex-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

function MacroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/30 px-5 py-4 text-center">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/60">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold uppercase tracking-[0.2em]">
        {value}
      </p>
    </div>
  );
}

