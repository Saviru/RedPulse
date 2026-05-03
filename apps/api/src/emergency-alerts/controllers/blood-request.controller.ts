import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BloodRequestModel, BloodRequestDocument } from "../../models/BloodRequest";
import { UserModel } from "../../models/User";
import { DonorProfileModel } from "../../models/DonorProfile";
import { HospitalProfileModel } from "../../models/HospitalProfile";
import { DeviceTokenModel } from "../../models/DeviceToken";
import { AlertNotificationModel } from "../../models/AlertNotification";
import { sendEmergencyPushEach } from "../services/fcm.service";
import { rankDonorsForEmergency } from "../services/matching.service";
import { Types } from "mongoose";

// Validation schemas
const bloodGroupSchema = z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

export const createBloodRequestSchema = z.object({
  bloodGroup: bloodGroupSchema,
  bloodComponent: z.enum(["Whole Blood", "Red Cells", "Plasma", "Platelets"]).optional(),
  neededBefore: z.string().optional(), // ISODate string
  locationText: z.string().min(2).max(500).optional(),
  address: z.string().min(2).max(500).optional(),
  city: z.string().min(2).max(100).optional(),
  hospitalWard: z.string().max(100).optional(),
  hospitalName: z.string().max(200).optional(),
  hospitalLocation: z.string().max(200).optional(),
  requesterLocation: z.string().max(200).optional(),
  coordinatorPhone: z.string().max(50).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  reason: z.string().min(2).max(200).optional(),
  patientName: z.string().max(200).optional(),
  patientAge: z.coerce.number().min(0).max(150).optional(),
  patientGender: z.enum(["Male", "Female", "Other"]).optional(),
  patientDetails: z.string().max(500).optional(),
  relationshipToPatient: z.string().max(100).optional(),
  doctorName: z.string().max(200).optional(),
  urgencyLevel: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  isEmergency: z.boolean().default(false),
});

// Helper to get compatible blood types
const compatibleBloodTypes: Record<string, string[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

// Helper to get which patient blood types a donor can give to
const canDonateTo: Record<string, string[]> = {
  "A+": ["A+", "AB+"],
  "A-": ["A+", "A-", "AB+", "AB-"],
  "B+": ["B+", "AB+"],
  "B-": ["B+", "B-", "AB+", "AB-"],
  "AB+": ["AB+"],
  "AB-": ["AB+", "AB-"],
  "O+": ["A+", "B+", "AB+", "O+"],
  "O-": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
};

// Create a blood request
export const createBloodRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const body = createBloodRequestSchema.parse(req.body);
    const user = await UserModel.findOne({ username: (req as any).user.username }).lean();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Ensure username is available (fallback for old tokens)
    const currentUsername = (req as any).user.username || user.username;

    // Fetch profile data for hospitals and donors
    const hospitalProfile = user.role === 'HOSPITAL' 
      ? await HospitalProfileModel.findOne({ hospitalId: (req as any).user.username }).lean()
      : null;
    const donorProfile = user.role === 'USER'
      ? await DonorProfileModel.findOne({ donorId: (req as any).user.username }).lean()
      : null;

    
    const requesterName = 
      (user as any).fullName || 
      (user as any).hospitalName || 
      (user as any).organizationName || 
      (user as any).displayName || 
      hospitalProfile?.name || 
      "Unknown";

    const requesterPhone = user.phone || (user as any).contactNumber || (user as any).phoneNumber || hospitalProfile?.hospitalId || donorProfile?.donorId;
    const requesterEmail = user.email;

    const requesterType = user.role === 'HOSPITAL' ? 'HOSPITAL' : 'USER';
    const targetType = user.role === 'HOSPITAL' ? 'HOSPITAL' : 'USER';

    const bloodRequest = await BloodRequestModel.create({
      requesterId: currentUsername,
      requesterType,
      requesterName,
      requesterPhone,
      requesterEmail,
      targetType,
      bloodGroup: body.bloodGroup,
      bloodComponent: body.bloodComponent,
      neededBefore: body.neededBefore ? new Date(body.neededBefore) : undefined,
      locationText: body.locationText || (user as any).location || (user as any).address || hospitalProfile?.address || donorProfile?.locationText || "Unknown Location",
      address: body.address || (user as any).address || hospitalProfile?.address,
      city: body.city || (user as any).city || hospitalProfile?.city,
      hospitalWard: body.hospitalWard,
      hospitalName: body.hospitalName || (user.role === 'HOSPITAL' ? ((user as any).hospitalName || hospitalProfile?.name) : undefined),
      hospitalLocation: body.hospitalLocation,
      requesterLocation: body.requesterLocation,
      coordinatorPhone: body.coordinatorPhone,
      coordinates: (body.lat && body.lng) 
        ? { type: "Point", coordinates: [body.lng, body.lat] }
        : ((user as any).lat && (user as any).lng)
          ? { type: "Point", coordinates: [(user as any).lng, (user as any).lat] }
          : undefined,
      reason: body.reason,
      patientName: body.patientName,
      patientAge: body.patientAge,
      patientGender: body.patientGender,
      relationshipToPatient: body.relationshipToPatient,
      doctorName: body.doctorName,
      patientDetails: body.patientDetails,
      urgencyLevel: body.urgencyLevel,
      isEmergency: body.isEmergency,
      hospitalReceipt: req.file ? `/uploads/hospital-receipts/${req.file.filename}` : undefined,
    });

    
    if (body.isEmergency) {
      await sendBloodRequestAlerts(String(bloodRequest._id), body.bloodGroup, targetType);
    }

    res.status(201).json(bloodRequest);
  } catch (error) {
    next(error);
  }
};


