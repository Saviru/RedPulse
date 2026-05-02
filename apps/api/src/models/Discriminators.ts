import mongoose, { Document, Schema } from 'mongoose';
import { UserModel, IUserDocument } from './User';

export interface IRegularUser extends IUserDocument {
  role: 'USER';
  fullName: string;
  bloodGroup?: string;
  weight?: string;
  avatarUrl?: string;
  nic?: string;
  dob?: string;
  location?: string;
}

export const RegularUserModel = UserModel.discriminator<IRegularUser>(
  'USER',
  new Schema({
    fullName: { type: String, required: true },
    bloodGroup: { type: String },
    weight: { type: String },
    avatarUrl: { type: String },
    nic: { type: String, unique: true, sparse: true },
    dob: { type: String },
    location: { type: String },
    phone: { type: String, required: false }
  })
);

export interface IOrganizationUser extends IUserDocument {
  role: 'ORGANIZATION';
  organizationName: string;
  registrationNumber: string;
  website?: string;
  location?: string;
  orgType?: 'NGO' | 'GOVERNMENT' | 'PRIVATE' | 'OTHER';
}

export const OrganizationUserModel = UserModel.discriminator<IOrganizationUser>(
  'ORGANIZATION',
  new Schema({
    organizationName: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true, sparse: true },
    website: { type: String },
    location: { type: String },
    orgType: { type: String, enum: ['NGO', 'GOVERNMENT' , 'PRIVATE', 'OTHER'] },
    phone: { type: String, required: false }
  })
);

export interface IHospitalUser extends IUserDocument {
  role: 'HOSPITAL';
  hospitalName: string;
  licenseNumber: string;
  address: string;
}

export const HospitalUserModel = UserModel.discriminator<IHospitalUser>(
  'HOSPITAL',
  new Schema({
    hospitalName: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true, sparse: true },
    address: { type: String, required: true },
    phone: { type: String, required: false }
  })
);
