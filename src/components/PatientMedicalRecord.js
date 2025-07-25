import React from "react";

const PatientMedicalRecord = () => {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>PATIENT MEDICAL RECORD</h1>

      <form style={{ border: "1px solid #000", padding: "20px", borderRadius: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ flex: "1", marginRight: "10px" }}>
            <label>Owner's Name:</label>
            <input type="text" style={{ width: "100%", padding: "5px" }} />
          </div>
          <div style={{ flex: "1", marginLeft: "10px" }}>
            <label>Date:</label>
            <input type="date" style={{ width: "100%", padding: "5px" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ flex: "1", marginRight: "10px" }}>
            <label>Pet's Name:</label>
            <input type="text" style={{ width: "100%", padding: "5px" }} />
          </div>
          <div style={{ flex: "1", marginLeft: "10px" }}>
            <label>Body Weight:</label>
            <input type="text" style={{ width: "100%", padding: "5px" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ flex: "1", marginRight: "10px" }}>
            <label>Species:</label>
            <input type="text" style={{ width: "100%", padding: "5px" }} />
          </div>
          <div style={{ flex: "1", marginLeft: "10px" }}>
            <label>Breed:</label>
            <input type="text" style={{ width: "100%", padding: "5px" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ flex: "1", marginRight: "10px" }}>
            <label>Birthdate:</label>
            <input type="date" style={{ width: "100%", padding: "5px" }} />
          </div>
          <div style={{ flex: "1", marginLeft: "10px" }}>
            <label>Color:</label>
            <input type="text" style={{ width: "100%", padding: "5px" }} />
          </div>
        </div>

        <h3>PHYSICAL EXAM FINDINGS: require Receptionists findings/diagnosis</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #000", padding: "8px" }}>Rectal Temperature</th>
              <th style={{ border: "1px solid #000", padding: "8px" }}>Oral Cavity</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Heart Rate</td>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Lymph Nodes</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Respiratory Rate</td>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Abdomen</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "8px" }}>BCS</td>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Cardiovascular</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "8px" }}>General Appearance</td>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Respiratory</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "8px" }}>MM</td>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Genitourinary</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Ears</td>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Integument</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Eyes</td>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Musculoskeletal</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Nose</td>
              <td style={{ border: "1px solid #000", padding: "8px" }}>Neuro</td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginBottom: "20px" }}>
          <label>Chief Complaint:</label>
          <textarea style={{ width: "100%", padding: "5px" }} rows="3"></textarea>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>History:</label>
          <textarea style={{ width: "100%", padding: "5px" }} rows="3"></textarea>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>Diagnostic Plan:</label>
          <textarea style={{ width: "100%", padding: "5px" }} rows="3"></textarea>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>Differentials:</label>
          <textarea style={{ width: "100%", padding: "5px" }} rows="3"></textarea>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>Treatment Plan:</label>
          <textarea style={{ width: "100%", padding: "5px" }} rows="3"></textarea>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>Veterinarian:</label>
          <input type="text" style={{ width: "100%", padding: "5px" }} />
        </div>

        <button type="submit" style={{ padding: "10px 20px", background: "#007BFF", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default PatientMedicalRecord;
