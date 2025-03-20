
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DeliveryTable from '@/components/DeliveryTable';
import { DeliveryReceipt } from '@/types/deliveryReceipt';
import { getMonthlyHistory } from '@/services/deliveryReceiptService';
import { getCompanySettings } from '@/services/companyService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const DeliveryDetails = () => {
  const { year, month } = useParams<{ year: string, month?: string }>();
  const [deliveryData, setDeliveryData] = useState<DeliveryReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Bon de Livraison');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Load company settings
        const settings = await getCompanySettings();
        setCompanyName(settings.name);
        
        if (year) {
          // If we have both year and month
          if (month) {
            const data = await getMonthlyHistory(parseInt(year), parseInt(month));
            setDeliveryData(data);
          } 
          // If we only have the year
          else {
            // For year-only view, get all receipts for the year
            const allData = await getMonthlyHistory(parseInt(year), 0);
            // Filter to only include receipts with the exact year
            const yearData = allData.filter(receipt => receipt.date === year);
            setDeliveryData(yearData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load delivery history data.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month, toast]);

  // Format the title based on the parameters
  const getTitle = () => {
    if (year && month) {
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return `${date.toLocaleString('default', { month: 'long' })} ${year}`;
    }
    return `Year ${year}`;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft size={16} />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{companyName} - {getTitle()}</h1>
          </div>
        </div>
        
        {deliveryData.length > 0 ? (
          <DeliveryTable 
            data={deliveryData}
            loading={loading}
            mode="view"
            companyName={`${companyName} - ${getTitle()}`}
          />
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl mb-4">No delivery receipts found for this period</h2>
            <Link to="/">
              <Button>
                Return to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDetails;
