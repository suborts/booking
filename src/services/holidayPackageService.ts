
import { HolidayPackageSearchRequest, HolidayPackageSearchResponse } from '@/types/holidayPackage';
import AuthService from './authService';
import LocationCacheService from './locationCacheService';

const API_BASE_URL = 'https://service.maxtravel.al';

class HolidayPackageService {
  private static instance: HolidayPackageService;

  static getInstance(): HolidayPackageService {
    if (!HolidayPackageService.instance) {
      HolidayPackageService.instance = new HolidayPackageService();
    }
    return HolidayPackageService.instance;
  }

  async searchHolidayPackages(searchParams: Omit<HolidayPackageSearchRequest, 'SessionId'>): Promise<HolidayPackageSearchResponse> {
    const authService = AuthService.getInstance();
    const token = await authService.getValidToken();
    const cacheService = LocationCacheService.getInstance();

    console.log('Searching holiday packages with params:', searchParams);

    try {
      // Try to get locations from cache first
      let departureLocation = cacheService.findDepartureById(searchParams.DeparturePoint);
      let arrivalLocation = cacheService.findArrivalById(searchParams.RegionList[0].toString());

      // If not in cache, fetch fresh data
      if (!departureLocation || !arrivalLocation) {
        console.log('Location data not in cache, fetching...');
        
        // Fetch departures
        const departuresResponse = await fetch(`${API_BASE_URL}/api/productservice/getdepartures`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ProductType: 1,
            culture: 'en-US'
          }),
        });

        const departuresResult = await departuresResponse.json();
        
        if (!departuresResult.header?.success) {
          throw new Error('Failed to get departures');
        }

        departureLocation = departuresResult.body?.locations?.find((loc: any) => 
          loc.id === searchParams.DeparturePoint || loc.code === searchParams.DeparturePoint
        );

        if (!departureLocation) {
          throw new Error(`Departure location not found for: ${searchParams.DeparturePoint}`);
        }

        // Get arrivals
        const arrivalsResponse = await fetch(`${API_BASE_URL}/api/productservice/getarrivals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ProductType: 1,
            DepartureLocations: [{
              Type: departureLocation.type,
              Id: departureLocation.id
            }],
            culture: 'en-US'
          }),
        });

        const arrivalsResult = await arrivalsResponse.json();
        
        if (!arrivalsResult.header?.success) {
          throw new Error('Failed to get arrivals');
        }

        arrivalLocation = arrivalsResult.body?.locations?.find((loc: any) => 
          loc.id === searchParams.RegionList[0].toString()
        );

        if (!arrivalLocation) {
          throw new Error('Arrival location not found');
        }
      } else {
        console.log('Using cached location data for search');
      }

      // Perform the search with found locations
      const response = await fetch(`${API_BASE_URL}/api/productservice/pricesearch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ProductType: 1,
          DepartureLocations: [
            {
              Id: departureLocation.id,
              Type: departureLocation.type
            }
          ],
          ArrivalLocations: [
            {
              Id: arrivalLocation.id,
              Type: arrivalLocation.type
            }
          ],
          IncludeSubLocations: true,
          CheckIn: searchParams.CheckIn,
          Night: searchParams.Duration,
          RoomCriteria: searchParams.Rooms.map(room => ({
            Adult: room.Adult,
            ChildAges: room.ChildAges
          })),
          CheckAllotment: false,
          CheckStopSale: false,
          Nationality: searchParams.Nationality,
          currency: searchParams.Currency,
          culture: searchParams.Language === 'EN' ? 'en-US' : 'en-US'
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Holiday package search response:', result);

      if (result.header && result.header.success) {
        return {
          success: true,
          data: result.body?.hotels || [],
        };
      } else {
        return {
          success: false,
          message: result.header?.messages[0]?.message || 'No packages found',
        };
      }
    } catch (error) {
      console.error('Holiday package search error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }
}

export default HolidayPackageService;
