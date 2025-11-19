"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { listRecipes } from "@/lib/recipes";
import type { RecipeDocument } from "@/types/recipe";

export default function RecipesPreviewCard() {
  const [recipes, setRecipes] = useState<RecipeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const allRecipes = await listRecipes({ limit: 3 });
        setRecipes(allRecipes.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchRecipes();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Recipe Library</h3>
        <Link
          href="/recipes"
          className="text-sm font-semibold text-[#D7263D] transition hover:text-[#D7263D]/80"
        >
          View All
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-neutral-800"
            />
          ))}
        </div>
      ) : recipes.length > 0 ? (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-800/50 p-3 transition hover:bg-neutral-800"
            >
              {recipe.imageURL ? (
                <img
                  src={recipe.imageURL}
                  alt={recipe.title}
                  className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-neutral-700" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {recipe.title}
                </p>
                <p className="text-xs text-neutral-400">
                  {recipe.calories} cal • {recipe.protein}g protein
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 flex-shrink-0 text-neutral-500" />
            </Link>
          ))}
          <Link
            href="/recipes"
            className="flex items-center justify-center gap-2 rounded-lg border border-[#D7263D] bg-[#D7263D]/10 px-4 py-3 text-sm font-semibold text-[#D7263D] transition hover:bg-[#D7263D]/20"
          >
            View All Recipes
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-800 bg-neutral-800/30 p-6 text-center">
          <p className="text-sm text-neutral-400">
            Your recipe library is coming soon.
          </p>
        </div>
      )}
    </motion.div>
  );
}

