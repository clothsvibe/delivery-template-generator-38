import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Download, FileText, Edit, Save, Undo, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { formatDate, formatCurrency, formatNB, exportToExcel, exportToPDF } from '@/lib/formatters';
import { HistoryEntry, CompanySettings, DeliveryReceipt } from '@/types/deliveryReceipt';
import { getCompanySettings } from '@/services/companyService';
import { getHistoryEntries, clearHistory, restoreFromHistory } from '@/services/historyService';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

const History = () => {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [companies, setCompanies] = useState<CompanySettings[]>([]);
  const [currentCompany, setCurrentCompany] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const form = useForm({
    defaultValues: {
      date: '',
      nb: '',
      montantBL: '',
      avance: '',
    }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const entries = await getHistoryEntries();
        setHistoryEntries(entries);
        
        const mainCompany = await getCompanySettings();
        
        setCompanies([
          { id: 'default', name: mainCompany.name, colorTheme: mainCompany.colorTheme }
        ]);
        
        setCurrentCompany('default');
      } catch (error) {
        console.error('Error loading history data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load history data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  useEffect(() => {
    if (editingEntry) {
      form.setValue('date', editingEntry.details.date || '');
      form.setValue('nb', editingEntry.details.nb !== undefined ? editingEntry.details.nb?.toString() || '' : '');
      form.setValue('montantBL', editingEntry.details.montantBL !== undefined ? editingEntry.details.montantBL?.toString() || '' : '');
      form.setValue('avance', editingEntry.details.avance !== undefined ? editingEntry.details.avance?.toString() || '' : '');
    }
  }, [editingEntry, form]);

  const getFilteredEntries = () => {
    if (!currentCompany) return [];
    
    let filtered = historyEntries.filter(entry => 
      !entry.companyId || entry.companyId === currentCompany
    );
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.date.toLowerCase().includes(lowerSearch) ||
        entry.action.toLowerCase().includes(lowerSearch) ||
        entry.receiptId.toLowerCase().includes(lowerSearch) ||
        (entry.details.date && entry.details.date.toLowerCase().includes(lowerSearch)) ||
        (entry.details.nb !== undefined && entry.details.nb?.toString().includes(searchTerm)) ||
        (entry.details.montantBL !== undefined && entry.details.montantBL?.toString().includes(searchTerm)) ||
        (entry.details.avance !== undefined && entry.details.avance?.toString().includes(searchTerm))
      );
    }
    
    return filtered;
  };

  const getActionLabel = (action: HistoryEntry['action']) => {
    switch (action) {
      case 'add': return 'Added';
      case 'update': return 'Updated';
      case 'delete': return 'Deleted';
      default: return action;
    }
  };

  const handleExportToExcel = (entries: HistoryEntry[]) => {
    const exportData: DeliveryReceipt[] = entries.map(entry => ({
      id: entry.receiptId,
      date: entry.details.date || entry.date,
      nb: entry.details.nb !== undefined ? entry.details.nb : null,
      montantBL: entry.details.montantBL !== undefined ? entry.details.montantBL : null,
      avance: entry.details.avance !== undefined ? entry.details.avance : null,
      total: entry.details.total !== undefined ? entry.details.total : 0,
    }));
    
    toast({
      title: "Export Started",
      description: "Your Excel file is being prepared for download.",
    });
    
    const companyName = companies.find(c => c.id === currentCompany)?.name || 'History';
    exportToExcel(exportData, `${companyName}_History`);
  };

  const handleExportToPDF = (entries: HistoryEntry[]) => {
    const exportData: DeliveryReceipt[] = entries.map(entry => ({
      id: entry.receiptId,
      date: entry.details.date || entry.date,
      nb: entry.details.nb !== undefined ? entry.details.nb : null,
      montantBL: entry.details.montantBL !== undefined ? entry.details.montantBL : null,
      avance: entry.details.avance !== undefined ? entry.details.avance : null,
      total: entry.details.total !== undefined ? entry.details.total : 0,
    }));
    
    toast({
      title: "Export Started",
      description: "Your PDF file is being prepared for download.",
    });
    
    const companyName = companies.find(c => c.id === currentCompany)?.name || 'History';
    exportToPDF(exportData, `${companyName}_History`);
  };

  const handleRowSelect = (entryId: string) => {
    if (selectedEntries.includes(entryId)) {
      setSelectedEntries(selectedEntries.filter(id => id !== entryId));
    } else {
      setSelectedEntries([...selectedEntries, entryId]);
    }
  };

  const handleRestore = async (receiptId: string) => {
    try {
      const response = await restoreFromHistory(receiptId);
      
      if (response.success && response.data) {
        toast({
          title: "Restoration Successful",
          description: "The receipt has been restored from history.",
        });
        
        // Here you would typically navigate back to the admin page
        // or refresh the current page to show the changes
      } else {
        toast({
          variant: "destructive",
          title: "Restoration Failed",
          description: "Could not restore the receipt from history.",
        });
      }
    } catch (error) {
      console.error('Error restoring from history:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while restoring from history.",
      });
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedEntries.length === 0) {
      toast({
        title: "No Entries Selected",
        description: "Please select at least one history entry to restore.",
      });
      return;
    }

    try {
      // Loop through all selected entries and restore them
      for (const receiptId of selectedEntries) {
        await handleRestore(receiptId);
      }
      
      setSelectedEntries([]);
    } catch (error) {
      console.error('Error restoring selected entries:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while restoring selected entries.",
      });
    }
  };

  const exportSelected = (type: 'excel' | 'pdf') => {
    if (selectedEntries.length === 0) {
      toast({
        title: "No Entries Selected",
        description: "Please select at least one history entry to export.",
      });
      return;
    }

    const entriesToExport = historyEntries.filter(entry => 
      selectedEntries.includes(entry.receiptId)
    );

    if (type === 'excel') {
      handleExportToExcel(entriesToExport);
    } else {
      handleExportToPDF(entriesToExport);
    }
  };

  const EditEntryUI = () => (
    <>
      <Form {...form}>
        <div className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nb"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NB</FormLabel>
                <FormControl>
                  <Input {...field} type="text" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="montantBL"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Montant BL</FormLabel>
                <FormControl>
                  <Input {...field} type="text" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="avance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avance</FormLabel>
                <FormControl>
                  <Input {...field} type="text" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </Form>
    </>
  );

  const startEditing = (entry: HistoryEntry) => {
    setEditingEntry(entry);
    form.setValue('date', entry.details.date || '');
    form.setValue('nb', entry.details.nb !== undefined ? entry.details.nb?.toString() || '' : '');
    form.setValue('montantBL', entry.details.montantBL !== undefined ? entry.details.montantBL?.toString() || '' : '');
    form.setValue('avance', entry.details.avance !== undefined ? entry.details.avance?.toString() || '' : '');
  };
  
  const cancelEditing = () => {
    setEditingEntry(null);
    form.reset();
  };
  
  const saveEditedEntry = async () => {
    if (!editingEntry) return;
    
    try {
      const formValues = form.getValues();
      
      // Convert to appropriate types
      const updatedDetails = {
        ...editingEntry.details,
        date: formValues.date,
        nb: formValues.nb,
        montantBL: parseFloat(formValues.montantBL) || 0,
        avance: parseFloat(formValues.avance) || 0,
      };
      
      // Here you would normally update the history entry in the database
      // For now we'll just update the local state
      
      setHistoryEntries(prev => 
        prev.map(entry => 
          entry.id === editingEntry.id 
            ? { ...entry, details: updatedDetails } 
            : entry
        )
      );
      
      setEditingEntry(null);
      
      toast({
        title: "Entry Updated",
        description: "History entry has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating history entry:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update history entry.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">History</h1>
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} />
                History Log by Company
              </CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-2">
                {selectedEntries.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRestoreSelected}
                      className="flex items-center gap-2"
                    >
                      <Undo size={16} />
                      <span>Restore Selected</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSelected('excel')}
                      className="flex items-center gap-2"
                    >
                      <FileText size={16} />
                      <span>Export Excel</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSelected('pdf')}
                      className="flex items-center gap-2"
                    >
                      <Download size={16} />
                      <span>Export PDF</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <Input
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:max-w-xs"
              />
              
              {!selectedEntries.length && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportToExcel(getFilteredEntries())}
                    className="flex items-center gap-2"
                  >
                    <FileText size={16} />
                    <span>Export All to Excel</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportToPDF(getFilteredEntries())}
                    className="flex items-center gap-2"
                  >
                    <Download size={16} />
                    <span>Export All to PDF</span>
                  </Button>
                </div>
              )}
            </div>
            
            {companies.length > 0 ? (
              <Tabs defaultValue={currentCompany || companies[0].id} onValueChange={setCurrentCompany}>
                <TabsList className="mb-4">
                  {companies.map(company => (
                    <TabsTrigger key={company.id} value={company.id || 'default'}>
                      {company.name || 'Default Company'}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value={currentCompany || 'default'}>
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Loading history data...</p>
                    </div>
                  ) : getFilteredEntries().length > 0 ? (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 text-center">Select</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Receipt ID</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredEntries().map((entry, index) => (
                            <TableRow key={`${entry.receiptId}-${index}`}>
                              <TableCell className="text-center">
                                <input 
                                  type="checkbox" 
                                  checked={selectedEntries.includes(entry.receiptId)}
                                  onChange={() => handleRowSelect(entry.receiptId)}
                                  className="h-4 w-4"
                                />
                              </TableCell>
                              <TableCell>{formatDate(entry.date)}</TableCell>
                              <TableCell>
                                <span 
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${entry.action === 'add' ? 'bg-green-100 text-green-800' : 
                                    entry.action === 'update' ? 'bg-blue-100 text-blue-800' : 
                                    'bg-red-100 text-red-800'}`}
                                >
                                  {getActionLabel(entry.action)}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{entry.receiptId.substring(0, 8)}...</TableCell>
                              <TableCell>
                                {entry.details && (
                                  <div className="text-sm">
                                    {entry.details.date && <div>Date: {formatDate(entry.details.date)}</div>}
                                    {entry.details.nb !== undefined && <div>NB: {formatNB(entry.details.nb)}</div>}
                                    {entry.details.montantBL !== undefined && <div>Montant BL: {formatCurrency(entry.details.montantBL)}</div>}
                                    {entry.details.avance !== undefined && <div>Avance: {formatCurrency(entry.details.avance)}</div>}
                                    {entry.details.total !== undefined && <div>Total: {formatCurrency(entry.details.total)}</div>}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {isMobile ? (
                                    <Drawer>
                                      <DrawerTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <Edit size={16} />
                                        </Button>
                                      </DrawerTrigger>
                                      <DrawerContent>
                                        <DrawerHeader>
                                          <DrawerTitle>Edit Entry</DrawerTitle>
                                          <DrawerDescription>Make changes to the history entry</DrawerDescription>
                                        </DrawerHeader>
                                        <div className="px-4">
                                          {EditEntryUI()}
                                        </div>
                                        <DrawerFooter>
                                          <Button onClick={saveEditedEntry}>Save changes</Button>
                                          <DrawerClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                          </DrawerClose>
                                        </DrawerFooter>
                                      </DrawerContent>
                                    </Drawer>
                                  ) : (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          onClick={() => startEditing(entry)}
                                          className="h-8 w-8 p-0"
                                        >
                                          <Edit size={16} />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Edit Entry</DialogTitle>
                                        </DialogHeader>
                                        {EditEntryUI()}
                                        <div className="flex justify-end gap-2 mt-4">
                                          <Button variant="outline" onClick={cancelEditing}>
                                            Cancel
                                          </Button>
                                          <Button onClick={saveEditedEntry}>
                                            Save Changes
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                      setSelectedEntries([entry.receiptId]);
                                      handleRestoreSelected();
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Undo size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No history records found for this company
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No companies found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default History;
