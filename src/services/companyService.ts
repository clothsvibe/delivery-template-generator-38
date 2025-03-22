
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
    const defaultCompany: CompanySettings = {
      id: uuidv4(),
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
  }
} catch (error) {
  console.error("Error loading company settings from localStorage:", error);
}

export const getCompanySettings = async (companyId?: string): Promise<CompanySettings | null> => {
  if (companyId) {
    const company = companies.find(c => c.id === companyId);
    return company || null;
  }
  
  // Return the first company by default
  return companies.length > 0 ? companies[0] : null;
};

export const getAllCompanies = async (): Promise<CompanySettings[]> => {
  return companies;
};

export const addCompany = async (company: Omit<CompanySettings, "id">): Promise<CompanySettings> => {
  const newCompany: CompanySettings = {
    ...company,
    id: uuidv4()
  };
  
  companies.push(newCompany);
  
  // Save to localStorage
  try {
    localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(companies));
  } catch (error) {
    console.error("Error saving company settings to localStorage:", error);
  }
  
  return newCompany;
};

export const updateCompanySettings = async (settings: Partial<CompanySettings> & { id: string }): Promise<CompanySettings | null> => {
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
  }
  
  return companies[index];
};

export const deleteCompany = async (companyId: string): Promise<boolean> => {
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
  }
  
  return true;
};
