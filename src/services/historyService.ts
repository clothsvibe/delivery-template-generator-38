
import { HistoryEntry, DeliveryReceipt } from "@/types/deliveryReceipt";
import { v4 as uuidv4 } from 'uuid';

// Local storage key
const HISTORY_ENTRIES_KEY = "delivery_history_entries";

// Initialize from localStorage if available
let historyEntries: HistoryEntry[] = [];

try {
  const storedEntries = localStorage.getItem(HISTORY_ENTRIES_KEY);
  if (storedEntries) {
    historyEntries = JSON.parse(storedEntries);
  }
} catch (error) {
  console.error("Error loading history from localStorage:", error);
}

export const getHistoryEntries = (): Promise<HistoryEntry[]> => {
  return Promise.resolve(historyEntries);
};

export const addHistoryEntry = (
  action: HistoryEntry['action'],
  receiptId: string,
  details: Partial<DeliveryReceipt>,
  companyId?: string
): Promise<HistoryEntry[]> => {
  const newEntry: HistoryEntry = {
    date: new Date().toISOString(),
    action,
    receiptId,
    details,
    companyId
  };
  
  historyEntries = [newEntry, ...historyEntries];
  
  // Save to localStorage
  try {
    localStorage.setItem(HISTORY_ENTRIES_KEY, JSON.stringify(historyEntries));
  } catch (error) {
    console.error("Error saving history to localStorage:", error);
  }
  
  return Promise.resolve(historyEntries);
};

// Function to update an existing history entry
export const updateHistoryEntry = (
  receiptId: string,
  updatedDetails: Partial<DeliveryReceipt>
): Promise<HistoryEntry[]> => {
  historyEntries = historyEntries.map(entry => {
    if (entry.receiptId === receiptId) {
      return {
        ...entry,
        details: {
          ...entry.details,
          ...updatedDetails
        }
      };
    }
    return entry;
  });
  
  // Save to localStorage
  try {
    localStorage.setItem(HISTORY_ENTRIES_KEY, JSON.stringify(historyEntries));
  } catch (error) {
    console.error("Error saving updated history to localStorage:", error);
  }
  
  return Promise.resolve(historyEntries);
};

// Function to restore a delivery receipt from history
export const restoreFromHistory = (
  receiptId: string
): Promise<{ success: boolean, data?: Partial<DeliveryReceipt> }> => {
  const entryToRestore = historyEntries.find(entry => entry.receiptId === receiptId);
  
  if (!entryToRestore) {
    return Promise.resolve({ success: false });
  }
  
  return Promise.resolve({ 
    success: true, 
    data: entryToRestore.details 
  });
};

// Function to delete specific history entries
export const deleteHistoryEntries = (
  receiptIds: string[]
): Promise<HistoryEntry[]> => {
  historyEntries = historyEntries.filter(entry => !receiptIds.includes(entry.receiptId));
  
  // Save to localStorage
  try {
    localStorage.setItem(HISTORY_ENTRIES_KEY, JSON.stringify(historyEntries));
  } catch (error) {
    console.error("Error saving history after deletion to localStorage:", error);
  }
  
  return Promise.resolve(historyEntries);
};

export const clearHistory = (): Promise<HistoryEntry[]> => {
  historyEntries = [];
  
  // Save to localStorage
  try {
    localStorage.setItem(HISTORY_ENTRIES_KEY, JSON.stringify(historyEntries));
  } catch (error) {
    console.error("Error clearing history in localStorage:", error);
  }
  
  return Promise.resolve(historyEntries);
};
