import { describe, it, expect } from 'vitest';
import { calculateGradeRow, generateGradingTable, splitIntoColumns } from './gradeFormulas';

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

  it('splits table into multiple columns for paper-saving print layout without dropping rows', () => {
    const table = generateGradingTable(50, 60, '7_0_chile'); // 51 rows (50 down to 0)
    expect(table.length).toBe(51);

    // Split into 3 columns
    const cols3 = splitIntoColumns(table, 3);
    expect(cols3.length).toBe(3);
    expect(cols3[0].length).toBe(17); // 50 down to 34
    expect(cols3[1].length).toBe(17); // 33 down to 17
    expect(cols3[2].length).toBe(17); // 16 down to 0

    // Verify first and last in each column
    expect(cols3[0][0].points).toBe(50);
    expect(cols3[0][16].points).toBe(34);
    expect(cols3[1][0].points).toBe(33);
    expect(cols3[1][16].points).toBe(17);
    expect(cols3[2][0].points).toBe(16);
    expect(cols3[2][16].points).toBe(0);

    // Sum of all rows in all columns must equal original length
    const totalCount = cols3.reduce((acc, col) => acc + col.length, 0);
    expect(totalCount).toBe(51);
  });

  it('handles 1 column, 2 columns, and 4 columns cleanly', () => {
    const table = generateGradingTable(20, 60, '7_0_chile'); // 21 rows
    const cols1 = splitIntoColumns(table, 1);
    expect(cols1.length).toBe(1);
    expect(cols1[0].length).toBe(21);

    const cols2 = splitIntoColumns(table, 2);
    expect(cols2.length).toBe(2);
    expect(cols2[0].length).toBe(11);
    expect(cols2[1].length).toBe(10);
    expect(cols2[0].length + cols2[1].length).toBe(21);
  });
});

