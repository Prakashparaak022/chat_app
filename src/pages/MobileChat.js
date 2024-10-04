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
  Grid2,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import Navbar from "./Navbar";
import Cookies from "universal-cookie";
import { signOut } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const ChatMobile = (props) => {
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomMessageList, setRoomMessageList] = useState([]);
  const [inBoxList, setInBoxList] = useState([]);
  const [currentUser, setCurrentUser] = useState("");
  const [oppositeUser, setOppositeUser] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allUserList, setAllUserList] = useState([]);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [manualRoomId, setManualRoomId] = useState("");
  const [manualRoomIdValue, setManualRoomIdValue] = useState("");

  const { setIsAuth } = props;
  const { setUserId } = props;
  const { userId } = props;

  const cookies = new Cookies();

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

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm("");
    setRoomId(user.roomId);
    setRoomMessageList([]);
    setManualRoomId("");
  };

  const handleManualRoomSelect = (input) => {
    setRoomId("");
    setManualRoomId(input);
    setSearchTerm("");
    setRoomMessageList([]);
    setSelectedUser("");
  };

  //All User
  useEffect(() => {
    const allUserListQuery = onSnapshot(usersCollection, (snapShot) => {
      let allUserListTemp = [];
      snapShot.forEach((doc) => {
        allUserListTemp.push({ id: doc.id, ...doc.data() });
      });
      setAllUserList(allUserListTemp);
    });

    return () => allUserListQuery();
  }, []);
  console.log("userId", userId);

  // InBox List
  useEffect(() => {
    if (!userId) return;

    const senderMsgQuery = query(msgCollection, where("userId", "==", userId));
    const recepientMsgQuery = query(
      msgCollection,
      where("recepientId", "==", userId)
    );

    const senderMessages = [];
    const fetchSenderMsg = onSnapshot(senderMsgQuery, (snapShot) => {
      snapShot.forEach((doc) =>
        senderMessages.push({ id: doc.id, ...doc.data() })
      );
      setInBoxList(senderMessages);
    });

    const recMessages = [];
    const fetchRecepientMsg = onSnapshot(recepientMsgQuery, (snapShot) => {
      snapShot.forEach((doc) => {
        recMessages.push({ id: doc.id, ...doc.data() });
      });
      setInBoxList((prevMessages) => [...prevMessages, ...recMessages]);
    });

    console.log("inBoxList", inBoxList);

    return () => {
      fetchSenderMsg();
      fetchRecepientMsg();
    };
  }, [roomId, selectedUser]);

  // proper messsage
  useEffect(() => {
    console.log("selectedUser or roomId", selectedUser, roomId);

    if (!selectedUser && !manualRoomId) return;
    let activeRoomId = roomId;

    if (!inBoxList) {
      setRoomId(uuidv4());
    }

    if (!roomId && selectedUser) {
      const inBox = inBoxList.find(
        (inBox) =>
          inBox.userId === selectedUser.userId ||
          inBox.recepientId === selectedUser.userId
      );
      activeRoomId = inBox ? inBox.roomId : uuidv4();
      setRoomId(activeRoomId);
    }

    if (!currentUser && userId) {
      const currentUserTemp = allUserList.find(
        (user) => user.userId === userId
      );
      setCurrentUser(currentUserTemp);
    }

    if (roomId) {
      const messageQuery = query(
        msgCollection,
        where("roomId", "==", roomId),
        orderBy("createdAt", "asc")
      );

      const unsubscribe = onSnapshot(messageQuery, (snapShot) => {
        const messageListTemp = [];
        snapShot.forEach((doc) => {
          messageListTemp.push({ ...doc.data(), id: doc.id });
        });
        setRoomMessageList(messageListTemp);
      });

      return () => unsubscribe();
    }
  }, [roomId, selectedUser]);

  //Searched Users
  useEffect(() => {
    const searchedUsersTemp = allUserList.filter((user) => {
      const username = user.username?.toLowerCase();
      return username && username.includes(searchTerm.toLowerCase());
    });
    setSearchedUsers(searchedUsersTemp);
  }, [searchTerm]);

  // Filtered Users
  const inBoxUsersList = [];
  const inBoxUserIdList = [];
  for (let index = 0; index < inBoxList.length; index++) {
    const inBox = inBoxList[index];
    const senderId = inBox.userId;
    const recepientId = inBox.recepientId;
    const loginUserId = userId;

    if (!inBoxUserIdList.includes(senderId) && recepientId == loginUserId) {
      inBoxUserIdList.push(senderId);
    } else if (
      !inBoxUserIdList.includes(recepientId) &&
      senderId == loginUserId
    ) {
      inBoxUserIdList.push(recepientId);
    }
  }

  if (inBoxUserIdList) {
    allUserList.forEach((user) => {
      const userId = user.userId;
      if (inBoxUserIdList.includes(userId)) {
        inBoxUsersList.push(user);
      }
    });
  }

  const handleSignOut = async () => {
    await signOut(auth);
    cookies.remove("auth-cookie");
    cookies.remove("room-id");
    cookies.remove("userId");
    setUserId("");
    setIsAuth(false);
  };

  const handleManualRoomIdSubmit = (input) => {
    console.log("Entered1");
    console.log("input", input);
    setManualRoomId(input);
    setSearchTerm("");
    console.log("manualRoomId", manualRoomId);

    if (input) {
      // Check input instead of manualRoomId
      console.log("Entered2");
      setRoomId(input); // Use the input value directly
      setSelectedUser(null);
      setRoomMessageList([]);
      console.log("roomId", input); // Log the input instead
    }
  };

  const handleSubmit = async (e) => {
    console.log("sendind Message for RoomId", roomId);
    e.preventDefault();

    if (message !== "" && roomId && (selectedUser || manualRoomId)) {
      await addDoc(msgCollection, {
        userId: userId,
        senderId: userId,
        recepientId: selectedUser?.userId || "",
        roomId: roomId,
        username: currentUser.username,
        text: message,
        createdAt: serverTimestamp(),
      });
      setMessage("");
    }
  };

  console.log("CuurentUser ", currentUser);

  return (
    <>
      <Container
        disableGutters
        maxWidth="lg"
        sx={{
          display: "flex",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(5px)",
          borderRadius: "10px",
          height: "100vh", 
        }}>
        {/* User List */}
        <Paper
          elevation={8}
          sx={{
            width: "100%",
            backgroundColor: "#f0f0f0",
            padding: "10px",
            overflowY: "auto",
            zIndex: "2",
          }}>
          {selectedUser || manualRoomId ? (
            <Box>
              {/* Chat Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 20px",
                  backgroundColor: "#f0f0f0",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                }}>
                <Button
                sx={{marginLeft:"-20px"}}
                  onClick={() => (setSelectedUser(null), setManualRoomId(""))}
                  startIcon={<ArrowBackIcon />}>
                  </Button>

                {/* Image , selected User*/}

                {selectedUser && (
                  <img
                    src={selectedUser.profileImg}
                    alt="Chat Logo"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                    }}
                  />
                )}

                {/* Centered Title , Room */}
                {!manualRoomId ? (
                  <h2
                    style={{
                      margin: "0 auto",
                      textAlign: "center",
                    }}>
                    {selectedUser
                      ? `${selectedUser.username}`
                      : "Select a user to chat"}
                  </h2>
                ) : (
                  <h2
                    style={{
                      margin: "0 auto",
                      flexGrow: 1,
                      textAlign: "center",
                    }}>
                    {manualRoomId
                      ? `Chat Room ID: ${manualRoomId}`
                      : "Type a Room ID to chat"}
                  </h2>
                )}
                {/* Sign Out Button */}
                <Tooltip title="Sign Out">
                  <IconButton
                    sx={{ backgroundColor: "#ff4d4d", color: "#fff" }}
                    onClick={handleSignOut}>
                    <ExitToAppIcon
                      alt="profileImg Avatar"
                      sx={{ width: 23, height: 23 }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Chat Box */}
              <Container
                sx={{ flexGrow: 1, overflowY: "auto", padding: "10px" }}>
                {roomMessageList.length > 0 ? (
                  roomMessageList.map((msg, index) => {
                    const user =
                      allUserList.find((user) => user.userId === msg.userId) ||
                      {};

                    return (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          justifyContent:
                            user.userId === currentUser.userId
                              ? "flex-end"
                              : "flex-start",
                          marginBottom: "10px",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            flexDirection:
                              user.userId === currentUser.userId
                                ? "row-reverse"
                                : "row",
                          }}>
                          <Avatar
                            alt={
                              msg.userId === currentUser.userId
                                ? currentUser.username
                                : user.username
                            }
                            src={
                              msg.userId === currentUser.userId
                                ? currentUser.profileImg
                                : user.profileImg
                            }
                          />
                          <Paper
                            elevation={2}
                            sx={{
                              borderRadius: `${20 - msg.text.length * 0.15}px`,
                              padding: "2px 8px",
                              margin: "0px 5px",
                              marginTop: "10px",
                              minWidth: "50px",
                              background:
                                msg.userId === currentUser.userId
                                  ? "linear-gradient(-135deg, #69A9E9 25%, #3472F9 100%)"
                                  : "#fff",
                              color:
                                msg.userId === currentUser.userId
                                  ? "#fff"
                                  : "#000",
                              fontWeight: "500",
                              display: "flex",
                              flexDirection: "column",
                            }}>
                            <span>{msg.text}</span>
                            <span
                              style={{
                                textAlign: "right",
                                fontSize: "10px",
                                color:
                                  msg.userId === currentUser.userId
                                    ? "#C0C0C0"
                                    : "#C0C0C0",
                                marginTop: `-${14 - 2.5 * msg.text.length}px`,
                              }}>
                              {formatDate(msg.createdAt)}
                            </span>
                          </Paper>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div>No messages to display</div>
                )}
              </Container>

              {/* Message Input */}
              <Box
                sx={{
                  position: "relative",
                  width: "80%",
                  padding: "10px 14px",
                  margin: "0 auto",
                }}>
                <form onSubmit={handleSubmit}>
                  <Paper elevation={2} sx={{ borderRadius: "50px" }}>
                    <Grid2 container>
                      <Grid2 size={10}>
                        <TextField
                          fullWidth
                          variant="standard"
                          placeholder="Send message..."
                          InputProps={{
                            disableUnderline: true,
                            sx: {
                              padding: "10px 15px",
                            },
                          }}
                          sx={{
                            padding: "0px 10px",
                          }}
                          onChange={(e) => setMessage(e.currentTarget.value)}
                          value={message}
                        />
                      </Grid2>
                      <Grid2
                        size={2}
                        container
                        alignItems="center"
                        justifyContent="flex-end">
                        <Fab
                          type="submit"
                          sx={{
                            background:
                              "linear-gradient(-135deg, #69A9E9 25%, #3472F9 100%)",
                            marginRight: "10px",
                            color: "#fff",
                            fontSize: "10px",
                            width: 40,
                            height: 40,
                          }}>
                          <SendIcon />
                        </Fab>
                      </Grid2>
                    </Grid2>
                  </Paper>
                </form>
              </Box>
            </Box>
          ) : (
            <Box>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ marginBottom: "10px" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: "40px",
                    height: "40px",
                    fontSize: "15px",
                    textAlign: "center",
                  },
                }}
                variant="outlined"
              />

              {/* Enter Room ID */}
              <TextField
                fullWidth
                placeholder="Enter Room ID..."
                value={manualRoomIdValue}
                onChange={(e) => setManualRoomIdValue(e.target.value)}
                sx={{ marginBottom: "10px", borderRadius: "30px" }}
                InputProps={{
                  sx: {
                    borderRadius: "40px",
                    height: "40px",
                    fontSize: "15px",
                    textAlign: "center",
                  },
                }}
                variant="outlined"
              />
              <Button
                fullWidth
                variant="contained"
                sx={{
                  marginBottom: "18px",
                  height: "33px",
                  textAlign: "center",
                  background:
                    "linear-gradient(-135deg, #69A9E9 25%, #3472F9 100%)",
                }}
                onClick={() => handleManualRoomIdSubmit(manualRoomIdValue)}>
                Join Room
              </Button>

              {(searchTerm ? searchedUsers : inBoxUsersList) ? (
                (searchTerm ? searchedUsers : inBoxUsersList)
                  .filter((user) => user.userId !== currentUser.userId)
                  .map((user) => (
                    <Paper
                      key={user.userId}
                      onClick={() => handleUserSelect(user)}
                      elevation={selectedUser?.userId === user.userId ? 3 : 0}
                      style={{
                        padding: "10px",
                        cursor: "pointer",
                        background:
                          selectedUser?.userId === user.userId
                            ? "linear-gradient(-135deg, #69A9E9 25%, #3472F9 100%)"
                            : "#fff",
                        color:
                          selectedUser?.userId === user.userId
                            ? "#fff"
                            : "#000",
                        borderRadius: "5px",
                        marginBottom: "5px",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}>
                      <Avatar alt={user.username} src={user.profileImg} />
                      <span style={{ fontWeight: "bold" }}>
                        {user.username}
                      </span>
                    </Paper>
                  ))
              ) : (
                <p style={{ textAlign: "center" }}>
                  No users found. Start chatting!
                </p>
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default ChatMobile;
