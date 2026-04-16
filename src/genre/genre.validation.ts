import Joi from 'joi';

export const createGenreSchema = Joi.object({
    name: Joi.string().trim().required(),
    isPublic: Joi.boolean().optional(),
});

export const updateGenreSchema = Joi.object({
    name: Joi.string().trim().optional(),
    isPublic: Joi.boolean().optional(),
}).min(1);
