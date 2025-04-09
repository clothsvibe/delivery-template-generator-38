
import { v4 as uuidv4 } from 'uuid';
import { DeliveryReceipt } from '@/types/deliveryReceipt';

export const generateSampleData = (count: number = 15): DeliveryReceipt[] => {
  const currentDate = new Date();
  const sampleData: DeliveryReceipt[] = [];
  
  for (let i = 0; i < count; i++) {
    // Create date going back from today, oldest first
    const date = new Date(currentDate);
    date.setDate(date.getDate() - (count - i));
    
    // Format date as DD/MM/YYYY
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    
    // Generate random values
    const nb = `BL${(1000 + i).toString()}`;
    const montantBL = Math.round(Math.random() * 10000) / 100;
    const avance = Math.random() > 0.5 ? Math.round((montantBL * Math.random()) * 100) / 100 : 0;
    
    sampleData.push({
      id: uuidv4(),
      date: formattedDate,
      nb,
      montantBL,
      avance,
      total: montantBL - avance,
      isEditing: false
    });
  }
  
  return sampleData;
};

export const addSampleDataToTable = async (companyId: string) => {
  try {
    // Import here to avoid circular dependencies
    const { addDeliveryReceipt } = await import('@/services/deliveryReceiptService');
    const { addHistoryEntry } = await import('@/services/historyService');
    
    const sampleData = generateSampleData(15);
    let updatedData = [];
    
    // Add each sample receipt
    for (const receipt of sampleData) {
      const { id, total, isEditing, ...receiptData } = receipt;
      updatedData = await addDeliveryReceipt(receiptData, companyId);
      
      // Add to history
      const newReceipt = updatedData[updatedData.length - 1];
      await addHistoryEntry('add', newReceipt.id, newReceipt, companyId);
    }
    
    return updatedData;
  } catch (error) {
    console.error('Error adding sample data:', error);
    throw error;
  }
};
