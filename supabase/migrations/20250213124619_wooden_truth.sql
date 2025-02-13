/*
  # Création des tables pour le système de géolocalisation

  1. Nouvelles Tables
    - `vehicles`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence vers profiles)
      - `driver_name` (text)
      - `driver_surname` (text)
      - `vehicle_brand` (text)
      - `current_position` (point)
      - `status` (enum)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `routes`
      - `id` (uuid, clé primaire)
      - `vehicle_id` (uuid, référence vers vehicles)
      - `start_position` (point)
      - `end_position` (point)
      - `route_points` (json)
      - `status` (enum)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Activation RLS sur toutes les tables
    - Politiques pour la lecture/écriture des données
*/

-- Extension pour gérer les types géographiques
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enum pour les statuts des véhicules
CREATE TYPE vehicle_status AS ENUM ('en-route', 'paused', 'completed');

-- Enum pour les statuts des routes
CREATE TYPE route_status AS ENUM ('active', 'completed', 'cancelled');

-- Table des véhicules
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  driver_name text NOT NULL,
  driver_surname text NOT NULL,
  vehicle_brand text NOT NULL,
  current_position geometry(Point, 4326),
  status vehicle_status DEFAULT 'paused',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des routes
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  start_position geometry(Point, 4326) NOT NULL,
  end_position geometry(Point, 4326) NOT NULL,
  route_points jsonb DEFAULT '[]',
  status route_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Politiques pour les véhicules
CREATE POLICY "Users can read all vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politiques pour les routes
CREATE POLICY "Users can read all routes"
  ON routes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert routes for their vehicles"
  ON routes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = routes.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update routes for their vehicles"
  ON routes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = routes.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = routes.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();