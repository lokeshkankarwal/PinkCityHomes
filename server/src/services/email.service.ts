/**
 * Email Service Adapter
 * Delegates to emailService.ts (Resend HTTPS API)
 */
export {
  sendVerificationEmail,
  sendOTPEmail,
  maskEmail,
  checkEmailServiceConfigured,
} from "./emailService.js";
