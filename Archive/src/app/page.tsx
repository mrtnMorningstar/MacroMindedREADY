"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  CheckIcon,
  ArrowRightIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: heroEase,
    },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: heroEase,
    },
  },
};

const benefits = [
  {
    title: "Expert-Crafted Plans",
    description: "Personalized meal plans designed by certified nutrition coaches, not AI algorithms.",
  },
  {
    title: "Precision Macros",
    description: "Every macro calculated specifically for your body, goals, and training schedule.",
  },
  {
    title: "Flexible & Adaptable",
    description: "Update your plan as your goals evolve. From cut to bulk, we've got you covered.",
  },
  {
    title: "Complete Support",
    description: "Access to recipe library, dashboard tracking, and direct coach communication.",
  },
];

const process = [
  {
    step: "01",
    title: "Choose Your Plan",
    description: "Select Essential, Professional, or Premium based on your delivery timeline needs.",
  },
  {
    step: "02",
    title: "Complete Assessment",
    description: "Share your goals, stats, dietary preferences, and training schedule through our wizard.",
  },
  {
    step: "03",
    title: "Get Your Plan",
    description: "Receive your personalized meal plan within 24 hours to 5 business days, depending on your tier.",
  },
];

const homepageFAQs = [
  {
    question: "How does the meal planning process work?",
    answer: "After selecting your plan, you'll complete a comprehensive assessment covering your fitness goals, body composition, activity level, dietary restrictions, and food preferences. Our nutrition experts then design a custom meal plan with precise macro targets, meal timing, and recipes tailored to your needs. Your plan is delivered to your dashboard and email within your selected timeframe.",
  },
  {
    question: "What's included in each plan?",
    answer: "All plans include personalized daily macro targets, a complete 7-day meal plan, high-protein recipe recommendations, meal prep guidance, and access to your private dashboard. Professional and Premium tiers also include full Recipe Library access with 200+ macro-friendly recipes and priority email support.",
  },
  {
    question: "Can plans accommodate dietary restrictions?",
    answer: "Absolutely. During your assessment, you'll specify any dietary restrictions, allergies, food preferences, or intolerances. Our coaches design every meal plan around these requirements to ensure it's both effective and sustainable for your lifestyle.",
  },
  {
    question: "How do plan updates work?",
    answer: "Essential plans include 1 update, Professional includes 2, and Premium includes 3. Updates are perfect for adjusting macros as you progress, switching goals (e.g., cut to bulk), or making changes based on your results. Submit update requests directly through your dashboard.",
  },
  {
    question: "Is there a guarantee?",
    answer: "Yes. We offer a 7-day satisfaction guarantee. If you're not satisfied with your meal plan, contact us for a full refund or complimentary revision.",
  },
];

