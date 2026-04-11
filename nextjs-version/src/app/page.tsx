"use client"

import Link from "next/link"
import { GraduationCap, BookOpen, Star, Users, ArrowRight, CheckCircle, Globe, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">ET</div>
            <span className="font-bold text-lg">EthioTutor</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-in">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center">
        <Badge variant="secondary" className="mb-4 text-xs px-3">
          🇪🇹 Ethiopia's #1 Online Tutoring Platform
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Learn from the{" "}
          <span className="text-primary">Best Tutors</span>
          <br />in Ethiopia
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect with expert tutors for Mathematics, Science, English and more.
          Book live sessions, track your progress, and ace your exams.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-lg" asChild>
            <Link href="/sign-in">
              <GraduationCap className="size-5" />
              Register as Student
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12" asChild>
            <Link href="/sign-in">
              <BookOpen className="size-5" />
              Become a Tutor
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/dashboard" className="underline underline-offset-4 hover:text-foreground">
            Sign in here
          </Link>
        </p>
      </section>

      {/* ── STATS ───────────────────────────────────────── */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "500+",  label: "Expert Tutors",      icon: Users },
            { value: "4.8★",  label: "Average Rating",     icon: Star },
            { value: "10k+",  label: "Students Helped",    icon: GraduationCap },
            { value: "12+",   label: "Subjects Covered",   icon: BookOpen },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="size-6 text-primary" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How EthioTutor Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From signup to your first session in under 5 minutes.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Create Your Profile", desc: "Tell us about yourself, your grade, and your learning goals in a quick 2-minute setup.", icon: GraduationCap },
            { step: "02", title: "Browse & Book",       desc: "Find the right tutor by subject, grade, price, and rating. Book a slot in one click.", icon: BookOpen },
            { step: "03", title: "Learn & Grow",        desc: "Join live online sessions, take notes, and track your progress over time.", icon: Award },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="flex flex-col items-center text-center gap-4 rounded-2xl border p-8 bg-card hover:shadow-md transition-shadow">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-7" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">STEP {step}</p>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SUBJECTS ────────────────────────────────────── */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Popular Subjects</h2>
            <p className="text-muted-foreground">Expert tutors available for all major subjects</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {["Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Geography", "Amharic", "Civics", "ICT"].map((sub) => (
              <Badge key={sub} variant="outline" className="text-sm px-4 py-2 rounded-xl hover:bg-primary hover:text-primary-foreground cursor-default transition-colors">
                {sub}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ETHIOTUTOR ──────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Why Students Choose EthioTutor</h2>
            <div className="space-y-4">
              {[
                "Live 1-on-1 and group sessions with expert tutors",
                "Affordable pricing starting from 120 ETB/hour",
                "Subjects aligned with Ethiopian national curriculum",
                "Session recordings for Pro plan users",
                "Track progress and access session notes",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground text-sm">{item}</p>
                </div>
              ))}
            </div>
            <Button className="mt-8 gap-2" asChild>
              <Link href="/sign-in">
                Start Learning Today <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Globe,        title: "100% Online",       desc: "Learn from anywhere in Ethiopia" },
              { icon: Star,         title: "Rated 4.8/5",       desc: "By 10,000+ happy students" },
              { icon: Award,        title: "Certified Tutors",  desc: "All tutors are verified experts" },
              { icon: GraduationCap, title: "All Grades",       desc: "Grade 5 through Grade 12" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border bg-card p-5 space-y-2">
                <Icon className="size-6 text-primary" />
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Join thousands of Ethiopian students improving their grades with EthioTutor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="gap-2 px-8" asChild>
              <Link href="/sign-in">
                <GraduationCap className="size-5" />
                Register as Student
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/sign-in">
                <BookOpen className="size-5" />
                Become a Tutor
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} EthioTutor · Connecting students with great teachers across Ethiopia.
        </div>
      </footer>
    </div>
  )
}






























































































































// "use client"


