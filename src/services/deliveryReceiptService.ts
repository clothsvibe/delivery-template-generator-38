
import { DeliveryReceipt } from "../types/deliveryReceipt";
import { v4 as uuidv4 } from "uuid";
import { recalculateReceipts } from "../lib/formatters";

// Local storage key with company prefix
const DELIVERY_RECEIPTS_KEY_PREFIX = "delivery_receipts_company_";

// Example initial data for the default company
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

// Map to store company-specific delivery receipt data
const companyDeliveryReceiptsMap: Map<string, DeliveryReceipt[]> = new Map();

// Load data for a specific company from localStorage
const loadDataFromStorage = (companyId: string): DeliveryReceipt[] => {
  // If we've already loaded this company's data, return from memory
  if (companyDeliveryReceiptsMap.has(companyId)) {
    return companyDeliveryReceiptsMap.get(companyId) || [];
  }
  
  try {
    const storageKey = `${DELIVERY_RECEIPTS_KEY_PREFIX}${companyId}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      companyDeliveryReceiptsMap.set(companyId, parsedData);
      return parsedData;
    }
  } catch (error) {
    console.error(`Error loading data for company ${companyId} from localStorage:`, error);
  }
  
  // For new companies, return empty array (no example data)
  const emptyData: DeliveryReceipt[] = [];
  companyDeliveryReceiptsMap.set(companyId, emptyData);
  saveDataToStorage(companyId, emptyData);
  return emptyData;
};

// Save data for a specific company to localStorage
const saveDataToStorage = (companyId: string, data: DeliveryReceipt[]): void => {
  try {
    const storageKey = `${DELIVERY_RECEIPTS_KEY_PREFIX}${companyId}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
    // Update our in-memory map
    companyDeliveryReceiptsMap.set(companyId, data);
  } catch (error) {
    console.error(`Error saving data for company ${companyId} to localStorage:`, error);
  }
};

// Initialize the default company with mock data if not already done
const initializeDefaultCompany = (defaultCompanyId: string): void => {
  const storageKey = `${DELIVERY_RECEIPTS_KEY_PREFIX}${defaultCompanyId}`;
  
  try {
    // Only add mock data if this is the default company and it doesn't exist yet
    if (!localStorage.getItem(storageKey)) {
      const initialMockData = generateMockData();
      saveDataToStorage(defaultCompanyId, initialMockData);
    }
  } catch (error) {
    console.error('Error initializing default company data:', error);
  }
};

// Public API
export const getDeliveryReceipts = (companyId: string = 'default'): Promise<DeliveryReceipt[]> => {
  // Load data for this company - this will be empty for new companies
  const data = loadDataFromStorage(companyId);
  return Promise.resolve(data);
};

export const addDeliveryReceipt = (receipt: Omit<DeliveryReceipt, "id" | "total">, companyId: string = 'default'): Promise<DeliveryReceipt[]> => {
  // Load current data
  let receipts = loadDataFromStorage(companyId);
  
  const newReceipt = { 
    ...receipt, 
    id: uuidv4(),
    total: 0 // This will be recalculated
  };
  
  receipts = [newReceipt, ...receipts];
  receipts = recalculateReceipts(receipts);
  
  // Save updated data
  saveDataToStorage(companyId, receipts);
  
  return Promise.resolve(receipts);
};

export const updateDeliveryReceipt = (receipt: Partial<DeliveryReceipt> & { id: string }, companyId: string = 'default'): Promise<DeliveryReceipt[]> => {
  // Load current data
  let receipts = loadDataFromStorage(companyId);
  
  receipts = receipts.map(r => 
    r.id === receipt.id ? { ...r, ...receipt } : r
  );
  
  receipts = recalculateReceipts(receipts);
  
  // Save updated data
  saveDataToStorage(companyId, receipts);
  
  return Promise.resolve(receipts);
};

export const deleteDeliveryReceipt = (id: string, companyId: string = 'default'): Promise<DeliveryReceipt[]> => {
  // Load current data
  let receipts = loadDataFromStorage(companyId);
  
  receipts = receipts.filter(r => r.id !== id);
  receipts = recalculateReceipts(receipts);
  
  // Save updated data
  saveDataToStorage(companyId, receipts);
  
  return Promise.resolve(receipts);
};

// Function to get delivery receipt history for a specific month
export const getMonthlyHistory = (year: number, month: number, companyId: string = 'default'): Promise<DeliveryReceipt[]> => {
  // Format month to have leading zero if needed (1 -> "01")
  const monthStr = month.toString().padStart(2, '0');
  const yearStr = year.toString();
  
  // Load current data
  const receipts = loadDataFromStorage(companyId);
  
  // Filter receipts that belong to the specified month
  const filteredReceipts = receipts.filter(receipt => {
    if (!receipt.date) return false;
    
    // Check for both formats: "2025-01-16" and "2025"
    return receipt.date.startsWith(`${yearStr}-${monthStr}`) || 
           receipt.date === yearStr;
  });
  
  return Promise.resolve(filteredReceipts);
};

export const getMonthlyTotal = (year: number, month: number, companyId: string = 'default'): Promise<number> => {
  return getMonthlyHistory(year, month, companyId).then(receipts => {
    if (receipts.length === 0) return 0;
    // Return the total of the last receipt in the month
    return receipts[receipts.length - 1].total;
  });
};

// Initialize default company with the example data
// This will only happen once, and only for the default company
try {
  const defaultCompanyId = localStorage.getItem('default_company_id');
  if (defaultCompanyId) {
    initializeDefaultCompany(defaultCompanyId);
  }
} catch (error) {
  console.error('Error initializing default company:', error);
}
