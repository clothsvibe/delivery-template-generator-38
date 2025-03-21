
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { addDeliveryReceipt } from '@/services/deliveryReceiptService';
import { addHistoryEntry } from '@/services/historyService';
import { DeliveryReceipt } from '@/types/deliveryReceipt';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseNumberInput } from '@/lib/formatters';

const AddReceipt = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    nb: '',
    montantBL: '',
    avance: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const receiptData = {
        date: formData.date,
        nb: parseNumberInput(formData.nb),
        montantBL: parseNumberInput(formData.montantBL),
        avance: parseNumberInput(formData.avance),
      };
      
      const updatedData = await addDeliveryReceipt(receiptData);
      const newReceipt = updatedData[updatedData.length - 1];
      
      await addHistoryEntry('add', newReceipt.id, newReceipt);
      
      toast({
        title: "Success",
        description: "New bon de livraison added successfully.",
      });
      
      // Clear form or navigate back
      navigate('/admin');
    } catch (error) {
      console.error('Error adding delivery receipt:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add new bon de livraison. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-2xl font-semibold">Ajouter Nouveau Bon de Livraison</h1>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Retour
            </Button>
          </Link>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-base">Date</Label>
              <Input
                id="date"
                name="date"
                type="text"
                value={formData.date}
                onChange={handleChange}
                className="h-12 text-lg"
                required
                placeholder="YYYY-MM-DD"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nb" className="text-base">NB</Label>
              <Input
                id="nb"
                name="nb"
                type="text"
                value={formData.nb}
                onChange={handleChange}
                className="h-12 text-lg"
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="montantBL" className="text-base">Montant BL</Label>
              <Input
                id="montantBL"
                name="montantBL"
                type="text"
                value={formData.montantBL}
                onChange={handleChange}
                className="h-12 text-lg"
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avance" className="text-base">Avance</Label>
              <Input
                id="avance"
                name="avance"
                type="text"
                value={formData.avance}
                onChange={handleChange}
                className="h-12 text-lg"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              size="lg"
              className="px-8 py-6 text-lg h-auto flex items-center gap-2"
            >
              <Save size={20} />
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReceipt;
