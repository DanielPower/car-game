import { Toast } from "./toast";

export const setupErrorToasts = () => {
  const originalConsoleError = console.error;
  console.error = function (...args) {
    originalConsoleError.apply(console, args);

    const message = args
      .map((arg) => {
        if (arg instanceof Error) {
          return arg.message;
        } else if (typeof arg === "object") {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        } else {
          return String(arg);
        }
      })
      .join(" ");

    Toast.error(message, { duration: 8000 });
  };

  window.onerror = function (message, source, lineno, colno, error) {
    const errorMsg = error ? error.stack || error.message : String(message);
    Toast.error(`Unhandled error: ${errorMsg}`, { duration: 10000 });
    return false; // Let default handler run as well
  };

  window.addEventListener("unhandledrejection", function (event) {
    const reason = event.reason;
    let message = "Unhandled Promise rejection: ";

    if (reason instanceof Error) {
      message += reason.stack || reason.message;
    } else if (typeof reason === "object") {
      try {
        message += JSON.stringify(reason);
      } catch (e) {
        message += String(reason);
      }
    } else {
      message += String(reason);
    }

    Toast.error(message, { duration: 10000 });
  });
};

