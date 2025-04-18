import { body } from 'express-validator';

export const registerValidator = [
    body('username')
        .notEmpty()
        .withMessage('Path `username` is required.')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long.'),
    body('email')
        .notEmpty()
        .withMessage('Path `email` is required.')
        .isEmail()
        .withMessage('Invalid email format.'),
    body('password')
        .notEmpty()
        .withMessage('Path `password` is required.')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long.'),
];
