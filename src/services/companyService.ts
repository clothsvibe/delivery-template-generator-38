
import { supabase } from "@/integrations/supabase/client";
import { CompanySettings } from "../types/deliveryReceipt";
import { v4 as uuidv4 } from 'uuid';

// Get all companies
export const getAllCompanies = async (): Promise<CompanySettings[]> => {
  try {
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('*');
      
    if (companiesError) throw companiesError;

    // Load color settings for each company
    const companies = await Promise.all(
      companiesData.map(async (company) => {
        // Get column colors
        const { data: columnColors, error: columnError } = await supabase
          .from('column_colors')
          .select('*')
          .eq('company_id', company.id)
          .single();
          
        // Get row colors
        const { data: rowColors, error: rowError } = await supabase
          .from('row_colors')
          .select('*')
          .eq('company_id', company.id)
          .single();

        return {
          id: company.id,
          name: company.name,
          logo: company.logo,
          colorTheme: company.color_theme,
          columnColors: columnColors ? {
            date: columnColors.date,
            nb: columnColors.nb,
            montantBL: columnColors.montantbl, // Map from DB column name to interface property name
            avance: columnColors.avance,
            total: columnColors.total
          } : undefined,
          rowColors: rowColors || {
            even: '#ffffff',
            odd: '#f3f4f6',
            header: '#f8fafc'
          }
        };
      })
    );

    return companies;
    
  } catch (error) {
    console.error("Error loading companies from database:", error);
    throw error;
  }
};

export const getCompanySettings = async (companyId?: string): Promise<CompanySettings | null> => {
  try {
    if (companyId) {
      // Get specific company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (companyError) throw companyError;
      if (!company) return null;
      
      // Get column colors
      const { data: columnColors } = await supabase
        .from('column_colors')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      // Get row colors
      const { data: rowColors } = await supabase
        .from('row_colors')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      return {
        id: company.id,
        name: company.name,
        logo: company.logo,
        colorTheme: company.color_theme,
        columnColors: columnColors ? {
          date: columnColors.date,
          nb: columnColors.nb,
          montantBL: columnColors.montantbl, // Map from DB column name to interface property name
          avance: columnColors.avance,
          total: columnColors.total
        } : undefined,
        rowColors: rowColors || {
          even: '#ffffff',
          odd: '#f3f4f6',
          header: '#f8fafc'
        }
      };
    } else {
      // Get the first company as default
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(1);
        
      if (companiesError) throw companiesError;
      if (!companies || companies.length === 0) return null;
      
      const company = companies[0];
      
      // Get column colors
      const { data: columnColors } = await supabase
        .from('column_colors')
        .select('*')
        .eq('company_id', company.id)
        .single();
      
      // Get row colors
      const { data: rowColors } = await supabase
        .from('row_colors')
        .select('*')
        .eq('company_id', company.id)
        .single();
      
      return {
        id: company.id,
        name: company.name,
        logo: company.logo,
        colorTheme: company.color_theme,
        columnColors: columnColors ? {
          date: columnColors.date,
          nb: columnColors.nb,
          montantBL: columnColors.montantbl, // Map from DB column name to interface property name
          avance: columnColors.avance,
          total: columnColors.total
        } : undefined,
        rowColors: rowColors || {
          even: '#ffffff',
          odd: '#f3f4f6',
          header: '#f8fafc'
        }
      };
    }
  } catch (error) {
    console.error("Error loading company settings from database:", error);
    throw error;
  }
};

