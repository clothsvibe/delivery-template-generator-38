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
import { formatCurrency, formatDate, parseNumberInput, exportToExcel, exportToPDF, formatNB } from '@/lib/formatters';
import { ChevronUp, ChevronDown, FileText, Download, Edit, Trash, Save, X, Settings, GripVertical } from 'lucide-react';
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
  onReorder?: (reorderedData: DeliveryReceipt[]) => void;
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
  onAddMore,
  onReorder
}) => {
  const [tableData, setTableData] = useState<DeliveryReceipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DeliveryReceipt | null;
    direction: 'asc' | 'desc' | null;
  }>({ key: 'date', direction: 'asc' });
  const [editData, setEditData] = useState<Record<string, {
    date: string;
    nb: string; 
    montantBL: string;
    avance: string;
  }>>({});
  const [draggedItem, setDraggedItem] = useState<DeliveryReceipt | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const defaultColumnColors = {
    date: '#e2e8f0',
    nb: '#e2e8f0',
    montantBL: '#e2e8f0',
    avance: '#e2e8f0',
    total: '#e2e8f0'
  };
  
  const defaultRowColors = {
    even: '#f8fafc',
    odd: '#e2e8f0',
    header: '#e2e8f0'
  };
  
  const tableColumnColors = columnColors || defaultColumnColors;
  const tableRowColors = rowColors || defaultRowColors;
  
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    if (data) {
      setTableData(data);
    } else {
      setTableData([]);
    }
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
      cell: (info) => info.getValue() ? formatNB(info.getValue()) : '',
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
        direction = 'asc';
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
      nb: rowData.nb,
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

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, item: DeliveryReceipt, index: number) => {
    setDraggedItem(item);
    setIsDragging(true);
    
    e.dataTransfer.setData('text/plain', index.toString());
    
    if (e.currentTarget.classList) {
      e.currentTarget.classList.add('opacity-50');
    }
    
    if (e.dataTransfer.setDragImage) {
      const dragPreview = e.currentTarget.cloneNode(true) as HTMLElement;
      dragPreview.style.position = 'absolute';
      dragPreview.style.top = '-9999px';
      dragPreview.style.background = '#f0f9ff';
      dragPreview.style.border = '2px dashed #3b82f6';
      dragPreview.style.opacity = '0.8';
      document.body.appendChild(dragPreview);
      
      e.dataTransfer.setDragImage(dragPreview, 20, 20);
      
      setTimeout(() => {
        document.body.removeChild(dragPreview);
      }, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem) return;
    
    setDragOverIndex(index);
    
    if (e.currentTarget.classList) {
      e.currentTarget.classList.add('bg-blue-50', 'border-t-2', 'border-blue-500');
    }
    
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.currentTarget.classList) {
      e.currentTarget.classList.remove('bg-blue-50', 'border-t-2', 'border-blue-500');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, droppedOnItem: DeliveryReceipt, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem || draggedItem.id === droppedOnItem.id) {
      setIsDragging(false);
      setDragOverIndex(null);
      return;
    }
    
    const draggedItemIndex = tableData.findIndex(item => item.id === draggedItem.id);
    
    if (draggedItemIndex === -1 || dropIndex === -1) {
      setIsDragging(false);
      setDragOverIndex(null);
      return;
    }
    
    const newTableData = [...tableData];
    const [removed] = newTableData.splice(draggedItemIndex, 1);
    newTableData.splice(dropIndex, 0, removed);
    
    setTableData(newTableData);
    
    if (onReorder) {
      onReorder(newTableData);
    }
    
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverIndex(null);
    
    toast({
      title: "Row Moved",
      description: "The row has been successfully repositioned",
      duration: 2000,
    });
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    
    if (e.currentTarget.classList) {
      e.currentTarget.classList.remove('opacity-50');
    }
    
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverIndex(null);
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
          if (!a.date) return 1;
          if (!b.date) return -1;
          
          const formatDateStr = (dateStr: string): string => {
            if (dateStr && dateStr.includes('/')) {
              const [day, month, year] = dateStr.split('/');
              return `${year}-${month}-${day}`;
            }
            return dateStr;
          };
          
          const dateA = formatDateStr(a.date);
          const dateB = formatDateStr(b.date);
          
          return sortConfig.direction === 'asc' 
            ? dateA.localeCompare(dateB)
            : dateB.localeCompare(dateA);
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
      } else if (key === 'nb') {
        return (
          <Input 
            type="text" 
            value={editData[row.id].nb}
            onChange={(e) => handleEditChange(row.id, 'nb', e.target.value)}
            className="h-8 w-full"
            placeholder="Bon..."
          />
        );
      } else if (key === 'montantBL' || key === 'avance') {
        const fieldMap: Record<string, string> = {
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
    
    if (key === 'avance' && typeof value === 'number' && value > 0) {
      return (
        <div className="w-full h-full" style={{ backgroundColor: '#FEF7CD' }}>
          {column.cell ? column.cell({ getValue: () => value }) : String(value || '-')}
        </div>
      );
    }
    
    return column.cell ? column.cell({ getValue: () => value }) : (value || '-');
  };

  const getRowBackground = (index: number, row: DeliveryReceipt) => {
    if (isDragging && draggedItem && draggedItem.id === row.id) {
      return 'bg-blue-100';
    }
    
    if (isDragging && dragOverIndex === index) {
      return 'bg-blue-50';
    }
    
    if (row.isEditing) return 'bg-blue-50';
    
    if (row.date && !isDateFormat(row.date)) {
      return '#e2e8f0';
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
      
      <div className="table-container animate-slide-up border border-gray-300">
        <div className="overflow-x-auto">
          <Table className="delivery-table border-collapse w-full">
            <TableHeader>
              <TableRow className="border-t border-b border-gray-300" 
                style={{ backgroundColor: tableRowColors.header }}>
                {mode === 'edit' && (
                  <TableHead className="border border-gray-300 w-8"></TableHead>
                )}
                {columns.map((column) => (
                  <TableHead 
                    key={column.id}
                    onClick={() => column.enableSorting && handleSort(column.accessorKey)}
                    className={`border border-gray-300 p-2 text-center font-semibold ${
                      column.enableSorting ? 'cursor-pointer select-none' : ''
                    }`}
                    style={{ backgroundColor: tableColumnColors[column.accessorKey as keyof typeof tableColumnColors] || '#e2e8f0' }}
                  >
                    <div className="flex items-center justify-center gap-1">
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
                  <TableHead className="border border-gray-300 w-24">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(10).fill(0).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`} className="animate-pulse border-b border-gray-200">
                    {mode === 'edit' && (
                      <TableCell className="border border-gray-300 w-8">
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      </TableCell>
                    )}
                    {columns.map(column => (
                      <TableCell key={`skeleton-cell-${column.id}-${idx}`} className="border border-gray-300 w-8">
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      </TableCell>
                    ))}
                    {mode === 'edit' && (
                      <TableCell className="border border-gray-300">
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : filteredAndSortedData.length > 0 ? (
                filteredAndSortedData.map((row, index) => (
                  <TableRow 
                    key={row.id}
                    className={`${
                      onRowClick && mode === 'view' ? 'cursor-pointer' : ''
                    } ${
                      row.isEditing && mode === 'edit' ? 'cursor-move transition-colors duration-200' : ''
                    } ${
                      isDragging && dragOverIndex === index ? 'border-t-2 border-blue-500 animate-pulse-border' : ''
                    }`}
                    onClick={() => !row.isEditing && handleRowClick(row)}
                    style={{ backgroundColor: getRowBackground(index, row) }}
                    draggable={mode === 'edit' && row.isEditing}
                    onDragStart={(e) => mode === 'edit' && row.isEditing && handleDragStart(e, row, index)}
                    onDragOver={(e) => mode === 'edit' && handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => mode === 'edit' && handleDrop(e, row, index)}
                    onDragEnd={handleDragEnd}
                  >
                    {mode === 'edit' && (
                      <TableCell className="border border-gray-300 w-8 p-0">
                        {row.isEditing && (
                          <div className="flex items-center justify-center h-full">
                            <GripVertical size={16} className="text-gray-400 cursor-grab transition-colors duration-200" />
                          </div>
                        )}
                      </TableCell>
                    )}
                    {columns.map(column => (
                      <TableCell 
                        key={`${row.id}-${column.id}`} 
                        className="border border-gray-300 p-2 text-center"
                      >
                        {renderCell(row, column)}
                      </TableCell>
                    ))}
                    {mode === 'edit' && (
                      <TableCell className="border border-gray-300">
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
                    colSpan={mode === 'edit' ? columns.length + 2 : columns.length} 
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
