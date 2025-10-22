import { Form } from "react-bootstrap";
import { format } from "date-fns";

const DateRangePicker = ({ startDate, endDate, onChange }) => {
  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div className="d-flex">
        <label htmlFor="fromDate" className="me-2">
          From:
        </label>
        <Form.Control
          type="date"
          id="fromDate"
          className="form-control me-3 shadow-sm"
          value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
          onChange={(e) =>
            onChange({
              startDate: e.target.value ? new Date(e.target.value) : null,
              endDate,
            })
          }
        />
        <label htmlFor="toDate" className="me-2">
          To:
        </label>
        <Form.Control
          type="date"
          id="toDate"
          className="form-control shadow-sm"
          value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
          onChange={(e) =>
            onChange({
              startDate,
              endDate: e.target.value ? new Date(e.target.value) : null,
            })
          }
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
