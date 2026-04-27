import { body } from 'express-validator';

export const registerValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['USER', 'ORGANIZATION', 'HOSPITAL']).withMessage('Invalid role'),

  // Role conditional validations
  body('fullName').if(body('role').equals('USER')).notEmpty().withMessage('Full name is required for User'),
  body('bloodGroup').if(body('role').equals('USER')).optional().isString(),
  body('weight').if(body('role').equals('USER')).optional().isString(),


  body('organizationName').if(body('role').equals('ORGANIZATION')).notEmpty().withMessage('Organization name is required'),
  body('registrationNumber').if(body('role').equals('ORGANIZATION')).notEmpty().withMessage('Registration number is required'),
  body('phone').if(body('role').equals('ORGANIZATION')).notEmpty().withMessage('Contact number is required'),

  body('hospitalName').if(body('role').equals('HOSPITAL')).notEmpty().withMessage('Hospital name is required'),
  body('licenseNumber').if(body('role').equals('HOSPITAL')).notEmpty().withMessage('License number is required'),
  body('address').if(body('role').equals('HOSPITAL')).notEmpty().withMessage('Address is required'),
  body('phone').if(body('role').equals('HOSPITAL')).notEmpty().withMessage('Emergency contact is required'),
];

export const loginValidator = [
  body('email').notEmpty().withMessage('Email or Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const tokenExchangeValidator = [
  body('authorizationCode').notEmpty().withMessage('Authorization code is required'),
  body('codeVerifier').notEmpty().withMessage('Code verifier is required')
];

export const updateProfileValidator = [
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('organizationName').optional().isString(),
  body('hospitalName').optional().isString(),
];

export const verifyRegistrationValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 characters')
];

export const confirmDeleteValidator = [
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 characters')
];
