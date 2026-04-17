import Joi from 'joi';

export const envValidationSchema = Joi.object({
    PORT: Joi.number().port().default(3000),
    THROTTLE_TTL: Joi.number().required(),
    THROTTLE_LIMIT: Joi.number().required(),
    MONGO_URI: Joi.string().uri().required(),
    JWT_SECRET: Joi.string().min(16).required(),
    CORS_ORIGIN: Joi.string().optional(),
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'staging')
        .default('development'),
});
