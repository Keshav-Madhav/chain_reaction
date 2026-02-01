import { create } from "zustand";

export interface FlyingAtomData {
  id: string;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  color: string;
  delay: number;
}

export interface ExplosionStep {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  color: string;
}

interface ExplosionAnimationState {
  flyingAtoms: FlyingAtomData[];
  isAnimating: boolean;
  // Track how many atoms are pending arrival at each cell (hide these)
  pendingArrivals: Map<string, number>;
  // Track how many atoms are pending departure from each cell (show these extra)
  pendingDepartures: Map<string, { count: number; color: string }>;
}

interface ExplosionAnimationActions {
  // Register ALL pending movements BEFORE board state updates
  registerExplosions: (steps: ExplosionStep[]) => void;
  
  // Start flying atoms for a wave (atoms leave source cells, begin flying)
  startFlyingAtoms: (steps: ExplosionStep[]) => void;
  
  // Called when a flying atom completes its animation (atom arrives at destination)
  onAtomLanded: (id: string, toRow: number, toCol: number) => void;
  
  clearAllAnimations: () => void;
  
  // Get visual adjustments for a cell
  getPendingArrivalsForCell: (row: number, col: number) => number;
  getPendingDeparturesForCell: (row: number, col: number) => { count: number; color: string } | null;
}

export type ExplosionAnimationStore = ExplosionAnimationState & ExplosionAnimationActions;

let atomIdCounter = 0;

export const useExplosionAnimationStore = create<ExplosionAnimationStore>((set, get) => ({
  flyingAtoms: [],
  isAnimating: false,
  pendingArrivals: new Map(),
  pendingDepartures: new Map(),

  // Register ALL pending movements - hides destination atoms and shows source atoms
  registerExplosions: (steps: ExplosionStep[]) => {
    const newPendingArrivals = new Map(get().pendingArrivals);
    const newPendingDepartures = new Map(get().pendingDepartures);
    
    steps.forEach((step) => {
      // Track pending arrivals (atoms flying TO this cell - hide them)
      const arrivalKey = `${step.toRow}-${step.toCol}`;
      const currentArrivals = newPendingArrivals.get(arrivalKey) || 0;
      newPendingArrivals.set(arrivalKey, currentArrivals + 1);
      
      // Track pending departures (atoms still visually in source cell until they fly)
      const departureKey = `${step.fromRow}-${step.fromCol}`;
      const currentDepartures = newPendingDepartures.get(departureKey) || { count: 0, color: step.color };
      newPendingDepartures.set(departureKey, { 
        count: currentDepartures.count + 1, 
        color: step.color 
      });
    });
    
    set({ 
      pendingArrivals: newPendingArrivals,
      pendingDepartures: newPendingDepartures,
    });
  },

  // Start the actual flying animations - atoms now leave the source cell
  startFlyingAtoms: (steps: ExplosionStep[]) => {
    const newPendingDepartures = new Map(get().pendingDepartures);
    
    // Remove from pending departures - atoms are now flying, not sitting in source
    steps.forEach((step) => {
      const key = `${step.fromRow}-${step.fromCol}`;
      const current = newPendingDepartures.get(key);
      if (current) {
        if (current.count <= 1) {
          newPendingDepartures.delete(key);
        } else {
          newPendingDepartures.set(key, { ...current, count: current.count - 1 });
        }
      }
    });
    
    const atoms: FlyingAtomData[] = steps.map((step, index) => ({
      id: `atom-${++atomIdCounter}`,
      fromRow: step.fromRow,
      fromCol: step.fromCol,
      toRow: step.toRow,
      toCol: step.toCol,
      color: step.color,
      delay: index * 0.01, // Slight stagger within wave
    }));
    
    set((state) => ({
      flyingAtoms: [...state.flyingAtoms, ...atoms],
      isAnimating: true,
      pendingDepartures: newPendingDepartures,
    }));
  },

  // Called when a flying atom lands at its destination
  onAtomLanded: (id: string, toRow: number, toCol: number) => {
    const key = `${toRow}-${toCol}`;
    const newPendingArrivals = new Map(get().pendingArrivals);
    const current = newPendingArrivals.get(key) || 0;
    
    if (current <= 1) {
      newPendingArrivals.delete(key);
    } else {
      newPendingArrivals.set(key, current - 1);
    }
    
    set((state) => {
      const newFlyingAtoms = state.flyingAtoms.filter((atom) => atom.id !== id);
      return {
        flyingAtoms: newFlyingAtoms,
        isAnimating: newFlyingAtoms.length > 0,
        pendingArrivals: newPendingArrivals,
      };
    });
  },

  clearAllAnimations: () => {
    set({
      flyingAtoms: [],
      isAnimating: false,
      pendingArrivals: new Map(),
      pendingDepartures: new Map(),
    });
  },
  
  getPendingArrivalsForCell: (row: number, col: number) => {
    const key = `${row}-${col}`;
    return get().pendingArrivals.get(key) || 0;
  },
  
  getPendingDeparturesForCell: (row: number, col: number) => {
    const key = `${row}-${col}`;
    return get().pendingDepartures.get(key) || null;
  },
}));
