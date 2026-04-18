import { UserProfile } from '../models/index.js';

export const getProfile = async (req, res, next) => {
  try {
    const profile = await UserProfile.findOne({ where: { user_id: req.params.userId } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    let profile = await UserProfile.findOne({ where: { user_id: userId } });
    
    if (!profile) {
      profile = await UserProfile.create({
        user_id: userId,
        ...req.body
      });
      return res.status(201).json({ success: true, message: 'Profile created', data: profile });
    }

    await profile.update(req.body);
    res.json({ success: true, message: 'Profile updated', data: profile });
  } catch (error) {
    next(error);
  }
};
