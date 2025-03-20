
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DeliveryTable from '@/components/DeliveryTable';
import { DeliveryReceipt } from '@/types/deliveryReceipt';
import { getDeliveryReceipts } from '@/services/deliveryReceiptService';
import { getCompanySettings } from '@/services/companyService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

const Index = () => {
  const [deliveryData, setDeliveryData] = useState<DeliveryReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Bon de Livraison');
  const { toast } = useToast();
  const navigate = useNavigate();

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

  // Handle click on date or company name
  const handleItemClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Bon de Livraison</h1>
          <Link to="/admin">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings size={16} />
              Admin Mode
            </Button>
          </Link>
        </div>
        
        <DeliveryTable 
          data={deliveryData}
          loading={loading}
          mode="view"
          companyName={companyName}
          onItemClick={handleItemClick}
        />
      </div>
    </div>
  );
};

export default Index;
