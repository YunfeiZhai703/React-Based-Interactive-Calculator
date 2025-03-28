import * as React from 'react';
import { Button, Tooltip, Position, ButtonGroup } from '@blueprintjs/core';

interface TableToolbarProps {
  // Add any props you might need to control the toolbar in the future
  onFilterClick?: () => void;
  onSortClick?: () => void;
  onColumnsClick?: () => void;
  onRowSizeClick?: () => void;
  onValidationClick?: () => void;
  onCalculationClick?: () => void;
  activeCalculate?: boolean;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  onFilterClick,
  onSortClick,
  onColumnsClick,
  onRowSizeClick,
  onValidationClick,
  onCalculationClick,
  activeCalculate = false,
}) => {
  const [activeButton, setActiveButton] = React.useState<string | null>(null);

  // Handle regular toolbar buttons (not calculate)
  const handleButtonClick = (buttonName: string, callback?: () => void) => {
    if (buttonName !== 'calculate') {
      // For non-calculate buttons, toggle local state
      setActiveButton(activeButton === buttonName ? null : buttonName);
    }

    // Call the provided callback
    if (callback) callback();
  };

  return (
    <div className="table-controls-standalone">
      <ButtonGroup className="table-control-buttons-large">
        <Tooltip content="Filter data" position={Position.BOTTOM}>
          <Button
            icon="filter-list"
            text="Filter"
            onClick={() => handleButtonClick('filter', onFilterClick)}
            className="toolbar-button"
            active={activeButton === 'filter'}
          />
        </Tooltip>
        <Tooltip content="Sort data" position={Position.BOTTOM}>
          <Button
            icon="sort-alphabetical"
            text="Sort"
            onClick={() => handleButtonClick('sort', onSortClick)}
            className="toolbar-button"
            active={activeButton === 'sort'}
          />
        </Tooltip>
        <Tooltip content="Manage columns" position={Position.BOTTOM}>
          <Button
            icon="column-layout"
            text="Columns"
            onClick={() => handleButtonClick('columns', onColumnsClick)}
            className="toolbar-button"
            active={activeButton === 'columns'}
          />
        </Tooltip>
        <Tooltip content="Adjust row size" position={Position.BOTTOM}>
          <Button
            icon="horizontal-distribution"
            text="Row size"
            onClick={() => handleButtonClick('rowSize', onRowSizeClick)}
            className="toolbar-button"
            active={activeButton === 'rowSize'}
          />
        </Tooltip>
        <Tooltip content="Validate data" position={Position.BOTTOM}>
          <Button
            icon="confirm"
            text="Validation"
            onClick={() => handleButtonClick('validation', onValidationClick)}
            className="toolbar-button"
            active={activeButton === 'validation'}
          />
        </Tooltip>
        <Tooltip content="Enter calculation mode" position={Position.BOTTOM}>
          <Button
            icon="calculator"
            text="Calculate"
            onClick={onCalculationClick}
            className="toolbar-button"
            intent={activeCalculate ? 'primary' : undefined}
          />
        </Tooltip>
      </ButtonGroup>
    </div>
  );
};

export default TableToolbar;
