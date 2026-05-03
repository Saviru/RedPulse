import { requestJson } from "./api";

export type PointTransaction = {
  _id: string;
  userId: string;
  type: "REDEEM" | "DONATE" | "EARN";
  points: number;
  description: string;
  meta?: Record<string, any>;
  createdAt: string;
};

export async function getTransactions() {
  return requestJson<PointTransaction[]>("/points/transactions", { 
    method: "GET", 
    auth: true 
  });
}