// import { Suspense, useRef, useMemo } from "react";
// import { Canvas, useFrame } from "@react-three/fiber";
// import { Float, Stars, Environment } from "@react-three/drei";
// import { GraduationCap, BookOpen, Star, Users, ArrowRight, CheckCircle, Globe, Award } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { motion } from "framer-motion";
// import * as THREE from "three";

// /* ─── 3D CHARACTER BUILDER ─────────────────────────────── */

// function Limb({ position, rotation, args, color }: { position: [number, number, number]; rotation?: [number, number, number]; args: [number, number, number]; color: string }) {
//   return (
//     <mesh position={position} rotation={rotation || [0, 0, 0]}>
//       <capsuleGeometry args={[args[0], args[1], 8, 16]} />
//       <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
//     </mesh>
//   );
// }

// function Person({
//   position,
//   skinColor,
//   shirtColor,
//   pantsColor,
//   facing,
//   hasGradCap,
//   hasGlasses,
// }: {
//   position: [number, number, number];
//   skinColor: string;
//   shirtColor: string;
//   pantsColor: string;
//   facing: 1 | -1;
//   hasGradCap?: boolean;
//   hasGlasses?: boolean;
// }) {
//   const groupRef = useRef<THREE.Group>(null!);

//   // Subtle idle breathing
//   useFrame((state) => {
//     groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
//   });

//   return (
//     <group ref={groupRef} position={position} scale={[facing, 1, 1]}>
//       {/* Head */}
//       <mesh position={[0, 1.65, 0]}>
//         <sphereGeometry args={[0.22, 16, 16]} />
//         <meshStandardMaterial color={skinColor} roughness={0.6} metalness={0.1} />
//       </mesh>

//       {/* Eyes */}
//       <mesh position={[0.08 , 1.68, 0.18]}>
//         <sphereGeometry args={[0.035, 8, 8]} />
//         <meshStandardMaterial color="#1a1a1a" />
//       </mesh>
//       <mesh position={[-0.08, 1.68, 0.18]}>
//         <sphereGeometry args={[0.035, 8, 8]} />
//         <meshStandardMaterial color="#1a1a1a" />
//       </mesh>

//       {/* Smile */}
//       <mesh position={[0, 1.6, 0.2]} rotation={[0, 0, 0]}>
//         <torusGeometry args={[0.06, 0.015, 8, 16, Math.PI]} />
//         <meshStandardMaterial color="#c44" />
//       </mesh>

//       {/* Glasses for teacher */}
//       {hasGlasses && (
//         <>
//           <mesh position={[0.09, 1.69, 0.2]}>
//             <torusGeometry args={[0.055, 0.008, 8, 16]} />
//             <meshStandardMaterial color="#333" metalness={0.8} />
//           </mesh>
//           <mesh position={[-0.09, 1.69, 0.2]}>
//             <torusGeometry args={[0.055, 0.008, 8, 16]} />
//             <meshStandardMaterial color="#333" metalness={0.8} />
//           </mesh>
//           <mesh position={[0, 1.69, 0.2]} rotation={[0, 0, Math.PI / 2]}>
//             <cylinderGeometry args={[0.006, 0.006, 0.07, 6]} />
//             <meshStandardMaterial color="#333" metalness={0.8} />
//           </mesh>
//         </>
//       )}

//       {/* Graduation cap for student */}
//       {hasGradCap && (
//         <group position={[0, 1.88, 0]}>
//           <mesh>
//             <boxGeometry args={[0.45, 0.03, 0.45]} />
//             <meshStandardMaterial color="#1a1a1a" />
//           </mesh>
//           <mesh position={[0, -0.06, 0]}>
//             <cylinderGeometry args={[0.12, 0.15, 0.12, 8]} />
//             <meshStandardMaterial color="#1a1a1a" />
//           </mesh>
//           {/* Tassel */}
//           <mesh position={[0.2, -0.02, 0.2]}>
//             <sphereGeometry args={[0.025, 8, 8]} />
//             <meshStandardMaterial color="#fbbf24" />
//           </mesh>
//         </group>
//       )}

