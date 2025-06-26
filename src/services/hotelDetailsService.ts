
import AuthService from './authService';

const API_BASE_URL = 'https://service.maxtravel.al';

export interface OfferDetailsRequest {
  offerIds: string[];
  getProductInfo: boolean;
  currency: string;
  culture: string;
}

export interface PriceSearchRequest {
  ProductType: number;
  DepartureLocations: Array<{
    Id: string;
    Type: number;
  }>;
  ArrivalLocations: Array<{
    Id: string;
    Type: number;
  }>;
  IncludeSubLocations: boolean;
  CheckIn: string;
  Night: number;
  Products?: string[];
  RoomCriteria: Array<{
    Adult: number;
    ChildAges: number[];
  }>;
  CheckAllotment: boolean;
  CheckStopSale: boolean;
  Nationality: string;
  currency: string;
  culture: string;
}

export interface AdditionalParametersRequest {
  currency: string;
  culture: string;
  includeSubLocations: boolean;
  departure: number;
  arrival: number;
  checkin: string;
  night: number;
  productType: number;
  getHotels: boolean;
  getBoards: boolean;
  getStars: boolean;
  getHolidayPackages: boolean;
  packageCategory: null;
}

export interface HotelDetailsResponse {
  success: boolean;
  data?: any;
  message?: string;
}

class HotelDetailsService {
  private static instance: HotelDetailsService;

  static getInstance(): HotelDetailsService {
    if (!HotelDetailsService.instance) {
      HotelDetailsService.instance = new HotelDetailsService();
    }
    return HotelDetailsService.instance;
  }

  async getHotelRoomOffers(hotelId: string, searchCriteria: any): Promise<HotelDetailsResponse> {
    const authService = AuthService.getInstance();
    const token = await authService.getValidToken();

    console.log('Getting room offers for hotel:', hotelId, 'with criteria:', searchCriteria);

    try {
      // Use the correct TourVisio API endpoint for price search
      const requestBody: PriceSearchRequest = {
        ProductType: 1, // Holiday Package
        DepartureLocations: [
          {
            Id: "2", // Prishtina
            Type: 2 // City type
          }
        ],
        ArrivalLocations: [
          {
            Id: searchCriteria.regionList?.[0]?.toString() || "4", // Use the region from criteria or default to Antalya
            Type: 2 // City type
          }
        ],
        IncludeSubLocations: true,
        CheckIn: searchCriteria.checkIn?.split('T')[0] || "2025-09-12", // Extract date part
        Night: searchCriteria.duration || 7,
        Products: [hotelId], // Filter by specific hotel
        RoomCriteria: searchCriteria.rooms || [{ Adult: 2, ChildAges: [] }],
        CheckAllotment: false,
        CheckStopSale: false,
        Nationality: searchCriteria.nationality || "XK",
        currency: "EUR",
        culture: "en-US"
      };

      console.log('Sending PriceSearch request:', requestBody);

      const response = await fetch(`${API_BASE_URL}/api/productservice/pricesearch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('PriceSearch response:', result);

      if (result.header && result.header.success) {
        // Look for the specific hotel in the results
        const hotels = result.body?.hotels || [];
        console.log('Hotels found in search:', hotels.length);
        console.log('Looking for hotel ID:', hotelId);
        console.log('Available hotel IDs:', hotels.map((h: any) => h.id));
        
        const targetHotel = hotels.find((hotel: any) => hotel.id === hotelId);
        
        if (targetHotel && targetHotel.offers) {
          console.log('Found hotel offers:', targetHotel.offers);
          return {
            success: true,
            data: { OfferList: targetHotel.offers },
          };
        } else {
          // If exact hotel not found, try to find any offers from the search results
          const allOffers = hotels.flatMap((hotel: any) => hotel.offers || []);
          if (allOffers.length > 0) {
            console.log('Using offers from available hotels:', allOffers);
            return {
              success: true,
              data: { OfferList: allOffers },
            };
          } else {
            console.log('No offers found for hotel ID:', hotelId);
            return {
              success: false,
              message: 'No offers found for this hotel',
            };
          }
        }
      } else {
        return {
          success: false,
          message: result.header?.messages[0]?.message || 'Failed to get room offers',
        };
      }
    } catch (error) {
      console.error('Room offers error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get room offers',
      };
    }
  }

  async getHotelDetails(offerId: string): Promise<HotelDetailsResponse> {
    const authService = AuthService.getInstance();
    const token = await authService.getValidToken();

    console.log('Getting offer details for:', offerId);

    try {
      const requestBody: OfferDetailsRequest = {
        offerIds: [offerId],
        getProductInfo: true,
        currency: 'EUR',
        culture: 'en-US'
      };

      const response = await fetch(`${API_BASE_URL}/api/productservice/getofferdetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Offer details response:', result);

      if (result.header && result.header.success) {
        return {
          success: true,
          data: result.body?.offerDetails?.[0] || result.body,
        };
      } else {
        return {
          success: false,
          message: result.header?.messages[0]?.message || 'Failed to get offer details',
        };
      }
    } catch (error) {
      console.error('Offer details error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get offer details',
      };
    }
  }

  async getAdditionalParameters(departure: number, arrival: number, checkin: string, night: number): Promise<HotelDetailsResponse> {
    const authService = AuthService.getInstance();
    const token = await authService.getValidToken();

    try {
      const requestBody: AdditionalParametersRequest = {
        currency: 'EUR',
        culture: 'en-US',
        includeSubLocations: true,
        departure,
        arrival,
        checkin,
        night,
        productType: 1,
        getHotels: true,
        getBoards: true,
        getStars: true,
        getHolidayPackages: false,
        packageCategory: null
      };

      const response = await fetch(`${API_BASE_URL}/api/lookupservice/getAdditionalPriceSearchParameters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Additional parameters response:', result);

      if (result.header && result.header.success) {
        return {
          success: true,
          data: result.body,
        };
      } else {
        return {
          success: false,
          message: result.header?.messages[0]?.message || 'Failed to get additional parameters',
        };
      }
    } catch (error) {
      console.error('Additional parameters error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get additional parameters',
      };
    }
  }

  async getPriceCalculation(offerId: string): Promise<HotelDetailsResponse> {
    const authService = AuthService.getInstance();
    const token = await authService.getValidToken();

    try {
      const response = await fetch(`${API_BASE_URL}/GetPriceCalculation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          SessionId: token,
          OfferId: offerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Price calculation response:', result);

      if (result.header && result.header.success) {
        return {
          success: true,
          data: result.body,
        };
      } else {
        return {
          success: false,
          message: result.header?.messages[0]?.message || 'Failed to get price calculation',
        };
      }
    } catch (error) {
      console.error('Price calculation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get price calculation',
      };
    }
  }
}

export default HotelDetailsService;
