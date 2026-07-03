import type { FlowPeriodSelection } from "./flow";

export interface AssetBoard {
  id: string;
  title: string;
  ownerName: string;
  period: FlowPeriodSelection;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
