const HolidayPackageService = require('../src/services/holidayPackageService').default;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }
  try {
    const searchParams = req.body;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const holidayService = HolidayPackageService.getInstance();
    const result = await holidayService.searchHolidayPackages(searchParams);
    let hotels = result.data || [];
    if (limit && !isNaN(limit)) {
      hotels = hotels.slice(0, limit);
    }
    res.status(200).json({ success: true, hotels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}