import { Response } from 'express';
import { MedicalCategory } from '../models/MedicalCategory';
import { MedicalRecord } from '../models/MedicalRecord';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { UserModel as User } from '../../models/User';

// Category Controllers
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const username = req.user?.username;
    if (!username) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const category = new MedicalCategory({ name, donorId: user._id });
    await category.save();

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const username = req.user?.username;
    if (!username) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const categories = await MedicalCategory.find({ donorId: user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await MedicalCategory.findByIdAndUpdate(id, { name }, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const category = await MedicalCategory.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Delete associated files
    const records = await MedicalRecord.find({ categoryId: id });
    for (const record of records) {
      const filePath = path.join(__dirname, '../../../../uploads/medical', path.basename(record.fileUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await MedicalRecord.findByIdAndDelete(record._id);
    }

    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Record Controllers
export const getRecordsByCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId } = req.params;
    const records = await MedicalRecord.find({ categoryId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const uploadRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId } = req.body;
    let fileName = req.body.fileName;
    
    const username = req.user?.username;
    if (!username) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!fileName) {
      fileName = req.file.originalname;
    }

    const fileUrl = `/uploads/medical/${req.file.filename}`;

    const record = new MedicalRecord({ fileName, fileUrl, categoryId, donorId: user._id });
    await record.save();

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fileName } = req.body;

    const record = await MedicalRecord.findByIdAndUpdate(id, { fileName }, { new: true });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const record = await MedicalRecord.findByIdAndDelete(id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    const filePath = path.join(__dirname, '../../../../uploads/medical', path.basename(record.fileUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
