
import { useAuth } from '@/contexts/AuthContext';
import HolidayPackageSearchForm from '@/components/HolidayPackageSearchForm';

const Index = () => {
  const { isAuthenticated, userInfo, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to TourVisio...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Authentication failed</p>
          <p className="text-gray-600">Unable to connect to TourVisio API</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Travel Booking Engine
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {userInfo?.name}!
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
        
        <HolidayPackageSearchForm />
      </div>
    </div>
  );
};

export default Index;
