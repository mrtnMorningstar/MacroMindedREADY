"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

const genders = ["Male", "Female", "Non-binary", "Prefer not to say"] as const;

const activityLevels = [
  "Sedentary",
  "Lightly Active",
  "Moderately Active",
  "Very Active",
  "Athlete",
] as const;

const goals = ["Lose", "Maintain", "Gain"] as const;

type MacroFormData = {
  height: string;
  weight: string;
  age: string;
  gender: (typeof genders)[number] | "";
  activityLevel: (typeof activityLevels)[number] | "";
  goal: (typeof goals)[number] | "";
  dietaryRestrictions: string;
  allergies: string;
  preferences: string;
};

const initialValues: MacroFormData = {
  height: "",
  weight: "",
  age: "",
  gender: "",
  activityLevel: "",
  goal: "",
  dietaryRestrictions: "",
  allergies: "",
  preferences: "",
};

const labelMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function MacroFormPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<MacroFormData>(initialValues);
  const [errors, setErrors] = useState<Record<keyof MacroFormData, string>>(
    {} as Record<keyof MacroFormData, string>
  );
  const [globalError, setGlobalError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const isFormValid = useMemo(
    () =>
      formValues.height &&
      formValues.weight &&
      formValues.age &&
      formValues.gender &&
      formValues.activityLevel &&
      formValues.goal,
    [formValues]
  );

  const handleChange = useCallback(
    (field: keyof MacroFormData) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormValues((prev) => ({
          ...prev,
          [field]: event.target.value,
        }));
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      },
    []
  );

  const validate = useCallback(() => {
    const newErrors = {} as Record<keyof MacroFormData, string>;

    (Object.keys(formValues) as Array<keyof MacroFormData>).forEach((field) => {
      const value = formValues[field];

      if (
        ["height", "weight", "age", "gender", "activityLevel", "goal"].includes(
          field
        ) &&
        !value
      ) {
        newErrors[field] = "Required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formValues]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setGlobalError(null);

      if (!userId) {
        setGlobalError("Please log in to submit your macros.");
        return;
      }

      if (!validate()) {
        return;
      }

      try {
        setSubmitting(true);
        const userDocRef = doc(db, "users", userId);
        await setDoc(
          userDocRef,
          {
            profile: {
              height: formValues.height,
              weight: formValues.weight,
              age: formValues.age,
              gender: formValues.gender,
              activityLevel: formValues.activityLevel,
              goal: formValues.goal,
              dietaryRestrictions: formValues.dietaryRestrictions,
              allergies: formValues.allergies,
              preferences: formValues.preferences,
            },
            mealPlanStatus: "In Progress",
          },
          { merge: true }
        );

        router.push("/dashboard");
      } catch (error) {
        console.error("Failed to save macro form:", error);
        setGlobalError(
          "Unable to save your details. Please try again or contact support."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [formValues, router, userId, validate]
  );

  return (
    <div className="relative isolate overflow-hidden bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-1/3 left-1/4 h-[520px] w-[520px] rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute top-1/2 right-[-160px] h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#121212_0%,rgba(0,0,0,0.92)_60%,#000000_100%)]" />
      </motion.div>

      <section className="relative mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 py-16 sm:py-24">
        <header className="flex flex-col items-center gap-4 text-center">
          <motion.span
            {...labelMotion}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-xs uppercase tracking-[0.45em] text-accent"
          >
            Macro Intake Blueprint
          </motion.span>
          <motion.h1
            {...labelMotion}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="max-w-2xl font-display text-4xl uppercase tracking-[0.24em] text-foreground sm:text-5xl"
          >
            Tell us how you live, train, and fuel
          </motion.h1>
          <motion.p
            {...labelMotion}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="max-w-2xl text-center text-xs uppercase tracking-[0.3em] text-foreground/60 sm:text-sm"
          >
            We&apos;ll craft a human-led plan calibrated precisely to your stats,
            goals, and preferences.
          </motion.p>
        </header>

        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-accent/40 bg-muted/70 px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.28em] text-accent"
          >
            {globalError}
          </motion.div>
        )}

        <motion.form
          onSubmit={handleSubmit}
          className="relative overflow-hidden rounded-3xl border border-border/80 bg-muted/60 p-8 shadow-[0_0_90px_-40px_rgba(215,38,61,0.5)] backdrop-blur"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-x-0 -top-40 h-60 bg-gradient-to-b from-accent/40 via-accent/10 to-transparent blur-3xl" />
          <div className="relative grid gap-6 sm:grid-cols-2">
            <FormField
              label="Height"
              placeholder="E.g. 5ft 10in or 178 cm"
              value={formValues.height}
              onChange={handleChange("height")}
              error={errors.height}
              required
            />
            <FormField
              label="Weight"
              placeholder="E.g. 180 lbs or 82 kg"
              value={formValues.weight}
              onChange={handleChange("weight")}
              error={errors.weight}
              required
            />
            <FormField
              label="Age"
              type="number"
              placeholder="Enter your age"
              value={formValues.age}
              onChange={handleChange("age")}
              error={errors.age}
              required
            />
            <SelectField
              label="Gender"
              value={formValues.gender}
              onChange={handleChange("gender")}
              options={genders}
              error={errors.gender}
              required
            />
            <SelectField
              label="Activity Level"
              value={formValues.activityLevel}
              onChange={handleChange("activityLevel")}
              options={activityLevels}
              error={errors.activityLevel}
              required
            />
            <SelectField
              label="Goal"
              value={formValues.goal}
              onChange={handleChange("goal")}
              options={goals}
              error={errors.goal}
              required
            />
            <FormField
              label="Dietary Restrictions"
              placeholder="E.g. gluten-free, vegetarian"
              value={formValues.dietaryRestrictions}
              onChange={handleChange("dietaryRestrictions")}
              error={errors.dietaryRestrictions}
              isTextArea
            />
            <FormField
              label="Allergies"
              placeholder="List any food allergies"
              value={formValues.allergies}
              onChange={handleChange("allergies")}
              error={errors.allergies}
              isTextArea
            />
            <FormField
              label="Food Preferences"
              placeholder="Preferred cuisines, meals, dislikes..."
              value={formValues.preferences}
              onChange={handleChange("preferences")}
              error={errors.preferences}
              isTextArea
              className="sm:col-span-2"
            />
          </div>

          <div className="relative mt-10 flex justify-center">
            <motion.button
              type="submit"
              disabled={submitting || !isFormValid}
              whileTap={{ scale: 0.98 }}
              className={`inline-flex items-center justify-center rounded-full border px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] transition ${
                submitting || !isFormValid
                  ? "cursor-not-allowed border-border/40 bg-muted/50 text-foreground/40"
                  : "border-accent bg-accent text-background hover:border-foreground hover:bg-transparent hover:text-accent"
              }`}
            >
              {submitting ? "Submitting..." : "Submit Profile"}
            </motion.button>
          </div>
        </motion.form>
      </section>
    </div>
  );
}

type CommonProps = {
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  className?: string;
  onChange: (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  placeholder?: string;
};

type FormFieldProps = CommonProps & {
  type?: "text" | "number";
  isTextArea?: boolean;
};

function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required,
  isTextArea,
  className,
}: FormFieldProps) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ""}`}>
      <span className="text-xs uppercase tracking-[0.32em] text-foreground/70">
        {label}
        {required && <span className="ml-2 text-accent">*</span>}
      </span>
      {isTextArea ? (
        <textarea
          rows={4}
          className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm tracking-[0.08em] text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
      ) : (
        <input
          type={type}
          className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm tracking-[0.08em] text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
      )}
      {error && (
        <span className="text-[0.6rem] uppercase tracking-[0.32em] text-accent">
          {error}
        </span>
      )}
    </label>
  );
}

type SelectFieldProps = CommonProps & {
  options: readonly string[];
};

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  required,
}: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.32em] text-foreground/70">
        {label}
        {required && <span className="ml-2 text-accent">*</span>}
      </span>
      <select
        className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm tracking-[0.08em] text-foreground focus:border-accent focus:outline-none"
        value={value}
        onChange={onChange}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-[0.6rem] uppercase tracking-[0.32em] text-accent">
          {error}
        </span>
      )}
    </label>
  );
}

