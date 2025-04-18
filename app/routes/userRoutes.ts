import { Router } from 'express';
import * as AuthUser from '../controllers/user/UserController';

const userRouter = Router();

userRouter.post('/register', AuthUser.register);
userRouter.post('/login', AuthUser.login);
userRouter.post('/logout', AuthUser.logout);

export default userRouter;
