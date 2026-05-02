import { requestJson } from "./api";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type UrgencyLevel = "critical" | "high" | "medium" | "low";
export type RequestStatus = "open" | "partially_fulfilled" | "fulfilled" | "cancelled" | "expired";
export type ResponseStatus = "pending" | "accepted" | "declined" | "cancelled";
export type RequesterType = "individual" | "hospital";
export type TargetType = "donor" | "hospital";

export interface CreateBloodRequestInput {
  bloodGroup: BloodGroup;
  bloodComponent?: "Whole Blood" | "Red Cells" | "Plasma" | "Platelets";
  neededBefore?: string;
  locationText?: string;
  address?: string;
  city?: string;
  hospitalWard?: string;
  coordinatorPhone?: string;
  hospitalName?: string;
  hospitalLocation?: string;
  requesterLocation?: string;
  lat?: number;
  lng?: number;
  reason?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: "Male" | "Female" | "Other";
  patientDetails?: string;
  relationshipToPatient?: string;
  doctorName?: string;
  urgencyLevel?: UrgencyLevel;
  isEmergency?: boolean;
  role?: string;
}

export interface BloodRequestResponse {
  _id: string;
  requesterId: string;
  requesterType: RequesterType;
  requesterName?: string;
  requesterPhone?: string;
  requesterEmail?: string;
  targetType: TargetType;
  bloodGroup: BloodGroup;
  locationText?: string;
  address?: string;
  city?: string;
  hospitalWard?: string;
  coordinatorPhone?: string;
  hospitalName?: string;
  hospitalLocation?: string;
  requesterLocation?: string;
  reason?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  patientDetails?: string;
  relationshipToPatient?: string;
  doctorName?: string;
  urgencyLevel: UrgencyLevel;
  isEmergency: boolean;
  status: RequestStatus;
  responses: BloodRequestResponseItem[];
  notifiedTargets: NotifiedTarget[];
  createdAt: string;
  updatedAt: string;
  priorityScore?: number;
}

export interface BloodRequestResponseItem {
  responderId: string;
  responderType: "donor" | "hospital";
  responderName?: string;
  responderPhone?: string;
  responderBloodGroup?: string;
  status: ResponseStatus;
  respondedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface NotifiedTarget {
  targetId: string;
  targetType: "donor" | "hospital";
  priorityScore?: number;
  notifiedAt: string;
}

export interface RespondToRequestInput {
  status: "accepted" | "declined";
  notes?: string;
}

// Create a blood request
export const createBloodRequest = (
  input: CreateBloodRequestInput
): Promise<BloodRequestResponse> =>
  requestJson<BloodRequestResponse>("/blood-requests", {
    method: "POST",
    body: JSON.stringify(input),
    auth: true,
  });

// Get my blood requests (as requester)
export const getMyBloodRequests = (): Promise<BloodRequestResponse[]> =>
  requestJson<BloodRequestResponse[]>("/blood-requests/my", {
    auth: true,
  });

// Get visible blood requests (as potential responder)
export const getVisibleBloodRequests = (): Promise<BloodRequestResponse[]> =>
  requestJson<BloodRequestResponse[]>("/blood-requests/visible", {
    auth: true,
  });

// Get priority-ranked blood requests
export const getPriorityBloodRequests = (): Promise<BloodRequestResponse[]> =>
  requestJson<BloodRequestResponse[]>("/blood-requests/priority", {
    auth: true,
  });

// Get accepted blood requests
export const getAcceptedBloodRequests = (): Promise<BloodRequestResponse[]> =>
  requestJson<BloodRequestResponse[]>("/blood-requests/accepted", {
    auth: true,
  });

// Get a single blood request
export const getBloodRequest = (requestId: string): Promise<BloodRequestResponse> =>
  requestJson<BloodRequestResponse>(`/blood-requests/${requestId}`, {
    auth: true,
  });

// Update a blood request
export const updateBloodRequest = (
  requestId: string,
  input: Partial<CreateBloodRequestInput & { status: RequestStatus }>
): Promise<BloodRequestResponse> =>
  requestJson<BloodRequestResponse>(`/blood-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    auth: true,
  });

// Respond to a blood request
export const respondToBloodRequest = (
  requestId: string,
  input: RespondToRequestInput
): Promise<BloodRequestResponse> =>
  requestJson<BloodRequestResponse>(`/blood-requests/${requestId}/respond`, {
    method: "POST",
    body: JSON.stringify(input),
    auth: true,
  });

// Cancel a blood request
export const cancelBloodRequest = (requestId: string): Promise<BloodRequestResponse> =>
  requestJson<BloodRequestResponse>(`/blood-requests/${requestId}/cancel`, {
    method: "POST",
    auth: true,
  });

export default function Ignore() { return null; }
