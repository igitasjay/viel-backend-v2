import { rateLimit } from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60000, // 1 minute
  limit: 60, // limit each IP to 60 requests per windowMs
  standardHeaders: 'draft-8', // Return rate limit info in the `RateLimit-*` headers,
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests, please try again later.',
  },
});

export default limiter;
