import React, { useState } from "react";
import ArchivedRecords from "../components/Archive";
import ArchivedRestore from "../components/ArchivedRestore";
import { Tabs, Tab } from "react-bootstrap";

const ArchiveManager = () => {
    const [key, setKey] = useState("restore"); // Default tab

    return (
        <div className="container">
            {/* Tabs for switching views */}
            <Tabs
                id="archive-manager-tabs"
                activeKey={key}
                onSelect={(k) => setKey(k)}
                className="mb-3"
                justify
            >
                <Tab eventKey="archived" title="Record Archiver">
                    <ArchivedRecords />
                </Tab>
                <Tab eventKey="restore" title="Archived Records">
                    <ArchivedRestore />
                </Tab>
            </Tabs>
        </div>
    );
};

export default ArchiveManager;
