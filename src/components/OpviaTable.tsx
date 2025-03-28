import * as React from 'react';
import TableToolbar from './TableToolbar';
import DataTable from './DataTable';

const OpviaTable: React.FC = () => {
  const [isCalculateActive, setIsCalculateActive] = React.useState(false);

  // Event handlers for the toolbar buttons
  const handleFilterClick = () => {
    console.log('Filter button clicked');
    // Implement filtering functionality
  };

  const handleSortClick = () => {
    console.log('Sort button clicked');
    // Implement sorting functionality
  };

  const handleColumnsClick = () => {
    console.log('Columns button clicked');
    // Implement column management functionality
  };

  const handleRowSizeClick = () => {
    console.log('Row size button clicked');
    // Implement row size adjustment functionality
  };

  const handleValidationClick = () => {
    console.log('Validation button clicked');
    // Implement validation functionality
  };

  const handleCalculationClick = () => {
    // Toggle calculation mode
    setIsCalculateActive(!isCalculateActive);
  };

  return (
    <div className="table-container">
      {/* Toolbar Module */}
      <TableToolbar
        onFilterClick={handleFilterClick}
        onSortClick={handleSortClick}
        onColumnsClick={handleColumnsClick}
        onRowSizeClick={handleRowSizeClick}
        onValidationClick={handleValidationClick}
        onCalculationClick={handleCalculationClick}
        activeCalculate={isCalculateActive}
      />

      {/* Data Table Module */}
      <DataTable isCalculateActive={isCalculateActive} />
    </div>
  );
};

export default OpviaTable;
