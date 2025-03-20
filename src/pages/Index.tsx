
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DeliveryTable from '@/components/DeliveryTable';
import { DeliveryReceipt, ColumnColors } from '@/types/deliveryReceipt';
import { getDeliveryReceipts } from '@/services/deliveryReceiptService';
import { getCompanySettings } from '@/services/companyService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Settings, Clock } from 'lucide-react';

const Index = () => {
  const [deliveryData, setDeliveryData] = useState<DeliveryReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Bon de Livraison');
  const [columnColors, setColumnColors] = useState<ColumnColors>({
    date: '#ffffff',
    nb: '#ffffff',
    montantBL: '#0ea5e9',
    avance: '#f97316',
    total: '#22c55e'
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDeliveryReceipts();
        setDeliveryData(data);
        
        // Load company settings
        const settings = await getCompanySettings();
        setCompanyName(settings.name);
        
        // Load column colors
        const savedColors = localStorage.getItem('columnColors');
        if (savedColors) {
          setColumnColors(JSON.parse(savedColors));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleRowClick = (receipt: DeliveryReceipt) => {
    // Extract date information for navigation
    if (receipt.date) {
      // If it's a full date like "2025-01-16"
      if (receipt.date.includes('-')) {
        const [year, month] = receipt.date.split('-');
        navigate(`/details/${year}/${month}`);
      } 
      // If it's just a year like "2025"
      else if (/^\d{4}$/.test(receipt.date)) {
        navigate(`/details/${receipt.date}`);
      }
    }
    
    // If no valid date, just show a toast with the receipt info
    else {
      toast({
        title: "Receipt Details",
        description: `Total: ${receipt.total.toFixed(2)}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{companyName}</h1>
          <div className="flex gap-2">
            <Link to="/history">
              <Button variant="outline" className="flex items-center gap-2">
                <Clock size={16} />
                History
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings size={16} />
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>
        
        <DeliveryTable 
          data={deliveryData}
          loading={loading}
          mode="view"
          companyName={companyName}
          columnColors={columnColors}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
};

export default Index;
