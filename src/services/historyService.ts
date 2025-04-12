
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
      id: record.id,
      date: record.date,
      action: record.action as HistoryEntry['action'],
      receiptId: record.receipt_id,
      details: record.details as Partial<DeliveryReceipt>, // Cast to expected type
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
        // Make sure entry.details is an object before spreading
        const currentDetails = typeof entry.details === 'object' && entry.details !== null 
          ? entry.details as Partial<DeliveryReceipt> 
          : {};
        
        await supabase
          .from('history_entries')
          .update({
            details: { ...currentDetails, ...updatedDetails }
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

export const restoreFromHistory = async (receiptId: string): Promise<{ success: boolean, data?: any }> => {
  try {
    // Find the history entry
    const { data: historyEntries, error: historyError } = await supabase
      .from('history_entries')
      .select('*')
      .eq('receipt_id', receiptId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (historyError || !historyEntries || historyEntries.length === 0) {
      console.error("Failed to find history entry:", historyError);
      return { success: false };
    }

    const historyEntry = historyEntries[0];
    
    // Check if details exist
    if (!historyEntry.details) {
      return { success: false };
    }

    // Extract company ID
    const companyId = historyEntry.company_id;
    
    // For deleted items, we need to recreate them
    if (historyEntry.action === 'delete') {
      // Safely cast and access properties with type checking
      const details = historyEntry.details as Partial<DeliveryReceipt>;
      const { date, nb, montantBL, avance } = details;
      
      // Check if receipt already exists
      const { data: existingReceipt } = await supabase
        .from('delivery_receipts')
        .select('*')
        .eq('id', receiptId)
        .single();
        
      if (!existingReceipt) {
        // Recreate the receipt - fix type errors by converting types and ensuring proper format
        const { error } = await supabase
          .from('delivery_receipts')
          .insert({
            id: receiptId,
            date: date || '',
            nb: nb !== undefined ? String(nb) : null,
            montantbl: typeof montantBL === 'number' ? montantBL : null,
            avance: typeof avance === 'number' ? avance : null,
            total: (typeof montantBL === 'number' ? montantBL : 0) - (typeof avance === 'number' ? avance : 0),
            company_id: companyId
          });
          
        if (error) {
          console.error("Failed to restore deleted receipt:", error);
          return { success: false };
        }
      }
    } else {
      // For updates or adds, we just need to update the receipt
      // Safely cast and access properties with type checking
      const details = historyEntry.details as Partial<DeliveryReceipt>;
      const { date, nb, montantBL, avance } = details;
      
      // Fix type errors by converting types and ensuring proper format
      const { error } = await supabase
        .from('delivery_receipts')
        .upsert({
          id: receiptId,
          date: date || '',
          nb: nb !== undefined ? String(nb) : null,
          montantbl: typeof montantBL === 'number' ? montantBL : null,
          avance: typeof avance === 'number' ? avance : null,
          total: (typeof montantBL === 'number' ? montantBL : 0) - (typeof avance === 'number' ? avance : 0),
          company_id: companyId
        });
        
      if (error) {
        console.error("Failed to update receipt from history:", error);
        return { success: false };
      }
    }
    
    return { success: true, data: historyEntry.details };
  } catch (error) {
    console.error("Error restoring from history:", error);
    return { success: false };
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
