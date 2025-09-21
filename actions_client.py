"""
Actions Client Module
Sends gesture detection results to the action execution server.

Author: Gesture Recognition Team Member
For: BigRedHacks MVP
"""

import requests
import json
import time
import logging
from typing import Optional, Dict, Any
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ActionsClient:
    """
    Client for sending gesture detection results to the action execution server.
    Supports both HTTP API and WebSocket communication.
    """

    def __init__(
        self,
        server_url: str = "http://localhost:3001",
        timeout: float = 5.0,
    ):
        """
        Initialize the actions client.

        Args:
            server_url: Base URL of the action server
            timeout: Request timeout in seconds
        """
        self.server_url = server_url.rstrip("/")
        self.timeout = timeout

        # Statistics
        self.gestures_sent = 0
        self.successful_sends = 0
        self.failed_sends = 0

        logger.info(
            f"ActionsClient initialized - Server: {server_url}"
        )


    def send_gesture(self, gesture: str, timestamp: Optional[str] = None, gesture_state: str = "detected") -> bool:
        """
        Send a detected gesture to the action server.

        Args:
            gesture: Name of the detected gesture
            timestamp: ISO timestamp of detection (auto-generated if None)
            gesture_state: State of the gesture - 'detected', 'started', 'ended'

        Returns:
            True if sent successfully, False otherwise
        """
        if not gesture:
            logger.warning("Empty gesture provided")
            return False

        # Generate timestamp if not provided
        if timestamp is None:
            timestamp = datetime.now().isoformat()

        # Prepare message
        message = {"gesture": gesture, "timestamp": timestamp, "gestureState": gesture_state}

        self.gestures_sent += 1

        # Send via HTTP
        return self._send_via_http(message)

    def _send_via_http(self, message: Dict[str, Any]) -> bool:
        """
        Send gesture via HTTP API.

        Args:
            message: Gesture message dictionary

        Returns:
            True if successful, False otherwise
        """
        try:
            url = f"{self.server_url}/api/detect-gesture"
            headers = {"Content-Type": "application/json"}

            response = requests.post(
                url, json=message, headers=headers, timeout=self.timeout
            )

            if response.status_code == 200:
                result = response.json()
                logger.info(
                    f"Gesture '{message['gesture']}' sent successfully via HTTP"
                )
                logger.debug(f"Server response: {result}")
                self.successful_sends += 1
                return True
            else:
                logger.error(
                    f"HTTP request failed: {response.status_code} - {response.text}"
                )
                self.failed_sends += 1
                return False

        except requests.exceptions.Timeout:
            logger.error(f"HTTP request timeout for gesture '{message['gesture']}'")
            self.failed_sends += 1
            return False
        except requests.exceptions.ConnectionError:
            logger.error(
                f"Connection error - is the action server running on {self.server_url}?"
            )
            self.failed_sends += 1
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending gesture via HTTP: {e}")
            self.failed_sends += 1
            return False


    def test_connection(self) -> bool:
        """
        Test connection to the action server.

        Returns:
            True if server is reachable, False otherwise
        """
        try:
            url = f"{self.server_url}/api/gestures"
            response = requests.get(url, timeout=self.timeout)

            if response.status_code == 200:
                logger.info("Action server is reachable")
                return True
            else:
                logger.error(f"Action server returned status {response.status_code}")
                return False

        except Exception as e:
            logger.error(f"Failed to connect to action server: {e}")
            return False

    def get_available_gestures(self) -> Optional[Dict[str, Any]]:
        """
        Get available gesture mappings from the server.

        Returns:
            Dictionary of gesture mappings or None if failed
        """
        try:
            url = f"{self.server_url}/api/gestures"
            response = requests.get(url, timeout=self.timeout)

            if response.status_code == 200:
                mappings = response.json()
                logger.info(f"Retrieved {len(mappings)} gesture mappings")
                return mappings
            else:
                logger.error(f"Failed to get gesture mappings: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Error getting gesture mappings: {e}")
            return None

    def get_statistics(self) -> Dict[str, int]:
        """
        Get client statistics.

        Returns:
            Dictionary with send statistics
        """
        return {
            "gestures_sent": self.gestures_sent,
            "successful_sends": self.successful_sends,
            "failed_sends": self.failed_sends,
            "success_rate": (self.successful_sends / max(self.gestures_sent, 1)) * 100,
        }


    def cleanup(self):
        """Clean up resources."""
        logger.info("ActionsClient cleaned up")


# Gesture mapping for common gestures to action server format
GESTURE_MAPPINGS = {
    "fist": "fist",
    "open_palm": "open_palm",
    "thumbs_up": "thumbs_up",
    "thumbs_down": "thumbs_down",
    "peace": "peace",
    "victory": "victory",
    "call_sig   n": "call_sign",
    "call": "call",
    "hang_loose": "hang_loose",
    "pointing": "pointing",
    "pointing_up": "pointing_up",
    "pointing_right": "pointing_right",
    "l_shape": "l_shape",
    "rock": "rock",
    "rock_on": "rock_on",
    "rock_sign": "rock_sign",
    "ok": "ok",
    "ok_sign": "ok_sign",
    "pinch": "pinch",
    "spock": "spock",
    "three_fingers": "three_fingers",
    "three_fingers_v2": "three_fingers_v2",
    "middle_finger": "middle_finger",
    "ring_finger": "ring_finger",
    "pinky": "pinky",
    "two_fingers_ir": "two_fingers_ir",
    "two_fingers_mr": "two_fingers_mr",
    "four_fingers": "four_fingers",
    "wave": "wave",
}



def map_gesture_name(detected_gesture: str) -> str:
    """
    Map internal gesture names to action server format.

    Args:
        detected_gesture: Gesture name from recognition module

    Returns:
        Mapped gesture name for action server
    """
    return GESTURE_MAPPINGS.get(detected_gesture, detected_gesture)


if __name__ == "__main__":
    # Test the actions client
    print("Testing Actions Client...")

    # Initialize client
    client = ActionsClient()

    # Test connection
    if not client.test_connection():
        print("❌ Action server is not reachable!")
        print("Make sure to start the action server first:")
        print("  cd /path/to/BigRedHacks")
        print("  npm start")
        exit(1)

    print("✅ Action server is reachable")

    # Get available gestures
    mappings = client.get_available_gestures()
    if mappings:
        print(f"📋 Available gesture mappings: {list(mappings.keys())}")

    # Test sending gestures
    test_gestures = ["thumbs_up", "fist", "open_palm"]

    print("\n🧪 Testing gesture sending...")
    for gesture in test_gestures:
        print(f"Sending gesture: {gesture}")
        success = client.send_gesture(gesture)
        if success:
            print(f"  ✅ {gesture} sent successfully")
        else:
            print(f"  ❌ Failed to send {gesture}")
        time.sleep(1)  # Small delay between tests

    # Show statistics
    stats = client.get_statistics()
    print(f"\n📊 Statistics:")
    print(f"  Total gestures sent: {stats['gestures_sent']}")
    print(f"  Successful: {stats['successful_sends']}")
    print(f"  Failed: {stats['failed_sends']}")
    print(f"  Success rate: {stats['success_rate']:.1f}%")

    # Cleanup
    client.cleanup()
    print("\n✅ Test completed!")
