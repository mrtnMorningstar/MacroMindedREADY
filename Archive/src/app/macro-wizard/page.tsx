"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { useAppContext } from "@/context/AppContext";
import { useFriendlyError } from "@/hooks/useFriendlyError";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

const steps = ["Personal", "Activity", "Goals", "Review", "Result"];

type FormData = {
  age: string;
  height: string;
  weight: string;
  gender: string;
  activityLevel: string;
  goal: string;
  allergies: string;
  likes: string;
  dislikes: string;
  lifestyle: string;
  workSchedule: string;
  exerciseHabits: string;
  struggles: string;
};

type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export default function MacroWizard() {
  const { user, refresh } = useAppContext();
  const router = useRouter();
  const handleError = useFriendlyError();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<FormData>({
    age: "",
    height: "",
    weight: "",
    gender: "",
    activityLevel: "",
    goal: "",
    allergies: "",
    likes: "",
    dislikes: "",
    lifestyle: "",
    workSchedule: "",
    exerciseHabits: "",
    struggles: "",
  });

  const update = (key: keyof FormData, value: string) => {
    setForm({ ...form, [key]: value });
  };

  // Macro calculator (visual estimate — coach will finalize real plan)
  const calculateMacros = (): Macros | null => {
    const weight = parseFloat(form.weight);
    const height = parseFloat(form.height);
    const age = parseFloat(form.age);

    if (!weight || !height || !age) return null;

    // Mifflin St. Jeor estimate
    let bmr =
      form.gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    // Activity multipliers
    const activityMap: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    let calories = bmr * (activityMap[form.activityLevel] || 1.2);

    if (form.goal === "lose") calories -= 350;
    if (form.goal === "gain") calories += 350;

    const protein = weight * 2.2 * 0.8;
    const fats = (calories * 0.25) / 9;
    const carbs = (calories - (protein * 4 + fats * 9)) / 4;

    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fats: Math.round(fats),
    };
  };

  const macros = calculateMacros();

  const saveToFirestore = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      // Get ID token for authentication
      const idToken = await user.getIdToken();

      // Call secure API route
      const response = await fetch("/api/user/submit-macro-wizard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          profile: {
            age: form.age,
            height: form.height,
            weight: form.weight,
            gender: form.gender,
            activityLevel: form.activityLevel,
            goal: form.goal,
            allergies: form.allergies,
            preferences: form.likes,
            dietaryRestrictions: form.dislikes,
          },
          estimatedMacros: macros ? {
            calories: macros.calories,
            protein: macros.protein,
            carbs: macros.carbs,
            fats: macros.fats,
          } : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to save wizard data");
      }

      // Refresh context to update userDoc
      await refresh();

      // Show success message
      toast.success("Profile saved successfully! Redirecting to dashboard...");

      // Small delay before redirect to show success message
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Failed to save wizard data:", error);
      // Log the full error for debugging
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const next = async () => {
    if (step === steps.length - 2) {
      await saveToFirestore();
    } else {
      setStep(step + 1);
    }
  };

  const prev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-32 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-accent/35 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#161616_0%,rgba(0,0,0,0.9)_55%,#000000_95%)]" />
      </motion.div>

      <div className="relative mx-auto flex w-full max-w-2xl flex-col px-6 py-24 sm:py-28">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center font-display text-3xl uppercase tracking-[0.32em] text-foreground sm:text-4xl"
        >
          Personalized Setup
        </motion.h1>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 h-2 rounded-full mb-10">
          <div
            className="bg-red-600 h-2 rounded-full transition-all"
            style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
          />
        </div>

        <div className="bg-gray-950 p-8 rounded-2xl border border-gray-800 shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Animated Step Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold mb-4 text-white"
              >
                {steps[step]}
              </motion.h2>

              {/* PERSONAL */}
              {step === 0 && (
                <motion.div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
                  <div className="space-y-6">
                  <Input
                    label="Age"
                    type="number"
                    value={form.age}
                    onChange={(e) => update("age", e.target.value)}
                  />
                  <Input
                    label="Height (cm)"
                    type="number"
                    value={form.height}
                    onChange={(e) => update("height", e.target.value)}
                  />
                  <Input
                    label="Weight (kg)"
                    type="number"
                    value={form.weight}
                    onChange={(e) => update("weight", e.target.value)}
                  />

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-gray-300">
                        Gender
                      </label>
                      <select
                        className="bg-black border border-gray-700 focus:border-red-600 transition p-3 rounded w-full text-white"
                        value={form.gender}
                        onChange={(e) => update("gender", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ACTIVITY */}
              {step === 1 && (
                <motion.div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-gray-300">
                        How active are you?
                      </label>
                      <select
                        className="bg-black border border-gray-700 focus:border-red-600 transition p-3 rounded w-full text-white"
                        value={form.activityLevel}
                        onChange={(e) => update("activityLevel", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="sedentary">Sedentary</option>
                        <option value="light">Light (1–3 days/week)</option>
                        <option value="moderate">Moderate (3–5 days/week)</option>
                        <option value="active">Active (6–7 days/week)</option>
                        <option value="very_active">Very Active (Athlete)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* GOALS */}
              {step === 2 && (
                <motion.div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-gray-300">
                        Goal
                      </label>
                      <select
                        className="bg-black border border-gray-700 focus:border-red-600 transition p-3 rounded w-full text-white"
                        value={form.goal}
                        onChange={(e) => update("goal", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="lose">Lose Weight</option>
                        <option value="maintain">Maintain Weight</option>
                        <option value="gain">Gain Weight</option>
                      </select>
                    </div>

                  <Input
                    label="Allergies"
                    value={form.allergies}
                    onChange={(e) => update("allergies", e.target.value)}
                    placeholder="List any food allergies..."
                  />
                  <Input
                    label="Foods You Like"
                    value={form.likes}
                    onChange={(e) => update("likes", e.target.value)}
                    placeholder="Foods you enjoy..."
                  />
                    <Input
                      label="Foods You Dislike"
                      value={form.dislikes}
                      onChange={(e) => update("dislikes", e.target.value)}
                      placeholder="Foods to avoid..."
                    />
                  </div>
                </motion.div>
              )}

              {/* REVIEW */}
              {step === 3 && (
                <motion.div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
                  <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gray-400">
                    Please review your information before finalizing:
                  </p>
                  <div className="rounded-2xl border border-gray-700 bg-black/40 p-6">
                    <div className="space-y-3 text-sm uppercase tracking-[0.2em] text-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Age:</span>
                        <span className="text-white">{form.age || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Height:</span>
                        <span className="text-white">{form.height ? `${form.height} cm` : "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Weight:</span>
                        <span className="text-white">{form.weight ? `${form.weight} kg` : "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Gender:</span>
                        <span className="capitalize text-white">{form.gender || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Activity:</span>
                        <span className="capitalize text-white">
                          {form.activityLevel.replace("_", " ") || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Goal:</span>
                        <span className="capitalize text-white">{form.goal || "—"}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* RESULT */}
              {step === 4 && (
                <motion.div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
                  <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl text-gray-300 mb-6">
                    <h3 className="text-xl font-bold mb-4">Your Details</h3>

                    <p>Age: {form.age}</p>
                    <p>Height: {form.height} cm</p>
                    <p>Weight: {form.weight} kg</p>
                    <p>Activity: {form.activityLevel}</p>
                    <p>Goal: {form.goal}</p>

                    <p className="mt-4 text-sm text-gray-500">These will be reviewed by your coach.</p>
                  </div>

                  {!macros ? (
                    <p className="text-red-500">Not enough information to calculate macros.</p>
                  ) : (
                    <div className="space-y-4">
                      <MacroLine label="Calories" value={macros.calories.toString()} />
                      <MacroLine label="Protein" value={`${macros.protein}g`} />
                      <MacroLine label="Carbs" value={`${macros.carbs}g`} />
                      <MacroLine label="Fats" value={`${macros.fats}g`} />
                    </div>
                  )}

                  <p className="mt-6 text-xs uppercase tracking-[0.25em] text-gray-400">
                    Your coach will personally review and adjust these numbers to create your custom meal plan.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-10 flex justify-between">
            {step > 0 && step < steps.length - 1 && (
              <button
                onClick={prev}
                className="px-5 py-3 bg-gray-800 hover:bg-gray-700 transition rounded-lg font-semibold text-white border border-gray-700"
              >
                Back
              </button>
            )}
            <div className="ml-auto" />

            {step < steps.length - 1 && (
              <button
                onClick={next}
                disabled={isSaving || (step === 0 && (!form.age || !form.height || !form.weight))}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 transition rounded-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-red-600"
              >
                {isSaving
                  ? "Saving..."
                  : step === steps.length - 2
                    ? "Finish"
                    : "Next"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-gray-300">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-black border border-gray-700 focus:border-red-600 transition p-3 rounded w-full text-white placeholder:text-gray-500"
      />
    </div>
  );
}

function MacroLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-700 bg-black/40 px-6 py-4">
      <span className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-300">
        {label}
      </span>
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-lg font-bold uppercase tracking-[0.2em] text-red-500"
      >
        {value}
      </motion.span>
    </div>
  );
}

