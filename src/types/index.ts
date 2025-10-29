export interface DistributionParameters {
  [key: string]: number;
}

export interface DistributionDataPoint {
  x: number;
  y: number;
}

export interface Distribution {
  id: string;
  name: string;
  formula: string;
  parameters: DistributionParameters;
  description: string;
  generateData: (
    params: DistributionParameters,
    range: [number, number],
    points: number
  ) => DistributionDataPoint[];
}
