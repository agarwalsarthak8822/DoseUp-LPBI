"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { 
  Truck, Clock, Shield, Store, ChevronRight, Search, MapPin, 
  Star, Zap, Brain, BadgeCheck, TrendingUp, Package, Plus, Heart,
  Sparkles, Rocket, Users, Award, ShoppingCart, Check, CreditCard,
  Fingerprint, PartyPopper, Navigation
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DoseuppLogo } from "@/components/DoseuppLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CustomerAuthNav } from "@/components/auth/CustomerAuthNav";
import { getPharmaciesWithDistances, type Pharmacy, subscribeToPharmacies } from "@/lib/pharmacy-store";
import { getFeaturedMedicines, type Medicine, medicines } from "@/lib/medicines-store";

const stats = [
  { value: "500+", label: "Partner Pharmacies", icon: Store },
  { value: "50K+", label: "Deliveries Done", icon: Package },
  { value: "12 min", label: "Avg Delivery Time", icon: Clock },
  { value: "4.9", label: "Customer Rating", icon: Star },
];

const features = [
  { icon: Brain, title: "AI-Powered Selection", desc: "Smart algorithm finds the nearest pharmacy with your medicines in stock" },
  { icon: Clock, title: "12-Minute Delivery", desc: "Get medicines delivered faster than any other platform" },
  { icon: Shield, title: "Verified Pharmacies", desc: "All partners are licensed and verified by our team" },
  { icon: TrendingUp, title: "Best Prices", desc: "Compare prices and save up to 40% on medicines" },
];

const trustedBy = [
  "Apollo Pharmacy", "MedPlus", "Fortis", "Max Healthcare", "Wellness Forever",
  "NetMeds", "PharmEasy", "1mg", "Guardian", "LifeCare"
];

const userLocation = { lat: 28.6139, lng: 77.2090 };

