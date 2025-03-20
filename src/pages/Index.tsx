
import React, { useState, useEffect } from 'react';
import DeliveryTable from '@/components/DeliveryTable';
import { DeliveryReceipt } from '@/types/deliveryReceipt';
import { getDeliveryReceipts } from '@/services/deliveryReceiptService';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const [deliveryData, setDeliveryData] = useState<DeliveryReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
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

    fetchData();
  }, [toast]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <DeliveryTable 
          data={deliveryData}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Index;
