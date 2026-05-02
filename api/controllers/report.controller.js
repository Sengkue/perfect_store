import { Op, fn, col } from 'sequelize';
import { Sale, SaleDetail, Product, ProductVariant, Customer, User, Supplier, PurchaseOrder, Import, Refund } from '../models/index.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateFilter.sale_date = {
        [Op.between]: [new Date(startDate), end]
      };
    }

    // 1. Revenue (Total Sales)
    const totalSales = await Sale.sum('total_amount', { where: dateFilter }) || 0;

    // 2. Cost of Goods Sold (COGS)
    // We join SaleDetails with Products to get cost_price
    const saleDetails = await SaleDetail.findAll({
      include: [
        { 
          model: Sale, 
          as: 'sale',
          where: dateFilter,
          attributes: []
        },
        {
          model: Product,
          as: 'product',
          attributes: ['cost_price']
        }
      ]
    });

    let totalCogs = 0;
    saleDetails.forEach(detail => {
      const cost = Number(detail.product?.cost_price || 0);
      totalCogs += cost * detail.quantity;
    });

    // 3. Profit
    const profit = totalSales - totalCogs;

    // 4. Expenses (Stock Purchases/Imports)
    // Here we consider 'Imports' as the actual cash outflow for stock
    const totalExpenses = await Import.sum('total_amount', {
      where: {
        receive_date: dateFilter.sale_date || { [Op.ne]: null }
      }
    }) || 0;

    res.json({
      success: true,
      data: {
        revenue: totalSales,
        cogs: totalCogs,
        profit: profit,
        expenses: totalExpenses,
        netProfit: totalSales - totalCogs // Simplified
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesChart = async (req, res, next) => {
  try {
    const { startDate: qStart, endDate: qEnd, days = 7 } = req.query;
    
    let startDate, endDate;

    if (qStart && qEnd) {
      startDate = new Date(qStart);
      endDate = new Date(qEnd);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    const sales = await Sale.findAll({
      attributes: [
        [fn('DATE', col('sale_date')), 'date'],
        [fn('SUM', col('total_amount')), 'total']
      ],
      where: {
        sale_date: { [Op.between]: [startDate, endDate] }
      },
      group: [fn('DATE', col('sale_date'))],
      order: [[fn('DATE', col('sale_date')), 'ASC']]
    });

    res.json({ success: true, data: sales });
  } catch (error) {
    next(error);
  }
};

export const getInventoryStatus = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      include: [
        { 
          model: ProductVariant, 
          as: 'variants',
          attributes: ['id', 'variant_sku', 'color', 'size', 'quantity_in_stock', 'reorder_level']
        }
      ]
    });

    const lowStockItems = [];
    let totalStockValue = 0;
    let totalItems = 0;

    products.forEach(p => {
      const cost = Number(p.cost_price || 0);
      p.variants.forEach(v => {
        totalItems += v.quantity_in_stock;
        totalStockValue += (v.quantity_in_stock * cost);
        
        if (v.quantity_in_stock <= v.reorder_level) {
          lowStockItems.push({
            product_name: p.name,
            variant_sku: v.variant_sku,
            quantity: v.quantity_in_stock,
            reorder_level: v.reorder_level
          });
        }
      });
    });

    res.json({
      success: true,
      data: {
        totalItems,
        totalStockValue,
        lowStockCount: lowStockItems.length,
        lowStockItems
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerReport = async (req, res, next) => {
  try {
    const customers = await Sale.findAll({
      attributes: [
        'customer_id',
        [fn('COUNT', col('sales.id')), 'totalOrders'],
        [fn('SUM', col('total_amount')), 'totalSpent']
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['first_name', 'last_name', 'phone']
        }
      ],
      group: ['customer_id', 'customer.id'],
      order: [[fn('SUM', col('total_amount')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    next(error);
  }
};

export const getStaffReport = async (req, res, next) => {
  try {
    const staff = await Sale.findAll({
      attributes: [
        'user_id',
        [fn('COUNT', col('sales.id')), 'totalOrders'],
        [fn('SUM', col('total_amount')), 'totalSales']
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['username', 'role']
        }
      ],
      group: ['user_id', 'user.id'],
      order: [[fn('SUM', col('total_amount')), 'DESC']]
    });

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

export const getTopProducts = async (req, res, next) => {
  try {
    const products = await SaleDetail.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', col('subtotal')), 'totalRevenue']
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'barcode', 'selling_price']
        }
      ],
      group: ['product_id', 'product.id'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: 20
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { status: 'completed' };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.receive_date = { [Op.between]: [start, end] };
    }

    const expenses = await Import.findAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['name', 'phone'] },
        { model: User, as: 'user', attributes: ['username'] }
      ],
      order: [['receive_date', 'DESC']]
    });

    res.json({
      success: true,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

export const getShiftReport = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const where = {
      sale_date: { [Op.between]: [start, end] },
      sale_status: 'completed'
    };

    const paymentSummary = await Sale.findAll({
      where,
      attributes: [
        'payment_method',
        [fn('COUNT', col('id')), 'transactions'],
        [fn('SUM', col('total_amount')), 'total']
      ],
      group: ['payment_method'],
      raw: true
    });

    const overall = await Sale.findOne({
      where,
      attributes: [
        [fn('COUNT', col('id')), 'totalTransactions'],
        [fn('SUM', col('total_amount')), 'totalRevenue'],
        [fn('AVG', col('total_amount')), 'avgTransaction']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        date: formatDateToISO(targetDate),
        paymentSummary,
        overall
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTaxReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { sale_status: 'completed' };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.sale_date = { [Op.between]: [start, end] };
    }

    const taxData = await Sale.findOne({
      where,
      attributes: [
        [fn('SUM', col('subtotal')), 'netSales'],
        [fn('SUM', col('tax_amount')), 'totalTax'],
        [fn('SUM', col('total_amount')), 'grossSales']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: taxData
    });
  } catch (error) {
    next(error);
  }
};

export const getRefundReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.refund_date = { [Op.between]: [start, end] };
    }

    const refunds = await Refund.findAll({
      where,
      include: [
        { model: Sale, as: 'sale', attributes: ['sale_number', 'total_amount'] },
        { model: User, as: 'user', attributes: ['username'] }
      ],
      order: [['refund_date', 'DESC']]
    });

    const summary = await Refund.findOne({
      where: { ...where, refund_status: 'completed' },
      attributes: [
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('refund_amount')), 'totalAmount']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: { refunds, summary }
    });
  } catch (error) {
    next(error);
  }
};

// Helper for date formatting in backend
const formatDateToISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
