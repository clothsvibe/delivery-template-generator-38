
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CompanySettings } from '@/types/deliveryReceipt';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Building, Image, Save, X } from 'lucide-react';

interface CompanyFormProps {
  initialData?: CompanySettings;
  onSubmit: (data: Omit<CompanySettings, "id">) => void;
  onCancel?: () => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ 
  initialData, 
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Omit<CompanySettings, "id">>({
    name: '',
    logo: '/placeholder.svg',
    rowColors: {
      even: '#ffffff',
      odd: '#f3f4f6',
      header: '#f8fafc'
    }
  });
  const [logoPreview, setLogoPreview] = useState<string>('/placeholder.svg');
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        logo: initialData.logo || '/placeholder.svg',
        colorTheme: initialData.colorTheme,
        columnColors: initialData.columnColors,
        rowColors: initialData.rowColors || {
          even: '#ffffff',
          odd: '#f3f4f6',
          header: '#f8fafc'
        }
      });
      setLogoPreview(initialData.logo || '/placeholder.svg');
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, logo: base64 }));
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (type: 'even' | 'odd' | 'header', color: string) => {
    setFormData(prev => ({
      ...prev,
      rowColors: {
        ...prev.rowColors!,
        [type]: color
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Company name is required"
      });
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building size={20} />
          {initialData ? 'Edit Company' : 'Add New Company'}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter company name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logo">Company Logo</Label>
            <div className="flex items-center gap-4">
              <div 
                className="w-24 h-24 border rounded flex items-center justify-center overflow-hidden bg-gray-50"
              >
                <img 
                  src={logoPreview} 
                  alt="Company Logo" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <Input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('logo')?.click()}
                  className="w-full flex items-center gap-2"
                >
                  <Image size={16} />
                  Choose Logo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended size: 200x200px
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Table Row Colors</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="even-row-color" className="text-xs block mb-1">Even Rows</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="even-row-color"
                    type="color"
                    value={formData.rowColors?.even || '#ffffff'}
                    onChange={(e) => handleColorChange('even', e.target.value)}
                    className="w-full h-8 p-0 border rounded"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="odd-row-color" className="text-xs block mb-1">Odd Rows</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="odd-row-color"
                    type="color"
                    value={formData.rowColors?.odd || '#f3f4f6'}
                    onChange={(e) => handleColorChange('odd', e.target.value)}
                    className="w-full h-8 p-0 border rounded"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="header-row-color" className="text-xs block mb-1">Header</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="header-row-color"
                    type="color"
                    value={formData.rowColors?.header || '#f8fafc'}
                    onChange={(e) => handleColorChange('header', e.target.value)}
                    className="w-full h-8 p-0 border rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex items-center gap-2">
              <X size={16} />
              Cancel
            </Button>
          )}
          <Button type="submit" className="flex items-center gap-2">
            <Save size={16} />
            {initialData ? 'Update Company' : 'Add Company'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CompanyForm;
