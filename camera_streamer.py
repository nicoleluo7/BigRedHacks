"""
Camera Streamer Module
Streams camera feed from Python OpenCV to web frontend via HTTP.

Author: Gesture Recognition Team Member
For: BigRedHacks MVP
"""

import cv2
import threading
import time
import base64
import json
import logging
from typing import Optional
import requests
from io import BytesIO
from PIL import Image

logger = logging.getLogger(__name__)


class CameraStreamer:
    """
    Streams camera feed to web frontend via HTTP endpoint.
    """

    def __init__(self, camera_index: int = 1, server_url: str = "http://localhost:3001"):
        """
        Initialize camera streamer.

        Args:
            camera_index: Camera device index
            server_url: URL of the web server to send frames to
        """
        self.camera_index = camera_index
        self.server_url = server_url.rstrip("/")
        self.cap = None
        self.streaming = False
        self.frame_data = None
        self.last_gesture = None
        self.frame_lock = threading.Lock()
        
        logger.info(f"CameraStreamer initialized for camera {camera_index}")

    def start_camera(self) -> bool:
        """
        Start the camera capture.

        Returns:
            True if camera started successfully, False otherwise
        """
        try:
            self.cap = cv2.VideoCapture(self.camera_index)
            if not self.cap.isOpened():
                logger.error(f"Failed to open camera {self.camera_index}")
                return False

            # Set camera properties
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)

            logger.info(f"Camera {self.camera_index} started successfully")
            return True

        except Exception as e:
            logger.error(f"Error starting camera: {e}")
            return False

    def start_streaming(self):
        """Start streaming camera feed to web server."""
        if not self.cap or not self.cap.isOpened():
            if not self.start_camera():
                logger.error("Failed to start camera for streaming")
                return

        self.streaming = True
        logger.info("Starting camera stream to web server")

        # Start streaming thread
        threading.Thread(target=self._stream_loop, daemon=True).start()

    def stop_streaming(self):
        """Stop streaming camera feed."""
        self.streaming = False
        logger.info("Stopping camera stream")

    def stop_camera(self):
        """Stop camera and release resources."""
        self.stop_streaming()
        if self.cap:
            self.cap.release()
            self.cap = None
        logger.info("Camera stopped")

    def update_frame(self, frame, detected_gesture: Optional[str] = None):
        """
        Update the current frame data.

        Args:
            frame: OpenCV frame (BGR format)
            detected_gesture: Recently detected gesture name
        """
        if frame is None:
            return

        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Convert to PIL Image
        pil_image = Image.fromarray(rgb_frame)
        
        # Resize for web display
        pil_image = pil_image.resize((640, 480), Image.Resampling.LANCZOS)
        
        # Convert to base64
        buffer = BytesIO()
        pil_image.save(buffer, format='JPEG', quality=85)
        img_str = base64.b64encode(buffer.getvalue()).decode()

        with self.frame_lock:
            self.frame_data = {
                'image': img_str,
                'timestamp': time.time(),
                'gesture': detected_gesture
            }
            if detected_gesture:
                self.last_gesture = detected_gesture

    def _stream_loop(self):
        """Main streaming loop that sends frames to web server."""
        while self.streaming:
            try:
                with self.frame_lock:
                    if self.frame_data:
                        # Send frame to web server
                        self._send_frame_to_server(self.frame_data)
                
                # Stream at ~10 FPS to reduce bandwidth
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error in streaming loop: {e}")
                time.sleep(1)

    def _send_frame_to_server(self, frame_data):
        """
        Send frame data to web server.

        Args:
            frame_data: Dictionary containing image and metadata
        """
        try:
            response = requests.post(
                f"{self.server_url}/api/camera-frame",
                json=frame_data,
                timeout=1.0
            )
            
            if response.status_code != 200:
                logger.warning(f"Server returned status {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            # Don't log every connection error to avoid spam
            pass

    def get_last_gesture(self) -> Optional[dict]:
        """
        Get information about the last detected gesture.

        Returns:
            Dictionary with gesture info or None
        """
        if self.last_gesture:
            return {
                'gesture': self.last_gesture,
                'timestamp': time.time()
            }
        return None


# Global camera streamer instance
camera_streamer = None


def initialize_camera_streamer(camera_index: int = 1, server_url: str = "http://localhost:3001"):
    """
    Initialize the global camera streamer.

    Args:
        camera_index: Camera device index
        server_url: URL of the web server
    """
    global camera_streamer
    camera_streamer = CameraStreamer(camera_index, server_url)
    return camera_streamer


def get_camera_streamer() -> Optional[CameraStreamer]:
    """
    Get the global camera streamer instance.

    Returns:
        CameraStreamer instance or None if not initialized
    """
    return camera_streamer


if __name__ == "__main__":
    # Test the camera streamer
    print("Testing Camera Streamer...")
    
    streamer = CameraStreamer(camera_index=1)
    
    if streamer.start_camera():
        print("✅ Camera started successfully")
        streamer.start_streaming()
        
        print("Streaming to web server...")
        print("Press Ctrl+C to stop")
        
        try:
            while True:
                ret, frame = streamer.cap.read()
                if ret:
                    streamer.update_frame(frame)
                time.sleep(0.1)
        except KeyboardInterrupt:
            print("\nStopping...")
        finally:
            streamer.stop_camera()
    else:
        print("❌ Failed to start camera")
