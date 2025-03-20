import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileUp } from 'lucide-react';
import { DeliveryReceipt } from '@/types/deliveryReceipt';
import { v4 as uuidv4 } from "uuid";

interface ImportDataProps {
  onImport: (data: DeliveryReceipt[]) => void;
}

const ImportData: React.FC<ImportDataProps> = ({ onImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const result = e.target?.result as string;
        
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Handle Excel files
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Transform to DeliveryReceipt format
          const receipts = transformImportedData(jsonData);
          onImport(receipts);
          
          toast({
            title: "Success",
            description: `Imported ${receipts.length} records from Excel file.`,
          });
        } else if (file.name.endsWith('.csv')) {
          // Handle CSV files
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Transform to DeliveryReceipt format
          const receipts = transformImportedData(jsonData);
          onImport(receipts);
          
          toast({
            title: "Success",
            description: `Imported ${receipts.length} records from CSV file.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Unsupported file format. Please use Excel (.xlsx, .xls) or CSV (.csv) files.",
          });
        }
      } catch (error) {
        console.error('Error importing file:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to import file. Please check the file format and try again.",
        });
      } finally {
        setIsLoading(false);
        // Reset file input
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to read file. Please try again.",
      });
      // Reset file input
      event.target.value = '';
    };

    // Read file as binary
    reader.readAsBinaryString(file);
  };

  // Transform imported data to DeliveryReceipt format
  const transformImportedData = (data: any[]): DeliveryReceipt[] => {
    return data.map(item => {
      // Try to map columns based on common naming patterns
      const date = item.Date || item.date || item.DATE || '';
      const nb = parseFloat(item.NB || item.nb || item.Nb || item['N°'] || '0') || null;
      const montantBL = parseFloat(item['Montant BL'] || item.montantBL || item.MONTANT || item.Amount || '0') || null;
      const avance = parseFloat(item.Avance || item.avance || item.AVANCE || item.Advance || '0') || null;
      
      return {
        id: uuidv4(),
        date: String(date),
        nb,
        montantBL,
        avance,
        total: 0 // This will be recalculated
      };
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-md bg-white">
      <h3 className="text-lg font-medium">Import Data</h3>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Import delivery receipts from Excel (.xlsx, .xls) or CSV (.csv) files.
        </p>
        
        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6">
          <label className="flex flex-col items-center gap-2 cursor-pointer">
            <FileUp size={24} className="text-gray-400" />
            <span className="text-sm font-medium">
              {isLoading ? 'Processing...' : 'Click to select file'}
            </span>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
          </label>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={() => {
            // Fix: Cast the element to HTMLInputElement type which has the click() method
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.click();
          }}
          disabled={isLoading}
        >
          <Upload size={16} />
          {isLoading ? 'Importing...' : 'Import File'}
        </Button>
      </div>
    </div>
  );
};

export default ImportData;
