
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ColumnColors } from '@/types/deliveryReceipt';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Save, RefreshCw } from 'lucide-react';

interface TableColorEditorProps {
  initialColors: ColumnColors;
  onSave: (colors: ColumnColors) => void;
  onCancel?: () => void;
}

const TableColorEditor: React.FC<TableColorEditorProps> = ({
  initialColors,
  onSave,
  onCancel
}) => {
  const [colors, setColors] = useState<ColumnColors>(initialColors);
  const { toast } = useToast();

  const handleColorChange = (column: keyof ColumnColors, color: string) => {
    setColors(prev => ({
      ...prev,
      [column]: color
    }));
  };

  const handleReset = () => {
    setColors({
      date: '#ffffff',
      nb: '#ffffff',
      montantBL: '#0ea5e9',
      avance: '#f97316',
      total: '#22c55e'
    });
    
    toast({
      title: "Colors Reset",
      description: "Table colors have been reset to default values."
    });
  };

  const handleSave = () => {
    onSave(colors);
    
    toast({
      title: "Colors Saved",
      description: "Your table color preferences have been saved."
    });
  };

  const columns: {key: keyof ColumnColors, label: string}[] = [
    { key: 'date', label: 'Date' },
    { key: 'nb', label: 'NB' },
    { key: 'montantBL', label: 'Montant BL' },
    { key: 'avance', label: 'Avance' },
    { key: 'total', label: 'Total' },
  ];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Table Color Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {columns.map((column) => (
            <div key={column.key} className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`color-${column.key}`} className="text-right font-medium">
                {column.label}
              </Label>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  id={`color-${column.key}`}
                  type="color"
                  value={colors[column.key]}
                  onChange={(e) => handleColorChange(column.key, e.target.value)}
                  className="h-10 w-20"
                />
                <span className="text-xs text-muted-foreground">{colors[column.key]}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
          <RefreshCw size={16} />
          Reset
        </Button>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save size={16} />
            Save Colors
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TableColorEditor;
