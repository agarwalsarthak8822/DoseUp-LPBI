"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, MapPin, Star, Clock, Plus, Minus, ShoppingCart, 
  ChevronRight, X, SlidersHorizontal, Truck,
  CreditCard, Banknote, Check, Package, Sparkles, Brain,
  CheckCircle, Navigation, Zap, Shield, BadgeCheck, Trash2,
  Gift, Percent, Heart, Share2, Home, Building, Edit2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DoseuppLogo } from "@/components/DoseuppLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CustomerAuthNav } from "@/components/auth/CustomerAuthNav";
import { getPharmaciesWithDistances, findNearestPharmacyWithStock, type Pharmacy, subscribeToPharmacies } from "@/lib/pharmacy-store";
import { medicines, categories, type Medicine } from "@/lib/medicines-store";

type CartItem = {
  id: number;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
};

type Address = {
  id: string;
  type: "home" | "office" | "other";
  label: string;
  address: string;
  pincode: string;
  isDefault: boolean;
};

type OrderStatus = "idle" | "processing" | "pharmacy_selected" | "confirmed" | "preparing" | "out_for_delivery";

const defaultAddresses: Address[] = [
  { id: "1", type: "home", label: "Home", address: "Connaught Place, New Delhi, New Delhi - 110001", pincode: "110001", isDefault: true },
  { id: "2", type: "office", label: "Office", address: "Cyber Hub, DLF Phase 2, Gurgaon - 122002", pincode: "122002", isDefault: false },
];

const userLocation = { lat: 28.6139, lng: 77.2090, address: "Connaught Place, New Delhi" };

