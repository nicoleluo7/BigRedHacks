#!/usr/bin/env python3
"""
Gesture Recognition MVP - Main Entry Point
Orchestrates camera input, gesture recognition, and action execution.

Author: Gesture Recognition Team Member
For: BigRedHacks MVP

Usage:
    python run.py [--camera-index 0] [--use-websocket] [--debug] [--no-display]
"""

import argparse
import cv2
import time
import signal
import sys
import logging
from typing import Optional
import threading
from datetime import datetime

# Import our modules
from gesture_recognition import GestureRecognizer, CameraManager
from actions_client import ActionsClient, map_gesture_name

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class GestureRecognitionApp:
    """
    Main application class that orchestrates all components.
    """

    def __init__(
        self,
        camera_index: int = 1,
        use_websocket: bool = False,
        show_display: bool = True,
        debug: bool = False,
    ):
        """
        Initialize the gesture recognition application.

        Args:
            camera_index: Camera device index
            use_websocket: Use WebSocket instead of HTTP for communication
            show_display: Show camera feed window
            debug: Enable debug logging
        """
        if debug:
            logging.getLogger().setLevel(logging.DEBUG)

        self.camera_index = camera_index
        self.use_websocket = use_websocket
        self.show_display = show_display
        self.running = False

        # Initialize components
        self.camera = CameraManager(camera_index=camera_index)
        self.recognizer = GestureRecognizer()
        self.actions_client = ActionsClient(use_websocket=use_websocket)

        # Statistics
        self.frames_processed = 0
        self.gestures_detected = 0
        self.start_time = None

        logger.info(f"GestureRecognitionApp initialized")
        logger.info(f"  Camera: {camera_index}")
        logger.info(f"  Communication: {'WebSocket' if use_websocket else 'HTTP'}")
        logger.info(f"  Display: {'Enabled' if show_display else 'Disabled'}")

    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown."""

        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, shutting down gracefully...")
            self.stop()

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

    def start(self) -> bool:
        """
        Start the gesture recognition application.

        Returns:
            True if started successfully, False otherwise
        """
        logger.info("Starting Gesture Recognition MVP...")

        # Test action server connection
        if not self.actions_client.test_connection():
            logger.error("❌ Cannot connect to action server!")
            logger.error("Make sure the action server is running:")
            logger.error("  cd /path/to/BigRedHacks")
            logger.error("  npm start")
            return False

        logger.info("✅ Action server connection verified")

        # Get available gesture mappings
        mappings = self.actions_client.get_available_gestures()
        if mappings:
            logger.info(f"📋 Available actions: {list(mappings.keys())}")

        # Start camera
        if not self.camera.start():
            logger.error("❌ Failed to start camera!")
            return False

        logger.info("✅ Camera started successfully")

        # Show supported gestures
        supported_gestures = self.recognizer.get_supported_gestures()
        logger.info(f"🤚 Supported gestures: {supported_gestures}")

        self.running = True
        self.start_time = time.time()

        logger.info("🚀 Gesture Recognition MVP is running!")
        logger.info("Press 'q' to quit or Ctrl+C for graceful shutdown")

        return True

    def process_frame(self) -> bool:
        """
        Process a single frame from the camera.

        Returns:
            True to continue processing, False to stop
        """
        # Read frame from camera
        frame = self.camera.read_frame()
        if frame is None:
            logger.warning("Failed to read frame from camera")
            return True  # Continue trying

        self.frames_processed += 1

        # Process frame for gesture recognition
        annotated_frame, detected_gesture = self.recognizer.process_frame(frame)

        # Handle detected gesture
        if detected_gesture:
            self.gestures_detected += 1
            logger.info(f"🤚 Gesture detected: {detected_gesture}")

            # Map gesture name for action server
            mapped_gesture = map_gesture_name(detected_gesture)

            # Send to action server (non-blocking)
            threading.Thread(
                target=self._send_gesture_async, args=(mapped_gesture,), daemon=True
            ).start()

        # Display frame if enabled
        if self.show_display:
            # Add status information to frame
            self._add_status_overlay(annotated_frame)

            cv2.imshow("Gesture Recognition MVP", annotated_frame)

            # Check for quit key
            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                logger.info("Quit key pressed")
                return False

        return True

    def _send_gesture_async(self, gesture: str):
        """Send gesture to action server asynchronously."""
        try:
            success = self.actions_client.send_gesture(gesture)
            if success:
                logger.info(f"✅ Gesture '{gesture}' sent to action server")
            else:
                logger.warning(f"❌ Failed to send gesture '{gesture}'")
        except Exception as e:
            logger.error(f"Error sending gesture '{gesture}': {e}")

    def _add_status_overlay(self, frame):
        """Add status information overlay to the frame."""
        # Calculate FPS
        if self.start_time and self.frames_processed > 0:
            elapsed = time.time() - self.start_time
            fps = self.frames_processed / elapsed
        else:
            fps = 0

        # Status text
        status_lines = [
            f"FPS: {fps:.1f}",
            f"Frames: {self.frames_processed}",
            f"Gestures: {self.gestures_detected}",
            f"Mode: {'WebSocket' if self.use_websocket else 'HTTP'}",
            "Press 'q' to quit",
        ]

        # Draw status overlay
        y_offset = 60
        for line in status_lines:
            cv2.putText(
                frame,
                line,
                (10, y_offset),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1,
            )
            y_offset += 20

    def run(self):
        """Main application loop."""
        try:
            while self.running:
                if not self.process_frame():
                    break

                # Small delay to prevent excessive CPU usage
                time.sleep(0.01)

        except Exception as e:
            logger.error(f"Unexpected error in main loop: {e}")

        finally:
            self.stop()

    def stop(self):
        """Stop the application and clean up resources."""
        if not self.running:
            return

        logger.info("Stopping Gesture Recognition MVP...")
        self.running = False

        # Show final statistics
        if self.start_time:
            elapsed = time.time() - self.start_time
            logger.info(f"📊 Session Statistics:")
            logger.info(f"  Runtime: {elapsed:.1f} seconds")
            logger.info(f"  Frames processed: {self.frames_processed}")
            logger.info(f"  Gestures detected: {self.gestures_detected}")
            if self.frames_processed > 0:
                logger.info(f"  Average FPS: {self.frames_processed / elapsed:.1f}")

        # Show actions client statistics
        stats = self.actions_client.get_statistics()
        logger.info(f"  Actions sent: {stats['gestures_sent']}")
        logger.info(f"  Success rate: {stats['success_rate']:.1f}%")

        # Cleanup resources
        self.camera.stop()
        self.recognizer.cleanup()
        self.actions_client.cleanup()

        if self.show_display:
            cv2.destroyAllWindows()

        logger.info("✅ Cleanup completed")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Gesture Recognition MVP")
    parser.add_argument(
        "--camera-index", type=int, default=1, help="Camera device index (default: 1)"
    )
    parser.add_argument(
        "--use-websocket",
        action="store_true",
        help="Use WebSocket instead of HTTP for communication",
    )
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    parser.add_argument(
        "--no-display",
        action="store_true",
        help="Disable camera feed display (headless mode)",
    )

    args = parser.parse_args()

    # Create and configure application
    app = GestureRecognitionApp(
        camera_index=args.camera_index,
        use_websocket=args.use_websocket,
        show_display=not args.no_display,
        debug=args.debug,
    )

    # Setup signal handlers for graceful shutdown
    app.setup_signal_handlers()

    # Start the application
    if not app.start():
        logger.error("Failed to start application")
        sys.exit(1)

    # Run main loop
    try:
        app.run()
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)

    logger.info("🎉 Gesture Recognition MVP stopped successfully")


if __name__ == "__main__":
    main()
