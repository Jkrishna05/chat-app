import express from 'express';
import { getuserforsidebar, loadmessage, messageseen,sendmessage  } from '../controllers/messageController.js';
import auth from '../MiddleWare/auth.js'

let messageRouter=express.Router();

messageRouter.get('/users',auth,getuserforsidebar);
messageRouter.get('/:id',auth,loadmessage);
messageRouter.put('/mark/:id',auth,messageseen);    
messageRouter.post('/send/:id',auth,sendmessage);

export default messageRouter;