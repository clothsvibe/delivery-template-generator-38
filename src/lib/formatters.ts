import { DeliveryReceipt } from "../types/deliveryReceipt";

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// For NB values, format without commas
export const formatNB = (nb: number | null | undefined): string => {
  if (nb === null || nb === undefined) return '';
  return nb.toString();
};

// New formatter for PDF to use spaces instead of slashes for currency values
export const formatCurrencyForPDF = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  
  // Format with spaces instead of slashes
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(value).replace(/\s/g, ' ').replace(/,/g, '.');
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

// Export utilities
export const exportToExcel = (data: DeliveryReceipt[], companyName: string): void => {
  import('xlsx').then(XLSX => {
    // Prepare data for export
    const workbookData = data.map(item => ({
      Date: item.date ? formatDate(item.date) : '',
      NB: item.nb !== null ? formatNB(item.nb) : '',
      'Montant BL': formatCurrency(item.montantBL),
      Avance: formatCurrency(item.avance),
      Total: formatCurrency(item.total)
    }));

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(workbookData);
    
    // Add company name as header
    XLSX.utils.sheet_add_aoa(worksheet, [[`Company: ${companyName}`]], { origin: "A1" });
    
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Delivery Receipts');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${companyName || 'Delivery'}_Receipts.xlsx`);
  }).catch(error => {
    console.error('Error exporting to Excel:', error);
  });
};

export const exportToPDF = (data: DeliveryReceipt[], companyName: string): void => {
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(({ default: autoTable }) => {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add company name as title
      doc.setFontSize(18);
      doc.text(`${companyName || 'Company'} - Delivery Receipts`, 14, 22);
      
      // Prepare table data with the new formatter for currency values
      const tableData = data.map(item => [
        item.date ? formatDate(item.date) : '', // Keep date format unchanged
        item.nb !== null ? formatNB(item.nb) : '', // Use new formatter for NB values
        formatCurrencyForPDF(item.montantBL),
        formatCurrencyForPDF(item.avance),
        formatCurrencyForPDF(item.total)
      ]);
      
      // Generate table
      autoTable(doc, {
        head: [['Date', 'NB', 'Montant BL', 'Avance', 'Total']],
        body: tableData,
        startY: 30,
      });
      
      // Save PDF
      doc.save(`${companyName || 'Delivery'}_Receipts.pdf`);
    }).catch(error => {
      console.error('Error importing jspdf-autotable:', error);
    });
  }).catch(error => {
    console.error('Error importing jsPDF:', error);
  });
};
