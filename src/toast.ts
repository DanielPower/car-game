export interface ToastOptions {
  duration?: number;
  type?: 'error' | 'info' | 'success' | 'warning';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export class ToastManager {
  private container: HTMLDivElement;
  private defaultOptions: Required<ToastOptions> = {
    duration: 5000,
    type: 'info',
    position: 'top-right'
  };

  constructor() {
    this.container = document.createElement('div');
    this.container.className = `toast-container ${this.defaultOptions.position}`;
    document.body.appendChild(this.container);
    
    this.setupStyles();
  }

  private setupStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .toast-container {
        position: fixed;
        z-index: 9999;
        max-width: 100%;
        box-sizing: border-box;
        padding: 8px;
      }
      .toast-container.top-right {
        top: 0;
        right: 0;
      }
      .toast-container.top-left {
        top: 0;
        left: 0;
      }
      .toast-container.bottom-right {
        bottom: 0;
        right: 0;
      }
      .toast-container.bottom-left {
        bottom: 0;
        left: 0;
      }
      .toast-container.top-center {
        top: 0;
        left: 50%;
        transform: translateX(-50%);
      }
      .toast-container.bottom-center {
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
      }
      .toast {
        margin-bottom: 8px;
        padding: 12px 16px;
        border-radius: 4px;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
        color: white;
        font-family: Arial, sans-serif;
        font-size: 14px;
        max-width: 350px;
        word-break: break-word;
        animation: toast-in 0.3s ease-out;
        transition: transform 0.3s ease-out;
        position: relative;
      }
      @keyframes toast-in {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .toast.closing {
        transform: translateY(-20px);
        opacity: 0;
      }
      .toast.error {
        background-color: #e74c3c;
      }
      .toast.info {
        background-color: #3498db;
      }
      .toast.success {
        background-color: #2ecc71;
      }
      .toast.warning {
        background-color: #f39c12;
      }
    `;
    document.head.appendChild(style);
  }

  show(message: string, options?: ToastOptions): void {
    const mergedOptions: Required<ToastOptions> = {
      ...this.defaultOptions,
      ...options
    };

    // Update container position
    this.container.className = `toast-container ${mergedOptions.position}`;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${mergedOptions.type}`;
    toast.textContent = message;
    
    this.container.appendChild(toast);

    // Set timeout to remove toast
    setTimeout(() => {
      toast.classList.add('closing');
      setTimeout(() => {
        if (toast.parentNode === this.container) {
          this.container.removeChild(toast);
        }
      }, 300);
    }, mergedOptions.duration);
  }

  error(message: string, options?: Omit<ToastOptions, 'type'>): void {
    this.show(message, { ...options, type: 'error' });
  }

  info(message: string, options?: Omit<ToastOptions, 'type'>): void {
    this.show(message, { ...options, type: 'info' });
  }

  success(message: string, options?: Omit<ToastOptions, 'type'>): void {
    this.show(message, { ...options, type: 'success' });
  }

  warning(message: string, options?: Omit<ToastOptions, 'type'>): void {
    this.show(message, { ...options, type: 'warning' });
  }
}

// Create singleton instance
export const Toast = new ToastManager();