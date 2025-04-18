import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import DeliveryTable from '@/components/DeliveryTable';
import AddDeliveryForm from '@/components/AddDeliveryForm';
import ImportData from '@/components/ImportData';
import CompanySettings from '@/components/CompanySettings';
import TableColorEditor from '@/components/TableColorEditor';
import RowColorEditor from '@/components/RowColorEditor';
import { DeliveryReceipt, CompanySettings as CompanySettingsType, ColumnColors, RowColors } from '@/types/deliveryReceipt';
import { getDeliveryReceipts, addDeliveryReceipt, updateDeliveryReceipt, deleteDeliveryReceipt } from '@/services/deliveryReceiptService';
import { getCompanySettings, updateCompanySettings } from '@/services/companyService';
import { addHistoryEntry } from '@/services/historyService';
import { addSampleDataToTable } from '@/lib/sampleData';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Eye, Settings, Clock, PaintBucket, Save, Plus, Home, Database } from 'lucide-react';

const Admin = () => {
  const [deliveryData, setDeliveryData] = useState<DeliveryReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [showRowColorEditor, setShowRowColorEditor] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [companyName, setCompanyName] = useState('Bon de Livraison');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [columnColors, setColumnColors] = useState<ColumnColors>({
    date: '#182fe2',
    nb: '#182fe2',
    montantBL: '#0ea5e9',
    avance: '#f97316',
    total: '#22c55e'
  });
  const [rowColors, setRowColors] = useState<RowColors>({
    even: '#ffffff',
    odd: '#f3f4f6',
    header: '#f8fafc'
  });
  
  const { toast } = useToast();
  const { companyId: urlCompanyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (urlCompanyId) {
      setCompanyId(urlCompanyId);
      fetchData(urlCompanyId);
      loadCompanySettings(urlCompanyId);
    } else {
      navigate('/');
    }
  }, [urlCompanyId, navigate]);

  const fetchData = async (companyId: string) => {
    try {
      setLoading(true);
      const data = await getDeliveryReceipts(companyId);
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

  const loadCompanySettings = async (companyId: string) => {
    try {
      const settings = await getCompanySettings(companyId);
      if (settings) {
        setCompanyName(settings.name);
        
        if (settings.columnColors) {
          setColumnColors({
            ...settings.columnColors,
            date: '#182fe2',
            nb: '#182fe2'
          });
        }
        
        if (settings.rowColors) {
          setRowColors(settings.rowColors);
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  };

  const handleAdd = async (receipt: Omit<DeliveryReceipt, "id" | "total">) => {
    if (!companyId) return;
    
    try {
      const updatedData = await addDeliveryReceipt(receipt, companyId);
      
      const newReceipt = updatedData[updatedData.length - 1];
      
      await addHistoryEntry('add', newReceipt.id, newReceipt, companyId);
      
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
    if (!companyId) return;
    
    try {
      await addHistoryEntry('update', receipt.id, receipt, companyId);
      
      const updatedData = await updateDeliveryReceipt(receipt, companyId);
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
    if (!companyId) return;
    
    try {
      const receiptToDelete = deliveryData.find(r => r.id === id);
      
      if (receiptToDelete) {
        await addHistoryEntry('delete', id, receiptToDelete, companyId);
      }
      
      const updatedData = await deleteDeliveryReceipt(id, companyId);
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
    if (!companyId) return;
    
    try {
      let currentData = [...deliveryData];
      
      for (const receipt of importedData) {
        const { id, total, ...receiptData } = receipt;
        currentData = await addDeliveryReceipt(receiptData, companyId);
        
        const newReceipt = currentData[currentData.length - 1];
        await addHistoryEntry('add', newReceipt.id, newReceipt, companyId);
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
    
    if (companyId) {
      updateCompanySettings({
        id: companyId,
        columnColors: colors
      });
    }
    
    setShowColorEditor(false);
  };
  
  const handleRowColorChange = (colors: RowColors) => {
    setRowColors(colors);
    
    if (companyId) {
      updateCompanySettings({
        id: companyId,
        rowColors: colors
      });
    }
    
    setShowRowColorEditor(false);
  };

  const handleSaveAll = () => {
    if (!companyId) return;
    
    if (companyId) {
      updateCompanySettings({
        id: companyId,
        columnColors,
        rowColors
      });
    }
    
    toast({
      title: "Data Saved",
      description: "All your data has been saved successfully.",
    });
  };

  const addSampleDeliveryData = async () => {
    if (!companyId) return;
    
    const sampleData = [
      { date: '24/12/24', nb: 'BON', montantBL: 1902.00, avance: 0 },
      { date: '26/12/24', nb: 'ESPECE', montantBL: 0, avance: 1900.00 },
      { date: '26/12/24', nb: 'REMIS', montantBL: 0, avance: 2.00 },
      { date: '31/12/24', nb: '12250', montantBL: 4262.50, avance: 0 },
      { date: '06/01/25', nb: '2701', montantBL: 2400.00, avance: 0 },
      { date: '12/01/25', nb: '2702', montantBL: 1870.00, avance: 0 },
      { date: '16/01/25', nb: '2703', montantBL: 3100.00, avance: 0 },
      { date: '17/01/25', nb: 'BON RETOUR N° 1867', montantBL: 0, avance: 900.00 },
      { date: '06/02/25', nb: '2706', montantBL: 9610.00, avance: 0 },
      { date: '02/01/25', nb: 'CHEQ N° 348736', montantBL: 0, avance: 20000.00 },
      { date: '02/01/25', nb: 'ESPECE', montantBL: 0, avance: 342.00 },
      { date: '01/02/25', nb: '2707', montantBL: 11246.00, avance: 0 },
      { date: '08/03/25', nb: '2708', montantBL: 11000.00, avance: 0 },
      { date: '17/03/25', nb: '2709', montantBL: 27500.00, avance: 0 },
      { date: '21/03/25', nb: '2710', montantBL: 965.00, avance: 0 },
      { date: '25/03/25', nb: '2711', montantBL: 1425.00, avance: 0 },
      { date: '08/04/25', nb: 'CHEQ 097121-1800084-666649', montantBL: 0, avance: 51400.00 },
      { date: '10/04/25', nb: '2712', montantBL: 686.50, avance: 0 },
      { date: '10/04/25', nb: '2714', montantBL: 2460.00, avance: 0 },
      { date: '15/04/25', nb: '12677', montantBL: 1800.00, avance: 0 }
    ];

    try {
      setLoading(true);
      for (const receipt of sampleData) {
        await addDeliveryReceipt(receipt, companyId);
      }
      await fetchData(companyId);
      toast({
        title: "Success",
        description: "Sample delivery receipts have been added successfully.",
      });
    } catch (error) {
      console.error('Error adding sample data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add sample data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSampleData = () => {
    addSampleDeliveryData();
  };

  const closeAllPanels = () => {
    setShowAddForm(false);
    setShowSettings(false);
    setShowImport(false);
    setShowColorEditor(false);
    setShowRowColorEditor(false);
  };

  const handleAddMore = () => {
    closeAllPanels();
    setShowAddForm(true);
    toast({
      title: "Table getting full",
      description: "You're adding more entries to your table. Consider exporting older data to keep the app responsive.",
    });
  };

  const handleReorder = async (reorderedData: DeliveryReceipt[]) => {
    if (!companyId) return;
    
    try {
      setDeliveryData(reorderedData);
      
      for (const receipt of reorderedData) {
        await addHistoryEntry('update', receipt.id, receipt, companyId);
      }
      
      toast({
        title: "Success",
        description: "Table rows reordered successfully.",
      });
    } catch (error) {
      console.error('Error reordering delivery receipts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reorder rows. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{companyName} - Admin Panel</h1>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Home size={16} />
                HOME PAGE INDEX
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="outline" className="flex items-center gap-2">
                <Clock size={16} />
                Historique
              </Button>
            </Link>
            {companyId && (
              <Link to={`/bondelivraison/${companyId}`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Eye size={16} />
                  Mode Vue
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            {showSettings ? (
              <CompanySettings 
                onSettingsChange={handleSettingsChange}
                companyId={companyId || undefined}
              />
            ) : showImport ? (
              <ImportData onImport={handleImport} />
            ) : showAddForm ? (
              <AddDeliveryForm 
                onSubmit={handleAdd} 
                onCancel={() => setShowAddForm(false)}
                companyId={companyId || ''}
              />
            ) : showColorEditor ? (
              <TableColorEditor
                initialColors={columnColors}
                onSave={handleColorChange}
                onCancel={() => setShowColorEditor(false)}
              />
            ) : showRowColorEditor ? (
              <RowColorEditor
                initialColors={rowColors}
                onSave={handleRowColorChange}
                onCancel={() => setShowRowColorEditor(false)}
              />
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col md:flex-row gap-2">
                  <Link to={companyId ? `/add-receipt/${companyId}` : "/add-receipt"} className="flex-1">
                    <Button 
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Ajouter Nouveau Bon de Livraison
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => { closeAllPanels(); setShowImport(true); }} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Importer Données
                  </Button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-2">
                  <Button 
                    onClick={() => { closeAllPanels(); setShowSettings(true); }} 
                    variant="outline" 
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Settings size={16} />
                    Paramètres
                  </Button>
                  <Button 
                    onClick={() => { closeAllPanels(); setShowColorEditor(true); }} 
                    variant="outline" 
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <PaintBucket size={16} />
                    Couleurs Colonnes
                  </Button>
                  <Button 
                    onClick={() => { closeAllPanels(); setShowRowColorEditor(true); }} 
                    variant="outline" 
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <PaintBucket size={16} />
                    Couleurs Lignes
                  </Button>
                </div>
                
                <Button 
                  onClick={handleAddSampleData} 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 mt-2 border-dashed"
                >
                  <Database size={16} />
                  Ajouter 15 lignes d'exemple pour tests
                </Button>
              </div>
            )}
          </div>
          
          {(showSettings || showImport || showColorEditor || showRowColorEditor) && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSettings(false);
                  setShowImport(false);
                  setShowColorEditor(false);
                  setShowRowColorEditor(false);
                }}
              >
                Annuler
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
          rowColors={rowColors}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAddMore={handleAddMore}
          onReorder={handleReorder}
        />
        
        <div className="flex justify-center mt-8">
          <Button 
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-8"
            size="lg"
          >
            <Save size={20} />
            Enregistrer Toutes les Données
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
