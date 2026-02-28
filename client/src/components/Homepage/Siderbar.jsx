import React, { useContext, useEffect, useState } from 'react';
import assets from '../../assets/chat-app-assets/chat-app-assets/assets';
import { useNavigate } from 'react-router-dom';
import { ChatContext } from '../../context/Context';
import { ChatData } from '../../context/Chatprovider';

const Siderbar = () => {
  const { logout, onlineUsers } = useContext(ChatContext);
  const {
    setSelecteduser,
    unseenmsg,
    setUnseenmsg,
    fetchUsers,
    selecteduser,
    users,
  } = useContext(ChatData);

  const nav = useNavigate();
  const [search, setSearch] = useState('');

  // ✅ safe filtering
  const filtereduser = search
    ? users.filter((user) =>
      user.fullname?.toLowerCase().includes(search.toLowerCase())
    )
    : users;

  useEffect(() => {
    fetchUsers();
  }, [selecteduser, onlineUsers]);

  return (
    <div
      className={`bg-[#8d90af17] h-full  px-[0px] rounded-2xl overflow-y-scroll text-amber-50 relative ${selecteduser ? 'max-md:hidden' : ''
        }`}
    >
      <div className='topload sticky top-0 bg-[#645CA5] p-4 z-10 '>
        <div className='flex justify-between items-center px-2  '>
          <img src={assets.zivo} alt='logo' className='max-w-50 ' />
          <div className='relative group py-4'>
            <img src={assets.menu_icon} alt='menu' className='h-5 ' />
            <div className='absolute top-full right-0 border px-[10px] py-[10px] rounded bg-[#282142] border-gray-600 text-white hidden group-hover:block z-2'>
              <p
                className='cursor-pointer text-xl'
                onClick={() => {
                  nav('/profile');
                }}
              >
                Edit Profile
              </p>
              <hr className='my-2 border-t border-gray-500' />
              <p className='cursor-pointer text-xl' onClick={logout}>
                Log Out
              </p>
            </div>
          </div>
        </div>
        <div className='bg-[#282142] rounded-full flex items-center gap-2 px-4 py-3 mt-1'>
          <img src={assets.search_icon} alt='search' className='w-3' />
          <input
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            value={search}
            placeholder='search user..'
            type='text'
            className='bg-transparent border-none outline-none placeholder-[#c8c8c8] flex-1'
          />
        </div>
      </div>

      {/* uses display */}
      <div className='flex flex-col mt-2 '>
        {filtereduser.map((user, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 p-4 hover:bg-[#282142]/30 rounded-lg relative cursor-pointer ${selecteduser?._id === user._id ? 'bg-[#282142]' : ''
              } `}
            onClick={() => {
              setSelecteduser(user);
              setUnseenmsg((prev) => {
                let newunseen = { ...prev };
                newunseen[user._id] = 0;
                return newunseen;
              });
            }}
          >
            <img
              src={user?.profilePic || assets.avatar_icon}
              alt=''
              className='aspect-[1/1] rounded-full w-[35px]'
            />
            <div className='flex flex-col gap-1'>
              <p>{user.fullname} </p>
              {Array.isArray(onlineUsers) && onlineUsers.includes(user._id) ? (
                <span className='text-green-400 text-sm'>online</span>
              ) : (
                <span className='text-neutral-400 text-sm'>offline</span>
              )}
            </div>
            {unseenmsg[user._id] > 0 && (
              <p className='absolute top-4 right-4 text-sm h-5 w-5 rounded-full flex justify-center items-center bg-violet-500/50'>
                {unseenmsg[user._id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Siderbar;
