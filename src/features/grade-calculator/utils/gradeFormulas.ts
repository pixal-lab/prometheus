export type GradingSystemKey = '7_0_chile' | '10_0' | 'standard_us' | 'gpa_value';

export interface GradingSystemDefinition {
  id: GradingSystemKey;
  name: string;
}

export const GRADING_SYSTEMS: GradingSystemDefinition[] = [
  { id: '7_0_chile', name: 'Chile (1.0 - 7.0)' },
  { id: '10_0', name: 'Decimal (0.0 - 10.0)' },
  { id: 'standard_us', name: 'Standard U.S. Letter Grade (A-F)' },
  { id: 'gpa_value', name: 'GPA Value (0.0 - 4.0)' },
];

export interface ScoreRow {
  points: number;
  percentage: number;
  grade: string;
  isPassing: boolean;
}

const US_GRADES = [
  { name: 'A+', minPercentage: 97 },
  { name: 'A', minPercentage: 93 },
  { name: 'A-', minPercentage: 90 },
  { name: 'B+', minPercentage: 87 },
  { name: 'B', minPercentage: 83 },
  { name: 'B-', minPercentage: 80 },
  { name: 'C+', minPercentage: 77 },
  { name: 'C', minPercentage: 73 },
  { name: 'C-', minPercentage: 70 },
  { name: 'D+', minPercentage: 67 },
  { name: 'D', minPercentage: 63 },
  { name: 'D-', minPercentage: 60 },
  { name: 'F', minPercentage: 0 },
];

const GPA_GRADES = [
  { name: '4.0', minPercentage: 93 },
  { name: '3.7', minPercentage: 90 },
  { name: '3.3', minPercentage: 87 },
  { name: '3.0', minPercentage: 83 },
  { name: '2.7', minPercentage: 80 },
  { name: '2.3', minPercentage: 77 },
  { name: '2.0', minPercentage: 73 },
  { name: '1.7', minPercentage: 70 },
  { name: '1.3', minPercentage: 67 },
  { name: '1.0', minPercentage: 63 },
  { name: '0.7', minPercentage: 60 },
  { name: '0.0', minPercentage: 0 },
];

export function calculateGradeRow(
  points: number,
  totalPoints: number,
  passingPercentage: number,
  system: GradingSystemKey
): ScoreRow {
  const percentage = totalPoints > 0 ? (points / totalPoints) * 100 : 0;
  const isPassing = percentage >= passingPercentage;
  let grade = 'N/A';

  switch (system) {
    case '7_0_chile': {
      let calc: number;
      if (percentage >= passingPercentage) {
        const span = 100 - passingPercentage;
        calc = span > 0 ? 4.0 + (percentage - passingPercentage) * (3.0 / span) : 7.0;
      } else {
        calc = passingPercentage > 0 ? 1.0 + percentage * (3.0 / passingPercentage) : 4.0;
      }
      grade = Math.max(1.0, Math.min(7.0, calc)).toFixed(1);
      break;
    }

    case '10_0': {
      const calc = (percentage / 100) * 10.0;
      grade = Math.max(0, Math.min(10.0, calc)).toFixed(1);
      break;
    }

    case 'gpa_value': {
      for (const item of GPA_GRADES) {
        if (percentage >= item.minPercentage) {
          grade = item.name;
          break;
        }
      }
      break;
    }

    case 'standard_us':
    default: {
      for (const item of US_GRADES) {
        if (percentage >= item.minPercentage) {
          grade = item.name;
          break;
        }
      }
      break;
    }
  }

  return {
    points,
    percentage: Math.round(percentage * 100) / 100,
    grade,
    isPassing,
  };
}

export function generateGradingTable(
  totalPoints: number,
  passingPercentage: number,
  system: GradingSystemKey
): ScoreRow[] {
  const rows: ScoreRow[] = [];
  for (let p = totalPoints; p >= 0; p--) {
    rows.push(calculateGradeRow(p, totalPoints, passingPercentage, system));
  }
  return rows;
}

