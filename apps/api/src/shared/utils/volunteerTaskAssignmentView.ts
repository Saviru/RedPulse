export type VolunteerTaskCrewView = {
  assignedTask: null | {
    title: string;
    description: string;
    points: number;
    assignedAt: string | null;
  };
  taskAttendance: null | {
    status: "ATTENDED" | "ABSENT";
    markedAt: string | null;
  };
};

type AssignmentLean = {
  title?: string;
  description?: string;
  points?: number;
  assignedAt?: Date | null;
  attendanceStatus?: string | null;
  attendanceMarkedAt?: Date | null;
};

function legacyFromVolunteerRegistration(volReg: unknown): VolunteerTaskCrewView {
  const v = volReg as
    | {
        assignedTask?: {
          title?: string;
          description?: string;
          points?: number;
          assignedAt?: Date | null;
        };
        taskAttendance?: { status?: string; markedAt?: Date | null };
      }
    | null
    | undefined;
  const at = v?.assignedTask;
  const hasTask =
    at &&
    (Boolean(at.title?.trim()) ||
      Boolean(at.description?.trim()) ||
      at.assignedAt != null);
  const assignedTask = hasTask
    ? {
        title: at!.title ?? "",
        description: at!.description ?? "",
        points: Number(at!.points ?? 0),
        assignedAt: at!.assignedAt ? new Date(at!.assignedAt).toISOString() : null,
      }
    : null;
  const ta = v?.taskAttendance;
  const taskAttendance =
    ta?.status === "ATTENDED" || ta?.status === "ABSENT"
      ? {
          status: ta.status as "ATTENDED" | "ABSENT",
          markedAt: ta.markedAt ? new Date(ta.markedAt).toISOString() : null,
        }
      : null;
  return { assignedTask, taskAttendance };
}

export function resolveVolunteerTaskCrewView(
  assignment: AssignmentLean | null | undefined,
  volunteerRegistration: unknown,
): VolunteerTaskCrewView {
  const a = assignment;
  const hasAssignmentDoc =
    a &&
    (Boolean(String(a.title ?? "").trim()) ||
      Boolean(String(a.description ?? "").trim()) ||
      a.assignedAt != null);
  if (hasAssignmentDoc) {
    const taskAttendance =
      a!.attendanceStatus === "ATTENDED" || a!.attendanceStatus === "ABSENT"
        ? {
            status: a!.attendanceStatus as "ATTENDED" | "ABSENT",
            markedAt: a!.attendanceMarkedAt
              ? new Date(a!.attendanceMarkedAt).toISOString()
              : null,
          }
        : null;
    return {
      assignedTask: {
        title: a!.title ?? "",
        description: a!.description ?? "",
        points: Number(a!.points ?? 0),
        assignedAt: a!.assignedAt ? new Date(a!.assignedAt).toISOString() : null,
      },
      taskAttendance,
    };
  }
  return legacyFromVolunteerRegistration(volunteerRegistration);
}
