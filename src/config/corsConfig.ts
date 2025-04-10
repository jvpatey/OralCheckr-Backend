// List of allowed origins that can access the API
export const allowedOrigins = [
  "http://localhost:5173", // Local development frontend
  "http://localhost:3000", // Alternative local development frontend
  "https://jvpatey.github.io", // Production frontend
  "https://oralcheckr-backend.onrender.com", // Production backend
];

// CORS configuration options
export const corsOptions = {
  // Custom origin validation function
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    const validOrigins = allowedOrigins.filter((o) => o);
    // Allow request if origin is undefined
    if (!origin || validOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`Origin ${origin} not allowed by CORS`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
  allowedHeaders: [
    // Allowed request headers
    "Content-Type",
    "Authorization",
    "Cookie",
    "Origin",
    "Accept",
  ],
  exposedHeaders: ["Set-Cookie"], // Headers exposed to the client
  preflightContinue: false, // Disable preflight request handling
  optionsSuccessStatus: 204, // HTTP status code for successful OPTIONS requests
};
