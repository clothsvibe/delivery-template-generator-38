
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeliveryReceipt, DeliveryTableColumn } from '@/types/deliveryReceipt';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ChevronUp, ChevronDown, FileText, Download } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';

interface DeliveryTableProps {
  data: DeliveryReceipt[];
  loading?: boolean;
}

const DeliveryTable: React.FC<DeliveryTableProps> = ({ 
  data,
  loading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DeliveryReceipt | null;
    direction: 'asc' | 'desc' | null;
  }>({ key: null, direction: null });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Define table columns
  const columns = useMemo<DeliveryTableColumn[]>(() => [
    {
      id: 'date',
      header: 'Date',
      accessorKey: 'date',
      cell: (info) => info.getValue() ? formatDate(info.getValue()) : '',
      enableSorting: true,
    },
    {
      id: 'nb',
      header: 'NB',
      accessorKey: 'nb',
      cell: (info) => info.getValue() ? formatCurrency(info.getValue()) : '',
      enableSorting: true,
    },
    {
      id: 'montantBL',
      header: 'Montant BL',
      accessorKey: 'montantBL',
      cell: (info) => formatCurrency(info.getValue()),
      enableSorting: true,
    },
    {
      id: 'avance',
      header: 'Avance',
      accessorKey: 'avance',
      cell: (info) => formatCurrency(info.getValue()),
      enableSorting: true,
    },
    {
      id: 'total',
      header: 'Total',
      accessorKey: 'total',
      cell: (info) => formatCurrency(info.getValue()),
      enableSorting: true,
    },
  ], []);

  // Handle row selection
  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Handle sorting logic
  const handleSort = (key: keyof DeliveryReceipt) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig({ key, direction });
  };

  // Sort and filter data
  const filteredAndSortedData = useMemo(() => {
    // First filter the data
    let processedData = [...data];
    
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      processedData = processedData.filter(item => 
        (item.date && item.date.toLowerCase().includes(lowerCaseSearch)) ||
        (item.nb && item.nb.toString().includes(searchTerm)) ||
        (item.montantBL && item.montantBL.toString().includes(searchTerm)) ||
        (item.avance && item.avance.toString().includes(searchTerm)) ||
        (item.total && item.total.toString().includes(searchTerm))
      );
    }
    
    // Then sort the data if sortConfig has values
    if (sortConfig.key && sortConfig.direction) {
      processedData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof DeliveryReceipt];
        const bValue = b[sortConfig.key as keyof DeliveryReceipt];
        
        // Handle null values
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;
        
        // For dates, use string comparison
        if (sortConfig.key === 'date') {
          if (a.date < b.date) return sortConfig.direction === 'asc' ? -1 : 1;
          if (a.date > b.date) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
        
        // For numbers
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
        }
        
        // For strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return 0;
      });
    }
    
    return processedData;
  }, [data, searchTerm, sortConfig]);

  // Handle exports
  const handleExportToExcel = () => {
    toast({
      title: "Export Started",
      description: "Your Excel file is being prepared for download.",
    });
    // In a real application, this would trigger actual Excel export functionality
  };

  const handleExportToPDF = () => {
    toast({
      title: "Export Started",
      description: "Your PDF file is being prepared for download.",
    });
    // In a real application, this would trigger actual PDF export functionality
  };

  return (
    <div className="flex flex-col gap-6 p-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-semibold">Bon de Livraison</h1>
        
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="table-search"
          />
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="export-button"
              onClick={handleExportToExcel}
            >
              <FileText size={16} />
              <span>Excel</span>
            </Button>
            
            <Button
              variant="outline"
              className="export-button"
              onClick={handleExportToPDF}
            >
              <Download size={16} />
              <span>PDF</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="table-container animate-slide-up">
        <div className="overflow-x-auto">
          <Table className="delivery-table">
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={column.id}
                    onClick={() => column.enableSorting && handleSort(column.accessorKey)}
                    className={column.enableSorting ? 'cursor-pointer select-none' : ''}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {column.enableSorting && sortConfig.key === column.accessorKey && (
                        <span className="transition-transform duration-200">
                          {sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading state rows
                Array(10).fill(0).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`} className="animate-pulse">
                    {columns.map(column => (
                      <TableCell key={`skeleton-cell-${column.id}-${idx}`}>
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredAndSortedData.length > 0 ? (
                // Data rows
                filteredAndSortedData.map((row) => (
                  <TableRow 
                    key={row.id}
                    className={selectedRows.has(row.id) ? 'selected' : ''}
                    onClick={() => toggleRowSelection(row.id)}
                  >
                    {columns.map(column => (
                      <TableCell key={`${row.id}-${column.id}`}>
                        {column.cell 
                          ? column.cell({ getValue: () => row[column.accessorKey] })
                          : row[column.accessorKey] as string}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                // No results row
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8">
                    Aucun résultat trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTable;
