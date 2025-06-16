/**
 * International Draughts Notification System
 * Handles game notifications and user feedback
 * @author codewithheck
 * Created: 2025-06-16 19:59:32 UTC
 */

export class Notification {
    constructor() {
        this.container = null;
        this.queue = [];
        this.isProcessing = false;
        this.currentNotification = null;
        
        this.initialize();
    }

    initialize() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    /**
     * Shows a notification
     * @param {string} message Notification message
     * @param {Object} options Notification options
     */
    show(message, options = {}) {
        const defaults = {
            type: 'info',      // info, success, warning, error
            duration: 3000,    // Duration in milliseconds
            closable: true,    // Show close button
            position: 'top',   // top, bottom
            icon: true,        // Show icon
            animate: true      // Enable animations
        };

        const settings = { ...defaults, ...options };
        const notification = this.createNotification(message, settings);
        
        if (settings.animate) {
            notification.classList.add('notification-animate');
        }

        this.queue.push({ element: notification, settings });
        this.processQueue();
    }

    /**
     * Creates a notification element
     * @param {string} message Notification message
     * @param {Object} settings Notification settings
     * @returns {HTMLElement} Notification element
     */
    createNotification(message, settings) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${settings.type}`;
        notification.setAttribute('role', 'alert');

        if (settings.icon) {
            const icon = document.createElement('span');
            icon.className = 'notification-icon';
            icon.innerHTML = this.getIconSVG(settings.type);
            notification.appendChild(icon);
        }

        const content = document.createElement('div');
        content.className = 'notification-content';
        content.textContent = message;
        notification.appendChild(content);

        if (settings.closable) {
            const closeButton = document.createElement('button');
            closeButton.className = 'notification-close';
            closeButton.innerHTML = '×';
            closeButton.setAttribute('aria-label', 'Close notification');
            closeButton.onclick = () => this.close(notification);
            notification.appendChild(closeButton);
        }

        return notification;
    }

    /**
     * Processes the notification queue
     */
    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        const { element, settings } = this.queue.shift();
        this.currentNotification = element;

        this.container.appendChild(element);
        element.offsetHeight; // Force reflow for animation
        element.classList.add('notification-show');

        try {
            await this.wait(settings.duration);
            await this.close(element);
        } catch (error) {
            console.error('Error processing notification:', error);
        } finally {
            this.isProcessing = false;
            this.currentNotification = null;
            this.processQueue();
        }
    }

    /**
     * Closes a notification
     * @param {HTMLElement} element Notification element
     * @returns {Promise} Promise that resolves when notification is closed
     */
    close(element) {
        return new Promise(resolve => {
            element.classList.remove('notification-show');
            element.classList.add('notification-hide');

            element.addEventListener('animationend', () => {
                if (element.parentNode === this.container) {
                    this.container.removeChild(element);
                }
                resolve();
            }, { once: true });
        });
    }

    /**
     * Shows a success notification
     * @param {string} message Notification message
     * @param {Object} options Notification options
     */
    success(message, options = {}) {
        this.show(message, { ...options, type: 'success' });
    }

    /**
     * Shows a warning notification
     * @param {string} message Notification message
     * @param {Object} options Notification options
     */
    warning(message, options = {}) {
        this.show(message, { ...options, type: 'warning' });
    }

    /**
     * Shows an error notification
     * @param {string} message Notification message
     * @param {Object} options Notification options
     */
    error(message, options = {}) {
        this.show(message, { ...options, type: 'error', duration: 5000 });
    }

    /**
     * Shows an info notification
     * @param {string} message Notification message
     * @param {Object} options Notification options
     */
    info(message, options = {}) {
        this.show(message, { ...options, type: 'info' });
    }

    /**
     * Utility method to wait for a duration
     * @param {number} ms Duration in milliseconds
     * @returns {Promise} Promise that resolves after duration
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gets the SVG icon for a notification type
     * @param {string} type Notification type
     * @returns {string} SVG icon markup
     */
    getIconSVG(type) {
        const icons = {
            success: `<svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>`,
            warning: `<svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M12 2L1 21h22L12 2zm0 3.17L19.83 19H4.17L12 5.17zM11 16h2v2h-2zm0-6h2v4h-2z"/>
            </svg>`,
            error: `<svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>`,
            info: `<svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2v6h-2zm0 8h2v2h-2z"/>
            </svg>`
        };

        return icons[type] || icons.info;
    }

    /**
     * Clears all notifications
     */
    clearAll() {
        this.queue = [];
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        this.isProcessing = false;
        this.currentNotification = null;
    }

    /**
     * Disposes the notification system
     */
    dispose() {
        this.clearAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
