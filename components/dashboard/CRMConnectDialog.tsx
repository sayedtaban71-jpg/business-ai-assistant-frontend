'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface CRMConnectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CRMConfig {
  type: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'custom';
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  customEndpoint?: string;
}

export function CRMConnectDialog({ isOpen, onClose, onSuccess }: CRMConnectDialogProps) {
  const [selectedCRM, setSelectedCRM] = useState<CRMConfig['type']>('hubspot');
  const [isConnecting, setIsConnecting] = useState(false);
  const [config, setConfig] = useState<CRMConfig>({
    type: 'hubspot',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    customEndpoint: ''
  });

  const handleCRMChange = (value: string) => {
    const crmType = value as CRMConfig['type'];
    setSelectedCRM(crmType);
    setConfig(prev => ({ ...prev, type: crmType }));
  };

  const handleInputChange = (field: keyof CRMConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleConnect = async () => {
    if (!config.apiKey && selectedCRM !== 'custom') {
      toast({
        title: "Missing API Key",
        description: "Please enter your API key",
        variant: "destructive",
      });
      return;
    }

    if (selectedCRM === 'custom' && !config.customEndpoint) {
      toast({
        title: "Missing Endpoint",
        description: "Please enter your custom CRM endpoint",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Here you would implement the actual CRM connection logic
      // For now, we'll simulate a connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "CRM Connected Successfully",
        description: `Successfully connected to ${selectedCRM}`,
      });

      onSuccess();
    } catch (error) {
      console.error('CRM connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to CRM. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    setConfig({
      type: 'hubspot',
      apiKey: '',
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      customEndpoint: ''
    });
    onClose();
  };

  const getCRMFields = () => {
    switch (selectedCRM) {
      case 'hubspot':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your HubSpot API key"
                value={config.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-600">
              Get your API key from HubSpot Settings → Integrations → API Keys
            </div>
          </div>
        );

      case 'salesforce':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="Enter your Salesforce Client ID"
                value={config.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="Enter your Salesforce Client Secret"
                value={config.clientSecret}
                onChange={(e) => handleInputChange('clientSecret', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirectUri">Redirect URI</Label>
              <Input
                id="redirectUri"
                placeholder="Enter your redirect URI"
                value={config.redirectUri}
                onChange={(e) => handleInputChange('redirectUri', e.target.value)}
              />
            </div>
          </div>
        );

      case 'pipedrive':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Token</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Pipedrive API token"
                value={config.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-600">
              Get your API token from Pipedrive Settings → Personal Preferences → API
            </div>
          </div>
        );

      case 'zoho':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="Enter your Zoho Client ID"
                value={config.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="Enter your Zoho Client Secret"
                value={config.clientSecret}
                onChange={(e) => handleInputChange('clientSecret', e.target.value)}
              />
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="customEndpoint">API Endpoint</Label>
              <Input
                id="customEndpoint"
                placeholder="https://your-crm-api.com/endpoint"
                value={config.customEndpoint}
                onChange={(e) => handleInputChange('customEndpoint', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key (Optional)</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your custom CRM API key"
                value={config.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4 p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-lg font-semibold">Connect Your CRM</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* CRM Selection */}
          <div className="space-y-2">
            <Label htmlFor="crmType">Select CRM Platform</Label>
            <Select value={selectedCRM} onValueChange={handleCRMChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select CRM platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hubspot">HubSpot</SelectItem>
                <SelectItem value="salesforce">Salesforce</SelectItem>
                <SelectItem value="pipedrive">Pipedrive</SelectItem>
                <SelectItem value="zoho">Zoho CRM</SelectItem>
                <SelectItem value="custom">Custom CRM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CRM-specific Configuration Fields */}
          {getCRMFields()}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isConnecting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isConnecting ? 'Connecting...' : 'Connect CRM'}
            </Button>
          </div>

          {/* Info Text */}
          <div className="text-xs text-gray-500 text-center">
            Connecting your CRM will allow us to automatically import company information
            and keep it synchronized with your CRM data.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
