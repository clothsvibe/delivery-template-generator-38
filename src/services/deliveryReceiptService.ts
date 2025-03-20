
import { DeliveryReceipt } from "../types/deliveryReceipt";
import { v4 as uuidv4 } from "uuid";

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
  
  return data;
};

// In-memory data store
let deliveryReceipts = generateMockData();

export const getDeliveryReceipts = (): Promise<DeliveryReceipt[]> => {
  return Promise.resolve(deliveryReceipts);
};

export const addDeliveryReceipt = (receipt: Omit<DeliveryReceipt, "id">): Promise<DeliveryReceipt> => {
  const newReceipt = { ...receipt, id: uuidv4() };
  deliveryReceipts = [...deliveryReceipts, newReceipt];
  return Promise.resolve(newReceipt);
};

export const updateDeliveryReceipt = (receipt: DeliveryReceipt): Promise<DeliveryReceipt> => {
  deliveryReceipts = deliveryReceipts.map(r => r.id === receipt.id ? receipt : r);
  return Promise.resolve(receipt);
};

export const deleteDeliveryReceipt = (id: string): Promise<void> => {
  deliveryReceipts = deliveryReceipts.filter(r => r.id !== id);
  return Promise.resolve();
};
