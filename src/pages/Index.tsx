
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDeliveryReceipts();
        setDeliveryData(data);
        
        // Load company settings
        const settings = await getCompanySettings();
        setCompanyName(settings.name);
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

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{companyName}</h1>
          <Link to="/admin">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings size={16} />
              Admin Panel
            </Button>
          </Link>
        </div>
        
        <DeliveryTable 
          data={deliveryData}
          loading={loading}
          mode="view"
          companyName={companyName}
        />
      </div>
    </div>
  );
};

export default Index;
