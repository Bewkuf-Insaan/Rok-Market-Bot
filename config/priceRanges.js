function getPriceRange(price) {

  if (price <= 250) return "100-250";
  if (price <= 500) return "250-500";
  if (price <= 1000) return "500-1000";
  if (price <= 2000) return "1000-2000";
  if (price <= 4000) return "2000-4000";
  if (price <= 8000) return "4000-8000";
  if (price <= 15000) return "8000-15000";
  if (price <= 30000) return "15000-30000";

  return "above-30000";
}

module.exports = getPriceRange;
