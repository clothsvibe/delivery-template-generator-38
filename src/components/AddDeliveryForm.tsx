
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
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md bg-white">
      <h3 className="text-lg font-medium">Ajouter Nouveau Bon de Livraison</h3>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" style={{ color: '#182fe2' }}>Date</Label>
          <Input
            id="date"
            name="date"
            type="text"
            value={formData.date}
            onChange={handleChange}
            required
            placeholder="YYYY-MM-DD"
            className="border-[#182fe2] focus:ring-[#182fe2]"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="nb" style={{ color: '#182fe2' }}>NB</Label>
          <Input
            id="nb"
            name="nb"
            type="text"
            value={formData.nb}
            onChange={handleChange}
            placeholder="0.00"
            className="border-[#182fe2] focus:ring-[#182fe2]"
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
            placeholder="0.00"
            required
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
            placeholder="0.00"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
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
