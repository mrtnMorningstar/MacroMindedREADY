"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const steps = [
  "Personal",
  "Activity",
  "Goals",
  "Lifestyle",
  "Review",
  "Result"
];

export default function MacroWizard() {
  const [user] = useAuthState(auth);

  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
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
    struggles: ""
  });

  const update = (key, value) => setForm({ ...form, [key]: value });

  // Fake macro calculation (coach will adjust real values)
  const calculateMacros = () => {
    const w = parseFloat(form.weight);
    const h = parseFloat(form.height);
    const a = parseFloat(form.age);

    if (!w || !h || !a) return null;

    let bmr =
      form.gender === "male"
        ? 10 * w + 6.25 * h - 5 * a + 5
        : 10 * w + 6.25 * h - 5 * a - 161;

    const activity = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    }[form.activityLevel] || 1.2;

    let calories = bmr * activity;

    if (form.goal === "lose") calories -= 350;
    if (form.goal === "gain") calories += 350;

    const protein = w * 2.2 * 0.8;
    const fats = (calories * 0.25) / 9;
    const carbs = (calories - (protein * 4 + fats * 9)) / 4;

    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fats: Math.round(fats)
    };
  };

  const macros = calculateMacros();

  const saveToFirestore = async () => {
    if (!user) return;

    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, {
      profile: form,
      estimatedMacros: macros,
      macroWizardCompleted: true
    });
  };

  const next = async () => {
    if (step === steps.length - 2) await saveToFirestore();
    setStep(step + 1);
  };

  const prev = () => setStep(step - 1);

  return (
    <div className="max-w-xl mx-auto py-12 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Complete Your Setup</h1>

      <div className="flex justify-center gap-2 mb-10">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-8 rounded-full ${
              i <= step ? "bg-red-600" : "bg-gray-700"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >

          {/* PERSONAL */}
          {step === 0 && (
            <div className="space-y-4">
              <Input label="Age" value={form.age} onChange={(e) => update("age", e.target.value)} />
              <Input label="Height (cm)" value={form.height} onChange={(e) => update("height", e.target.value)} />
              <Input label="Weight (kg)" value={form.weight} onChange={(e) => update("weight", e.target.value)} />

              <Select
                label="Gender"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
                options={[
                  { value: "", label: "Select" },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" }
                ]}
              />
            </div>
          )}

          {/* ACTIVITY */}
          {step === 1 && (
            <Select
              label="Activity Level"
              value={form.activityLevel}
              onChange={(e) => update("activityLevel", e.target.value)}
              options={[
                { value: "", label: "Select" },
                { value: "sedentary", label: "Sedentary" },
                { value: "light", label: "Light (1–3 days/week)" },
                { value: "moderate", label: "Moderate (3–5 days/week)" },
                { value: "active", label: "Active (6–7 days/week)" },
                { value: "very_active", label: "Very Active / Athlete" }
              ]}
            />
          )}

          {/* GOALS */}
          {step === 2 && (
            <div className="space-y-4">
              <Select
                label="Main Goal"
                value={form.goal}
                onChange={(e) => update("goal", e.target.value)}
                options={[
                  { value: "", label: "Select" },
                  { value: "lose", label: "Lose Weight" },
                  { value: "maintain", label: "Maintain Weight" },
                  { value: "gain", label: "Gain Weight" }
                ]}
              />

              <Input label="Allergies" value={form.allergies} onChange={(e) => update("allergies", e.target.value)} />
              <Input label="Foods You Like" value={form.likes} onChange={(e) => update("likes", e.target.value)} />
              <Input label="Foods You Dislike" value={form.dislikes} onChange={(e) => update("dislikes", e.target.value)} />
            </div>
          )}

          {/* LIFESTYLE */}
          {step === 3 && (
            <div className="space-y-4">
              <TextArea
                label="Describe your lifestyle"
                placeholder="Work, school, daily routine, etc."
                value={form.lifestyle}
                onChange={(e) => update("lifestyle", e.target.value)}
              />

              <TextArea
                label="Work schedule & availability"
                placeholder="Waking time, work hours, meal times, flexibility"
                value={form.workSchedule}
                onChange={(e) => update("workSchedule", e.target.value)}
              />

              <TextArea
                label="Exercise habits"
                placeholder="Training days, type of workouts, intensity"
                value={form.exerciseHabits}
                onChange={(e) => update("exerciseHabits", e.target.value)}
              />

              <TextArea
                label=
