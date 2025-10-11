import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserMachine } from '@/types/machines.types';

interface PendingMachine {
  tempId: string;
  machine: UserMachine;
  createdAt: number;
}

interface MachinesStore {
  // Pending machines that are being created
  pendingMachines: PendingMachine[];
  
  // Add a pending machine
  addPendingMachine: (machine: UserMachine) => void;
  
  // Remove a pending machine (when creation completes or fails)
  removePendingMachine: (tempId: string) => void;
  
  // Update a pending machine with real data
  updatePendingMachine: (tempId: string, realMachine: UserMachine) => void;
  
  // Clean up old pending machines (older than 10 minutes)
  cleanupOldPendingMachines: () => void;
  
  // Get all pending machines
  getPendingMachines: () => UserMachine[];
}

export const useMachinesStore = create<MachinesStore>()(
  persist(
    (set, get) => ({
      pendingMachines: [],
      
      addPendingMachine: (machine) => {
        set((state) => ({
          pendingMachines: [
            ...state.pendingMachines,
            {
              tempId: machine.id,
              machine,
              createdAt: Date.now(),
            },
          ],
        }));
      },
      
      removePendingMachine: (tempId) => {
        set((state) => ({
          pendingMachines: state.pendingMachines.filter(
            (pm) => pm.tempId !== tempId
          ),
        }));
      },
      
      updatePendingMachine: (tempId, realMachine) => {
        set((state) => ({
          pendingMachines: state.pendingMachines.map((pm) =>
            pm.tempId === tempId
              ? { ...pm, machine: { ...realMachine, id: realMachine.id } }
              : pm
          ),
        }));
      },
      
      cleanupOldPendingMachines: () => {
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        set((state) => ({
          pendingMachines: state.pendingMachines.filter(
            (pm) => pm.createdAt > tenMinutesAgo
          ),
        }));
      },
      
      getPendingMachines: () => {
        const state = get();
        // Clean up old ones first
        state.cleanupOldPendingMachines();
        return state.pendingMachines.map((pm) => pm.machine);
      },
    }),
    {
      name: 'machines-storage',
      partialize: (state) => ({ pendingMachines: state.pendingMachines }),
    }
  )
);