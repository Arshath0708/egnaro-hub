// Centralized payment configuration for Egnaro Mart production transactions

export const PAYMENT_CONFIG = {
  bankAccount: {
    accountNumber: "120040660968",
    bankName: "Canara Bank",
    ifscCode: "CNRB0001200",
    holderName: "Egnaro Mart",
  },
  upi: {
    // UPI VPA mapped to the official bank account number and IFSC via NPCI standard routing
    upiId: "120040660968@cnrb.ifsc.npci",
    payeeName: "Egnaro Mart",
  }
};
