
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { HistoryEntry, CompanySettings } from '@/types/deliveryReceipt';
import { getCompanySettings } from '@/services/companyService';
import { getHistoryEntries } from '@/services/historyService';
import { useToast } from '@/components/ui/use-toast';

const History = () => {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [companies, setCompanies] = useState<CompanySettings[]>([]);
  const [currentCompany, setCurrentCompany] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const entries = await getHistoryEntries();
        setHistoryEntries(entries);
        
        // Load company settings
        const mainCompany = await getCompanySettings();
        
        // For now we just have one company, but this structure allows for multiple
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

  const getFilteredEntries = () => {
    if (!currentCompany) return [];
    
    return historyEntries.filter(entry => 
      !entry.companyId || entry.companyId === currentCompany
    );
  };

  const getActionLabel = (action: HistoryEntry['action']) => {
    switch (action) {
      case 'add': return 'Added';
      case 'update': return 'Updated';
      case 'delete': return 'Deleted';
      default: return action;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">History</h1>
          <Link to="/admin">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Admin
            </Button>
          </Link>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={20} />
              History Log by Company
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                            <TableHead>Date</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Receipt ID</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredEntries().map((entry, index) => (
                            <TableRow key={`${entry.receiptId}-${index}`}>
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
                                    {entry.details.nb !== undefined && <div>NB: {formatCurrency(entry.details.nb)}</div>}
                                    {entry.details.montantBL !== undefined && <div>Montant BL: {formatCurrency(entry.details.montantBL)}</div>}
                                    {entry.details.avance !== undefined && <div>Avance: {formatCurrency(entry.details.avance)}</div>}
                                    {entry.details.total !== undefined && <div>Total: {formatCurrency(entry.details.total)}</div>}
                                  </div>
                                )}
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
