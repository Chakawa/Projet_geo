import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Truck, Coffee, CheckCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { Vehicle } from '../types/vehicle';

// Coordonnées de l'INPHB à Yamoussoukro
const INPHB_COORDS: [number, number] = [6.8789, -5.2424];

// Création d'une icône personnalisée pour les véhicules
const createVehicleIcon = (status: Vehicle['status']) => {
  const color = status === 'en-route' ? '#3B82F6' : 
                status === 'paused' ? '#F59E0B' : 
                '#10B981';
                
  return new Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${
      status === 'en-route' ? 'blue' : 
      status === 'paused' ? 'orange' : 
      'green'
    }.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

interface MapProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
}

const getStatusColor = (status: Vehicle['status']) => {
  switch (status) {
    case 'en-route':
      return 'text-blue-500';
    case 'paused':
      return 'text-yellow-500';
    case 'completed':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

const getStatusIcon = (status: Vehicle['status']) => {
  switch (status) {
    case 'en-route':
      return <Truck className="w-6 h-6" />;
    case 'paused':
      return <Coffee className="w-6 h-6" />;
    case 'completed':
      return <CheckCircle className="w-6 h-6" />;
    default:
      return null;
  }
};

export default function Map({ vehicles, selectedVehicle }: MapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  return (
    <MapContainer
      center={INPHB_COORDS}
      zoom={15}
      className="w-full h-[calc(100vh-4rem)]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {vehicles.map((vehicle) => (
        <div key={vehicle.id}>
          <Marker 
            position={vehicle.position}
            icon={createVehicleIcon(vehicle.status)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{vehicle.driverName}</h3>
                <p className="text-sm">Destination: {vehicle.destination}</p>
                <p className={`flex items-center gap-2 ${getStatusColor(vehicle.status)}`}>
                  {getStatusIcon(vehicle.status)}
                  {vehicle.status}
                </p>
              </div>
            </Popup>
          </Marker>
          {vehicle.route.length > 1 && (
            <Polyline
              positions={vehicle.route}
              color={vehicle.status === 'completed' ? '#10B981' : '#3B82F6'}
            />
          )}
        </div>
      ))}

      {userLocation && (
        <Marker position={userLocation}>
          <Popup>Votre position</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}