export const addCompany = async (company: Omit<CompanySettings, "id">): Promise<CompanySettings> => {
  try {
    // Insert into companies table
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: company.name,
        logo: company.logo,
        color_theme: company.colorTheme
      })
      .select()
      .single();
      
    if (companyError) throw companyError;
    
    // Insert column colors
    if (company.columnColors) {
      const { error: columnError } = await supabase
        .from('column_colors')
        .insert({
          company_id: newCompany.id,
          date: company.columnColors.date || '#182fe2',
          nb: company.columnColors.nb || '#182fe2',
          montantBL: company.columnColors.montantBL || '#0ea5e9',
          avance: company.columnColors.avance || '#f97316',
          total: company.columnColors.total || '#22c55e'
        });
        
      if (columnError) throw columnError;
    }
    
    // Insert row colors
    if (company.rowColors) {
      const { error: rowError } = await supabase
        .from('row_colors')
        .insert({
          company_id: newCompany.id,
          even: company.rowColors.even || '#ffffff',
          odd: company.rowColors.odd || '#f3f4f6',
          header: company.rowColors.header || '#f8fafc'
        });
        
      if (rowError) throw rowError;
    } else {
      // Insert default row colors if not provided
      const { error: rowError } = await supabase
        .from('row_colors')
        .insert({
          company_id: newCompany.id,
          even: '#ffffff',
          odd: '#f3f4f6',
          header: '#f8fafc'
        });
        
      if (rowError) throw rowError;
    }
    
    return {
      id: newCompany.id,
      name: newCompany.name,
      logo: newCompany.logo,
      colorTheme: newCompany.color_theme,
      columnColors: company.columnColors,
      rowColors: company.rowColors || {
        even: '#ffffff',
        odd: '#f3f4f6',
        header: '#f8fafc'
      }
    };
  } catch (error) {
    console.error("Error adding company to database:", error);
    throw error;
  }
};

export const updateCompanySettings = async (settings: Partial<CompanySettings> & { id: string }): Promise<CompanySettings | null> => {
  try {
    // Update company table
    const updateData: any = {};
    if (settings.name !== undefined) updateData.name = settings.name;
    if (settings.logo !== undefined) updateData.logo = settings.logo;
    if (settings.colorTheme !== undefined) updateData.color_theme = settings.colorTheme;
    
    if (Object.keys(updateData).length > 0) {
      const { error: companyError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', settings.id);
        
      if (companyError) throw companyError;
    }
    
    // Update column colors if provided
    if (settings.columnColors) {
      // Check if column colors exist
      const { data: existingColumns } = await supabase
        .from('column_colors')
        .select('*')
        .eq('company_id', settings.id);
        
      if (existingColumns && existingColumns.length > 0) {
        // Update existing column colors
        const { error: columnError } = await supabase
          .from('column_colors')
          .update({
            date: settings.columnColors.date || '#182fe2',
            nb: settings.columnColors.nb || '#182fe2',
            montantbl: settings.columnColors.montantBL || '#0ea5e9', // Map from interface property to DB column name
            avance: settings.columnColors.avance || '#f97316',
            total: settings.columnColors.total || '#22c55e'
          })
          .eq('company_id', settings.id);
          
        if (columnError) throw columnError;
      } else {
        // Insert column colors
        const { error: columnError } = await supabase
          .from('column_colors')
          .insert({
            company_id: settings.id,
            date: settings.columnColors.date || '#182fe2',
            nb: settings.columnColors.nb || '#182fe2',
            montantbl: settings.columnColors.montantBL || '#0ea5e9', // Map from interface property to DB column name
            avance: settings.columnColors.avance || '#f97316',
            total: settings.columnColors.total || '#22c55e'
          });
          
        if (columnError) throw columnError;
      }
    }
    
    // Update row colors if provided
    if (settings.rowColors) {
      // Check if row colors exist
      const { data: existingRows } = await supabase
        .from('row_colors')
        .select('*')
        .eq('company_id', settings.id);
        
      if (existingRows && existingRows.length > 0) {
        // Update existing row colors
        const { error: rowError } = await supabase
          .from('row_colors')
          .update({
            even: settings.rowColors.even || '#ffffff',
            odd: settings.rowColors.odd || '#f3f4f6',
            header: settings.rowColors.header || '#f8fafc'
          })
          .eq('company_id', settings.id);
          
        if (rowError) throw rowError;
      } else {
        // Insert row colors
        const { error: rowError } = await supabase
          .from('row_colors')
          .insert({
            company_id: settings.id,
            even: settings.rowColors.even || '#ffffff',
            odd: settings.rowColors.odd || '#f3f4f6',
            header: settings.rowColors.header || '#f8fafc'
          });
          
        if (rowError) throw rowError;
      }
    }
    
    // Get updated company settings
    return getCompanySettings(settings.id);
    
  } catch (error) {
    console.error("Error updating company settings in database:", error);
    throw error;
  }
};

export const deleteCompany = async (companyId: string): Promise<boolean> => {
  try {
    // Delete from companies table (will cascade delete related data)
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error deleting company from database:", error);
    throw error;
  }
};
