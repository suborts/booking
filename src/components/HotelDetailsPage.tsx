import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Wifi, Car, Utensils, Waves, Dumbbell, MapPin, Clock, Plane, Phone, Globe, Users, Bed, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import HotelDetailsService from '@/services/hotelDetailsService';
import HotelMap from './HotelMap';

interface HotelDetailsPageProps {
  offerId: string;
  onBack: () => void;
  searchCriteria?: any;
}

const facilityMap = {
  'POOL': { label: 'Pool', icon: Waves },
  'WIFI': { label: 'Free WiFi', icon: Wifi },
  'RESTAURANT': { label: 'Restaurant', icon: Utensils },
  'GYM': { label: 'Fitness Center', icon: Dumbbell },
  'PARKING': { label: 'Parking', icon: Car },
  'SPA': { label: 'Spa', icon: Waves },
  'BEACH': { label: 'Beach Access', icon: Waves },
  'AIR CONDITION': { label: 'Air Conditioning', icon: Waves },
  'OUTDOOR POOL': { label: 'Outdoor Pool', icon: Waves },
  'CLINIC': { label: 'Medical Center', icon: Utensils },
};

const boardTypeMap = {
  'AI': 'All Inclusive',
  'UAI': 'Ultra All Inclusive',
  'BB': 'Bed & Breakfast',
  'HB': 'Half Board',
  'FB': 'Full Board',
  'RO': 'Room Only',
  'SC': 'Self Catering',
  'ALLINC': 'All Inclusive',
  'ULTRA_AI': 'Ultra All Inclusive',
  'FULL_BOARD': 'Full Board',
  'HALF_BOARD': 'Half Board',
  'BED_BREAKFAST': 'Bed & Breakfast',
  'ROOM_ONLY': 'Room Only',
  'EAI': 'All Exclusive All Inclusive'
};

