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
    
    // Format and sort data by date (oldest first)
    const formattedData = data.map(receipt => ({
      id: receipt.id,
      date: receipt.date,
      nb: receipt.nb,
      montantBL: receipt.montantbl || 0, // Handle null values
      avance: receipt.avance || 0, // Handle null values
      total: receipt.total || 0, // Handle null values
      companyId: receipt.company_id
    }));
    
    // Sort by date ascending (oldest first)
    return formattedData.sort((a, b) => {
      const dateA = formatDateForSorting(a.date);
      const dateB = formatDateForSorting(b.date);
      return dateA.localeCompare(dateB);
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
    
    // Sort by date ascending (oldest first)
    return filteredData.sort((a, b) => {
      const dateA = formatDateForSorting(a.date);
      const dateB = formatDateForSorting(b.date);
      return dateA.localeCompare(dateB);
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
    
    // Get existing receipts to calculate running total
    const existingReceipts = await getDeliveryReceipts(companyId);
    
    // Calculate cumulative total from all previous receipts plus this new one
    const montantBL = Number(receipt.montantBL) || 0;
    const avance = Number(receipt.avance) || 0;
    
    // Calculate current receipt's individual contribution to the total
    const receiptContribution = montantBL - avance;
    
    // Calculate new total based on existing data
    const previousTotal = existingReceipts.length > 0 
      ? existingReceipts[existingReceipts.length - 1].total || 0 
      : 0;
    
    const total = previousTotal + receiptContribution;
    
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
    
    // Get current receipt values if needed for total calculation
    let currentMontantBL = 0;
    let currentAvance = 0;
    let newMontantBL = 0;
    let newAvance = 0;
    
    const { data: currentReceipt } = await supabase
      .from('delivery_receipts')
      .select('montantbl, avance')
      .eq('id', receipt.id)
      .single();
      
    if (currentReceipt) {
      currentMontantBL = currentReceipt.montantbl || 0;
      currentAvance = currentReceipt.avance || 0;
      
      newMontantBL = receipt.montantBL !== undefined ? receipt.montantBL : currentMontantBL;
      newAvance = receipt.avance !== undefined ? receipt.avance : currentAvance;
      
      // Calculate the change in values
      const montantBLDiff = newMontantBL - currentMontantBL;
      const avanceDiff = newAvance - currentAvance;
      
      // Calculate the net change to total
      const totalDiff = montantBLDiff - avanceDiff;
      
      // First update the fields
      const { error } = await supabase
        .from('delivery_receipts')
        .update(updateData)
        .eq('id', receipt.id);
        
      if (error) {
        console.error("Update error:", error);
        throw error;
      }
      
      // Then update the total separately - either by direct calculation or by another query
      // Get the current total first
      const { data: currentTotalData } = await supabase
        .from('delivery_receipts')
        .select('total')
        .eq('id', receipt.id)
        .single();
        
      if (currentTotalData) {
        const currentTotal = currentTotalData.total || 0;
        const newTotal = currentTotal + totalDiff;
        
        // Now update the total
        await supabase
          .from('delivery_receipts')
          .update({ total: newTotal })
          .eq('id', receipt.id);
      }
      
      // We need to recalculate totals for all subsequent receipts
      await recalculateSubsequentTotals(receipt.id, totalDiff, companyId);
    } else {
      // If we couldn't get the current receipt, fall back to simple update
      updateData.total = Number(newMontantBL) - Number(newAvance);
      
      const { error } = await supabase
        .from('delivery_receipts')
        .update(updateData)
        .eq('id', receipt.id);
        
      if (error) throw error;
    }
    
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
    // Get the receipt to be deleted
    const { data: receiptToDelete } = await supabase
      .from('delivery_receipts')
      .select('montantbl, avance, date')
      .eq('id', id)
      .single();
    
    if (receiptToDelete) {
      // Calculate the impact on totals
      const montantBL = receiptToDelete.montantbl || 0;
      const avance = receiptToDelete.avance || 0;
      const totalDiff = -(montantBL - avance); // Negative because we're removing this amount
      
      // Delete the receipt
      const { error } = await supabase
        .from('delivery_receipts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Recalculate totals for all receipts after the deleted one
      await recalculateSubsequentTotals(id, totalDiff, companyId);
    } else {
      // Just delete if we couldn't get the receipt
      const { error } = await supabase
        .from('delivery_receipts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    }
    
    // Fetch updated data
    return getDeliveryReceipts(companyId);
    
  } catch (error) {
    console.error("Error deleting delivery receipt from database:", error);
    throw error;
  }
};

// Helper function to recalculate totals for receipts after a specific date
const recalculateSubsequentTotals = async (
  receiptId: string, 
  totalDiff: number,
  companyId: string
): Promise<void> => {
  try {
    // Get the date of the modified receipt
    const { data: receipt } = await supabase
      .from('delivery_receipts')
      .select('date')
      .eq('id', receiptId)
      .single();
    
    if (!receipt || !receipt.date) return;
    
    // Get all receipts after this date
    const { data: subsequentReceipts } = await supabase
      .from('delivery_receipts')
      .select('id, date, montantbl, avance, total')
      .eq('company_id', companyId)
      .gt('date', receipt.date)
      .order('date', { ascending: true });
    
    if (!subsequentReceipts || subsequentReceipts.length === 0) return;
    
    // Update each subsequent receipt's total
    for (const subReceipt of subsequentReceipts) {
      await supabase
        .from('delivery_receipts')
        .update({ total: (subReceipt.total || 0) + totalDiff })
        .eq('id', subReceipt.id);
    }
  } catch (error) {
    console.error("Error recalculating subsequent totals:", error);
  }
};
