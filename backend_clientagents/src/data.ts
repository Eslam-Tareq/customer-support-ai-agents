export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  email: string;
  items: OrderItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
  trackingNumber: string;
  createdAt: string;
}

// Mock inventory data
export let products: Product[] = [
  {
    id: "PROD-001",
    name: "Apex Wireless Headphones",
    price: 129.99,
    description: "Premium over-ear noise-cancelling headphones with a 40-hour battery life and high-fidelity sound.",
    category: "Electronics",
    stock: 25
  },
  {
    id: "PROD-002",
    name: "Summit Tech Backpack",
    price: 89.99,
    description: "Water-resistant commuter backpack with a dedicated 16-inch laptop compartment and USB charging port.",
    category: "Accessories",
    stock: 14
  },
  {
    id: "PROD-003",
    name: "VoltCharge 20K Power Bank",
    price: 49.99,
    description: "20,000mAh external battery pack with dual USB-C PD ports and 22.5W fast charging output.",
    category: "Electronics",
    stock: 50
  },
  {
    id: "PROD-004",
    name: "Nebula Smart Projector",
    price: 349.99,
    description: "Ultra-portable 1080p home theater projector with built-in streaming apps and 360-degree speaker.",
    category: "Electronics",
    stock: 8
  },
  {
    id: "PROD-005",
    name: "Quantum Mechanical Keyboard",
    price: 119.99,
    description: "Hot-swappable tactile mechanical keyboard with custom RGB backlighting and aluminum frame.",
    category: "Electronics",
    stock: 19
  },
  {
    id: "PROD-006",
    name: "HydroFlow Insulated Bottle",
    price: 34.99,
    description: "32oz vacuum insulated stainless steel water bottle. Keeps drinks cold for 24 hours or hot for 12.",
    category: "Kitchen & Home",
    stock: 35
  },
  {
    id: "PROD-007",
    name: "Aura Smart Lamp",
    price: 59.99,
    description: "WiFi-enabled bedside lamp with millions of colors, voice control, and sunrise wake-up scheduling.",
    category: "Kitchen & Home",
    stock: 22
  }
];

// Mock orders database
export let orders: Order[] = [
  {
    id: "ORD-1001",
    email: "customer@example.com",
    items: [
      { productId: "PROD-001", name: "Apex Wireless Headphones", quantity: 1, price: 129.99 },
      { productId: "PROD-003", name: "VoltCharge 20K Power Bank", quantity: 1, price: 49.99 }
    ],
    total: 179.98,
    status: "Processing",
    trackingNumber: "TRK-MN1209384",
    createdAt: "2026-06-08"
  },
  {
    id: "ORD-1002",
    email: "alice@company.com",
    items: [
      { productId: "PROD-002", name: "Summit Tech Backpack", quantity: 1, price: 89.99 }
    ],
    total: 89.99,
    status: "Shipped",
    trackingNumber: "TRK-SH9902381",
    createdAt: "2026-06-05"
  },
  {
    id: "ORD-1003",
    email: "bob@gmail.com",
    items: [
      { productId: "PROD-006", name: "HydroFlow Insulated Bottle", quantity: 2, price: 34.99 }
    ],
    total: 69.98,
    status: "Delivered",
    trackingNumber: "TRK-DL8839201",
    createdAt: "2026-06-01"
  }
];

// Database operations helpers

// Get all products
export function getProducts(): Product[] {
  return products;
}

// Search products by name or category
export function searchProductsDB(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return products;
  return products.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.category.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );
}

// Get product details
export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

// Get order status
export function getOrderDB(orderId: string, email: string): Order | undefined {
  const oId = orderId.toUpperCase().trim();
  const mail = email.toLowerCase().trim();
  return orders.find(o => o.id === oId && o.email.toLowerCase() === mail);
}

// Cancel an order
export function cancelOrderDB(orderId: string, email: string): { success: boolean; message: string; order?: Order } {
  const order = getOrderDB(orderId, email);
  if (!order) {
    return { success: false, message: "Order not found with the provided details." };
  }

  if (order.status === "Cancelled" || order.status === "Refunded") {
    return { success: false, message: `Order is already ${order.status.toLowerCase()}.` };
  }

  if (order.status === "Delivered") {
    return { success: false, message: "Order has already been delivered and cannot be cancelled. You can request a return instead." };
  }

  order.status = "Cancelled";
  return { success: true, message: "Order cancelled successfully.", order };
}

// Request refund
export function processRefundDB(orderId: string, email: string): { success: boolean; message: string; order?: Order } {
  const order = getOrderDB(orderId, email);
  if (!order) {
    return { success: false, message: "Order not found with the provided details." };
  }

  if (order.status === "Refunded") {
    return { success: true, message: "This order has already been fully refunded.", order };
  }

  if (order.status !== "Delivered" && order.status !== "Cancelled") {
    return { success: false, message: "Refunds can only be processed for delivered or cancelled orders." };
  }

  order.status = "Refunded";
  return { success: true, message: "Refund has been approved and successfully processed. The funds will appear in your account in 3-5 business days.", order };
}
