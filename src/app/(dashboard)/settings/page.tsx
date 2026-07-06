import { getFuelTypes, getVehicleTypes, getSettings } from "@/lib/actions/settings";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const [fuelTypes, vehicleTypes, settings] = await Promise.all([
    getFuelTypes(),
    getVehicleTypes(),
    getSettings(),
  ]);

  return (
    <SettingsClient
      fuelTypes={fuelTypes}
      vehicleTypes={vehicleTypes}
      settings={settings}
    />
  );
}
