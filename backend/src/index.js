const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const sosRoutes = require('./routes/sos');
const routesRoutes = require('./routes/routes');
const reportsRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const guardianRoutes = require('./routes/guardian');
const { globalLimiter, otpLimiter, sosLimiter, reportLimiter, routeLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 1. Global rate limiter applied to all routes
app.use(globalLimiter);

// 2. Specific limiters applied to route prefixes
app.use('/api/auth', authLimiter, authRoutes); // Auth failures
app.use('/api/auth/send-otp', otpLimiter);   // OTP specific (applied before authRoutes if needed, or inside)
app.use('/api/sos', sosLimiter, sosRoutes);
app.use('/api/routes', routeLimiter, routesRoutes);
app.use('/api/reports', reportLimiter, reportsRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/check-ins', checkInsRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/guardian', guardianRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
