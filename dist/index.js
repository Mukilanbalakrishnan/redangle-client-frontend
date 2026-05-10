"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const clientAuthRoutes_1 = __importDefault(require("./src/routes/clientAuthRoutes"));
const clientNotificationRoutes_1 = __importDefault(require("./src/routes/clientNotificationRoutes"));
const clientQuotationRoutes_1 = __importDefault(require("./src/routes/clientQuotationRoutes"));
const clientInvoiceRoutes_1 = __importDefault(require("./src/routes/clientInvoiceRoutes"));
const clientDeliveryRoutes_1 = __importDefault(require("./src/routes/clientDeliveryRoutes"));
const clientEventRoutes_1 = __importDefault(require("./src/routes/clientEventRoutes"));
const clientWorksRoutes_1 = __importDefault(require("./src/routes/clientWorksRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5002;
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Client Backend API',
        status: 'success',
        version: '1.0.0'
    });
});
// Client Authentication Routes
app.use('/api/client-auth', clientAuthRoutes_1.default);
// Client Notifications Route 
// Binds to the literal /api/notifications path that the client hook currently hits natively
app.use('/api/notifications', clientNotificationRoutes_1.default);
// Client Quotation Routes
app.use('/api/quotations', clientQuotationRoutes_1.default);
// Client Invoice Routes
app.use('/api/invoices', clientInvoiceRoutes_1.default);
// Client Delivery Routes
app.use('/api/deliveries', clientDeliveryRoutes_1.default);
// Client Event Routes
app.use('/api/events', clientEventRoutes_1.default);
// Client Works Routes
app.use('/api/works', clientWorksRoutes_1.default);
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
