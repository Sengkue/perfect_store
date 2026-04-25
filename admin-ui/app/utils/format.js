export const formatKip = (value) => {
  if (value === null || value === undefined) return '₭ 0'
  const val = typeof value === 'string' ? parseFloat(value) : value
  return '₭ ' + val.toLocaleString('lo-LA', {
    maximumFractionDigits: 0
  })
}