function MarqueeSection() {
  return (
    <div className="py-8 border-y border-border bg-card/50">
      <div className="marquee-container">
        <div className="marquee-content">
          {[...trustedBy, ...trustedBy].map((brand, i) => (
            <div key={i} className="flex items-center gap-8 mx-8">
              <span className="text-muted-foreground font-medium whitespace-nowrap">{brand}</span>
              <Sparkles className="w-4 h-4 text-primary/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type AnimationPhase = "browsing" | "selecting" | "adding" | "cart" | "checkout" | "processing" | "tracking" | "delivered";

function MobilePhoneAnimation() {
  const [phase, setPhase] = useState<AnimationPhase>("browsing");
  const [selectedMedicine, setSelectedMedicine] = useState(0);
  const [cartItems, setCartItems] = useState<number[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState("");
  const [trackingProgress, setTrackingProgress] = useState(0);
  const demoMedicines = medicines.slice(0, 3);
  
  const cartTotal = cartItems.reduce((sum, id) => sum + (medicines.find(m => m.id === id)?.price || 0), 0);

  useEffect(() => {
    const runAnimation = async () => {
      await new Promise(r => setTimeout(r, 1500));
      
      for (let i = 0; i < 3; i++) {
        setPhase("selecting");
        setSelectedMedicine(i);
        await new Promise(r => setTimeout(r, 800));
        
        setPhase("adding");
        setCartItems(prev => [...prev, demoMedicines[i].id]);
        setNotificationText(`${demoMedicines[i].name.split(' ')[0]} added!`);
        setShowNotification(true);
        await new Promise(r => setTimeout(r, 600));
        setShowNotification(false);
        await new Promise(r => setTimeout(r, 400));
        
        setPhase("browsing");
        await new Promise(r => setTimeout(r, 600));
      }

      setPhase("cart");
      await new Promise(r => setTimeout(r, 1500));
      
      setPhase("checkout");
      await new Promise(r => setTimeout(r, 1200));

      setPhase("processing");
      await new Promise(r => setTimeout(r, 2000));

      setPhase("tracking");
      for (let p = 0; p <= 100; p += 5) {
        setTrackingProgress(p);
        await new Promise(r => setTimeout(r, 100));
      }
      await new Promise(r => setTimeout(r, 500));

      setPhase("delivered");
      await new Promise(r => setTimeout(r, 3000));

      setCartItems([]);
      setTrackingProgress(0);
      setPhase("browsing");
    };

    runAnimation();
    const interval = setInterval(runAnimation, 22000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[300px] h-[560px] sm:h-[600px]">
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-[3rem] blur-3xl"
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.7, 0.5]
        }}
        transition={{ repeat: Infinity, duration: 4 }}
      />
      
      <div className="relative w-full h-full bg-card border-4 border-zinc-800 dark:border-zinc-600 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="h-7 bg-zinc-900 flex items-center justify-center relative">
          <div className="absolute left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-900 rounded-b-xl flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-zinc-800 border-2 border-zinc-700" />
          </div>
        </div>
        
        <div className="h-14 px-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
              animate={{ rotate: phase === "processing" ? 360 : 0 }}
              transition={{ repeat: phase === "processing" ? Infinity : 0, duration: 1, ease: "linear" }}
            >
              <Package className="w-5 h-5 text-white" />
            </motion.div>
            <span className="font-bold text-foreground">Doseupp</span>
          </div>
          <motion.div 
            className="relative cursor-pointer"
            animate={{ scale: cartItems.length > 0 ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <ShoppingCart className="w-6 h-6 text-foreground" />
            <AnimatePresence>
              {cartItems.length > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-white text-[11px] rounded-full flex items-center justify-center font-bold"
                >
                  {cartItems.length}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="h-[calc(100%-7rem)] overflow-hidden bg-background relative">
          <AnimatePresence mode="wait">
            {(phase === "browsing" || phase === "selecting" || phase === "adding") && (
              <motion.div
                key="browse"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="p-3 h-full"
              >
                <div className="bg-muted rounded-xl p-2.5 flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <motion.span 
                    className="text-xs text-muted-foreground"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    Search medicines...
                  </motion.span>
                </div>

                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">POPULAR MEDICINES</p>
                
                <div className="space-y-2">
                  {demoMedicines.map((med, index) => (
                    <motion.div
                      key={med.id}
                      animate={{
                        scale: selectedMedicine === index && phase === "selecting" ? 1.03 : 1,
                        borderColor: selectedMedicine === index && phase === "selecting" 
                          ? "hsl(var(--primary))" 
                          : cartItems.includes(med.id) 
                            ? "hsl(var(--accent))" 
                            : "hsl(var(--border))"
                      }}
                      className="bg-card rounded-xl p-3 border-2 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img src={med.image} alt={med.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase">{med.brand}</p>
                          <p className="text-sm font-semibold text-foreground truncate">{med.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-primary">₹{med.price}</p>
                            <p className="text-[10px] text-muted-foreground line-through">₹{med.originalPrice}</p>
                          </div>
                        </div>
                        <motion.div
                          animate={{
                            scale: selectedMedicine === index && phase === "adding" ? [1, 1.3, 1] : 1,
                            backgroundColor: cartItems.includes(med.id) ? "hsl(var(--primary))" : "hsl(var(--muted))"
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                        >
                          {cartItems.includes(med.id) ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === "cart" && (
              <motion.div
                key="cart"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="p-3 h-full flex flex-col"
              >
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Your Cart
                </h3>
                
                <div className="flex-1 space-y-2 overflow-auto">
                  {cartItems.map((id, i) => {
                    const med = medicines.find(m => m.id === id);
                    if (!med) return null;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-card rounded-xl p-2 border border-border flex items-center gap-2"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                          <img src={med.image} alt={med.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{med.name}</p>
                          <p className="text-xs text-primary font-bold">₹{med.price}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">₹{cartTotal}</span>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="bg-gradient-to-r from-primary to-accent text-white p-3 rounded-xl text-center font-bold text-sm"
                  >
                    Proceed to Checkout
                  </motion.div>
                </div>
              </motion.div>
            )}

            {phase === "checkout" && (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="p-3 h-full flex flex-col"
              >
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Payment
                </h3>

                <div className="space-y-3 flex-1">
                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Delivery Address</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Connaught Place, Delhi</p>
                    </div>
                  </div>

                  <motion.div 
                    animate={{ borderColor: ["hsl(var(--border))", "hsl(var(--primary))", "hsl(var(--border))"] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="bg-primary/10 rounded-xl p-3 border-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">UPI Payment</p>
                        <p className="text-xs text-muted-foreground">Pay securely with UPI</p>
                      </div>
                      <Check className="w-5 h-5 text-primary ml-auto" />
                    </div>
                  </motion.div>

                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">₹{cartTotal}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="text-foreground">₹25</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">₹{cartTotal + 25}</span>
                    </div>
                  </div>
                </div>

                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="bg-gradient-to-r from-primary to-accent text-white p-3 rounded-xl text-center font-bold text-sm mt-3"
                >
                  Pay ₹{cartTotal + 25}
                </motion.div>
              </motion.div>
            )}

            {phase === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="h-full flex flex-col items-center justify-center p-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary mb-4"
                />
                <motion.p 
                  className="font-bold text-foreground mb-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  Processing Order...
                </motion.p>
                <div className="space-y-2 w-full">
                  {["Finding pharmacy", "Confirming stock", "Assigning rider"].map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.5 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.3 }}
                        className="w-2 h-2 rounded-full bg-accent"
                      />
                      <span className="text-muted-foreground">{step}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === "tracking" && (
              <motion.div
                key="tracking"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="p-3 h-full flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                  <span className="text-xs font-semibold text-green-500">LIVE TRACKING</span>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl h-32 mb-3 relative overflow-hidden">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }} />
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                    <motion.path
                      d="M 10 85 Q 30 70, 50 60 T 90 20"
                      stroke="url(#mobileRouteGradient)"
                      strokeWidth="2"
                      strokeDasharray="4,2"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1 }}
                    />
                    <defs>
                      <linearGradient id="mobileRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <motion.div
                    className="absolute"
                    animate={{ 
                      left: `${10 + (trackingProgress * 0.8)}%`,
                      top: `${85 - (trackingProgress * 0.65)}%`
                    }}
                    style={{ transform: 'translate(-50%, -50%)' }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Truck className="w-4 h-4 text-white" />
                    </motion.div>
                  </motion.div>
                </div>

                <div className="bg-card rounded-xl p-3 border border-border mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">Delivery Progress</span>
                    <span className="text-sm font-bold text-primary">{trackingProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                      style={{ width: `${trackingProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  {[
                    { icon: Package, label: "Order Confirmed", done: trackingProgress > 10 },
                    { icon: Store, label: "Picked from Pharmacy", done: trackingProgress > 40 },
                    { icon: Truck, label: "Out for Delivery", done: trackingProgress > 70 },
                    { icon: Navigation, label: "Arriving Soon", done: trackingProgress > 90 },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <motion.div
                        animate={{ 
                          backgroundColor: step.done ? "hsl(var(--primary))" : "hsl(var(--muted))",
                          scale: step.done ? [1, 1.1, 1] : 1
                        }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                      >
                        <step.icon className={`w-3 h-3 ${step.done ? "text-white" : "text-muted-foreground"}`} />
                      </motion.div>
                      <span className={`text-xs ${step.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                      {step.done && <Check className="w-3 h-3 text-green-500 ml-auto" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === "delivered" && (
              <motion.div
                key="delivered"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="h-full flex flex-col items-center justify-center p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="relative mb-4"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ repeat: 3, duration: 0.8 }}
                    className="absolute inset-0 w-20 h-20 rounded-full bg-green-500"
                  />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center relative">
                    <PartyPopper className="w-10 h-10 text-white" />
                  </div>
                </motion.div>
                
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold text-foreground mb-2"
                >
                  Delivered!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-muted-foreground mb-4"
                >
                  Your medicines have arrived safely
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex gap-1"
                >
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    >
                      <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showNotification && (
              <motion.div
                initial={{ opacity: 0, y: 50, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: -20, x: "-50%" }}
                className="absolute bottom-4 left-1/2 bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span className="text-xs font-semibold">{notificationText}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [featuredMedicines, setFeaturedMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  useEffect(() => {
    const loadPharmacies = () => {
      const pharmaciesWithDistance = getPharmaciesWithDistances(userLocation.lat, userLocation.lng);
      setPharmacies(pharmaciesWithDistance.slice(0, 6));
    };
    loadPharmacies();
    setFeaturedMedicines(getFeaturedMedicines());
    const unsubscribe = subscribeToPharmacies(loadPharmacies);
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background mesh-gradient">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <DoseuppLogo size="md" />
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/order" className="text-muted-foreground hover:text-primary transition-colors font-medium">Order Medicine</Link>
            <Link href="/track" className="text-muted-foreground hover:text-primary transition-colors font-medium">Track Order</Link>
            <Link href="/pharmacy/onboarding" className="text-muted-foreground hover:text-primary transition-colors font-medium">Partner with Us</Link>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <CustomerAuthNav />
            <ThemeToggle />
            <Link href="/pharmacy/onboarding">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white hidden sm:flex font-medium">
                <Store className="w-4 h-4 mr-2" />
                For Pharmacies
              </Button>
            </Link>
            <Link href="/order">
              <Button className="btn-primary-gradient font-semibold px-6">
                Order Now
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <motion.section 
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="pt-32 pb-20 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 mb-8"
              >
                <Rocket className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Ultrafast Medicine Delivery in Delhi NCR</span>
              </motion.div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight text-foreground">
                Your Health,{" "}
                <span className="gradient-text">Delivered Fast</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
                AI-powered medicine delivery in under 12 minutes. 
                From prescription to doorstep, we&apos;ve got you covered.
              </p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
              >
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search medicines, vitamins..." 
                    className="pl-12 pr-4 py-6 text-lg bg-card border-border rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Link href="/order">
                  <Button size="lg" className="px-10 py-6 btn-primary-gradient font-bold rounded-2xl text-lg">
                    Get Started <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex justify-center lg:justify-end"
            >
              <MobilePhoneAnimation />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          >
            {stats.map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -8 }}
                className="glass-card rounded-2xl p-6 text-center card-hover"
              >
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3"
                >
                  <stat.icon className="w-6 h-6 text-primary" />
                </motion.div>
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <MarqueeSection />

      <AnimatedSection className="py-20 px-6 bg-gradient-to-b from-transparent to-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">Featured Medicines</h2>
              <p className="text-muted-foreground">
                Top selling medicines at the best prices
              </p>
            </div>
            <Link href="/order">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-medium">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredMedicines.map((medicine, i) => {
              const discount = Math.round((1 - medicine.price / medicine.originalPrice) * 100);
              return (
                <motion.div
                  key={medicine.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.03, y: -8 }}
                  className="medicine-card rounded-2xl overflow-hidden group"
                >
                  <div className="relative h-32 bg-gradient-to-br from-secondary/50 to-card overflow-hidden">
                    <img 
                      src={medicine.image} 
                      alt={medicine.name}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                    />
                    {discount > 0 && (
                      <Badge className="absolute top-2 left-2 bg-accent text-white border-0 font-bold">
                        {discount}% OFF
                      </Badge>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart className="w-4 h-4 text-primary" />
                    </motion.button>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{medicine.brand}</p>
                    <h3 className="font-semibold text-sm mb-2 line-clamp-1 text-foreground">{medicine.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-primary">₹{medicine.price}</span>
                      <span className="text-sm text-muted-foreground line-through">₹{medicine.originalPrice}</span>
                    </div>
                    <Link href="/order">
                      <Button
                        className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-semibold group-hover:bg-primary group-hover:text-white"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add to Cart
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">Why Choose <span className="gradient-text">Doseupp</span>?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The most advanced medicine delivery platform powered by AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -8 }}
                className="glass-card rounded-2xl p-6 card-hover group"
              >
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-5 group-hover:glow-primary transition-all"
                >
                  <feature.icon className="w-7 h-7 text-primary" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="py-20 px-6 bg-gradient-to-b from-transparent to-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">Partner Pharmacies</h2>
              <p className="text-muted-foreground">
                {pharmacies.length}+ verified pharmacies in Delhi NCR
              </p>
            </div>
            <Link href="/order">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-medium">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pharmacies.map((pharmacy, i) => (
              <motion.div
                key={pharmacy.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.03, y: -6 }}
                className="glass-card rounded-2xl overflow-hidden card-hover group cursor-pointer"
              >
                <div className="h-36 overflow-hidden relative">
                  <img 
                    src={pharmacy.image} 
                    alt={pharmacy.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                  {!pharmacy.isVerified && (
                    <motion.span 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute top-3 right-3 new-badge text-xs px-2.5 py-1 rounded-full text-white font-medium"
                    >
                      NEW
                    </motion.span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold line-clamp-1 text-foreground">{pharmacy.name}</h3>
                        {pharmacy.isVerified && (
                          <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{pharmacy.area}, {pharmacy.city}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg shrink-0">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      <span className="text-sm font-semibold text-primary">{pharmacy.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-foreground font-medium">{pharmacy.distance}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="text-foreground font-medium">{pharmacy.deliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground font-medium">₹{pharmacy.deliveryFee}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="glass-card rounded-3xl p-10 md:p-16 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <motion.div 
              animate={{ 
                x: [0, 100, 0],
                y: [0, -50, 0],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ repeat: Infinity, duration: 10 }}
              className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" 
            />
            <motion.div 
              animate={{ 
                x: [0, -50, 0],
                y: [0, 30, 0],
                opacity: [0.1, 0.15, 0.1]
              }}
              transition={{ repeat: Infinity, duration: 8, delay: 1 }}
              className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" 
            />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 text-center md:text-left">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6"
                >
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm text-accent font-medium">Grow your business 40%</span>
                </motion.div>
                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">Own a Pharmacy?</h2>
                <p className="text-muted-foreground max-w-xl mb-8 leading-relaxed">
                  Join our network of 500+ pharmacies in Delhi NCR. Get access to thousands of customers, 
                  smart inventory management, and daily settlements.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link href="/pharmacy/onboarding">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="px-10 py-6 btn-primary-gradient font-bold rounded-2xl">
                        Partner with Us <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/pharmacy/dashboard">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" variant="outline" className="px-8 py-6 border-primary text-primary hover:bg-primary hover:text-white rounded-2xl font-medium">
                        View Dashboard
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </div>
              <motion.div 
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, 2, 0, -2, 0]
                }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="w-32 h-32 md:w-48 md:h-48 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary"
              >
                <Store className="w-16 h-16 md:w-24 md:h-24 text-white" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      <footer className="py-12 px-6 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <DoseuppLogo size="md" />
            <div className="flex items-center gap-8 text-muted-foreground">
              <Link href="/order" className="hover:text-primary transition-colors font-medium">Order</Link>
              <Link href="/track" className="hover:text-primary transition-colors font-medium">Track</Link>
              <Link href="/pharmacy/onboarding" className="hover:text-primary transition-colors font-medium">Partner</Link>
              <Link href="/pharmacy/dashboard" className="hover:text-primary transition-colors font-medium">Dashboard</Link>
            </div>
            <p className="text-muted-foreground text-sm">© 2024 Doseupp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}