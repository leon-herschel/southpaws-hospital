import React, { useState } from "react";
import ArchivedRecords from "../components/Archive";
import ArchivedRestore from "../components/ArchivedRestore";
import { Button } from "react-bootstrap";

const ArchiveManager = () => {
    const [showArchived, setShowArchived] = useState(true); // Default to archived view

    return (
        <div className="container mt-4">
            {/* Show Archived or Restore View */}
            {showArchived ? <ArchivedRecords /> : <ArchivedRestore />}

            {/* Floating Toggle Button */}
            <div className="floating-button">
                <Button 
                    variant={showArchived ? "success" : "primary"}
                    onClick={() => setShowArchived(!showArchived)}
                >
                    {showArchived ? "View Restorable Records" : "View Archived Records"}
                </Button>
            </div>
        </div>
    );
};

export default ArchiveManager;
