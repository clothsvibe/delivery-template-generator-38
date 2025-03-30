
import { supabase } from "@/integrations/supabase/client";
import { HistoryEntry, DeliveryReceipt } from "@/types/deliveryReceipt";

export const getHistoryEntries = async (): Promise<HistoryEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('history_entries')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Transform database records to HistoryEntry format
    const entries: HistoryEntry[] = data.map(record => ({
      date: record.date,
      action: record.action as HistoryEntry['action'],
      receiptId: record.receipt_id,
      details: record.details,
      companyId: record.company_id
    }));
    
    return entries;
  } catch (error) {
    console.error("Error loading history entries from database:", error);
    throw error;
  }
};

export const addHistoryEntry = async (
  action: HistoryEntry['action'],
  receiptId: string,
  details: Partial<DeliveryReceipt>,
  companyId?: string
): Promise<HistoryEntry[]> => {
  try {
    // Insert new history entry
    const { error } = await supabase
      .from('history_entries')
      .insert({
        date: new Date().toISOString(),
        action,
        receipt_id: receiptId,
        company_id: companyId,
        details
      });
      
    if (error) throw error;
    
    // Get updated history entries
    return getHistoryEntries();
  } catch (error) {
    console.error("Error adding history entry to database:", error);
    throw error;
  }
};

export const updateHistoryEntry = async (
  receiptId: string,
  updatedDetails: Partial<DeliveryReceipt>
): Promise<HistoryEntry[]> => {
  try {
    // Find the history entry to update
    const { data: entriesData, error: findError } = await supabase
      .from('history_entries')
      .select('*')
      .eq('receipt_id', receiptId);
      
    if (findError) throw findError;
    
    if (entriesData && entriesData.length > 0) {
      // Update all entries with this receipt ID
      await Promise.all(entriesData.map(async (entry) => {
        await supabase
          .from('history_entries')
          .update({
            details: { ...entry.details, ...updatedDetails }
          })
          .eq('id', entry.id);
      }));
    }
    
    // Get updated history entries
    return getHistoryEntries();
  } catch (error) {
    console.error("Error updating history entry in database:", error);
    throw error;
  }
};

export const restoreFromHistory = async (
  receiptId: string
): Promise<{ success: boolean, data?: Partial<DeliveryReceipt> }> => {
  try {
    // Find the history entry to restore
    const { data, error } = await supabase
      .from('history_entries')
      .select('*')
      .eq('receipt_id', receiptId)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      return {
        success: true,
        data: data[0].details
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error("Error restoring from history in database:", error);
    throw error;
  }
};

export const deleteHistoryEntries = async (
  receiptIds: string[]
): Promise<HistoryEntry[]> => {
  try {
    // Delete history entries
    const { error } = await supabase
      .from('history_entries')
      .delete()
      .in('receipt_id', receiptIds);
      
    if (error) throw error;
    
    // Get updated history entries
    return getHistoryEntries();
  } catch (error) {
    console.error("Error deleting history entries from database:", error);
    throw error;
  }
};

export const clearHistory = async (): Promise<HistoryEntry[]> => {
  try {
    // Delete all history entries
    const { error } = await supabase
      .from('history_entries')
      .delete()
      .neq('id', 'none'); // Delete all rows
      
    if (error) throw error;
    
    // Return empty array
    return [];
  } catch (error) {
    console.error("Error clearing history in database:", error);
    throw error;
  }
};
