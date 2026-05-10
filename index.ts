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
import clientWorksRoutes from './src/routes/clientWorksRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
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

// Client Works Routes
app.use('/api/works', clientWorksRoutes);

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
