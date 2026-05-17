import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Route imports — uncomment as each feature is implemented
import authRoutes from './routes/auth.routes';
// import userRoutes from './routes/user.routes';
// import providerRoutes from './routes/provider.routes';
// import serviceRoutes from './routes/service.routes';
// import bookingRoutes from './routes/booking.routes';
// import reviewRoutes from './routes/review.routes';
// import wishlistRoutes from './routes/wishlist.routes';
// import messageRoutes from './routes/message.routes';
// import paymentRoutes from './routes/payment.routes';
// import hotelRoutes from './routes/hotel.routes';
// import tourRoutes from './routes/tour.routes';
// import chatbotRoutes from './routes/chatbot.routes';
import { errorHandler } from './middleware/error.middleware';
import { flattenQuery } from './middleware/query.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(flattenQuery);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes — uncomment as each feature is implemented
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/providers', providerRoutes);
// app.use('/api/services', serviceRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/reviews', reviewRoutes);
// app.use('/api/wishlist', wishlistRoutes);
// app.use('/api/messages', messageRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/hotels', hotelRoutes);
// app.use('/api/tours', tourRoutes);
// app.use('/api/chatbot', chatbotRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

export default app;
