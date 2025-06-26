
interface CachedLocation {
  id: string;
  name: string;
  type: number;
  code?: string;
  parentId?: string;
  countryId?: string;
  latitude?: string;
  longitude?: string;
}

interface LocationCache {
  departures: CachedLocation[];
  arrivals: CachedLocation[];
  lastUpdated: number;
}

class LocationCacheService {
  private static instance: LocationCacheService;
  private cache: LocationCache | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static getInstance(): LocationCacheService {
    if (!LocationCacheService.instance) {
      LocationCacheService.instance = new LocationCacheService();
    }
    return LocationCacheService.instance;
  }

  isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.lastUpdated < this.CACHE_DURATION;
  }

  getCachedDepartures(): CachedLocation[] | null {
    if (!this.isCacheValid()) return null;
    return this.cache?.departures || null;
  }

  getCachedArrivals(): CachedLocation[] | null {
    if (!this.isCacheValid()) return null;
    return this.cache?.arrivals || null;
  }

  setCachedLocations(departures: CachedLocation[], arrivals: CachedLocation[]): void {
    this.cache = {
      departures,
      arrivals,
      lastUpdated: Date.now()
    };
    console.log('Location cache updated');
  }

  clearCache(): void {
    this.cache = null;
    console.log('Location cache cleared');
  }

  findDepartureById(id: string): CachedLocation | null {
    const departures = this.getCachedDepartures();
    if (!departures) return null;
    return departures.find(dep => dep.id === id || dep.code === id) || null;
  }

  findArrivalById(id: string): CachedLocation | null {
    const arrivals = this.getCachedArrivals();
    if (!arrivals) return null;
    return arrivals.find(arr => arr.id === id) || null;
  }
}

export default LocationCacheService;
export type { CachedLocation };
