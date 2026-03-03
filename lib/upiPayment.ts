/**
 * Handles UPI payment initiation with support for multiple UPI apps
 */

export interface UPIPaymentParams {
  upiAddress: string;
  payeeName: string;
  amount: number;
  transactionRef?: string;
  description?: string;
}

/**
 * Generate UPI payment intent URL
 * Supports: Google Pay, PhonePay, BHIM, Paytm, etc.
 */
export const generateUPIUrl = (params: UPIPaymentParams): string => {
  const {
    upiAddress,
    payeeName,
    amount,
    transactionRef = "",
    description = "Payment",
  } = params;

  const queryParams = new URLSearchParams({
    pa: upiAddress,
    pn: payeeName,
    am: amount.toString(),
    tn: description,
    tr: transactionRef,
    cu: "INR",
  });

  return `upi://pay?${queryParams.toString()}`;
};

/**
 * Deep links for specific UPI apps
 * These are fallback options if the standard UPI intent doesn't work
 */
export const getUPIAppLinks = (
  params: UPIPaymentParams,
): Record<string, string> => {
  const { upiAddress, payeeName, amount, description } = params;
  const upiUrl = generateUPIUrl(params);

  return {
    // Standard UPI intent
    upi: upiUrl,

    // Google Pay specific
    googlePay: `https://pay.google.com/gp/action/SetupAndroidPay`,

    // PhonePe specific
    phonePe: `phonepe://upi/${upiAddress}?pn=${encodeURIComponent(payeeName || "Owner")}&am=${amount}&tn=${encodeURIComponent(description || "Payment")}`,

    // Paytm specific
    paytm: `paytmmp://upi/${upiAddress}?pn=${encodeURIComponent(payeeName || "Owner")}&am=${amount}`,

    // BHIM specific
    bhim: upiUrl,
  };
};

/**
 * Open UPI payment app with fallback mechanism
 */
export const initiateUPIPayment = (params: UPIPaymentParams): void => {
  // Check if user agent suggests mobile device
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  if (!isMobile) {
    // Not on mobile, show error or alternative payment method
    alert(
      "UPI payment is only available on mobile devices. Please use a mobile device to make the payment.",
    );
    return;
  }

  const upiUrl = generateUPIUrl(params);

  // Android-specific intent sequence, iOS and others use generic URL
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid) {
    const queryString = upiUrl.replace(/^upi:\/\//, "");
    const gpayIntent = `intent://${queryString}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
    const phonepeIntent = `intent://${queryString}#Intent;scheme=upi;package=com.phonepe.app;end`;

    // launch Google Pay intent first
    window.location.href = gpayIntent;

    // after a bit try PhonePe
    setTimeout(() => {
      window.location.href = phonepeIntent;
    }, 500);

    // fallback to generic UPI
    setTimeout(() => {
      window.location.href = upiUrl;
    }, 1000);
  } else {
    // non-Android (iOS, etc.) just open the UPI URL
    window.location.href = upiUrl;
  }

  // notify if nothing handled
  setTimeout(() => {
    if (document.visibilityState === "visible") {
      alert(
        "No UPI app found on this device. Please install a UPI app like Google Pay, PhonePe, or BHIM.",
      );
    }
  }, 1500);
};

/**
 * Fallback payment handler if UPI intent doesn't work
 * Shows available payment apps to user
 */
export const showUPIPaymentOptions = (params: UPIPaymentParams): void => {
  const upiUrl = generateUPIUrl(params);

  // For now, just use the standard UPI URL
  // In a real app, you could show a modal with different app options
  window.location.href = upiUrl;
};