const sendBloodRequestAlerts = async (
  requestId: string, 
  bloodGroup: string, 
  targetType: 'USER' | 'HOSPITAL'
) => {
  try {
    const bloodRequest = await BloodRequestModel.findById(requestId).lean();
    if (!bloodRequest) return;
    const requesterId = bloodRequest.requesterId;

    let targets: { id: string; bloodGroup?: string; fcmTokens: string[] }[] = [];

    if (targetType === 'USER') {
      
      const compatible = compatibleBloodTypes[bloodGroup] || [bloodGroup];
      const donors = await DonorProfileModel.find({
        active: true,
        bloodGroup: { $in: compatible },
        donorId: { $ne: requesterId }, // Don't notify self
      }).lean();

      const donorIds = donors.map(d => d.donorId);
      const tokens = await DeviceTokenModel.find({
        donorId: { $in: donorIds },
        isActive: true,
      }).lean();

      const tokensByDonor = new Map<string, string[]>();
      for (const token of tokens) {
        const existing = tokensByDonor.get(token.donorId) || [];
        existing.push(token.fcmToken);
        tokensByDonor.set(token.donorId, existing);
      }

      targets = donors
        .filter(d => tokensByDonor.has(d.donorId))
        .map(d => ({
          id: d.donorId,
          bloodGroup: d.bloodGroup,
          fcmTokens: tokensByDonor.get(d.donorId) || [],
        }));
    } else {
      
      const hospitals = await HospitalProfileModel.find({ 
        active: true,
        hospitalId: { $ne: requesterId }, // Don't notify self
      }).lean();
      const hospitalIds = hospitals.map(h => h.hospitalId);
      const tokens = await DeviceTokenModel.find({
        donorId: { $in: hospitalIds },
        isActive: true,
      }).lean();

      const tokensByHospital = new Map<string, string[]>();
      for (const token of tokens) {
        const donorIdKey = token.donorId || "";
        const existing = tokensByHospital.get(donorIdKey) || [];
        existing.push(token.fcmToken);
        tokensByHospital.set(donorIdKey, existing);
      }

      targets = hospitals
        .filter(h => tokensByHospital.has(h.hospitalId))
        .map(h => ({
          id: h.hospitalId,
          fcmTokens: tokensByHospital.get(h.hospitalId) || [],
        }));
    }

    
    const now = new Date();
    const title = "Blood Request Alert";
    const pushMessages: Parameters<typeof sendEmergencyPushEach>[0] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifiedTargets: any[] = [];

    for (const target of targets.slice(0, 30)) { // Limit to top 30
      const notification = await AlertNotificationModel.create({
        emergencyRequestId: new Types.ObjectId(requestId),
        donorId: target.id,
        priorityScore: 100, // Default priority
        status: "sent",
        sentAt: now,
      });

      const alertId = String(notification._id);
      notifiedTargets.push({
        targetId: target.id,
        targetType,
        priorityScore: 100,
        notifiedAt: now,
        notificationId: notification._id,
      });

      const body = `Blood request for ${bloodGroup}. ${targetType === 'USER' ? "Can you help?" : "Please respond if available."}`;

      for (const token of target.fcmTokens) {
        pushMessages.push({
          token,
          title,
          body,
          data: {
            type: "BLOOD_REQUEST",
            requestId,
            alertId,
            bloodGroup,
          },
        });
      }
    }

    // Update the blood request with notified targets
    await BloodRequestModel.findByIdAndUpdate(requestId, {
      $push: { notifiedTargets: { $each: notifiedTargets } },
    });

    if (pushMessages.length > 0) {
      await sendEmergencyPushEach(pushMessages);
    }
  } catch (error) {
    console.error("Failed to send blood request alerts:", error);
  }
};

