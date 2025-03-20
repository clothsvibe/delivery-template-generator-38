
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  try {
    // Check if the date is a year only
    if (/^\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // Otherwise format as DD/MM/YYYY
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

export const parseNumberInput = (value: string): number | null => {
  if (value === '') return null;
  
  // Remove any non-numeric characters except decimal point
  const sanitized = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = parseFloat(sanitized);
  
  return isNaN(parsed) ? null : parsed;
};

export const calculateTotal = (montantBL: number | null, avance: number | null): number => {
  const montant = montantBL || 0;
  const avanceValue = avance || 0;
  return montant - avanceValue;
};

export const recalculateReceipts = (receipts: DeliveryReceipt[]): DeliveryReceipt[] => {
  let runningTotal = 0;
  
  return receipts.map((receipt, index) => {
    // Calculate the individual total for this receipt
    const itemTotal = calculateTotal(receipt.montantBL, receipt.avance);
    
    // Add to running total
    runningTotal += itemTotal;
    
    // For the first item, we don't add previous totals
    const finalTotal = index === 0 ? itemTotal : runningTotal;
    
    return {
      ...receipt,
      total: finalTotal
    };
  });
};
