import React, { createContext, useContext, useEffect, useState } from 'react';
import { ChatContext } from './Context'; // must provide {socket}
import toast from 'react-hot-toast';
import axios from 'axios';

export const ChatData = createContext();

const Chatprovider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [selecteduser, setSelecteduser] = useState(null);
  const [unseenmsg, setUnseenmsg] = useState({});
  const [message, setMessage] = useState([]);

  const { socket } = useContext(ChatContext);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/message/users');
      if (res.data.success) {
        setUsers(res.data.users);
        setUnseenmsg(res.data.unseenmsg || {});
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const getMessages = async (userid) => {
    try {
      const { data } = await axios.get(`/message/${userid}`);
      if (data.success) {
        setMessage(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const sendmessage = async (messageData) => {
    if (!selecteduser?._id) return toast.error('No user selected');
    try {
      const { data } = await axios.post(
        `/message/send/${selecteduser._id}`,
        messageData
      );
      if (data.success) {
        setMessage((prevmessage) => [...prevmessage, data.message]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (selecteduser && newMessage.senderId === selecteduser._id) {
        // message from current chat: mark seen and show in list
        newMessage.seen = true;
        setMessage((prevmsg) => [...prevmsg, newMessage]);
        axios.put(`/message/mark/${newMessage._id}`);
        // make sure any lingering unseen count is cleared
        setUnseenmsg((prevmsg) => ({ ...prevmsg, [newMessage.senderId]: 0 }));
      } else {
        // increment unseen for other users
        setUnseenmsg((prevmsg) => ({
          ...prevmsg,
          [newMessage.senderId]: prevmsg[newMessage.senderId]
            ? prevmsg[newMessage.senderId] + 1
            : 1,
        }));
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, selecteduser]);

  const chatvalues = {
    message,
    users,
    sendmessage,
    selecteduser,
    getMessages,
    setSelecteduser,
    unseenmsg,
    setUnseenmsg,
    fetchUsers,
  };
  return (
    <ChatData.Provider value={chatvalues}>
      {children}
    </ChatData.Provider>
  );
};

export default Chatprovider;