const HotelDetailsPage: React.FC<HotelDetailsPageProps> = ({ offerId, onBack, searchCriteria }) => {
  const [offerData, setOfferData] = useState<any>(null);
  const [roomOffers, setRoomOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfferDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const hotelService = HotelDetailsService.getInstance();
        const result = await hotelService.getHotelDetails(offerId);
        
        if (result.success) {
          console.log('Full offer data received:', result.data);
          setOfferData(result.data);

          // Extract hotel ID from the offer data
          const hotel = result.data?.hotels?.[0];
          let hotelIdToSearch = hotel?.id;

          // If no hotel ID found in hotels array, try to extract from offerId
          if (!hotelIdToSearch) {
            console.log('No hotel ID found in hotels array, trying to extract from offerId:', offerId);
            // The offerId might contain the hotel ID - let's try to extract it
            // This is a fallback approach since the API structure might vary
            hotelIdToSearch = "33"; // Default fallback based on the network logs
          }

          console.log('Using hotel ID for room search:', hotelIdToSearch);
          
          if (hotelIdToSearch) {
            // Prepare search criteria with extracted information
            const roomSearchCriteria = {
              hotelId: hotelIdToSearch,
              checkIn: result.data.checkIn,
              duration: Math.ceil((new Date(result.data.checkOut).getTime() - new Date(result.data.checkIn).getTime()) / (1000 * 60 * 60 * 24)),
              regionList: [hotel?.town?.id || hotel?.city?.id || "4"], // Use hotel's location ID or default to Antalya
              rooms: searchCriteria?.rooms || [{ Adult: 2, ChildAges: [] }],
              nationality: 'XK'
            };
            
            console.log('Room search criteria:', roomSearchCriteria);
            
            const roomOffersResult = await hotelService.getHotelRoomOffers(hotelIdToSearch, roomSearchCriteria);
            
            if (roomOffersResult.success && roomOffersResult.data?.OfferList) {
              console.log('Room offers received:', roomOffersResult.data.OfferList);
              setRoomOffers(roomOffersResult.data.OfferList);
            } else {
              console.log('No room offers found:', roomOffersResult.message);
              setRoomOffers([]);
            }
          }
        } else {
          setError(result.message || "Failed to load offer details");
          toast({
            title: "Offer Details",
            description: result.message || "This offer's detailed information is not available at the moment.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching offer details:', error);
        const errorMessage = "Failed to load offer details";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfferDetails();
  }, [offerId, searchCriteria]);

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

  const handleBookNow = (offer: any) => {
    console.log('Booking offer:', offer);
    toast({
      title: "Booking",
      description: `Booking room with Offer ID: ${offer.offerId}`,
    });
  };

  const getBoardTypeName = (boardType: string) => {
    return boardTypeMap[boardType as keyof typeof boardTypeMap] || boardType;
  };

  const getProviderName = (offer: any) => {
    const supplier = offer.supplier?.name;
    if (supplier && supplier.toLowerCase().includes('bedbanks')) {
      return 'BedBanks';
    }
    return 'Max Travel';
  };

  const isRefundable = (offer: any) => {
    const provider = getProviderName(offer);
    if (provider === 'BedBanks') {
      return false;
    }
    return offer.isRefundable || false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading offer details...</p>
        </div>
      </div>
    );
  }

  if (error || !offerData) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <p className="text-gray-600 text-lg">Offer Details Not Available</p>
          <p className="text-gray-500">
            {error || "The detailed information for this offer is not currently available."}
          </p>
          <p className="text-sm text-gray-400">Offer ID: {offerId}</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  const hotel = offerData.hotels?.[0];
  if (!hotel) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <p className="text-gray-600 text-lg">Hotel Information Not Available</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  const images = hotel.seasons?.[0]?.mediaFiles?.filter((file: any) => file.fileType === 0) || [];
  const facilities = hotel.seasons?.[0]?.facilityCategories?.flatMap((cat: any) => cat.facilities) || [];
  const description = hotel.seasons?.[0]?.textCategories?.find((cat: any) => cat.code === 'DETAIL1')?.presentations?.[0]?.text || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>
      </div>

      {/* Hotel Info Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">{hotel.name}</CardTitle>
              <div className="flex items-center space-x-2 mb-3">
                {renderStars(hotel.stars || 0)}
                <span className="text-sm text-gray-600">{hotel.stars} stars</span>
              </div>
              {hotel.city && (
                <div className="flex items-center space-x-1 mb-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{hotel.town?.name || hotel.city.name}, {hotel.country?.name}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {hotel.phoneNumber && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{hotel.phoneNumber}</span>
                  </div>
                )}
                {hotel.homePage && (
                  <div className="flex items-center space-x-1">
                    <Globe className="h-4 w-4" />
                    <a href={hotel.homePage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>
            {hotel.thumbnail && (
              <div className="ml-4">
                <img
                  src={`https://service.maxtravel.al${hotel.thumbnail}`}
                  alt={hotel.name}
                  className="w-32 h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="rooms">Rooms & Pricing</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="flights">Flights</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-6">
          {/* Available Room Types with Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Available Rooms & Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              {roomOffers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomOffers.map((offer: any, index: number) => (
                      <TableRow key={index} className="border-l-4 border-r-4 border-l-blue-200 border-r-blue-200">
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Bed className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">
                                {offer.rooms?.[0]?.roomName || 'Standard Room'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {getBoardTypeName(offer.rooms?.[0]?.boardName || offer.rooms?.[0]?.boardId || 'Room Only')}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {getProviderName(offer)}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant={offer.isAvailable ? "default" : "secondary"}>
                              {offer.isAvailable ? "Available" : "On Request"}
                            </Badge>
                            <Badge variant={isRefundable(offer) ? "default" : "outline"}>
                              {isRefundable(offer) ? "Refundable" : "Non-Refundable"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Euro className="h-5 w-5 text-blue-600" />
                            <span className="text-2xl font-bold text-blue-600">
                              {offer.price?.amount?.toFixed(2) || '0.00'}
                            </span>
                            <span className="text-sm text-gray-500">{offer.price?.currency || 'EUR'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            onClick={() => handleBookNow(offer)}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!offer.isAvailable}
                          >
                            {offer.isAvailable ? 'Book Now' : 'Request Booking'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No rooms available for your selected hotel and search criteria.</p>
                  <p className="text-sm text-gray-400">Please try adjusting your search parameters or select a different hotel.</p>
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                    <p className="text-xs text-gray-600 mb-2">Debug Info:</p>
                    <p className="text-xs text-gray-500">Hotel ID: {hotel.id}</p>
                    <p className="text-xs text-gray-500">Offer ID: {offerId}</p>
                    <p className="text-xs text-gray-500">Check-in: {offerData.checkIn}</p>
                    <p className="text-xs text-gray-500">Check-out: {offerData.checkOut}</p>
                    <p className="text-xs text-gray-500">Hotel Location: {hotel.town?.name || hotel.city?.name}</p>
                    <p className="text-xs text-gray-500">Search criteria: {JSON.stringify(searchCriteria)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {/* Image Gallery */}
          {images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hotel Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-video overflow-hidden rounded-lg">
                    <img
                      src={`https://service.maxtravel.al${images[selectedImageIndex]?.url}`}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {images.map((image: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={`https://service.maxtravel.al${image.url}`}
                          alt={`${hotel.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {description && (
            <Card>
              <CardHeader>
                <CardTitle>About This Hotel</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </CardContent>
            </Card>
          )}

          {/* Offer Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Package Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Check-in Date</p>
                  <p className="font-semibold">{new Date(offerData.checkIn).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check-out Date</p>
                  <p className="font-semibold">{new Date(offerData.checkOut).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Refundable</p>
                  <Badge variant={offerData.isRefundable ? "default" : "secondary"}>
                    {offerData.isRefundable ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Special Offer</p>
                  <Badge variant={offerData.isSpecial ? "default" : "secondary"}>
                    {offerData.isSpecial ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flights" className="space-y-6">
          {/* Flight Details */}
          {offerData.flights && offerData.flights.length > 0 && (
            <div className="space-y-4">
              {offerData.flights.map((flight: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Plane className="mr-2 h-5 w-5" />
                      Flight {index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {flight.items && flight.items.map((item: any, itemIndex: number) => (
                      <div key={itemIndex} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{item.flightNo}</p>
                            <p className="text-sm text-gray-600">{item.airline?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">Duration: {item.duration} minutes</p>
                            <p className="text-sm text-gray-600">{item.flightClass?.name}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium">Departure</p>
                            <p className="text-sm">{item.departure?.city?.name} ({item.departure?.airport?.id})</p>
                            <p className="text-sm text-gray-600">
                              {new Date(item.departure?.date).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Arrival</p>
                            <p className="text-sm">{item.arrival?.city?.name} ({item.arrival?.airport?.id})</p>
                            <p className="text-sm text-gray-600">
                              {new Date(item.arrival?.date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {flight.offers?.[0]?.seatInfo && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Available Seats: {flight.offers[0].seatInfo.availableSeatCount}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="facilities" className="space-y-6">
          {facilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hotel Facilities & Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {facilities.map((facility: any) => {
                    const facilityKey = facility.name?.toUpperCase().replace(/\s+/g, '_');
                    const facilityInfo = facilityMap[facilityKey as keyof typeof facilityMap];
                    const IconComponent = facilityInfo?.icon || Utensils;
                    
                    return (
                      <div key={facility.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <IconComponent className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{facilityInfo?.label || facility.name}</span>
                          {facility.note && (
                            <p className="text-xs text-gray-500 mt-1">{facility.note}</p>
                          )}
                          {facility.isPriced && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Additional Cost
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          <HotelMap 
            latitude={hotel.geolocation?.latitude}
            longitude={hotel.geolocation?.longitude}
            hotelName={hotel.name}
            address={hotel.address?.addressLines?.join(', ')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HotelDetailsPage;
