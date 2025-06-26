
import React from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HotelMapProps {
  latitude?: string;
  longitude?: string;
  hotelName: string;
  address?: string;
}

const HotelMap: React.FC<HotelMapProps> = ({ latitude, longitude, hotelName, address }) => {
  if (!latitude || !longitude) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MapPin className="mx-auto h-12 w-12 mb-2" />
            <p>Location information not available</p>
            {address && <p className="text-sm mt-2">{address}</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dO2TjSB3JYZE1E&q=${latitude},${longitude}&zoom=15`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="mr-2 h-5 w-5" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {address && (
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 mt-1 text-gray-500" />
              <p className="text-sm text-gray-700">{address}</p>
            </div>
          )}
          <div className="aspect-video overflow-hidden rounded-lg">
            <iframe
              src={googleMapsUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${hotelName} Location`}
            />
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
          >
            <MapPin className="mr-1 h-4 w-4" />
            View on Google Maps
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default HotelMap;
