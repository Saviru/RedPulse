export type Role = 'USER' | 'ORGANIZATION' | 'HOSPITAL';

export interface BaseUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends BaseUser {
  role: 'USER';
  firstName: string;
  lastName: string;
  bloodGroup?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface OrganizationProfile extends BaseUser {
  role: 'ORGANIZATION';
  organizationName: string;
  registrationNumber: string;
  contactNumber: string;
  website?: string;
}

export interface HospitalProfile extends BaseUser {
  role: 'HOSPITAL';
  hospitalName: string;
  licenseNumber: string;
  address: string;
  emergencyContact: string;
}

export type AnyUser = UserProfile | OrganizationProfile | HospitalProfile;
