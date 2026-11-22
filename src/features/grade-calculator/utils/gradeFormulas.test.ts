import { describe, it, expect } from 'vitest';
import { calculateGradeRow, generateGradingTable } from './gradeFormulas';

describe('Grading Formulas Unit Tests', () => {
  it('calculates Chilean scale (1.0 - 7.0) with 60% passing score correctly', () => {
    const totalPoints = 50;
    const passingPercentage = 60; // 30 points is passing (4.0)

    // Max score -> 7.0
    const maxRow = calculateGradeRow(50, totalPoints, passingPercentage, '7_0_chile');
    expect(maxRow.grade).toBe('7.0');
    expect(maxRow.percentage).toBe(100);
    expect(maxRow.isPassing).toBe(true);

    // Exact passing score -> 4.0
    const passRow = calculateGradeRow(30, totalPoints, passingPercentage, '7_0_chile');
    expect(passRow.grade).toBe('4.0');
    expect(passRow.percentage).toBe(60);
    expect(passRow.isPassing).toBe(true);

    // Below passing score -> < 4.0 and isPassing === false
    const failRow = calculateGradeRow(29, totalPoints, passingPercentage, '7_0_chile');
    expect(parseFloat(failRow.grade)).toBeLessThan(4.0);
    expect(failRow.isPassing).toBe(false);

    // Zero score -> 1.0
    const zeroRow = calculateGradeRow(0, totalPoints, passingPercentage, '7_0_chile');
    expect(zeroRow.grade).toBe('1.0');
    expect(zeroRow.percentage).toBe(0);
    expect(zeroRow.isPassing).toBe(false);
  });

  it('calculates Decimal scale (0.0 - 10.0)', () => {
    const totalPoints = 100;
    const passingPercentage = 60;

    const row100 = calculateGradeRow(100, totalPoints, passingPercentage, '10_0');
    expect(row100.grade).toBe('10.0');

    const row50 = calculateGradeRow(50, totalPoints, passingPercentage, '10_0');
    expect(row50.grade).toBe('5.0');
  });

  it('calculates US Letter Grades', () => {
    const totalPoints = 100;
    const passingPercentage = 60;

    const rowA = calculateGradeRow(95, totalPoints, passingPercentage, 'standard_us');
    expect(rowA.grade).toBe('A');

    const rowF = calculateGradeRow(40, totalPoints, passingPercentage, 'standard_us');
    expect(rowF.grade).toBe('F');
  });

  it('generates a full table descending from totalPoints to 0', () => {
    const table = generateGradingTable(20, 60, '7_0_chile');
    expect(table.length).toBe(21);
    expect(table[0].points).toBe(20);
    expect(table[table.length - 1].points).toBe(0);
  });
});

