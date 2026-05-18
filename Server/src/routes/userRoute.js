import express from 'express';
import {  signupUser, loginUser,checkAuth, updateProfile } from '../controllers/userController.js';
import auth from '../middleware/auth.js';

let userRouter=express.Router();

userRouter.post('/signupUser',signupUser);  
userRouter.post('/loginUser',loginUser);
userRouter.get('/checkAuth',auth,checkAuth);
userRouter.put('/updateProfile',auth,updateProfile);

export default userRouter;