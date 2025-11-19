"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { ChangeEvent, FormEvent } from "react";

import { db, storage } from "@/lib/firebase";
import type { RecipeDocument } from "@/types/recipe";
import AdminLayout from "@/components/admin/AdminLayout";
import { SkeletonCard } from "@/components/common/Skeleton";
import { useToast } from "@/components/ui/Toast";
import AppModal from "@/components/ui/AppModal";

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

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<RecipeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<RecipeFormState>(initialFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "recipes"), (snapshot) => {
      const recipesData: RecipeDocument[] = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as RecipeDocument[];
      setRecipes(recipesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          toast.error("Please select an image file");
          return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [toast]
  );

  const handleUploadImage = useCallback(async (): Promise<string | null> => {
    if (!imageFile) return formState.imageURL || null;

    setUploadingAsset(true);
    try {
      const storageRef = ref(storage, `recipes/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(storageRef);
      setUploadingAsset(false);
      return downloadURL;
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image");
      setUploadingAsset(false);
      return null;
    }
  }, [imageFile, formState.imageURL, toast]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        const imageURL = await handleUploadImage();
        const recipeData = {
          title: formState.title,
          description: formState.description,
          calories: Number(formState.calories) || 0,
          protein: Number(formState.protein) || 0,
          carbs: Number(formState.carbs) || 0,
          fats: Number(formState.fats) || 0,
          ingredients: formState.ingredients.split("\n").filter((line) => line.trim()),
          steps: formState.steps.split("\n").filter((line) => line.trim()),
          tags: formState.tags.split(",").map((tag) => tag.trim()).filter((tag) => tag),
          imageURL: imageURL || formState.imageURL || "",
        };

        if (selectedRecipeId) {
          await updateDoc(doc(db, "recipes", selectedRecipeId), recipeData);
          toast.success("Recipe updated successfully");
        } else {
          await setDoc(doc(collection(db, "recipes")), recipeData);
          toast.success("Recipe created successfully");
        }

        setFormState(initialFormState);
        setImageFile(null);
        setImagePreview(null);
        setSelectedRecipeId(null);
        setShowForm(false);
      } catch (error) {
        console.error("Failed to save recipe:", error);
        toast.error("Failed to save recipe");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, imageFile, selectedRecipeId, handleUploadImage, toast]
  );

  const handleEdit = useCallback((recipe: RecipeDocument) => {
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
    setImagePreview(recipe.imageURL);
    setSelectedRecipeId(recipe.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (recipeId: string) => {
      try {
        await deleteDoc(doc(db, "recipes", recipeId));
        toast.success("Recipe deleted successfully");
        setShowDeleteConfirm(null);
      } catch (error) {
        console.error("Failed to delete recipe:", error);
        toast.error("Failed to delete recipe");
      }
    },
    [toast]
  );

  return (
    <AdminLayout>
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} total
        </p>
        <button
          onClick={() => {
            setFormState(initialFormState);
            setImageFile(null);
            setImagePreview(null);
            setSelectedRecipeId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg border border-[#D7263D] bg-[#D7263D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90"
        >
          <PlusIcon className="h-5 w-5" />
          Create New Recipe
        </button>
      </div>

      {/* Recipe Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} className="h-64" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <div className="max-w-md mx-auto">
            <SparklesIcon className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No recipes yet</h3>
            <p className="text-sm text-neutral-400 mb-6">
              Create your first recipe to get started building your recipe library.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg border border-[#D7263D] bg-[#D7263D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90"
            >
              Create Recipe
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden"
            >
              {recipe.imageURL && (
                <img
                  src={recipe.imageURL}
                  alt={recipe.title}
                  className="h-48 w-full object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">{recipe.title}</h3>
                <p className="text-sm text-neutral-400 mb-4 line-clamp-2">
                  {recipe.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                    {recipe.protein}g P
                  </span>
                  <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                    {recipe.carbs}g C
                  </span>
                  <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                    {recipe.fats}g F
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(recipe)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(recipe.id)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/30"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Recipe Modal */}
      <AppModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setFormState(initialFormState);
          setImageFile(null);
          setImagePreview(null);
          setSelectedRecipeId(null);
        }}
        title={selectedRecipeId ? "Edit Recipe" : "Create New Recipe"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">Title</label>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              required
              className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2 text-sm text-white focus:border-[#D7263D] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">
              Description
            </label>
            <textarea
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              required
              rows={3}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-3 text-sm text-white focus:border-[#D7263D] focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {(["calories", "protein", "carbs", "fats"] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-semibold text-neutral-300 mb-2 capitalize">
                  {field}
                </label>
                <input
                  type="number"
                  value={formState[field]}
                  onChange={(e) => setFormState({ ...formState, [field]: e.target.value })}
                  required
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2 text-sm text-white focus:border-[#D7263D] focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">
              Ingredients (one per line)
            </label>
            <textarea
              value={formState.ingredients}
              onChange={(e) => setFormState({ ...formState, ingredients: e.target.value })}
              required
              rows={5}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-3 text-sm text-white focus:border-[#D7263D] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">
              Steps (one per line)
            </label>
            <textarea
              value={formState.steps}
              onChange={(e) => setFormState({ ...formState, steps: e.target.value })}
              required
              rows={5}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-3 text-sm text-white focus:border-[#D7263D] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formState.tags}
              onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-800/50 px-4 py-2 text-sm text-white focus:border-[#D7263D] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">Image</label>
            <div className="space-y-3">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-32 w-32 rounded-lg object-cover border border-neutral-800"
                />
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700">
                  <ArrowUpTrayIcon className="h-5 w-5" />
                  {imageFile ? "Change Image" : "Upload Image"}
                </div>
              </label>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormState(initialFormState);
                setImageFile(null);
                setImagePreview(null);
                setSelectedRecipeId(null);
              }}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-6 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingAsset}
              className="rounded-lg border border-[#D7263D] bg-[#D7263D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#D7263D]/90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : selectedRecipeId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </AppModal>

      {/* Delete Confirmation Modal */}
      <AppModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Recipe"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-300">
            Are you sure you want to delete this recipe? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              className="rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/30"
            >
              Delete Recipe
            </button>
          </div>
        </div>
      </AppModal>
    </AdminLayout>
  );
}
