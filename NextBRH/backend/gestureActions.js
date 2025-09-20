import open from "open";
import { exec } from "child_process";

/**
 * Map gestures to system actions
 * @param {string} gesture
 */
export async function handleGesture(gesture) {
  try {
    switch (gesture) {
      case "thumbs_up":
        await open("https://www.google.com");
        break;
      case "shaka":
        exec("start spotify"); // Windows example
        break;
      case "fist":
        exec("start notepad"); // Example action
        break;
      default:
        console.log(`No action mapped for gesture: ${gesture}`);
    }
  } catch (err) {
    console.error("Error executing gesture action:", err);
  }
}
