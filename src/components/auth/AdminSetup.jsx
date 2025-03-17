import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminSetup = () => {
  const { createInitialAdmin, isCreatingAdmin, defaultAdminEmail } = useAuth();
  const [result, setResult] = useState(null);
  
  const handleCreateAdmin = async () => {
    const response = await createInitialAdmin();
    setResult(response);
  };
  
  return (
    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Initial Setup</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        No administrator account found. Create an initial admin account to get started.
      </p>
      
      {result && (
        <div className={`mb-4 p-3 flex items-start rounded-md ${
          result.success 
            ? 'bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500' 
            : 'bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500'
        }`}>
          {result.success ? (
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-sm ${
              result.success 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-yellow-700 dark:text-yellow-300'
            }`}>{result.message}</p>
            
            {result.success && (
              <div className="mt-2 text-xs bg-green-100 dark:bg-green-900/50 p-2 rounded">
                <p className="font-medium text-green-800 dark:text-green-200">Default Admin Credentials:</p>
                <p className="text-green-700 dark:text-green-300">Email: {defaultAdminEmail}</p>
                <p className="text-green-700 dark:text-green-300">Password: admin123456</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <button
        onClick={handleCreateAdmin}
        disabled={isCreatingAdmin || (result && result.success)}
        className="flex items-center justify-center w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isCreatingAdmin ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Admin...
          </>
        ) : (result && result.success) ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Admin Created
          </>
        ) : (
          "Create Initial Admin"
        )}
      </button>
      
      {(result && result.success) && (
        <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
          You can now log in with the admin credentials shown above.
        </p>
      )}
    </div>
  );
};

export default AdminSetup; 