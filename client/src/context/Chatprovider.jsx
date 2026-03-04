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
  const [typingUsers, setTypingUsers] = useState({});

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
        // emit immediate read event so sender UI updates instantly
        try {
          if (socket) socket.emit('messageRead', { to: newMessage.senderId, messageId: newMessage._id });
        } catch (err) {
          console.warn('socket emit messageRead failed', err);
        }
        // also inform server to persist seen flag
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

    const handleMessageSeen = ({ messageId, seenBy }) => {
      setMessage((prev) => prev.map(m => (m._id?.toString() === messageId?.toString() ? { ...m, seen: true } : m)));
    };

    const handleTyping = ({ from }) => {
      setTypingUsers(prev => ({ ...prev, [from]: true }));
    };

    const handleStopTyping = ({ from }) => {
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[from];
        return next;
      });
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageSeen', handleMessageSeen);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageSeen', handleMessageSeen);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
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
    typingUsers,
  };
  return (
    <ChatData.Provider value={chatvalues}>
      {children}
    </ChatData.Provider>
  );
};

export default Chatprovider;
