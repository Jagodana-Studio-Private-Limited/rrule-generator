"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AnimatedGradientText } from "@/components/animated-gradient-text";
import { FAQSection } from "@/components/faq-section";
import { RelatedTools } from "@/components/related-tools";
import { Button } from "@/components/ui/button";
import { SocialShare } from "@/components/social-share";
import { GitHubStar } from "@/components/github-star";
import { siteConfig } from "@/config/site";
import { RRuleGeneratorTool } from "@/components/rrule-generator-tool";

export function HomePage() {
  const scrollToTool = useCallback(() => {
    document
      .getElementById("tool")
      ?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-screen-xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 mb-6"
          >
            <Sparkles className="h-4 w-4 text-brand" />
            <span className="text-sm text-brand font-medium">
              {siteConfig.hero.badge}
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight"
          >
            {siteConfig.hero.titleLine1}
            <br className="hidden sm:block" />
            <AnimatedGradientText>{siteConfig.hero.titleGradient}</AnimatedGradientText>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {siteConfig.hero.subtitle}
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              onClick={scrollToTool}
              aria-label="Scroll to tool section"
              className="gap-2 bg-gradient-to-r from-brand to-brand-accent text-white shadow-lg shadow-brand/25 px-8 py-6 text-lg"
            >
              Try Now
              <ArrowDown className="h-5 w-5" />
            </Button>
          </motion.div>
        </section>

        {/* Feature Cards */}
        <section className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {siteConfig.featureCards.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="text-center p-6 rounded-2xl bg-muted/30 border border-border/50"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Tool Interface */}
        <section id="tool" className="scroll-mt-24 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RRuleGeneratorTool />
          </motion.div>
        </section>

        {/* Share + GitHub Star */}
        <section className="flex items-center justify-center gap-3 mb-20">
          <SocialShare />
          <GitHubStar />
        </section>

        {/* FAQ Section */}
        <section className="text-center mb-20">
          <FAQSection />
        </section>

        {/* Related Tools - Cross-linking for SEO */}
        <section className="text-center">
          <RelatedTools />
        </section>
      </main>

      <Footer />
    </div>
  );
}