// Get blood requests for current user (as requester)
export const getMyBloodRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req as any).user || typeof (req as any).user.username !== 'string' || !(req as any).user.username) {
      res.status(401).json({ message: "Authentication required: valid username missing" });
      return;
    }

    const currentUsername = (req as any).user.username;
    const requests = await BloodRequestModel.find({ requesterId: currentUsername })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

// Get blood requests visible to current user (as donor or hospital)
export const getVisibleBloodRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req as any).user || typeof (req as any).user.username !== 'string' || !(req as any).user.username) {
      res.status(401).json({ message: "Authentication required: valid username missing" });
      return;
    }

    const user = await UserModel.findOne({ username: (req as any).user.username }).lean();
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const userRole = user.role.toUpperCase();
    const currentUsername = (req as any).user.username;

    let query: Record<string, any> = { 
      status: "open", 
      requesterId: { $ne: currentUsername } 
    };

    const requests = await BloodRequestModel.find(query)
      .sort({ isEmergency: -1, urgencyLevel: 1, createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

// Get a single blood request by ID
export const getBloodRequestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await BloodRequestModel.findById(req.params.requestId).lean();
    if (!request) {
      res.status(404).json({ message: "Blood request not found" });
      return;
    }
    res.status(200).json(request);
  } catch (error) {
    next(error);
  }
};

export const updateBloodRequestSchema = z.object({
  bloodGroup: bloodGroupSchema.optional(),
  bloodComponent: z.enum(["Whole Blood", "Red Cells", "Plasma", "Platelets"]).optional(),
  neededBefore: z.string().optional(),
  locationText: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  hospitalWard: z.string().optional(),
  hospitalName: z.string().optional(),
  hospitalLocation: z.string().optional(),
  requesterLocation: z.string().optional(),
  coordinatorPhone: z.string().optional(),
  reason: z.string().optional(),
  patientName: z.string().optional(),
  patientAge: z.coerce.number().optional(),
  patientGender: z.enum(["Male", "Female", "Other"]).optional(),
  patientDetails: z.string().optional(),
  relationshipToPatient: z.string().optional(),
  doctorName: z.string().optional(),
  status: z.enum(["open", "partially_fulfilled", "fulfilled", "cancelled", "expired"]).optional(),
  urgencyLevel: z.enum(["critical", "high", "medium", "low"]).optional(),
  isEmergency: z.boolean().optional(),
});

export const respondToRequestSchema = z.object({
  status: z.enum(["accepted", "declined"]),
  notes: z.string().max(500).optional(),
});

// Update a blood request (only by requester)
export const updateBloodRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const existing = await BloodRequestModel.findById(req.params.requestId);
    if (!existing) {
      res.status(404).json({ message: "Blood request not found" });
      return;
    }

    if (existing.requesterId !== (req as any).user.username) {
      res.status(403).json({ message: "Not authorized to update this request" });
      return;
    }

    const body = updateBloodRequestSchema.parse(req.body);
    
    // If neededBefore is updated, convert it to Date
    const updateData: any = { ...body };
    if (body.neededBefore) {
      updateData.neededBefore = new Date(body.neededBefore);
    }

    const updated = await BloodRequestModel.findByIdAndUpdate(
      req.params.requestId,
      { $set: updateData },
      { new: true }
    ).lean();

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

