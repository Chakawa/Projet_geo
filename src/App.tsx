import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { supabase } from './lib/supabase';
import Map from './components/Map';
import VehicleList from './components/VehicleList';
import VehicleForm from './components/VehicleForm';
import Auth from './components/Auth';
import { LogOut, Plus } from 'lucide-react';
import type { Vehicle } from './types/vehicle';
import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadVehicles();

      const socket = io('http://localhost:3000');

      socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      socket.on('vehicleUpdate', (updatedVehicle: Vehicle) => {
        setVehicles(prev =>
          prev.map(vehicle =>
            vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle
          )
        );
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [session]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase.from('vehicles').select('*');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen">
      <div className="w-1/4 p-4 bg-gray-50 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Suivi des Livraisons</h1>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => setShowAddVehicle(true)}
          className="mb-4 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter un véhicule
        </button>

        <VehicleList vehicles={vehicles} onVehicleSelect={setSelectedVehicle} />
      </div>

      <div className="w-3/4 relative">
        <Map vehicles={vehicles} selectedVehicle={selectedVehicle} />

        {showAddVehicle && (
          <div className="absolute inset-0 bg-white bg-opacity-95">
            <div className="p-4">
              <button
                onClick={() => setShowAddVehicle(false)}
                className="mb-4 text-gray-600 hover:text-gray-800"
              >
                ← Retour
              </button>
              <VehicleForm
                onVehicleAdded={() => {
                  loadVehicles();
                  setShowAddVehicle(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;