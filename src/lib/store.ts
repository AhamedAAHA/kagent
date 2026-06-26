import { create } from 'zustand';
import { ChatMessage, CartItem, FamilyMember, AgentActivity, Agent } from '@/types';

interface KAgentStore {
  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: () => number;

  // Family Memory
  familyMembers: FamilyMember[];
  addFamilyMember: (member: FamilyMember) => void;

  // Agent Status
  agents: Agent[];
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  resetAgents: () => void;

  // Loading
  isLoading: boolean;
  setLoading: (v: boolean) => void;

  // Budget
  userBudget?: number;
  setBudget: (v?: number) => void;
}

const DEFAULT_AGENTS: Agent[] = [
  { id: 'concierge', name: 'Concierge', emoji: '🎯', color: '#7C3AED', description: 'Your personal shopping guide', status: 'idle' },
  { id: 'life-event', name: 'Life Events', emoji: '🌟', color: '#D97706', description: 'Understands your life situation', status: 'idle' },
  { id: 'memory', name: 'Memory', emoji: '💾', color: '#0891B2', description: 'Remembers your family & preferences', status: 'idle' },
  { id: 'shopping', name: 'Shopping', emoji: '🛒', color: '#059669', description: 'Finds the best Sri Lankan products', status: 'idle' },
  { id: 'festival', name: 'Festival', emoji: '🎉', color: '#DC2626', description: 'Sri Lankan festival intelligence', status: 'idle' },
  { id: 'budget', name: 'Budget', emoji: '💰', color: '#7C3AED', description: 'Optimises your spending', status: 'idle' },
  { id: 'delivery', name: 'Delivery', emoji: '🚚', color: '#0F766E', description: 'Checks delivery timelines', status: 'idle' },
];

export const useKAgentStore = create<KAgentStore>((set, get) => ({
  messages: [],
  addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  cart: [],
  addToCart: (item) => set(s => {
    const existing = s.cart.findIndex(c => c.product.id === item.product.id);
    if (existing >= 0) {
      const updated = [...s.cart];
      updated[existing].quantity += item.quantity;
      return { cart: updated };
    }
    return { cart: [...s.cart, item] };
  }),
  removeFromCart: (productId) => set(s => ({ cart: s.cart.filter(c => c.product.id !== productId) })),
  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),

  familyMembers: [],
  addFamilyMember: (member) => set(s => ({ familyMembers: [...s.familyMembers, member] })),

  agents: DEFAULT_AGENTS,
  updateAgent: (id, updates) => set(s => ({
    agents: s.agents.map(a => a.id === id ? { ...a, ...updates } : a),
  })),
  resetAgents: () => set({ agents: DEFAULT_AGENTS.map(a => ({ ...a, status: 'idle' as const, message: undefined })) }),

  isLoading: false,
  setLoading: (v) => set({ isLoading: v }),

  userBudget: undefined,
  setBudget: (v) => set({ userBudget: v }),
}));
