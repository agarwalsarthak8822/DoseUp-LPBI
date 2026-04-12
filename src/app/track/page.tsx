"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Phone, Clock, Package, Truck, Store, 
  CheckCircle2, ChevronRight, User, MessageSquare,
  Brain, Sparkles, Shield, Fingerprint, PartyPopper, X, Star, ShoppingCart,
  ChevronDown, Navigation, Bike
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DoseuppLogo } from "@/components/DoseuppLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CustomerAuthNav } from "@/components/auth/CustomerAuthNav";

type OrderItem = {
  name: string;
  brand: string;
  quantity: number;
  price: number;
  image: string;
};

type OrderData = {
  orderId: string;
  items: OrderItem[];
  pharmacy: {
    name: string;
    address: string;
  };
  deliveryAddress: string;
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod?: "online" | "cod";
};

const getTrackingSteps = (isCOD: boolean) => [
  { id: 1, title: "Order Placed", description: "Your order has been received", icon: Package, time: "2:30 PM" },
  { id: 2, title: "AI Pharmacy Selection", description: "Finding nearest pharmacy with stock", icon: Brain, time: "2:31 PM" },
  { id: 3, title: "Order Confirmed", description: "Pharmacy has confirmed your order", icon: CheckCircle2, time: "2:32 PM" },
  { id: 4, title: "Preparing Order", description: "Pharmacy is preparing your medicines", icon: Store, time: "2:35 PM" },
  { id: 5, title: "Rider Assigned", description: "Rider is on the way to pharmacy", icon: User, time: "2:36 PM" },
  { id: 6, title: "Out for Delivery", description: "Rider has picked up your order", icon: Truck, time: "2:38 PM" },
  ...(isCOD ? [{ id: 7, title: "Doorstep Verification", description: "Verify OTP to receive order", icon: Fingerprint, time: "2:41 PM" }] : []),
  { id: isCOD ? 8 : 7, title: "Delivered", description: "Order delivered successfully", icon: PartyPopper, time: isCOD ? "2:42 PM" : "2:41 PM" },
];

const riders = [
  {
    name: "Rahul Kumar",
    phone: "+91 9876543211",
    rating: 4.9,
    deliveries: 1250,
    vehicle: "Honda Activa",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    areas: ["connaught", "cp", "janpath", "rajiv", "karol", "patel"],
  },
  {
    name: "Sunita Verma",
    phone: "+91 9876543222",
    rating: 4.7,
    deliveries: 980,
    vehicle: "Hero Electric",
    image: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=100&h=100&fit=crop",
    areas: ["gurgaon", "cyber", "dlf", "sushant", "mg road", "udaipur"],
  },
  {
    name: "Amit Singh",
    phone: "+91 9876543223",
    rating: 4.8,
    deliveries: 1120,
    vehicle: "TVS Jupiter",
    image: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop",
    areas: ["noida", "sector 18", "sector-18", "ghaziabad", "vasundhara"],
  },
  {
    name: "Priya Mehra",
    phone: "+91 9876543224",
    rating: 4.9,
    deliveries: 1345,
    vehicle: "Bajaj Chetak EV",
    image: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=100&h=100&fit=crop",
    areas: ["saket", "hauz khas", "malviya", "vasant", "lajpat"],
  },
];

const pickRiderForAddress = (
  deliveryAddress?: string,
  pharmacyAddress?: string,
  pharmacyName?: string,
  orderId?: string
) => {
  const text = `${deliveryAddress || ""} ${pharmacyAddress || ""} ${pharmacyName || ""}`.toLowerCase();
  const matched = riders.find(r => r.areas.some(area => text.includes(area)));
  if (matched) return matched;
  const hashSource = orderId || deliveryAddress || pharmacyAddress || "default";
  const hash = hashSource.split("").reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
  const idx = Math.abs(hash) % riders.length;
  return riders[idx];
};