//       {/* Torso */}
//       <mesh position={[0, 1.15, 0]}>
//         <capsuleGeometry args={[0.2, 0.45, 8, 16]} />
//         <meshStandardMaterial color={shirtColor} roughness={0.7} metalness={0.1} />
//       </mesh>

//       {/* Left arm (resting) */}
//       <Limb position={[-0.32, 1.15, 0]} rotation={[0, 0, 0.15]} args={[0.07, 0.3, 0]} color={shirtColor} />
//       {/* Left hand */}
//       <mesh position={[-0.36, 0.78, 0]}>
//         <sphereGeometry args={[0.06, 8, 8]} />
//         <meshStandardMaterial color={skinColor} roughness={0.6} />
//       </mesh>

//       {/* Right arm (extended for handshake) */}
//       <Limb position={[0.32, 1.15, 0.15]} rotation={[0.8, 0, -0.3]} args={[0.07, 0.3, 0]} color={shirtColor} />

//       {/* Legs */}
//       <Limb position={[-0.1, 0.45, 0]} rotation={[0, 0, 0.03]} args={[0.09, 0.35, 0]} color={pantsColor} />
//       <Limb position={[0.1, 0.45, 0]} rotation={[0, 0, -0.03]} args={[0.09, 0.35, 0]} color={pantsColor} />

//       {/* Shoes */}
//       <mesh position={[-0.1, 0.05, 0.04]}>
//         <boxGeometry args={[0.1, 0.08, 0.18]} />
//         <meshStandardMaterial color="#222" roughness={0.8} />
//       </mesh>
//       <mesh position={[0.1, 0.05, 0.04]}>
//         <boxGeometry args={[0.1, 0.08, 0.18]} />
//         <meshStandardMaterial color="#222" roughness={0.8} />
//       </mesh>
//     </group>
//   );
// }

// /* ─── HANDSHAKE HANDS ──────────────────────────────────── */

// function HandshakeHands() {
//   const groupRef = useRef<THREE.Group>(null!);

//   useFrame((state) => {
//     // Gentle shake animation
//     const shake = Math.sin(state.clock.elapsedTime * 3) * 0.03;
//     groupRef.current.position.y = 1.0 + shake;
//     groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.08;
//   });

//   return (
//     <group ref={groupRef} position={[0, 1.0, 0.35]}>
//       {/* Two hands clasped */}
//       <mesh position={[-0.03, 0, 0]}>
//         <sphereGeometry args={[0.07, 8, 8]} />
//         <meshStandardMaterial color="#8d5524" roughness={0.6} />
//       </mesh>
//       <mesh position={[0.03, 0, 0]}>
//         <sphereGeometry args={[0.07, 8, 8]} />
//         <meshStandardMaterial color="#c68642" roughness={0.6} />
//       </mesh>
//       {/* Glow ring around handshake */}
//       <mesh rotation={[Math.PI / 2, 0, 0]}>
//         <torusGeometry args={[0.15, 0.01, 8, 32]} />
//         <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} transparent opacity={0.5} />
//       </mesh>
//     </group>
//   );
// }

// /* ─── FLOATING PARTICLES ───────────────────────────────── */

// function Particles() {
//   const count = 150;
//   const positions = useMemo(() => {
//     const pos = new Float32Array(count * 3);
//     for (let i = 0; i < count; i++) {
//       pos[i * 3] = (Math.random() - 0.5) * 16;
//       pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
//       pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
//     }
//     return pos;
//   }, []);
//   const ref = useRef<THREE.Points>(null!);
//   useFrame((state) => {
//     ref.current.rotation.y = state.clock.elapsedTime * 0.015;
//   });
//   return (
//     <points ref={ref}>
//       <bufferGeometry>
//         <bufferAttribute attach="attributes-position" args={[positions, 3]} />
//       </bufferGeometry>
//       <pointsMaterial size={0.04} color="#22c55e" transparent opacity={0.5} sizeAttenuation />
//     </points>
//   );
// }

