"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRightIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { listRecipes } from "@/lib/recipes";
import { getThumbnailUrl } from "@/lib/image-utils";
import type { RecipeDocument } from "@/types/recipe";
import DashboardCard from "./DashboardCard";

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
    <DashboardCard delay={0.4}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white font-display">Recipe Library</h3>
        <SparklesIcon className="h-6 w-6 text-[#D7263D]" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-neutral-800/50"
            />
          ))}
        </div>
      ) : recipes.length > 0 ? (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-800/30 p-3 transition hover:bg-neutral-800/50 hover:border-neutral-700 group"
            >
              {recipe.imageURL ? (
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={getThumbnailUrl(recipe.imageURL)}
                    alt={recipe.title}
                    fill
                    sizes="48px"
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-neutral-700" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-[#D7263D] transition-colors">
                  {recipe.title}
                </p>
                <p className="text-xs text-neutral-400">
                  {recipe.calories} cal • {recipe.protein}g protein
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 flex-shrink-0 text-neutral-500 group-hover:text-[#D7263D] group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
          <Link
            href="/recipes"
            className="flex items-center justify-center gap-2 rounded-xl border border-[#D7263D] bg-[#D7263D]/10 px-4 py-3 text-sm font-semibold text-[#D7263D] transition hover:bg-[#D7263D]/20 hover:shadow-[0_0_15px_-8px_rgba(215,38,61,0.6)]"
          >
            View All Recipes
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-800/30 p-6 text-center">
          <SparklesIcon className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">
            Your recipe library is coming soon.
          </p>
        </div>
      )}
    </DashboardCard>
  );
}
