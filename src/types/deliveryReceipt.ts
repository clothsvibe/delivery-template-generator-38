
export interface DeliveryReceipt {
  id: string;
  date: string;
  nb: number | null;
  montantBL: number | null;
  avance: number | null;
  total: number;
  isEditing?: boolean;
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
