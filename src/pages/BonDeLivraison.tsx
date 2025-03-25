import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DeliveryTable from '@/components/DeliveryTable';
import { DeliveryReceipt, ColumnColors, RowColors } from '@/types/deliveryReceipt';
import { getDeliveryReceipts } from '@/services/deliveryReceiptService';
import { getCompanySettings } from '@/services/companyService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Settings, Clock, Home } from 'lucide-react';

const BonDeLivraison = () => {
  const [deliveryData, setDeliveryData] = useState<DeliveryReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Bon de Livraison');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [columnColors, setColumnColors] = useState<ColumnColors>({
    date: '#09008a', // Dark blue for date column
    nb: '#09008a', // Set NB column to dark blue as requested
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
  const navigate = useNavigate();
  const { companyId: urlCompanyId } = useParams<{ companyId: string }>();

  useEffect(() => {
    if (urlCompanyId) {
      fetchData(urlCompanyId);
      loadCompanySettings(urlCompanyId);
    } else {
      navigate('/');
    }
  }, [urlCompanyId, navigate]);

  const fetchData = async (companyId: string) => {
    try {
      setLoading(true);
      // Fetch company-specific delivery receipts
      const data = await getDeliveryReceipts(companyId);
      setDeliveryData(data);
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

  const loadCompanySettings = async (companyId: string) => {
    try {
      const settings = await getCompanySettings(companyId);
      if (settings) {
        setCompanyId(settings.id);
        setCompanyName(settings.name);
        
        // Preserve user settings but ensure date and NB columns are dark blue
        if (settings.columnColors) {
          setColumnColors({
            ...settings.columnColors,
            date: '#09008a', // Ensure date is dark blue
            nb: '#09008a' // Ensure NB is dark blue
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
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Home size={16} />
                Companies
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="outline" className="flex items-center gap-2">
                <Clock size={16} />
                History
              </Button>
            </Link>
            {companyId && (
              <Link to={`/admin/${companyId}`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings size={16} />
                  Admin Panel
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        <DeliveryTable 
          data={deliveryData}
          loading={loading}
          mode="view"
          companyName={companyName}
          columnColors={columnColors}
          rowColors={rowColors}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
};

export default BonDeLivraison;
