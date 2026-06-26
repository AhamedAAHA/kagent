export type AgentName =
  | 'concierge'
  | 'life-event'
  | 'memory'
  | 'shopping'
  | 'festival'
  | 'budget'
  | 'delivery';

export type AgentStatus = 'idle' | 'thinking' | 'done' | 'error';

export interface Agent {
  id: AgentName;
  name: string;
  emoji: string;
  color: string;
  description: string;
  status: AgentStatus;
  message?: string;
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
  | 'food'
  | 'electronics'
  | 'household'
  | 'clothing'
  | 'gifts'
  | 'stationery'
  | 'beauty'
  | 'groceries'
  | 'flowers'
  | 'festival';

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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentActivity?: AgentActivity[];
  bundles?: ShoppingBundle[];
  products?: Product[];
}

export interface AgentActivity {
  agentId: AgentName;
  status: AgentStatus;
  message: string;
  timestamp: Date;
}

export interface LifeEvent {
  type: string;
  description: string;
  suggestedBudget?: number;
  requiredItems: string[];
  timeline?: string;
}
