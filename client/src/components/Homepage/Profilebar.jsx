import React, { useContext, useEffect, useState } from 'react';
import assets from '../../assets/chat-app-assets/chat-app-assets/assets';
import { ChatData } from '../../context/Chatprovider';
import { ChatContext } from '../../context/Context';

const Profilebar = ({help,setHelp}) => {
  const { selecteduser, message } = useContext(ChatData);
  const { logout, onlineUsers } = useContext(ChatContext);

  const [mesgImage, setMsgImage] = useState([]);

  useEffect(() => {
    //only run when message is available
    if (Array.isArray(message)) {
      const imgs = message.filter((msg) => msg.image).map((msg) => msg.image);
      setMsgImage(imgs);
    } else {
      setMsgImage([]);
    }
  }, [selecteduser, message]);

  if (!selecteduser) return null; //nothing to show if no user selected

  return (
    <div className={`bg-[#8d90af17] h-full px-[20px] rounded-2xl overflow-y-scroll text-amber-50  flex-col items-center ${help===selecteduser._id?'sm:block':'hidden xl:flex'}`}>
      <div className='flex flex-col items-center justify-center gap-4 whitespace-nowrap mx-auto text-sm mt-10'>
         <img src={assets.cross_icon} alt='' className='max-w-7 absolute right-1.5 top-3 z-5 xl:hidden bg-amber-50 ' onClick={() => { setHelp(null); console.log(help)  }} />
         {/* <div className='max-w-7 absolute right-4.5 top-3 z-5 xl:hidden text-4xl text-amber-50' onClick={() => { setHelp(null); console.log(help)  }} >&#x274C</div> */}
        <img
          src={selecteduser?.profilePic || assets.avatar_icon}
          alt=''
          className='w-20 rounded-full'
        />
        <h1 className='font-medium px-10 mx-auto flex items-center gap-2'>
          {Array.isArray(onlineUsers) && onlineUsers.includes(selecteduser._id) && (
            <p className='w-2 h-2 rounded-full bg-green-500'></p>
          )}
          {selecteduser.fullname}
        </h1>
        <p className='mx-auto'>{selecteduser.bio}</p>
      </div>

      <hr className='my-4 bg-[#ffffff50]' />

      <div className='px-5 text-sm'>
        <p>Media</p>
        <div className='mt-5 max-h-[200px] overflow-y-scroll grid grid-cols-1 gap-2 opacity-80'>
          {mesgImage.map((img, i) => (
            <div
              className='cursor-pointer rounded'
              key={i}
              onClick={() => {
                window.open(img);
              }}
            >
              <img src={img} alt='' className='rounded-md h-full' />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => logout()}
        className='absolute bottom-5 w-30 text-white bg-gradient-to-r from-purple-500 to-violet-700 px-[20px] py-[5px] rounded-2xl'
      >
        Logout
      </button>
    </div>
  );
};

export default Profilebar;
