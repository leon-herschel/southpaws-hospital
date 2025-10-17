import React from "react";
import { Form } from "react-bootstrap";
import { format } from "date-fns";

const DateRangePicker = ({ startDate, endDate, onChange }) => {
  return (
    <div className="d-flex align-items-center gap-2">
      <Form.Control
        type="date"
        value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
        onChange={(e) =>
          onChange({ startDate: e.target.value ? new Date(e.target.value) : null, endDate })
        }
      />
      <span>to</span>
      <Form.Control
        type="date"
        value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
        onChange={(e) =>
          onChange({ startDate, endDate: e.target.value ? new Date(e.target.value) : null })
        }
      />
    </div>
  );
};

export default DateRangePicker;
