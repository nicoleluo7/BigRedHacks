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
import requests

# Import our modules
from gesture_recognition import GestureRecognizer, CameraManager
from actions_client import ActionsClient, map_gesture_name
from camera_streamer import initialize_camera_streamer, get_camera_streamer

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
        show_display: bool = True,
        debug: bool = False,
        web_stream: bool = False,
    ):
        """
        Initialize the gesture recognition application.

        Args:
            camera_index: Camera device index
            show_display: Show camera feed window
            debug: Enable debug logging
        """
        if debug:
            logging.getLogger().setLevel(logging.DEBUG)

        self.camera_index = camera_index
        self.show_display = show_display
        self.web_stream = web_stream
        self.running = False

        # Initialize components
        self.camera = CameraManager(camera_index=camera_index)
        self.recognizer = GestureRecognizer()
        self.actions_client = ActionsClient()
        
        # Initialize camera streamer for web frontend (only if web streaming is enabled)
        self.camera_streamer = None
        if web_stream:
            self.camera_streamer = initialize_camera_streamer(
                camera_index=camera_index,
                server_url="http://localhost:3001"
            )

        # Statistics
        self.frames_processed = 0
        self.gestures_detected = 0
        self.start_time = None
        self.camera_paused = False

        # Gesture cooldown tracking
        self.last_gesture_time = {}
        self.gesture_cooldown = 2.0  # 2 seconds cooldown between same gestures
        self.call_sign_cooldown = 6.0  # 6 seconds cooldown for call sign (pause/resume)

        # Exit message tracking
        self.showing_exit_message = False
        self.exit_message_start_time = None
        self.exit_initiated = False  # Flag to prevent actions after exit is initiated

        logger.info(f"GestureRecognitionApp initialized")
        logger.info(f"  Camera: {camera_index}")
        logger.info(f"  Communication: HTTP")
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

        # Start camera streaming to web frontend (if enabled)
        if self.camera_streamer:
            self.camera_streamer.start_streaming()
            logger.info("✅ Camera streaming to web frontend started")

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

        # Update camera streamer with current frame (if enabled)
        if self.camera_streamer:
            self.camera_streamer.update_frame(annotated_frame, detected_gesture)

        # Check if we should exit after showing goodbye message
        if self.showing_exit_message and self.exit_message_start_time:
            current_time = time.time()
            time_since_message = current_time - self.exit_message_start_time
            remaining_time = 3.0 - time_since_message

            # Show countdown every second
            if int(time_since_message) != int(time_since_message - 0.1):  # Every second
                if remaining_time > 0:
                    print(f"        Exiting in {int(remaining_time) + 1} seconds...")

            if time_since_message >= 3.0:  # Show message for 3 seconds
                logger.info("Goodbye message displayed - exiting application")
                print("        Exiting HandsFree application...")
                return False

        # Handle detected gesture
        if detected_gesture:
            # Skip all actions if exit has been initiated
            if self.exit_initiated:
                logger.info(
                    f"⏹️ Gesture '{detected_gesture}' detected but exit initiated - ignoring"
                )
                return True  # Continue processing but don't execute any actions

            current_time = time.time()

            # Check cooldown for this gesture
            if detected_gesture in self.last_gesture_time:
                time_since_last = (
                    current_time - self.last_gesture_time[detected_gesture]
                )

                # Use longer cooldown for call_sign, normal cooldown for others
                cooldown_time = (
                    self.call_sign_cooldown
                    if detected_gesture == "call_sign"
                    else self.gesture_cooldown
                )

                if time_since_last < cooldown_time:
                    logger.info(
                        f"⏳ Gesture '{detected_gesture}' in cooldown ({cooldown_time - time_since_last:.1f}s remaining)"
                    )
                    return True  # Continue processing but don't execute action

            # Update last gesture time
            self.last_gesture_time[detected_gesture] = current_time
            self.gestures_detected += 1
            logger.info(f"🤚 Gesture detected: {detected_gesture}")

            # Check for middle finger gesture to quit
            if detected_gesture == "middle_finger":
                if not self.showing_exit_message:
                    logger.info(
                        "Middle finger gesture detected - showing goodbye message"
                    )
                    print("\n" + "=" * 60)
                    print("                    GOODBYE!")
                    print("              Thanks for using")
                    print("                   HandsFree!")
                    print("=" * 60 + "\n")
                    self.showing_exit_message = True
                    self.exit_message_start_time = current_time
                    self.exit_initiated = True  # Prevent any further actions
                return True  # Continue processing to show the message

            # Check for call sign gesture to pause/unpause camera
            if detected_gesture == "call_sign":
                self.camera_paused = not self.camera_paused
                if self.camera_paused:
                    logger.info("📹 Camera paused - actions disabled")
                else:
                    logger.info("📹 Camera resumed - actions enabled")
                return True  # Continue processing

            # Skip sending other gestures to action server if camera is paused
            if self.camera_paused:
                logger.info(
                    f"⏸️ Gesture '{detected_gesture}' detected but actions are paused"
                )
                return True  # Continue processing

            # Map gesture name for action server
            mapped_gesture = map_gesture_name(detected_gesture)

            # Send to action server (non-blocking)
            threading.Thread(
                target=self._send_gesture_async, args=(mapped_gesture,), daemon=True
            ).start()

        # Display frame if enabled (hide OpenCV window when streaming to web)
        if self.show_display and not self.web_stream:
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
        height, width = frame.shape[:2]

        # Calculate FPS
        if self.start_time and self.frames_processed > 0:
            elapsed = time.time() - self.start_time
            fps = self.frames_processed / elapsed
        else:
            fps = 0

        # Status text (left side)
        if self.showing_exit_message:
            status_lines = [
                "GOODBYE!",
                "",
                "Thanks for using",
                "HandsFree!",
                "",
                "Exiting in 3 seconds...",
            ]
        else:
            status_lines = [
                "🤚 Gesture Recognition MVP",
                f"FPS: {fps:.1f}",
                f"Frames: {self.frames_processed}",
                f"Gestures: {self.gestures_detected}",
                "Mode: HTTP",
                f"Camera: {'PAUSED' if self.camera_paused else 'ACTIVE'}",
                "Press 'q' or middle finger gesture to quit",
            ]

        # Available commands (top right corner, compact)
        commands = [
            "Commands:",
            "Fist→Notify",
            "Palm→None",
            "Thumbs→None",
            "Peace→Reels",
            "CallSign→Pause/Resume",
            "Point→NextSong",
            "LShape→LinkedIn",
            "Rock→Spotify",
            "3Fing→CloseTab",
            "3FingV2→Notification",
            "Middle→QUIT",
            "Ring→None",
            "Pinky→None",
            "OK→Play/Pause",
            "4Fing→None",
            "Wave→Netflix",
        ]

        # Draw status overlay
        if self.showing_exit_message:
            # Center the goodbye message with bigger, bold, blue text
            y_start = height // 2 - 60  # Center vertically
            for i, line in enumerate(status_lines):
                if line:  # Skip empty lines
                    # Calculate text size for centering
                    font_scale = 1.2 if i == 0 else 0.8  # Bigger for "GOODBYE!"
                    thickness = 3 if i == 0 else 2  # Bolder for "GOODBYE!"
                    (text_width, text_height), _ = cv2.getTextSize(
                        line, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness
                    )
                    x_center = (width - text_width) // 2  # Center horizontally

                    cv2.putText(
                        frame,
                        line,
                        (x_center, y_start + i * 40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        font_scale,
                        (255, 0, 0),  # Blue color
                        thickness,
                    )
        else:
            # Normal status display (left side, moved down)
            y_offset = height - 180  # Position near bottom of frame
            for line in status_lines:
                cv2.putText(
                    frame,
                    line,
                    (10, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 0),  # Green color
                    1,
                )
                y_offset += 25

        # Draw commands overlay (top right corner, very small)
        x_offset = width - 180  # Position in top right corner
        y_offset = 15
        for i, command in enumerate(commands):
            color = (255, 255, 255)  # White
            if "QUIT" in command:
                color = (0, 0, 255)  # Red for quit command
            elif i == 0:  # Header
                color = (0, 255, 255)  # Yellow for header

            cv2.putText(
                frame,
                command,
                (x_offset, y_offset),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.25,  # Much smaller text
                color,
                1,
            )
            y_offset += 12  # Smaller line spacing

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
        if self.camera_streamer:
            self.camera_streamer.stop_camera()

        if self.show_display:
            cv2.destroyAllWindows()

        logger.info("✅ Cleanup completed")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Gesture Recognition MVP")
    parser.add_argument(
        "--camera-index", type=int, default=1, help="Camera device index (default: 1)"
    )
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    parser.add_argument(
        "--no-display",
        action="store_true",
        help="Disable camera feed display (headless mode)",
    )
    parser.add_argument(
        "--web-stream",
        action="store_true",
        help="Stream camera feed to web frontend instead of showing OpenCV window",
    )

    args = parser.parse_args()

    # Create and configure application
    app = GestureRecognitionApp(
        camera_index=args.camera_index,
        show_display=not args.no_display,
        debug=args.debug,
        web_stream=args.web_stream,
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
