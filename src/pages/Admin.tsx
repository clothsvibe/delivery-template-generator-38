
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DeliveryTable from '@/components/DeliveryTable';
import AddDeliveryForm from '@/components/AddDeliveryForm';
import ImportData from '@/components/ImportData';
import CompanySettings from '@/components/CompanySettings';
import TableColorEditor from '@/components/TableColorEditor';
import { DeliveryReceipt, CompanySettings as CompanySettingsType, ColumnColors } from '@/types/deliveryReceipt';
import { getDeliveryReceipts, addDeliveryReceipt, updateDeliveryReceipt, deleteDeliveryReceipt } from '@/services/deliveryReceiptService';
import { getCompanySettings } from '@/services/companyService';
import { addHistoryEntry } from '@/services/historyService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Eye, Settings, Clock, PaintBucket, Save } from 'lucide-react';

const Admin = () => {
  const [deliveryData, setDeliveryData] = useState<DeliveryReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [companyName, setCompanyName] = useState('Bon de Livraison');
  const [columnColors, setColumnColors] = useState<ColumnColors>({
    date: '#ffffff',
    nb: '#ffffff',
    montantBL: '#0ea5e9',
    avance: '#f97316',
    total: '#22c55e'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    loadCompanySettings();
    loadTableColors();
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

  const loadTableColors = () => {
    try {
      const savedColors = localStorage.getItem('columnColors');
      if (savedColors) {
        setColumnColors(JSON.parse(savedColors));
      }
    } catch (error) {
      console.error('Error loading table colors:', error);
    }
  };

  const handleAdd = async (receipt: Omit<DeliveryReceipt, "id" | "total">) => {
    try {
      const updatedData = await addDeliveryReceipt(receipt);
      
      // Get the newly added receipt (should be the last one)
      const newReceipt = updatedData[updatedData.length - 1];
      
      // Add to history
      await addHistoryEntry('add', newReceipt.id, newReceipt);
      
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
      // Add to history before updating
      await addHistoryEntry('update', receipt.id, receipt);
      
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
      // Find the receipt to be deleted for history
      const receiptToDelete = deliveryData.find(r => r.id === id);
      
      if (receiptToDelete) {
        // Add to history before deleting
        await addHistoryEntry('delete', id, receiptToDelete);
      }
      
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
        
        // Get the newly added receipt for history
        const newReceipt = currentData[currentData.length - 1];
        await addHistoryEntry('add', newReceipt.id, newReceipt);
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

  const handleColorChange = (colors: ColumnColors) => {
    setColumnColors(colors);
    localStorage.setItem('columnColors', JSON.stringify(colors));
    setShowColorEditor(false);
  };

  const handleSaveAll = () => {
    // Save current state to localStorage
    localStorage.setItem('deliveryData', JSON.stringify(deliveryData));
    localStorage.setItem('columnColors', JSON.stringify(columnColors));
    
    toast({
      title: "Data Saved",
      description: "All your data has been saved successfully.",
    });
  };

  const closeAllPanels = () => {
    setShowAddForm(false);
    setShowSettings(false);
    setShowImport(false);
    setShowColorEditor(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Bon de Livraison - Admin Panel</h1>
          <div className="flex gap-2">
            <Link to="/history">
              <Button variant="outline" className="flex items-center gap-2">
                <Clock size={16} />
                History
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye size={16} />
                View Mode
              </Button>
            </Link>
          </div>
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
            ) : showColorEditor ? (
              <TableColorEditor
                initialColors={columnColors}
                onSave={handleColorChange}
                onCancel={() => setShowColorEditor(false)}
              />
            ) : (
              <div className="flex flex-col md:flex-row gap-2">
                <Button 
                  onClick={() => { closeAllPanels(); setShowAddForm(true); }} 
                  className="flex-1"
                >
                  Add New Receipt
                </Button>
                <Button 
                  onClick={() => { closeAllPanels(); setShowImport(true); }} 
                  variant="outline" 
                  className="flex-1"
                >
                  Import Data
                </Button>
                <Button 
                  onClick={() => { closeAllPanels(); setShowSettings(true); }} 
                  variant="outline" 
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Settings size={16} />
                  Company Settings
                </Button>
                <Button 
                  onClick={() => { closeAllPanels(); setShowColorEditor(true); }} 
                  variant="outline" 
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <PaintBucket size={16} />
                  Table Colors
                </Button>
              </div>
            )}
          </div>
          
          {(showAddForm || showSettings || showImport || showColorEditor) && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setShowSettings(false);
                  setShowImport(false);
                  setShowColorEditor(false);
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
          columnColors={columnColors}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
        
        <div className="flex justify-center mt-8">
          <Button 
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-8"
            size="lg"
          >
            <Save size={20} />
            Save All Data
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
