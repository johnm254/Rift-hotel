const { z } = require('zod');

const roomSchema = z.object({
  name: z.string().min(2, 'Room name required').max(100),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().positive('Price must be positive'),
  capacity: z.coerce.number().int().min(1).max(10),
  amenities: z.array(z.string()).optional(),
  available: z.enum(['true', 'false']).optional(),
});

const mealSchema = z.object({
  name: z.string().min(2, 'Meal name required').max(100),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().positive('Price must be positive'),
  category: z.string().max(50).optional(),
  dietary: z.array(z.string()).optional(),
  available: z.enum(['true', 'false']).optional(),
});

const bookingSchema = z.object({
  roomId: z.string().min(1, 'Room ID required'),
  roomName: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  guests: z.coerce.number().int().min(1).max(10),
  totalPrice: z.coerce.number().positive(),
  specialRequests: z.string().max(1000).optional(),
}).refine(data => data.checkOut > data.checkIn, {
  message: 'Check-out must be after check-in',
  path: ['checkOut'],
});

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name required').max(100),
});

const mpesaSchema = z.object({
  phone: z.string().regex(/^(0?7\d{8}|\+?2547\d{8}|2547\d{8})$/, 'Invalid Kenyan phone number'),
  amount: z.coerce.number().positive().min(1),
  bookingId: z.string().optional(),
});

const reviewSchema = z.object({
  roomId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(12),
  cursor: z.string().optional(),
});

// Validation middleware factory
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = schema.parse(req[source]);
      req.validated = data;
      next();
    } catch (err) {
      return res.status(400).json({
        error: 'Validation failed',
        details: err.errors?.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
  };
}

module.exports = {
  roomSchema,
  mealSchema,
  bookingSchema,
  registerSchema,
  mpesaSchema,
  reviewSchema,
  paginationSchema,
  validate,
};
