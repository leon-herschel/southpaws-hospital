import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const BarcodePrint = ({ sku }) => {
    const barcodeRef = useRef(null);

    useEffect(() => {
        if (barcodeRef.current && sku) {
            JsBarcode(barcodeRef.current, sku, {
                format: "CODE128",
                displayValue: true,
                lineColor: "#000",
                width: 2,
                height: 50,
            });
        }
    }, [sku]);

    return (
        <div>
            <svg ref={barcodeRef} />
        </div>
    );
};

export default BarcodePrint;
