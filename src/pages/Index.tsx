
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanySettings } from '@/types/deliveryReceipt';
import { getAllCompanies, deleteCompany } from '@/services/companyService';
import { useToast } from '@/components/ui/use-toast';
import { Settings, Eye, Trash2, AlertTriangle, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';
import CompanyList from '@/components/CompanyList';
import CompanyForm from '@/components/CompanyForm';

const Index = () => {
  const [companies, setCompanies] = useState<CompanySettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editCompany, setEditCompany] = useState<CompanySettings | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const companiesData = await getAllCompanies();
      setCompanies(companiesData);
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

  const handleAddCompany = () => {
    setEditCompany(null);
    setShowAddForm(true);
  };

  const handleEditCompany = (company: CompanySettings) => {
    setEditCompany(company);
    setShowAddForm(true);
  };

  const handleCompanyDeleted = () => {
    fetchCompanies();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Bon de Livraison - Companies</h1>
          {user?.isAdmin && (
            <Button onClick={handleAddCompany} className="flex items-center gap-2">
              <Plus size={16} />
              Add New Company
            </Button>
          )}
        </div>

        {showAddForm ? (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <CompanyForm
              onFormSubmit={() => {
                setShowAddForm(false);
                fetchCompanies();
              }}
              onCancel={() => setShowAddForm(false)}
              initialData={editCompany || undefined}
            />
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-lg text-gray-500">Loading companies...</p>
              </div>
            ) : (
              <CompanyList 
                companies={companies} 
                onCompanyDeleted={handleCompanyDeleted} 
                onEditCompany={handleEditCompany} 
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
