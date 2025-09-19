/**
 * Example frontend integration for the Gesture Recognition MCP Server
 * This shows how Person A (Frontend & UX) can integrate with the MCP server
 */

class GestureRecognitionClient {
  constructor() {
    this.ws = null;
    this.mcpClient = null;
    this.gestureMappings = new Map();
  }

  // Initialize WebSocket connection for real-time events
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('ws://localhost:3001/ws');
      
      this.ws.onopen = () => {
        console.log('Connected to gesture recognition server');
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleGestureEvent(data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from gesture recognition server');
        // Attempt to reconnect after 3 seconds
        setTimeout(() => this.connectWebSocket(), 3000);
      };
    });
  }

  // Handle incoming gesture events
  handleGestureEvent(event) {
    console.log('Gesture detected:', event);
    
    // Update UI with gesture detection
    this.updateGestureDisplay(event);
    
    // Show notification
    this.showNotification(
      `Gesture detected: ${event.gesture}`,
      `Action: ${event.action || 'None'}`,
      event.success ? 'success' : 'error'
    );
  }

  // Update the visual feedback in the UI
  updateGestureDisplay(event) {
    const gestureElement = document.getElementById('gesture-display');
    if (gestureElement) {
      gestureElement.innerHTML = `
        <div class="gesture-event">
          <h3>${event.gesture}</h3>
          <p>Action: ${event.action || 'No action mapped'}</p>
          <p>Time: ${new Date(event.timestamp).toLocaleTimeString()}</p>
          <p class="status ${event.success ? 'success' : 'error'}">
            ${event.success ? '✓ Success' : '✗ Failed'}
          </p>
        </div>
      `;
    }
  }

  // Show notification to user
  showNotification(title, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <h4>${title}</h4>
        <p>${message}</p>
      </div>
    `;

    // Add to notification container
    const container = document.getElementById('notifications') || this.createNotificationContainer();
    container.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  }

  // Load current gesture mappings from server
  async loadGestureMappings() {
    try {
      const response = await fetch('http://localhost:3001/api/gestures');
      const mappings = await response.json();
      
      this.gestureMappings = new Map(Object.entries(mappings));
      this.renderMappingEditor();
      
      return mappings;
    } catch (error) {
      console.error('Failed to load gesture mappings:', error);
      throw error;
    }
  }

  // Update gesture mapping
  async updateGestureMapping(gesture, action, params = {}) {
    try {
      const response = await fetch('http://localhost:3001/api/gestures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gesture,
          action,
          params,
        }),
      });

      if (response.ok) {
        this.gestureMappings.set(gesture, { action, params });
        this.renderMappingEditor();
        this.showNotification('Mapping Updated', `${gesture} → ${action}`, 'success');
      } else {
        throw new Error('Failed to update mapping');
      }
    } catch (error) {
      console.error('Failed to update gesture mapping:', error);
      this.showNotification('Update Failed', error.message, 'error');
    }
  }

  // Render the gesture mapping editor
  renderMappingEditor() {
    const editor = document.getElementById('mapping-editor');
    if (!editor) return;

    const mappings = Array.from(this.gestureMappings.entries());
    
    editor.innerHTML = `
      <h3>Gesture Mappings</h3>
      <div class="mappings-list">
        ${mappings.map(([gesture, config]) => `
          <div class="mapping-item">
            <span class="gesture-name">${gesture}</span>
            <span class="action-name">${config.action}</span>
            <button onclick="client.editMapping('${gesture}')">Edit</button>
            <button onclick="client.deleteMapping('${gesture}')">Delete</button>
          </div>
        `).join('')}
      </div>
      <button onclick="client.addNewMapping()">Add New Mapping</button>
    `;
  }

  // Edit an existing mapping
  editMapping(gesture) {
    const config = this.gestureMappings.get(gesture);
    if (!config) return;

    const newAction = prompt(`Enter new action for ${gesture}:`, config.action);
    if (newAction && newAction !== config.action) {
      this.updateGestureMapping(gesture, newAction, config.params);
    }
  }

  // Delete a mapping
  async deleteMapping(gesture) {
    if (confirm(`Delete mapping for ${gesture}?`)) {
      // Note: You'd need to implement DELETE endpoint in the server
      this.gestureMappings.delete(gesture);
      this.renderMappingEditor();
      this.showNotification('Mapping Deleted', `${gesture} mapping removed`, 'success');
    }
  }

  // Add a new mapping
  addNewMapping() {
    const gesture = prompt('Enter gesture name:');
    if (!gesture) return;

    const action = prompt('Enter action name:');
    if (!action) return;

    this.updateGestureMapping(gesture, action, {});
  }

  // Initialize the client
  async initialize() {
    try {
      await this.connectWebSocket();
      await this.loadGestureMappings();
      
      console.log('Gesture Recognition Client initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize client:', error);
      return false;
    }
  }
}

// Global client instance
const client = new GestureRecognitionClient();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await client.initialize();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GestureRecognitionClient;
}

