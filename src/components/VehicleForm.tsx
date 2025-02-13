import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { supabase } from '../lib/supabase';
import type { Position } from '../types/vehicle';
import { MapPin, Car, User, Navigation } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (position: Position) => void;
}

function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const map = useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}

interface VehicleFormProps {
  onVehicleAdded: () => void;
}

export default function VehicleForm({ onVehicleAdded }: VehicleFormProps) {
  const [driverName, setDriverName] = useState('');
  const [driverSurname, setDriverSurname] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [position, setPosition] = useState<Position | null>(null);
  const [destination, setDestination] = useState<Position | null>(null);
  const [selectingDestination, setSelectingDestination] = useState(false);
  const [route, setRoute] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) {
      setError('Veuillez sélectionner une position sur la carte');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Insérer le véhicule
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          user_id: user.id,
          driver_name: driverName,
          driver_surname: driverSurname,
          vehicle_brand: vehicleBrand,
          current_position: `POINT(${position.lng} ${position.lat})`,
          status: 'paused'
        })
        .select()
        .single();

      if (vehicleError) throw vehicleError;

      // Si une destination est sélectionnée, créer une route
      if (destination && vehicle) {
        const { error: routeError } = await supabase
          .from('routes')
          .insert({
            vehicle_id: vehicle.id,
            start_position: `POINT(${position.lng} ${position.lat})`,
            end_position: `POINT(${destination.lng} ${destination.lat})`,
            route_points: route,
            status: 'active'
          });

        if (routeError) throw routeError;
      }

      onVehicleAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = useCallback((newPosition: Position) => {
    if (selectingDestination) {
      setDestination(newPosition);
      setSelectingDestination(false);
      
      // Calculer l'itinéraire si on a une position de départ
      if (position) {
        const routingControl = L.Routing.control({
          waypoints: [
            L.latLng(position.lat, position.lng),
            L.latLng(newPosition.lat, newPosition.lng)
          ],
          show: false,
          addWaypoints: false,
          routeWhileDragging: false
        });

        routingControl.on('routesfound', (e) => {
          const coordinates = e.routes[0].coordinates;
          setRoute(coordinates.map(coord => ({ lat: coord.lat, lng: coord.lng })));
        });

        routingControl.route();
      }
    } else {
      setPosition(newPosition);
    }
  }, [selectingDestination, position]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Ajouter un véhicule</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du conducteur
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nom"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom du conducteur
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={driverSurname}
                onChange={(e) => setDriverSurname(e.target.value)}
                className="pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Prénom"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marque du véhicule
          </label>
          <div className="relative">
            <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={vehicleBrand}
              onChange={(e) => setVehicleBrand(e.target.value)}
              className="pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Marque du véhicule"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position actuelle
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={position ? `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : ''}
                className="pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sélectionnez sur la carte"
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination (optionnel)
            </label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={destination ? `${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}` : ''}
                className="pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sélectionnez sur la carte"
                readOnly
              />
              <button
                type="button"
                onClick={() => setSelectingDestination(true)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
              >
                Sélectionner
              </button>
            </div>
          </div>
        </div>

        <div className="h-96 border rounded-lg overflow-hidden">
          <MapContainer
            center={[6.8789, -5.2424]} // INPHB
            zoom={15}
            className="h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker onLocationSelect={handleLocationSelect} />
            {position && (
              <Marker position={[position.lat, position.lng]} />
            )}
            {destination && (
              <Marker position={[destination.lat, destination.lng]} />
            )}
            {route.length > 0 && (
              <Polyline
                positions={route.map(pos => [pos.lat, pos.lng])}
                color="blue"
              />
            )}
          </MapContainer>
        </div>

        <div className="text-sm text-gray-600">
          {selectingDestination ? (
            <p className="text-blue-600">Cliquez sur la carte pour sélectionner la destination</p>
          ) : (
            <p>Cliquez sur la carte pour sélectionner la position actuelle</p>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer le véhicule'}
        </button>
      </form>
    </div>
  );
}