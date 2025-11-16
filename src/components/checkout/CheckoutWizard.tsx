"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export type WizardFormData = {
  // Personal Info
  age: string;
  height: string;
  weight: string;
  gender: string;
  // Activity & Goals
  activityLevel: string;
  goal: string;
  // Diet Preferences
  allergies: string;
  foodsLove: string;
  foodsHate: string;
};

type CheckoutWizardProps = {
  selectedPlan: "Basic" | "Pro" | "Elite";
  planPrice: string;
  onComplete: (data: WizardFormData) => void;
  onCancel: () => void;
};

const steps = [
  { id: 1, label: "Personal Info", key: "personal" },
  { id: 2, label: "Activity & Goals", key: "activity" },
  { id: 3, label: "Diet Preferences", key: "diet" },
  { id: 4, label: "Review", key: "review" },
  { id: 5, label: "Payment", key: "payment" },
] as const;

export default function CheckoutWizard({
  selectedPlan,
  planPrice,
  onComplete,
  onCancel,
}: CheckoutWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({
    age: "",
    height: "",
    weight: "",
    gender: "",
    activityLevel: "",
    goal: "",
    allergies: "",
    foodsLove: "",
    foodsHate: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof WizardFormData, string>>>({});

  // Prevent body scroll when modal is open and lock scroll position
  useEffect(() => {
    // Save current scroll position
    const scrollY = window.scrollY;
    
    // Lock body scroll
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    
    return () => {
      // Restore scroll position
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  const updateField = useCallback((field: keyof WizardFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Partial<Record<keyof WizardFormData, string>> = {};

    if (step === 1) {
      if (!formData.age.trim()) newErrors.age = "Age is required";
      if (!formData.height.trim()) newErrors.height = "Height is required";
      if (!formData.weight.trim()) newErrors.weight = "Weight is required";
      if (!formData.gender.trim()) newErrors.gender = "Gender is required";
    } else if (step === 2) {
      if (!formData.activityLevel.trim()) newErrors.activityLevel = "Activity level is required";
      if (!formData.goal.trim()) newErrors.goal = "Goal is required";
    } else if (step === 3) {
      // Diet preferences are optional, but we can still validate if needed
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      if (validateStep(currentStep)) {
        setCurrentStep((prev) => prev + 1);
      }
    } else if (currentStep === steps.length - 1) {
      // On review step, proceed to payment
      if (validateStep(currentStep)) {
        onComplete(formData);
      }
    }
  }, [currentStep, formData, validateStep, onComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const progress = (currentStep / steps.length) * 100;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" 
      style={{ 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        padding: '1rem',
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl rounded-3xl border border-border/70 bg-background shadow-[0_0_80px_-30px_rgba(215,38,61,0.7)] flex flex-col overflow-hidden"
        style={{ 
          maxHeight: 'calc(100vh - 8rem)',
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto'
        }}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 px-8 pt-10 pb-6">
          {/* Close Button */}
          <button
            onClick={onCancel}
            className="absolute right-4 top-4 text-foreground/40 transition hover:text-foreground z-10"
          >
            <span className="text-2xl">×</span>
          </button>

          {/* Progress Bar */}
          <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold uppercase tracking-[0.32em] text-foreground">
              {steps[currentStep - 1].label}
            </h2>
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-foreground/60">
              Step {currentStep} of {steps.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-background/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-accent/60 to-accent"
            />
          </div>
          </div>

          {/* Step Indicators */}
          <div className="mb-6 flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                      isCompleted
                        ? "border-accent bg-accent/20 text-accent"
                        : isActive
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border/60 bg-background/20 text-foreground/40"
                    }`}
                  >
                    {isCompleted ? "✓" : step.id}
                  </div>
                  <span
                    className={`mt-2 text-[0.6rem] font-medium uppercase tracking-[0.2em] ${
                      isActive ? "text-foreground" : "text-foreground/40"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      isCompleted ? "bg-accent/40" : "bg-border/40"
                    }`}
                  />
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Step Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8" style={{ minHeight: 0 }}>
          <div className="pb-4">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="personal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateField("age", e.target.value)}
                    placeholder="Enter your age"
                    className="w-full rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  {errors.age && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {errors.age}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                    Height
                  </label>
                  <input
                    type="text"
                    value={formData.height}
                    onChange={(e) => updateField("height", e.target.value)}
                    placeholder={`e.g., 5'10" or 178 cm`}
                    className="w-full rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  {errors.height && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {errors.height}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                    Weight
                  </label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => updateField("weight", e.target.value)}
                    placeholder="e.g., 180 lbs or 82 kg"
                    className="w-full rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  {errors.weight && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {errors.weight}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                    className="w-full rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {errors.gender}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                    Activity Level
                  </label>
                  <select
                    value={formData.activityLevel}
                    onChange={(e) => updateField("activityLevel", e.target.value)}
                    className="w-full rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Select activity level</option>
                    <option value="Sedentary">Sedentary (little to no exercise)</option>
                    <option value="Lightly Active">Lightly Active (light exercise 1-3 days/week)</option>
                    <option value="Moderately Active">Moderately Active (moderate exercise 3-5 days/week)</option>
                    <option value="Very Active">Very Active (hard exercise 6-7 days/week)</option>
                    <option value="Extremely Active">Extremely Active (very hard exercise, physical job)</option>
                  </select>
                  {errors.activityLevel && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {errors.activityLevel}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                    Goal
                  </label>
                  <select
                    value={formData.goal}
                    onChange={(e) => updateField("goal", e.target.value)}
                    className="w-full rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Select your goal</option>
                    <option value="Lose">Lose Weight</option>
                    <option value="Gain">Gain Weight / Muscle</option>
                    <option value="Maintain">Maintain Weight</option>
                    <option value="Recomp">Body Recomposition</option>
                    <option value="Performance">Athletic Performance</option>
                  </select>
                  {errors.goal && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {errors.goal}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="diet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                    Allergies
                  </label>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => updateField("allergies", e.target.value)}
                    placeholder="List any food allergies or intolerances (e.g., peanuts, dairy, gluten)"
                    rows={4}
                    className="w-full rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                    Foods You Love
                  </label>
                  <textarea
                    value={formData.foodsLove}
                    onChange={(e) => updateField("foodsLove", e.target.value)}
                    placeholder="Tell us about foods you enjoy and want included in your plan"
                    rows={4}
                    className="w-full rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                    Foods You Hate
                  </label>
                  <textarea
                    value={formData.foodsHate}
                    onChange={(e) => updateField("foodsHate", e.target.value)}
                    placeholder="List any foods you dislike or want to avoid"
                    rows={4}
                    className="w-full rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="rounded-2xl border border-border/70 bg-muted/40 px-6 py-6">
                  <h3 className="mb-4 text-lg font-bold uppercase tracking-[0.28em] text-foreground">
                    Review Your Information
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
                          Age:
                        </span>
                        <p className="mt-1 font-medium text-foreground">{formData.age}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
                          Height:
                        </span>
                        <p className="mt-1 font-medium text-foreground">{formData.height}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
                          Weight:
                        </span>
                        <p className="mt-1 font-medium text-foreground">{formData.weight}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
                          Gender:
                        </span>
                        <p className="mt-1 font-medium text-foreground">{formData.gender}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
                        Activity Level:
                      </span>
                      <p className="mt-1 font-medium text-foreground">{formData.activityLevel}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
                        Goal:
                      </span>
                      <p className="mt-1 font-medium text-foreground">{formData.goal}</p>
                    </div>
                    {formData.allergies && (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
                          Allergies:
                        </span>
                        <p className="mt-1 font-medium text-foreground">{formData.allergies}</p>
                      </div>
                    )}
                    {formData.foodsLove && (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
                          Foods You Love:
                        </span>
                        <p className="mt-1 font-medium text-foreground">{formData.foodsLove}</p>
                      </div>
                    )}
                    {formData.foodsHate && (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
                          Foods You Hate:
                        </span>
                        <p className="mt-1 font-medium text-foreground">{formData.foodsHate}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-accent/40 bg-accent/5 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70">
                        Selected Plan
                      </p>
                      <p className="mt-1 text-lg font-bold uppercase tracking-[0.2em] text-foreground">
                        {selectedPlan} Plan
                      </p>
                    </div>
                    <p className="text-2xl font-bold uppercase tracking-[0.2em] text-accent">
                      {planPrice}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>

        {/* Navigation Buttons - Fixed */}
        <div className="flex-shrink-0 px-8 pt-6 pb-10 flex items-center justify-between gap-4 border-t border-border/30">
          <button
            onClick={currentStep === 1 ? onCancel : handleBack}
            className="rounded-full border border-border/70 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>
          <button
            onClick={handleNext}
            className="rounded-full border-2 border-accent bg-accent px-8 py-3 text-xs font-bold uppercase tracking-[0.32em] text-background transition hover:bg-transparent hover:text-accent"
          >
            {currentStep === steps.length - 1 ? "Proceed to Payment" : "Continue"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

