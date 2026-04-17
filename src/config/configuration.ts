export default () => ({
    app: {
        port: process.env.PORT,
        env: process.env.NODE_ENV,
        corsOrigin: process.env.CORS_ORIGIN,
        throttlerTtl: process.env.THROTTLE_TTL,
        throttlerLimit: process.env.THROTTLE_LIMIT,
    },

    database: {
        mongoUri: process.env.MONGO_URI,
    },

    auth: {
        jwtSecret: process.env.JWT_SECRET,
    },
    cache: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        ttl: process.env.REDIS_TTL,
        password: process.env.REDIS_PASSWORD,
    },
});
