
export interface Room {
  Adult: number;
  Child: number;
  ChildAges: number[];
}

export interface HolidayPackageSearchRequest {
  SessionId: string;
  Language: string;
  Currency: string;
  DeparturePoint: string;
  RegionList: number[];
  CheckIn: string;
  Duration: number;
  Rooms: Room[];
  Nationality: string;
  SortType: number;
}

export interface HolidayPackageSearchResponse {
  // Define response structure based on API documentation
  success: boolean;
  data?: any[];
  message?: string;
}

export interface DepartureAirport {
  code: string;
  name: string;
  nationality: string;
}

export interface Destination {
  code: number;
  name: string;
}