// /* ─── FLOATING BOOKS ───────────────────────────────────── */

// function FloatingBook({ position, color }: { position: [number, number, number]; color: string }) {
//   const ref = useRef<THREE.Mesh>(null!);
//   useFrame((state) => {
//     ref.current.rotation.y = state.clock.elapsedTime * 0.4 + position[0];
//     ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + position[2]) * 0.2;
//   });
//   return (
//     <Float speed={2} rotationIntensity={0.3} floatIntensity={0.8}>
//       <mesh ref={ref} position={position}>
//         <boxGeometry args={[0.5, 0.65, 0.08]} />
//         <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
//       </mesh>
//     </Float>
//   );
// }

// /* ─── GROUND CIRCLE ────────────────────────────────────── */

// function Ground() {
//   return (
//     <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
//       <circleGeometry args={[2, 64]} />
//       <meshStandardMaterial color="#0d3320" roughness={0.9} metalness={0.1} transparent opacity={0.6} />
//     </mesh>
//   );
// }

// /* ─── FULL 3D SCENE ────────────────────────────────────── */

// function HeroScene() {
//   return (
//     <div className="absolute inset-0 z-0">
//       <Canvas camera={{ position: [0, 1.8, 4.5], fov: 45 }} dpr={[1, 1.5]} shadows>
//         <ambientLight intensity={0.5} />
//         <directionalLight position={[3, 5, 4]} intensity={1.2} color="#ffffff" castShadow />
//         <pointLight position={[-3, 3, 2]} intensity={0.6} color="#22c55e" />
//         <pointLight position={[3, 3, 2]} intensity={0.4} color="#fbbf24" />
//         <spotLight position={[0, 4, 2]} angle={0.4} penumbra={0.5} intensity={0.8} color="#ffffff" />

//         <Stars radius={12} depth={40} count={800} factor={2.5} saturation={0.4} fade speed={0.8} />

//         {/* Teacher (left, facing right) */}
//         <Person
//           position={[-0.55, 0, 0]}
//           skinColor="#8d5524"
//           shirtColor="#1e5a3a"
//           pantsColor="#2d2d2d"
//           facing={1}
//           hasGlasses
//         />

//         {/* Student (right, facing left) */}
//         <Person
//           position={[0.55, 0, 0]}
//           skinColor="#c68642"
//           shirtColor="#1a4a6e"
//           pantsColor="#3b3b3b"
//           facing={-1}
//           hasGradCap
//         />

//         {/* Handshake in the middle */}
//         <HandshakeHands />

//         {/* Ground */}
//         <Ground />

//         {/* Floating books around scene */}
//         <FloatingBook position={[-2.8, 2.5, -2]} color="#22c55e" />
//         <FloatingBook position={[2.8, 1.8, -2.5]} color="#fbbf24" />
//         <FloatingBook position={[-2, 0.5, -3]} color="#ef4444" />
//         <FloatingBook position={[2.2, 3, -1.5]} color="#22c55e" />

//         <Particles />
//       </Canvas>
//     </div>
//   );
// }

// /* ─── DATA ─────────────────────────────────────────────── */

// const stats = [
//   { value: "500+", label: "Expert Tutors", icon: Users },
//   { value: "4.8★", label: "Average Rating", icon: Star },
//   { value: "10k+", label: "Students Helped", icon: GraduationCap },
//   { value: "12+", label: "Subjects Covered", icon: BookOpen },
// ];

// const steps = [
//   { step: "01", title: "Create Your Profile", desc: "Tell us about yourself, your grade, and your learning goals in a quick 2-minute setup.", icon: GraduationCap },
//   { step: "02", title: "Browse & Book", desc: "Find the right tutor by subject, grade, price, and rating. Book a slot in one click.", icon: BookOpen },
//   { step: "03", title: "Learn & Grow", desc: "Join live online sessions, take notes, and track your progress over time.", icon: Award },
// ];

