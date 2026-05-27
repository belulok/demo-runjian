export type PlantStatus = "normal" | "warning" | "alarm" | "offline";

export type Plant = {
  id: string;
  name: string;
  oem: "iSolarCloud" | "Huawei";
  capacityKWp: number;
  region: "Johor" | "Penang" | "Kedah" | "Perak" | "Melaka";
  lat: number;
  lng: number;
  buildDate: string;
  status: PlantStatus;
};

/** Values mirror the existing iRun production data shown in the screenshots. */
export const PLANTS: Plant[] = [
  {
    id: "PLT-JHR-001",
    name: "Johor-Commercial-1160",
    oem: "Huawei",
    capacityKWp: 1160,
    region: "Johor",
    lat: 1.4927,
    lng: 103.7414,
    buildDate: "2025-01-24",
    status: "alarm",
  },
  {
    id: "PLT-PNG-001",
    name: "Penang-Commercial-2757",
    oem: "iSolarCloud",
    capacityKWp: 2757,
    region: "Penang",
    lat: 5.4145,
    lng: 100.3292,
    buildDate: "2024-02-22",
    status: "warning",
  },
  {
    id: "PLT-KDH-001",
    name: "Kedah-Commercial-307",
    oem: "iSolarCloud",
    capacityKWp: 307.64,
    region: "Kedah",
    lat: 6.1184,
    lng: 100.3685,
    buildDate: "2024-12-12",
    status: "normal",
  },
  {
    id: "PLT-PRK-001",
    name: "Perak-Commercial-2855",
    oem: "iSolarCloud",
    capacityKWp: 2855,
    region: "Perak",
    lat: 4.5975,
    lng: 101.0901,
    buildDate: "2025-01-06",
    status: "normal",
  },
  {
    id: "PLT-MLK-001",
    name: "Melaka-Commercial-409",
    oem: "Huawei",
    capacityKWp: 409,
    region: "Melaka",
    lat: 2.1896,
    lng: 102.2501,
    buildDate: "2025-01-21",
    status: "normal",
  },
];

export const PRIMARY_PLANT_ID = "PLT-JHR-001";

export const PLANT_BY_ID: Record<string, Plant> = Object.fromEntries(PLANTS.map((p) => [p.id, p]));
