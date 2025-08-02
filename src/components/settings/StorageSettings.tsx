import { useState, useEffect } from 'react';
import { localFileStorage } from '../../database/fileStorage';
import { persistentDb } from '../../database/persistentDatabase';
import { useCrmStore } from '../../stores/crmStoreDb';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';

const StorageSettings = () => {
  const [storageType, setStorageType] = useState<'localStorage' | 'file'>('localStorage');
  const [isFileConnected, setIsFileConnected] = useState(false);
  const [connectedFileName, setConnectedFileName] = useState<string | null>(null);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [localStorageAutoSaveInfo, setLocalStorageAutoSaveInfo] = useState<{
    isEnabled: boolean;
    lastSave: Date | null;
    intervalMinutes: number;
  }>({ isEnabled: false, lastSave: null, intervalMinutes: 5 });

  const { exportAllData, importAllData, clearAndReinitializeData } = useCrmStore();

  useEffect(() => {
    // Check current storage settings
    const savedStorageType = localStorage.getItem('crm_storage_type') as 'localStorage' | 'file' || 'localStorage';
    setStorageType(savedStorageType);
    
    // Check file connection status
    setIsFileConnected(localFileStorage.isFileConnected);
    setConnectedFileName(localFileStorage.connectedFileName);

    // Check localStorage auto-save status
    const autoSaveInfo = persistentDb.getAutoSaveInfo();
    setLocalStorageAutoSaveInfo(autoSaveInfo);

    // Initialize file storage if needed
    if (savedStorageType === 'file') {
      localFileStorage.initialize();
    }
    
    // Set up periodic refresh of auto-save info
    const interval = setInterval(() => {
      const autoSaveInfo = persistentDb.getAutoSaveInfo();
      setLocalStorageAutoSaveInfo(autoSaveInfo);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleStorageTypeChange = async (newType: 'localStorage' | 'file') => {
    if (newType === storageType) return;

    try {
      // Export current data before switching
      const currentData = exportAllData();
      
      // Save storage preference
      localStorage.setItem('crm_storage_type', newType);
      setStorageType(newType);

      if (newType === 'file') {
        // Initialize file storage
        await localFileStorage.initialize();
        
        // Save current data to file
        const fileData = {
          ...currentData,
          exportedAt: new Date().toISOString(),
          version: '1.0.0'
        };
        
        const saved = await localFileStorage.saveToFile(fileData);
        if (saved) {
          alert('✅ Successfully switched to file storage and saved your data!');
          setIsFileConnected(true);
          setConnectedFileName(localFileStorage.connectedFileName);
        } else {
          alert('❌ Failed to save data to file. Staying with localStorage.');
          localStorage.setItem('crm_storage_type', 'localStorage');
          setStorageType('localStorage');
        }
      } else {
        // Stop auto-save when switching back to localStorage
        localFileStorage.stopAutoSave();
        setIsAutoSaveEnabled(false);
        alert('✅ Switched back to browser localStorage');
      }
    } catch (error) {
      console.error('Failed to switch storage type:', error);
      alert('❌ Failed to switch storage type');
    }
  };

  const handleConnectToFile = async () => {
    try {
      await localFileStorage.initialize();
      const data = await localFileStorage.loadFromFile();
      
      if (data) {
        // Import the loaded data
        await importAllData(data);
        setIsFileConnected(true);
        setConnectedFileName(localFileStorage.connectedFileName);
        alert('✅ Successfully connected to file and loaded data!');
      }
    } catch (error) {
      console.error('Failed to connect to file:', error);
      alert('❌ Failed to connect to file');
    }
  };

  const handleSaveToFile = async () => {
    try {
      const currentData = {
        ...exportAllData(),
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const saved = await localFileStorage.saveToFile(currentData);
      if (saved) {
        alert('✅ Data saved to file successfully!');
      } else {
        alert('❌ Failed to save data to file');
      }
    } catch (error) {
      console.error('Failed to save to file:', error);
      alert('❌ Failed to save data to file');
    }
  };

  const handleLoadFromFile = async () => {
    try {
      const data = await localFileStorage.loadFromFile();
      if (data) {
        await importAllData(data);
        alert('✅ Data loaded from file successfully!');
      } else {
        alert('❌ No data was loaded from file');
      }
    } catch (error) {
      console.error('Failed to load from file:', error);
      alert('❌ Failed to load data from file');
    }
  };

  const handleToggleAutoSave = () => {
    if (isAutoSaveEnabled) {
      localFileStorage.stopAutoSave();
      setIsAutoSaveEnabled(false);
    } else {
      const getCurrentData = () => ({
        ...exportAllData(),
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      });
      
      localFileStorage.startAutoSave(getCurrentData, autoSaveInterval);
      setIsAutoSaveEnabled(true);
    }
  };

  const storageOptions = [
    { value: 'localStorage', label: 'Browser Storage (localStorage)' },
    { value: 'file', label: 'Local File Storage' }
  ];

  const intervalOptions = [
    { value: '1', label: '1 minute' },
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Storage Settings</h2>
        <p className="text-gray-600">Configure how your CRM data is stored and managed</p>
      </div>

      {/* Storage Type Selection */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Storage Type</h3>
        
        <div className="space-y-4">
          <Select
            label="Choose Storage Method"
            value={storageType}
            onChange={(value) => handleStorageTypeChange(value as 'localStorage' | 'file')}
            options={storageOptions}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">📱 Browser Storage</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Stored in browser memory</li>
                <li>• Fast access</li>
                <li>• Limited to this browser</li>
                <li>• Can be cleared by browser</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">💾 Local File Storage</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Saved as JSON files on your computer</li>
                <li>• Portable and secure</li>
                <li>• Full control over your data</li>
                <li>• Can be backed up and shared</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* File Storage Options */}
      {storageType === 'file' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">File Storage Management</h3>
          
          <div className="space-y-4">
            {/* File Connection Status */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">File Connection Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isFileConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isFileConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              {connectedFileName && (
                <p className="text-sm text-gray-600">Connected to: {connectedFileName}</p>
              )}
            </div>

            {/* File Operations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleConnectToFile}
              >
                📁 Connect to File
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveToFile}
              >
                💾 Save to File
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLoadFromFile}
              >
                📤 Load from File
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const currentData = {
                    ...exportAllData(),
                    exportedAt: new Date().toISOString(),
                    version: '1.0.0'
                  };
                  
                  const jsonString = JSON.stringify(currentData, null, 2);
                  const blob = new Blob([jsonString], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'ikigai-crm-backup.json';
                  a.click();
                  
                  URL.revokeObjectURL(url);
                }}
              >
                📥 Download Backup
              </Button>
            </div>

            {/* Auto-Save Settings */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Auto-Save Settings</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isAutoSaveEnabled}
                      onChange={handleToggleAutoSave}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Auto-Save</span>
                  </label>
                  
                  <Select
                    value={autoSaveInterval.toString()}
                    onChange={(value) => {
                      const newInterval = parseInt(value);
                      setAutoSaveInterval(newInterval);
                      
                      // If auto-save is enabled, restart with new interval
                      if (isAutoSaveEnabled) {
                        localFileStorage.stopAutoSave();
                        const getCurrentData = () => ({
                          ...exportAllData(),
                          exportedAt: new Date().toISOString(),
                          version: '1.0.0'
                        });
                        localFileStorage.startAutoSave(getCurrentData, newInterval);
                      }
                    }}
                    options={intervalOptions}
                    className="w-32"
                  />
                </div>
                
                {isAutoSaveEnabled && (
                  <p className="text-sm text-green-600">
                    ✅ Auto-save is active (every {autoSaveInterval} minute{autoSaveInterval > 1 ? 's' : ''})
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Browser Storage Auto-Save */}
      {storageType === 'localStorage' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Browser Storage Auto-Save</h3>
          
          <div className="space-y-4">
            {/* Auto-Save Status */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">Auto-Save Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  localStorageAutoSaveInfo.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {localStorageAutoSaveInfo.isEnabled ? 'Active (Every 5 minutes)' : 'Inactive'}
                </span>
              </div>
              
              {localStorageAutoSaveInfo.lastSave && (
                <p className="text-sm text-gray-600">
                  Last auto-save: {localStorageAutoSaveInfo.lastSave.toLocaleString()}
                </p>
              )}
              
              {!localStorageAutoSaveInfo.isEnabled && (
                <p className="text-sm text-gray-500 mt-2">
                  Auto-save is currently disabled. Your data is only saved when you make changes.
                </p>
              )}
            </div>

            {/* Auto-Save Controls */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800">Enable Auto-Save</h4>
                <p className="text-sm text-gray-600">Automatically backup your data every 5 minutes</p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant={localStorageAutoSaveInfo.isEnabled ? "ghost" : "primary"}
                  size="sm"
                  onClick={() => {
                    if (localStorageAutoSaveInfo.isEnabled) {
                      persistentDb.stopAutoSave();
                    } else {
                      persistentDb.startAutoSave(5);
                    }
                    // Force immediate refresh of status
                    setTimeout(() => {
                      const autoSaveInfo = persistentDb.getAutoSaveInfo();
                      setLocalStorageAutoSaveInfo(autoSaveInfo);
                    }, 100);
                  }}
                >
                  {localStorageAutoSaveInfo.isEnabled ? '⏸️ Disable' : '▶️ Enable'}
                </Button>
                
                {localStorageAutoSaveInfo.isEnabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Force immediate auto-save
                      persistentDb.startAutoSave(5); // This triggers immediate save
                      setTimeout(() => {
                        const autoSaveInfo = persistentDb.getAutoSaveInfo();
                        setLocalStorageAutoSaveInfo(autoSaveInfo);
                      }, 500);
                    }}
                  >
                    💾 Save Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Data Management */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('⚠️ This will clear all your data and reload sample data. Are you sure?')) {
                clearAndReinitializeData();
              }
            }}
            className="text-red-600 hover:bg-red-50"
          >
            🗑️ Reset to Sample Data
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default StorageSettings;