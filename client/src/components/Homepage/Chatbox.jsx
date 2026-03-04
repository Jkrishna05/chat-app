import React, { useEffect, useRef, useState, useContext } from 'react';
import assets from '../../assets/chat-app-assets/chat-app-assets/assets';
import { formatmessageTime } from '../../lib/utils';
import toast from 'react-hot-toast';
import { ChatContext } from '../../context/Context';
import { ChatData } from '../../context/Chatprovider';

const Chatbox = ({help,setHelp}) => {
  // contexts
  const { authUser, onlineUsers } = useContext(ChatContext);
  const {
    setSelecteduser,
    unseenmsg,
    setUnseenmsg,
    selecteduser,
    getMessages,
    message,
    sendmessage,
  } = useContext(ChatData);
  const { typingUsers } = useContext(ChatData);
  const { socket } = useContext(ChatContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState('');
  const typingTimeout = useRef(null);
  const isTypingRef = useRef(false);

  // helper: check if two dates are same day
  const isSameDay = (d1, d2) => {
    const a = new Date(d1);
    const b = new Date(d2);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  const formatMessageDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(d, today)) return 'Today';
    if (isSameDay(d, yesterday)) return 'Yesterday';

    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };
  // send text message
  const handleSendmsg = (e) => {
    e.preventDefault();
    if (input.trim() === '') return;
    sendmessage({ text: input });
    setInput('');
    // notify stop typing after send
    if (socket && selecteduser) socket.emit('stopTyping', { to: selecteduser._id });
    isTypingRef.current = false;
    clearTimeout(typingTimeout.current);
  };

  // send image file
  const handleSendimg = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Select an image file');
      return;
    }
    let reader = new FileReader();
    reader.onloadend = async () => {
      sendmessage({ image: reader.result });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (!socket || !selecteduser) return;

    if (!isTypingRef.current) {
      socket.emit('typing', { to: selecteduser._id });
      isTypingRef.current = true;
    }

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stopTyping', { to: selecteduser._id });
      isTypingRef.current = false;
    }, 1000);
  };

  useEffect(() => {
    if (selecteduser) {
      getMessages(selecteduser._id);
    }
  }, [selecteduser]);

  useEffect(() => {
    if (scrollEnd.current && message) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [message]);

  return selecteduser ? (
    <div className={`relative overflow-scroll h-full backdrop-blur-lg ${help===selecteduser._id?'hidden':''}`}>
      <div className='flex items-center justify-between gap-4 py-3 border-b border-stone-600 mx-4 xl:justify-center'>
        <img
          src={assets.arrow_icon}
          alt=''
          className='max-w-7 xl:absolute xl:left-2'
          onClick={() => {
            setSelecteduser(null);
          }}
        />
          <div className='flex items-center gap-2'>
          <img
            src={selecteduser.profilePic || assets.avatar_icon}
            alt=''
            className='rounded-full w-8'
          />
          <div>
            <p className='text-white flex gap-2 items-center'>
              {selecteduser.fullname}
            </p>
            {typingUsers && typingUsers[selecteduser._id] && (
              <p className='text-sm text-gray-300'>typing...</p>
            )}
            {onlineUsers.includes(selecteduser._id) &&
              <span className='h-2 w-2 bg-green-500 rounded-full'></span>
            }
          </div>
        </div>
        <img  onClick={()=>{setHelp(selecteduser._id); console.log(help)}} src={assets.help_icon} alt='' className='max-w-5 xl:hidden' />
      </div>

      {/* chat area */}
      <div className='overflow-y-scroll h-[calc(100%-80px)] p-3 pb-6 flex flex-col'>
        {message.map((msg, i) => {
          const isSender = msg.senderId === authUser?._id;
          const showDate = i === 0 || !isSameDay(message[i - 1].createdAt, msg.createdAt);
          return (
            <React.Fragment key={i}>
              {showDate && (
                <div className='flex justify-center my-2'>
                  <div className='px-3 py-1 bg-stone-700 text-white text-xs rounded-full'>
                    {formatMessageDate(msg.createdAt)}
                  </div>
                </div>
              )}

              <div
                className={`flex gap-2 item-end justify-end ${msg.senderId !== selecteduser._id && 'flex-row-reverse'
                  }`}
              >
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt=''
                    className='max-w-[230px] border border-gray-500 rounded-lg overflow-hidden mb-8'
                  />
                ) : (
                  <div
                    className={`max-w-[60%] flex flex-col font-light text-white break-all mb-8 p-3 rounded-lg ${msg.senderId === selecteduser._id
                        ? 'bg-[#3a3b5a] text-white rounded-br-none'
                        : 'bg-[#6b6c8d] text-white rounded-bl-none'
                      }`}
                  >
                    <p className='text-[20px]'>{msg.text}</p>
                    <div className='flex items-center gap-2'>
                      <p className='text-[10px] align-baseline'>{formatmessageTime(msg.createdAt)}</p>
                      {isSender && msg.seen && (
                        <p className='text-[10px] text-green-300'>Seen</p>
                      )}
                    </div>
                  </div>
                )}
                <div className='text-center text-sm'>
                  <img
                    src={
                      isSender
                        ? authUser?.profilePic || assets.avatar_icon
                        : selecteduser?.profilePic || assets.avatar_icon
                    }
                    alt=''
                    className='w-7 rounded-full'
                  />
                  <p className='text-grey-500 flex gap-[5px]'>
                    {msg.senderId === authUser?._id ?'me':selecteduser.fullname}
                   
                    
                  </p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* bottom area */}
      <div className='absolute right-0 left-0 bottom-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center rounded-full bg-gray-100/40 px-2'>
          <input
            onChange={handleInputChange}
            value={input}
            onKeyDown={(e) => (e.key === 'Enter' ? handleSendmsg(e) : null)}
            type='text'
            placeholder='send message'
            className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-800'
          />
          <input
            onChange={handleSendimg}
            type='file'
            name='image'
            id='image'
            hidden
            accept='image/png,image/jpeg'
          />
          <label htmlFor='image'>
            <img src={assets.gallery_icon} alt='' className='w-5 mr-2' />
          </label>
        </div>
        <div>
          <img
            onClick={handleSendmsg}
            src={assets.send_button}
            alt=''
            className='w-9 cursor-pointer'
          />
        </div>
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center h-full '>
      <img src={assets.zivo} alt='' className='w-50' />
      <p className='text-white '> Chat anytime , anywhere</p>
    </div>
  );
};

export default Chatbox;
