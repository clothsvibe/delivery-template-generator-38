
import { DeliveryReceipt } from "../types/deliveryReceipt";
import { v4 as uuidv4 } from "uuid";
import { recalculateReceipts } from "../lib/formatters";

// Initial mock data based on the provided example
const initialData: DeliveryReceipt[] = [
  {
    id: uuidv4(),
    date: "2025",
    nb: 2702.00,
    montantBL: 6662.00,
    avance: null,
    total: 6662.00
  },
  {
    id: uuidv4(),
    date: "2025-01-16",
    nb: 2702.00,
    montantBL: 1870.00,
    avance: null,
    total: 8532.00
  },
  {
    id: uuidv4(),
    date: "2025",
    nb: 2706.00,
    montantBL: 10732.00,
    avance: null,
    total: 19264.00
  },
  {
    id: uuidv4(),
    date: "2025-02-06",
    nb: 2706.00,
    montantBL: 9610.00,
    avance: null,
    total: 28874.00
  },
  {
    id: uuidv4(),
    date: "2025-03-01",
    nb: 2707.00,
    montantBL: 11246.00,
    avance: null,
    total: 40120.00
  },
  {
    id: uuidv4(),
    date: "2025-03-08",
    nb: 2708.00,
    montantBL: 11000.00,
    avance: null,
    total: 51120.00
  },
  {
    id: uuidv4(),
    date: "2025-03-17",
    nb: 2709.00,
    montantBL: 27500.00,
    avance: null,
    total: 78620.00
  },
  {
    id: uuidv4(),
    date: "2025-03-19",
    nb: 2710.00,
    montantBL: 965.00,
    avance: null,
    total: 79585.00
  }
];

// Generate additional empty rows with the total amount repeated
const generateMockData = (): DeliveryReceipt[] => {
  const data = [...initialData];
  
  // Add 17 more rows with repeated total
  for (let i = 0; i < 17; i++) {
    data.push({
      id: uuidv4(),
      date: "",
      nb: null,
      montantBL: null,
      avance: null,
      total: 79585.00
    });
  }
  
  return recalculateReceipts(data);
};

// Try to load data from localStorage or use initial data
const loadDataFromStorage = (): DeliveryReceipt[] => {
  try {
    const savedData = localStorage.getItem('deliveryReceipts');
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }
  
  // If no data in localStorage or error, use mock data
  const initialMockData = generateMockData();
  saveDataToStorage(initialMockData);
  return initialMockData;
};

// Save data to localStorage
const saveDataToStorage = (data: DeliveryReceipt[]): void => {
  try {
    localStorage.setItem('deliveryReceipts', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

// In-memory data store with localStorage persistence
let deliveryReceipts = loadDataFromStorage();

export const getDeliveryReceipts = (): Promise<DeliveryReceipt[]> => {
  // Reload from localStorage to ensure we have the latest data
  deliveryReceipts = loadDataFromStorage();
  return Promise.resolve(deliveryReceipts);
};

export const addDeliveryReceipt = (receipt: Omit<DeliveryReceipt, "id" | "total">): Promise<DeliveryReceipt[]> => {
  const newReceipt = { 
    ...receipt, 
    id: uuidv4(),
    total: 0 // This will be recalculated
  };
  
  deliveryReceipts = [newReceipt, ...deliveryReceipts];
  deliveryReceipts = recalculateReceipts(deliveryReceipts);
  
  // Save to localStorage
  saveDataToStorage(deliveryReceipts);
  
  return Promise.resolve(deliveryReceipts);
};

export const updateDeliveryReceipt = (receipt: Partial<DeliveryReceipt> & { id: string }): Promise<DeliveryReceipt[]> => {
  deliveryReceipts = deliveryReceipts.map(r => 
    r.id === receipt.id ? { ...r, ...receipt } : r
  );
  
  deliveryReceipts = recalculateReceipts(deliveryReceipts);
  
  // Save to localStorage
  saveDataToStorage(deliveryReceipts);
  
  return Promise.resolve(deliveryReceipts);
};

export const deleteDeliveryReceipt = (id: string): Promise<DeliveryReceipt[]> => {
  deliveryReceipts = deliveryReceipts.filter(r => r.id !== id);
  deliveryReceipts = recalculateReceipts(deliveryReceipts);
  
  // Save to localStorage
  saveDataToStorage(deliveryReceipts);
  
  return Promise.resolve(deliveryReceipts);
};

// Function to get delivery receipt history for a specific month
export const getMonthlyHistory = (year: number, month: number): Promise<DeliveryReceipt[]> => {
  // Format month to have leading zero if needed (1 -> "01")
  const monthStr = month.toString().padStart(2, '0');
  const yearStr = year.toString();
  
  // Filter receipts that belong to the specified month
  const filteredReceipts = deliveryReceipts.filter(receipt => {
    if (!receipt.date) return false;
    
    // Check for both formats: "2025-01-16" and "2025"
    return receipt.date.startsWith(`${yearStr}-${monthStr}`) || 
           receipt.date === yearStr;
  });
  
  return Promise.resolve(filteredReceipts);
};

export const getMonthlyTotal = (year: number, month: number): Promise<number> => {
  return getMonthlyHistory(year, month).then(receipts => {
    if (receipts.length === 0) return 0;
    // Return the total of the last receipt in the month
    return receipts[receipts.length - 1].total;
  });
};
