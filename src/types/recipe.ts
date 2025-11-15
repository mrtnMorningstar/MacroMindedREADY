"use client";

export type RecipeDocument = {
  id: string;
  title: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  steps: string[];
  imageURL: string;
  tags: string[];
};

export type CreateRecipeInput = Omit<RecipeDocument, "id">;

