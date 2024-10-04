import "./App.css";
import { Chat } from "./pages/Chat";
import SignIn from "./pages/SignIn";
import React, { useState, useRef } from "react";
import Cookies from "universal-cookie";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import MobileChat from "./pages/MobileChat";

function App() {
  const cookies = new Cookies();

  const [isAuth, setIsAuth] = useState(cookies.get("auth-cookie"));
  const [roomId, setRoomId] = useState(cookies.get("room-id"));
  const [userId, setUserId] = useState(cookies.get("userId"));

  const [room, setRoom] = useState(false);
  const roomInput = useRef(null);

  const handleSignOut = async () => {
    await signOut(auth);
    cookies.remove("auth-cookie");
    cookies.remove("room-id");
    setIsAuth(false);
    setRoomId(false);
  };

  if (!isAuth) {
    return (
      <div>
        {/* <SignUp setIsAuth={setIsAuth} setRoomId={setRoomId}/> */}
        <SignIn
          setIsAuth={setIsAuth}
          setRoomId={setRoomId}
          setUserId={setUserId}
        />
      </div>
    );
  }
  return (
    <>
      {userId ? (
        <Chat roomId={roomId} setIsAuth={setIsAuth} setUserId={setUserId} userId={userId} />
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
      {/* <div>
        <button onClick={handleSignOut}>Sign Out</button>
      </div> */}
    </>
  );
}

export default App;
