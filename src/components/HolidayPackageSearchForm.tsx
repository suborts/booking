
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon, Search, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Room } from '@/types/holidayPackage';
import HolidayPackageService from '@/services/holidayPackageService';
import LocationService, { DepartureAirport, Region } from '@/services/locationService';
import HolidayPackageResults from './HolidayPackageResults';

interface FormData {
  departureAirport: string;
  checkInDate: Date;
  destination: number;
  nationality: string;
  duration: number;
  rooms: Room[];
}

const HolidayPackageSearchForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [departureAirports, setDepartureAirports] = useState<DepartureAirport[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [dataError, setDataError] = useState<string>('');
  
  const form = useForm<FormData>({
    defaultValues: {
      departureAirport: '',
      checkInDate: new Date(),
      destination: 0,
      nationality: '',
      duration: 7,
      rooms: [{ Adult: 2, Child: 0, ChildAges: [] }],
    },
  });

  const departureAirport = form.watch('departureAirport');
  const destination = form.watch('destination');
  const checkInDate = form.watch('checkInDate');
  const rooms = form.watch('rooms');

  // Load departure airports and regions on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      setDataError('');
      
      const locationService = LocationService.getInstance();
      
      try {
        const [departuresResult, regionsResult] = await Promise.all([
          locationService.getDepartureList(),
          locationService.getRegionList()
        ]);

        if (departuresResult.success && departuresResult.data) {
          setDepartureAirports(departuresResult.data);
        } else {
          setDataError(prev => prev + (departuresResult.message || 'Failed to load departure airports') + '. ');
        }

        if (regionsResult.success && regionsResult.data) {
          setRegions(regionsResult.data);
        } else {
          setDataError(prev => prev + (regionsResult.message || 'Failed to load regions') + '. ');
        }
      } catch (error) {
        setDataError('Failed to load data. Please try again.');
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Load available check-in dates when departure and destination change
  useEffect(() => {
    const loadCheckinDates = async () => {
      if (!departureAirport || !destination) {
        setAvailableDates([]);
        return;
      }

      setIsLoadingDates(true);
      const locationService = LocationService.getInstance();
      
      try {
        const result = await locationService.getCheckinDates(departureAirport, [destination], 7);
        if (result.success && result.data) {
          setAvailableDates(result.data);
        } else {
          setAvailableDates([]);
          toast({
            title: "Check-in Dates",
            description: result.message || "No available check-in dates for the selected departure and destination.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error loading check-in dates:', error);
        setAvailableDates([]);
      } finally {
        setIsLoadingDates(false);
      }
    };

    loadCheckinDates();
  }, [departureAirport, destination]);

  // Update nationality when departure airport changes
  React.useEffect(() => {
    if (departureAirport) {
      const airport = departureAirports.find(a => a.Code === departureAirport);
      if (airport) {
        let nationality = '';
        if (airport.Name.toLowerCase().includes('prishtinë') || airport.Name.toLowerCase().includes('pristina')) {
          nationality = 'XK'; // Kosovo
        } else if (airport.Name.toLowerCase().includes('skopje')) {
          nationality = 'MK'; // Macedonia
        } else {
          nationality = 'TR';
        }
        form.setValue('nationality', nationality);
      }
    }
  }, [departureAirport, departureAirports, form]);

  const updateRoom = (field: keyof Room, value: any) => {
    const currentRoom = rooms[0];
    const updatedRoom = { ...currentRoom, [field]: value };
    
    // If children count changes, update child ages array
    if (field === 'Child') {
      const childCount = value as number;
      updatedRoom.ChildAges = Array.from({ length: childCount }, (_, i) => 
        currentRoom.ChildAges[i] || 1
      );
    }
    
    form.setValue('rooms', [updatedRoom]);
  };

  const updateChildAge = (childIndex: number, age: number) => {
    const currentRoom = { ...rooms[0] };
    currentRoom.ChildAges[childIndex] = age;
    form.setValue('rooms', [currentRoom]);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setSearchResults([]);

    try {
      const holidayPackageService = HolidayPackageService.getInstance();
      
      const searchParams = {
        Language: 'EN',
        Currency: 'EUR',
        DeparturePoint: data.departureAirport,
        RegionList: [data.destination],
        CheckIn: format(data.checkInDate, 'yyyy-MM-dd'),
        Duration: data.duration,
        Rooms: data.rooms,
        Nationality: data.nationality,
        SortType: 1,
      };

      const result = await holidayPackageService.searchHolidayPackages(searchParams);
      
      if (result.success) {
        setSearchResults(result.data || []);
        toast({
          title: "Search Completed",
          description: `Found ${result.data?.length || 0} holiday packages`,
        });
      } else {
        toast({
          title: "Search Failed",
          description: result.message || "No results found",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check if a date is available
  const isDateAvailable = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return availableDates.includes(dateString);
  };

  if (isLoadingData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading departure airports and destinations...</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Error Loading Data</p>
          <p className="text-gray-600">{dataError}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const currentRoom = rooms[0] || { Adult: 2, Child: 0, ChildAges: [] };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Holiday Package Search</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Single line search form */}
            <div className="flex flex-wrap items-end gap-4">
              {/* From */}
              <FormField
                control={form.control}
                name="departureAirport"
                render={({ field }) => (
                  <FormItem className="flex-shrink-0">
                    <FormLabel className="text-sm">From:</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select airport" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departureAirports.map((airport) => (
                          <SelectItem key={airport.Code} value={airport.Code}>
                            {airport.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* To */}
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem className="flex-shrink-0">
                    <FormLabel className="text-sm">To:</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.Code} value={region.Code.toString()}>
                            {region.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Departure Date */}
              <FormField
                control={form.control}
                name="checkInDate"
                render={({ field }) => (
                  <FormItem className="flex-shrink-0">
                    <FormLabel className="text-sm">Departure Date:</FormLabel>
                    {isLoadingDates && (
                      <p className="text-xs text-gray-500">Loading...</p>
                    )}
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-40 pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={availableDates.length === 0 || isLoadingDates}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Pick date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => !isDateAvailable(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration - fixed 7 days */}
              <div className="flex-shrink-0">
                <FormLabel className="text-sm">Duration:</FormLabel>
                <div className="h-10 px-3 py-2 bg-gray-50 border border-input rounded-md text-sm flex items-center">
                  7 days
                </div>
              </div>

              {/* Adults */}
              <div className="flex-shrink-0">
                <FormLabel className="text-sm">Adults:</FormLabel>
                <div className="flex items-center space-x-1 h-10">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateRoom('Adult', Math.max(1, currentRoom.Adult - 1))}
                    disabled={currentRoom.Adult <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max="4"
                    value={currentRoom.Adult}
                    onChange={(e) => updateRoom('Adult', parseInt(e.target.value))}
                    className="w-12 h-8 text-center text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateRoom('Adult', Math.min(4, currentRoom.Adult + 1))}
                    disabled={currentRoom.Adult >= 4}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Kids */}
              <div className="flex-shrink-0">
                <FormLabel className="text-sm">Kids:</FormLabel>
                <div className="flex items-center space-x-1 h-10">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateRoom('Child', Math.max(0, currentRoom.Child - 1))}
                    disabled={currentRoom.Child <= 0}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max="3"
                    value={currentRoom.Child}
                    onChange={(e) => updateRoom('Child', parseInt(e.target.value))}
                    className="w-12 h-8 text-center text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateRoom('Child', Math.min(3, currentRoom.Child + 1))}
                    disabled={currentRoom.Child >= 3}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Kids Ages */}
              {currentRoom.Child > 0 && (
                <div className="flex-shrink-0">
                  <FormLabel className="text-sm">Kids Age:</FormLabel>
                  <div className="flex gap-1 h-10 items-center">
                    {Array.from({ length: currentRoom.Child }, (_, childIndex) => (
                      <Select
                        key={childIndex}
                        value={(currentRoom.ChildAges[childIndex] || 1).toString()}
                        onValueChange={(value) => updateChildAge(childIndex, parseInt(value))}
                      >
                        <SelectTrigger className="w-16 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 14 }, (_, i) => i + 1).map((age) => (
                            <SelectItem key={age} value={age.toString()}>
                              {age}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Button */}
              <Button type="submit" disabled={isLoading} className="h-10">
                <Search className="mr-2 h-4 w-4" />
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Search Results */}
      <HolidayPackageResults results={searchResults} isLoading={isLoading} />
    </div>
  );
};

export default HolidayPackageSearchForm;
