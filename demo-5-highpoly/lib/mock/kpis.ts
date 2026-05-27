export type PlantKPI = {
  plantId: string;
  actualKWh: number;
  theoreticalKWh: number;
  performanceRatio: number;
  effectiveHours: number;
  co2SavedTons: number;
  treesEquivalent: number;
  generatedToday: number;
  generatedMonth: number;
};

export const PRIMARY_KPI: PlantKPI = {
  plantId: "PLT-JHR-001",
  actualKWh: 4_982,
  theoreticalKWh: 5_117,
  performanceRatio: 97.4,
  effectiveHours: 4.29,
  co2SavedTons: 1968.1,
  treesEquivalent: 104_500,
  generatedToday: 4_982,
  generatedMonth: 124_380,
};

export const PORTFOLIO_KPI = {
  totalPlants: 5,
  totalDevices: 66,
  installedCapacityKWp: 7_488,
  cumulativeGenerationGWh: 2.6,
  yearlyGenerationGWh: 2.23,
  monthlyGenerationMWh: 498.68,
  operatingDays: 540,
  co2SavedTons: 1968.1,
};
