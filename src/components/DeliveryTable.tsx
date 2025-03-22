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
import { DeliveryReceipt, DeliveryTableColumn, ColumnColors, RowColors } from '@/types/deliveryReceipt';
import { formatCurrency, formatDate, parseNumberInput, exportToExcel, exportToPDF } from '@/lib/formatters';
import { ChevronUp, ChevronDown, FileText, Download, Edit, Trash, Save, X, Settings } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeliveryTableProps {
  data: DeliveryReceipt[];
  loading?: boolean;
  mode?: 'view' | 'edit';
  companyName?: string;
  columnColors?: ColumnColors;
  rowColors?: RowColors;
  onUpdate?: (receipt: DeliveryReceipt) => void;
  onDelete?: (id: string) => void;
  onRowClick?: (receipt: DeliveryReceipt) => void;
  onAddMore?: () => void;
}

const DeliveryTable: React.FC<DeliveryTableProps> = ({ 
  data,
  loading = false,
  mode = 'view',
  companyName = 'Bon de Livraison',
  columnColors,
  rowColors,
  onUpdate,
  onDelete,
  onRowClick,
  onAddMore
}) => {
  const [tableData, setTableData] = useState<DeliveryReceipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DeliveryReceipt | null;
    direction: 'asc' | 'desc' | null;
  }>({ key: null, direction: null });
  const [editData, setEditData] = useState<Record<string, {
    date: string;
    nb: string; 
    montantBL: string;
    avance: string;
  }>>({});
  
  const defaultColumnColors = {
    date: '#ffffff',
    nb: '#ffffff',
    montantBL: '#0ea5e9',
    avance: '#f97316',
    total: '#22c55e'
  };
  
  const defaultRowColors = {
    even: '#ffffff',
    odd: '#f3f4f6',
    header: '#f8fafc'
  };
  
  const tableColumnColors = columnColors || defaultColumnColors;
  const tableRowColors = rowColors || defaultRowColors;
  
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const columns = useMemo<DeliveryTableColumn[]>(() => [
    {
      id: 'date',
      header: 'Date',
      accessorKey: 'date',
      cell: (info) => info.getValue() ? formatDate(info.getValue()) : '',
      enableSorting: true,
      enableEditing: true,
    },
    {
      id: 'nb',
      header: 'NB',
      accessorKey: 'nb',
      cell: (info) => info.getValue() ? formatCurrency(info.getValue()) : '',
      enableSorting: true,
      enableEditing: true,
    },
    {
      id: 'montantBL',
      header: 'Montant BL',
      accessorKey: 'montantBL',
      cell: (info) => formatCurrency(info.getValue()),
      enableSorting: true,
      enableEditing: true,
    },
    {
      id: 'avance',
      header: 'Avance',
      accessorKey: 'avance',
      cell: (info) => formatCurrency(info.getValue()),
      enableSorting: true,
      enableEditing: true,
    },
    {
      id: 'total',
      header: 'Total',
      accessorKey: 'total',
      cell: (info) => formatCurrency(info.getValue()),
      enableSorting: true,
      enableEditing: false,
    },
  ], []);

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

  const startEditing = (row: DeliveryReceipt) => {
    setEditData({
      ...editData,
      [row.id]: {
        date: row.date || '',
        nb: row.nb !== null ? row.nb.toString() : '',
        montantBL: row.montantBL !== null ? row.montantBL.toString() : '',
        avance: row.avance !== null ? row.avance.toString() : '',
      }
    });
    
    setTableData(prev => 
      prev.map(item => 
        item.id === row.id ? { ...item, isEditing: true } : item
      )
    );
  };

  const cancelEditing = (id: string) => {
    const newEditData = { ...editData };
    delete newEditData[id];
    setEditData(newEditData);
    
    setTableData(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isEditing: false } : item
      )
    );
  };

  const handleEditChange = (id: string, field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const saveEdit = (id: string) => {
    if (!onUpdate) return;
    
    const rowData = editData[id];
    if (!rowData) return;
    
    const updatedReceipt: DeliveryReceipt = {
      id,
      date: rowData.date,
      nb: parseNumberInput(rowData.nb),
      montantBL: parseNumberInput(rowData.montantBL),
      avance: parseNumberInput(rowData.avance),
      total: 0,
      isEditing: false
    };
    
    onUpdate(updatedReceipt);
    
    const newEditData = { ...editData };
    delete newEditData[id];
    setEditData(newEditData);
  };

  const handleDelete = (id: string) => {
    if (onDelete) onDelete(id);
  };

  const filteredAndSortedData = useMemo(() => {
    let processedData = [...tableData];
    
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      processedData = processedData.filter(item => 
        (item.date && item.date.toLowerCase().includes(lowerCaseSearch)) ||
        (item.nb !== null && item.nb.toString().includes(searchTerm)) ||
        (item.montantBL !== null && item.montantBL.toString().includes(searchTerm)) ||
        (item.avance !== null && item.avance.toString().includes(searchTerm)) ||
        (item.total !== null && item.total.toString().includes(searchTerm))
      );
    }
    
    if (sortConfig.key && sortConfig.direction) {
      processedData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof DeliveryReceipt];
        const bValue = b[sortConfig.key as keyof DeliveryReceipt];
        
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;
        
        if (sortConfig.key === 'date') {
          if (a.date < b.date) return sortConfig.direction === 'asc' ? -1 : 1;
          if (a.date > b.date) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return 0;
      });
    }
    
    return processedData;
  }, [tableData, searchTerm, sortConfig]);

  const handleExportToExcel = () => {
    toast({
      title: "Export Started",
      description: "Your Excel file is being prepared for download.",
    });
    exportToExcel(tableData, companyName);
  };

  const handleExportToPDF = () => {
    toast({
      title: "Export Started",
      description: "Your PDF file is being prepared for download.",
    });
    exportToPDF(tableData, companyName);
  };

  const handleRowClick = (row: DeliveryReceipt) => {
    if (onRowClick && !row.isEditing && mode === 'view') {
      onRowClick(row);
    }
  };

  const renderCell = (row: DeliveryReceipt, column: DeliveryTableColumn) => {
    const key = column.accessorKey;
    const value = row[key];
    
    if (row.isEditing && column.enableEditing && mode === 'edit' && editData[row.id]) {
      if (key === 'date') {
        return (
          <Input 
            type="date" 
            value={editData[row.id].date}
            onChange={(e) => handleEditChange(row.id, 'date', e.target.value)}
            className="h-8 w-full"
          />
        );
      } else if (key === 'nb' || key === 'montantBL' || key === 'avance') {
        const fieldMap: Record<string, string> = {
          nb: 'nb',
          montantBL: 'montantBL',
          avance: 'avance'
        };
        const fieldName = fieldMap[key];
        
        return (
          <Input 
            type="text" 
            value={editData[row.id][fieldName]}
            onChange={(e) => handleEditChange(row.id, fieldName, e.target.value)}
            className="h-8 w-full"
            placeholder="0.00"
          />
        );
      }
    }
    
    return column.cell ? column.cell({ getValue: () => value }) : String(value || '');
  };

  const getRowBackground = (index: number, row: DeliveryReceipt) => {
    if (row.isEditing) return 'bg-blue-50';
    
    if (row.date && !isDateFormat(row.date)) {
      return 'bg-green-100';
    }
    
    return index % 2 === 0 ? tableRowColors.even : tableRowColors.odd;
  };

  const isDateFormat = (str: string) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(str);
  };

  const isTableFull = tableData.length >= 15;

  return (
    <div className="flex flex-col gap-6 p-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-semibold">{companyName}</h1>
        
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
          <Table className="delivery-table border-collapse">
            <TableHeader>
              <TableRow className="border-t border-b border-gray-200" style={{ backgroundColor: tableRowColors.header }}>
                {columns.map((column) => (
                  <TableHead 
                    key={column.id}
                    onClick={() => column.enableSorting && handleSort(column.accessorKey)}
                    className={`border-r border-l border-gray-200 ${column.enableSorting ? 'cursor-pointer select-none' : ''}`}
                    style={{ backgroundColor: tableColumnColors[column.accessorKey as keyof typeof tableColumnColors] || '#ffffff' }}
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
                {mode === 'edit' && (
                  <TableHead className="border-r border-l border-gray-200 w-24">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(10).fill(0).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`} className="animate-pulse border-b border-gray-200">
                    {columns.map(column => (
                      <TableCell key={`skeleton-cell-${column.id}-${idx}`} className="border-r border-l border-gray-200">
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      </TableCell>
                    ))}
                    {mode === 'edit' && (
                      <TableCell className="border-r border-l border-gray-200">
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : filteredAndSortedData.length > 0 ? (
                filteredAndSortedData.map((row, index) => (
                  <TableRow 
                    key={row.id}
                    className={`border-b border-gray-200 ${onRowClick && mode === 'view' ? 'cursor-pointer' : ''}`}
                    onClick={() => handleRowClick(row)}
                    style={{ backgroundColor: row.isEditing ? '#e0f2fe' : getRowBackground(index, row) }}
                  >
                    {columns.map(column => (
                      <TableCell key={`${row.id}-${column.id}`} className="border-r border-l border-gray-200">
                        {renderCell(row, column)}
                      </TableCell>
                    ))}
                    {mode === 'edit' && (
                      <TableCell className="border-r border-l border-gray-200">
                        <div className="flex items-center space-x-1">
                          {row.isEditing ? (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => saveEdit(row.id)}
                                      className="h-8 w-8 p-0"
                                      style={{ color: tableColumnColors.montantBL }}
                                    >
                                      <Save size={16} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Save changes</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => cancelEditing(row.id)}
                                      className="h-8 w-8 p-0"
                                      style={{ color: tableColumnColors.avance }}
                                    >
                                      <X size={16} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Cancel editing</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          ) : (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => startEditing(row)}
                                      className="h-8 w-8 p-0"
                                      style={{ color: tableColumnColors.montantBL }}
                                    >
                                      <Edit size={16} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDelete(row.id)}
                                      className="h-8 w-8 p-0"
                                      style={{ color: "#ea384c" }}
                                    >
                                      <Trash size={16} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={mode === 'edit' ? columns.length + 1 : columns.length} 
                    className="text-center py-8 border-r border-l border-gray-200"
                  >
                    Aucun résultat trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {mode === 'edit' && isTableFull && onAddMore && (
          <div className="flex justify-center mt-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={onAddMore}
                    style={{ color: "#0EA5E9", borderColor: "#0EA5E9" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Add More Entries
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Table is getting full! Click to add more entries</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryTable;

