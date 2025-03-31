
import { supabase } from "@/integrations/supabase/client";
import { DeliveryReceipt } from "../types/deliveryReceipt";
import { recalculateReceipts } from "../lib/formatters";

// Get all delivery receipts for a specific company
export const getDeliveryReceipts = async (companyId: string = 'default'): Promise<DeliveryReceipt[]> => {
  console.log('Fetching delivery receipts for company:', companyId);
  try {
    const { data, error } = await supabase
      .from('delivery_receipts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error in getDeliveryReceipts:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} delivery receipts`);
    
    // Transform database records to DeliveryReceipt format
    const receipts = (data || []).map(record => ({
      id: record.id,
      date: record.date || '',
      nb: record.nb,
      montantBL: record.montantbl,
      avance: record.avance,
      total: record.total,
      companyId: record.company_id
    }));
    
    return receipts;
  } catch (error) {
    console.error("Error loading delivery receipts from database:", error);
    throw error;
  }
};

export const addDeliveryReceipt = async (receipt: Omit<DeliveryReceipt, "id" | "total">, companyId: string = 'default'): Promise<DeliveryReceipt[]> => {
  console.log('Adding new delivery receipt:', receipt, 'for company:', companyId);
  
  try {
    // Get current receipts to calculate the new total
    const currentReceipts = await getDeliveryReceipts(companyId);
    
    // Calculate the new total
    const lastTotal = currentReceipts.length > 0 ? currentReceipts[0].total : 0;
    let newTotal = lastTotal;
    
    if (receipt.montantBL) {
      newTotal += receipt.montantBL;
    }
    
    // Format the data for insertion
    const insertData = {
      company_id: companyId,
      date: receipt.date,
      nb: receipt.nb,
      montantbl: receipt.montantBL,
      avance: receipt.avance,
      total: newTotal
    };
    
    console.log('Inserting record with data:', insertData);
    
    // Insert the new receipt
    const { data: newReceipt, error } = await supabase
      .from('delivery_receipts')
      .insert(insertData)
      .select();
      
    if (error) {
      console.error('Error in addDeliveryReceipt:', error);
      throw error;
    }
    
    if (!newReceipt || newReceipt.length === 0) {
      throw new Error('No receipt returned after insertion');
    }
    
    console.log('Successfully added receipt, response:', newReceipt);
    
    // Get updated receipts
    return await getDeliveryReceipts(companyId);
  } catch (error) {
    console.error("Error adding delivery receipt to database:", error);
    throw error;
  }
};

export const updateDeliveryReceipt = async (receipt: Partial<DeliveryReceipt> & { id: string }, companyId: string = 'default'): Promise<DeliveryReceipt[]> => {
  try {
    // Update the receipt
    const { error } = await supabase
      .from('delivery_receipts')
      .update({
        date: receipt.date,
        nb: receipt.nb,
        montantbl: receipt.montantBL,
        avance: receipt.avance
      })
      .eq('id', receipt.id);
      
    if (error) throw error;
    
    // Get all receipts after the update
    const allReceipts = await getDeliveryReceipts(companyId);
    
    // Recalculate totals
    const recalculatedReceipts = recalculateReceipts(allReceipts);
    
    // Update all receipts with new totals
    await Promise.all(recalculatedReceipts.map(async (r) => {
      await supabase
        .from('delivery_receipts')
        .update({ total: r.total })
        .eq('id', r.id);
    }));
    
    // Get fresh data after recalculation
    return getDeliveryReceipts(companyId);
  } catch (error) {
    console.error("Error updating delivery receipt in database:", error);
    throw error;
  }
};

export const deleteDeliveryReceipt = async (id: string, companyId: string = 'default'): Promise<DeliveryReceipt[]> => {
  try {
    // Delete the receipt
    const { error } = await supabase
      .from('delivery_receipts')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    // Get all receipts after the deletion
    const allReceipts = await getDeliveryReceipts(companyId);
    
    // Recalculate totals
    const recalculatedReceipts = recalculateReceipts(allReceipts);
    
    // Update all receipts with new totals
    await Promise.all(recalculatedReceipts.map(async (r) => {
      await supabase
        .from('delivery_receipts')
        .update({ total: r.total })
        .eq('id', r.id);
    }));
    
    // Get fresh data after recalculation
    return getDeliveryReceipts(companyId);
  } catch (error) {
    console.error("Error deleting delivery receipt from database:", error);
    throw error;
  }
};

export const getMonthlyHistory = async (year: number, month: number, companyId: string = 'default'): Promise<DeliveryReceipt[]> => {
  try {
    // Format month to have leading zero if needed
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString();
    
    // Query receipts for the specific company and date patterns
    const { data, error } = await supabase
      .from('delivery_receipts')
      .select('*')
      .eq('company_id', companyId)
      .or(`date.ilike.${yearStr}-${monthStr}%,date.eq.${yearStr}`);
      
    if (error) throw error;
    
    // Transform database records to DeliveryReceipt format
    const receipts = data.map(record => ({
      id: record.id,
      date: record.date || '',
      nb: record.nb,
      montantBL: record.montantbl,
      avance: record.avance,
      total: record.total,
      companyId: record.company_id
    }));
    
    return receipts;
  } catch (error) {
    console.error("Error loading monthly history from database:", error);
    throw error;
  }
};

export const getMonthlyTotal = async (year: number, month: number, companyId: string = 'default'): Promise<number> => {
  const receipts = await getMonthlyHistory(year, month, companyId);
  if (receipts.length === 0) return 0;
  // Return the total of the last receipt in the month
  return receipts[receipts.length - 1].total;
};
