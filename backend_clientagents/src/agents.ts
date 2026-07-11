import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import { 
  searchProductsDB, 
  getProductById, 
  getOrderDB, 
  cancelOrderDB, 
  processRefundDB 
} from './data';

// Custom tools for Catalog Agent
export const searchProductsTool = tool({
  name: 'searchProducts',
  description: 'Search for products in the catalog by name, category, or description keywords.',
  parameters: z.object({
    query: z.string().describe('The search query or keyword to find products.')
  }),
  execute: async ({ query }) => {
    console.log(`[Tool: searchProducts] Query: "${query}"`);
    const results = searchProductsDB(query);
    if (results.length === 0) {
      return `No products found matching "${query}".`;
    }
    return JSON.stringify(results);
  }
});

export const getProductDetailsTool = tool({
  name: 'getProductDetails',
  description: 'Retrieve comprehensive details for a specific product using its unique product ID.',
  parameters: z.object({
    productId: z.string().describe('The product ID, e.g. PROD-001.')
  }),
  execute: async ({ productId }) => {
    console.log(`[Tool: getProductDetails] Product ID: "${productId}"`);
    const product = getProductById(productId);
    if (!product) {
      return `Product with ID "${productId}" not found.`;
    }
    return JSON.stringify(product);
  }
});

// Custom tools for Order & Refund Agent
export const getOrderStatusTool = tool({
  name: 'getOrderStatus',
  description: 'Check the status, tracking number, items, and total of an order. Requires orderId and customer email.',
  parameters: z.object({
    orderId: z.string().describe('The order ID, e.g., ORD-1001.'),
    email: z.string().describe("The customer's email address.")
  }),
  execute: async ({ orderId, email }) => {
    console.log(`[Tool: getOrderStatus] Order ID: "${orderId}", Email: "${email}"`);
    const order = getOrderDB(orderId, email);
    if (!order) {
      return `Order "${orderId}" not found for email "${email}". Make sure the order ID and email are correct.`;
    }
    return JSON.stringify(order);
  }
});

export const cancelOrderTool = tool({
  name: 'cancelOrder',
  description: 'Cancel a customer order before it has been delivered. Requires orderId and customer email.',
  parameters: z.object({
    orderId: z.string().describe('The order ID, e.g., ORD-1001.'),
    email: z.string().describe("The customer's email address.")
  }),
  execute: async ({ orderId, email }) => {
    console.log(`[Tool: cancelOrder] Order ID: "${orderId}", Email: "${email}"`);
    const result = cancelOrderDB(orderId, email);
    return JSON.stringify(result);
  }
});

export const processRefundTool = tool({
  name: 'processRefund',
  description: 'Process a refund for a delivered or cancelled order. Requires orderId and customer email.',
  parameters: z.object({
    orderId: z.string().describe('The order ID, e.g., ORD-1001.'),
    email: z.string().describe("The customer's email address.")
  }),
  execute: async ({ orderId, email }) => {
    console.log(`[Tool: processRefund] Order ID: "${orderId}", Email: "${email}"`);
    const result = processRefundDB(orderId, email);
    return JSON.stringify(result);
  }
});

// Circular handoff lists that will be populated post-instantiation
const triageHandoffs: any[] = [];
const catalogHandoffs: any[] = [];
const orderHandoffs: any[] = [];

// Initialize Agents
export const productCatalogAgent = new Agent({
  name: 'CatalogAgent',
  model: 'gpt-4o-mini',
  instructions: `You are the Product Catalog Specialist. 
Your role is to help users find products, search for specifications, list options, and explain differences.
You have tools like 'searchProducts' and 'getProductDetails' to query inventory.
Once you have successfully helped the user with their catalog query, if they have no other questions about products, transfer them back to the general TriageAgent.`,
  handoffDescription: 'Transfer to CatalogAgent when the user asks about products, searches for items, or needs details about inventory.',
  tools: [searchProductsTool, getProductDetailsTool],
  handoffs: catalogHandoffs
});

export const orderRefundAgent = new Agent({
  name: 'OrderRefundAgent',
  model: 'gpt-4o-mini',
  instructions: `You are the Order & Refund Specialist.
Your role is to track order shipments, cancel orders that are not yet delivered, or process refunds.
IMPORTANT: You MUST ask the user for BOTH their Order ID (e.g. ORD-1001) and their email address before calling any tools. Do not guess or proceed without both fields.
You have tools: 'getOrderStatus', 'cancelOrder', and 'processRefund'.
Once you have completed their order request or refund request, transfer them back to the general TriageAgent.`,
  handoffDescription: 'Transfer to OrderRefundAgent when the user wants to check order status, track shipping, cancel an order, or process a refund.',
  tools: [getOrderStatusTool, cancelOrderTool, processRefundTool],
  handoffs: orderHandoffs
});

export const triageAgent = new Agent({
  name: 'TriageAgent',
  model: 'gpt-4o-mini',
  instructions: `You are the friendly Triage Support Agent.
Your job is to greet the user, answer basic greeting or informational questions, and transfer them to the CatalogAgent (for products/search) or OrderRefundAgent (for tracking/refunds/cancellations).
Do NOT attempt to query products or track/refund orders directly; transfer to the specialists instead.
If a customer is returned to you from a specialist, check if they need anything else, and wrap up the conversation politely if not.`,
  handoffDescription: 'Transfer back to TriageAgent for general support, greetings, or ending the chat.',
  handoffs: triageHandoffs
});

// Link handoffs dynamically to avoid compile-time circular references
triageHandoffs.push(productCatalogAgent, orderRefundAgent);
catalogHandoffs.push(triageAgent);
orderHandoffs.push(triageAgent);
