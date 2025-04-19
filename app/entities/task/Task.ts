import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// Zod schema for validation
export const TaskValidationSchema = z.object({
    title: z
        .string({ message: 'Title is required' })
        .min(5, 'Title needs to be at least 5 characters long'),
    description: z
        .string({ message: 'Description is required' })
        .min(5, 'Description needs to be at least 5 characters long'),
    status: z.enum(['pending', 'in-progress', 'completed']).default('pending'),
    user: z
        .string({ message: 'User ID is required' })
        .regex(/^[a-fA-F0-9]{24}$/, 'Invalid user ID format')
        .optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export interface ITask extends Document {
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    user: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
    {
        title: {
            type: String,
            required: true,
            validate: {
                validator: (value: string) =>
                    TaskValidationSchema.shape.title.safeParse(value).success,
                message: 'Title must be at least 5 characters long',
            },
        },
        description: {
            type: String,
            required: true,
            validate: {
                validator: (value: string) =>
                    TaskValidationSchema.shape.description.safeParse(value)
                        .success,
                message: 'Description must be at least 5 characters long',
            },
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed'],
            default: 'pending',
            validate: {
                validator: (value: string) =>
                    TaskValidationSchema.shape.status.safeParse(value).success,
                message: 'Invalid status value',
            },
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            validate: {
                validator: (value: mongoose.Types.ObjectId) =>
                    TaskValidationSchema.shape.user.safeParse(value.toString())
                        .success,
                message: 'Invalid user ID format',
            },
        },
    },
    { timestamps: true }
);

export const validateTask = (data: any) => {
    return TaskValidationSchema.safeParse(data);
};

export const Task = mongoose.model<ITask>('Task', TaskSchema);
