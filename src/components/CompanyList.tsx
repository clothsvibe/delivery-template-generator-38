
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanySettings } from '@/types/deliveryReceipt';
import { deleteCompany } from '@/services/companyService';
import { useToast } from '@/components/ui/use-toast';
import { Settings, Eye, Trash2, AlertTriangle, Edit } from 'lucide-react';
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

interface CompanyListProps {
  companies: CompanySettings[];
  onCompanyDeleted: () => void;
  onEditCompany: (company: CompanySettings) => void;
}

const CompanyList: React.FC<CompanyListProps> = ({ companies, onCompanyDeleted, onEditCompany }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDeleteCompany = async (companyId: string) => {
    try {
      const success = await deleteCompany(companyId);
      if (success) {
        toast({
          title: "Company deleted",
          description: "The company has been successfully deleted.",
        });
        onCompanyDeleted();
      } else {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: "Failed to delete the company. Please try again.",
        });
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "An error occurred while deleting the company.",
      });
    }
    setDeletingId(null);
  };

  if (companies.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-500">No companies found. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {companies.map((company) => (
        <Card key={company.id} className="overflow-hidden border border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg font-medium">{company.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-center h-48 bg-gray-100">
              {company.logo ? (
                <img 
                  src={company.logo} 
                  alt={`${company.name} logo`}
                  className="max-h-full max-w-full object-contain p-4"
                />
              ) : (
                <div className="text-gray-400 font-medium">No Logo</div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between p-4 bg-white">
            <div className="flex gap-2">
              <Link to={`/bondelivraison/${company.id}`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Eye size={16} />
                  View
                </Button>
              </Link>
              <Link to={`/admin/${company.id}`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings size={16} />
                  Admin
                </Button>
              </Link>
              {user?.isAdmin && (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => onEditCompany(company)}
                >
                  <Edit size={16} />
                  Edit
                </Button>
              )}
            </div>
            
            {user?.isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="flex items-center gap-2"
                    disabled={!!deletingId}
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Delete Company
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{company.name}"? This action cannot be undone and will permanently remove all delivery receipts associated with this company.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDeleteCompany(company.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default CompanyList;
