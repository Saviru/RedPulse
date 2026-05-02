import { Types } from "mongoose";
import { AlertNotificationModel } from "../../models/AlertNotification";
import { DeviceTokenModel } from "../../models/DeviceToken";
import { sendEmergencyPushEach } from "./fcm.service";

export const saveDonorResponse = async (alertId: string, action: "accepted" | "declined") => {
  const alert = await AlertNotificationModel.findByIdAndUpdate(
    alertId,
    { $set: { status: action, respondedAt: new Date() } },
    { new: true }
  ).lean();

  if (!alert) throw new Error("Alert not found");
  return alert;
};

export const markAlertOpened = async (alertId: string) => {
  const alert = await AlertNotificationModel.findByIdAndUpdate(
    alertId,
    { $set: { status: "opened" } },
    { new: true }
  ).lean();

  if (!alert) throw new Error("Alert not found");
  return alert;
};

