
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseNumberInput } from '@/lib/formatters';
import { AdminFormData, DeliveryReceipt } from '@/types/deliveryReceipt';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddDeliveryFormProps {
  onSubmit: (data: Omit<DeliveryReceipt, "id" | "total">) => void;
  onCancel: () => void;
  companyId: string;
  error?: string;
  isSubmitting?: boolean;
}

const AddDeliveryForm: React.FC<AddDeliveryFormProps> = ({ 
  onSubmit, 
  onCancel, 
  companyId,
  error,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<AdminFormData>({
    date: new Date().toISOString().split('T')[0],
    nb: '',
    montantBL: '',
    avance: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      console.error('No company ID provided');
      return;
    }
    
    console.log('Submitting with company ID:', companyId);
    
    onSubmit({
      date: formData.date,
      nb: parseNumberInput(formData.nb),
      montantBL: parseNumberInput(formData.montantBL),
      avance: parseNumberInput(formData.avance),
      companyId: companyId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-3 sm:p-4 border rounded-md bg-white w-full">
      <h3 className="text-lg font-medium">Ajouter Nouveau Bon de Livraison</h3>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-table-dateNb">Date</Label>
          <Input
            id="date"
            name="date"
            type="text"
            value={formData.date}
            onChange={handleChange}
            required
            placeholder="YYYY-MM-DD"
            className="border-table-dateNb focus:ring-table-dateNb w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="nb" className="text-table-dateNb">NB</Label>
          <Input
            id="nb"
            name="nb"
            type="text"
            value={formData.nb}
            onChange={handleChange}
            placeholder="0"
            className="border-table-dateNb focus:ring-table-dateNb w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="montantBL">Montant BL</Label>
          <Input
            id="montantBL"
            name="montantBL"
            type="text"
            value={formData.montantBL}
            onChange={handleChange}
            placeholder="0"
            required
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="avance">Avance</Label>
          <Input
            id="avance"
            name="avance"
            type="text"
            value={formData.avance}
            onChange={handleChange}
            placeholder="0"
            className="w-full"
          />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            'Ajouter'
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddDeliveryForm;
