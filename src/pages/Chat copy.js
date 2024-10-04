import { useEffect, useState } from "react";
import {
  addDoc,
  serverTimestamp,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import Avatar from "@mui/material/Avatar";
import {
  Box,
  Button,
  Container,
  Fab,
  Paper,
  TextField,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { v4 as uuidv4 } from "uuid";

export const Chat = (props) => {
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [inBoxList, setInBoxList] = useState([]);
  const [currentUser, setCurrentUser] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allUserList, setAllUserList] = useState([]);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [manualRoomId, setManualRoomId] = useState("");

  const { setIsAuth } = props;
  const { setUserId } = props;
  const { userId } = props;

  const msgCollection = collection(db, "Messages");
  const usersCollection = collection(db, "Users");

  const formatDate = (timestamp) => {
    if (timestamp instanceof Timestamp) {
      return new Date(timestamp.seconds * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return "";
  };

  // Handle selecting a user from the search or inbox
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm("");
    setRoomId(user.roomId); // Assuming user object has roomId
    setMessageList([]);
  };

  // Handle roomId input manually
  const handleManualRoomIdSubmit = () => {
    if (manualRoomId) {
      setRoomId(manualRoomId);
      setSelectedUser(null); // Optional: clear selected user when using roomId
      setMessageList([]);
    }
  };

  useEffect(() => {
    // Fetch messages by roomId if manualRoomId or selectedUser changes
    if (roomId) {
      const messageQuery = query(
        msgCollection,
        where("roomId", "==", roomId),
        orderBy("createdAt", "asc")
      );

      const unsubscribe = onSnapshot(messageQuery, (snapShot) => {
        let messageListTemp = [];
        snapShot.forEach((doc) => {
          messageListTemp.push({ ...doc.data(), id: doc.id });
        });
        setMessageList(messageListTemp);
      });
      return () => unsubscribe();
    }
  }, [roomId]);

  // Handle message sending
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message && roomId) {
      await addDoc(msgCollection, {
        userId: userId,
        roomId: roomId,
        text: message,
        createdAt: serverTimestamp(),
      });
      setMessage("");
    }
  };

  // Search for users when search term changes
  useEffect(() => {
    if (searchTerm) {
      const searchedUsersTemp = allUserList.filter((user) => {
        const username = user.username?.toLowerCase();
        return username && username.includes(searchTerm.toLowerCase());
      });
      setSearchedUsers(searchedUsersTemp);
    }
  }, [searchTerm]);

  // Fetch inbox messages (for rooms where the user is involved)
  useEffect(() => {
    const inboxQuery = query(
      msgCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(inboxQuery, (snapShot) => {
      let inboxListTemp = [];
      let roomIds = new Set(); 

      snapShot.forEach((doc) => {
        const msgData = doc.data();
        const room = {
          roomId: msgData.roomId,
          lastMessage: msgData.text,
          createdAt: msgData.createdAt,
        };

        if (!roomIds.has(room.roomId)) {
          inboxListTemp.push(room);
          roomIds.add(room.roomId);
        }
      });

      setInBoxList(inboxListTemp);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <>
      <Container
        disableGutters
        maxWidth="lg"
        sx={{
          display: "flex",
          height: "100vh",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(5px)",
          borderRadius: "10px",
        }}>
        
        {/* Left Side - Inbox and Search */}
        <Paper
          elevation={8}
          sx={{
            width: "25%",
            backgroundColor: "#f0f0f0",
            padding: "10px",
            overflowY: "auto",
            zIndex: "2",
          }}>
          {/* Search users */}
          <TextField
            fullWidth
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ marginBottom: "10px", borderRadius: "30px" }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { borderRadius: "30px", height: "45px" },
            }}
            variant="outlined"
          />

          {/* Enter Room ID */}
          <TextField
            fullWidth
            placeholder="Enter Room ID..."
            value={manualRoomId}
            onChange={(e) => setManualRoomId(e.target.value)}
            sx={{ marginBottom: "10px", borderRadius: "30px" }}
            InputProps={{
              sx: { borderRadius: "30px", height: "45px" },
            }}
            variant="outlined"
          />
          <Button
            fullWidth
            variant="contained"
            sx={{ marginBottom: "10px" }}
            onClick={handleManualRoomIdSubmit}
          >
            Join Room
          </Button>

          {/* Inbox - Display list of conversations */}
          {inBoxList.map((room) => (
            <Paper
              key={room.roomId}
              onClick={() => setRoomId(room.roomId)}
              style={{
                padding: "10px",
                cursor: "pointer",
                backgroundColor: roomId === room.roomId ? "#69A9E9" : "#fff",
                color: roomId === room.roomId ? "#fff" : "#000",
                borderRadius: "5px",
                marginBottom: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
              <div>
                <strong>Room ID: {room.roomId}</strong>
                <p style={{ margin: "5px 0", fontSize: "0.9rem" }}>
                  {room.lastMessage}
                </p>
              </div>
              <div>
                <small>{formatDate(room.createdAt)}</small>
              </div>
            </Paper>
          ))}
        </Paper>

        {/* Right Side - Chat Messages */}
        <Paper
          elevation={0}
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            padding: "10px",
          }}>
          {/* Chat messages */}
          <Container sx={{ flexGrow: 1, overflowY: "auto", padding: "10px" }}>
            {messageList.map((msg, index) => (
              <div key={index} style={{ marginBottom: "10px" }}>
                <Paper
                  elevation={2}
                  sx={{
                    padding: "10px",
                    borderRadius: "5px",
                    backgroundColor: "#f0f0f0",
                  }}>
                  <p>{msg.text}</p>
                </Paper>
              </div>
            ))}
          </Container>

          {/* Message input */}
          <Box sx={{ padding: "10px" }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                sx={{ marginBottom: "10px" }}
                InputProps={{
                  sx: { borderRadius: "30px", height: "45px" },
                }}
              />
              <Fab
                type="submit"
                sx={{
                  background: "linear-gradient(-135deg, #69A9E9 25%, #3472F9 100%)",
                  color: "#fff",
                }}>
                <SendIcon />
              </Fab>
            </form>
          </Box>
        </Paper>
      </Container>
    </>
  );
};
