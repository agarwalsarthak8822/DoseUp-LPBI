"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Clock, CheckCircle2, XCircle, 
  DollarSign, ShoppingBag, Users, Settings, Bell, Search,
  ChevronRight, X, Truck, MapPin, Phone, Bike,
  Navigation, Star, User, Plus, AlertTriangle, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DoseuppLogo } from "@/components/DoseuppLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  getPharmacyById, 
  type Pharmacy, 
  updatePharmacyInventory, 
  getPharmacies,
  subscribeToPharmacies
} from "@/lib/pharmacy-store";
import { medicines } from "@/lib/medicines-store";

type RiderStatus = "available" | "on_delivery" | "on_break";

type Rider = {
  id: string;
  name: string;
  phone: string;
  status: RiderStatus;
  rating: number;
  trips: number;
  image: string;
  etaToStoreMins: number;
  distanceFromStoreKm: number;
  shiftEndsAt: string;
  lastDropArea: string;
};

const riderPool: Rider[] = [
  { id: "R001", name: "Rajesh Kumar", phone: "+91 9876543220", status: "available", rating: 4.8, trips: 234, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", etaToStoreMins: 4, distanceFromStoreKm: 1.2, shiftEndsAt: "11:30 PM", lastDropArea: "Connaught Place" },
  { id: "R002", name: "Sunil Verma", phone: "+91 9876543221", status: "on_delivery", rating: 4.6, trips: 189, image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", etaToStoreMins: 9, distanceFromStoreKm: 3.4, shiftEndsAt: "10:45 PM", lastDropArea: "Janpath" },
  { id: "R003", name: "Amit Singh", phone: "+91 9876543222", status: "available", rating: 4.9, trips: 312, image: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop", etaToStoreMins: 6, distanceFromStoreKm: 2.1, shiftEndsAt: "12:05 AM", lastDropArea: "Rajiv Chowk" },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-600", icon: Clock },
  preparing: { label: "Preparing", color: "bg-blue-500/20 text-blue-600", icon: Package },
  ready: { label: "Ready", color: "bg-primary/20 text-primary", icon: CheckCircle2 },
  dispatched: { label: "On the way", color: "bg-accent/20 text-accent", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-500/20 text-green-600", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/20 text-destructive", icon: XCircle },
};

type OrderItem = { medicineId: number; qty: number };

type Order = {
  id: string;
  customer: string;
  items: OrderItem[];
  total: number;
  status: string;
  time: string;
  address: string;
  phone: string;
  riderId: string | null;
  deliveryDistanceKm: number;
  paymentMode: "Prepaid" | "COD" | "Wallet";
  requiresPrescription: boolean;
  promisedTimeMin: number;
  inventoryReserved?: boolean;
};

function pickItemsFromInventory(pharmacy: Pharmacy, count: number): OrderItem[] {
  const available = Object.entries(pharmacy.inventory).filter(([, qty]) => qty > 0);
  if (available.length === 0) return [];

  const items: OrderItem[] = [];
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const [id, stock] = shuffled[i];
    const maxQty = Math.min(3, Math.max(1, Math.floor(stock / 10)));
    items.push({ medicineId: Number(id), qty: Math.max(1, Math.min(maxQty, 2 + (i % 2))) });
  }
  return items;
}

function generateOrdersForPharmacy(pharmacy: Pharmacy): Order[] {
  const baseCustomers = [
    { customer: "Rahul Sharma", address: "38/4, Janpath, CP", phone: "+91 9876543210" },
    { customer: "Priya Singh", address: "DLF Phase 2, Gurgaon", phone: "+91 9876543211" },
    { customer: "Amit Kumar", address: "RWA, Rajouri Garden", phone: "+91 9876543212" },
    { customer: "Neha Gupta", address: "Sector 56, Gurgaon", phone: "+91 9876543213" },
    { customer: "Vikram Patel", address: "Noida Sector 18", phone: "+91 9876543214" },
    { customer: "Kabir Malhotra", address: "Punjabi Bagh", phone: "+91 9876543215" },
  ];

  const statuses = ["pending", "preparing", "ready", "dispatched", "delivered"];
  const orderCount = Math.min(5, Math.max(3, Math.floor(pharmacy.rating) - 1));

  return baseCustomers.slice(0, orderCount).map((base, index) => {
    const items = pickItemsFromInventory(pharmacy, 2 + (index % 2));
    const total = items.reduce((sum, item) => {
      const med = medicines.find(m => m.id === item.medicineId);
      return sum + (med ? med.price * item.qty : 0);
    }, 0);

    const status = statuses[index % statuses.length];
    const distance = 0.8 + index * 0.9;
    const promisedTimeMin = Math.max(18, Math.round(distance * 10 + 8));
    const needsRx = items.some(item => medicines.find(m => m.id === item.medicineId)?.prescription);

    return {
      ...base,
      id: `DU${pharmacy.id.toUpperCase()}${100 + index}`,
      items,
      total: Math.max(80, total),
      status,
      time: `${2 + index * 5} min ago`,
      riderId: status === "dispatched" ? "R001" : null,
      deliveryDistanceKm: parseFloat(distance.toFixed(1)),
      paymentMode: index % 3 === 0 ? "COD" : "Prepaid",
      requiresPrescription: needsRx,
      promisedTimeMin,
      inventoryReserved: status !== "pending",
    };
  });
}

export default function PharmacyDashboard() {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<Array<{ id: number; type: string; message: string; time: string; read: boolean }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRiderSelect, setShowRiderSelect] = useState(false);
  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryAlert, setInventoryAlert] = useState<string | null>(null);
  const [riders, setRiders] = useState<Rider[]>(riderPool);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  useEffect(() => {
    const defaultPharmacy = getPharmacies()[0];
    if (defaultPharmacy) {
      setPharmacy(defaultPharmacy);
      setOrders(generateOrdersForPharmacy(defaultPharmacy));
      setNotifications([
        { id: 1, type: "order", message: `New order received`, time: "2 min ago", read: false },
        { id: 2, type: "rider", message: "Rajesh Kumar is now available", time: "5 min ago", read: false },
        { id: 3, type: "stock", message: "Some items running low on stock", time: "10 min ago", read: false },
      ]);
      setLastSyncedAt(new Date());
    }
  }, []);

  useEffect(() => {
    if (!pharmacy) return;
    const unsubscribe = subscribeToPharmacies(() => {
      const latest = getPharmacyById(pharmacy.id);
      if (latest) {
        setPharmacy(latest);
        setLastSyncedAt(new Date());
      }
    });
    return unsubscribe;
  }, [pharmacy?.id]);

  const filteredOrders = activeTab === "all" 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const refreshPharmacy = () => {
    if (!pharmacy) return;
    const latest = getPharmacyById(pharmacy.id);
    if (latest) {
      setPharmacy(latest);
      setLastSyncedAt(new Date());
    }
  };

  const markNotificationRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getRiderForOrder = (riderId: string | null) => {
    if (!riderId) return null;
    return riders.find(r => r.id === riderId);
  };

  const getInventoryItems = () => {
    if (!pharmacy) return [];
    return Object.entries(pharmacy.inventory).map(([medId, stock]) => {
      const medicine = medicines.find(m => m.id === parseInt(medId));
      return {
        id: parseInt(medId),
        name: medicine?.name || "Unknown",
        brand: medicine?.brand || "Unknown",
        stock,
        lowStock: stock < 20
      };
    });
  };

  const formatOrderItems = (items: OrderItem[]) => {
    return items.map(item => {
      const med = medicines.find(m => m.id === item.medicineId);
      return `${med?.name || "Unknown"} x${item.qty}`;
    }).join(", ");
  };

  const reserveInventoryForOrder = (
    order: Order
  ): { success: true } | { success: false; message: string } => {
    if (!pharmacy) return { success: false, message: "No pharmacy selected" };
    const latest = getPharmacyById(pharmacy.id);
    if (!latest) return { success: false, message: "Pharmacy not found" };

    const shortages = order.items.filter(item => (latest.inventory[item.medicineId] || 0) < item.qty);
    if (shortages.length > 0) {
      const names = shortages.map(s => medicines.find(m => m.id === s.medicineId)?.name || "Item").join(", ");
      return { success: false, message: `${names} is out of stock. Please restock.` };
    }

    order.items.forEach(item => {
      const current = latest.inventory[item.medicineId] || 0;
      updatePharmacyInventory(latest.id, item.medicineId, Math.max(0, current - item.qty));
    });

    const updated = getPharmacyById(latest.id);
    if (updated) setPharmacy(updated);
    setLastSyncedAt(new Date());
    return { success: true as const };
  };

  const releaseInventoryForOrder = (order: Order) => {
    if (!pharmacy || !order.inventoryReserved) return;
    const latest = getPharmacyById(pharmacy.id);
    if (!latest) return;

    order.items.forEach(item => {
      const current = latest.inventory[item.medicineId] || 0;
      updatePharmacyInventory(latest.id, item.medicineId, current + item.qty);
    });
    const updated = getPharmacyById(latest.id);
    if (updated) setPharmacy(updated);
    setLastSyncedAt(new Date());
  };

  const getRecommendedRider = (order: Order) => {
    const availableRiders = riders.filter(r => r.status === "available");
    if (availableRiders.length === 0) return null;

    const sorted = availableRiders
      .map(rider => ({
        rider,
        score: rider.distanceFromStoreKm * 1.5 + rider.etaToStoreMins + order.deliveryDistanceKm,
      }))
      .sort((a, b) => a.score - b.score);

    return sorted[0]?.rider || null;
  };

  const updateOrderStatus = (orderId: string, newStatus: string, riderId?: string) => {
    setInventoryAlert(null);
    let nextRiderId: string | null | undefined = riderId;
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      if (order.status === "pending" && newStatus === "preparing" && !order.inventoryReserved) {
        const result = reserveInventoryForOrder(order);
        if (!result.success) {
          setInventoryAlert(result.message);
          return order;
        }
        order.inventoryReserved = true;
      }

      if (order.status !== "delivered" && newStatus === "cancelled" && order.inventoryReserved) {
        releaseInventoryForOrder(order);
        order.inventoryReserved = false;
      }

      if (newStatus === "dispatched" && riderId) {
        setRiders(prevRiders => prevRiders.map(r => 
          r.id === riderId ? { ...r, status: "on_delivery" } : r
        ));
      }

      if (newStatus === "delivered" && order.riderId) {
        setRiders(prevRiders => prevRiders.map(r => 
          r.id === order.riderId ? { ...r, status: "available", etaToStoreMins: 3, distanceFromStoreKm: 0.8 } : r
        ));
      }

      if (!nextRiderId && newStatus === "dispatched") {
        nextRiderId = getRecommendedRider(order)?.id || null;
      }

      return { ...order, status: newStatus, riderId: nextRiderId ?? order.riderId };
    }));

    setSelectedOrder(prev => prev ? { ...prev, status: newStatus, riderId: nextRiderId || prev.riderId } : null);
    
    if (newStatus === "dispatched" && (nextRiderId || riderId)) {
      const rider = riders.find(r => r.id === (nextRiderId || riderId));
      setNotifications(prev => [{
        id: Date.now(),
        type: "rider",
        message: `Order #${orderId} assigned to ${rider?.name}`,
        time: "Just now",
        read: false
      }, ...prev]);
    }
  };

  const handlePharmacyChange = (id: string) => {
    const selected = getPharmacyById(id);
    if (!selected) return;
    setPharmacy(selected);
    setOrders(generateOrdersForPharmacy(selected));
    setActiveTab("all");
    setSelectedOrder(null);
    setInventoryAlert(null);
    setLastSyncedAt(new Date());
  };

  const liveStats = useMemo(() => {
    const pending = orders.filter(o => o.status === "pending").length;
    const delivered = orders.filter(o => o.status === "delivered").length;
    const revenue = orders
      .filter(o => o.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0);
    const averagePrep = Math.max(3, Math.round((pending + delivered) * 1.4));
    return { pending, delivered, revenue, averagePrep };
  }, [orders]);

  const completionRate = Math.round(
    ((orders.length - orders.filter(o => o.status === "cancelled").length) / Math.max(orders.length, 1)) * 100
  );
  const readyOrders = orders.filter(o => o.status === "ready").length;
  const riderUtilization = Math.round(
    (riders.filter(r => r.status === "on_delivery").length / Math.max(riders.length, 1)) * 100
  );

  const stats = [
    { label: "Today's Orders", value: orders.length, change: "+12%", icon: ShoppingBag },
    { label: "Revenue", value: `₹${liveStats.revenue.toLocaleString()}`, change: "+8%", icon: DollarSign },
    { label: "Pending Orders", value: liveStats.pending, change: "-2", icon: Clock },
    { label: "Customers", value: pharmacy?.stats?.customers || 0, change: "+23", icon: Users },
  ];

  const inventoryItems = getInventoryItems();
  const lowStockItems = inventoryItems.filter(i => i.lowStock);
  const recommendedRider = selectedOrder ? getRecommendedRider(selectedOrder) : null;
  const trackingProgress = useMemo(() => {
    if (!trackingOrder) return 0;
    switch (trackingOrder.status) {
      case "pending":
        return 10;
      case "preparing":
        return 35;
      case "ready":
        return 55;
      case "dispatched":
        return 80;
      case "delivered":
        return 100;
      default:
        return 0;
    }
  }, [trackingOrder]);

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-background mesh-gradient flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mesh-gradient">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <DoseuppLogo size="md" />
            <Badge variant="outline" className="ml-2 border-primary text-primary">Pharmacy</Badge>
          </Link>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative text-foreground hover:bg-muted"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] flex items-center justify-center text-white">
                    {unreadNotifications}
                  </span>
                )}
              </Button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-12 w-80 glass-card rounded-xl border border-border shadow-xl z-50"
                  >
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Notifications</h3>
                      <Badge variant="secondary">{unreadNotifications} new</Badge>
                    </div>
                    <ScrollArea className="h-64">
                      <div className="p-2">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => markNotificationRead(notification.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                              notification.read ? "bg-muted/30" : "bg-primary/10"
                            }`}
                          >
                            <p className={`text-sm ${notification.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
              {pharmacy.name.charAt(0)}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome back, {pharmacy.name.split(' - ')[0]}!</h1>
                <p className="text-muted-foreground">Live view for your onboarded store.</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {pharmacy.area}, {pharmacy.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {pharmacy.rating} ({pharmacy.reviews} reviews)
                  </span>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30">
                    Onboarded & Verified
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl border border-border/60">
                  <span id="pharmacy-switch-label" className="text-sm text-muted-foreground">Switch Pharmacy</span>
                  <select
                    value={pharmacy.id}
                    onChange={(e) => handlePharmacyChange(e.target.value)}
                    className="bg-transparent text-foreground text-sm font-medium focus:outline-none"
                    aria-labelledby="pharmacy-switch-label"
                    aria-label="Switch pharmacy"
                    title="Switch pharmacy"
                  >
                    {getPharmacies().map(p => (
                      <option key={p.id} value={p.id} className="text-foreground bg-background">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button variant="outline" size="sm" className="border-primary text-primary" onClick={refreshPharmacy}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {lastSyncedAt ? `Synced ${lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Sync Inventory"}
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    stat.change.startsWith('+') ? 'bg-green-500/20 text-green-600' : 'bg-yellow-500/20 text-yellow-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-3xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Orders</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search orders..." className="pl-10 w-48 bg-muted border-border text-foreground" />
                  </div>
                </div>

                {inventoryAlert && (
                  <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {inventoryAlert}
                  </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-muted mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="preparing">Preparing</TabsTrigger>
                    <TabsTrigger value="ready">Ready</TabsTrigger>
                    <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
                  </TabsList>

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {filteredOrders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No orders found
                        </div>
                      ) : (
                        filteredOrders.map((order) => {
                          const status = statusConfig[order.status];
                          const rider = getRiderForOrder(order.riderId);
                          return (
                            <motion.div
                              key={order.id}
                              layout
                              onClick={() => setSelectedOrder(order)}
                              className="p-4 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-foreground">#{order.id}</span>
                                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
                                    <status.icon className="w-3 h-3" />
                                    {status.label}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">{order.time}</span>
                              </div>
                              <p className="font-medium mb-1 text-foreground">{order.customer}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {formatOrderItems(order.items)}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-semibold text-primary">₹{order.total}</span>
                                {rider && (
                                  <div className="flex items-center gap-2">
                                    <img src={rider.image} alt={rider.name} className="w-6 h-6 rounded-full" />
                                    <span className="text-xs text-muted-foreground">{rider.name}</span>
                                  </div>
                                )}
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </Tabs>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-3xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Available Riders</h2>
                  <Badge className="bg-primary/10 text-primary border-primary/30">
                    {riders.filter(r => r.status === "available").length} online
                  </Badge>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {riders.map((rider) => (
                    <div
                      key={rider.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        rider.status === "available" 
                          ? "bg-primary/5 border-primary/30" 
                          : "bg-muted/50 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img src={rider.image} alt={rider.name} className="w-12 h-12 rounded-full object-cover" />
                        <div>
                          <p className="font-semibold text-foreground">{rider.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            rider.status === "available" 
                              ? "bg-green-500/20 text-green-600" 
                              : rider.status === "on_delivery"
                                ? "bg-yellow-500/20 text-yellow-600"
                                : "bg-muted text-muted-foreground"
                          }`}>
                            {rider.status === "available" ? "Available" : rider.status === "on_delivery" ? "On Delivery" : "On Break"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-foreground font-medium">{rider.rating}</span>
                        </div>
                        <span className="text-muted-foreground">{rider.trips} trips</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <span>{rider.distanceFromStoreKm.toFixed(1)} km away • {rider.etaToStoreMins} min</span>
                        <span>Shift till {rider.shiftEndsAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="glass-card rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Inventory</h2>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-primary text-primary"
                    onClick={() => setShowInventoryModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Manage
                  </Button>
                </div>
                {lowStockItems.length > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm text-destructive">{lowStockItems.length} items low on stock</span>
                  </div>
                )}
                <div className="space-y-3">
                  {inventoryItems.slice(0, 5).map((item) => (
                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl ${item.lowStock ? 'bg-destructive/10' : 'bg-muted/50'}`}>
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.brand}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${item.lowStock ? 'text-destructive' : 'text-foreground'}`}>{item.stock} left</p>
                        {item.lowStock && (
                          <Button size="sm" variant="link" className="text-xs text-primary p-0 h-auto">
                            Reorder
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6">
                <h2 className="text-lg font-semibold mb-4 text-foreground">Quick Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg. Order Value</span>
                    <span className="font-semibold text-foreground">
                      ₹{Math.round(liveStats.revenue / Math.max(orders.length, 1))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Completion Rate</span>
                    <span className="font-semibold text-primary">{completionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg. Prep Time</span>
                    <span className="font-semibold text-foreground">{liveStats.averagePrep} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ready to Dispatch</span>
                    <span className="font-semibold text-foreground">{readyOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rider Utilization</span>
                    <span className="font-semibold text-primary">{riderUtilization}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Live Dispatches</span>
                    <span className="font-semibold text-foreground">
                      {orders.filter(o => o.status === "dispatched").length}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => { setSelectedOrder(null); setShowRiderSelect(false); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card rounded-3xl p-6 z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Order #{selectedOrder.id}</h2>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedOrder(null); setShowRiderSelect(false); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedOrder.customer}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.time}</p>
                  </div>
                  <span className={`ml-auto text-xs px-3 py-1 rounded-full ${statusConfig[selectedOrder.status].color}`}>
                    {statusConfig[selectedOrder.status].label}
                  </span>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                  {selectedOrder.items.map((item, i) => {
                    const med = medicines.find(m => m.id === item.medicineId);
                    return (
                      <div key={i} className="flex items-center justify-between text-sm text-foreground">
                        <span>{med?.name || "Medicine"} ({med?.brand})</span>
                        <span className="text-muted-foreground">x{item.qty}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <Badge variant="secondary">{selectedOrder.paymentMode}</Badge>
                    <Badge variant={selectedOrder.requiresPrescription ? "destructive" : "outline"}>
                      {selectedOrder.requiresPrescription ? "Rx required" : "OTC"}
                    </Badge>
                    <Badge variant="outline">
                      SLA {selectedOrder.promisedTimeMin} min • {selectedOrder.deliveryDistanceKm} km
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-border/50 flex justify-between font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">₹{selectedOrder.total}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Delivery Address</p>
                      <p className="font-medium text-foreground">{selectedOrder.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">{selectedOrder.phone}</p>
                    </div>
                  </div>
                </div>

                {selectedOrder.riderId && (
                  <div className="p-4 bg-accent/10 rounded-xl">
                    <p className="text-sm font-medium text-accent mb-2">Assigned Rider</p>
                    <div className="flex items-center gap-3">
                      <img 
                        src={getRiderForOrder(selectedOrder.riderId)?.image} 
                        alt="" 
                        className="w-10 h-10 rounded-full" 
                      />
                      <div>
                        <p className="font-semibold text-foreground">{getRiderForOrder(selectedOrder.riderId)?.name}</p>
                        <p className="text-sm text-muted-foreground">{getRiderForOrder(selectedOrder.riderId)?.phone}</p>
                      </div>
                      <Button size="sm" variant="outline" className="ml-auto border-accent text-accent">
                        <Phone className="w-4 h-4 mr-1" /> Call
                      </Button>
                    </div>
                  </div>
                )}

                {showRiderSelect && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-muted/50 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-foreground">Select Rider</p>
                      {recommendedRider && (
                        <Badge variant="outline" className="text-xs">
                          Recommended: {recommendedRider.name}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      {riders.filter(r => r.status === "available").map((rider) => (
                        <div
                          key={rider.id}
                          onClick={() => setSelectedRider(rider.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedRider === rider.id 
                              ? "bg-primary/10 border-2 border-primary" 
                              : "bg-card border-2 border-transparent hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img src={rider.image} alt={rider.name} className="w-8 h-8 rounded-full" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{rider.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {rider.rating} • {rider.trips} trips • {rider.distanceFromStoreKm.toFixed(1)} km away
                              </div>
                            </div>
                            {selectedRider === rider.id && (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex gap-3">
                {selectedOrder.status === "pending" && (
                  <>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}
                    >
                      Reject
                    </Button>
                    <Button 
                      className="flex-1 btn-primary-gradient"
                      onClick={() => updateOrderStatus(selectedOrder.id, "preparing")}
                    >
                      Accept Order
                    </Button>
                  </>
                )}
                {selectedOrder.status === "preparing" && (
                  <Button 
                    className="w-full btn-primary-gradient"
                    onClick={() => updateOrderStatus(selectedOrder.id, "ready")}
                  >
                    Mark as Ready
                  </Button>
                )}
                {selectedOrder.status === "ready" && !showRiderSelect && (
                  <Button 
                    className="w-full btn-primary-gradient"
                    onClick={() => setShowRiderSelect(true)}
                  >
                    <Bike className="w-4 h-4 mr-2" /> Assign Rider
                  </Button>
                )}
                {selectedOrder.status === "ready" && showRiderSelect && (
                  <Button 
                    className="w-full btn-primary-gradient"
                    disabled={!selectedRider}
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, "dispatched", selectedRider!);
                      setShowRiderSelect(false);
                      setSelectedRider(null);
                    }}
                  >
                    Dispatch Order
                  </Button>
                )}
                {selectedOrder.status === "dispatched" && (
                  <Button 
                    className="w-full btn-primary-gradient"
                    onClick={() => updateOrderStatus(selectedOrder.id, "delivered")}
                  >
                    Mark Delivered
                  </Button>
                )}
                {(selectedOrder.status === "dispatched" || selectedOrder.status === "delivered") && (
                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary/10"
                    onClick={() => setTrackingOrder(selectedOrder)}
                  >
                    <Navigation className="w-4 h-4 mr-2" /> Track Delivery
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInventoryModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowInventoryModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass-card rounded-3xl p-6 z-50 max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Manage Inventory</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowInventoryModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <ScrollArea className="h-[60vh]">
                <div className="space-y-3 pr-4">
                  {inventoryItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.brand}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          defaultValue={item.stock}
                          className="w-20 text-center bg-card border-border"
                          onChange={(e) => {
                            if (pharmacy) {
                              updatePharmacyInventory(pharmacy.id, item.id, parseInt(e.target.value) || 0);
                            }
                          }}
                        />
                        <span className="text-sm text-muted-foreground">units</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {trackingOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setTrackingOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 w-full max-w-xl glass-card rounded-3xl border border-border p-6 z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tracking</p>
                  <h3 className="text-lg font-semibold text-foreground">Order #{trackingOrder.id}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setTrackingOrder(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bike className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {getRiderForOrder(trackingOrder.riderId)?.name || "Assigning..."}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {trackingOrder.deliveryDistanceKm} km route • SLA {trackingOrder.promisedTimeMin} min
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {trackingOrder.status === "delivered" ? "Delivered" : "Live"}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Pickup</span>
                  <span>Dropoff</span>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${trackingProgress}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Pharmacy packed</span>
                  <span>{trackingProgress}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">ETA to customer</p>
                  <p className="text-lg font-semibold text-foreground">
                    {trackingOrder.status === "delivered" ? "Completed" : `${Math.max(5, Math.round(trackingOrder.promisedTimeMin / 2))} min`}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Payment</p>
                  <p className="text-lg font-semibold text-foreground">{trackingOrder.paymentMode}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {[
                  { label: "Order confirmed", done: true },
                  { label: "Prepared", done: trackingProgress >= 35 },
                  { label: "Picked up by rider", done: trackingProgress >= 55 },
                  { label: "En route", done: trackingProgress >= 80 },
                  { label: "Delivered", done: trackingProgress >= 100 },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {step.done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <p className={`text-sm ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">
                    {getRiderForOrder(trackingOrder.riderId)?.phone || "TBD"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Navigation className="w-4 h-4" />
                  Updating live...
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}