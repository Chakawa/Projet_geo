export type VehicleStatus = 'en-route' | 'paused' | 'completed';
export type RouteStatus = 'active' | 'completed' | 'cancelled';

export interface Position {
  lat: number;
  lng: number;
}

export interface Vehicle {
  destination: unknown;
  id: string;
  user_id: string;
  driver_name: string;
  driver_surname: string;
  vehicle_brand: string;
  current_position: Position;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  vehicle_id: string;
  start_position: Position;
  end_position: Position;
  route_points: Position[];
  status: RouteStatus;
  created_at: string;
  updated_at: string;
}