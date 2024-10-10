import { useEffect, useState, useMemo } from "react";
import {
  addDoc,
  serverTimestamp,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import Avatar from "@mui/material/Avatar";
import {
  Box,
  Button,
  Container,
  Divider,
  Fab,
  Grid2 as Grid,
  TextField,
  Typography,
  useMediaQuery,
  Paper
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import Cookies from "universal-cookie";
import { signOut } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { LottieAnimation } from "./LottieAnimation";
import searchEmojiAnimation from "../Assets/own_lottie_Json/searching_emoji.json";
import relaxedEmojiAnimation from "../Assets/own_lottie_Json/relaxed_emoji.json";
import searchAnimation from "../Assets/own_lottie_Json/glass_search_left.json"
import Element from "./Element";
import ChatIcon from "@mui/icons-material/Chat";

import chatLottieAnimation from "../Assets/Lotties/chat_lottie.json";
import { useAuth } from "../AuthProvider";
import { useNavigate } from "react-router-dom";
import { validateRoomId, formatDate } from "../Utils/utils";

export const Chat = () => {
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomMessageList, setRoomMessageList] = useState([]);
  const [inBoxList, setInBoxList] = useState([]);
  const [currentUser, setCurrentUser] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allUserList, setAllUserList] = useState([]);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [manualRoomId, setManualRoomId] = useState("");
  const [manualRoomIdValue, setManualRoomIdValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [error, setError] = useState(false);
  const [lastMessageList, setLastMessageList] = useState([]);

  const cookies = new Cookies();
  const navigate = useNavigate("/");

  const { setIsAuth, setUserId } = useAuth();

  // const { setIsAuth } = props;
  // const { setUserId } = props;

  const userId = cookies.get("userId");
  const msgCollection = collection(db, "Messages");
  const usersCollection = collection(db, "Users");
  console.log("userId", userId);

  const isSmallScreen = useMediaQuery("(max-width:550px)");

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm("");
    setRoomId(user.roomId);
    setRoomMessageList([]);
    setManualRoomId("");
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

  // InBox List
  useEffect(() => {
    if (!userId) return;

    const senderMsgQuery = query(
      msgCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "asc")
    );
    const recepientMsgQuery = query(
      msgCollection,
      where("recepientId", "==", userId),
      orderBy("createdAt", "asc")
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

    return () => {
      fetchSenderMsg();
      fetchRecepientMsg();
    };
  }, [roomId, selectedUser]);

  // proper messsage
  useEffect(() => {

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
  if (inBoxList) {
    inBoxList.forEach((inBox) => {
      const senderId = inBox.userId;
      const recepientId = inBox.recepientId;
      const loginUserId = userId;

      if (!inBoxUserIdList.includes(senderId) && recepientId === loginUserId) {
        inBoxUserIdList.push(senderId);
      } else if (
        !inBoxUserIdList.includes(recepientId) &&
        senderId === loginUserId
      ) {
        inBoxUserIdList.push(recepientId);
      }
    });
  }

  if (inBoxUserIdList) {
    allUserList.forEach((user) => {
      const userId = user.userId;
      if (inBoxUserIdList.includes(userId)) {
        inBoxUsersList.push(user);
      }
    });
  }

  const roomIdList = useMemo(() => {
    const roomIds = [];
    inBoxList.forEach((inBox) => {
      if (inBox.userId === userId || inBox.recepientId === userId) {
        if (!roomIds.includes(inBox.roomId)) {
          roomIds.push(inBox.roomId);
        }
      }
    });
    return roomIds;
  }, [inBoxList, userId]);

  useEffect(() => {
    if (!roomIdList || roomIdList.length === 0) return;

    const unsubscribeList = [];
    roomIdList.forEach((roomId) => {

      const messageQuery = query(
        msgCollection,
        where("roomId", "==", roomId),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(messageQuery, (snapShot) => {
        const lastMessageListTemp = [];
        snapShot.forEach((doc) => {
          lastMessageListTemp.push({ ...doc.data(), id: doc.id });
        });

        if (lastMessageListTemp.length > 0) {
          setLastMessageList((prevState) => ({
            ...prevState,
            [roomId]: lastMessageListTemp[0],
          }));
        }
      });

      unsubscribeList.push(unsubscribe);
    });

    return () => {
      unsubscribeList.forEach((unsubscribe) => unsubscribe());
    };
  }, [roomIdList]); // depend on roomIdList


  const handleManualRoomIdSubmit = (input) => {
    const roomIdErrorMessage = validateRoomId(manualRoomIdValue);
    setErrorMessage(roomIdErrorMessage);

    if (roomIdErrorMessage.length === 0) {
      setError(false);
      setManualRoomId(input);
      setSearchTerm("");
      setRoomId(input);
      setSelectedUser(null);
      setRoomMessageList([]);
    } else {
      setError(true);
    }
  };

  const handleSubmit = async (e) => {
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

  const handleSignOut = async () => {
    await signOut(auth);
    cookies.remove("auth-cookie");
    cookies.remove("room-id");
    cookies.remove("userId");
    setUserId("");
    setIsAuth(false);
    navigate("/")
  };

  return (
    <>
      <Container
        disableGutters
        maxWidth="100%"
        sx={{
          display: "flex",
          height: { xs: "100vh", sm: "100vh" },
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(5px)",
        }}>
        <Grid
          container
          spacing={0}
          sx={{
            flexGrow: 1,
            height: "100%",
            justifyContent: "center",
            alignContent: "center",
          }}>
          <Paper
            className="background"
            elevation={8}
            sx={{ display: "flex", width: "100%", height: "100%", p: 0 }}>
            {/* <img className="background-photo" src={BackgroundPhoto} /> */}
            {/* Left Side */}
            <Grid
              size={{ xs: 12, sm: 3 }}
              sx={{
                display:
                  isSmallScreen && (selectedUser || manualRoomId)
                    ? "none"
                    : "block",
                zIndex: "1",
              }}>
              <Paper
                elevation={8}
                sx={{
                  background:
                    "linear-gradient(to right bottom, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.4))",
                  backdropFilter: "blur(5px)",
                  height: "100%",
                }}>
                <div style={{ padding: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                    <h2 style={{ padding: "0px", margin: "0px" }}>Chats</h2>
                    <ChatIcon style={{ fontSize: "20px", color: "#888" }} />
                  </div>
                  <TextField
                    fullWidth
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                      marginBottom: "10px",
                      borderRadius: "30px",
                      marginTop: "20px",
                      background: "#ffffff76",
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ color: "blue" }}>
                          <SearchIcon />
                        </InputAdornment>
                      ),

                      sx: { borderRadius: "30px", height: "38px" },
                    }}
                    variant="outlined"
                  />
                  {/* Enter Room ID */}
                  <TextField
                    fullWidth
                    placeholder="Enter Room ID..."
                    value={manualRoomIdValue}
                    error={error}
                    helperText={errorMessage}
                    color={error ? "error" : "primary"}
                    onChange={(e) => setManualRoomIdValue(e.target.value)}
                    sx={{ marginBottom: "10px", borderRadius: "30px" }}
                    InputProps={{
                      sx: {
                        borderRadius: "30px",
                        height: "38px",
                        fontSize: "15px",
                        textAlign: "center",
                        background: "#ffffff76",
                      },
                    }}
                    variant="outlined"
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      marginBottom: "10px",
                      background:
                        "linear-gradient(-135deg, #69A9E9 25%, #3472F9 100%)",
                    }}
                    onClick={() => handleManualRoomIdSubmit(manualRoomIdValue)}>
                    Join Room
                  </Button>

                  <Divider>
                    <Typography
                      sx={{
                        color: "text.secondary",
                        marginBottom: "10px",
                        fontSize: "14px",
                      }}>
                      All Chats
                    </Typography>
                  </Divider>
                  {/* Select Users */}
                  {selectedUser && (
                    <Paper
                      key={selectedUser.userId}
                      onClick={() => handleUserSelect(selectedUser)}
                      elevation={3}
                      style={{
                        padding: "10px",
                        cursor: "pointer",
                        background:
                          "linear-gradient(-135deg, #69A9E9 25%, #3472F9 100%)",
                        color: "#fff",
                        borderRadius: "5px",
                        marginBottom: "5px",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}>
                      <Avatar
                        alt={selectedUser.username}
                        src={selectedUser.profileImg}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          width: "100%",
                        }}>
                        <span style={{ fontWeight: "bold" }}>
                          {selectedUser.username}
                        </span>
                        {Object.values(lastMessageList)
                          .filter(
                            (message) =>
                              (message?.userId === selectedUser.userId ||
                                message?.recepientId === selectedUser.userId) &&
                              message.recepientId !== "" // for filtering the roomId messages
                          )
                          .map((message, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                                marginTop: "5px",
                              }}>
                              <span
                                style={{
                                  fontSize: "13px",
                                  flex: 1,
                                  textAlign: "left",
                                  color: "#fff",
                                  overflow: "hidden",
                                  width: "150px",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}>
                                {message?.text || "No message"}
                              </span>

                              <span
                                style={{
                                  fontSize: "10px",
                                  textAlign: "right",
                                  marginLeft: "10px",
                                  color: "#fff",
                                }}>
                                {formatDate(message.createdAt)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </Paper>
                  )}

                  {(searchTerm ? searchedUsers : inBoxUsersList)
                    // .filter((user) => user.userId !== currentUser?.userId)
                    .filter((user) => user.userId !== selectedUser?.userId)
                    .map((user) => (
                      <Paper
                        key={user.userId}
                        onClick={() => handleUserSelect(user)}
                        elevation={3}
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
                          borderRadius: "10px",
                          marginBottom: "7px",
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                          overflow: "hidden",
                        }}>
                        <Avatar alt={user.username} src={user.profileImg} />

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            width: "100%",
                          }}>
                          <span style={{ fontWeight: "bold" }}>
                            {user.username}
                          </span>

                          {Object.values(lastMessageList)
                            .filter(
                              (message) =>
                                (message?.userId === user.userId ||
                                  message?.recepientId === user.userId) &&
                                message.recepientId !== ""
                            )
                            .map((message, index) => (
                              <div
                                key={index}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  width: "100%",
                                  marginTop: "5px",
                                }}>
                                <span
                                  style={{
                                    fontSize: "13px",
                                    flex: 1,
                                    textAlign: "left",
                                    color:
                                      selectedUser?.userId === user.userId
                                        ? "#fff"
                                        : "#000",
                                    overflow: "hidden",
                                    width: "150px",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}>
                                  {message?.text || "No message"}
                                </span>

                                <span
                                  style={{
                                    fontSize: "10px",
                                    textAlign: "right",
                                    marginLeft: "10px",
                                    color:
                                      selectedUser?.userId === user.userId
                                        ? "#fff"
                                        : "#000",
                                  }}>
                                  {formatDate(message.createdAt)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </Paper>
                    ))}
                </div>
              </Paper>
            </Grid>
            {/* Right Side */}
            <Grid
              size={{ xs: 12, sm: 9 }}
              sx={{
                display:
                  (isSmallScreen && (selectedUser || manualRoomId)) ||
                  !isSmallScreen
                    ? "block"
                    : "none",
              }}>
              <Paper
                elevation={0}
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
                className="messageButton">
                {/* Chat Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                    background:
                      "linear-gradient(-135deg, #3d84fa 25%, #79b7f0 100%)",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                    color: "#fff",
                  }}>
                  <Button
                    sx={{ marginLeft: "-20px" }}
                    onClick={() => (setSelectedUser(null), setManualRoomId(""))}
                    startIcon={<ArrowBackIcon />}></Button>
                  {/* Image , selected User*/}
                  {selectedUser && (
                    <Avatar
                      alt={selectedUser.username}
                      src={selectedUser.profileImg}
                    />
                  )}

                  {/* Centered Title, Room */}
                  <h2 className="chatHeader">
                    {manualRoomId
                      ? `Room ID: ${manualRoomId}`
                      : selectedUser
                      ? `${selectedUser.username}`
                      : "Select a user to chat"}
                  </h2>

                  {/* Sign Out Button */}
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#ff4d4d",
                      color: "#fff",
                    }}
                    onClick={handleSignOut}>
                    {isSmallScreen ? (
                      <ExitToAppIcon sx={{ width: 23, height: 23 }} />
                    ) : null}
                    {!isSmallScreen && "Sign Out"}
                  </Button>
                </Box>

                {/* Chat Box */}
                <Element />
                {!searchTerm ? (
                  selectedUser || manualRoomId ? (
                    <Container
                      sx={{ flexGrow: 1, overflowY: "auto", padding: "10px" }}
                      className="scrollBar">
                      {roomMessageList.length > 0 ? (
                        roomMessageList.map((msg, index) => {
                          const user =
                            allUserList.find(
                              (user) => user.userId === msg.userId
                            ) || {};

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
                                  sx={{ boxShadow: "0px 2px 4px #00000057" }}
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
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                  }}>
                                  <Paper
                                    elevation={2}
                                    sx={{
                                      display: "flex",
                                      flexDirection: "column",
                                      borderRadius: `${
                                        20 - msg.text.length * 0.15
                                      }px`,
                                      margin: "0px 5px",
                                      marginTop: "10px",
                                      minWidth: "40px",
                                      background:
                                        msg.userId === currentUser.userId
                                          ? "linear-gradient(-135deg, #004dff 25%, #4968ff 100%)"
                                          : "#fff",
                                      color:
                                        msg.userId === currentUser.userId
                                          ? "#fff"
                                          : "#000",
                                    }}>
                                    <span
                                      style={{
                                        padding: "5px 15px",
                                        textAlign: "justify",
                                        fontWeight: "500",
                                      }}>
                                      {msg.text}
                                    </span>
                                  </Paper>
                                  <span
                                    style={{
                                      marginRight:
                                        msg.userId === currentUser.userId
                                          ? "10px"
                                          : "0px",
                                      marginLeft:
                                        msg.userId === currentUser.userId
                                          ? "0px"
                                          : "12px",
                                      textAlign:
                                        msg.userId === currentUser.userId
                                          ? "right"
                                          : "left",
                                      fontSize: "9px",
                                    }}>
                                    {formatDate(msg.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            flexGrow: 1,
                          }}>
                          <div
                            style={{
                              width: "300px",
                              height: "350px",
                              background:
                                "linear-gradient(to right bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))",
                              borderRadius: "20px",
                              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.5)",
                            }}>
                            {/* No results found */}
                            <LottieAnimation
                              animationList={[searchEmojiAnimation]}
                              animationText={
                                " No messages here yet, send a message to start the chat!"
                              }
                            />
                          </div>
                        </div>
                      )}
                    </Container>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexGrow: 1,
                      }}>
                      <div
                        style={{
                          width: "300px",
                          height: "350px",
                          background:
                            "linear-gradient(to right bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))",
                          borderRadius: "20px",
                          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.5)",
                        }}>
                        {/* Select User or Enter ROom Id */}
                        <LottieAnimation
                          animationList={[
                            chatLottieAnimation,
                            relaxedEmojiAnimation,
                          ]}
                          animationText={
                            " No messages here yet, send a message to start the chat!"
                          }
                        />
                      </div>
                    </div>
                  )
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexGrow: 1,
                    }}>
                    <div
                      style={{
                        width: "300px",
                        height: "350px",
                        background:
                          "linear-gradient(to right bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))",
                        borderRadius: "20px",
                        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.5)",
                      }}>
                      {/* Search Animation */}
                      <LottieAnimation
                        animationList={[searchAnimation]}
                        animationText={
                          "Just a moment ! Searching for users...."
                        }
                      />
                    </div>
                  </div>
                )}
                {/* Message Input */}
                {(manualRoomId || selectedUser) && (
                  <Box
                    sx={{
                      position: "relative",
                      width: "90%",
                      padding: "10px 14px",
                      margin: "0 auto",
                      marginTop: "auto",
                      marginBottom: { xs: "70px", sm: "10px" },
                    }}>
                    <form onSubmit={handleSubmit}>
                      <Paper elevation={2} sx={{ borderRadius: "50px" }}>
                        <Grid container>
                          <Grid size={10}>
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
                              onChange={(e) =>
                                setMessage(e.currentTarget.value)
                              }
                              value={message}
                            />
                          </Grid>
                          <Grid
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
                          </Grid>
                        </Grid>
                      </Paper>
                    </form>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Paper>
        </Grid>
      </Container>
    </>
  );
};
