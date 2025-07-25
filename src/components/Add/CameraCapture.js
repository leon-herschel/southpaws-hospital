import React, { useState, useRef } from "react";
import { Button, Form } from "react-bootstrap";

function CameraCapture({ setPetImage }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            videoRef.current.srcObject = stream;
            setStream(stream);
        } catch (error) {
            console.error("Error accessing the camera: ", error);
        }
    };

    const captureImage = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to image file
        canvas.toBlob((blob) => {
            const file = new File([blob], "captured_image.jpg", { type: "image/jpeg" });
            setPetImage(file);
            setCapturedImage(URL.createObjectURL(blob));
        }, "image/jpeg");

        // Stop camera stream
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    };

    return (
        <div>
            {!capturedImage ? (
                <>
                    <video ref={videoRef} autoPlay style={{ width: "100%", maxHeight: "300px", display: stream ? "block" : "none" }} />
                    <Button onClick={startCamera} variant="secondary" className="mt-2">
                        Open Camera
                    </Button>
                    {stream && <Button onClick={captureImage} variant="success" className="mt-2 ms-2">Capture</Button>}
                </>
            ) : (
                <img src={capturedImage} alt="Captured" style={{ width: "100%", maxHeight: "300px" }} />
            )}
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
        </div>
    );
}

export default CameraCapture;
