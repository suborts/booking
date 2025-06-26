import AuthService from './authService';
import LocationCacheService, { CachedLocation } from './locationCacheService';

const API_BASE_URL = 'https://service.maxtravel.al';

interface DepartureAirport {
  Code: string;
  Name: string;
}

interface Region {
  Code: number;
  Name: string;
}

interface CheckinDatesResponse {
  success: boolean;
  data?: string[];
  message?: string;
}

interface NightsResponse {
  success: boolean;
  data?: number[];
  message?: string;
}

interface PriceRangeResponse {
  success: boolean;
  data?: {
    PriceMin: number;
    PriceMax: number;
    Currency: string;
  };
  message?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T[];
  message?: string;
}

class LocationService {
  private static instance: LocationService;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  private async fetchLocationsWithCache(): Promise<{ departures: CachedLocation[], arrivals: CachedLocation[] }> {
    const cacheService = LocationCacheService.getInstance();
    
    // Check cache first
    const cachedDepartures = cacheService.getCachedDepartures();
    const cachedArrivals = cacheService.getCachedArrivals();
    
    if (cachedDepartures && cachedArrivals) {
      console.log('Using cached location data');
      return { departures: cachedDepartures, arrivals: cachedArrivals };
    }

    console.log('Fetching fresh location data...');
    const authService = AuthService.getInstance();
    const token = await authService.getValidToken();

    try {
      // Make both API calls in parallel
      const [departuresResponse, departuresForArrivalsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/productservice/getdepartures`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ProductType: 1,
            culture: 'en-US'
          }),
        }),
        fetch(`${API_BASE_URL}/api/productservice/getdepartures`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ProductType: 1,
            culture: 'en-US'
          }),
        })
      ]);

      if (!departuresResponse.ok) {
        throw new Error(`Failed to fetch departures: ${departuresResponse.status}`);
      }

      const departuresResult = await departuresResponse.json();
      
      if (!departuresResult?.header?.success || !departuresResult?.body?.locations) {
        throw new Error('Failed to get departure locations');
      }

      // Find first departure city for arrivals call
      const firstDeparture = departuresResult.body.locations.find((loc: any) => loc.type === 2);
      
      if (!firstDeparture) {
        throw new Error('No departure cities found');
      }

      // Get arrivals
      const arrivalsResponse = await fetch(`${API_BASE_URL}/api/productservice/getarrivals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ProductType: 1,
          DepartureLocations: [
            {
              Type: firstDeparture.type,
              Id: firstDeparture.id
            }
          ],
          culture: 'en-US'
        }),
      });

      if (!arrivalsResponse.ok) {
        throw new Error(`Failed to fetch arrivals: ${arrivalsResponse.status}`);
      }

      const arrivalsResult = await arrivalsResponse.json();

      if (!arrivalsResult?.header?.success || !arrivalsResult?.body?.locations) {
        throw new Error('Failed to get arrival locations');
      }

      // Process and cache the data
      const departures: CachedLocation[] = departuresResult.body.locations
        .filter((location: any) => location.type === 2)
        .map((location: any) => ({
          id: location.id,
          name: location.name,
          type: location.type,
          code: location.code,
          parentId: location.parentId,
          countryId: location.countryId,
          latitude: location.latitude,
          longitude: location.longitude
        }));

      const arrivals: CachedLocation[] = arrivalsResult.body.locations
        .filter((location: any) => location.type === 1 || location.type === 2)
        .map((location: any) => ({
          id: location.id,
          name: location.name,
          type: location.type,
          code: location.code,
          parentId: location.parentId,
          countryId: location.countryId,
          latitude: location.latitude,
          longitude: location.longitude
        }));

      // Cache the results
      cacheService.setCachedLocations(departures, arrivals);

      return { departures, arrivals };

    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  async getDepartureList(): Promise<ApiResponse<DepartureAirport>> {
    try {
      const { departures } = await this.fetchLocationsWithCache();
      
      const departureAirports = departures.map(location => ({
        Code: location.id,
        Name: location.name
      }));

      return {
        success: true,
        data: departureAirports,
      };
    } catch (error) {
      console.error('Error getting departure list:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch departure airports',
      };
    }
  }

  async getRegionList(): Promise<ApiResponse<Region>> {
    try {
      const { arrivals } = await this.fetchLocationsWithCache();
      
      const regions = arrivals.map(location => ({
        Code: parseInt(location.id),
        Name: location.name
      }));

      return {
        success: true,
        data: regions,
      };
    } catch (error) {
      console.error('Error getting region list:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch regions',
      };
    }
  }

  async getCheckinDates(departurePoint: string, regionList: number[], duration: number = 7): Promise<CheckinDatesResponse> {
    const authService = AuthService.getInstance();
    const token = await authService.getValidToken();

    console.log('Fetching check-in dates...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/productservice/getcheckindates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ProductType: 1,
          DepartureLocations: [
            {
              Id: departurePoint,
              Type: 2
            }
          ],
          ArrivalLocations: regionList.map(id => ({
            Id: id.toString(),
            Type: 2
          })),
          IncludeSubLocations: true,
          culture: 'en-US'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch check-in dates: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Check-in dates response:', result);

      if (result && result.header && result.header.success && result.body && result.body.dates) {
        const dates = result.body.dates.map((date: string) => date.split('T')[0]);
        return {
          success: true,
          data: dates,
        };
      } else {
        return {
          success: false,
          message: result?.header?.messages?.[0]?.message || 'No available check-in dates for the selected departure and destination.',
        };
      }
    } catch (error) {
      console.error('Error fetching check-in dates:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch check-in dates',
      };
    }
  }

  async getNights(departurePoint: string, regionList: number[], checkIn: string): Promise<NightsResponse> {
    const authService = AuthService.getInstance();
    const token = await authService.getValidToken();

    console.log('Fetching available nights...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/productservice/getnights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ProductType: 1,
          DepartureLocations: [
            {
              Id: departurePoint,
              Type: 2
            }
          ],
          ArrivalLocations: regionList.map(id => ({
            Id: id.toString(),
            Type: 2
          })),
          IncludeSubLocations: true,
          CheckIn: checkIn,
          culture: 'en-US'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch nights: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Nights response:', result);

      if (result && result.header && result.header.success && result.body && result.body.nights) {
        return {
          success: true,
          data: result.body.nights,
        };
      } else {
        return {
          success: false,
          message: result?.header?.messages?.[0]?.message || 'No available durations for your selected options.',
        };
      }
    } catch (error) {
      console.error('Error fetching nights:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch available nights',
      };
    }
  }

  async getPriceRange(departurePoint: string, regionList: number[], checkIn: string, duration: number): Promise<PriceRangeResponse> {
    const authService = AuthService.getInstance();
    const token = await authService.getValidToken();

    console.log('Fetching price range...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/productservice/pricesearch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ProductType: 1,
          DepartureLocations: [
            {
              Id: departurePoint,
              Type: 2
            }
          ],
          ArrivalLocations: regionList.map(id => ({
            Id: id.toString(),
            Type: 2
          })),
          IncludeSubLocations: true,
          CheckIn: checkIn,     
          Night: duration,
          Products: [],
          RoomCriteria: [
            {
              Adult: 2,
              ChildAges: []
            }
          ],
          CheckAllotment: false,
          CheckStopSale: false,
          Nationality: 'XK',
          currency: 'EUR',
          culture: 'en-US'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch price range: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Price range response:', result);

      if (result && result.header && result.header.success && result.body && result.body.hotels) {
        let minPrice = Infinity;
        let maxPrice = -Infinity;

        result.body.hotels.forEach((hotel: any) => {
          hotel.offers?.forEach((offer: any) => {
            if (offer.price && offer.price.amount) {
              minPrice = Math.min(minPrice, offer.price.amount);
              maxPrice = Math.max(maxPrice, offer.price.amount);
            }
          });
        });

        if (minPrice !== Infinity && maxPrice !== -Infinity) {
          return {
            success: true,
            data: {
              PriceMin: minPrice,
              PriceMax: maxPrice,
              Currency: result.body.hotels[0]?.offers?.[0]?.price?.currency || 'EUR'
            },
          };
        }
      }
      
      return {
        success: false,
        message: result?.header?.messages?.[0]?.message || 'No packages available in the selected range.',
      };
    } catch (error) {
      console.error('Error fetching price range:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch price range',
      };
    }
  }
}

export default LocationService;
export type { DepartureAirport, Region, CheckinDatesResponse, NightsResponse, PriceRangeResponse };
