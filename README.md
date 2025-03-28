# Opvia Data Table - Calculation Features

# Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Using the Calculation Features](#using-the-calculation-features)
   - [Floating Calculator](#floating-calculator)
   - [Calculator Panel](#calculator-panel)
   - [Performing Aggregation Calculations](#performing-aggregation-calculations)
   - [Column Calculations](#column-calculations)
4. [Rate of Change Calculations](#rate-of-change-calculations)
5. [Future Improvements](#future-improvements)
   - [Calculations](#calculations)
   - [Features](#features)
   - [UI Enhancements](#ui-enhancements)

## Introduction

The Opvia Data Table's Calculation mode delivers robust calculation capabilities directly within the table interface. With this mode, you can:

- Perform aggregation functions on selected cells.
    
- Calculate values across entire columns.
    
- Create custom calculated columns using your own formulas.

The supported calculation types include:

- **Sum:** Totals all numeric values in the selection.
    
- **Average:** Computes the mean of numeric values.
    
- **Count:** Tallies the number of numeric values.
    
- **Max:** Identifies the highest value.
    
- **Min:** Identifies the lowest value.
    
- **Other/Custom:** Lets you build a formula combining multiple columns.

# Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/product-challenge.git
   cd product-challenge
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

  

3. Start the development server:

```bash
   npm run dev
```

Once the server is running, open your localhost to view the interface. The displayed sample data table uses placeholder values. At this stage, only the calculation functions are active—the Filter, Sort, Columns, Row Size, and Validation buttons are non-functional placeholders intended to simulate a fully operational environment.

![Table interface showing calculation features](images/Pasted%20image%2020250328212719.png)

To activate the calculation features:

1. Click the **"Calculate"** button on the table toolbar. When the button turns blue, calculation mode is active.
![Calculate button in active state](images/Pasted%20image%2020250328213548.png)

2. With calculation mode enabled, you can select cells to perform calculations.

3. Simply press the button again to deactive calculation mode and revert to normal working mode.
![Calculate button in inactive state](images/Pasted%20image%202025032821134.png)
# Using the Calculation Features

### Floating Calculator

When calculation mode is activated, simply select one or more cells to reveal a dynamic toolbar on the right side of the column. This toolbar adjusts its position based on your selection.

![Floating calculator toolbar](images/Pasted%20image%2020250328213852.png)

If you prefer a fixed position for the calculator, drag it to your desired spot. A "Restore Position" button is available to return the toolbar to its dynamic placement.
![Fixed position calculator](images/Pasted%20image%2020250328214144.png)

### Calculator panel
For a more advanced experience, click the expand button located at the bottom left of the floating calculator. This expands the toolbar to a panel on the right side of the app, where all features are displayed. To revert to the floating toolbar, click the collapse button at the top right corner of the panel.
![Expanded calculator panel](images/Pasted%20image%2020250328214345.png)

### Switching between
You can toggle between the floating calculator and the expanded panel at any time using the respective collapse and expand buttons.
### Performing Aggregation Calculations
You can perform aggregation calculations using either the floating calculator or the calculator panel.
##### Using the Floating Calculator
To perform aggregation calculations on selected elements:

1. Open the dropdown menu on the floating calculator and select one of the aggregation functions (Sum, Average, Count, Max, or Min). The "Other" option is reserved for custom formulas.

![Aggregation functions dropdown](images/Pasted%20image%2020250328214813.png)

2. Click the blue **Proceed** button.

3. A dialog will appear displaying:

	- The selected calculation type.
	    
	- The name of the column.
	    
	- The time range of your selection (based on the Time column).
	    
	- The computed result, which can be copied.

![Calculation result dialog](images/Pasted%20image%2020250328214910.png)

_Note:_ Currently, aggregation methods only support calculations on a single column. If multiple columns are selected, a warning will prompt you to choose only one column.
![Multiple columns warning](images/Pasted%20image%202025032820318.png)

##### Using the Calculator Panel
To perform aggregation calculations on selected elements:

1. Expand the **Direct Calculations on Selected Cells** toggler.
    
2. Click the function you wish to perform.
    
3. The result dialog will appear, similar to the floating calculator's output.



### Column Calculations
Column calculations can also be performed via the floating calculator or the calculator panel. When calculating across columns, a new column will be created automatically to display the results.

##### Using the Floating Calculator
To perform calculations on entire columns:

1. Select the **Other** option from the dropdown menu.
![Other option selection](images/Pasted%20image%2020250328215650.png)

2. Click the blue button to initiate Column Calculations.
![Column calculations button](images/Pasted%20image%2020250328215728.png)

3. A window will appear where you can:
	- Construct your formula using available columns and operations.
	    
	- Monitor the formula as it's being built.
	    
	- Input the name for the new column.
![Column calculation window](images/Pasted%20image%2020250328215810.png)

##### Using the Calculator Panel
If you are working with the panel, simply click the Column Calculation toggler in the panel to access the same features available in the window described above.
![Calculator panel column calculation](images/Pasted%20image%202025032820104.png)

# Rate of Change Calculations

The data table currently does not support rate of change calculations, but this feature is planned for future implementation. Rate of change calculations would be particularly useful for analyzing growth trends.

### Implementation Requirements

To enable rate of change calculations, the following system enhancements would be needed:

1. **Data Structure Updates**
   - Ensure the Time column maintains proper ordering
   - Add support for row-level calculations that can reference previous row values
   - Implement data validation to handle missing or invalid time-series data

2. **Formula Engine Enhancements**
   - Extend the formula builder to support row-level references (e.g., `PREVIOUS_ROW()`, `NEXT_ROW()`)
   - Add support for time-based window functions
   - Implement proper handling of edge cases (first/last rows)

3. **UI Components**
   - Add rate of change calculation templates to the formula builder
   - Create a dedicated rate of change calculation tool
   - Implement visualization options for rate of change results

### Example Implementation

Once implemented, rate of change calculations would work as follows:

1. Select the column containing the values to analyze (e.g., Cell Count)
2. Choose the **Other** option from the calculation dropdown
3. Use the formula builder to create a rate of change formula:
   ```
   (Current Value - Previous Value) / Previous Value * 100
   ```

For example, to calculate the rate of cell count growth:
1. Select the Cell Count column
2. Use the Column Calculation feature
3. Create a formula that references the current row's Cell Count and the previous row's Cell Count
4. The result will be displayed as a percentage in a new column


# Future Improvements

 To further enhance the calculation features, consider the following potential improvements:

### Calculations

-  Add advanced statistical functions (e.g., median, mode, standard deviation).
    
-  Enable time-based calculations (e.g., growth rates, moving averages).
    
-  Allow aggregation across multiple columns where applicable.
    
-  Provide more flexibility for calculations on selected cell ranges.
    

### Features

-  Add more cells features (editing, adding more columns and rows).
    
-  Export calculation results to CSV or Excel.
    
-  Introduce visualization options for calculation results (charts, trend analysis).
    
-  Implement a batch calculation mode for applying the same calculation to multiple selections.
    
-  Add keyboard shortcuts for common calculation functions.
    
-  Maintain a calculation history with options to revert changes.
    
-  Offer calculation templates for common industry-specific formulas.
    

### UI Enhancements

-  Refine the styling for a cleaner look.
    
-  Enhance the interface's dynamic behavior to better adapt to a variety of window sizes.
    
-  Address potential bugs and improve overall stability.
