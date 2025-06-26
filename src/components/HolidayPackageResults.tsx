import React, { useState, useMemo } from 'react';
import { Star, Wifi, Car, Utensils, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import HotelDetailsPage from './HotelDetailsPage';

interface HolidayPackage {
  id: string;
  name: string;
  thumbnail?: string;
  stars: number;
  offers: Array<{
    price: { amount: number; currency: string };
    rooms: Array<{
      boardName: string;
      boardId: string;
    }>;
    offerId?: string;
  }>;
  city?: { name: string };
  country?: { name: string };
}

interface HolidayPackageResultsProps {
  results: HolidayPackage[];
  isLoading: boolean;
}

const boardTypeMap = {
  'AI': 'All Inclusive',
  'UAI': 'Ultra All Inclusive',
  'BB': 'Bed & Breakfast',
  'HB': 'Half Board',
  'FB': 'Full Board',
  'RO': 'Room Only',
  'SC': 'Self Catering',
};

const HolidayPackageResults: React.FC<HolidayPackageResultsProps> = ({ results, isLoading }) => {
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedBoardTypes, setSelectedBoardTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000]);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc'>('price_asc');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  // Calculate price range from results
  const { minPrice, maxPrice } = useMemo(() => {
    if (!results.length) return { minPrice: 0, maxPrice: 10000 };
    
    const prices = results.flatMap(pkg => 
      pkg.offers.map(offer => offer.price.amount)
    );
    
    return {
      minPrice: Math.floor(Math.min(...prices)),
      maxPrice: Math.ceil(Math.max(...prices))
    };
  }, [results]);

  // Update price range when results change
  React.useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = results.filter(pkg => {
      // Star rating filter
      if (selectedStars.length > 0 && !selectedStars.includes(Math.floor(pkg.stars))) {
        return false;
      }

      // Board type filter
      if (selectedBoardTypes.length > 0) {
        const hasBoardType = pkg.offers.some(offer =>
          offer.rooms.some(room => selectedBoardTypes.includes(room.boardId))
        );
        if (!hasBoardType) return false;
      }

      // Price range filter
      const packagePrice = Math.min(...pkg.offers.map(offer => offer.price.amount));
      if (packagePrice < priceRange[0] || packagePrice > priceRange[1]) {
        return false;
      }

      return true;
    });

    // Sort results
    filtered.sort((a, b) => {
      const priceA = Math.min(...a.offers.map(offer => offer.price.amount));
      const priceB = Math.min(...b.offers.map(offer => offer.price.amount));
      
      return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
    });

    return filtered;
  }, [results, selectedStars, selectedBoardTypes, priceRange, sortBy]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleStarFilter = (star: number, checked: boolean) => {
    if (checked) {
      setSelectedStars(prev => [...prev, star]);
    } else {
      setSelectedStars(prev => prev.filter(s => s !== star));
    }
  };

  const handleBoardTypeFilter = (boardType: string, checked: boolean) => {
    if (checked) {
      setSelectedBoardTypes(prev => [...prev, boardType]);
    } else {
      setSelectedBoardTypes(prev => prev.filter(b => b !== boardType));
    }
  };

  const handleViewDetails = (offerId: string) => {
    setSelectedOfferId(offerId);
  };

  const handleBackToResults = () => {
    setSelectedOfferId(null);
  };

  // Show hotel details page if an offer is selected
  if (selectedOfferId) {
    return (
      <HotelDetailsPage 
        offerId={selectedOfferId} 
        onBack={handleBackToResults}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for holiday packages...</p>
        </div>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No holiday packages found for your search criteria.</p>
        <p className="text-gray-500 mt-2">Try adjusting your filters or search parameters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filter Results</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Star Rating Filter */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Star Rating</Label>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(star => (
                <div key={star} className="flex items-center space-x-2">
                  <Checkbox
                    id={`star-${star}`}
                    checked={selectedStars.includes(star)}
                    onCheckedChange={(checked) => handleStarFilter(star, checked as boolean)}
                  />
                  <label htmlFor={`star-${star}`} className="flex items-center space-x-1 text-sm">
                    <span>{star}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Board Type Filter */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Board Type</Label>
            <div className="space-y-2">
              {Object.entries(boardTypeMap).map(([code, label]) => (
                <div key={code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`board-${code}`}
                    checked={selectedBoardTypes.includes(code)}
                    onCheckedChange={(checked) => handleBoardTypeFilter(code, checked as boolean)}
                  />
                  <label htmlFor={`board-${code}`} className="text-sm">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Price Range: €{priceRange[0]} - €{priceRange[1]}
            </Label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={maxPrice}
              min={minPrice}
              step={50}
              className="w-full"
            />
          </div>

          {/* Sort By */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Sort By</Label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'price_asc' | 'price_desc')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredAndSortedResults.length} of {results.length} packages
        </p>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedResults.map((pkg) => {
          const minOffer = pkg.offers.reduce((min, offer) => 
            offer.price.amount < min.price.amount ? offer : min
          );
          
          return (
            <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                {pkg.thumbnail && (
                  <img
                    src={`https://service.maxtravel.al${pkg.thumbnail}`}
                    alt={pkg.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                )}
              </CardHeader>
              
              <CardContent className="p-4">
                <CardTitle className="text-lg mb-2 line-clamp-2">{pkg.name}</CardTitle>
                
                <div className="flex items-center space-x-1 mb-2">
                  {renderStars(pkg.stars)}
                  <span className="text-sm text-gray-600 ml-2">{pkg.stars} stars</span>
                </div>
                
                <div className="space-y-2 mb-3">
                  {pkg.city && (
                    <p className="text-sm text-gray-600">
                      📍 {pkg.city.name}, {pkg.country?.name}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {minOffer.rooms[0] && (
                      <Badge variant="secondary" className="text-xs">
                        {boardTypeMap[minOffer.rooms[0].boardId as keyof typeof boardTypeMap] || minOffer.rooms[0].boardName}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Mock highlights */}
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Waves className="h-3 w-3" />
                      <span>Pool</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Wifi className="h-3 w-3" />
                      <span>WiFi</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Utensils className="h-3 w-3" />
                      <span>Restaurant</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0 flex items-center justify-between">
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    €{minOffer.price.amount}
                  </p>
                  <p className="text-xs text-gray-500">Total price</p>
                </div>
                <Button size="sm" onClick={() => handleViewDetails(minOffer.offerId || pkg.id)}>
                  View Details
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default HolidayPackageResults;
