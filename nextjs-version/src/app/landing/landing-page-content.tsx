// "use client"

// import React from 'react'
// import { LandingNavbar } from './components/navbar'
// import { HeroSection } from './components/hero-section'
// import { LogoCarousel } from './components/logo-carousel'
// import { StatsSection } from './components/stats-section'
// import { FeaturesSection } from './components/features-section'
// import { TeamSection } from './components/team-section'
// import { TestimonialsSection } from './components/testimonials-section'
// import { BlogSection } from './components/blog-section'
// import { PricingSection } from './components/pricing-section'
// import { CTASection } from './components/cta-section'
// import { ContactSection } from './components/contact-section'
// import { FaqSection } from './components/faq-section'
// import { LandingFooter } from './components/footer'
// import { LandingThemeCustomizer, LandingThemeCustomizerTrigger } from './components/landing-theme-customizer'
// import { AboutSection } from './components/about-section'

// export function LandingPageContent() {
//   const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false)

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Navigation */}
//       <LandingNavbar />

//       {/* Main Content */}
//       <main>
//         <HeroSection />
//         <LogoCarousel />
//         <StatsSection />
//         <AboutSection />
//         <FeaturesSection />
//         <TeamSection />
//         <PricingSection />
//         <TestimonialsSection />
//         <BlogSection />
//         <FaqSection />
//         <CTASection />
//         <ContactSection />
//       </main>

//       {/* Footer */}
//       <LandingFooter />

//       {/* Theme Customizer */}
//       <LandingThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
//       <LandingThemeCustomizer open={themeCustomizerOpen} onOpenChange={setThemeCustomizerOpen} />
//     </div>
//   )
// }
"use client"

import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

// Your existing imports (untouched)
import { LandingNavbar } from './components/navbar'
import { HeroSection } from './components/hero-section'
import { LogoCarousel } from './components/logo-carousel'
import { StatsSection } from './components/stats-section'
import { FeaturesSection } from './components/features-section'
import { TeamSection } from './components/team-section'
import { TestimonialsSection } from './components/testimonials-section'
import { BlogSection } from './components/blog-section'
import { PricingSection } from './components/pricing-section'
import { CTASection } from './components/cta-section'
import { ContactSection } from './components/contact-section'
import { FaqSection } from './components/faq-section'
import { LandingFooter } from './components/footer'
import { LandingThemeCustomizer, LandingThemeCustomizerTrigger } from './components/landing-theme-customizer'
import { AboutSection } from './components/about-section'

// ==========================================
// 1. DYNAMIC "LIVE ED-TECH NETWORK" BACKGROUND
// Simulates live video sessions, whiteboards, and student connections floating
// ==========================================
const DynamicPlatformBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#030014]">
      {/* Moving Data Grid */}
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: 50 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #8b5cf6 1px, transparent 1px), linear-gradient(to bottom, #8b5cf6 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating Ambient Glowing Orbs (Soft Pop Accents) */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, 100, 0], y: [0, -50, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/20 blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.4, 1], x: [0, -80, 0], y: [0, 80, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[30%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-cyan-500/20 blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 50, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[10%] left-[20%] w-[60vw] h-[40vw] rounded-full bg-fuchsia-600/20 blur-[120px]"
      />

      {/* Abstract "Live Video / Whiteboard" Glass Panels Floating Continuously */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`panel-${i}`}
          initial={{ 
            y: "110vh", 
            x: `${(i * 20) + 5}vw`, 
            rotateX: 45, 
            rotateY: (i % 2 === 0) ? 20 : -20,
            opacity: 0
          }}
          animate={{ 
            y: "-20vh", 
            rotateX: [45, 10, 45],
            rotateY: (i % 2 === 0) ? [20, 40, 20] : [-20, -40, -20],
            opacity: [0, 0.3, 0] 
          }}
          transition={{ 
            duration: 15 + (i * 2), 
            repeat: Infinity, 
            delay: i * 3,
            ease: "linear" 
          }}
          className="absolute w-[300px] h-[200px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl"
          style={{ perspective: "1000px" }}
        >
          {/* Mock UI lines inside the floating panels to look like dashboards/whiteboards */}
          <div className="p-4 flex flex-col gap-3 opacity-50">
            <div className="h-3 w-1/3 bg-white/20 rounded-full" />
            <div className="h-2 w-full bg-white/10 rounded-full" />
            <div className="h-2 w-5/6 bg-white/10 rounded-full" />
            <div className="mt-auto h-20 w-full bg-gradient-to-t from-white/10 to-transparent rounded-lg" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ==========================================
