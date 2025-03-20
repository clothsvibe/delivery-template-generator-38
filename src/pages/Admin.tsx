
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DeliveryTable from '@/components/DeliveryTable';
import AddDeliveryForm from '@/components/AddDeliveryForm';
import ImportData from '@/components/ImportData';
import CompanySettings from '@/components/CompanySettings';
import { DeliveryReceipt, CompanySettings as CompanySettingsType } from '@/types/deliveryReceipt';
import { getDeliveryReceipts, addDeliveryReceipt, updateDeliveryReceipt, deleteDeliveryReceipt } from '@/services/deliveryReceiptService';
import { getCompanySettings } from '@/services/companyService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Eye, Settings } from 'lucide-react';

const Admin = () => {
  const [deliveryData, setDeliveryData] = useState<DeliveryReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [companyName, setCompanyName] = useState('Bon de Livraison');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    loadCompanySettings();
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

  const loadCompanySettings = async () => {
    try {
      const settings = await getCompanySettings();
      setCompanyName(settings.name);
    } catch (error) {
      console.error('Error loading company settings:', error);
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

  const handleImport = async (importedData: DeliveryReceipt[]) => {
    try {
      // Add each imported receipt
      let currentData = [...deliveryData];
      
      for (const receipt of importedData) {
        // Add the receipt without id and total (will be calculated)
        const { id, total, ...receiptData } = receipt;
        currentData = await addDeliveryReceipt(receiptData);
      }
      
      setDeliveryData(currentData);
      setShowImport(false);
      
      toast({
        title: "Success",
        description: `Successfully imported ${importedData.length} receipts.`,
      });
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to import data. Please try again.",
      });
    }
  };

  const handleSettingsChange = (settings: CompanySettingsType) => {
    setCompanyName(settings.name);
    setShowSettings(false);
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            {showSettings ? (
              <CompanySettings 
                onSettingsChange={handleSettingsChange} 
              />
            ) : showImport ? (
              <ImportData onImport={handleImport} />
            ) : showAddForm ? (
              <AddDeliveryForm 
                onSubmit={handleAdd} 
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <div className="flex flex-col md:flex-row gap-2">
                <Button 
                  onClick={() => setShowAddForm(true)} 
                  className="flex-1"
                >
                  Add New Receipt
                </Button>
                <Button 
                  onClick={() => setShowImport(true)} 
                  variant="outline" 
                  className="flex-1"
                >
                  Import Data
                </Button>
                <Button 
                  onClick={() => setShowSettings(true)} 
                  variant="outline" 
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Settings size={16} />
                  Company Settings
                </Button>
              </div>
            )}
          </div>
          
          {(showAddForm || showSettings || showImport) && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setShowSettings(false);
                  setShowImport(false);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <DeliveryTable 
          data={deliveryData}
          loading={loading}
          mode="edit"
          companyName={companyName}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default Admin;
