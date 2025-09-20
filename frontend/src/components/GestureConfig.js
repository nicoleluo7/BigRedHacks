import React, { useState, useEffect } from "react";
import {
  Plus,
  Save,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  CheckCircle,
  Settings,
} from "lucide-react";
import ApiService from "../services/ApiService";

function GestureConfig({ gestureMappings, onMappingUpdate }) {
  const [availableActions, setAvailableActions] = useState([]);
  const [editingGesture, setEditingGesture] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    gesture: "",
    action: "",
    params: {},
  });

  const supportedGestures = [
    "wave",
    "fist",
    "open_palm",
    "thumbs_up",
    "peace",
    "pointing",
    "rock_sign",
    "ok_sign",
    "call_sign",
    "middle_finger",
    "ring_finger",
    "pinky",
    "three_fingers",
    "three_fingers_serbian_style",
    "two_fingers_ir",
    "two_fingers_mr",
    "four_fingers",
  ];

  useEffect(() => {
    loadAvailableActions();
  }, []);

  const loadAvailableActions = async () => {
    try {
      const actions = await ApiService.getAvailableActions();
      setAvailableActions(actions);
    } catch (err) {
      console.error("Failed to load available actions:", err);
    }
  };

  const getGestureIcon = (gesture) => {
    const iconMap = {
      wave: "👋",
      fist: "✊",
      open_palm: "✋",
      thumbs_up: "👍",
      peace: "✌️",
      pointing: "👆",
      rock_sign: "🤘",
      ok_sign: "👌",
      call_sign: "🤙",
      middle_finger: "🖕",
      ring_finger: "💍",
      pinky: "🖐️",
      three_fingers: "🤟",
      three_fingers_serbian_style: "🤟",
      two_fingers_ir: "✌️",
      two_fingers_mr: "🤟",
      four_fingers: "🖖",
    };
    return iconMap[gesture] || "🤚";
  };

  const getActionDescription = (action) => {
    const actionObj = availableActions.find((a) => a.name === action);
    return actionObj ? actionObj.description : action;
  };

  const handleEdit = (gesture, mapping) => {
    setEditingGesture(gesture);
    setFormData({
      gesture,
      action: mapping.action,
      params: mapping.params || {},
    });
    setShowAddForm(true);
  };

  const handleDelete = async (gesture) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the mapping for ${gesture}?`
      )
    )
      return;

    setLoading(true);
    try {
      await ApiService.deleteGestureMapping(gesture);
      const updatedMappings = { ...gestureMappings };
      delete updatedMappings[gesture];
      onMappingUpdate(updatedMappings);
      setSuccess(`Deleted mapping for ${gesture}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to delete mapping: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await ApiService.updateGestureMapping(
        formData.gesture,
        formData.action,
        formData.params
      );

      const updatedMappings = {
        ...gestureMappings,
        [formData.gesture]: {
          action: formData.action,
          params: formData.params,
          updatedAt: new Date().toISOString(),
        },
      };

      onMappingUpdate(updatedMappings);
      setSuccess(`Saved mapping for ${formData.gesture}`);
      setTimeout(() => setSuccess(null), 3000);

      setFormData({ gesture: "", action: "", params: {} });
      setShowAddForm(false);
      setEditingGesture(null);
    } catch (err) {
      setError(`Failed to save mapping: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleActionChange = (action) => {
    setFormData((prev) => ({
      ...prev,
      action,
      params: {},
    }));
  };

  const getActionParams = (action) => {
    const actionObj = availableActions.find((a) => a.name === action);
    return actionObj ? actionObj.params : {};
  };

  const renderActionParams = (action) => {
    const params = getActionParams(action);
    if (!params || Object.keys(params).length === 0) return null;

    return Object.entries(params).map(([key, description]) => (
      <div key={key} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {key.charAt(0).toUpperCase() + key.slice(1)}
        </label>
        <input
          type="text"
          className="input-field"
          placeholder={description}
          value={formData.params[key] || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              params: { ...prev.params, [key]: e.target.value },
            }))
          }
        />
      </div>
    ));
  };

  // Merge predefined gestures with backend mappings
  const mergedMappings = supportedGestures.reduce((acc, gesture) => {
    acc[gesture] = gestureMappings[gesture] || null;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-sky rounded-xl shadow-sky border border-sky-200 p-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-purple rounded-full opacity-30 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-mint rounded-full opacity-30 animate-float" style={{animationDelay: '1s'}}></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">
              Gesture Configuration
            </h1>
            <p className="text-white/90 mt-1">
              Configure which actions are triggered by each gesture
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 hover:shadow-glow-purple transition-all duration-300 flex items-center space-x-2 px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Mapping</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-danger-500" />
            <p className="text-danger-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-success-500" />
            <p className="text-success-700">{success}</p>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-2 h-2 bg-gradient-mint rounded-full mr-3 animate-pulse"></div>
              {editingGesture ? "Edit Mapping" : "Add New Mapping"}
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingGesture(null);
                setFormData({ gesture: "", action: "", params: {} });
              }}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gesture Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Gesture
                </label>
                <select
                  className="input-field"
                  value={formData.gesture}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      gesture: e.target.value,
                    }))
                  }
                  required
                  disabled={editingGesture !== null}
                >
                  <option value="">Select a gesture</option>
                  {(editingGesture
                    ? [editingGesture]
                    : supportedGestures.filter((g) => !gestureMappings[g])
                  ).map((gesture) => (
                    <option key={gesture} value={gesture}>
                      {getGestureIcon(gesture)} {gesture.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Action
                </label>
                <select
                  className="input-field"
                  value={formData.action}
                  onChange={(e) => handleActionChange(e.target.value)}
                  required
                >
                  <option value="">Select an action</option>
                  {availableActions.map((action) => (
                    <option key={action.name} value={action.name}>
                      {action.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Parameters */}
            {formData.action && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Action Parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderActionParams(formData.action)}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingGesture(null);
                  setFormData({ gesture: "", action: "", params: {} });
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-mint hover:shadow-glow-mint text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editingGesture ? "Update" : "Save"} Mapping</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Mappings */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <div className="w-2 h-2 bg-gradient-purple rounded-full mr-3 animate-pulse"></div>
          Current Mappings
        </h3>

        {Object.entries(gestureMappings).length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-sky rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-500">No gesture mappings configured</p>
            <p className="text-sm text-gray-400">
              Add your first mapping above to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(gestureMappings).map(([gesture, mapping], index) => (
              <div
                key={gesture}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-2xl animate-bounce-slow">{getGestureIcon(gesture)}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {gesture.replace("_", " ")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {mapping?.action
                          ? getActionDescription(mapping.action)
                          : "Not mapped"}
                      </p>
                      {mapping?.params &&
                        Object.keys(mapping.params).length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {Object.entries(mapping.params)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(", ")}
                          </p>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(gesture, mapping)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-300"
                      title="Edit mapping"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(gesture)}
                      className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all duration-300"
                      title="Delete mapping"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Gestures */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <div className="w-2 h-2 bg-gradient-teal rounded-full mr-3 animate-pulse"></div>
          Available Gestures
        </h3>
        <p className="text-gray-600 mb-4">
          These gestures can be detected but don't have actions mapped yet:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(mergedMappings)
            .filter(([_, mapping]) => !mapping)
            .map(([gesture], index) => (
              <div
                key={gesture}
                className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-3 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-up"
                style={{animationDelay: `${index * 0.05}s`}}
              >
                <div className="text-2xl mb-1 animate-bounce-slow">{getGestureIcon(gesture)}</div>
                <div className="text-sm text-gray-700 capitalize">
                  {gesture.replace("_", " ")}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default GestureConfig;
