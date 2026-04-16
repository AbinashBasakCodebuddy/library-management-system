import Joi from 'joi';

export const createBookSchema = Joi.object({
    title: Joi.string().trim().min(2).required(),
    genres: Joi.array()
        .items(Joi.string().trim().length(24).required())
        .min(1)
        .required(),
});

export const updateBookSchema = Joi.object({
    title: Joi.string().trim().min(2).optional(),
    genres: Joi.array()
        .items(Joi.string().trim().length(24).required())
        .min(1)
        .optional(),
}).min(1);
