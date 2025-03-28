import * as React from 'react';
import { Button, Dialog, Icon, Tooltip, Position } from '@blueprintjs/core';

export type CalculationType =
  | 'Sum'
  | 'Average'
  | 'Count'
  | 'Max'
  | 'Min'
  | 'Other';

interface ResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  result: number;
  calculationType: CalculationType;
  columnName?: string;
  timeRange?: {
    start: string;
    end: string;
  };
}

export const ResultDialog: React.FC<ResultDialogProps> = ({
  isOpen,
  onClose,
  result,
  calculationType,
  columnName = '',
  timeRange = { start: '', end: '' },
}) => {
  const [copySuccess, setCopySuccess] = React.useState(false);

  const formattedResult = result.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  // Format the time range in a more readable way if present
  const formatTimeRange = () => {
    if (!timeRange.start || !timeRange.end) return '';

    // Format the date and time properly
    const formatDateTime = (dateTimeStr: string) => {
      // Keep the full ISO string but split appropriately
      const parts = dateTimeStr.split('T');

      if (parts.length === 2) {
        // Get date in yyyy-MM-dd format
        const date = parts[0];

        // Format time with UTC indicator, preserving all components
        let time = parts[1];

        // Ensure the complete time format is preserved
        if (time.endsWith('Z')) {
          // Preserve the entire time string with Z indicator
          // But format it for readability if needed
          const timeWithoutZ = time.substring(0, time.length - 1);

          // Split into components (hours:minutes:seconds.milliseconds)
          const timeParts = timeWithoutZ.split(':');

          if (timeParts.length >= 2) {
            // Format with all parts including milliseconds if present
            if (timeParts.length > 2) {
              // This preserves seconds.milliseconds
              time = `${timeParts[0]}:${timeParts[1]}:${timeParts[2]}Z`;
            } else {
              time = `${timeParts[0]}:${timeParts[1]}Z`;
            }
          }
        }

        return {
          date,
          time,
        };
      }

      return {
        date: dateTimeStr,
        time: '',
      };
    };

    const start = formatDateTime(timeRange.start);
    const end = formatDateTime(timeRange.end);

    return (
      <div className="time-range">
        <div className="time-range-item">
          <div className="time-range-date">{start.date}</div>
          {start.time && <div className="time-range-time">{start.time}</div>}
        </div>
        <span className="time-range-arrow">→</span>
        <div className="time-range-item">
          <div className="time-range-date">{end.date}</div>
          {end.time && <div className="time-range-time">{end.time}</div>}
        </div>
      </div>
    );
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(formattedResult)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => console.error('Failed to copy: ', err));
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Result"
      className="result-dialog"
    >
      <div className="result-content">
        {/* Calculation Type Section */}
        <div className="result-section calculation-type-section">
          <div className="result-section-label">Calculation</div>
          <div className="result-section-content">
            <span className="calculation-type-value">{calculationType}</span>
          </div>
        </div>

        {/* Column Variable Section */}
        <div className="result-section column-section">
          <div className="result-section-label">Column</div>
          <div className="result-section-content">
            <span className="column-name-value">{columnName}</span>
          </div>
        </div>

        {/* Time Range Section */}
        <div className="result-section time-range-section">
          <div className="result-section-label">Time Range</div>
          <div className="result-section-content">{formatTimeRange()}</div>
        </div>

        {/* Result Value Section */}
        <div className="result-section result-value-section">
          <div className="result-section-label">Result</div>
          <div className="result-section-content">
            <div className="result-value-container">
              <span className="result-value">{formattedResult}</span>
              <Tooltip
                content={copySuccess ? 'Copied!' : 'Copy to clipboard'}
                position={Position.TOP}
              >
                <Button
                  icon={copySuccess ? 'tick' : 'clipboard'}
                  minimal={true}
                  onClick={handleCopy}
                  className="copy-button"
                  intent={copySuccess ? 'success' : 'none'}
                />
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export const calculateResult = (
  values: number[],
  currentFunction: CalculationType,
): number => {
  let result = 0;

  switch (currentFunction) {
    case 'Sum':
      result = values.reduce((sum, val) => sum + val, 0);
      break;
    case 'Average':
      result =
        values.length > 0
          ? values.reduce((sum, val) => sum + val, 0) / values.length
          : 0;
      break;
    case 'Count':
      result = values.length;
      break;
    case 'Max':
      result = values.length > 0 ? Math.max(...values) : 0;
      break;
    case 'Min':
      result = values.length > 0 ? Math.min(...values) : 0;
      break;
    case 'Other':
      // No calculation needed for Other option
      result = 0;
      break;
  }

  return result;
};
