import { ShopSetting } from '../models/index.js';

// GET /api/shop-settings
export const getSettings = async (req, res, next) => {
  try {
    let settings = await ShopSetting.findOne();

    if (!settings) {
      settings = await ShopSetting.create({
        shop_name: 'My Store',
        phone: '',
        email: ''
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/shop-settings
export const updateSettings = async (req, res, next) => {
  try {
    const { shop_name, phone, email, logo_url, address, tax_number } = req.body;

    let settings = await ShopSetting.findOne();

    if (!settings) {
      settings = await ShopSetting.create({
        shop_name, phone, email, logo_url, address, tax_number
      });
    } else {
      await settings.update({
        shop_name, phone, email, logo_url, address, tax_number
      });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};
