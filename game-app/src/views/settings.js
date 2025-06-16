/**
 * International Draughts Settings Manager
 * Handles game preferences and configurations
 * @author codewithheck
 * Created: 2025-06-16 19:54:53 UTC
 */

export class Settings {
    constructor() {
        this.storageKey = 'draughts-settings';
        this.defaults = {
            highlightMoves: true,
            showNumbers: true,
            enableDragDrop: true,
            confirmMoves: false,
            theme: 'classic',
            notation: 'numeric' // 'numeric' or 'algebraic'
        };
        
        this.settings = this.loadSettings();
        this.callbacks = new Map();
    }

    /**
     * Loads settings from localStorage
     * @returns {Object} Settings object
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? { ...this.defaults, ...JSON.parse(stored) } : { ...this.defaults };
        } catch (error) {
            console.error('Failed to load settings:', error);
            return { ...this.defaults };
        }
    }

    /**
     * Saves current settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            this.notifyListeners('settingsChanged', this.settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Gets a setting value
     * @param {string} key Setting key
     * @returns {*} Setting value
     */
    get(key) {
        return this.settings[key];
    }

    /**
     * Sets a setting value
     * @param {string} key Setting key
     * @param {*} value Setting value
     */
    set(key, value) {
        if (this.settings[key] !== value) {
            this.settings[key] = value;
            this.saveSettings();
        }
    }

    /**
     * Resets settings to defaults
     */
    resetToDefaults() {
        this.settings = { ...this.defaults };
        this.saveSettings();
    }

    /**
     * Creates the settings UI
     * @returns {HTMLElement} Settings panel element
     */
    createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'settings-panel';

        // Highlight Moves toggle
        const highlightMovesContainer = this.createToggleSetting(
            'highlightMoves',
            'Highlight Legal Moves',
            'Show possible moves when a piece is selected'
        );
        panel.appendChild(highlightMovesContainer);

        // Show Numbers toggle
        const showNumbersContainer = this.createToggleSetting(
            'showNumbers',
            'Show Square Numbers',
            'Display square numbers on the board'
        );
        panel.appendChild(showNumbersContainer);

        // Enable Drag & Drop toggle
        const dragDropContainer = this.createToggleSetting(
            'enableDragDrop',
            'Enable Drag & Drop',
            'Allow moving pieces by dragging'
        );
        panel.appendChild(dragDropContainer);

        // Confirm Moves toggle
        const confirmMovesContainer = this.createToggleSetting(
            'confirmMoves',
            'Confirm Moves',
            'Ask for confirmation before making a move'
        );
        panel.appendChild(confirmMovesContainer);

        // Theme selector
        const themeContainer = this.createSelectSetting(
            'theme',
            'Board Theme',
            'Choose the board appearance',
            {
                'classic': 'Classic',
                'wood': 'Wooden',
                'modern': 'Modern',
                'contrast': 'High Contrast'
            }
        );
        panel.appendChild(themeContainer);

        // Notation selector
        const notationContainer = this.createSelectSetting(
            'notation',
            'Move Notation',
            'Choose the move notation style',
            {
                'numeric': 'Numeric (1-50)',
                'algebraic': 'Algebraic (a1-e5)'
            }
        );
        panel.appendChild(notationContainer);

        // Reset button
        const resetButton = document.createElement('button');
        resetButton.className = 'settings-reset-button';
        resetButton.textContent = 'Reset to Defaults';
        resetButton.onclick = () => this.resetToDefaults();
        panel.appendChild(resetButton);

        return panel;
    }

    /**
     * Creates a toggle setting UI element
     * @param {string} key Setting key
     * @param {string} label Setting label
     * @param {string} description Setting description
     * @returns {HTMLElement} Setting container element
     */
    createToggleSetting(key, label, description) {
        const container = document.createElement('div');
        container.className = 'settings-item';

        const labelElement = document.createElement('label');
        labelElement.className = 'settings-label';

        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = this.settings[key];
        toggle.onchange = () => this.set(key, toggle.checked);

        const textContainer = document.createElement('div');
        textContainer.className = 'settings-text';

        const title = document.createElement('span');
        title.className = 'settings-title';
        title.textContent = label;

        const desc = document.createElement('span');
        desc.className = 'settings-description';
        desc.textContent = description;

        textContainer.appendChild(title);
        textContainer.appendChild(desc);
        labelElement.appendChild(toggle);
        labelElement.appendChild(textContainer);
        container.appendChild(labelElement);

        return container;
    }

    /**
     * Creates a select setting UI element
     * @param {string} key Setting key
     * @param {string} label Setting label
     * @param {string} description Setting description
     * @param {Object} options Setting options
     * @returns {HTMLElement} Setting container element
     */
    createSelectSetting(key, label, description, options) {
        const container = document.createElement('div');
        container.className = 'settings-item';

        const textContainer = document.createElement('div');
        textContainer.className = 'settings-text';

        const title = document.createElement('span');
        title.className = 'settings-title';
        title.textContent = label;

        const desc = document.createElement('span');
        desc.className = 'settings-description';
        desc.textContent = description;

        const select = document.createElement('select');
        select.className = 'settings-select';
        select.value = this.settings[key];
        select.onchange = () => this.set(key, select.value);

        for (const [value, text] of Object.entries(options)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            select.appendChild(option);
        }

        textContainer.appendChild(title);
        textContainer.appendChild(desc);
        container.appendChild(textContainer);
        container.appendChild(select);

        return container;
    }

    /**
     * Adds a settings change listener
     * @param {string} event Event name
     * @param {Function} callback Callback function
     */
    addListener(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, new Set());
        }
        this.callbacks.get(event).add(callback);
    }

    /**
     * Removes a settings change listener
     * @param {string} event Event name
     * @param {Function} callback Callback function
     */
    removeListener(event, callback) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).delete(callback);
        }
    }

    /**
     * Notifies listeners of settings changes
     * @param {string} event Event name
     * @param {*} data Event data
     */
    notifyListeners(event, data) {
        if (this.callbacks.has(event)) {
            for (const callback of this.callbacks.get(event)) {
                callback(data);
            }
        }
    }
}
