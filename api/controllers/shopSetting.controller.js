import { ShopSetting } from '../models/index.js';

// GET /api/shop-settings
export const getSettings = async (req, res, next) => {
  try {
    let settings = await ShopSetting.findOne();

    if (!settings) {
      settings = await ShopSetting.create({
        shop_name: 'My Store',
        phone: '',
        email: '',
        tax_rate: 10.00
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
    const { shop_name, phone, email, logo_url, address, tax_number, tax_rate } = req.body;

    let settings = await ShopSetting.findOne();

    if (!settings) {
      settings = await ShopSetting.create({
        shop_name, phone, email, logo_url, address, tax_number, tax_rate
      });
    } else {
      await settings.update({
        shop_name, phone, email, logo_url, address, tax_number, tax_rate
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