// const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Geography", "Amharic", "Civics", "ICT"];

// const whyFeatures = [
//   "Live 1-on-1 and group sessions with expert tutors",
//   "Affordable pricing starting from 120 ETB/hour",
//   "Subjects aligned with Ethiopian national curriculum",
//   "Session recordings for Pro plan users",
//   "Track progress and access session notes",
// ];

// const whyCards = [
//   { icon: Globe, title: "100% Online", desc: "Learn from anywhere in Ethiopia" },
//   { icon: Star, title: "Rated 4.8/5", desc: "By 10,000+ happy students" },
//   { icon: Award, title: "Certified Tutors", desc: "All tutors are verified experts" },
//   { icon: GraduationCap, title: "All Grades", desc: "Grade 5 through Grade 12" },
// ];

// /* ─── MAIN PAGE ────────────────────────────────────────── */

// export default function Index() {
//   return (
//     <div className="min-h-screen bg-background overflow-x-hidden">

//       {/* NAV */}
//       <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }} className="fixed top-0 left-0 right-0 z-50 bg-glass">
//         <div className="container mx-auto flex items-center justify-between px-6 py-4">
//           <div className="flex items-center gap-2">
//             <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
//               <GraduationCap className="h-5 w-5 text-primary-foreground" />
//             </div>
//             <span className="font-heading text-xl font-bold text-foreground">
//               Ethio<span className="text-primary">Tutor</span>
//             </span>
//           </div>
//           <div className="flex items-center gap-3">
//             <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign In</Button>
//             <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">Get Started</Button>
//           </div>
//         </div>
//       </motion.nav>

//       {/* HERO */}
//       <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
//         <Suspense fallback={null}>
//           <HeroScene />
//         </Suspense>
//         <div className="relative z-10 text-center max-w-3xl mx-auto">
//           <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
//             <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/30 bg-primary/5 text-primary">
//               🇪🇹 Ethiopia's #1 Online Tutoring Platform
//             </Badge>
//           </motion.div>
//           <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="font-heading text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-7xl">
//             Learn from the <span className="text-gradient-hero">Best Tutors</span><br />in Ethiopia
//           </motion.h1>
//           <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }} className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
//             Connect with expert tutors for Mathematics, Science, English and more. Book live sessions, track your progress, and ace your exams.
//           </motion.p>
//           <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
//             <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary text-base px-8">
//               <GraduationCap className="mr-2 h-5 w-5" /> Register as Student <ArrowRight className="ml-2 h-4 w-4" />
//             </Button>
//             <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted text-base px-8">
//               <BookOpen className="mr-2 h-5 w-5" /> Become a Tutor
//             </Button>
//           </motion.div>
//           <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-6 text-sm text-muted-foreground">
//             Already have an account?{" "}
//             <a href="#" className="text-primary underline underline-offset-4 hover:text-primary/80">Sign in here</a>
//           </motion.p>
//         </div>
//       </section>

//       {/* STATS */}
//       <section className="relative z-10 -mt-16 px-6">
//         <div className="container mx-auto grid grid-cols-2 gap-4 md:grid-cols-4">
//           {stats.map(({ value, label, icon: Icon }, i) => (
//             <motion.div key={label} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }} className="bg-glass rounded-xl p-6 text-center group hover:border-primary/50 transition-all duration-300">
//               <Icon className="mx-auto mb-3 h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
//               <p className="font-heading text-2xl font-bold text-foreground md:text-3xl">{value}</p>
//               <p className="text-sm text-muted-foreground">{label}</p>
//             </motion.div>
//           ))}
//         </div>
//       </section>

