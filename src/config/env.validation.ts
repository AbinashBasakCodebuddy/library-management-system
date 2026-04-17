import Joi from 'joi';

export const envValidationSchema = Joi.object({
    PORT: Joi.number().port().default(3000),
    THROTTLE_TTL: Joi.number().required(),
    THROTTLE_LIMIT: Joi.number().required(),
    MONGO_URI: Joi.string().uri().required(),
    JWT_SECRET: Joi.string().min(16).required(),
    CORS_ORIGIN: Joi.string().optional(),
    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.number().port().required(),
    REDIS_PASSWORD: Joi.string().required(),
    REDIS_TTL: Joi.number().required(),
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'staging')
        .default('development'),
});
