export type MainStackParamList = {
  Tabs: undefined;
  TransactionForm:
    | {
        id?: string;
        captureReceipt?: boolean;
        receiptUrl?: string;
        type?: 'EXPENSE' | 'INCOME';
      }
    | undefined;
  Categories: undefined;
  CategoryForm: { id?: string } | undefined;
  Settings: undefined;
  Help: undefined;
  Budget: undefined;
  Recurring: undefined;
  Savings: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Capture: undefined;
  Summary: undefined;
  Profile: undefined;
};
