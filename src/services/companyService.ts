
import { CompanySettings } from "../types/deliveryReceipt";

// Default company name
let companyName = "Bon de Livraison";

// Local storage key
const COMPANY_SETTINGS_KEY = "delivery_company_settings";

// Initialize from localStorage if available
try {
  const storedSettings = localStorage.getItem(COMPANY_SETTINGS_KEY);
  if (storedSettings) {
    const settings = JSON.parse(storedSettings);
    if (settings && settings.name) {
      companyName = settings.name;
    }
  }
} catch (error) {
  console.error("Error loading company settings from localStorage:", error);
}

export const getCompanySettings = (): Promise<CompanySettings> => {
  return Promise.resolve({ name: companyName });
};

export const updateCompanySettings = (settings: CompanySettings): Promise<CompanySettings> => {
  companyName = settings.name;
  
  // Save to localStorage
  try {
    localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving company settings to localStorage:", error);
  }
  
  return Promise.resolve({ name: companyName });
};
