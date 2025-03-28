import { Region } from '@blueprintjs/table';
import { CalculationType } from '../components/Calculations';

export interface TableColumn {
  columnName: string;
  columnType: string;
  columnId: string;
}

// Default columns for the table
export const tableColumns: TableColumn[] = [
  { columnName: 'Time', columnType: 'time', columnId: 'time_col' },
  {
    columnName: 'Cell Density (Cell Count/Litre)',
    columnType: 'data',
    columnId: 'var_col_1',
  },
  { columnName: 'Volume (Litres)', columnType: 'data', columnId: 'var_col_2' },
];

/**
 * Converts row and column indices to a sparse reference key
 */
export const getSparseRefFromIndexes = (
  rowIndex: number,
  columnIndex: number,
): string => `${columnIndex}-${rowIndex}`;

/**
 * Extracts numeric values from selected regions
 */
export const getNumericValuesFromRegions = (
  selectedRegions: Region[],
  tableData: Record<string, any>,
): number[] => {
  const values: number[] = [];
  selectedRegions.forEach((region) => {
    if (region.rows) {
      const [startRow, endRow] = region.rows;
      const [startCol, endCol] = region.cols || [1, 1];

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const value = tableData[getSparseRefFromIndexes(row, col)];
          const numValue = parseFloat(String(value));
          if (!isNaN(numValue)) {
            values.push(numValue);
          }
        }
      }
    }
  });
  return values;
};

/**
 * Gets numeric values from a specific column in the selected regions
 */
export const getNumericValuesFromColumn = (
  selectedRegions: Region[],
  tableData: Record<string, any>,
  colIndex: number,
): number[] => {
  const values: number[] = [];
  selectedRegions.forEach((region) => {
    if (region.rows) {
      const [startRow, endRow] = region.rows;

      for (let row = startRow; row <= endRow; row++) {
        const value = tableData[getSparseRefFromIndexes(row, colIndex)];
        const numValue = parseFloat(String(value));
        if (!isNaN(numValue)) {
          values.push(numValue);
        }
      }
    }
  });
  return values;
};

/**
 * Extracts names of all selected data columns (excluding time column)
 */
export const getSelectedColumnNames = (
  selectedRegions: Region[],
  columns: TableColumn[],
): string[] => {
  if (selectedRegions.length === 0) return [];

  const selectedCols: Set<number> = new Set();

  // Collect all selected columns from all regions
  selectedRegions.forEach((region) => {
    if (region.cols) {
      const [startCol, endCol] = region.cols;
      for (let col = startCol; col <= endCol; col++) {
        if (col > 0 && col < columns.length) {
          selectedCols.add(col);
        }
      }
    }
  });

  // Return array of column names (excluding time column)
  return Array.from(selectedCols).map(
    (colIndex) => columns[colIndex].columnName,
  );
};

/**
 * Determines if multiple data columns are selected
 */
export const hasMultipleColumnsSelected = (
  selectedRegions: Region[],
  columns: TableColumn[],
): boolean => {
  return getSelectedColumnNames(selectedRegions, columns).length > 1;
};

/**
 * Gets the primary selected column name for calculations
 */
export const getSelectedColumnName = (
  selectedRegions: Region[],
  columns: TableColumn[],
): string => {
  if (selectedRegions.length === 0) return '';

  const region = selectedRegions[0];
  if (!region.cols) return '';

  // Get the data column index (not time column)
  const [startCol, endCol] = region.cols;

  // Identify the primary data column
  let dataColumnIndex = startCol;
  if (startCol === 0 && endCol > 0) {
    dataColumnIndex = 1; // Use the first data column if time is selected
  } else if (startCol > 0) {
    dataColumnIndex = startCol; // Use the selected data column
  }

  // Make sure the index is valid
  if (dataColumnIndex >= columns.length) {
    dataColumnIndex = 1; // Fallback to first data column
  }

  return columns[dataColumnIndex].columnName;
};

/**
 * Extracts time range from selected rows
 */
export const getTimeRangeFromSelection = (
  selectedRegions: Region[],
  tableData: Record<string, any>,
): { start: string; end: string } => {
  if (selectedRegions.length === 0) return { start: '', end: '' };

  // Get all selected rows across all regions
  let minRow = Number.MAX_SAFE_INTEGER;
  let maxRow = 0;

  selectedRegions.forEach((region) => {
    if (region.rows) {
      const [startRow, endRow] = region.rows;
      minRow = Math.min(minRow, startRow);
      maxRow = Math.max(maxRow, endRow);
    }
  });

  // If no valid row selection was found
  if (minRow === Number.MAX_SAFE_INTEGER || maxRow === 0) {
    return { start: '', end: '' };
  }

  // Get time values from first column (Time column)
  const startTime = String(tableData[getSparseRefFromIndexes(minRow, 0)] || '');
  const endTime = String(tableData[getSparseRefFromIndexes(maxRow, 0)] || '');

  return { start: startTime, end: endTime };
};

/**
 * Gets the position of the last selected row for toolkit positioning
 */
export const getLastSelectedRowPosition = (
  selectedRegions: Region[],
): number => {
  if (selectedRegions.length === 0) return -1;
  const lastRegion = selectedRegions[selectedRegions.length - 1];
  return lastRegion.rows ? lastRegion.rows[1] : -1;
};

/**
 * Determines if exactly one whole column is selected
 * A whole column is selected when:
 * 1. There is exactly one region
 * 2. The region's cols property indicates a single column (start = end)
 * 3. The region doesn't have a rows property or includes all rows
 */
export const isWholeColumnSelected = (
  selectedRegions: Region[],
  totalRows: number,
): boolean => {
  if (selectedRegions.length !== 1) return false;

  const region = selectedRegions[0];

  // Check if a single column is selected
  if (!region.cols || region.cols[0] !== region.cols[1]) return false;

  // Check if all rows are selected or no row selection is specified (which means all rows)
  if (!region.rows) return true;

  const [startRow, endRow] = region.rows;

  // If rows selection spans all rows, consider it a whole column selection
  return startRow === 0 && endRow === totalRows - 1;
};
