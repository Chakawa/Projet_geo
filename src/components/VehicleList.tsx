import { useState } from 'react';
import { Search, Truck } from 'lucide-react';
import type { Vehicle } from '../types/vehicle';

interface VehicleListProps {
  vehicles: Vehicle[];
  onVehicleSelect: (vehicle: Vehicle) => void;
}

export default function VehicleList({ vehicles, onVehicleSelect }: VehicleListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Vehicle['status'] | 'all'>('all');

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = vehicle.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un véhicule..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>
        
        <select
          className="mt-2 w-full p-2 border rounded-lg"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Vehicle['status'] | 'all')}
        >
          <option value="all">Tous les statuts</option>
          <option value="en-route">En route</option>
          <option value="paused">En pause</option>
          <option value="completed">Terminé</option>
        </select>
      </div>

      <div className="space-y-2">
        {filteredVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onVehicleSelect(vehicle)}
          >
            <div className="flex items-center gap-3">
              <Truck className={`w-6 h-6 ${
                vehicle.status === 'en-route' ? 'text-blue-500' :
                vehicle.status === 'paused' ? 'text-yellow-500' :
                'text-green-500'
              }`} />
              <div>
                <h3 className="font-medium">{vehicle.driver_name}</h3>
                <p className="text-sm text-gray-600">{vehicle.destination}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  vehicle.status === 'en-route' ? 'bg-blue-100 text-blue-800' :
                  vehicle.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {vehicle.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}