// 2. 3D SCROLL REVEAL WRAPPER
// Brings components to life as you scroll down
// ==========================================
const ScrollRevealWrapper = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.9, rotateX: -15 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ 
        duration: 1, 
        delay: delay, 
        type: "spring", 
        stiffness: 80,
        damping: 20
      }}
      className="w-full relative z-10"
      style={{ perspective: "1200px" }}
    >
      {/* Glassmorphic backing card to make your components readable over the animated background */}
      <div className="bg-background/40 backdrop-blur-xl border border-white/5 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-2 md:p-6 mx-2 md:mx-auto max-w-[1400px]">
        {children}
      </div>
    </motion.div>
  )
}

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================
export function LandingPageContent() {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Top Progress Bar for a futuristic interface feel
  const { scrollYProgress } = useScroll({ target: containerRef })
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  // Parallax effect specifically for the Hero Section
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 150])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])

  return (
    <div ref={containerRef} className="min-h-screen relative selection:bg-fuchsia-500/30 text-foreground overflow-x-hidden">
      
      {/* 1. The Active Moving Background (Hedge Fund "Wow" Factor) */}
      <DynamicPlatformBackground />

      {/* 2. Bold Accent Top Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 origin-left z-50 shadow-[0_0_20px_rgba(217,70,239,0.5)]"
        style={{ scaleX }}
      />

      {/* 3. Navigation with Dropdown Animation */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
        className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-background/30 border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
      >
        <LandingNavbar />
      </motion.div>

      {/* 4. Main Content Flow */}
      <main className="relative flex flex-col gap-16 pb-24 pt-8">
        
        {/* HERO SECTION: Intense Parallax & 3D Glow Entrance */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full flex justify-center px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50, rotateX: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.5, type: "spring", bounce: 0.3 }}
            className="w-full max-w-7xl relative"
            style={{ perspective: "1500px" }}
          >
            {/* Pulsing glow ring specifically behind the hero to make it pop */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-cyan-600/30 blur-3xl rounded-[100px] -z-10 animate-pulse" />
            
            {/* The actual component you provided */}
            <HeroSection />
          </motion.div>
        </motion.div>

        {/* LOGO CAROUSEL: Tutors/Partners moving */}
        <ScrollRevealWrapper delay={0.1}>
          <LogoCarousel />
        </ScrollRevealWrapper>

        {/* STATS: Showing scale of platform */}
        <ScrollRevealWrapper>
          <StatsSection />
        </ScrollRevealWrapper>

        <ScrollRevealWrapper>
          <AboutSection />
        </ScrollRevealWrapper>

        {/* FEATURES: Whiteboard, Video, Scheduling */}
        <ScrollRevealWrapper>
          <FeaturesSection />
        </ScrollRevealWrapper>

        <ScrollRevealWrapper>
          <TeamSection />
        </ScrollRevealWrapper>

        <ScrollRevealWrapper>
          <PricingSection />
        </ScrollRevealWrapper>

        <ScrollRevealWrapper>
          <TestimonialsSection />
        </ScrollRevealWrapper>

        <ScrollRevealWrapper>
          <BlogSection />
        </ScrollRevealWrapper>

        <ScrollRevealWrapper>
          <FaqSection />
        </ScrollRevealWrapper>

        {/* CTA SECTION: High-energy bold accent */}
        <ScrollRevealWrapper>
          <div className="relative group overflow-hidden rounded-3xl">
            {/* Moving gradient hover effect behind CTA */}
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 blur-2xl group-hover:opacity-100 transition-opacity duration-700" />
            <CTASection />
          </div>
        </ScrollRevealWrapper>

        <ScrollRevealWrapper>
          <ContactSection />
        </ScrollRevealWrapper>
      </main>

      {/* 5. Footer */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="relative z-10 bg-black/50 backdrop-blur-2xl border-t border-white/10 pt-10"
      >
        <LandingFooter />
      </motion.div>

      {/* 6. Theme Customizer */}
      <LandingThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
      <LandingThemeCustomizer open={themeCustomizerOpen} onOpenChange={setThemeCustomizerOpen} />
    </div>
  )
}