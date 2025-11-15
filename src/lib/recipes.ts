"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type {
  CreateRecipeInput,
  RecipeDocument,
} from "@/types/recipe";

const RECIPES_COLLECTION = "recipes";

function mapRecipe(docId: string, data: DocumentData): RecipeDocument {
  return {
    id: docId,
    title: data.title ?? "",
    description: data.description ?? "",
    calories: Number(data.calories ?? 0),
    protein: Number(data.protein ?? 0),
    carbs: Number(data.carbs ?? 0),
    fats: Number(data.fats ?? 0),
    ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
    steps: Array.isArray(data.steps) ? data.steps : [],
    imageURL: data.imageURL ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
  };
}

export async function createRecipe(payload: CreateRecipeInput) {
  const recipesRef = collection(db, RECIPES_COLLECTION);
  const docRef = await addDoc(recipesRef, payload);
  return docRef.id;
}

export async function getRecipeById(id: string) {
  const docRef = doc(db, RECIPES_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    return null;
  }
  return mapRecipe(snapshot.id, snapshot.data());
}

export async function listRecipes(options?: {
  limit?: number;
  tag?: string;
}) {
  const constraints: QueryConstraint[] = [];
  if (options?.tag) {
    constraints.push(where("tags", "array-contains", options.tag));
  }
  constraints.push(orderBy("title", "asc"));

  const recipesQuery =
    constraints.length > 0
      ? query(collection(db, RECIPES_COLLECTION), ...constraints)
      : collection(db, RECIPES_COLLECTION);

  const snapshot = await getDocs(recipesQuery);
  return snapshot.docs.map((docSnapshot) =>
    mapRecipe(docSnapshot.id, docSnapshot.data())
  );
}

export async function searchRecipes(searchTerm: string) {
  if (!searchTerm.trim()) {
    return listRecipes();
  }

  const term = searchTerm.trim().toLowerCase();
  const snapshot = await getDocs(collection(db, RECIPES_COLLECTION));

  return snapshot.docs
    .map((docSnapshot) => mapRecipe(docSnapshot.id, docSnapshot.data()))
    .filter((recipe) => {
      const haystack = [
        recipe.title,
        recipe.description,
        ...recipe.ingredients,
        ...recipe.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
}

export async function updateRecipe(
  id: string,
  payload: Partial<CreateRecipeInput>
) {
  const docRef = doc(db, RECIPES_COLLECTION, id);
  await updateDoc(docRef, payload);
}

export async function deleteRecipe(id: string) {
  const docRef = doc(db, RECIPES_COLLECTION, id);
  await deleteDoc(docRef);
}

