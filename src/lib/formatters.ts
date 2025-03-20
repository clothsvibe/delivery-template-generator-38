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