function FAQAccordion() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {homepageFAQs.map((faq, index) => (
        <motion.div
          key={index}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          custom={index * 0.1}
          className="group rounded-xl border border-neutral-800/70 bg-gradient-to-br from-neutral-900/60 via-neutral-900/50 to-neutral-950/60 backdrop-blur-sm overflow-hidden transition-all hover:border-[#D7263D]/40 hover:bg-gradient-to-br hover:from-neutral-900/70 hover:via-neutral-900/60 hover:to-neutral-950/70 shadow-[0_0_20px_-10px_rgba(0,0,0,0.3)]"
        >
          <button
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-5 text-left transition-colors"
            type="button"
          >
            <span className="text-sm font-semibold text-white pr-4 leading-relaxed">
              {faq.question}
            </span>
            {expandedIndex === index ? (
              <ChevronUpIcon className="h-5 w-5 text-[#D7263D] flex-shrink-0" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-neutral-500 flex-shrink-0 group-hover:text-[#D7263D] transition-colors" />
            )}
          </button>
          <AnimatePresence>
            {expandedIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="border-t border-neutral-800/50 bg-neutral-950/50 overflow-hidden"
              >
                <p className="p-5 text-sm text-neutral-300 leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-neutral-950 via-black to-neutral-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Animated gradient orbs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[#D7263D]/15 rounded-full blur-[140px]" 
        />
      <motion.div
        initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.2, 1],
            x: [0, -80, 0],
            y: [0, -60, 0],
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-[#D7263D]/12 rounded-full blur-[130px]" 
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.15, 0.3, 0.15],
            scale: [1, 1.15, 1],
            x: [0, 120, 0],
            y: [0, -80, 0],
          }}
          transition={{ 
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
          className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-[#D7263D]/10 rounded-full blur-[120px]" 
        />
        
        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-black/60 to-neutral-950/80" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(215, 38, 61, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(215, 38, 61, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-32">
        {/* Floating background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 0.1, 0],
                y: [0, -100, 0],
                x: [0, Math.sin(i) * 50, 0],
              }}
              transition={{
                duration: 15 + i * 2,
                repeat: Infinity,
                delay: i * 2,
                ease: "easeInOut",
              }}
              className="absolute w-2 h-2 rounded-full bg-[#D7263D] blur-sm"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
            />
          ))}
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
      <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={0.1}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D7263D]/10 border border-[#D7263D]/20 text-[#D7263D] text-xs font-semibold uppercase tracking-wider">
              <SparklesIcon className="h-4 w-4" />
              Personalized Nutrition Plans
            </span>
      </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
            variants={fadeInUp}
          custom={0.2}
            className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight tracking-tight"
        >
            Custom Meal Plans
            <br />
            <span className="text-[#D7263D]">Built for Your Goals</span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
            variants={fadeInUp}
          custom={0.3}
            className="text-lg sm:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
            Expert-designed nutrition plans tailored to your body, training schedule, and physique goals. 
            No cookie-cutter solutions. Just results.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
            variants={fadeInUp}
          custom={0.4}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/packages"
              className="group relative px-8 py-4 bg-[#D7263D] text-white font-semibold rounded-lg transition-all hover:bg-[#D7263D]/90 hover:shadow-[0_0_30px_-10px_rgba(215,38,61,0.8)] hover:scale-105"
          >
              Get Started
              <ArrowRightIcon className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/dashboard"
              className="px-8 py-4 border border-neutral-800 text-neutral-300 font-semibold rounded-lg transition-all hover:border-[#D7263D]/50 hover:text-white hover:bg-neutral-900/50"
          >
              View Dashboard
          </Link>
        </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24 px-6">
        {/* Section background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/30 to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
          initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
              Why Choose MacroMinded
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Professional nutrition coaching meets cutting-edge technology for results-driven meal planning.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={scaleIn}
                custom={index * 0.1}
                className="group p-6 rounded-xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900/50 to-neutral-950/50 backdrop-blur-sm transition-all hover:border-[#D7263D]/30 hover:shadow-[0_0_40px_-20px_rgba(215,38,61,0.4)] hover:scale-[1.02]"
              >
                <div className="w-12 h-12 rounded-lg bg-[#D7263D]/10 border border-[#D7263D]/20 flex items-center justify-center mb-4 group-hover:bg-[#D7263D]/20 transition-colors">
                  <CheckIcon className="h-6 w-6 text-[#D7263D]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-neutral-400 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-neutral-950/80 via-neutral-900/40 to-neutral-950/80">
        {/* Animated accent lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-0 w-px h-32 bg-gradient-to-b from-transparent via-[#D7263D]/20 to-transparent"
          />
          <motion.div
            initial={{ x: "200%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
            className="absolute bottom-1/4 right-0 w-px h-32 bg-gradient-to-b from-transparent via-[#D7263D]/20 to-transparent"
          />
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-neutral-400 text-lg">
              Three simple steps to your personalized meal plan.
            </p>
          </motion.div>

          <div className="space-y-8">
            {process.map((item, index) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeInUp}
                custom={index * 0.15}
                className="flex flex-col sm:flex-row gap-6 p-8 rounded-xl border border-neutral-800/70 bg-gradient-to-br from-neutral-900/50 via-neutral-900/40 to-neutral-950/50 backdrop-blur-sm hover:border-[#D7263D]/40 hover:bg-gradient-to-br hover:from-neutral-900/60 hover:via-neutral-900/50 hover:to-neutral-950/60 transition-all group shadow-[0_0_30px_-15px_rgba(0,0,0,0.5)]"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-[#D7263D] flex items-center justify-center">
                    <span className="text-2xl font-display font-bold text-white">
                      {item.step}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#D7263D] transition-colors">
                    {item.title}
                </h3>
                  <p className="text-neutral-400 leading-relaxed">
                    {item.description}
                </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA Section */}
      <section className="relative py-24 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D7263D]/5 to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={scaleIn}
            className="text-center p-12 rounded-2xl border border-neutral-800/70 bg-gradient-to-br from-neutral-900/90 via-neutral-900/80 to-neutral-950/90 backdrop-blur-md shadow-[0_0_80px_-30px_rgba(215,38,61,0.6)] relative overflow-hidden"
          >
            {/* Animated gradient overlay */}
            <motion.div
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear",
              }}
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, rgba(215, 38, 61, 0.1) 0%, transparent 50%, rgba(215, 38, 61, 0.1) 100%)`,
                backgroundSize: "200% 200%",
              }}
            />
            <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
              Ready to Transform Your Nutrition?
            </h2>
            <p className="text-neutral-400 text-lg mb-8 max-w-2xl mx-auto">
              Choose from Essential, Professional, or Premium plans. All include expert-designed meal plans, 
              personalized macros, and ongoing support.
            </p>
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#D7263D] text-white font-semibold rounded-lg transition-all hover:bg-[#D7263D]/90 hover:shadow-[0_0_30px_-10px_rgba(215,38,61,0.8)] hover:scale-105"
            >
              View Plans & Pricing
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative py-24 px-6 bg-gradient-to-b from-neutral-950/80 via-neutral-900/40 to-neutral-950/80">
        {/* Subtle animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D7263D]/10 rounded-full blur-[100px]"
          />
        </div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-neutral-400">
              Everything you need to know about our meal planning service.
            </p>
          </motion.div>

          <FAQAccordion />
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-neutral-950 to-black">
        {/* Radial gradient accent */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(215, 38, 61, 0.1) 0%, transparent 70%)'
          }}
        />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-6">
              Start Your Transformation Today
            </h2>
            <p className="text-neutral-400 text-lg mb-10 max-w-2xl mx-auto">
              Join athletes and fitness enthusiasts who trust MacroMinded for their nutrition goals.
            </p>
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 px-10 py-5 bg-[#D7263D] text-white font-semibold rounded-lg text-lg transition-all hover:bg-[#D7263D]/90 hover:shadow-[0_0_40px_-15px_rgba(215,38,61,0.8)] hover:scale-105"
            >
              Get Your Custom Meal Plan
              <ArrowRightIcon className="h-6 w-6" />
            </Link>
        </motion.div>
        </div>
      </section>
    </div>
  );
}
