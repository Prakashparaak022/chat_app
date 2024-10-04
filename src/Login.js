import { signOut } from 'firebase/auth';
import React, { useRef, useState } from 'react'
import Cookies from 'universal-cookie';
import { auth } from './firebaseConfig';
import SignUp from './pages/SignUp';
import { Chat } from './pages/Chat';

export const Login = () => {

  const cookies = new Cookies();

  const [isAuth, setIsAuth] = useState(cookies.get("auth-cookie"));
  const [roomId, setRoomId] = useState(cookies.get("room-id"));

  const [room, setRoom] = useState(false);
  const roomInput = useRef(null);
  console.log(isAuth);

  const handleSignOut = async () => {
    await signOut(auth);
    cookies.remove("auth-cookie");
    cookies.remove("room-id");
    setIsAuth(false);
    setRoom(null);
  };

  if (!isAuth) {
    return (
      <div>
        <SignUp setIsAuth={setIsAuth} />
      </div>
    );
  }

  return (
    <>
      {room || roomId ? (
        <Chat room={room} roomId={roomId} />
      ) : (
        <div>
          <label> Enter the Room</label>
          <input ref={roomInput}></input>
          <button
            onClick={() => {
              const roomValue = roomInput.current.value;
              setRoom(roomValue);
              cookies.set("room-id", roomValue);
              setRoomId(roomValue);
            }}>
            Submit
          </button>
        </div>
      )}
      <div>
        <button onClick={handleSignOut}>Sign Out</button>
      </div>
    </>
  );
}
