import * as React from 'react';
import { Column, Table2, EditableCell2, Region } from '@blueprintjs/table';
import {
  Button,
  Tooltip,
  Position,
  HTMLSelect,
  Dialog,
  Intent,
  Icon,
  FormGroup,
  InputGroup,
  Switch,
  Label,
} from '@blueprintjs/core';
import { dummyTableData } from '../data/dummyData';
import { ResultDialog, CalculationType, calculateResult } from './Calculations';
import {
  tableColumns,
  TableColumn,
  getSparseRefFromIndexes,
  getNumericValuesFromRegions,
  getNumericValuesFromColumn,
  getSelectedColumnNames,
  hasMultipleColumnsSelected,
  getSelectedColumnName,
  getTimeRangeFromSelection,
  getLastSelectedRowPosition,
  isWholeColumnSelected,
} from '../utils/dataSelectionProcessor';
import {
  ToolbarPosition,
  createDragRefs,
  handleDragStart,
  handleDrag,
  handleDragEnd,
  restoreToolbarPosition as resetToolbarPosition,
} from '../utils/toolkitDragManager';

interface DataTableProps {
  isCalculateActive: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ isCalculateActive }) => {
  // Debug log for props
  React.useEffect(() => {
    console.log('DataTable received isCalculateActive:', isCalculateActive);
  }, [isCalculateActive]);

  const [tableData, setTableData] = React.useState({ ...dummyTableData });
  const [selectedRegions, setSelectedRegions] = React.useState<Region[]>([]);
  const [showResult, setShowResult] = React.useState(false);
  const [calculatedResult, setCalculatedResult] = React.useState(0);
  const [currentFunction, setCurrentFunction] =
    React.useState<CalculationType>('Sum');
  const [selectedColumn, setSelectedColumn] = React.useState<string>('');
  const [timeRange, setTimeRange] = React.useState<{
    start: string;
    end: string;
  }>({ start: '', end: '' });
  const [toolbarPosition, setToolbarPosition] = React.useState<ToolbarPosition>(
    {
      top: null,
      left: null,
      isDragging: false,
    },
  );
  const [showMultiColumnWarning, setShowMultiColumnWarning] =
    React.useState(false);
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>([]);
  const [hideToolkit, setHideToolkit] = React.useState(false);
  const [isWholeColumn, setIsWholeColumn] = React.useState(false);
  const [showCustomizeDialog, setShowCustomizeDialog] = React.useState(false);
  const [columnFormat, setColumnFormat] = React.useState<string>('default');
  const [columnWidth, setColumnWidth] = React.useState<number>(120);
  const [columnVisible, setColumnVisible] = React.useState<boolean>(true);
  const [customOperation, setCustomOperation] = React.useState<string>('+');

  // Add state for formula builder
  const [formulaElements, setFormulaElements] = React.useState<string[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const formulaBuilderRef = React.useRef<HTMLDivElement>(null);

  // Add state for recent formulas
  const [recentFormulas, setRecentFormulas] = React.useState<string[][]>([]);

  // Add a new state variable for the custom column name
  const [customColumnName, setCustomColumnName] = React.useState<string>('');

  // First, add a state variable to track the table columns locally
  const [localTableColumns, setLocalTableColumns] =
    React.useState<TableColumn[]>(tableColumns);

  // Add state for the expanded panel
  const [isExpandedPanelOpen, setIsExpandedPanelOpen] = React.useState(false);

  // Add state variables for the collapsible sections at the top with the other state variables
  const [commonFunctionsExpanded, setCommonFunctionsExpanded] =
    React.useState(true);
  const [columnBuilderExpanded, setColumnBuilderExpanded] =
    React.useState(true);

  // Calculate the total number of rows dynamically from the tableData
  const calculateTotalRows = React.useCallback(() => {
    // Keys in tableData are in the format "columnIndex-rowIndex"
    // Find the maximum row index by examining all keys
    let maxRowIndex = 0;
    Object.keys(tableData).forEach((key) => {
      const rowIndex = parseInt(key.split('-')[1]);
      if (!isNaN(rowIndex) && rowIndex > maxRowIndex) {
        maxRowIndex = rowIndex;
      }
    });
    // The total number of rows is the maximum row index + 1 (since it's 0-indexed)
    return maxRowIndex + 1;
  }, [tableData]);

  // Calculate total rows once when the component mounts or when tableData changes
  const totalRows = calculateTotalRows();

  // Initialize toolkit drag references
  const dragRefs = createDragRefs();

  const cellRenderer = (rowIndex: number, columnIndex: number) => {
    const sparsePosition = getSparseRefFromIndexes(rowIndex, columnIndex);
    const value = tableData[sparsePosition];

    return (
      <EditableCell2
        value={String(value)}
        onConfirm={(value: string) =>
          handleCellEdit(value, rowIndex, columnIndex)
        }
      />
    );
  };

  const handleCellEdit = (
    value: string,
    rowIndex: number,
    columnIndex: number,
  ) => {
    const sparsePosition = getSparseRefFromIndexes(rowIndex, columnIndex);
    setTableData((prevData) => ({
      ...prevData,
      [sparsePosition]: value,
    }));
  };

  const handleSelection = (regions: Region[]) => {
    setSelectedRegions(regions);

    // Check if a whole column is selected using the dynamic row count
    const wholeColumnSelected = isWholeColumnSelected(regions, totalRows);
    setIsWholeColumn(wholeColumnSelected);

    // No need to reset the function anymore since Customize is always available
  };

  const cancelSelection = () => {
    setSelectedRegions([]);
  };

  const restoreToolbarPosition = () => {
    resetToolbarPosition(setToolbarPosition);
  };

  const checkAndUpdateMultipleColumns = (): boolean => {
    const dataColumns = getSelectedColumnNames(
      selectedRegions,
      localTableColumns,
    );
    setSelectedColumns(dataColumns);
    return dataColumns.length > 1;
  };

  const calculate = () => {
    // If currentFunction is Other, handle differently
    if (currentFunction === 'Other') {
      handleCustomizeColumn();
      return;
    }

    // Check if multiple data columns are selected
    if (checkAndUpdateMultipleColumns()) {
      setShowMultiColumnWarning(true);
      setHideToolkit(true);
      return;
    }

    let values: number[] = [];

    // Handle whole column selection differently
    if (isWholeColumn && selectedRegions.length === 1) {
      // Get the selected column index
      const colIndex = selectedRegions[0].cols?.[0] || 0;
      if (colIndex >= 0) {
        // Get values from the whole column
        for (let row = 0; row < totalRows; row++) {
          const value = tableData[getSparseRefFromIndexes(row, colIndex)];
          const numValue = parseFloat(String(value));
          if (!isNaN(numValue)) {
            values.push(numValue);
          }
        }
      }
    } else {
      // Get values from the selection normally
      values = getNumericValuesFromRegions(selectedRegions, tableData);
    }

    const result = calculateResult(values, currentFunction);

    // Get the column name
    const columnName = getSelectedColumnName(
      selectedRegions,
      localTableColumns,
    );

    // Get time range - for whole column, use first and last row
    let times = { start: '', end: '' };
    if (isWholeColumn && selectedRegions.length === 1) {
      // For whole column, get the first and last time value
      const firstTimeValue = String(
        tableData[getSparseRefFromIndexes(0, 0)] || '',
      );
      const lastTimeValue = String(
        tableData[getSparseRefFromIndexes(totalRows - 1, 0)] || '',
      );
      times = { start: firstTimeValue, end: lastTimeValue };
    } else {
      // Get time range normally for regular selections
      times = getTimeRangeFromSelection(selectedRegions, tableData);
    }

    setSelectedColumn(columnName);
    setTimeRange(times);
    setCalculatedResult(result);
    setShowResult(true);
  };

  const handleProceedWithCalculation = (columnName: string) => {
    setShowMultiColumnWarning(false);
    setHideToolkit(false);

    // Find index of the selected column
    const colIndex = localTableColumns.findIndex(
      (col) => col.columnName === columnName,
    );
    if (colIndex === -1) return;

    let values: number[] = [];

    // Handle whole column selection differently
    if (isWholeColumn && selectedRegions.length === 1) {
      // Get values from the whole column
      for (let row = 0; row < totalRows; row++) {
        const value = tableData[getSparseRefFromIndexes(row, colIndex)];
        const numValue = parseFloat(String(value));
        if (!isNaN(numValue)) {
          values.push(numValue);
        }
      }
    } else {
      // Use existing function for regular selections
      values = getNumericValuesFromColumn(selectedRegions, tableData, colIndex);
    }

    const result = calculateResult(values, currentFunction);

    // Get time range - for whole column, use first and last row
    let times = { start: '', end: '' };
    if (isWholeColumn && selectedRegions.length === 1) {
      // For whole column, get the first and last time value
      const firstTimeValue = String(
        tableData[getSparseRefFromIndexes(0, 0)] || '',
      );
      const lastTimeValue = String(
        tableData[getSparseRefFromIndexes(totalRows - 1, 0)] || '',
      );
      times = { start: firstTimeValue, end: lastTimeValue };
    } else {
      // Get time range normally for regular selections
      times = getTimeRangeFromSelection(selectedRegions, tableData);
    }

    setSelectedColumn(columnName);
    setTimeRange(times);
    setCalculatedResult(result);
    setShowResult(true);
  };

  const handleCancelMultiColumnWarning = () => {
    setShowMultiColumnWarning(false);
    setHideToolkit(false);
    // Keep selections - do nothing else
  };

  const handleReselect = () => {
    setShowMultiColumnWarning(false);
    setHideToolkit(false);
    setSelectedRegions([]);
    // Toolkit will reappear to allow reselection
  };

  // Function to handle the customize column option
  const handleCustomizeColumn = (fromFloatingToolbar = false) => {
    // Remove the whole column selection check
    // Reset formula elements
    setFormulaElements([]);

    // Set default custom column name
    setCustomColumnName(`Custom Calculation`);

    if (fromFloatingToolbar) {
      // Open the customize dialog when triggered from floating toolbar
      setShowCustomizeDialog(true);
    } else {
      // Open the expanded panel when triggered directly
      setIsExpandedPanelOpen(true);
    }
  };

  // Function to handle drag start for formula elements
  const handleFormulaItemDragStart = (e: React.DragEvent, item: string) => {
    e.dataTransfer.setData('text/plain', item);
    setIsDragging(true);
  };

  // Function to handle drag over for formula builder
  const handleFormulaBuilderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Function to handle drop for formula builder
  const handleFormulaBuilderDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const item = e.dataTransfer.getData('text/plain');
    setFormulaElements((prev) => [...prev, item]);
    setIsDragging(false);
  };

  // Function to remove an element from the formula
  const removeFormulaElement = (index: number) => {
    setFormulaElements((prev) => prev.filter((_, i) => i !== index));
  };

  // Function to clear the formula
  const clearFormula = () => {
    setFormulaElements([]);
  };

  // Combine formula elements into a readable string
  const formulaString = formulaElements.join(' ');

  // Function to apply custom calculation
  const applyCustomCalculation = () => {
    if (formulaElements.length === 0) return;

    console.log(`Generating new column with calculation:`);
    console.log(`- Formula elements: ${formulaElements.join(' ')}`);
    console.log(`- New column name: ${customColumnName}`);

    // Store this formula in recent formulas (up to 3)
    if (formulaElements.length >= 3) {
      setRecentFormulas((prev) => {
        const updated = [
          formulaElements,
          ...prev.filter(
            (f) =>
              // Only add if not already in the list
              JSON.stringify(f) !== JSON.stringify(formulaElements),
          ),
        ].slice(0, 3);
        return updated;
      });
    }

    // Create a new column with calculation results
    const newColumnId = `calculated_col_${Date.now()}`;

    // Create the new column object
    const newColumn: TableColumn = {
      columnName: customColumnName,
      columnType: 'data',
      columnId: newColumnId,
    };

    // Simple helper to evaluate basic operations
    const evaluateFormula = (
      col1Value: number,
      col2Value: number,
      operation: string,
    ): number => {
      switch (operation) {
        case '+':
          return col1Value + col2Value;
        case '-':
          return col1Value - col2Value;
        case '×':
          return col1Value * col2Value;
        case '÷':
          return col2Value !== 0 ? col1Value / col2Value : 0;
        default:
          return 0;
      }
    };

    // For this simple implementation, we'll assume a basic formula structure
    // like "Column1 × Column2" or "Column1 + Column2"
    if (formulaElements.length >= 3) {
      const col1Name = formulaElements[0];
      const operation = formulaElements[1];
      const col2Name = formulaElements[2];

      const col1Index = localTableColumns.findIndex(
        (col) => col.columnName === col1Name,
      );
      const col2Index = localTableColumns.findIndex(
        (col) => col.columnName === col2Name,
      );

      if (col1Index >= 0 && col2Index >= 0) {
        // Clone the tableData to avoid direct mutation
        const newTableData = { ...tableData };

        // Add the new column to tableColumns
        const updatedColumns = [...localTableColumns, newColumn];
        const newColIndex = updatedColumns.length - 1;

        // Calculate values for each row and update tableData
        for (let row = 0; row < totalRows; row++) {
          const col1Value =
            parseFloat(
              String(tableData[getSparseRefFromIndexes(row, col1Index)]),
            ) || 0;
          const col2Value =
            parseFloat(
              String(tableData[getSparseRefFromIndexes(row, col2Index)]),
            ) || 0;

          // Calculate the new value based on the operation
          const newValue = evaluateFormula(col1Value, col2Value, operation);

          // Store the result in the new column
          newTableData[getSparseRefFromIndexes(row, newColIndex)] =
            newValue.toFixed(2);
        }

        // Update state
        setTableData(newTableData);
        setLocalTableColumns(updatedColumns);

        console.log('New column added:', newColumn);
      }
    }

    // Close the dialog and reset function
    setShowCustomizeDialog(false);

    // Reset the function to Sum
    if (currentFunction === 'Other') {
      setCurrentFunction('Sum');
    }
  };

  // Update the cols generator to use localTableColumns instead of tableColumns
  const cols = localTableColumns.map((column) => (
    <Column
      key={`${column.columnId}`}
      cellRenderer={cellRenderer}
      name={column.columnName}
    />
  ));

  // Add keyboard event handler
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't process hotkeys if any dialog is open
      if (
        !isCalculateActive ||
        selectedRegions.length === 0 ||
        showCustomizeDialog ||
        showMultiColumnWarning ||
        showResult
      )
        return;

      // Don't process hotkeys if focus is in an input field, formula builder, or in Column Calculation section
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.classList.contains('column-name-input') ||
        activeElement?.classList.contains('formula-preview') ||
        activeElement?.closest('.formula-builder-section') !== null ||
        activeElement?.closest('.columns-operations-container') !== null;

      // Also check if expanded panel is open and column builder section is expanded
      const isInColumnBuilder = isExpandedPanelOpen && columnBuilderExpanded;

      if (isInputFocused || isInColumnBuilder) {
        return;
      }

      // Prevent default behavior for these keys when in selection mode
      if (
        event.code === 'Space' ||
        event.key === 'Escape' ||
        event.key === 'r' ||
        event.key === 'R'
      ) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'Space':
          // The calculate function now handles the Customize case
          calculate();
          break;
        case 'KeyR':
          if (toolbarPosition.top !== null) {
            restoreToolbarPosition();
          }
          break;
        case 'Escape':
          cancelSelection();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [
    selectedRegions,
    toolbarPosition.top,
    isCalculateActive,
    showCustomizeDialog,
    showMultiColumnWarning,
    showResult,
    currentFunction,
    isExpandedPanelOpen,
    columnBuilderExpanded,
  ]); // Added expanded panel and column builder state dependencies

  // Show toolkit only when calculation mode is active - but preserve state
  const shouldShowToolkit =
    isCalculateActive && selectedRegions.length > 0 && !hideToolkit;

  // Determine which UI to show - floating toolbar or expanded panel
  const showFloatingToolbar = shouldShowToolkit && !isExpandedPanelOpen;
  const showExpandedPanel = shouldShowToolkit && isExpandedPanelOpen;

  // Add more debugging for the toolbar visibility conditions
  React.useEffect(() => {
    console.log('Toolbar visibility conditions:');
    console.log('- isCalculateActive:', isCalculateActive);
    console.log('- selectedRegions.length:', selectedRegions.length);
    console.log('- hideToolkit:', hideToolkit);
    console.log('- shouldShowToolkit:', shouldShowToolkit);
    console.log('- showFloatingToolbar:', showFloatingToolbar);
    console.log('- showExpandedPanel:', showExpandedPanel);
    console.log('- isExpandedPanelOpen:', isExpandedPanelOpen);
  }, [
    isCalculateActive,
    selectedRegions,
    hideToolkit,
    shouldShowToolkit,
    showFloatingToolbar,
    showExpandedPanel,
    isExpandedPanelOpen,
  ]);

  // Add this helper function to calculate the rightmost selected column position
  const getRightmostColumnPosition = (regions: Region[]): number => {
    if (!regions || regions.length === 0) return 0;

    let rightmostCol = 0;

    regions.forEach((region) => {
      if (region.cols) {
        const regionRightCol = Math.max(
          region.cols[0],
          region.cols[1] || region.cols[0],
        );
        rightmostCol = Math.max(rightmostCol, regionRightCol);
      }
    });

    // Calculate approximate position based on column width (assuming standard width)
    // Add some padding (30px) to position it after the column
    return (rightmostCol + 1) * 120 + 30;
  };

  return (
    <div className="table-wrapper">
      <Table2
        defaultRowHeight={35}
        numRows={totalRows}
        className="opvia-table"
        enableMultipleSelection={true}
        onSelection={handleSelection}
        selectedRegions={selectedRegions}
      >
        {cols}
      </Table2>

      {/* Expanded Panel */}
      {showExpandedPanel && (
        <div className="expanded-panel open">
          <div className="expanded-panel-header">
            <span className="expanded-panel-title">Calculator</span>
            <div className="panel-header-controls">
              <Button
                icon="minimize"
                minimal={true}
                small={true}
                className="collapse-panel-button"
                onClick={() => setIsExpandedPanelOpen(false)}
                title="Collapse to floating toolbar"
              />
              <Button
                icon="cross"
                minimal={true}
                small={true}
                className="close-panel-button"
                onClick={cancelSelection}
                title="Cancel selections"
              />
            </div>
          </div>
          <div className="expanded-panel-content">
            {/* Section 1: Common Functions */}
            <div className="panel-collapsible-section">
              <div
                className="section-header"
                onClick={() =>
                  setCommonFunctionsExpanded(!commonFunctionsExpanded)
                }
              >
                <h3>Direct Calculations on Selected Cells</h3>
                <Button
                  icon={
                    commonFunctionsExpanded ? 'chevron-down' : 'chevron-right'
                  }
                  minimal={false}
                  small={true}
                  intent="primary"
                />
              </div>
              {commonFunctionsExpanded && (
                <div className="section-content">
                  <div className="function-buttons">
                    {['Sum', 'Average', 'Count', 'Max', 'Min'].map((func) => (
                      <Button
                        key={func}
                        text={func}
                        className="function-button"
                        onClick={() => {
                          // Instead of setting state and immediately calculating,
                          // create a separate calculation function with the
                          // specific function type to ensure it uses the right value
                          const calcType = func as CalculationType;

                          // Check if multiple data columns are selected
                          if (checkAndUpdateMultipleColumns()) {
                            setCurrentFunction(calcType);
                            setShowMultiColumnWarning(true);
                            setHideToolkit(true);
                            return;
                          }

                          let values: number[] = [];

                          // Handle whole column selection differently
                          if (isWholeColumn && selectedRegions.length === 1) {
                            // Get the selected column index
                            const colIndex = selectedRegions[0].cols?.[0] || 0;
                            if (colIndex >= 0) {
                              // Get values from the whole column
                              for (let row = 0; row < totalRows; row++) {
                                const value =
                                  tableData[
                                    getSparseRefFromIndexes(row, colIndex)
                                  ];
                                const numValue = parseFloat(String(value));
                                if (!isNaN(numValue)) {
                                  values.push(numValue);
                                }
                              }
                            }
                          } else {
                            // Get values from the selection normally
                            values = getNumericValuesFromRegions(
                              selectedRegions,
                              tableData,
                            );
                          }

                          // Use the specific function type for calculation
                          const result = calculateResult(values, calcType);

                          // Get the column name
                          const columnName = getSelectedColumnName(
                            selectedRegions,
                            localTableColumns,
                          );

                          // Get time range - for whole column, use first and last row
                          let times = { start: '', end: '' };
                          if (isWholeColumn && selectedRegions.length === 1) {
                            // For whole column, get the first and last time value
                            const firstTimeValue = String(
                              tableData[getSparseRefFromIndexes(0, 0)] || '',
                            );
                            const lastTimeValue = String(
                              tableData[
                                getSparseRefFromIndexes(totalRows - 1, 0)
                              ] || '',
                            );
                            times = {
                              start: firstTimeValue,
                              end: lastTimeValue,
                            };
                          } else {
                            // Get time range normally for regular selections
                            times = getTimeRangeFromSelection(
                              selectedRegions,
                              tableData,
                            );
                          }

                          // Update all state at once to ensure consistency
                          setCurrentFunction(calcType);
                          setSelectedColumn(columnName);
                          setTimeRange(times);
                          setCalculatedResult(result);
                          setShowResult(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Column Calculation */}
            <div className="panel-collapsible-section">
              <div
                className="section-header"
                onClick={() => setColumnBuilderExpanded(!columnBuilderExpanded)}
              >
                <h3>Column Calculation</h3>
                <Button
                  icon={
                    columnBuilderExpanded ? 'chevron-down' : 'chevron-right'
                  }
                  minimal={false}
                  small={true}
                  intent="primary"
                />
              </div>
              {columnBuilderExpanded && (
                <div className="section-content">
                  {/* Formula Builder Section */}
                  <div className="formula-builder-section">
                    <label>Build your formula:</label>

                    <div
                      ref={formulaBuilderRef}
                      className={`formula-preview ${
                        isDragging ? 'dragging-over' : ''
                      }`}
                      onDragOver={handleFormulaBuilderDragOver}
                      onDrop={handleFormulaBuilderDrop}
                    >
                      {formulaElements.length > 0 ? (
                        <div className="formula-elements">
                          {formulaElements.map((element, index) => (
                            <div key={index} className="formula-pill">
                              {element}
                              <Button
                                icon="cross"
                                minimal={true}
                                small={true}
                                onClick={() => removeFormulaElement(index)}
                                className="remove-element"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-formula-preview">
                          <span>Drag columns and operations here</span>
                        </div>
                      )}
                    </div>

                    <div className="formula-controls">
                      <Button
                        icon="trash"
                        text="Clear Formula"
                        minimal={true}
                        onClick={clearFormula}
                        disabled={formulaElements.length === 0}
                      />
                    </div>
                  </div>

                  <div className="columns-operations-container">
                    <div className="draggable-section column-section">
                      <h4>Available Columns</h4>
                      <div className="column-selection">
                        {localTableColumns.map((column) => (
                          <Button
                            key={column.columnId}
                            text={column.columnName}
                            className="column-select-button"
                            fill={true}
                            draggable
                            onDragStart={(e) =>
                              handleFormulaItemDragStart(e, column.columnName)
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className="draggable-section operations-section">
                      <h4>Operations</h4>
                      <div className="operations-grid">
                        {['+', '-', '×', '÷', '(', ')'].map((op) => (
                          <Button
                            key={op}
                            text={op}
                            className="operation-button"
                            draggable
                            onDragStart={(e) =>
                              handleFormulaItemDragStart(e, op)
                            }
                          />
                        ))}
                      </div>

                      {recentFormulas.length > 0 && (
                        <>
                          <h4 style={{ marginTop: '15px' }}>Recent Formulas</h4>
                          <div className="recent-formulas">
                            {recentFormulas.map((formula, idx) => (
                              <Button
                                key={idx}
                                text={formula.join(' ')}
                                className="recent-formula-button"
                                small={true}
                                minimal={true}
                                onClick={() => setFormulaElements([...formula])}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="current-formula-section">
                    <label>Current Formula:</label>
                    <div className="current-formula-display">
                      {formulaElements.length > 0
                        ? formulaString
                        : 'No formula defined'}
                    </div>
                  </div>

                  <div className="column-name-customization">
                    <label>New Column Name:</label>
                    <input
                      type="text"
                      className="column-name-input"
                      value={customColumnName}
                      onChange={(e) => setCustomColumnName(e.target.value)}
                      placeholder="Enter column name"
                    />
                    <div className="column-generation-warning">
                      <Icon
                        icon="warning-sign"
                        intent={Intent.WARNING}
                        size={14}
                      />
                      <span>
                        This will automatically generate a new column in your
                        table
                      </span>
                    </div>
                  </div>

                  <div className="calculation-button-container">
                    <Button
                      text="Calculate"
                      intent={Intent.PRIMARY}
                      onClick={applyCustomCalculation}
                      className="apply-button"
                      disabled={
                        formulaElements.length === 0 || !customColumnName.trim()
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showFloatingToolbar && (
        <div
          ref={dragRefs.dragRef}
          className={`floating-buttons ${
            toolbarPosition.isDragging ? 'dragging' : ''
          }`}
          style={{
            top:
              toolbarPosition.top !== null
                ? `${toolbarPosition.top}px`
                : `${window.innerHeight / 2 - 100}px`, // Center vertically
            left:
              toolbarPosition.left !== null
                ? `${toolbarPosition.left}px`
                : `${getRightmostColumnPosition(selectedRegions) + 180}px`, // Position to the right of selected columns
            position: toolbarPosition.top !== null ? 'fixed' : 'absolute',
          }}
          onPointerDown={(e) =>
            handleDragStart(e, dragRefs, setToolbarPosition)
          }
          onPointerMove={(e) =>
            handleDrag(e, dragRefs, toolbarPosition, setToolbarPosition)
          }
          onPointerUp={(e) =>
            handleDragEnd(e, dragRefs, toolbarPosition, setToolbarPosition)
          }
          onPointerCancel={(e) =>
            handleDragEnd(e, dragRefs, toolbarPosition, setToolbarPosition)
          }
        >
          <div className="toolbar-header">
            <span className="toolbar-title">Calculator</span>
            <span className="drag-handle">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#394b59">
                <path d="M3,15V13H5V15H3M3,11V9H5V11H3M7,15V13H9V15H7M7,11V9H9V11H7M11,15V13H13V15H11M11,11V9H13V11H11M15,15V13H17V15H15M15,11V9H17V11H15M19,15V13H21V15H19M19,11V9H21V11H19Z" />
              </svg>
            </span>
          </div>
          <div className="button-group">
            <HTMLSelect
              value={currentFunction}
              onChange={(e) =>
                setCurrentFunction(e.target.value as CalculationType)
              }
              className="function-select"
            >
              {['Sum', 'Average', 'Count', 'Max', 'Min', 'Other'].map(
                (func) => (
                  <option key={func} value={func}>
                    {func}
                  </option>
                ),
              )}
            </HTMLSelect>
            <Tooltip
              content={
                currentFunction === 'Other'
                  ? 'Column Calculation'
                  : `Proceed (Space)`
              }
              position={Position.BOTTOM}
              className="dark-tooltip"
            >
              <Button
                icon={currentFunction === 'Other' ? 'edit' : 'calculator'}
                size="small"
                intent="primary"
                onClick={
                  currentFunction === 'Other'
                    ? () => handleCustomizeColumn(true)
                    : calculate
                }
              />
            </Tooltip>
            <Tooltip
              content="Cancel selections (Esc)"
              position={Position.BOTTOM}
              className="dark-tooltip"
            >
              <Button
                icon="cross"
                size="small"
                intent="danger"
                onClick={cancelSelection}
              />
            </Tooltip>
            {toolbarPosition.top !== null && (
              <Tooltip
                content="Restore floating position (R)"
                position={Position.BOTTOM}
                className="dark-tooltip"
              >
                <Button
                  icon="locate"
                  size="small"
                  intent="warning"
                  onClick={restoreToolbarPosition}
                />
              </Tooltip>
            )}
          </div>

          {/* Expand button */}
          <div className="expand-button-container">
            <Tooltip
              content="Expand calculator"
              position={Position.RIGHT}
              className="dark-tooltip"
            >
              <Button
                minimal={true}
                small={true}
                className="expand-button"
                onClick={() => setIsExpandedPanelOpen(!isExpandedPanelOpen)}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {/* Top-right arrow */}
                  <path d="M14,3L21,3L21,10" />
                  <path d="M21,3L13,11" />

                  {/* Bottom-left arrow */}
                  <path d="M10,21L3,21L3,14" />
                  <path d="M3,21L11,13" />
                </svg>
              </Button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Multiple column warning dialog */}
      <Dialog
        isOpen={showMultiColumnWarning && isCalculateActive}
        onClose={handleCancelMultiColumnWarning}
        title="Multiple Variables Selected"
        className="column-warning-dialog"
        canOutsideClickClose={true}
        canEscapeKeyClose={true}
      >
        <div className="warning-content">
          <div className="warning-header">
            <Icon icon="warning-sign" intent={Intent.WARNING} size={18} />
            <h3>Please select one variable for aggregation method</h3>
          </div>
          <p>
            You've selected multiple data columns for aggreagation methods.
            Choose which variable to use for the {currentFunction.toLowerCase()}{' '}
            calculation:
          </p>

          <div className="column-selection">
            {selectedColumns.map((colName) => (
              <Button
                key={colName}
                text={colName}
                fill={true}
                className="column-select-button"
                onClick={() => handleProceedWithCalculation(colName)}
              />
            ))}
          </div>

          <div className="warning-actions">
            <Button
              icon="edit"
              text="Reselect"
              onClick={handleReselect}
              className="reselect-button"
            />
            <Button
              text="Cancel"
              onClick={handleCancelMultiColumnWarning}
              className="cancel-button"
            />
          </div>
        </div>
      </Dialog>

      <ResultDialog
        isOpen={showResult && isCalculateActive}
        onClose={() => setShowResult(false)}
        result={calculatedResult}
        calculationType={currentFunction}
        columnName={selectedColumn}
        timeRange={timeRange}
      />

      {/* Column Customize Dialog - Only show if expanded panel is not open */}
      <Dialog
        isOpen={showCustomizeDialog && !isExpandedPanelOpen}
        onClose={() => {
          setShowCustomizeDialog(false);
          // Reset the function to Sum if it was Other
          if (currentFunction === 'Other') {
            setCurrentFunction('Sum');
          }
        }}
        title="Column Calculation"
        className="column-warning-dialog customize-column-dialog"
        canOutsideClickClose={true}
        canEscapeKeyClose={true}
      >
        <div className="warning-content">
          {/* Formula Builder Section */}
          <div className="formula-builder-section">
            <label>Build your formula:</label>

            <div
              ref={formulaBuilderRef}
              className={`formula-preview ${isDragging ? 'dragging-over' : ''}`}
              onDragOver={handleFormulaBuilderDragOver}
              onDrop={handleFormulaBuilderDrop}
            >
              {formulaElements.length > 0 ? (
                <div className="formula-elements">
                  {formulaElements.map((element, index) => (
                    <div key={index} className="formula-pill">
                      {element}
                      <Button
                        icon="cross"
                        minimal={true}
                        small={true}
                        onClick={() => removeFormulaElement(index)}
                        className="remove-element"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-formula-preview">
                  <span>Drag columns and operations here</span>
                </div>
              )}
            </div>

            <div className="formula-controls">
              <Button
                icon="trash"
                text="Clear Formula"
                minimal={true}
                onClick={clearFormula}
                disabled={formulaElements.length === 0}
              />
            </div>
          </div>

          <div className="columns-operations-container">
            <div className="draggable-section column-section">
              <h4>Available Columns</h4>
              <div className="column-selection">
                {localTableColumns.map((column) => (
                  <Button
                    key={column.columnId}
                    text={column.columnName}
                    className="column-select-button"
                    fill={true}
                    draggable
                    onDragStart={(e) =>
                      handleFormulaItemDragStart(e, column.columnName)
                    }
                  />
                ))}
              </div>
            </div>

            <div className="draggable-section operations-section">
              <h4>Operations</h4>
              <div className="operations-grid">
                {['+', '-', '×', '÷', '(', ')'].map((op) => (
                  <Button
                    key={op}
                    text={op}
                    className="operation-button"
                    draggable
                    onDragStart={(e) => handleFormulaItemDragStart(e, op)}
                  />
                ))}
              </div>

              {recentFormulas.length > 0 && (
                <>
                  <h4 style={{ marginTop: '15px' }}>Recent Formulas</h4>
                  <div className="recent-formulas">
                    {recentFormulas.map((formula, idx) => (
                      <Button
                        key={idx}
                        text={formula.join(' ')}
                        className="recent-formula-button"
                        small={true}
                        minimal={true}
                        onClick={() => setFormulaElements([...formula])}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="current-formula-section">
            <label>Current Formula:</label>
            <div className="current-formula-display">
              {formulaElements.length > 0
                ? formulaString
                : 'No formula defined'}
            </div>
          </div>

          <div className="column-name-customization">
            <label>New Column Name:</label>
            <input
              type="text"
              className="column-name-input"
              value={customColumnName}
              onChange={(e) => setCustomColumnName(e.target.value)}
              placeholder="Enter column name"
            />
            <div className="column-generation-warning">
              <Icon icon="warning-sign" intent={Intent.WARNING} size={14} />
              <span>
                This will automatically generate a new column in your table
              </span>
            </div>
          </div>

          <div className="dialog-footer warning-actions">
            <Button
              text="Cancel"
              onClick={() => {
                setShowCustomizeDialog(false);
                // Reset the function to Sum if it was Other
                if (currentFunction === 'Other') {
                  setCurrentFunction('Sum');
                }
              }}
              className="cancel-button"
            />
            <Button
              text="Calculate"
              intent={Intent.PRIMARY}
              onClick={applyCustomCalculation}
              className="apply-button"
              disabled={
                formulaElements.length === 0 || !customColumnName.trim()
              }
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default DataTable;
