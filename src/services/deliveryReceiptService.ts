
import { supabase } from "@/integrations/supabase/client";
import { DeliveryReceipt } from "../types/deliveryReceipt";

// Function to format date string for sorting (DD/MM/YYYY -> YYYY-MM-DD)
const formatDateForSorting = (dateStr: string): string => {
  // Check if date is in DD/MM/YYYY format
  if (dateStr && dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
  return dateStr;
};

// Get all delivery receipts for a company
export const getDeliveryReceipts = async (companyId: string): Promise<DeliveryReceipt[]> => {
  try {
    const { data, error } = await supabase
      .from('delivery_receipts')
      .select('*')
      .eq('company_id', companyId);
      
    if (error) throw error;
    
    // Format and sort data by date (most recent first)
    const formattedData = data.map(receipt => ({
      id: receipt.id,
      date: receipt.date,
      nb: receipt.nb,
      montantBL: receipt.montantbl || 0, // Handle null values
      avance: receipt.avance || 0, // Handle null values
      total: receipt.total || 0, // Handle null values
      companyId: receipt.company_id
    }));
    
    // Sort by date descending (most recent first)
    return formattedData.sort((a, b) => {
      const dateA = formatDateForSorting(a.date);
      const dateB = formatDateForSorting(b.date);
      return dateB.localeCompare(dateA);
    });
    
  } catch (error) {
    console.error("Error loading delivery receipts from database:", error);
    throw error;
  }
};

// Get delivery receipts for a specific month and year
export const getMonthlyHistory = async (year: number, month: number): Promise<DeliveryReceipt[]> => {
  try {
    // If month is 0, we want to get all receipts for the year
    const { data, error } = await supabase
      .from('delivery_receipts')
      .select('*');
      
    if (error) throw error;
    
    // Format data
    const formattedData = data.map(receipt => ({
      id: receipt.id,
      date: receipt.date,
      nb: receipt.nb,
      montantBL: receipt.montantbl || 0,
      avance: receipt.avance || 0,
      total: receipt.total || 0,
      companyId: receipt.company_id
    }));
    
    // Filter by year and month
    const filteredData = formattedData.filter(receipt => {
      if (!receipt.date) return false;
      
      // Parse date (assuming format is DD/MM/YYYY)
      const parts = receipt.date.split('/');
      if (parts.length !== 3) return false;
      
      const receiptYear = parseInt(parts[2]);
      // If only year filtering is requested
      if (month === 0) {
        return receiptYear === year;
      }
      
      // Filter by both year and month
      const receiptMonth = parseInt(parts[1]);
      return receiptYear === year && receiptMonth === month;
    });
    
    // Sort by date descending (most recent first)
    return filteredData.sort((a, b) => {
      const dateA = formatDateForSorting(a.date);
      const dateB = formatDateForSorting(b.date);
      return dateB.localeCompare(dateA);
    });
    
  } catch (error) {
    console.error("Error loading monthly history from database:", error);
    throw error;
  }
};

// Add a new delivery receipt
export const addDeliveryReceipt = async (
  receipt: Omit<DeliveryReceipt, "id" | "total">, 
  companyId: string
): Promise<DeliveryReceipt[]> => {
  try {
    console.log("Adding receipt with data:", receipt, "for company:", companyId);
    
    // Calculate total
    const montantBL = Number(receipt.montantBL) || 0;
    const avance = Number(receipt.avance) || 0;
    const total = montantBL - avance;
    
    // Insert into database
    const { error } = await supabase
      .from('delivery_receipts')
      .insert({
        date: receipt.date,
        nb: receipt.nb,
        montantbl: receipt.montantBL, // Lowercase column name in DB
        avance: receipt.avance,
        total: total,
        company_id: companyId
      });
      
    if (error) {
      console.error("Insert error:", error);
      throw error;
    }
    
    // Fetch updated data
    return getDeliveryReceipts(companyId);
    
  } catch (error) {
    console.error("Error adding delivery receipt to database:", error);
    throw error;
  }
};

// Update an existing delivery receipt
export const updateDeliveryReceipt = async (
  receipt: Partial<DeliveryReceipt> & { id: string }, 
  companyId: string
): Promise<DeliveryReceipt[]> => {
  try {
    const updateData: any = {};
    
    if (receipt.date !== undefined) updateData.date = receipt.date;
    if (receipt.nb !== undefined) updateData.nb = receipt.nb;
    if (receipt.montantBL !== undefined) updateData.montantbl = receipt.montantBL; // Lowercase column name in DB
    if (receipt.avance !== undefined) updateData.avance = receipt.avance;
    
    // Calculate total if needed
    if (receipt.montantBL !== undefined || receipt.avance !== undefined) {
      // Get current values if not provided
      if (receipt.montantBL === undefined || receipt.avance === undefined) {
        const { data: currentReceipt } = await supabase
          .from('delivery_receipts')
          .select('montantbl, avance')
          .eq('id', receipt.id)
          .single();
          
        if (currentReceipt) {
          const montantBL = receipt.montantBL !== undefined ? receipt.montantBL : currentReceipt.montantbl;
          const avance = receipt.avance !== undefined ? receipt.avance : currentReceipt.avance;
          updateData.total = Number(montantBL) - Number(avance);
        }
      } else {
        updateData.total = Number(receipt.montantBL) - Number(receipt.avance);
      }
    }
    
    // Update database
    const { error } = await supabase
      .from('delivery_receipts')
      .update(updateData)
      .eq('id', receipt.id);
      
    if (error) throw error;
    
    // Fetch updated data
    return getDeliveryReceipts(companyId);
    
  } catch (error) {
    console.error("Error updating delivery receipt in database:", error);
    throw error;
  }
};

// Delete a delivery receipt
export const deleteDeliveryReceipt = async (id: string, companyId: string): Promise<DeliveryReceipt[]> => {
  try {
    const { error } = await supabase
      .from('delivery_receipts')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    // Fetch updated data
    return getDeliveryReceipts(companyId);
    
  } catch (error) {
    console.error("Error deleting delivery receipt from database:", error);
    throw error;
  }
};
