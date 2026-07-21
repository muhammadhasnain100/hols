export const SYRINGE_SIZES_ML = [0.25, 0.5, 1, 2, 3] as const;

export type SyringeSizeMl = (typeof SYRINGE_SIZES_ML)[number];

export type MassUnit = "g" | "mg" | "mcg";
export type VolumeUnit = "ml";

export type PeptideCalculatorInput = {
  syringeMl: SyringeSizeMl;
  peptideAmount: number;
  peptideUnit: MassUnit;
  waterMl: number;
  doseAmount: number;
  doseUnit: MassUnit;
};

export type PeptideCalculatorResult = {
  unitsPerDose: number;
  totalDoses: number;
  doseVolumeMl: number;
  concentrationMcgPerMl: number;
  peptideMcg: number;
  doseMcg: number;
  maxUnitsOnSyringe: number;
};

export function toMcg(amount: number, unit: MassUnit): number {
  if (unit === "g") return amount * 1_000_000;
  if (unit === "mg") return amount * 1000;
  return amount;
}

export function maxUnitsForSyringe(syringeMl: SyringeSizeMl): number {
  // U-100 insulin convention: 100 units = 1 ml
  return syringeMl * 100;
}

export function calculatePeptideDose(input: PeptideCalculatorInput): PeptideCalculatorResult {
  const peptideMcg = toMcg(input.peptideAmount, input.peptideUnit);
  const doseMcg = toMcg(input.doseAmount, input.doseUnit);
  const waterMl = input.waterMl;

  if (!(peptideMcg > 0) || !(waterMl > 0) || !(doseMcg > 0)) {
    throw new Error("All values must be greater than zero.");
  }
  if (doseMcg > peptideMcg) {
    throw new Error("Desired dose cannot exceed the total peptide in the vial.");
  }

  const concentrationMcgPerMl = peptideMcg / waterMl;
  const doseVolumeMl = doseMcg / concentrationMcgPerMl;
  const unitsPerDose = doseVolumeMl * 100;
  const totalDoses = peptideMcg / doseMcg;
  const maxUnitsOnSyringe = maxUnitsForSyringe(input.syringeMl);

  if (unitsPerDose > maxUnitsOnSyringe + 1e-9) {
    throw new Error(
      `This dose needs ${unitsPerDose.toFixed(2)} units, but a ${input.syringeMl} ml syringe only holds ${maxUnitsOnSyringe} units. Choose a larger syringe or lower the dose.`,
    );
  }

  return {
    unitsPerDose: Number(unitsPerDose.toFixed(2)),
    totalDoses: Number(totalDoses.toFixed(2)),
    doseVolumeMl: Number(doseVolumeMl.toFixed(4)),
    concentrationMcgPerMl: Number(concentrationMcgPerMl.toFixed(2)),
    peptideMcg,
    doseMcg,
    maxUnitsOnSyringe,
  };
}
