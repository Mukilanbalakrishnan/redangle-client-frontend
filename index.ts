import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import clientAuthRoutes from './src/routes/clientAuthRoutes';
import clientNotificationRoutes from './src/routes/clientNotificationRoutes';
import clientQuotationRoutes from './src/routes/clientQuotationRoutes';
import clientInvoiceRoutes from './src/routes/clientInvoiceRoutes';
import clientDeliveryRoutes from './src/routes/clientDeliveryRoutes';
import clientEventRoutes from './src/routes/clientEventRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors({
  origin: [process.env.FRONTEND_URL as string, process.env.CLIENT_FRONTEND_URL as string, 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Client Backend API',
    status: 'success',
    version: '1.0.0'
  });
});

// Client Authentication Routes
app.use('/api/client-auth', clientAuthRoutes);

// Client Notifications Route 
// Binds to the literal /api/notifications path that the client hook currently hits natively
app.use('/api/notifications', clientNotificationRoutes);

// Client Quotation Routes
app.use('/api/quotations', clientQuotationRoutes);

// Client Invoice Routes
app.use('/api/invoices', clientInvoiceRoutes);

// Client Delivery Routes
app.use('/api/deliveries', clientDeliveryRoutes);

// Client Event Routes
app.use('/api/events', clientEventRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.listen(PORT, () => {
  console.log(`Client Backend Server is running on port ${PORT}`);
});
