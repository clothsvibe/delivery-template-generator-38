
export interface DeliveryReceipt {
  id: string;
  date: string;
  nb: number | null;
  montantBL: number | null;
  avance: number | null;
  total: number;
}

export interface DeliveryTableColumn {
  id: string;
  header: string;
  accessorKey: keyof DeliveryReceipt;
  cell?: (info: any) => React.ReactNode;
  enableSorting?: boolean;
}
