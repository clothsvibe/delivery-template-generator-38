
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RowColors } from '@/types/deliveryReceipt';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Save, RefreshCw } from 'lucide-react';

interface RowColorEditorProps {
  initialColors: RowColors;
  onSave: (colors: RowColors) => void;
  onCancel?: () => void;
}

const RowColorEditor: React.FC<RowColorEditorProps> = ({
  initialColors,
  onSave,
  onCancel
}) => {
  const [colors, setColors] = useState<RowColors>(initialColors);
  const { toast } = useToast();

  const handleColorChange = (type: keyof RowColors, color: string) => {
    setColors(prev => ({
      ...prev,
      [type]: color
    }));
  };

  const handleReset = () => {
    setColors({
      even: '#ffffff',
      odd: '#f3f4f6',
      header: '#f8fafc'
    });
    
    toast({
      title: "Colors Reset",
      description: "Row colors have been reset to default values."
    });
  };

  const handleSave = () => {
    onSave(colors);
    
    toast({
      title: "Colors Saved",
      description: "Your row color preferences have been saved."
    });
  };

  const rowTypes: {key: keyof RowColors, label: string}[] = [
    { key: 'header', label: 'Header Row' },
    { key: 'even', label: 'Even Rows' },
    { key: 'odd', label: 'Odd Rows' },
  ];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Table Row Color Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {rowTypes.map((rowType) => (
            <div key={rowType.key} className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`color-${rowType.key}`} className="text-right font-medium">
                {rowType.label}
              </Label>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  id={`color-${rowType.key}`}
                  type="color"
                  value={colors[rowType.key]}
                  onChange={(e) => handleColorChange(rowType.key, e.target.value)}
                  className="h-10 w-20"
                />
                <span className="text-xs text-muted-foreground">{colors[rowType.key]}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border rounded-md p-4 mt-4">
          <h3 className="text-sm font-medium mb-2">Preview</h3>
          <div className="overflow-hidden border rounded-md">
            <div className="py-2 px-4" style={{ backgroundColor: colors.header }}>
              Header Row
            </div>
            <div className="py-2 px-4" style={{ backgroundColor: colors.even }}>
              Even Row
            </div>
            <div className="py-2 px-4" style={{ backgroundColor: colors.odd }}>
              Odd Row
            </div>
            <div className="py-2 px-4" style={{ backgroundColor: colors.even }}>
              Even Row
            </div>
          </div>
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

export default RowColorEditor;
