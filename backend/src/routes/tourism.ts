import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getAvailabilityCalendar
} from '../controllers/bookings';
import {
  getAllSeasonalRates,
  getSeasonalRateById,
  createSeasonalRate,
  updateSeasonalRate,
  deleteSeasonalRate
} from '../controllers/seasonal-rates';

const router = express.Router();

// Middleware di autenticazione per tutte le route
router.use(authenticate);

// Route per le prenotazioni
router.get('/bookings', getAllBookings);
router.get('/bookings/:id', getBookingById);
router.post('/bookings', createBooking);
router.put('/bookings/:id', updateBooking);
router.delete('/bookings/:id', deleteBooking);
router.get('/properties/:propertyId/availability', getAvailabilityCalendar);

// Route per le tariffe stagionali
router.get('/seasonal-rates', getAllSeasonalRates);
router.get('/seasonal-rates/:id', getSeasonalRateById);
router.post('/seasonal-rates', createSeasonalRate);
router.put('/seasonal-rates/:id', updateSeasonalRate);
router.delete('/seasonal-rates/:id', deleteSeasonalRate);

export { router as tourismRouter }; 