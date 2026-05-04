
export const MOCK_KPI_DATA = {
  todayRevenue: 1450.50,
  openRepairs: 12,
  completedJobs: 5,
  newSales: 8,
};

export const RECENT_ACTIVITY = [
  { id: 1, type: "repair", message: "iPhone 13 Pro Screen Replacement completed", date: "Just now", amount: 250 },
  { id: 2, type: "sale", message: "MacBook Air M2 sold", date: "2 hrs ago", amount: 1199 },
  { id: 3, type: "repair", message: "Samsung S22 Battery logged (Pending)", date: "3 hrs ago", amount: 85 },
  { id: 4, type: "sale", message: "USB-C Charger & Cable sold", date: "5 hrs ago", amount: 45 },
];

export const SALES_DATA = [
  { id: "INV-1001", date: "2026-05-03", item: "AirPods Pro", category: "Accessories", qty: 1, amount: 249.00, paymentMethod: "Credit Card" },
  { id: "INV-1002", date: "2026-05-03", item: "iPhone 13 Screen Protector", category: "Accessories", qty: 2, amount: 30.00, paymentMethod: "Cash" },
  { id: "INV-1003", date: "2026-05-02", item: "ThinkPad T14", category: "Laptops", qty: 1, amount: 950.00, paymentMethod: "Transfer" },
  { id: "INV-1004", date: "2026-05-02", item: "Samsung 25W Charger", category: "Accessories", qty: 1, amount: 25.00, paymentMethod: "Card" },
  { id: "INV-1005", date: "2026-05-01", item: "iPad Air", category: "Tablets", qty: 1, amount: 599.00, paymentMethod: "Credit Card" },
];

export const REPAIR_DATA = [
  { id: "REP-401", customer: "Alice Smith", phone: "555-0101", device: "iPhone 14", issue: "Cracked Screen", cost: 180, status: "In Progress" },
  { id: "REP-402", customer: "Bob Johnson", phone: "555-0102", device: "MacBook Pro M1", issue: "Water Damage Diagnosis", cost: 85, status: "Pending" },
  { id: "REP-403", customer: "Claire Davis", phone: "555-0103", device: "Samsung S23 Ultra", issue: "Battery Replacement", cost: 110, status: "Completed" },
  { id: "REP-404", customer: "David Miller", phone: "555-0104", device: "iPad Gen 9", issue: "Charging Port", cost: 95, status: "Collected" },
  { id: "REP-405", customer: "Eve Wilson", phone: "555-0105", device: "Dell XPS 15", issue: "Keyboard Replacement", cost: 130, status: "In Progress" },
];

export const REVENUE_CHART_DATA = [
  { name: "Mon", revenue: 850 },
  { name: "Tue", revenue: 1100 },
  { name: "Wed", revenue: 950 },
  { name: "Thu", revenue: 1400 },
  { name: "Fri", revenue: 1800 },
  { name: "Sat", revenue: 2100 },
  { name: "Sun", revenue: 1450 },
];

export const TOTAL_SALES_DATA = [
  { month: "Jan", sales: 2500, prevSales: 2300, date: "Jan 2025" },
  { month: "Feb", sales: 3000, prevSales: 2800, date: "Feb 2025" },
  { month: "Mar", sales: 2200, prevSales: 2600, date: "Mar 2025" },
  { month: "Apr", sales: 3800, prevSales: 3500, date: "Apr 2025" },
  { month: "May", sales: 3484, prevSales: 3253, date: "May 2025" },
  { month: "Jun", sales: 4200, prevSales: 4000, date: "Jun 2025" },
  { month: "July", sales: 3900, prevSales: 3700, date: "Jul 2025" },
  { month: "Aug", sales: 4800, prevSales: 4500, date: "Aug 2025" },
  { month: "Sep", sales: 4100, prevSales: 4200, date: "Sep 2025" },
  { month: "Oct", sales: 5500, prevSales: 5000, date: "Oct 2025" },
  { month: "Nov", sales: 5100, prevSales: 4800, date: "Nov 2025" },
  { month: "Dec", sales: 6200, prevSales: 5800, date: "Dec 2025" },
];

export const TOP_PRODUCTS_DATA = [
  { name: "SmartWatch Pro", value: 65, fill: "#3b82f6" },
  { name: "Others", value: 35, fill: "url(#stripe-pattern)" }
];

export const PERFORMANCE_DATA = [
  { name: "May", sales: 12000, revenue: 8000, date: "May 2026" },
  { name: "Jun", sales: 18000, revenue: 10000, date: "June 2026" },
  { name: "Jul", sales: 14000, revenue: 9000, date: "July 2026" },
  { name: "Aug", sales: 34000, revenue: 15000, date: "August 2026" },
  { name: "Sep", sales: 12000, revenue: 7000, date: "September 2026" },
  { name: "Oct", sales: 24000, revenue: 10000, date: "October 2026" },
  { name: "Nov", sales: 36000, revenue: 19000, date: "November 2026" },
  { name: "Dec", sales: 20000, revenue: 11000, date: "December 2026" },
];
