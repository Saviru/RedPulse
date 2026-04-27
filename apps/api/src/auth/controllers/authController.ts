import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../../models/User';
import { RegularUserModel, OrganizationUserModel, HospitalUserModel } from '../../models/Discriminators';
import { AuthCodeModel } from '../../models/AuthCode';
import { OtpModel } from '../../models/Otp';
import { generateAuthorizationCode, generateToken, verifyCodeChallenge } from '../../shared/utils/jwt';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { emailService } from '../../shared/services/EmailService';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password, role, codeChallenge, ...rest } = req.body;
    
    let avatarPath;
    if (req.file) {
      // Create a relative URL path to serve the file
      avatarPath = `/uploads/avatars/${req.file.filename}`;
      rest.avatar = avatarPath;
    }

    const userExists = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      res.status(400).json({ message: 'User with this email or username already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const phone = req.body.phone || req.body.phoneNumber || req.body.contactNumber || req.body.emergencyContact;
    if (!phone) {
      res.status(400).json({ message: 'Phone number is required' });
      return;
    }

    // Check for existing phone number before following
    const phoneExists = await UserModel.findOne({ phone });
    if (phoneExists) {
      res.status(400).json({ message: 'User with this phone number already exists' });
      return;
    }

    // Age validation for donors (USER role)
    if (role === 'USER' && rest.dob) {
      const birthDate = new Date(rest.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        res.status(400).json({ message: 'Donors must be at least 18 years old' });
        return;
      }
    }

    const baseData = { email, username, passwordHash, role, phone, ...rest };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OtpModel.create({
      email,
      otp,
      purpose: 'REGISTER',
      userData: baseData,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    try {
      await emailService.sendOtpEmail(email, otp, 'REGISTER');
    } catch (emailError: any) {
      await OtpModel.deleteMany({ email, purpose: 'REGISTER' });
      res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
      return;
    }

    res.status(201).json({ message: 'OTP sent to email. Please verify.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password, codeChallenge } = req.body;

    // Login email and username
    const loginIdentifier = email || username;
    const user = await UserModel.findOne({
      $or: [
        { email: loginIdentifier },
        { username: loginIdentifier }
      ]
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      if (!user.isVerified) {
        res.status(403).json({ message: 'Please verify your email first' });
        return;
      }

      // PKCE flow
      if (codeChallenge) {
        const code = generateAuthorizationCode();
        await AuthCodeModel.create({
          authorizationCode: code,
          codeChallenge,
          userId: user.id,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });
        res.json({ authorizationCode: code, expiresIn: 600 });
        return;
      }

      // fallback standard JWT
      const token = generateToken(user.id, user.role);
      res.json({ accessToken: token, user });
    } else {
      const pendingReg = await OtpModel.findOne({ email: loginIdentifier.toLowerCase(), purpose: 'REGISTER' });
      if (pendingReg && pendingReg.userData && (await bcrypt.compare(password, pendingReg.userData.passwordHash))) {
        res.status(403).json({ message: 'Please verify your email first' });
        return;
      }
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const exchangeToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { authorizationCode, codeVerifier } = req.body;

    const authCodeEntry = await AuthCodeModel.findOne({ authorizationCode });
    if (!authCodeEntry || authCodeEntry.expiresAt < new Date()) {
      res.status(400).json({ message: 'Invalid or expired authorization code' });
      return;
    }

    if (!verifyCodeChallenge(codeVerifier, authCodeEntry.codeChallenge)) {
      res.status(400).json({ message: 'Invalid code verifier' });
      return;
    }

    const user = await UserModel.findById(authCodeEntry.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const accessToken = generateToken(user.id, user.role);

    // consume code
    await AuthCodeModel.deleteOne({ _id: authCodeEntry._id });

    res.json({ accessToken, user, expiresIn: 86400 });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }
    const user = await UserModel.findById(req.user.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const updates = req.body;

    // Looks for the user before update details
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // Protect sensitive fields
    delete updates.passwordHash;
    delete updates.role;
    delete updates._id;

    // Apply updates
    Object.assign(user, updates);

    // Map frontend fields
    if (updates.phone || updates.phoneNumber || updates.contactNumber || updates.emergencyContact) {
      user.phone = updates.phone || updates.phoneNumber || updates.contactNumber || updates.emergencyContact;
    }

    await user.save();

    // Re-fetch data
    const updatedUser = await UserModel.findById(user.id).select('-passwordHash');
    res.json(updatedUser);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email, Username, Phone, or ID already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

export const verifyRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, codeChallenge } = req.body;
    
    const otpRecord = await OtpModel.findOne({ email: email.toLowerCase(), otp, purpose: 'REGISTER' });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    let user = await UserModel.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      if (!otpRecord.userData) {
        res.status(400).json({ message: 'Registration data lost. Please register again.' });
        return;
      }
      
      const { role, ...baseData } = otpRecord.userData;
      const createData = { ...baseData, role, isVerified: true };

      try {
        if (role === 'USER') {
          user = await RegularUserModel.create(createData);
        } else if (role === 'ORGANIZATION') {
          user = await OrganizationUserModel.create(createData);
        } else if (role === 'HOSPITAL') {
          user = await HospitalUserModel.create(createData);
        } else {
          res.status(400).json({ message: 'Invalid role provided' });
          return;
        }
      } catch (err: any) {
        if (err.code === 11000) {
          res.status(400).json({ message: 'Username or Phone number already taken.' });
          return;
        }
        throw err;
      }
    } else {
      user = await UserModel.findOneAndUpdate({ email: email.toLowerCase() }, { isVerified: true }, { new: true });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
    }

    await OtpModel.deleteOne({ _id: otpRecord._id });

    if (codeChallenge) {
      const code = generateAuthorizationCode();
      await AuthCodeModel.create({
        authorizationCode: code,
        codeChallenge,
        userId: user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });
      res.status(200).json({ authorizationCode: code, expiresIn: 600 });
      return;
    }

    const token = generateToken(user.id, user.role);
    res.status(200).json({ accessToken: token, user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, purpose } = req.body;
    
    if (!email || !purpose) {
      res.status(400).json({ message: 'Email and purpose are required.' });
      return;
    }

    let existingUserData = null;

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (purpose === 'DELETE') {
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
    } else if (purpose === 'REGISTER') {
      if (user && user.isVerified) {
        res.status(400).json({ message: 'Account is already verified.' });
        return;
      }

      const existingOtp = await OtpModel.findOne({ email: email.toLowerCase(), purpose: 'REGISTER' });
      if (!existingOtp || !existingOtp.userData) {
        res.status(404).json({ message: 'Registration data not found. Please register again.' });
        return;
      }
      existingUserData = existingOtp.userData;
    }

    await OtpModel.deleteMany({ email: email.toLowerCase(), purpose });

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    await OtpModel.create({
      email: email.toLowerCase(),
      otp: newOtp,
      purpose,
      userData: existingUserData,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await emailService.sendOtpEmail(email.toLowerCase(), newOtp, purpose);

    res.status(200).json({ message: 'A new OTP has been sent to your email.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const requestDelete = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OtpModel.create({
      email: user.email,
      otp,
      purpose: 'DELETE',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await emailService.sendOtpEmail(user.email, otp, 'DELETE');

    res.json({ message: 'Deletion OTP sent to email. Please confirm.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmDelete = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { otp } = req.body;
    const otpRecord = await OtpModel.findOne({ email: user.email.toLowerCase(), otp, purpose: 'DELETE' });
    
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    await UserModel.findByIdAndDelete(req.user.id);
    await OtpModel.deleteOne({ _id: otpRecord._id });

    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