export default function OrderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("idle");
  const [aiSelecting, setAiSelecting] = useState(false);
  const [showAllPharmacies, setShowAllPharmacies] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [cartAnimation, setCartAnimation] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>(defaultAddresses);
  const [selectedAddress, setSelectedAddress] = useState<Address>(defaultAddresses[0]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "", address: "", pincode: "", type: "other" as "home" | "office" | "other" });

  useEffect(() => {
    const loadPharmacies = () => {
      const pharmaciesWithDistance = getPharmaciesWithDistances(userLocation.lat, userLocation.lng);
      setPharmacies(pharmaciesWithDistance);
      if (pharmaciesWithDistance.length > 0 && !selectedPharmacy) {
        setSelectedPharmacy(pharmaciesWithDistance[0]);
      }
    };
    loadPharmacies();
    const unsubscribe = subscribeToPharmacies(loadPharmacies);
    return () => unsubscribe();
  }, []);

  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         med.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || med.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (medicine: Medicine) => {
    setCartAnimation(true);
    setTimeout(() => setCartAnimation(false), 500);
    
    setCart(prev => {
      const existing = prev.find(item => item.id === medicine.id);
      if (existing) {
        return prev.map(item => 
          item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        id: medicine.id, 
        name: medicine.name, 
        brand: medicine.brand, 
        price: medicine.price, 
        quantity: 1,
        image: medicine.image 
      }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const deleteFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getItemQuantity = (id: number) => {
    return cart.find(item => item.id === id)?.quantity || 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discount = promoApplied ? Math.round(cartTotal * 0.1) : 0;
  const finalTotal = cartTotal - discount + (selectedPharmacy?.deliveryFee || 25);

  const handleAISelectPharmacy = async () => {
    setAiSelecting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const medicineIds = cart.map(item => item.id);
    const nearest = findNearestPharmacyWithStock(userLocation.lat, userLocation.lng, medicineIds);
    
    if (nearest) {
      setSelectedPharmacy(nearest);
    }
    setAiSelecting(false);
  };

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === "health10" || promoCode.toLowerCase() === "first") {
      setPromoApplied(true);
    }
  };

  const handleAddAddress = () => {
    if (newAddress.label && newAddress.address && newAddress.pincode) {
      const addr: Address = {
        id: Date.now().toString(),
        type: newAddress.type,
        label: newAddress.label,
        address: newAddress.address + " - " + newAddress.pincode,
        pincode: newAddress.pincode,
        isDefault: false,
      };
      setAddresses(prev => [...prev, addr]);
      setSelectedAddress(addr);
      setShowAddAddress(false);
      setNewAddress({ label: "", address: "", pincode: "", type: "other" });
    }
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
  };

  const handlePlaceOrder = async () => {
    setOrderStatus("processing");
    const newOrderId = `DU${Date.now().toString().slice(-8)}`;
    setOrderId(newOrderId);
    
    const orderData = {
      orderId: newOrderId,
      items: cart.map(item => ({
        name: item.name,
        brand: item.brand,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      })),
      pharmacy: {
        name: selectedPharmacy?.name || "Apollo Pharmacy",
        address: selectedPharmacy?.area || "Connaught Place",
      },
      deliveryAddress: selectedAddress.address,
      deliveryFee: selectedPharmacy?.deliveryFee || 25,
      subtotal: cartTotal,
      total: finalTotal,
      paymentMethod: paymentMethod, // "online" or "cod"
    };
    localStorage.setItem("doseupp_current_order", JSON.stringify(orderData));
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setOrderStatus("pharmacy_selected");
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setOrderStatus("confirmed");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    setOrderStatus("preparing");
    
    setCheckoutStep(3);
  };

  const displayedPharmacies = showAllPharmacies ? pharmacies : pharmacies.slice(0, 6);

  return (
    <div className="min-h-screen bg-background mesh-gradient">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <DoseuppLogo size="md" />
          </Link>
          
          <div className="relative flex-1 max-w-xl mx-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search medicines, brands..." 
              className="pl-12 bg-card border-border rounded-xl focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <CustomerAuthNav />
            <ThemeToggle />
            <motion.div
              animate={cartAnimation ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={() => setIsCartOpen(true)}
                className="relative btn-primary-gradient font-semibold"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart
                {cartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      <div className="pt-24 px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide"
          >
            {categories.map((cat, index) => (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap transition-all font-medium ${
                  selectedCategory === cat.name 
                    ? "btn-primary-gradient shadow-lg glow-primary" 
                    : "bg-card border border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span>{cat.name}</span>
              </motion.button>
            ))}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-4 mb-6"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/30">
              <Navigation className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">📍 <span className="font-semibold">{selectedAddress.label}: {selectedAddress.address.split(',')[0]}</span></span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border hover:border-primary hover:bg-primary/5 text-foreground font-medium"
              onClick={() => setShowAllPharmacies(!showAllPharmacies)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {showAllPharmacies ? "Show Less" : "View All Pharmacies"}
            </Button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-foreground">Partner Pharmacies</h2>
                <Badge className="bg-primary/10 text-primary border-primary/30">{pharmacies.length} in Delhi NCR</Badge>
              </div>
              {cart.length > 0 && (
                <Button
                  onClick={handleAISelectPharmacy}
                  disabled={aiSelecting}
                  className="btn-accent-gradient font-semibold"
                >
                  {aiSelecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      AI Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Smart Select Pharmacy
                    </>
                  )}
                </Button>
              )}
            </div>

            {aiSelecting && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="ai-thinking rounded-2xl p-4 mb-4 border border-accent/30"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                  <div>
                    <p className="font-semibold text-accent">AI Smart Selection</p>
                    <p className="text-sm text-muted-foreground">Analyzing stock availability, distance, and delivery times...</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {displayedPharmacies.map((pharmacy, index) => (
                  <motion.div
                    key={pharmacy.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={() => setSelectedPharmacy(pharmacy)}
                    className={`glass-card rounded-2xl p-4 cursor-pointer transition-all ${
                      selectedPharmacy?.id === pharmacy.id 
                        ? "border-2 border-primary glow-primary" 
                        : "border border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold line-clamp-1 text-foreground">{pharmacy.name}</h3>
                          {pharmacy.isVerified && (
                            <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                          )}
                          {!pharmacy.isVerified && (
                            <span className="new-badge text-xs px-2 py-0.5 rounded-full text-white">NEW</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{pharmacy.area}, {pharmacy.city}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                        <span className="text-sm font-semibold text-primary">{pharmacy.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> <span className="text-foreground font-medium">{pharmacy.distance}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-accent" /> <span className="text-foreground font-medium">{pharmacy.deliveryTime}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" /> <span className="text-foreground font-medium">₹{pharmacy.deliveryFee}</span>
                      </span>
                    </div>
                    {selectedPharmacy?.id === pharmacy.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 flex items-center gap-2 text-primary text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Selected for delivery
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {pharmacies.length > 6 && !showAllPharmacies && (
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-primary hover:bg-primary/10 font-medium"
                onClick={() => setShowAllPharmacies(true)}
              >
                View all {pharmacies.length} pharmacies <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-bold mb-4 text-foreground">Medicines ({filteredMedicines.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedicines.map((medicine, index) => {
                const quantity = getItemQuantity(medicine.id);
                const discountPercent = Math.round((1 - medicine.price / medicine.originalPrice) * 100);
                
                return (
                  <motion.div
                    key={medicine.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="medicine-card rounded-2xl overflow-hidden group"
                  >
                    <div className="relative h-32 bg-gradient-to-br from-secondary/50 to-card overflow-hidden">
                      <img 
                        src={medicine.image} 
                        alt={medicine.name}
                        className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                      />
                      {discountPercent > 0 && (
                        <Badge className="absolute top-2 left-2 bg-accent text-white border-0 font-bold">
                          {discountPercent}% OFF
                        </Badge>
                      )}
                      {medicine.prescription && (
                        <Badge className="absolute top-2 right-2 bg-destructive text-white border-0 text-xs">
                          Rx
                        </Badge>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Heart className="w-4 h-4 text-primary" />
                      </motion.button>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">{medicine.brand}</p>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1 text-foreground">{medicine.name}</h3>
                      {medicine.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{medicine.description}</p>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-primary">₹{medicine.price}</span>
                        <span className="text-sm text-muted-foreground line-through">₹{medicine.originalPrice}</span>
                      </div>
                      
                      {quantity === 0 ? (
                        <Button
                          onClick={() => addToCart(medicine)}
                          className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-semibold"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add to Cart
                        </Button>
                      ) : (
                        <motion.div 
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="flex items-center justify-between btn-primary-gradient rounded-xl p-1"
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(medicine.id)}
                            className="h-8 w-8 p-0 text-white hover:bg-white/20"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-bold text-white">{quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addToCart(medicine)}
                            className="h-8 w-8 p-0 text-white hover:bg-white/20"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => { setIsCartOpen(false); setCheckoutStep(0); setOrderStatus("idle"); setShowAddAddress(false); }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed top-0 right-0 h-full w-full max-w-md glass-card z-50 flex flex-col border-l border-border"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {checkoutStep === 0 && "Your Cart"}
                    {checkoutStep === 1 && "Delivery Address"}
                    {checkoutStep === 2 && "Payment"}
                    {checkoutStep === 3 && "Order Tracking"}
                  </h2>
                  {checkoutStep === 0 && cart.length > 0 && (
                    <p className="text-sm text-muted-foreground">{cartCount} items • ₹{cartTotal}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsCartOpen(false); setCheckoutStep(0); setOrderStatus("idle"); setShowAddAddress(false); }}
                  className="hover:bg-muted text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-6">
                {checkoutStep === 0 && (
                  <>
                    {cart.length === 0 ? (
                      <div className="text-center py-16">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"
                        >
                          <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                        </motion.div>
                        <p className="text-muted-foreground mb-4">Your cart is empty</p>
                        <Button 
                          onClick={() => setIsCartOpen(false)}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white font-medium"
                        >
                          Start Shopping
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedPharmacy && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-primary/10 border border-primary/30"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-4 h-4 text-primary" />
                              <span className="text-sm font-semibold text-primary">Delivering from</span>
                            </div>
                            <p className="font-semibold text-foreground">{selectedPharmacy.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedPharmacy.distance} away • {selectedPharmacy.deliveryTime}</p>
                          </motion.div>
                        )}
                        
                        {cart.map((item, index) => (
                          <motion.div 
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-4 p-4 bg-muted rounded-xl group"
                          >
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-card flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">{item.brand}</p>
                              <p className="font-semibold text-foreground truncate">{item.name}</p>
                              <p className="text-primary font-bold">₹{item.price} × {item.quantity}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => deleteFromCart(item.id)}
                                className="text-destructive hover:bg-destructive/10 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                              <div className="flex items-center gap-2 bg-card rounded-lg p-1 border border-border">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-7 w-7 p-0 hover:bg-muted text-foreground"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center font-bold text-foreground">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => addToCart(medicines.find(m => m.id === item.id)!)}
                                  className="h-7 w-7 p-0 hover:bg-muted text-foreground"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-6 p-4 rounded-xl bg-card border border-border"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Gift className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-foreground">Have a promo code?</span>
                          </div>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Enter code (try HEALTH10)"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                              className="flex-1 bg-muted border-border text-foreground"
                              disabled={promoApplied}
                            />
                            <Button 
                              onClick={handleApplyPromo}
                              disabled={promoApplied || !promoCode}
                              className={promoApplied ? "bg-green-500 hover:bg-green-500" : "bg-primary/10 text-primary hover:bg-primary hover:text-white"}
                            >
                              {promoApplied ? <Check className="w-4 h-4" /> : "Apply"}
                            </Button>
                          </div>
                          {promoApplied && (
                            <motion.p 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-sm text-green-500 mt-2 flex items-center gap-1"
                            >
                              <Percent className="w-3 h-3" /> 10% discount applied!
                            </motion.p>
                          )}
                        </motion.div>
                      </div>
                    )}
                  </>
                )}

                {checkoutStep === 1 && !showAddAddress && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">Select delivery address</p>
                    
                    {addresses.map((addr, index) => (
                      <motion.div 
                        key={addr.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleSelectAddress(addr)}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                          selectedAddress.id === addr.id 
                            ? "bg-primary/10 border-2 border-primary" 
                            : "bg-muted hover:bg-muted/70 border-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            selectedAddress.id === addr.id ? "bg-primary" : "bg-card border border-border"
                          }`}>
                            {addr.type === "home" ? (
                              <Home className={`w-5 h-5 ${selectedAddress.id === addr.id ? "text-white" : "text-muted-foreground"}`} />
                            ) : addr.type === "office" ? (
                              <Building className={`w-5 h-5 ${selectedAddress.id === addr.id ? "text-white" : "text-muted-foreground"}`} />
                            ) : (
                              <MapPin className={`w-5 h-5 ${selectedAddress.id === addr.id ? "text-white" : "text-muted-foreground"}`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{addr.label}</p>
                            <p className="text-sm text-muted-foreground">{addr.address}</p>
                          </div>
                          {selectedAddress.id === addr.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button 
                        variant="outline" 
                        className="w-full border-dashed border-primary text-primary hover:bg-primary/10 font-medium py-6"
                        onClick={() => setShowAddAddress(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add New Address
                      </Button>
                    </motion.div>
                  </div>
                )}

                {checkoutStep === 1 && showAddAddress && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAddAddress(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back
                      </Button>
                      <h3 className="font-semibold text-foreground">Add New Address</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Address Type</label>
                        <div className="flex gap-2">
                          {["home", "office", "other"].map((type) => (
                            <Button
                              key={type}
                              variant={newAddress.type === type ? "default" : "outline"}
                              size="sm"
                              onClick={() => setNewAddress(prev => ({ ...prev, type: type as "home" | "office" | "other" }))}
                              className={newAddress.type === type ? "btn-primary-gradient" : "border-border text-foreground"}
                            >
                              {type === "home" && <Home className="w-4 h-4 mr-1" />}
                              {type === "office" && <Building className="w-4 h-4 mr-1" />}
                              {type === "other" && <MapPin className="w-4 h-4 mr-1" />}
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Label</label>
                        <Input 
                          placeholder="e.g., Mom's house, Work"
                          value={newAddress.label}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                          className="bg-muted border-border text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Full Address</label>
                        <Input 
                          placeholder="House/Flat No, Street, Area, City"
                          value={newAddress.address}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                          className="bg-muted border-border text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Pincode</label>
                        <Input 
                          placeholder="110001"
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))}
                          className="bg-muted border-border text-foreground"
                          maxLength={6}
                        />
                      </div>

                      <Button 
                        onClick={handleAddAddress}
                        disabled={!newAddress.label || !newAddress.address || !newAddress.pincode}
                        className="w-full btn-primary-gradient font-semibold py-6"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Save Address
                      </Button>
                    </div>
                  </motion.div>
                )}

                {checkoutStep === 2 && (
                  <div className="space-y-4">
                    {orderStatus !== "idle" ? (
                      <div className="space-y-4">
                        <div className="text-center py-4">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
                          >
                            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full" />
                          </motion.div>
                          <h3 className="text-lg font-bold mb-2 text-foreground">Processing Order</h3>
                        </div>
                        
                        <div className="space-y-3">
                          {[
                            { status: "processing", label: "Placing order..." },
                            { status: "pharmacy_selected", label: "AI selecting nearest pharmacy..." },
                            { status: "confirmed", label: "Confirming with pharmacy..." },
                          ].map((step, i) => {
                            const isActive = orderStatus === step.status;
                            const isComplete = ["pharmacy_selected", "confirmed", "preparing"].includes(orderStatus) && 
                              (step.status === "processing" || (step.status === "pharmacy_selected" && ["confirmed", "preparing"].includes(orderStatus)));
                            
                            return (
                              <motion.div 
                                key={step.status}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.2 }}
                                className={`flex items-center gap-3 p-3 rounded-xl ${isActive || isComplete ? "bg-primary/10" : "bg-muted"}`}
                              >
                                {isActive ? (
                                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                ) : isComplete ? (
                                  <CheckCircle className="w-5 h-5 text-primary" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                                )}
                                <span className={isActive || isComplete ? "text-primary font-medium" : "text-muted-foreground"}>
                                  {step.label}
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 rounded-xl bg-muted/50 mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Delivering to</p>
                          <p className="font-semibold text-foreground">{selectedAddress.label}</p>
                          <p className="text-sm text-muted-foreground">{selectedAddress.address}</p>
                        </div>

                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setPaymentMethod("online")}
                          className={`p-4 rounded-xl cursor-pointer transition-all ${
                            paymentMethod === "online" 
                              ? "bg-primary/10 border-2 border-primary" 
                              : "bg-muted hover:bg-muted/70 border-2 border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className={`w-5 h-5 ${paymentMethod === "online" ? "text-primary" : "text-muted-foreground"}`} />
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">Pay Online</p>
                              <p className="text-sm text-muted-foreground">UPI, Cards, Net Banking</p>
                            </div>
                            {paymentMethod === "online" && <CheckCircle className="w-5 h-5 text-primary" />}
                          </div>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          onClick={() => setPaymentMethod("cod")}
                          className={`p-4 rounded-xl cursor-pointer transition-all ${
                            paymentMethod === "cod" 
                              ? "bg-primary/10 border-2 border-primary" 
                              : "bg-muted hover:bg-muted/70 border-2 border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Banknote className={`w-5 h-5 ${paymentMethod === "cod" ? "text-primary" : "text-muted-foreground"}`} />
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">Cash on Delivery</p>
                              <p className="text-sm text-muted-foreground">Pay when you receive</p>
                            </div>
                            {paymentMethod === "cod" && <CheckCircle className="w-5 h-5 text-primary" />}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </div>
                )}

                {checkoutStep === 3 && (
                  <div className="space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className="text-center py-4"
                    >
                      <div className="relative">
                        <motion.div
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ scale: 2, opacity: 0 }}
                          transition={{ duration: 0.6 }}
                          className="absolute inset-0 w-20 h-20 rounded-full bg-primary mx-auto"
                        />
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 glow-primary relative">
                          <Package className="w-10 h-10 text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-1 text-foreground">Order Confirmed!</h3>
                      <p className="text-muted-foreground">Order #{orderId}</p>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="glass-card rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Truck className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">Estimated Delivery</p>
                          <p className="text-lg text-primary font-bold">{selectedPharmacy?.deliveryTime || "15 min"}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 pt-4 border-t border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">From</p>
                            <p className="font-medium text-foreground">{selectedPharmacy?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">To</p>
                            <p className="font-medium text-foreground">{selectedAddress.label} - {selectedAddress.address.split(',')[0]}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <Link href={`/track?orderId=${orderId}`}>
                      <Button className="w-full btn-primary-gradient font-bold py-6">
                        Track Order Live <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </ScrollArea>

              {checkoutStep < 3 && cart.length > 0 && orderStatus === "idle" && !showAddAddress && (
                <div className="p-6 border-t border-border bg-card">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">₹{cartTotal}</span>
                    </div>
                    {promoApplied && (
                      <div className="flex justify-between text-sm text-green-500">
                        <span>Discount (10%)</span>
                        <span>-₹{discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span className="text-foreground">₹{selectedPharmacy?.deliveryFee || 25}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">₹{finalTotal}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => checkoutStep < 2 ? setCheckoutStep(checkoutStep + 1) : handlePlaceOrder()}
                    className="w-full btn-primary-gradient font-bold py-6"
                  >
                    {checkoutStep === 0 && "Proceed to Checkout"}
                    {checkoutStep === 1 && "Continue to Payment"}
                    {checkoutStep === 2 && `Place Order • ₹${finalTotal}`}
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}