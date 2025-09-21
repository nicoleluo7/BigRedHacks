"""
Gesture Recognition Module using MediaPipe
Detects hand gestures from webcam feed using rule-based classification.

Author: Gesture Recognition Team Member
For: BigRedHacks MVP
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Optional, Dict, List, Tuple
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GestureRecognizer:
    """
    Real-time hand gesture recognition using MediaPipe Hands.
    Implements rule-based classification for MVP speed.
    """

    def __init__(
        self,
        min_detection_confidence: float = 0.9,
        min_tracking_confidence: float = 0.5,
        max_num_hands: int = 1,
    ):
        """
        Initialize the gesture recognizer.

        Args:
            min_detection_confidence: Minimum confidence for hand detection
            min_tracking_confidence: Minimum confidence for hand tracking
            max_num_hands: Maximum number of hands to detect
        """
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        self.mp_drawing = mp.solutions.drawing_utils

        # Wave detection variables
        self.hand_positions = []  # Store recent hand positions for wave detection
        self.wave_threshold = (
            0.05  # Minimum movement for wave detection (more sensitive)
        )
        self.wave_frames = 7  # Number of frames to analyze for wave (shorter window)
        self.last_wave_time = 0  # Prevent rapid wave detections

        # Gesture detection state
        self.last_gesture = None
        self.last_gesture_time = 0
        self.gesture_cooldown = 3.0  # Seconds between same gesture detections

        # Continuous gestures that should bypass cooldown
        self.continuous_gestures = {"thumbs_up", "thumbs_down"}

        # Gesture smoothing to prevent rapid switching
        self.gesture_history = []  # Track last few gestures
        self.gesture_history_size = 5  # Number of recent gestures to track
        self.similar_gestures = {
            "thumbs_up": ["fist", "thumbs_down"],
            "thumbs_down": ["fist", "thumbs_up"],
            "fist": ["thumbs_up", "thumbs_down"],
        }

        logger.info("GestureRecognizer initialized")

    def detect_hands(self, frame: np.ndarray) -> Optional[List]:
        """
        Detect hands in the given frame.

        Args:
            frame: Input image frame (BGR format)

        Returns:
            Hand landmarks if detected, None otherwise
        """
        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process the frame
        results = self.hands.process(rgb_frame)

        return results.multi_hand_landmarks if results.multi_hand_landmarks else None

    def classify_gesture(self, landmarks) -> Optional[str]:
        """
        Classify gesture based on hand landmarks using rule-based approach.

        Args:
            landmarks: MediaPipe hand landmarks

        Returns:
            Gesture name or None if no gesture detected
        """
        if not landmarks:
            return None

        # Get landmark positions as normalized coordinates
        points = []
        for landmark in landmarks.landmark:
            points.append([landmark.x, landmark.y])
        points = np.array(points)

        # MediaPipe hand landmark indices
        # 0: WRIST, 4: THUMB_TIP, 8: INDEX_FINGER_TIP, 12: MIDDLE_FINGER_TIP,
        # 16: RING_FINGER_TIP, 20: PINKY_TIP
        # 2: THUMB_IP, 3: THUMB_MCP, 6: INDEX_PIP, 10: MIDDLE_PIP, etc.

        # Extract key points
        wrist = points[0]
        thumb_tip = points[4]
        thumb_ip = points[3]  # Thumb interphalangeal joint
        thumb_mcp = points[2]  # Thumb metacarpophalangeal joint
        index_tip = points[8]
        index_pip = points[6]  # Index proximal interphalangeal joint
        index_mcp = points[5]  # Index metacarpophalangeal joint
        middle_tip = points[12]
        middle_pip = points[10]
        middle_mcp = points[9]
        ring_tip = points[16]
        ring_pip = points[14]
        ring_mcp = points[13]
        pinky_tip = points[20]
        pinky_pip = points[18]
        pinky_mcp = points[17]

        # Improved finger extension detection
        def is_finger_extended(tip, pip, mcp, finger_name=""):
            """Check if finger is extended with more accuracy."""
            if finger_name == "thumb":
                # For thumb: detect extension in any direction (up or down)
                tip_to_wrist = np.linalg.norm(tip - wrist)
                mcp_to_wrist = np.linalg.norm(thumb_mcp - wrist)

                # Check if thumb is pointing up OR down (not curled)
                thumb_pointing_up = thumb_tip[1] < thumb_mcp[1] - 0.02  # Above MCP
                thumb_pointing_down = thumb_tip[1] > thumb_mcp[1] + 0.02  # Below MCP

                # Thumb is extended if it's pointing up OR down (not curled)
                distance_check = (
                    tip_to_wrist > mcp_to_wrist * 1.4
                )  # Less strict distance
                return distance_check and (thumb_pointing_up or thumb_pointing_down)
            else:
                # For other fingers: tip should be above PIP and PIP above MCP
                return tip[1] < pip[1] < mcp[1]

        # Check each finger with improved accuracy
        fingers_up = []
        fingers_up.append(is_finger_extended(thumb_tip, thumb_ip, thumb_mcp, "thumb"))
        fingers_up.append(is_finger_extended(index_tip, index_pip, index_mcp, "index"))
        fingers_up.append(
            is_finger_extended(middle_tip, middle_pip, middle_mcp, "middle")
        )
        fingers_up.append(is_finger_extended(ring_tip, ring_pip, ring_mcp, "ring"))
        fingers_up.append(is_finger_extended(pinky_tip, pinky_pip, pinky_mcp, "pinky"))

        extended_count = sum(fingers_up)

        # Enhanced rule-based gesture classification

        # WAVE: Check for wave motion pattern first (motion-based)
        if self.detect_wave(landmarks):
            return "wave"

        # THREE FINGER SIGN V2: Thumb, index, and middle fingers up (check FIRST)
        if (
            fingers_up[0]
            and fingers_up[1]
            and fingers_up[2]
            and not fingers_up[3]
            and not fingers_up[4]
        ):
            return "three_fingers_serbian_style"

        # FIST: No fingers extended OR thumb slightly extended but not pointing up
        if extended_count == 0:
            return "fist"
        elif extended_count == 1 and fingers_up[0]:
            # Only thumb is extended - determine if it's thumbs up or thumbs down
            # Check thumb position relative to wrist and other fingers
            other_fingers_y = [index_tip[1], middle_tip[1], ring_tip[1], pinky_tip[1]]
            avg_other_fingers_y = np.mean(other_fingers_y)

            # Thumb should be significantly above other fingers for thumbs up
            thumb_clearly_up = thumb_tip[1] < avg_other_fingers_y - 0.03
            # Thumb should be below other fingers for thumbs down
            thumb_clearly_down = thumb_tip[1] > avg_other_fingers_y + 0.02

            if thumb_clearly_up:
                return "thumbs_up"
            elif thumb_clearly_down:
                return "thumbs_down"
            else:
                # Check relative to wrist for additional thumbs down detection
                if thumb_tip[1] > wrist[1] + 0.03:  # Thumb tip below wrist
                    return "thumbs_down"
                else:
                    # If thumb is only slightly extended, it's probably a fist
                    return "fist"

        # OPEN PALM: All fingers extended
        elif extended_count == 5:
            return "open_palm"

        # PEACE SIGN: Index and middle fingers extended, others down (relaxed)
        elif (
            fingers_up[1] and fingers_up[2] and not fingers_up[3] and not fingers_up[4]
        ):
            # Allow thumb to be up or down for peace sign
            return "peace"

        # CALL SIGN (Hang Loose): Only thumb and pinky extended
        elif (
            extended_count == 2
            and fingers_up[0]
            and fingers_up[4]
            and not fingers_up[1]
            and not fingers_up[2]
            and not fingers_up[3]
        ):
            return "call"

        # L SHAPE: Thumb and index finger extended, others down
        elif (
            fingers_up[0]
            and fingers_up[1]
            and not fingers_up[2]
            and not fingers_up[3]
            and not fingers_up[4]
        ):
            return "l_shape"

        # POINTING: Index finger extended, others down (relaxed)
        elif (
            fingers_up[1]
            and not fingers_up[2]
            and not fingers_up[3]
            and not fingers_up[4]
        ):
            # Allow thumb to be up or down for pointing
            return "pointing"

        # ROCK SIGN: Index and pinky extended, middle and ring down
        elif (
            fingers_up[1] and fingers_up[4] and not fingers_up[2] and not fingers_up[3]
        ):
            # Allow thumb to be up or down for rock sign
            return "rock"

        # THREE FINGER SIGN: Index, middle, and ring fingers up
        elif fingers_up[1] and fingers_up[2] and fingers_up[3] and not fingers_up[4]:
            # Allow thumb to be up or down for three finger sign
            return "three_fingers"

        # MIDDLE FINGER: Only middle finger extended
        elif (
            fingers_up[2]
            and not fingers_up[1]
            and not fingers_up[3]
            and not fingers_up[4]
        ):
            # Allow thumb to be up or down
            return "middle_finger"

        # RING FINGER: Only ring finger extended
        elif (
            fingers_up[3]
            and not fingers_up[1]
            and not fingers_up[2]
            and not fingers_up[4]
        ):
            # Allow thumb to be up or down
            return "ring_finger"

        # PINKY: Only pinky finger extended
        elif (
            fingers_up[4]
            and not fingers_up[1]
            and not fingers_up[2]
            and not fingers_up[3]
        ):
            # Allow thumb to be up or down
            return "pinky"

        # TWO FINGERS (Index + Ring): Index and ring up, middle and pinky down
        elif (
            fingers_up[1] and fingers_up[3] and not fingers_up[2] and not fingers_up[4]
        ):
            return "two_fingers_ir"

        # TWO FINGERS (Middle + Ring): Middle and ring up, index and pinky down
        elif (
            fingers_up[2] and fingers_up[3] and not fingers_up[1] and not fingers_up[4]
        ):
            return "two_fingers_mr"

        # FOUR FINGERS: All except thumb
        elif (
            fingers_up[1]
            and fingers_up[2]
            and fingers_up[3]
            and fingers_up[4]
            and not fingers_up[0]
        ):
            return "four_fingers"

        # PINCH SIGN: Thumb and index close together, others down
        elif (
            extended_count == 2
            and fingers_up[0]
            and fingers_up[1]
            and not fingers_up[2]
            and not fingers_up[3]
            and not fingers_up[4]
        ):
            # Check if thumb and index are close (pinch gesture)
            thumb_index_distance = np.linalg.norm(thumb_tip - index_tip)
            if thumb_index_distance < 0.05:  # Threshold for "close"
                return "pinch"

        # SPOCK SIGN: Index and middle fingers separated (Vulcan salute)
        elif (
            fingers_up[1]
            and fingers_up[2]
            and not fingers_up[0]
            and not fingers_up[3]
            and not fingers_up[4]
        ):
            # Check if fingers are separated (not peace sign)
            index_middle_distance = np.linalg.norm(index_tip - middle_tip)
            if index_middle_distance > 0.08:  # Threshold for "separated"
                return "spock"

        # OK SIGN: Thumb and index close together, middle/ring/pinky extended
        elif extended_count >= 3 and fingers_up[2] and fingers_up[3] and fingers_up[4]:
            # Check if thumb and index are close (OK sign approximation)
            thumb_index_distance = np.linalg.norm(thumb_tip - index_tip)
            if thumb_index_distance < 0.05:  # Threshold for "close"
                return "ok"

        # Default: No recognized gesture
        return None

    def detect_wave(self, landmarks) -> bool:
        """
        Detect wave gesture based on hand movement patterns.

        Args:
            landmarks: MediaPipe hand landmarks

        Returns:
            True if wave gesture is detected
        """
        import time

        if not landmarks:
            return False

        # Get wrist position (landmark 0) as reference point
        wrist = landmarks.landmark[0]
        current_pos = (wrist.x, wrist.y)
        current_time = time.time()

        # Prevent rapid wave detections (cooldown)
        if current_time - self.last_wave_time < 2.0:
            return False

        # Store current position
        self.hand_positions.append(current_pos)

        # Keep only recent positions
        if len(self.hand_positions) > self.wave_frames:
            self.hand_positions.pop(0)

        # Need enough positions to analyze
        if len(self.hand_positions) < self.wave_frames:
            return False

        # Analyze movement pattern for wave
        movements = []
        for i in range(1, len(self.hand_positions)):
            prev_pos = self.hand_positions[i - 1]
            curr_pos = self.hand_positions[i]

            # Calculate horizontal movement (x-axis for wave)
            x_movement = curr_pos[0] - prev_pos[0]
            movements.append(x_movement)

        # Check for alternating left-right movement pattern
        direction_changes = 0
        significant_movements = 0

        for i in range(1, len(movements)):
            # Count significant movements
            if abs(movements[i]) > self.wave_threshold:
                significant_movements += 1

            # Count direction changes (left-right-left or right-left-right)
            if (
                movements[i - 1] * movements[i] < 0
            ):  # Different signs = direction change
                if (
                    abs(movements[i - 1]) > self.wave_threshold
                    and abs(movements[i]) > self.wave_threshold
                ):
                    direction_changes += 1

        # Debug logging for wave detection - always show when we have enough frames
        if len(self.hand_positions) == self.wave_frames:
            logger = logging.getLogger(__name__)
            logger.info(
                f"🌊 Wave analysis: dir_changes={direction_changes}, sig_movements={significant_movements}, movements={movements[:3]}..."
            )

        # Wave detected if we have enough direction changes and movements (even more lenient)
        if direction_changes >= 1 and significant_movements >= 2:
            self.last_wave_time = current_time
            self.hand_positions = []  # Reset positions after detection
            logger = logging.getLogger(__name__)
            logger.info(
                f"🌊 Wave detected! dir_changes={direction_changes}, sig_movements={significant_movements}"
            )
            return True

        return False

    def _smooth_gesture(self, detected_gesture):
        """Smooth gesture detection to prevent rapid switching between similar gestures."""
        import time

        current_time = time.time()

        # Add current gesture to history
        if detected_gesture:
            self.gesture_history.append((detected_gesture, current_time))

        # Keep only recent gestures
        cutoff_time = current_time - 1.0  # Only consider gestures from last 1 second
        self.gesture_history = [
            (g, t) for g, t in self.gesture_history if t > cutoff_time
        ]

        # Limit history size
        if len(self.gesture_history) > self.gesture_history_size:
            self.gesture_history = self.gesture_history[-self.gesture_history_size :]

        if not detected_gesture or len(self.gesture_history) < 3:
            return detected_gesture

        # Check for rapid switching between similar gestures
        recent_gestures = [g for g, t in self.gesture_history[-3:]]  # Last 3 gestures

        if len(recent_gestures) >= 3:
            # Check if we're rapidly switching between similar gestures
            current = recent_gestures[-1]
            previous = recent_gestures[-2]
            before_previous = recent_gestures[-3]

            # If we're switching between similar gestures rapidly, keep the previous gesture

            if (
                current != previous
                and current in self.similar_gestures.get(previous, [])
                and previous in self.similar_gestures.get(before_previous, [])
            ):

                logger.info(
                    f"🔄 Smoothing gesture: {current} -> {previous} (preventing rapid switching)"
                )
                return previous

        return detected_gesture

    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, Optional[str]]:
        """
        Process a single frame for gesture recognition.

        Args:
            frame: Input video frame

        Returns:
            Tuple of (annotated_frame, detected_gesture)
        """
        current_time = time.time()
        detected_gesture = None

        # Detect hands
        hand_landmarks = self.detect_hands(frame)

        # Annotate frame with hand landmarks
        annotated_frame = frame.copy()
        if hand_landmarks:
            for landmarks in hand_landmarks:
                # Draw hand landmarks
                self.mp_drawing.draw_landmarks(
                    annotated_frame, landmarks, self.mp_hands.HAND_CONNECTIONS
                )

                # Classify gesture
                gesture = self.classify_gesture(landmarks)

                if gesture:
                    # Apply cooldown to prevent spam, but allow continuous gestures to bypass cooldown
                    is_continuous = gesture in self.continuous_gestures
                    should_detect = (
                        gesture != self.last_gesture
                        or current_time - self.last_gesture_time > self.gesture_cooldown
                        or is_continuous  # Continuous gestures bypass cooldown
                    )

                    if should_detect:
                        detected_gesture = gesture
                        self.last_gesture = gesture
                        self.last_gesture_time = current_time

                        logger.info(f"Detected gesture: {gesture}")

                    # Draw gesture label on frame
                    cv2.putText(
                        annotated_frame,
                        f"Gesture: {gesture}",
                        (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (0, 255, 0),
                        2,
                    )
        else:
            # No hands detected
            cv2.putText(
                annotated_frame,
                "No hands detected",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2,
            )

        return annotated_frame, detected_gesture

    def get_supported_gestures(self) -> List[str]:
        """Get list of supported gestures."""
        return [
            "wave",
            "fist",
            "open_palm",
            "thumbs_up",
            "thumbs_down",
            "peace",
            "victory",
            "call",
            "hang_loose",
            "pointing",
            "l_shape",
            "rock",
            "rock_on",
            "ok",
            "ok_sign",
            "pinch",
            "spock",
            "three_fingers",
            "three_fingers_v2",
            "middle_finger",
            "ring_finger",
            "pinky",
            "two_fingers_ir",
            "two_fingers_mr",
            "four_fingers",
        ]

    def cleanup(self):
        """Clean up resources."""
        if self.hands:
            self.hands.close()
        logger.info("GestureRecognizer cleaned up")


class CameraManager:
    """
    Manages webcam input for gesture recognition.
    """

    def __init__(self, camera_index: int = 0, width: int = 640, height: int = 480):
        """
        Initialize camera manager.

        Args:
            camera_index: Camera device index (usually 0 for default webcam)
            width: Frame width
            height: Frame height
        """
        self.camera_index = camera_index
        self.width = width
        self.height = height
        self.cap = None

    def start(self) -> bool:
        """
        Start the camera.

        Returns:
            True if camera started successfully, False otherwise
        """
        try:
            self.cap = cv2.VideoCapture(self.camera_index)
            if not self.cap.isOpened():
                logger.error(f"Failed to open camera {self.camera_index}")
                return False

            # Set camera properties
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self.cap.set(cv2.CAP_PROP_FPS, 30)

            logger.info(f"Camera {self.camera_index} started successfully")
            return True

        except Exception as e:
            logger.error(f"Error starting camera: {e}")
            return False

    def read_frame(self) -> Optional[np.ndarray]:
        """
        Read a frame from the camera.

        Returns:
            Frame if successful, None otherwise
        """
        if not self.cap or not self.cap.isOpened():
            return None

        ret, frame = self.cap.read()
        if not ret:
            logger.warning("Failed to read frame from camera")
            return None

        # Flip frame horizontally for mirror effect
        return cv2.flip(frame, 1)

    def stop(self):
        """Stop the camera and release resources."""
        if self.cap:
            self.cap.release()
            logger.info("Camera stopped")


if __name__ == "__main__":
    # Test the gesture recognition module
    print("Testing Gesture Recognition Module...")

    # Initialize components
    camera = CameraManager()
    recognizer = GestureRecognizer()

    if not camera.start():
        print("Failed to start camera!")
        exit(1)

    print("Gesture Recognition Test Running...")
    print("Supported gestures:", recognizer.get_supported_gestures())
    print("Press 'q' to quit")

    try:
        while True:
            # Read frame
            frame = camera.read_frame()
            if frame is None:
                continue

            # Process frame
            annotated_frame, gesture = recognizer.process_frame(frame)

            if gesture:
                print(f"Detected: {gesture}")

            # Display frame
            cv2.imshow("Gesture Recognition Test", annotated_frame)

            # Check for quit
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    except KeyboardInterrupt:
        print("\nStopping...")

    finally:
        # Cleanup
        camera.stop()
        recognizer.cleanup()
        cv2.destroyAllWindows()
        print("Test completed!")
