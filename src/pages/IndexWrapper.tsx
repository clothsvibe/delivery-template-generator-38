
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getAllCompanies, updateCompanySettings } from '@/services/companyService';
import CompanyList from '@/components/CompanyList';
import AuthNavbar from '@/components/AuthNavbar';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CompanyForm from '@/components/CompanyForm';
import { CompanySettings } from '@/types/deliveryReceipt';

const IndexWrapper = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanySettings | null>(null);
  const { toast } = useToast();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load companies. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCompanyAdded = () => {
    setDialogOpen(false);
    fetchCompanies();
    toast({
      title: "Company Added",
      description: "The new company has been successfully added.",
    });
  };

  const handleCompanyUpdated = async () => {
    setDialogOpen(false);
    setEditingCompany(null);
    await fetchCompanies();
    toast({
      title: "Company Updated",
      description: "The company has been successfully updated.",
    });
  };

  const handleCompanyDeleted = () => {
    fetchCompanies();
  };

  const handleEditCompany = (company: CompanySettings) => {
    setEditingCompany(company);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCompany(null);
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <AuthNavbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Companies</h1>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                <DialogDescription>
                  {editingCompany 
                    ? 'Edit company details' 
                    : 'Create a new company to manage delivery receipts'}
                </DialogDescription>
              </DialogHeader>
              <CompanyForm 
                initialData={editingCompany || undefined} 
                onSubmit={editingCompany ? handleCompanyUpdated : handleCompanyAdded}
                onCancel={closeDialog}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <CompanyList 
            companies={companies} 
            onCompanyDeleted={handleCompanyDeleted} 
            onEditCompany={handleEditCompany}
          />
        )}
      </div>
    </div>
  );
};

export default IndexWrapper;
