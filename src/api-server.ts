const express = require('express');
const HolidayPackageService = require('./services/holidayPackageService').default;

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// POST /api/hotels
// Body: searchParams (HolidayPackageSearchRequest minus SessionId), optional query param: limit
app.post('/api/hotels', async (req, res) => {
  try {
    const searchParams = req.body;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const holidayService = HolidayPackageService.getInstance();
    const result = await holidayService.searchHolidayPackages(searchParams);
    let hotels = result.data || [];
    if (limit && !isNaN(limit)) {
      hotels = hotels.slice(0, limit);
    }
    res.json({ success: true, hotels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});