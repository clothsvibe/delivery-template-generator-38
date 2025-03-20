
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CompanySettings as CompanySettingsType } from '@/types/deliveryReceipt';
import { getCompanySettings, updateCompanySettings } from '@/services/companyService';
import { useToast } from '@/components/ui/use-toast';
import { Save } from 'lucide-react';

interface CompanySettingsProps {
  onSettingsChange?: (settings: CompanySettingsType) => void;
}

const CompanySettings: React.FC<CompanySettingsProps> = ({ onSettingsChange }) => {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getCompanySettings();
        setCompanyName(settings.name);
        setLoading(false);
      } catch (error) {
        console.error('Error loading company settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load company settings.",
        });
        setLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleSave = async () => {
    try {
      const updatedSettings = await updateCompanySettings({ name: companyName });
      
      toast({
        title: "Success",
        description: "Company settings saved successfully.",
      });
      
      if (onSettingsChange) {
        onSettingsChange(updatedSettings);
      }
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save company settings.",
      });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-md bg-white">
      <h3 className="text-lg font-medium">Company Settings</h3>
      
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Enter company name"
          disabled={loading}
        />
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
          <Save size={16} />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default CompanySettings;
