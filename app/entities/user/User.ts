import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

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
        },
        email: {
            type: String,
            required: [true, 'Validation error `email` is required.'],
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Validation error `password` is required.'],
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
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
