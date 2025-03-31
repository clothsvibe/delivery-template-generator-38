
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { addDeliveryReceipt } from '@/services/deliveryReceiptService';
import { addHistoryEntry } from '@/services/historyService';
import { DeliveryReceipt } from '@/types/deliveryReceipt';
import AddDeliveryForm from '@/components/AddDeliveryForm';
import { useAuth } from '@/contexts/AuthContext';

const AddReceipt = () => {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!companyId) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-6 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-700 mb-6">Aucune entreprise sélectionnée. Impossible d'ajouter un bon de livraison.</p>
          <Link to="/">
            <Button className="w-full">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (formData: Omit<DeliveryReceipt, "id" | "total">) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Adding receipt with data:', { ...formData, companyId });
      
      // Make sure companyId is set in formData
      const dataWithCompanyId = {
        ...formData,
        companyId: companyId
      };
      
      const updatedData = await addDeliveryReceipt(dataWithCompanyId, companyId);
      console.log('Receipt added, response:', updatedData);
      
      if (updatedData && updatedData.length > 0) {
        const newReceipt = updatedData[0]; // The new receipt should be at index 0
        
        try {
          await addHistoryEntry('add', newReceipt.id, newReceipt, companyId);
        } catch (historyError) {
          console.error('Error adding history entry:', historyError);
          // Continue even if history entry fails
        }
        
        toast({
          title: "Succès",
          description: "Nouveau bon de livraison ajouté avec succès.",
        });
        
        // Navigate back to the admin page with the company ID
        navigate(`/admin/${companyId}`);
      } else {
        throw new Error("Aucune donnée retournée après l'ajout");
      }
    } catch (error) {
      console.error('Error adding delivery receipt:', error);
      setError("Échec de l'ajout du bon de livraison. Veuillez réessayer.");
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de l'ajout du bon de livraison. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-2xl font-semibold">Ajouter Nouveau Bon de Livraison</h1>
          <Link to={`/admin/${companyId}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Retour
            </Button>
          </Link>
        </div>
        
        <div className="p-6">
          <AddDeliveryForm 
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/admin/${companyId}`)} 
            companyId={companyId}
            error={error || undefined}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default AddReceipt;
