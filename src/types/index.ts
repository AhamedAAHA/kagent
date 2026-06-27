export type AgentName =
  | 'concierge' | 'life-event' | 'memory'
  | 'shopping' | 'festival' | 'budget' | 'delivery';

export type AgentStatus = 'idle' | 'thinking' | 'done' | 'error';

export interface Agent {
  id: AgentName;
  name: string;
  emoji: string;
  color: string;
  description: string;
  status: AgentStatus;
  message?: string;
  log?: string[];          // NEW: streaming log lines
}

export interface Product {
  id: string;
  name: string;
  nameSinhala?: string;
  price: number;
  category: ProductCategory;
  subcategory: string;
  image: string;
  vendor: string;
  location: string;
  inStock: boolean;
  deliveryDays: number;
  tags: string[];
  rating: number;
  reviewCount: number;
}

export type ProductCategory =
  | 'food' | 'electronics' | 'household' | 'clothing'
  | 'gifts' | 'stationery' | 'beauty' | 'groceries'
  | 'flowers' | 'festival';

export interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
}

export interface ShoppingBundle {
  id: string;
  name: string;
  description: string;
  tier: 'budget' | 'midrange' | 'premium';
  items: CartItem[];
  totalPrice: number;
  estimatedDelivery: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthday?: string;
  preferences: string[];
  pastGifts: string[];
}

export interface UserMemory {
  familyMembers: FamilyMember[];
  purchaseHistory: { productId: string; date: string; occasion?: string }[];
  preferences: {
    budget: 'low' | 'medium' | 'high';
    categories: ProductCategory[];
    language: 'en' | 'si';
  };
  repeatItems: { productId: string; frequencyDays: number; lastPurchase: string }[];
}

export interface Festival {
  id: string;
  name: string;
  nameSinhala: string;
  date: Date;
  daysUntil: number;
  category: 'religious' | 'cultural' | 'national';
  suggestedCategories: ProductCategory[];
  greeting: string;
}

export interface AgentDebateMessage {
  agentId: AgentName;
  content: string;
  timestamp: Date;
  type: 'statement' | 'objection' | 'agreement' | 'verdict';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentActivity?: AgentActivity[];
  bundles?: ShoppingBundle[];
  products?: Product[];
  debate?: AgentDebateMessage[];   // NEW
  shopperDNA?: ShopperDNA;         // NEW
  isSurprise?: boolean;            // NEW
}

export interface AgentActivity {
  agentId: AgentName;
  status: AgentStatus;
  message: string;
  timestamp: Date;
  logLines?: string[];             // NEW: terminal log lines
}

export interface LifeEvent {
  type: string;
  description: string;
  suggestedBudget?: number;
  requiredItems: string[];
  timeline?: string;
}

// NEW: Shopper DNA profile
export interface ShopperDNA {
  traits: string[];
  budgetStyle: string;
  topCategories: string[];
  deliveryPref: string;
  personalityTag: string;
}

// NEW: Streaming chunk from SSE
export interface StreamChunk {
  type: 'agent_log' | 'agent_done' | 'response_token' | 'bundles' | 'products' | 'debate' | 'dna' | 'done' | 'error';
  agentId?: AgentName;
  text?: string;
  data?: unknown;
}
