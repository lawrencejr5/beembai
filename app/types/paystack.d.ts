declare module "@paystack/inline-js" {
  export default class PaystackPop {
    newTransaction(options: {
      key: string;
      email: string;
      amount: number;
      currency?: string;
      label?: string;
      onSuccess?: (transaction: { reference: string }) => void | Promise<void>;
      onCancel?: () => void;
      [key: string]: any;
    }): void;
  }
}
