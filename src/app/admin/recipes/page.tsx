"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { ChangeEvent, FormEvent } from "react";

import { auth, db, storage } from "@/lib/firebase";
import type { RecipeDocument } from "@/types/recipe";

type RecipeFormState = {
  title: string;
  description: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  ingredients: string;
  steps: string;
  tags: string;
  imageURL: string;
};

const initialFormState: RecipeFormState = {
  title: "",
  description: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
  ingredients: "",
  steps: "",
  tags: "",
  imageURL: "",
};

const navItems = [
  { href: "/admin", label: "Users" },
  { href: "/admin/referrals", label: "Referrals" },
  { href: "/admin/recipes", label: "Recipes" },
  { href: "/admin/sales", label: "Sales / Revenue" },
  { href: "/admin/requests", label: "Plan Requests" },
] as const;

export default function AdminRecipesPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [recipes, setRecipes] = useState<RecipeDocument[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);

  const [formState, setFormState] = useState<RecipeFormState>(initialFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        setCheckingAuth(false);
        return;
      }

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(docRef);
        const role = snapshot.data()?.role;
        if (role !== "admin") {
          router.replace("/dashboard");
          setCheckingAuth(false);
          return;
        }
        setIsAdmin(true);
      } catch (error) {
        console.error("Failed to verify admin role:", error);
        router.replace("/dashboard");
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;

    setLoadingRecipes(true);
    const unsubscribe = onSnapshot(
      collection(db, "recipes"),
      (snapshot) => {
        const docs = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data();
            return {
              id: docSnapshot.id,
              title: data?.title ?? "",
              description: data?.description ?? "",
              calories: Number(data?.calories ?? 0),
              protein: Number(data?.protein ?? 0),
              carbs: Number(data?.carbs ?? 0),
              fats: Number(data?.fats ?? 0),
              ingredients: Array.isArray(data?.ingredients)
                ? data.ingredients
                : [],
              steps: Array.isArray(data?.steps) ? data.steps : [],
              imageURL: data?.imageURL ?? "",
              tags: Array.isArray(data?.tags) ? data.tags : [],
            } as RecipeDocument;
          })
          .sort((a, b) => a.title.localeCompare(b.title));

        setRecipes(docs);
        setLoadingRecipes(false);
      },
      (error) => {
        console.error("Failed to load recipes:", error);
        setLoadingRecipes(false);
        setFeedback("Unable to load recipes. Please refresh.");
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const handleInputChange = useCallback(
    (field: keyof RecipeFormState) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        setFormState((prev) => ({ ...prev, [field]: value }));
      },
    []
  );

  const handleImageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setImageFile(event.target.files?.[0] ?? null);
  }, []);

  const resetForm = useCallback(() => {
    setFormState(initialFormState);
    setImageFile(null);
    setSelectedRecipeId(null);
  }, []);

  const handleEdit = useCallback((recipe: RecipeDocument) => {
    setSelectedRecipeId(recipe.id);
    setFormState({
      title: recipe.title,
      description: recipe.description,
      calories: recipe.calories.toString(),
      protein: recipe.protein.toString(),
      carbs: recipe.carbs.toString(),
      fats: recipe.fats.toString(),
      ingredients: recipe.ingredients.join("\n"),
      steps: recipe.steps.join("\n"),
      tags: recipe.tags.join(", "),
      imageURL: recipe.imageURL,
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDelete = useCallback(
    async (recipe: RecipeDocument) => {
      if (!window.confirm(`Delete "${recipe.title}" permanently?`)) return;

      try {
        await deleteDoc(doc(db, "recipes", recipe.id));
        setFeedback("Recipe deleted.");
        if (selectedRecipeId === recipe.id) {
          resetForm();
        }
      } catch (error) {
        console.error("Failed to delete recipe:", error);
        setFeedback("Failed to delete recipe.");
      }
    },
    [resetForm, selectedRecipeId]
  );

  const uploadImageIfNeeded = useCallback(
    async (recipeId: string) => {
      if (!imageFile) {
        return formState.imageURL;
      }

      const storageRef = ref(
        storage,
        `recipes/${recipeId}/${Date.now()}-${imageFile.name}`
      );
      await uploadBytes(storageRef, imageFile);
      return await getDownloadURL(storageRef);
    },
    [formState.imageURL, imageFile]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!formState.title.trim()) {
        setFeedback("Title is required.");
        return;
      }

      setIsSubmitting(true);
      try {
        const ingredients = formState.ingredients
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const steps = formState.steps
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const tags = formState.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);

        const payload = {
          title: formState.title.trim(),
          description: formState.description.trim(),
          calories: Number(formState.calories) || 0,
          protein: Number(formState.protein) || 0,
          carbs: Number(formState.carbs) || 0,
          fats: Number(formState.fats) || 0,
          ingredients,
          steps,
          tags,
        };

        if (selectedRecipeId) {
          const docRef = doc(db, "recipes", selectedRecipeId);
          const imageURL = await uploadImageIfNeeded(selectedRecipeId);
          await updateDoc(docRef, { ...payload, imageURL });
          setFeedback("Recipe updated.");
        } else {
          const docRef = doc(collection(db, "recipes"));
          const imageURL = await uploadImageIfNeeded(docRef.id);
          await setDoc(docRef, { ...payload, imageURL });
          setFeedback("Recipe created.");
        }

        resetForm();
      } catch (error) {
        console.error("Failed to save recipe:", error);
        setFeedback("Failed to save recipe.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, resetForm, selectedRecipeId, uploadImageIfNeeded]
  );

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
          Validating access...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden h-[calc(100vh-5rem)] w-64 flex-col border-r border-border/70 bg-muted/40 px-6 py-10 shadow-[0_0_80px_-40px_rgba(215,38,61,0.6)] backdrop-blur lg:fixed lg:left-0 lg:top-20 lg:flex"
      >
        <span className="font-bold uppercase tracking-[0.48em] text-foreground">
          MacroMinded
        </span>
        <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
          Admin navigation
        </p>

        <nav className="mt-10 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full border px-4 py-2 text-left text-[0.65rem] uppercase tracking-[0.3em] transition ${
                  pathname === item.href
                    ? "border-accent/60 bg-accent/20 text-accent"
                    : "border-border/70 text-foreground/70 hover:border-accent hover:text-accent"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </motion.aside>

      <div className="relative isolate flex-1 lg:ml-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-36 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#161616_0%,rgba(0,0,0,0.92)_55%,#000000_95%)]" />
        </motion.div>

        <div className="relative flex flex-col gap-10 px-6 py-10 sm:py-16 lg:px-10">
          <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_70px_-35px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h1 className="font-bold text-2xl uppercase tracking-[0.32em] text-foreground sm:text-3xl">
                Recipe Manager
              </h1>
              <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                Add, edit, and publish meal ideas for clients.
              </p>
            </div>
          </header>

          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-accent/40 bg-muted/70 px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.28em] text-accent"
            >
              {feedback}
            </motion.div>
          )}

          <section className="grid gap-10 xl:grid-cols-[1.2fr_1fr]">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold uppercase tracking-[0.32em] text-foreground">
                  {selectedRecipeId ? "Edit Recipe" : "Add New Recipe"}
                </h2>
                {selectedRecipeId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs uppercase tracking-[0.3em] text-foreground/60 hover:text-accent"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                  Title
                  <input
                    type="text"
                    value={formState.title}
                    onChange={handleInputChange("title")}
                    className="rounded-2xl border border-border/70 bg-background/20 px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                  Calories
                  <input
                    type="number"
                    value={formState.calories}
                    onChange={handleInputChange("calories")}
                    className="rounded-2xl border border-border/70 bg-background/20 px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                    min="0"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                  Protein (g)
                  <input
                    type="number"
                    value={formState.protein}
                    onChange={handleInputChange("protein")}
                    className="rounded-2xl border border-border/70 bg-background/20 px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                    min="0"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                  Carbs (g)
                  <input
                    type="number"
                    value={formState.carbs}
                    onChange={handleInputChange("carbs")}
                    className="rounded-2xl border border-border/70 bg-background/20 px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                    min="0"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                  Fats (g)
                  <input
                    type="number"
                    value={formState.fats}
                    onChange={handleInputChange("fats")}
                    className="rounded-2xl border border-border/70 bg-background/20 px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                    min="0"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                Description
                <textarea
                  value={formState.description}
                  onChange={handleInputChange("description")}
                  className="min-h-[100px] rounded-2xl border border-border/70 bg-background/20 px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                Ingredients (one per line)
                <textarea
                  value={formState.ingredients}
                  onChange={handleInputChange("ingredients")}
                  className="min-h-[120px] rounded-2xl border border-border/70 bg-background/20 px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                Steps (one per line)
                <textarea
                  value={formState.steps}
                  onChange={handleInputChange("steps")}
                  className="min-h-[120px] rounded-2xl border border-border/70 bg-background/20 px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                Tags (comma separated)
                <input
                  type="text"
                  value={formState.tags}
                  onChange={handleInputChange("tags")}
                  className="rounded-2xl border border-border/70 bg-background/20 px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                  placeholder="high-protein, vegetarian"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                Image Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="rounded-2xl border border-border/70 bg-background/20 px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </label>
              {formState.imageURL && !imageFile && (
                <div className="rounded-2xl border border-border/70 bg-background/10 px-4 py-3 text-center text-[0.65rem] uppercase tracking-[0.25em] text-foreground/60">
                  Using existing image
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full border border-accent bg-accent px-6 py-3 text-xs font-bold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Saving..."
                  : selectedRecipeId
                    ? "Update Recipe"
                    : "Add Recipe"}
              </button>
            </form>

            <section className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold uppercase tracking-[0.32em] text-foreground">
                  Existing Recipes
                </h2>
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                  {loadingRecipes
                    ? "Loading..."
                    : `${recipes.length} recipe${recipes.length === 1 ? "" : "s"}`}
                </p>
              </div>

              {loadingRecipes ? (
                <div className="rounded-2xl border border-border/70 bg-background/20 px-4 py-6 text-center text-xs uppercase tracking-[0.3em] text-foreground/50">
                  Fetching recipes...
                </div>
              ) : recipes.length === 0 ? (
                <div className="rounded-2xl border border-border/70 bg-background/20 px-4 py-6 text-center text-xs uppercase tracking-[0.3em] text-foreground/50">
                  No recipes found.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recipes.map((recipe) => (
                    <motion.div
                      key={recipe.id}
                      whileHover={{ scale: 1.01 }}
                      className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/5 px-4 py-4 text-sm text-foreground"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-base font-bold uppercase tracking-[0.2em]">
                            {recipe.title}
                          </h3>
                          <p className="text-[0.7rem] uppercase tracking-[0.25em] text-foreground/60">
                            {recipe.tags.join(", ") || "No tags"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(recipe)}
                            className="rounded-full border border-border/70 px-4 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-foreground/70 transition hover:border-accent hover:text-accent"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(recipe)}
                            className="rounded-full border border-border/70 px-4 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-accent transition hover:border-accent hover:text-background hover:bg-accent"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-[0.8rem] text-foreground/70">
                        {recipe.description.slice(0, 160)}
                        {recipe.description.length > 160 ? "…" : ""}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.28em] text-foreground/60">
                        <span>Calories: {recipe.calories}</span>
                        <span>Protein: {recipe.protein}g</span>
                        <span>Carbs: {recipe.carbs}g</span>
                        <span>Fats: {recipe.fats}g</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </section>
        </div>
      </div>
    </div>
  );
}
