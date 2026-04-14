/**
 * Generate a unique sale number
 * @param {string} type - 'in_shop' or 'online'
 * @returns {string} Sale number like SALE-20240101-1234 or ONLINE-20240101-1234
 */
export const generateSaleNumber = (type = 'in_shop') => {
  const prefix = type === 'online' ? 'ONLINE' : 'SALE';
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${dateStr}-${random}`;
};

/**
 * Generate an import invoice number
 * @returns {string} Invoice number like IMP-20240101-1234
 */
export const generateInvoiceNumber = () => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `IMP-${dateStr}-${random}`;
};

/**
 * Build pagination parameters from query string
 * @param {object} query - Express req.query
 * @returns {{ limit: number, offset: number, page: number, pageSize: number }}
 */
export const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize) || 20));
  const offset = (page - 1) * pageSize;
  return { limit: pageSize, offset, page, pageSize };
};

/**
 * Build paginated response
 * @param {object} data - Sequelize findAndCountAll result
 * @param {number} page - Current page
 * @param {number} pageSize - Items per page
 * @returns {object} Paginated response object
 */
export const getPaginatedResponse = (data, page, pageSize) => {
  const totalPages = Math.ceil(data.count / pageSize);
  return {
    data: data.rows,
    pagination: {
      total: data.count,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text
 * @returns {string}
 */
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
