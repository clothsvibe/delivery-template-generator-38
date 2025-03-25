
import { CompanySettings } from "../types/deliveryReceipt";
import { v4 as uuidv4 } from 'uuid';

// Local storage key
const COMPANY_SETTINGS_KEY = "delivery_company_settings";

// Initialize companies from localStorage if available
let companies: CompanySettings[] = [];
try {
  const storedSettings = localStorage.getItem(COMPANY_SETTINGS_KEY);
  if (storedSettings) {
    companies = JSON.parse(storedSettings);
  } else {
    // Create default company if none exists
    const defaultCompanyId = uuidv4();
    const defaultCompany: CompanySettings = {
      id: defaultCompanyId,
      name: "Bon de Livraison",
      logo: "/placeholder.svg",
      rowColors: {
        even: "#ffffff",
        odd: "#f3f4f6",
        header: "#f8fafc"
      }
    };
    companies = [defaultCompany];
    localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(companies));
    
    // Store the default company ID separately for initialization purposes
    localStorage.setItem('default_company_id', defaultCompanyId);
  }
} catch (error) {
  console.error("Error loading company settings from localStorage:", error);
}

export const getCompanySettings = async (companyId?: string): Promise<CompanySettings | null> => {
  // Reload from localStorage each time to ensure up-to-date data
  try {
    const storedSettings = localStorage.getItem(COMPANY_SETTINGS_KEY);
    if (storedSettings) {
      companies = JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error("Error reloading company settings:", error);
  }

  if (companyId) {
    const company = companies.find(c => c.id === companyId);
    return company || null;
  }
  
  // Return the first company by default
  return companies.length > 0 ? companies[0] : null;
};

export const getAllCompanies = async (): Promise<CompanySettings[]> => {
  // Reload from localStorage to ensure up-to-date data
  try {
    const storedSettings = localStorage.getItem(COMPANY_SETTINGS_KEY);
    if (storedSettings) {
      companies = JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error("Error reloading company settings:", error);
  }
  
  return companies;
};

export const addCompany = async (company: Omit<CompanySettings, "id">): Promise<CompanySettings> => {
  const newCompanyId = uuidv4();
  const newCompany: CompanySettings = {
    ...company,
    id: newCompanyId
  };
  
  // Make sure we have the latest data
  try {
    const storedSettings = localStorage.getItem(COMPANY_SETTINGS_KEY);
    if (storedSettings) {
      companies = JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error("Error reloading company settings:", error);
  }

  companies.push(newCompany);
  
  // Save to localStorage
  try {
    localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(companies));
  } catch (error) {
    console.error("Error saving company settings to localStorage:", error);
    throw error;
  }
  
  return newCompany;
};

export const updateCompanySettings = async (settings: Partial<CompanySettings> & { id: string }): Promise<CompanySettings | null> => {
  // Make sure we have the latest data
  try {
    const storedSettings = localStorage.getItem(COMPANY_SETTINGS_KEY);
    if (storedSettings) {
      companies = JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error("Error reloading company settings:", error);
  }
  
  const index = companies.findIndex(c => c.id === settings.id);
  
  if (index === -1) {
    return null;
  }
  
  companies[index] = {
    ...companies[index],
    ...settings
  };
  
  // Save to localStorage
  try {
    localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(companies));
  } catch (error) {
    console.error("Error saving company settings to localStorage:", error);
    throw error;
  }
  
  return companies[index];
};

export const deleteCompany = async (companyId: string): Promise<boolean> => {
  // Make sure we have the latest data
  try {
    const storedSettings = localStorage.getItem(COMPANY_SETTINGS_KEY);
    if (storedSettings) {
      companies = JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error("Error reloading company settings:", error);
  }
  
  const initialLength = companies.length;
  companies = companies.filter(c => c.id !== companyId);
  
  if (companies.length === initialLength) {
    return false;
  }
  
  // Save to localStorage
  try {
    localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(companies));
  } catch (error) {
    console.error("Error saving company settings to localStorage:", error);
    throw error;
  }
  
  return true;
};
