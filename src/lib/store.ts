import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, CartItem, FamilyMember, Agent, ShopperDNA } from '@/types';

interface KAgentStore {
  // Chat
  messages: ChatMessage[];
  messageCount: number;
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: () => number;

  // Family Memory (persisted)
  familyMembers: FamilyMember[];
  addFamilyMember: (member: FamilyMember) => void;

  // Shopper DNA (persisted)
  shopperDNA: ShopperDNA | null;
  setShopperDNA: (dna: ShopperDNA) => void;

  // Purchase history (persisted)
  purchaseHistory: { productId: string; name: string; date: string }[];
  addPurchase: (productId: string, name: string) => void;

  // Agent Status
  agents: Agent[];
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  appendAgentLog: (id: string, line: string) => void;
  resetAgents: () => void;

  // Loading
  isLoading: boolean;
  setLoading: (v: boolean) => void;

  // Budget
  userBudget?: number;
  setBudget: (v?: number) => void;

  // Terminal log (live stream display)
  terminalLines: { agentId: string; text: string; ts: number }[];
  addTerminalLine: (agentId: string, text: string) => void;
  clearTerminal: () => void;
}

const DEFAULT_AGENTS: Agent[] = [
  { id: 'concierge',   name: 'Concierge',   emoji: '🎯', color: '#A78BFA', description: 'Your personal shopping guide',         status: 'idle', log: [] },
  { id: 'life-event',  name: 'Life Events', emoji: '🌟', color: '#FCD34D', description: 'Understands your life situation',       status: 'idle', log: [] },
  { id: 'memory',      name: 'Memory',      emoji: '💾', color: '#FB923C', description: 'Remembers family & preferences',       status: 'idle', log: [] },
  { id: 'shopping',    name: 'Shopping',    emoji: '🛒', color: '#34D399', description: 'Finds best Sri Lankan products',       status: 'idle', log: [] },
  { id: 'festival',    name: 'Festival',    emoji: '🎉', color: '#F87171', description: 'Sri Lankan festival intelligence',     status: 'idle', log: [] },
  { id: 'budget',      name: 'Budget',      emoji: '💰', color: '#A78BFA', description: 'Optimises your spending',              status: 'idle', log: [] },
  { id: 'delivery',    name: 'Delivery',    emoji: '🚚', color: '#22D3EE', description: 'Checks delivery timelines',            status: 'idle', log: [] },
];

export const useKAgentStore = create<KAgentStore>()(
  persist(
    (set, get) => ({
      messages: [],
      messageCount: 0,
      addMessage: (msg) => set(s => ({ messages: [...s.messages, msg], messageCount: s.messageCount + 1 })),
      updateLastMessage: (updates) => set(s => {
        const msgs = [...s.messages];
        if (msgs.length === 0) return s;
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...updates };
        return { messages: msgs };
      }),
      clearMessages: () => set({ messages: [], messageCount: 0 }),

      cart: [],
      addToCart: (item) => set(s => {
        const idx = s.cart.findIndex(c => c.product.id === item.product.id);
        if (idx >= 0) {
          const updated = [...s.cart];
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
          return { cart: updated };
        }
        return { cart: [...s.cart, item] };
      }),
      removeFromCart: (id) => set(s => ({ cart: s.cart.filter(c => c.product.id !== id) })),
      clearCart: () => set({ cart: [] }),
      cartTotal: () => get().cart.reduce((s, i) => s + i.product.price * i.quantity, 0),

      familyMembers: [],
      addFamilyMember: (m) => set(s => ({ familyMembers: [...s.familyMembers, m] })),

      shopperDNA: null,
      setShopperDNA: (dna) => set({ shopperDNA: dna }),

      purchaseHistory: [],
      addPurchase: (productId, name) => set(s => ({
        purchaseHistory: [...s.purchaseHistory, { productId, name, date: new Date().toISOString() }].slice(-50),
      })),

      agents: DEFAULT_AGENTS,
      updateAgent: (id, updates) => set(s => ({
        agents: s.agents.map(a => a.id === id ? { ...a, ...updates } : a),
      })),
      appendAgentLog: (id, line) => set(s => ({
        agents: s.agents.map(a => a.id === id ? { ...a, log: [...(a.log ?? []), line] } : a),
      })),
      resetAgents: () => set({
        agents: DEFAULT_AGENTS.map(a => ({ ...a, status: 'idle' as const, message: undefined, log: [] })),
        terminalLines: [],
      }),

      isLoading: false,
      setLoading: (v) => set({ isLoading: v }),

      userBudget: undefined,
      setBudget: (v) => set({ userBudget: v }),

      terminalLines: [],
      addTerminalLine: (agentId, text) => set(s => ({
        terminalLines: [...s.terminalLines, { agentId, text, ts: Date.now() }].slice(-120),
      })),
      clearTerminal: () => set({ terminalLines: [] }),
    }),
    {
      name: 'kagent-storage',
      partialize: (s) => ({
        familyMembers: s.familyMembers,
        shopperDNA: s.shopperDNA,
        purchaseHistory: s.purchaseHistory,
        cart: s.cart,
      }),
    }
  )
);
