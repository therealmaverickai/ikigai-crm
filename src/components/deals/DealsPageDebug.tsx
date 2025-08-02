import { useState, useEffect } from 'react';
import { useCrmStore } from '../../stores/crmStoreDb';
import Card from '../ui/Card';
import Button from '../ui/Button';

const DealsPageDebug = () => {
  const { deals, isLoading, refreshDeals } = useCrmStore();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    console.log('🐛 DealsPageDebug mounted');
    console.log('🐛 Current deals:', deals);
    console.log('🐛 Is loading:', isLoading);
    
    // Test data loading
    const testDataLoading = async () => {
      try {
        console.log('🐛 Testing deals data loading...');
        await refreshDeals();
        console.log('🐛 Deals loaded successfully');
        
        setDebugInfo({
          dealsCount: deals.length,
          dealsData: deals,
          timestamp: new Date().toISOString()
        });
      } catch (err: any) {
        console.error('🐛 Error loading deals:', err);
        setError(err.message || 'Unknown error');
      }
    };

    testDataLoading();
  }, [refreshDeals]);

  const handleTestSupabase = async () => {
    try {
      console.log('🐛 Testing Supabase connection...');
      setError(null);
      
      // Import the API directly for testing
      const { supabaseApiSimple } = await import('../../database/supabaseClientSimple');
      
      const testResult = await supabaseApiSimple.testConnection();
      console.log('🐛 Supabase test result:', testResult);
      
      const dealsFromDb = await supabaseApiSimple.getDeals();
      console.log('🐛 Deals from database:', dealsFromDb);
      
      setDebugInfo({
        ...debugInfo,
        supabaseTest: testResult,
        dbDeals: dealsFromDb,
        testTimestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('🐛 Supabase test failed:', err);
      setError(`Supabase test failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Deals Debug Page</h1>
          <p className="text-gray-500 mt-1">Debugging deals loading issues</p>
        </div>
        <Button onClick={handleTestSupabase}>Test Supabase Connection</Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="text-red-800">
            <h3 className="font-semibold mb-2">Error Detected:</h3>
            <pre className="text-sm whitespace-pre-wrap">{error}</pre>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="border-blue-200 bg-blue-50">
          <div className="text-blue-800">
            <h3 className="font-semibold mb-2">Loading...</h3>
            <p>Fetching deals data from database...</p>
          </div>
        </Card>
      )}

      {/* Debug Info */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Store State:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify({
                dealsCount: deals?.length || 0,
                isLoading,
                hasDealsArray: Array.isArray(deals),
                dealsType: typeof deals
              }, null, 2)}
            </pre>
          </div>
          
          {debugInfo && (
            <div>
              <h4 className="font-medium">Test Results:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card>

      {/* Deals Display */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Deals Data ({deals?.length || 0} deals)</h3>
        {deals?.length > 0 ? (
          <div className="space-y-2">
            {deals.map((deal, index) => (
              <div key={deal.id || index} className="p-3 border rounded">
                <h4 className="font-medium">{deal.title}</h4>
                <p className="text-sm text-gray-600">
                  Value: {deal.currency} {deal.value} | Stage: {deal.stage}
                </p>
                <p className="text-xs text-gray-500">ID: {deal.id}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No deals data available</p>
            <p className="text-xs mt-2">
              This could mean:
              <br />• Database tables don't exist
              <br />• No data in the deals table
              <br />• Connection/permissions issue
            </p>
          </div>
        )}
      </Card>

      {/* Console Log Button */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Console Debugging</h3>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => console.log('🐛 Current store state:', useCrmStore.getState())}
          >
            Log Store State
          </Button>
          <Button 
            variant="outline" 
            onClick={() => console.log('🐛 Deals array:', deals)}
          >
            Log Deals Array
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DealsPageDebug;