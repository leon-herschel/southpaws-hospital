import { useEffect, useState } from "react";
import AddAppointments from "./ClientInfo";
import ErrorPage from "../Settings/ErrorPage";
import axios from "axios";

function ClientAppointmentForm() {
  const [appointmentFormEnabled, setAppointmentFormEnabled] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost/api/ClientSide/get-booking-status.php")
      .then((res) => setAppointmentFormEnabled(res.data.appointmentFormEnabled))
      .catch((err) => {
        console.error("Error fetching status", err);
        setAppointmentFormEnabled(false); // fallback to error page
      });
  }, []);

  if (appointmentFormEnabled === null) return <p>Loading...</p>;

  return appointmentFormEnabled ? <AddAppointments /> : <ErrorPage />;
}

export default ClientAppointmentForm;
