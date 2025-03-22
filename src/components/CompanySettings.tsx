
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
  companyId?: string; // Add companyId prop
}

const CompanySettings: React.FC<CompanySettingsProps> = ({ onSettingsChange, companyId }) => {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getCompanySettings(companyId);
        if (settings) {
          setCompanyName(settings.name);
          setCurrentCompanyId(settings.id);
        }
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
  }, [toast, companyId]);

  const handleSave = async () => {
    if (!currentCompanyId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No company ID found. Cannot save settings.",
      });
      return;
    }

    try {
      const updatedSettings = await updateCompanySettings({ 
        id: currentCompanyId, 
        name: companyName 
      });
      
      toast({
        title: "Success",
        description: "Company settings saved successfully.",
      });
      
      if (onSettingsChange && updatedSettings) {
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