function TrackContent() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [riderLocation, setRiderLocation] = useState({ x: 15, y: 85 });
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [showDeliveredPopup, setShowDeliveredPopup] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [rating, setRating] = useState(0);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [assignedRider, setAssignedRider] = useState<typeof riders[number] | null>(null);
  const [hasOrder, setHasOrder] = useState<boolean | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const correctOTP = "1234";

  const isCOD = orderData?.paymentMethod === "cod";
  const trackingSteps = getTrackingSteps(isCOD);
  const maxStep = isCOD ? 8 : 7;

  useEffect(() => {
    const storedOrder = localStorage.getItem("doseupp_current_order");
    if (storedOrder) {
      const parsed = JSON.parse(storedOrder);
      setOrderData(parsed);
      setHasOrder(true);
      setAssignedRider(
        pickRiderForAddress(parsed.deliveryAddress, parsed.pharmacy?.address, parsed.pharmacy?.name, parsed.orderId)
      );
    } else {
      setHasOrder(false);
    }
  }, []);

  useEffect(() => {
    if (!hasOrder) return;
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (isCOD) {
          if (prev < 6) return prev + 1;
          if (prev === 6) {
            setTimeout(() => setShowVerificationPopup(true), 1000);
            clearInterval(interval);
          }
          return prev;
        } else {
          if (prev < 6) return prev + 1;
          if (prev === 6) {
            clearInterval(interval);
            setTimeout(() => {
              setCurrentStep(7);
              setShowDeliveredPopup(true);
              localStorage.removeItem("doseupp_current_order");
            }, 2000);
          }
          return prev;
        }
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [hasOrder, isCOD]);

  useEffect(() => {
    const progressMap: Record<number, number> = isCOD
      ? { 1: 5, 2: 15, 3: 28, 4: 42, 5: 55, 6: 70, 7: 88, 8: 100 }
      : { 1: 8, 2: 20, 3: 35, 4: 50, 5: 70, 6: 85, 7: 100 };
    setProgress(progressMap[currentStep] || 0);

    if (currentStep >= 6 && currentStep < maxStep) {
      let isStopped = false;
      let stopTimeout: NodeJS.Timeout | null = null;
      
      const riderInterval = setInterval(() => {
        if (isStopped) return;
        setRiderLocation(prev => {
          if (Math.random() < 0.15 && !isStopped) {
            isStopped = true;
            const stopDuration = 1000 + Math.random() * 2000;
            stopTimeout = setTimeout(() => { isStopped = false; }, stopDuration);
            return prev;
          }
          const speedMultiplier = 0.5 + Math.random() * 1.5;
          const baseSpeed = 1.5;
          const xJitter = (Math.random() - 0.5) * 0.3;
          const yJitter = (Math.random() - 0.5) * 0.2;
          return {
            x: Math.min(prev.x + (baseSpeed * speedMultiplier) + xJitter, 85),
            y: Math.max(prev.y - (1 * speedMultiplier) + yJitter, 25),
          };
        });
      }, 200);
      
      return () => {
        clearInterval(riderInterval);
        if (stopTimeout) clearTimeout(stopTimeout);
      };
    }
  }, [currentStep, isCOD, maxStep]);

  useEffect(() => {
    if (orderData && !assignedRider) {
      setAssignedRider(
        pickRiderForAddress(orderData.deliveryAddress, orderData.pharmacy?.address, orderData.pharmacy?.name, orderData.orderId)
      );
    }
  }, [orderData, assignedRider]);

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    setVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (otp.join("") === correctOTP) {
      setShowVerificationPopup(false);
      setCurrentStep(7);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(8);
      setShowDeliveredPopup(true);
      localStorage.removeItem("doseupp_current_order");
    }
    setVerifying(false);
  };

  if (hasOrder === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
      </div>
    );
  }

  if (!hasOrder) {
    return (
      <div className="min-h-screen bg-background mesh-gradient">
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/"><DoseuppLogo size="md" /></Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <CustomerAuthNav />
              <ThemeToggle />
              <Link href="/order"><Button className="btn-primary-gradient font-semibold">Order Now</Button></Link>
            </div>
          </div>
        </nav>
        <div className="pt-28 pb-16 px-6 flex items-center justify-center min-h-screen">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-muted-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground mb-2">No Active Orders</h1>
            <p className="text-muted-foreground mb-6">You don&apos;t have any orders to track right now.</p>
            <Link href="/order"><Button className="btn-primary-gradient font-bold px-8 py-6"><ShoppingCart className="w-5 h-5 mr-2" />Order Medicines</Button></Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const orderId = searchParams.get("orderId") || orderData?.orderId || "DU12345678";
  const orderItems = orderData?.items || [];
  const subtotal = orderData?.subtotal || 0;
  const deliveryFee = orderData?.deliveryFee || 25;
  const total = orderData?.total || 0;
  const pharmacyName = orderData?.pharmacy?.name || "Apollo Pharmacy";
  const deliveryAddress = orderData?.deliveryAddress || "Connaught Place, New Delhi";

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      {/* Compact Nav */}
      <nav className="flex-shrink-0 glass-card border-b border-border/50 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/"><DoseuppLogo size="sm" /></Link>
          <div className="flex items-center gap-2">
            <CustomerAuthNav />
            <ThemeToggle />
            <Link href="/order">
              <Button size="sm" className="btn-primary-gradient font-semibold text-xs px-3 h-8">Order More</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content - Single Viewport */}
      <div className="flex-1 p-3 md:p-4 overflow-hidden">
        <div className="h-full max-w-[1600px] mx-auto flex flex-col gap-3">
          {/* Header Row */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-shrink-0"
          >
            <div className="flex items-center gap-3">
              <motion.h1 className="text-lg md:text-xl font-bold text-foreground">Track Your Order</motion.h1>
              <motion.div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <motion.div 
                  className="w-2 h-2 rounded-full bg-green-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <span className="text-[10px] text-green-500 font-semibold uppercase tracking-wide">Live</span>
              </motion.div>
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground"
            >
              Order <span className="text-primary font-mono">#{orderId}</span>
            </motion.p>
          </motion.div>

          {/* Main Grid - All Content */}
          <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
            {/* Left - Live Map */}
            <motion.div
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="col-span-12 lg:col-span-7 glass-card rounded-2xl overflow-hidden border border-border/50 flex flex-col"
            >
              {/* Map Area */}
              <div className="flex-1 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-[200px]">
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
                  backgroundSize: '30px 30px'
                }} />
                
                {/* Animated gradient glow */}
                <motion.div 
                  className="absolute inset-0"
                  animate={{ 
                    background: [
                      "radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
                      "radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
                      "radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)"
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                />

                {/* Route Path */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <motion.path
                    d="M 12 88 C 25 75 35 70 45 60 S 65 45 75 35 S 88 25 88 22"
                    stroke="url(#routeGrad)"
                    strokeWidth="0.6"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                  <motion.path
                    d="M 12 88 C 25 75 35 70 45 60 S 65 45 75 35 S 88 25 88 22"
                    stroke="rgba(96, 165, 250, 0.4)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    style={{ filter: "blur(4px)" }}
                  />
                  <defs>
                    <linearGradient id="routeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Pharmacy Marker */}
                <motion.div
                  className="absolute bottom-[12%] left-[12%]"
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring", damping: 12 }}
                >
                  <motion.div 
                    className="relative"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <div className="absolute -inset-2 bg-orange-500/20 rounded-full blur-md" />
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-xl shadow-orange-500/30">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <motion.div 
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur px-2 py-0.5 rounded text-[9px] text-white font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      Pharmacy
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Destination Marker */}
                <motion.div
                  className="absolute top-[22%] right-[12%]"
                  initial={{ opacity: 0, scale: 0, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.7, type: "spring", damping: 12 }}
                >
                  <motion.div 
                    className="relative"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                  >
                    <div className="absolute -inset-2 bg-green-500/20 rounded-full blur-md" />
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-500/30">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <motion.div 
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur px-2 py-0.5 rounded text-[9px] text-white font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                    >
                      Your Location
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Rider - Animated */}
                <AnimatePresence>
                  {currentStep >= 6 && (
                    <motion.div
                      className="absolute z-10"
                      style={{ 
                        left: `${riderLocation.x}%`, 
                        top: `${riderLocation.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 10 }}
                    >
                      <motion.div className="relative">
                        <motion.div 
                          className="absolute -inset-4 bg-primary/30 rounded-full"
                          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />
                        <motion.div 
                          className="absolute -inset-2 bg-primary/50 rounded-full blur-sm"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                        <div className="w-11 h-11 bg-gradient-to-br from-primary via-blue-500 to-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/50 border-2 border-white/30">
                          <Bike className="w-5 h-5 text-white" />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Stats Bar */}
              <div className="flex-shrink-0 p-3 bg-card/50 backdrop-blur border-t border-border/30">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    >
                      <Clock className="w-5 h-5 text-primary" />
                    </motion.div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Estimated Delivery</p>
                      <motion.p 
                        className="text-lg font-bold text-primary"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        12 min
                      </motion.p>
                    </div>
                  </div>

                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Delivery Progress</span>
                      <motion.span className="text-primary font-bold" key={progress} initial={{ scale: 1.3 }} animate={{ scale: 1 }}>
                        {progress}%
                      </motion.span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #f97316 0%, #3b82f6 50%, #22c55e 100%)" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-muted-foreground">From</span>
                      <span className="text-foreground font-medium truncate max-w-[100px]">{pharmacyName.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-muted-foreground">To</span>
                      <span className="text-foreground font-medium truncate max-w-[100px]">{deliveryAddress.split(',')[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 min-h-0">
              {/* Delivery Partner */}
              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="flex-shrink-0 glass-card rounded-xl p-3 border border-border/50 bg-gradient-to-br from-primary/5 to-transparent"
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="relative flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-primary/30">
                      <img src={assignedRider?.image || riders[0].image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <motion.div 
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground text-sm">{assignedRider?.name || riders[0].name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 font-medium">
                        ★ {assignedRider?.rating || riders[0].rating}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {assignedRider?.deliveries || riders[0].deliveries} deliveries • {assignedRider?.vehicle || riders[0].vehicle}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button size="sm" className="bg-green-500/15 text-green-600 hover:bg-green-500 hover:text-white h-8 w-8 p-0 rounded-lg">
                        <Phone className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button size="sm" className="bg-primary/15 text-primary hover:bg-primary hover:text-white h-8 w-8 p-0 rounded-lg">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Order Summary - Collapsible */}
              <motion.div 
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 100 }}
                className="flex-shrink-0 glass-card rounded-xl border border-border/50 overflow-hidden"
              >
                <motion.button
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                      <ShoppingCart className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span className="font-bold text-foreground text-sm">Order Summary</span>
                    <span className="text-[10px] text-muted-foreground">({orderItems.length} items)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary text-sm">₹{total}</span>
                    <motion.div animate={{ rotate: summaryExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                </motion.button>

                <AnimatePresence>
                  {summaryExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 border-t border-border/30">
                        <div className="space-y-2 pt-2 max-h-28 overflow-y-auto">
                          {orderItems.map((item, i) => (
                            <motion.div key={i} className="flex items-center gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[11px] text-foreground truncate">{item.name}</p>
                                <p className="text-[9px] text-muted-foreground">{item.brand} × {item.quantity}</p>
                              </div>
                              <span className="font-semibold text-[11px] text-foreground">₹{item.price * item.quantity}</span>
                            </motion.div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/30">
                          <span className="text-[10px] text-muted-foreground">Subtotal ₹{subtotal} + Delivery ₹{deliveryFee}</span>
                          <span className="font-bold text-primary text-sm">₹{total}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Order Progress */}
              <motion.div 
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                className="flex-1 glass-card rounded-xl p-3 border border-border/50 overflow-hidden min-h-0"
              >
                <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Package className="w-3 h-3 text-primary" />
                  </div>
                  Order Progress
                </h3>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 overflow-y-auto max-h-[calc(100%-2rem)]">
                  {trackingSteps.map((step, i) => {
                    const isCompleted = currentStep > step.id;
                    const isCurrent = currentStep === step.id;
                    const Icon = step.icon;
                    
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2 py-1.5"
                      >
                        <motion.div
                          animate={{ scale: isCurrent ? [1, 1.15, 1] : 1 }}
                          transition={{ repeat: isCurrent ? Infinity : 0, duration: 1.5 }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                            isCompleted || isCurrent
                              ? step.id === maxStep && isCompleted 
                                ? "bg-gradient-to-br from-green-500 to-emerald-500"
                                : "bg-gradient-to-br from-primary to-accent"
                              : "bg-muted/60 border border-border/40"
                          }`}
                        >
                          <Icon className={`w-3 h-3 ${isCompleted || isCurrent ? "text-white" : "text-muted-foreground"}`} />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className={`font-medium text-[10px] truncate ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.title}
                            </p>
                            {isCurrent && step.id === 2 && (
                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                                <Sparkles className="w-2.5 h-2.5 text-accent" />
                              </motion.div>
                            )}
                          </div>
                          {(isCompleted || isCurrent) && step.time && (
                            <span className="text-[9px] text-muted-foreground">{step.time}</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Order More Button */}
              <Link href="/order" className="flex-shrink-0">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full btn-primary-gradient font-bold py-3 text-sm">
                    Order More Medicines <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Popup */}
      <AnimatePresence>
        {showVerificationPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0, y: 50 }} transition={{ type: "spring", damping: 20 }} className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 glow-primary">
                <Fingerprint className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Doorstep Verification</h2>
              <p className="text-muted-foreground mb-6">Rider is at your doorstep! Enter the OTP shared by the rider.</p>
              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, i) => (
                  <motion.input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOTPChange(i, e.target.value)} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1, type: "spring" }} className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 border-border bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                ))}
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={handleVerifyOTP} disabled={otp.join("").length < 4 || verifying} className="w-full btn-primary-gradient font-bold py-6">
                  {verifying ? (<><motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />Verifying...</>) : (<><Shield className="w-5 h-5 mr-2" />Verify & Receive Order</>)}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delivered Popup */}
      <AnimatePresence>
        {showDeliveredPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.3, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.3, opacity: 0, rotate: 10 }} transition={{ type: "spring", damping: 15 }} className="glass-card rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden">
              <button onClick={() => setShowDeliveredPopup(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10, delay: 0.2 }} className="relative">
                {[...Array(8)].map((_, i) => (
                  <motion.div key={i} initial={{ scale: 0, x: 0, y: 0 }} animate={{ scale: [0, 1, 0], x: Math.cos(i * 45 * Math.PI / 180) * 80, y: Math.sin(i * 45 * Math.PI / 180) * 80 }} transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }} className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full" style={{ backgroundColor: ['#22c55e', '#60a5fa', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6', '#f97316'][i], marginLeft: -6, marginTop: -6 }} />
                ))}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 relative">
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.4, type: "spring" }}>
                    <PartyPopper className="w-12 h-12 text-white" />
                  </motion.div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="text-3xl font-bold mb-2 text-foreground">Order Delivered!</h2>
                <p className="text-muted-foreground mb-6">Your medicines have been delivered successfully.</p>
                <motion.div className="glass-card rounded-xl p-4 mb-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
                  <p className="text-sm text-muted-foreground mb-3">Rate your delivery experience</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button key={star} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + star * 0.1, type: "spring" }} whileHover={{ scale: 1.3, rotate: 15 }} whileTap={{ scale: 0.9 }} onClick={() => setRating(star)} className="text-primary">
                        <Star className={`w-8 h-8 ${rating >= star ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted-foreground"}`} />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
                <div className="flex gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button onClick={() => setShowDeliveredPopup(false)} variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white py-5 font-medium">Close</Button>
                  </motion.div>
                  <Link href="/order" className="flex-1">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button className="w-full btn-primary-gradient font-bold py-5">Order Again</Button>
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TrackOrder() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}