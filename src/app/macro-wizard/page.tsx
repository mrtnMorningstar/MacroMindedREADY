"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
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
};

type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export default function MacroWizard() {
  const { user } = useAuth();
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
      const ref = doc(db, "users", user.uid);

      await updateDoc(ref, {
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
        estimatedMacros: macros,
        macroWizardCompleted: true,
      });

      // Show success message
      toast.success("Profile saved successfully! Redirecting to dashboard...");

      // Small delay before redirect to show success message
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
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

        {/* Step dots */}
        <div className="mb-10 flex justify-center gap-2">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`h-2 rounded-full transition-all ${
                i <= step
                  ? "w-12 bg-accent"
                  : "w-8 bg-border/70"
              }`}
            />
          ))}
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-muted/60 p-10 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur">
          <div className="pointer-events-none absolute inset-x-0 -top-1/3 h-40 bg-gradient-to-b from-accent/40 via-accent/10 to-transparent blur-3xl" />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* PERSONAL */}
              {step === 0 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold uppercase tracking-[0.28em] text-foreground">
                    Personal Information
                  </h2>
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
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                      Gender
                    </label>
                    <select
                      className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm tracking-[0.08em] text-foreground focus:border-accent focus:outline-none"
                      value={form.gender}
                      onChange={(e) => update("gender", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ACTIVITY */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold uppercase tracking-[0.28em] text-foreground">
                    Activity Level
                  </h2>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                      How active are you?
                    </label>
                    <select
                      className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm tracking-[0.08em] text-foreground focus:border-accent focus:outline-none"
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
              )}

              {/* GOALS */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold uppercase tracking-[0.28em] text-foreground">
                    Goals & Preferences
                  </h2>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                      Goal
                    </label>
                    <select
                      className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm tracking-[0.08em] text-foreground focus:border-accent focus:outline-none"
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
              )}

              {/* REVIEW */}
              {step === 3 && (
                <div>
                  <h2 className="mb-6 text-xl font-bold uppercase tracking-[0.28em] text-foreground">
                    Review Your Details
                  </h2>
                  <p className="mb-4 text-xs uppercase tracking-[0.25em] text-foreground/60">
                    Please review your information before finalizing:
                  </p>
                  <div className="rounded-2xl border border-border/70 bg-background/20 p-6">
                    <div className="space-y-3 text-sm uppercase tracking-[0.2em] text-foreground/80">
                      <div className="flex justify-between">
                        <span className="text-foreground/50">Age:</span>
                        <span>{form.age || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/50">Height:</span>
                        <span>{form.height ? `${form.height} cm` : "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/50">Weight:</span>
                        <span>{form.weight ? `${form.weight} kg` : "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/50">Gender:</span>
                        <span className="capitalize">{form.gender || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/50">Activity:</span>
                        <span className="capitalize">
                          {form.activityLevel.replace("_", " ") || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/50">Goal:</span>
                        <span className="capitalize">{form.goal || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RESULT */}
              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="mb-6 text-2xl font-bold uppercase tracking-[0.28em] text-foreground">
                    Estimated Macros
                  </h2>

                  {!macros ? (
                    <p className="text-accent">Not enough information to calculate macros.</p>
                  ) : (
                    <div className="space-y-4">
                      <MacroLine label="Calories" value={macros.calories.toString()} />
                      <MacroLine label="Protein" value={`${macros.protein}g`} />
                      <MacroLine label="Carbs" value={`${macros.carbs}g`} />
                      <MacroLine label="Fats" value={`${macros.fats}g`} />
                    </div>
                  )}

                  <p className="mt-6 text-xs uppercase tracking-[0.25em] text-foreground/60">
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
                className="rounded-full border border-border/70 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
              >
                Back
              </button>
            )}
            <div className="ml-auto" />

            {step < steps.length - 1 && (
              <button
                onClick={next}
                disabled={isSaving}
                className="rounded-full border border-accent bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
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
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm tracking-[0.08em] text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function MacroLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/20 px-6 py-4">
      <span className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground/70">
        {label}
      </span>
      <span className="text-lg font-bold uppercase tracking-[0.2em] text-accent">{value}</span>
    </div>
  );
}

