
import { DeliveryReceipt } from "../types/deliveryReceipt";
import { v4 as uuidv4 } from "uuid";
import { recalculateReceipts } from "../lib/formatters";

// Initial mock data based on the provided example
const initialData: DeliveryReceipt[] = [
  {
    id: uuidv4(),
    date: "2025",
    nb: null,
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
  }
];

// Generate additional empty rows with the total amount repeated
const generateMockData = (): DeliveryReceipt[] => {
  const data = [...initialData];
  
  // Add 23 more rows with repeated total
  for (let i = 0; i < 23; i++) {
    data.push({
      id: uuidv4(),
      date: "",
      nb: null,
      montantBL: null,
      avance: null,
      total: 8532.00
    });
  }
  
  return recalculateReceipts(data);
};

// In-memory data store
let deliveryReceipts = generateMockData();

export const getDeliveryReceipts = (): Promise<DeliveryReceipt[]> => {
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
  
  return Promise.resolve(deliveryReceipts);
};

export const updateDeliveryReceipt = (receipt: Partial<DeliveryReceipt> & { id: string }): Promise<DeliveryReceipt[]> => {
  deliveryReceipts = deliveryReceipts.map(r => 
    r.id === receipt.id ? { ...r, ...receipt } : r
  );
  
  deliveryReceipts = recalculateReceipts(deliveryReceipts);
  return Promise.resolve(deliveryReceipts);
};

export const deleteDeliveryReceipt = (id: string): Promise<DeliveryReceipt[]> => {
  deliveryReceipts = deliveryReceipts.filter(r => r.id !== id);
  deliveryReceipts = recalculateReceipts(deliveryReceipts);
  return Promise.resolve(deliveryReceipts);
};

export const createMonthlyReceipt = (year: number, month: number): Promise<DeliveryReceipt[]> => {
  // Format the date as YYYY-MM-DD for the first day of the month
  const formattedDate = new Date(year, month, 1).toISOString().split('T')[0];
  
  // Create a new receipt for the month
  const monthlyReceipt: Omit<DeliveryReceipt, "id" | "total"> = {
    date: formattedDate,
    nb: null,
    montantBL: 0, // Start with 0, can be updated later
    avance: null
  };
  
  return addDeliveryReceipt(monthlyReceipt);
};