// Respond to a blood request (by donor or hospital)
export const respondToBloodRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const user = await UserModel.findOne({ username: (req as any).user.username }).lean();
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const currentUsername = (req as any).user.username || user.username;

    const bloodRequest = await BloodRequestModel.findById(req.params.requestId);
    if (!bloodRequest) {
      res.status(404).json({ message: "Blood request not found" });
      return;
    }

    // Check if requester is trying to respond to own request
    if (bloodRequest.requesterId === currentUsername) {
      res.status(400).json({ message: "You cannot respond to your own blood request" });
      return;
    }

    // Check if user is eligible to respond
    if (user.role === 'USER' && bloodRequest.targetType !== 'USER') {
      res.status(403).json({ message: "Users can only respond to user-targeted requests" });
      return;
    }

    const body = respondToRequestSchema.parse(req.body);

    // Fetch profile data for hospital name
    const hospitalProfile = user.role === 'HOSPITAL'
      ? await HospitalProfileModel.findOne({ hospitalId: (req as any).user.username }).lean()
      : null;

    // Check if already responded
    const existingResponse = bloodRequest.responses.find(
      r => r.responderId === currentUsername
    );

    if (existingResponse) {
      // Update existing response
      existingResponse.status = body.status;
      existingResponse.notes = body.notes;
      existingResponse.respondedAt = new Date();
    } else {
      // Add new response
      bloodRequest.responses.push({
        responderId: currentUsername,
        responderType: user.role === 'HOSPITAL' ? 'HOSPITAL' : 'USER',
        responderName: (user as any).displayName || hospitalProfile?.name || "Unknown",
        responderPhone: user.phone,
        responderBloodGroup: (user as any).bloodGroup,
        status: body.status,
        notes: body.notes,
        respondedAt: new Date(),
      });
    }

    // Update request status if enough acceptances
    const acceptedCount = bloodRequest.responses.filter(
      r => r.status === "accepted"
    ).length;
    
    // Only set to fulfilled if it was open or partially fulfilled
    if (acceptedCount >= 1 && (bloodRequest.status === "open" || bloodRequest.status === "partially_fulfilled")) {
      bloodRequest.status = "fulfilled";
    }

    await bloodRequest.save();
    res.status(200).json(bloodRequest);
  } catch (error) {
    next(error);
  }
};

// Cancel a blood request
export const cancelBloodRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const existing = await BloodRequestModel.findById(req.params.requestId);
    if (!existing) {
      res.status(404).json({ message: "Blood request not found" });
      return;
    }

    if (existing.requesterId !== (req as any).user.username) {
      res.status(403).json({ message: "Not authorized to cancel this request" });
      return;
    }

    existing.status = "cancelled";
    await existing.save();

    res.status(200).json(existing);
  } catch (error) {
    next(error);
  }
};

// Get priority-ranked blood requests (for matching page)
export const getPriorityBloodRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req as any).user || typeof (req as any).user.username !== 'string' || !(req as any).user.username) {
      res.status(401).json({ message: "Authentication required: valid username missing" });
      return;
    }

    const user = await UserModel.findOne({ username: (req as any).user.username }).lean();
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Fetch profile data for city comparison
    const hospitalProfile = user.role === 'HOSPITAL'
      ? await HospitalProfileModel.findOne({ hospitalId: (req as any).user.username }).lean()
      : null;
    const donorProfile = user.role === 'USER'
      ? await DonorProfileModel.findOne({ donorId: (req as any).user.username }).lean()
      : null;
    const userCity = hospitalProfile?.city; // Only hospitals have city in profile

    const userRole = user.role.toUpperCase();
    const currentUsername = (req as any).user.username;
    console.log(`[API] getPriorityBloodRequests for user: ${currentUsername}, role: ${userRole}, bloodGroup: ${(user as any).bloodGroup}`);
    
    let query: Record<string, any> = { 
      status: { $in: ["open", "partially_fulfilled"] }, 
      requesterId: { $ne: currentUsername } 
    };
    
    console.log(`[API] Blood request query:`, JSON.stringify(query));

    const requests = await BloodRequestModel.find(query)
      .sort({ isEmergency: -1, urgencyLevel: 1, createdAt: -1 })
      .limit(50)
      .lean();

    // Calculate priority score for each request
    const prioritized = requests.map(r => {
      let score = 100;
      
      // Emergency gets highest priority
      if (r.isEmergency) score += 50;
      
      // Urgency level
      if (r.urgencyLevel === "critical") score += 30;
      else if (r.urgencyLevel === "high") score += 20;
      else if (r.urgencyLevel === "medium") score += 10;
      
      // Blood type exact match
      if ((user as any).bloodGroup && r.bloodGroup === (user as any).bloodGroup) score += 20;
      
      // Location match
      if (r.city && userCity && r.city.toLowerCase() === userCity.toLowerCase()) {
        score += 15;
      }
      
      // Recency bonus
      const hoursOld = r.createdAt 
        ? (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60)
        : 24;
      if (hoursOld < 1) score += 10;
      else if (hoursOld < 6) score += 5;

      return {
        ...r,
        priorityScore: score,
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);

    res.status(200).json(prioritized);
  } catch (error) {
    next(error);
  }
};

// Get requests accepted by current user
export const getAcceptedBloodRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const currentUsername = (req as any).user.username;

    const requests = await BloodRequestModel.find({
      responses: {
        $elemMatch: {
          responderId: currentUsername,
          status: "accepted"
        }
      }
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};
