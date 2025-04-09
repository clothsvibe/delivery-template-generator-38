
export interface DeliveryReceipt {
  id: string;
  date: string;
  nb: string | number | null;
  montantBL: number | null;
  avance: number | null;
  total: number;
  isEditing?: boolean;
  companyId?: string; // Add reference to company
}

export interface DeliveryTableColumn {
  id: string;
  header: string;
  accessorKey: keyof DeliveryReceipt;
  cell?: (info: any) => React.ReactNode;
  enableSorting?: boolean;
  enableEditing?: boolean;
}

export interface AdminFormData {
  date: string;
  nb: string;
  montantBL: string;
  avance: string;
}

export interface CompanySettings {
  id: string;
  name: string;
  logo?: string;
  colorTheme?: string;
  columnColors?: ColumnColors;
  rowColors?: RowColors;
}

export interface ColumnColors {
  date: string;
  nb: string;
  montantBL: string; // This matches our interface, but not DB (which uses montantbl)
  avance: string;
  total: string;
}

export interface RowColors {
  even: string;
  odd: string;
  header: string;
}

export interface MonthlyReceipt {
  year: number;
  month: number;
  total: number;
}

export interface TableSettings {
  companyId?: string;
  columnColors: ColumnColors;
  rowColors?: RowColors;
}

export interface HistoryEntry {
  id: string; // Added this missing property
  date: string;
  action: 'add' | 'update' | 'delete';
  receiptId: string;
  details: Partial<DeliveryReceipt>;
  companyId?: string;
}