//       {/* HOW IT WORKS */}
//       <section className="relative z-10 py-24 px-6">
//         <div className="container mx-auto">
//           <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
//             <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">How EthioTutor <span className="text-gradient-hero">Works</span></h2>
//             <p className="mt-4 text-muted-foreground max-w-xl mx-auto">From signup to your first session in under 5 minutes.</p>
//           </motion.div>
//           <div className="grid gap-8 md:grid-cols-3">
//             {steps.map(({ step, title, desc, icon: Icon }, i) => (
//               <motion.div key={step} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }} className="bg-glass rounded-2xl p-8 group hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
//                 <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full" />
//                 <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
//                   <Icon className="h-7 w-7 text-primary" />
//                 </div>
//                 <p className="text-sm font-bold text-primary mb-2 font-heading">STEP {step}</p>
//                 <h3 className="font-heading text-xl font-bold text-foreground mb-3">{title}</h3>
//                 <p className="text-muted-foreground leading-relaxed">{desc}</p>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* SUBJECTS */}
//       <section className="relative z-10 py-24 px-6">
//         <div className="container mx-auto text-center">
//           <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
//             <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Popular <span className="text-gradient-hero">Subjects</span></h2>
//             <p className="mt-4 text-muted-foreground">Expert tutors available for all major subjects</p>
//           </motion.div>
//           <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-12 flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
//             {subjects.map((sub, i) => (
//               <motion.div key={sub} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.1 }}>
//                 <Badge variant="outline" className="px-5 py-2.5 text-sm font-medium border-border bg-card/60 backdrop-blur text-foreground hover:border-primary hover:bg-primary/10 cursor-pointer transition-all">
//                   {sub}
//                 </Badge>
//               </motion.div>
//             ))}
//           </motion.div>
//         </div>
//       </section>

//       {/* WHY ETHIOTUTOR */}
//       <section className="relative z-10 py-24 px-6">
//         <div className="container mx-auto grid gap-12 lg:grid-cols-2 items-center">
//           <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
//             <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl mb-8">Why Students Choose <span className="text-gradient-hero">EthioTutor</span></h2>
//             <ul className="space-y-4 mb-8">
//               {whyFeatures.map((item) => (
//                 <li key={item} className="flex items-start gap-3">
//                   <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
//                   <span className="text-muted-foreground">{item}</span>
//                 </li>
//               ))}
//             </ul>
//             <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
//               Start Learning Today <ArrowRight className="ml-2 h-4 w-4" />
//             </Button>
//           </motion.div>
//           <div className="grid grid-cols-2 gap-4">
//             {whyCards.map(({ icon: Icon, title, desc }, i) => (
//               <motion.div key={title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="bg-glass rounded-xl p-6 group hover:border-primary/50 transition-all">
//                 <Icon className="mb-3 h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
//                 <h3 className="font-heading font-bold text-foreground mb-1">{title}</h3>
//                 <p className="text-sm text-muted-foreground">{desc}</p>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA BANNER */}
//       <section className="relative z-10 py-24 px-6">
//         <div className="container mx-auto">
//           <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center" style={{ background: "linear-gradient(135deg, hsl(145 63% 42% / 0.15), hsl(45 100% 51% / 0.1), hsl(0 72% 50% / 0.08))" }}>
//             <div className="absolute inset-0 bg-glass opacity-50" />
//             <div className="relative z-10">
//               <h2 className="font-heading text-3xl font-bold text-foreground md:text-5xl mb-4">Ready to Start <span className="text-gradient-hero">Learning?</span></h2>
//               <p className="text-muted-foreground max-w-lg mx-auto mb-8">Join thousands of Ethiopian students improving their grades with EthioTutor.</p>
//               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
//                 <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
//                   <GraduationCap className="mr-2 h-5 w-5" /> Register as Student <ArrowRight className="ml-2 h-4 w-4" />
//                 </Button>
//                 <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted">
//                   <BookOpen className="mr-2 h-5 w-5" /> Become a Tutor
//                 </Button>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       {/* FOOTER */}
//       <footer className="relative z-10 border-t border-border py-8 px-6">
//         <div className="container mx-auto text-center text-sm text-muted-foreground">
//           © {new Date().getFullYear()} EthioTutor · Connecting students with great teachers across Ethiopia.
//         </div>
//       </footer>
//     </div>
//   );
// }
