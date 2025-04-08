
import { supabase } from "@/integrations/supabase/client";
import { DeliveryReceipt } from "../types/deliveryReceipt";
import { recalculateReceipts } from "@/lib/formatters";

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
      nb: receipt.nb, // Keep as is - now text type
      montantBL: receipt.montantbl || 0, // Handle null values
      avance: receipt.avance || 0, // Handle null values
      total: receipt.total || 0, // Handle null values
      companyId: receipt.company_id
    }));
    
    // Sort by date ascending (oldest first)
    return formattedData.sort((a, b) => {
      const dateA = formatDateForSorting(a.date);
      const dateB = formatDateForSorting(b.date);
      return dateA.localeCompare(dateB); // Oldest first
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
      nb: receipt.nb, // Now text type
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
    
    // Sort by date descending (newest first)
    return filteredData.sort((a, b) => {
      const dateA = formatDateForSorting(a.date);
      const dateB = formatDateForSorting(b.date);
      return dateB.localeCompare(dateA); // Changed to sort newest first
    });
    
  } catch (error) {
    console.error("Error loading monthly history from database:", error);
    throw error;
  }
};

// Add a new delivery receipt with improved total calculation
export const addDeliveryReceipt = async (
  receipt: Omit<DeliveryReceipt, "id" | "total">, 
  companyId: string
): Promise<DeliveryReceipt[]> => {
  try {
    console.log("Adding receipt with data:", receipt, "for company:", companyId);
    
    // Format date to consistent DD/MM/YYYY format if it's in YYYY-MM-DD format
    let formattedDate = receipt.date;
    if (formattedDate && formattedDate.includes('-') && !formattedDate.includes('/')) {
      const [year, month, day] = formattedDate.split('-');
      formattedDate = `${day}/${month}/${year}`;
    }
    
    // Get existing receipts to calculate running total
    const existingReceipts = await getDeliveryReceipts(companyId);
    
    // Calculate the individual contribution of this receipt
    const montantBL = Number(receipt.montantBL) || 0;
    const avance = Number(receipt.avance) || 0;
    const receiptContribution = montantBL - avance;
    
    // Get the previous total
    // Since getDeliveryReceipts returns newest first, we need to check the last element for the oldest
    const previousTotal = existingReceipts.length > 0 ? existingReceipts[existingReceipts.length - 1].total || 0 : 0;
    
    // Calculate new total based on previous total plus this receipt's contribution
    const total = previousTotal + receiptContribution;
    
    // Insert into database - use type assertion to handle the mismatch
    const { error } = await supabase
      .from('delivery_receipts')
      .insert({
        date: formattedDate, 
        nb: receipt.nb, // Now accepting text values
        montantbl: receipt.montantBL,
        avance: receipt.avance,
        total: total,
        company_id: companyId
      } as any); // Use type assertion to bypass TypeScript type checking
      
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

// Update an existing delivery receipt and recalculate all totals
export const updateDeliveryReceipt = async (
  receipt: Partial<DeliveryReceipt> & { id: string }, 
  companyId: string
): Promise<DeliveryReceipt[]> => {
  try {
    const updateData: any = {};
    
    // Format date to consistent DD/MM/YYYY format if it's in YYYY-MM-DD format
    if (receipt.date !== undefined) {
      if (receipt.date.includes('-') && !receipt.date.includes('/')) {
        const [year, month, day] = receipt.date.split('-');
        updateData.date = `${day}/${month}/${year}`;
      } else {
        updateData.date = receipt.date;
      }
    }
    
    if (receipt.nb !== undefined) updateData.nb = receipt.nb;
    if (receipt.montantBL !== undefined) updateData.montantbl = receipt.montantBL; // Lowercase column name in DB
    if (receipt.avance !== undefined) updateData.avance = receipt.avance;
    
    // First update the fields without updating the total
    const { error } = await supabase
      .from('delivery_receipts')
      .update(updateData)
      .eq('id', receipt.id);
      
    if (error) {
      console.error("Update error:", error);
      throw error;
    }
    
    // Fetch all receipts for this company
    const { data: allReceipts } = await supabase
      .from('delivery_receipts')
      .select('*')
      .eq('company_id', companyId)
      .order('date', { ascending: true }); // Important: order by date
    
    if (!allReceipts) {
      throw new Error("Failed to fetch receipts for recalculation");
    }
    
    // Map to our format
    const receiptsFormatted = allReceipts.map(r => ({
      id: r.id,
      date: r.date,
      nb: r.nb,
      montantBL: r.montantbl,
      avance: r.avance,
      total: 0, // We'll recalculate this
      companyId: r.company_id
    }));
    
    // Recalculate all totals with running sum
    let runningTotal = 0;
    for (const r of receiptsFormatted) {
      // Calculate individual contribution
      const contribution = (r.montantBL || 0) - (r.avance || 0);
      runningTotal += contribution;
      
      // Update the total in database
      await supabase
        .from('delivery_receipts')
        .update({ total: runningTotal })
        .eq('id', r.id);
    }
    
    // Fetch the updated data
    return getDeliveryReceipts(companyId);
    
  } catch (error) {
    console.error("Error updating delivery receipt in database:", error);
    throw error;
  }
};

// Delete a delivery receipt and recalculate all remaining totals
export const deleteDeliveryReceipt = async (id: string, companyId: string): Promise<DeliveryReceipt[]> => {
  try {
    // Delete the receipt
    const { error } = await supabase
      .from('delivery_receipts')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    // Fetch all remaining receipts
    const { data: allReceipts } = await supabase
      .from('delivery_receipts')
      .select('*')
      .eq('company_id', companyId)
      .order('date', { ascending: true });
    
    if (!allReceipts) {
      return getDeliveryReceipts(companyId);
    }
    
    // Map to our format
    const receiptsFormatted = allReceipts.map(r => ({
      id: r.id,
      date: r.date,
      nb: r.nb,
      montantBL: r.montantbl,
      avance: r.avance,
      total: 0, // We'll recalculate this
      companyId: r.company_id
    }));
    
    // Recalculate all totals with running sum
    let runningTotal = 0;
    for (const r of receiptsFormatted) {
      // Calculate individual contribution
      const contribution = (r.montantBL || 0) - (r.avance || 0);
      runningTotal += contribution;
      
      // Update the total in database
      await supabase
        .from('delivery_receipts')
        .update({ total: runningTotal })
        .eq('id', r.id);
    }
    
    // Fetch the updated data
    return getDeliveryReceipts(companyId);
    
  } catch (error) {
    console.error("Error deleting delivery receipt from database:", error);
    throw error;
  }
};
