import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Zod schema for validation
export const UserValidationSchema = z.object({
    username: z
        .string({ message: 'Validation error `username` is required' })
        .min(3, { message: 'Validation error `username` is required' }),
    email: z
        .string({ message: 'Validation error `email` is required' })
        .email({ message: 'Email invalid' }),
    password: z
        .string({ message: 'Validation error `password` is required' })
        .min(6, { message: 'Password must be at least 6 characters long' }),
});

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, 'Validation error `username` is required.'],
            unique: true,
            validate: {
                validator: (value: string) =>
                    UserValidationSchema.shape.username.safeParse(value)
                        .success,
                message:
                    'Validation error `username` must be at least 1 character long.',
            },
        },
        email: {
            type: String,
            required: [true, 'Validation error `email` is required.'],
            unique: true,
            validate: {
                validator: (value: string) =>
                    UserValidationSchema.shape.email.safeParse(value).success,
                message: 'Validation error `email` must be a valid email.',
            },
        },
        password: {
            type: String,
            required: [true, 'Validation error `password` is required.'],
            validate: {
                validator: (value: string) =>
                    UserValidationSchema.shape.password.safeParse(value)
                        .success,
                message:
                    'Validation error `password` must be at least 6 characters long.',
            },
        },
    },
    { timestamps: true }
);

// Middleware to hash the password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as mongoose.CallbackError);
    }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Function to validate user data using Zod
export const validateUser = (data: any) => {
    return UserValidationSchema.safeParse(data);
};

export default mongoose.model<IUser>('User', UserSchema);
