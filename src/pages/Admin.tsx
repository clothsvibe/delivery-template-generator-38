
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DeliveryTable from '@/components/DeliveryTable';
import AddDeliveryForm from '@/components/AddDeliveryForm';
import { DeliveryReceipt } from '@/types/deliveryReceipt';
import { getDeliveryReceipts, addDeliveryReceipt, updateDeliveryReceipt, deleteDeliveryReceipt } from '@/services/deliveryReceiptService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

const Admin = () => {
  const [deliveryData, setDeliveryData] = useState<DeliveryReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getDeliveryReceipts();
      setDeliveryData(data);
    } catch (error) {
      console.error('Error fetching delivery receipts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load delivery receipt data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (receipt: Omit<DeliveryReceipt, "id" | "total">) => {
    try {
      const updatedData = await addDeliveryReceipt(receipt);
      setDeliveryData(updatedData);
      toast({
        title: "Success",
        description: "New delivery receipt added successfully.",
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding delivery receipt:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add new receipt. Please try again.",
      });
    }
  };

  const handleUpdate = async (receipt: Partial<DeliveryReceipt> & { id: string }) => {
    try {
      const updatedData = await updateDeliveryReceipt(receipt);
      setDeliveryData(updatedData);
      toast({
        title: "Success",
        description: "Delivery receipt updated successfully.",
      });
    } catch (error) {
      console.error('Error updating delivery receipt:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update receipt. Please try again.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updatedData = await deleteDeliveryReceipt(id);
      setDeliveryData(updatedData);
      toast({
        title: "Success",
        description: "Delivery receipt deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting delivery receipt:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete receipt. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Bon de Livraison - Admin Panel</h1>
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Eye size={16} />
              View Mode
            </Button>
          </Link>
        </div>
        
        {showAddForm ? (
          <div className="mb-8">
            <AddDeliveryForm 
              onSubmit={handleAdd} 
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        ) : (
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="mb-8"
          >
            Add New Receipt
          </Button>
        )}

        <DeliveryTable 
          data={deliveryData}
          loading={loading}
          mode="edit"
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default Admin;
