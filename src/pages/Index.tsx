
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCompanies } from '@/services/companyService';
import { CompanySettings } from '@/types/deliveryReceipt';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Building, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import CompanyForm from '@/components/CompanyForm';
import { addCompany, updateCompanySettings, deleteCompany } from '@/services/companyService';

const Index = () => {
  const [companies, setCompanies] = useState<CompanySettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanySettings | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const companiesData = await getAllCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load companies. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (companyData: Omit<CompanySettings, "id">) => {
    try {
      const newCompany = await addCompany(companyData);
      setCompanies(prev => [...prev, newCompany]);
      setShowAddForm(false);
      toast({
        title: "Company Added",
        description: "New company has been added successfully."
      });
    } catch (error) {
      console.error('Error adding company:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add company. Please try again.",
      });
    }
  };

  const handleUpdateCompany = async (companyData: Omit<CompanySettings, "id">) => {
    if (!editingCompany) return;
    
    try {
      const updatedCompany = await updateCompanySettings({
        ...companyData,
        id: editingCompany.id
      });
      
      if (updatedCompany) {
        setCompanies(prev => 
          prev.map(company => 
            company.id === editingCompany.id ? updatedCompany : company
          )
        );
        
        setEditingCompany(null);
        toast({
          title: "Company Updated",
          description: "Company has been updated successfully."
        });
      }
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update company. Please try again.",
      });
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (companies.length <= 1) {
      toast({
        variant: "destructive",
        title: "Cannot Delete",
        description: "You must have at least one company."
      });
      return;
    }
    
    try {
      const success = await deleteCompany(companyId);
      if (success) {
        setCompanies(prev => prev.filter(company => company.id !== companyId));
        toast({
          title: "Company Deleted",
          description: "Company has been deleted successfully."
        });
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete company. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mes Entreprises</h1>
          
          <Button 
            onClick={() => {
              setEditingCompany(null);
              setShowAddForm(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Ajouter Entreprise
          </Button>
        </div>
        
        {showAddForm || editingCompany ? (
          <div className="mb-8">
            <CompanyForm 
              initialData={editingCompany || undefined}
              onSubmit={editingCompany ? handleUpdateCompany : handleAddCompany}
              onCancel={() => {
                setShowAddForm(false);
                setEditingCompany(null);
              }}
            />
          </div>
        ) : null}
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={`skeleton-${i}`} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-32 h-32 bg-gray-200 rounded-full" />
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-10 bg-gray-200 rounded w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(company => (
              <Card key={company.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-8 h-8 p-0 rounded-full bg-white/80 text-gray-700"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowAddForm(false);
                          setEditingCompany(company);
                        }}
                      >
                        <Edit size={14} />
                      </Button>
                    </div>
                    
                    <Link to={`/bondelivraison/${company.id}`} className="block">
                      <div className="flex flex-col items-center p-8 space-y-4">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                          {company.logo ? (
                            <img 
                              src={company.logo} 
                              alt={company.name}
                              className="w-full h-full object-contain" 
                            />
                          ) : (
                            <Building size={48} className="text-gray-400" />
                          )}
                        </div>
                        <h2 className="text-xl font-bold text-center">{company.name}</h2>
                        <Button className="w-full">
                          Accéder aux Bons de Livraison
                        </Button>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
