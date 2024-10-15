import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  Paper,
  IconButton,
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
import searchAnimation from "../Assets/own_lottie_Json/glass_search_left.json";
import Element from "./Element";
import ChatIcon from "@mui/icons-material/Chat";

import chatLottieAnimation from "../Assets/Lotties/chat_lottie.json";
import { useAuth } from "../AuthProvider";
import { useNavigate } from "react-router-dom";
import { validateRoomId, formatDate } from "../Utils/utils";

export const Chat = () => {
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState("");
  const [inBoxList, setInBoxList] = useState([]);
  const [roomMessageList, setRoomMessageList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allUserList, setAllUserList] = useState([]);
  const [allRoomList, setAllRoomList] = useState([]);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [manualRoomId, setManualRoomId] = useState("");
  const [manualRoomIdValue, setManualRoomIdValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [error, setError] = useState(false);

  const cookies = new Cookies();
  const navigate = useNavigate("/");

  const { setIsAuth, setUserId } = useAuth();
  const containerRef = useRef(null);

  // const { setIsAuth } = props;
  // const { setUserId } = props;
  const msgCollection = collection(db, "Messages");
  const usersCollection = collection(db, "Users");
  const roomsCollection = collection(db, "Rooms");
  const userId = useMemo(() => cookies.get("userId"), []);

  const isSmallScreen = useMediaQuery("(max-width:550px)");

  //All Users
  const fetchAllUsers = async () => {
    try {
      const unsubscribe = onSnapshot(usersCollection, (snapShot) => {
        const allUserData = [];
        snapShot.forEach((doc) => {
          allUserData.push({
            ...doc.data(),
            docId: doc.id,
          });
        });
        setAllUserList(allUserData);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching users: ", error);
    }
  };

  //All Rooms
  const fetchAllRooms = async () => {
    try {
      const unsubscribe = onSnapshot(roomsCollection, (snapShot) => {
        const roomData = [];
        snapShot.forEach((doc) => {
          roomData.push({ ...doc.data(), docId: doc.id });
        });
        setAllRoomList(roomData);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching rooms: ", error);
    }
  };

  useEffect(() => {
    fetchAllUsers();
    fetchAllRooms();
  }, []);

  const currentUser = useMemo(() => {
    if (allUserList && allUserList.length > 0)
      return allUserList.find((user) => user.id === userId);
  }, [allUserList]);

  const roomIdList = useMemo(() => {
    const roomIds = [];
    if (allRoomList && allRoomList.length > 0)
      allRoomList.forEach((room) => {
        if (room.userId === userId || room.contactUserId === userId) {
          if (!roomIds.includes(room.id)) {
            roomIds.push(room.id);
          }
        }
      });
    return roomIds;
  }, [allRoomList, userId]);

  //InBoxList
  const fetchInboxMessage = async () => {
    if (roomIdList && roomIdList.length > 0) {
      try {
        const roomQuery = query(
          collection(db, "Messages"),
          where("roomId", "in", roomIdList),
          orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(roomQuery, (snapShot) => {
          const inBoxDataTemp = [];
          snapShot.forEach((doc) => {
            inBoxDataTemp.push({ ...doc.data(), docId: doc.id });
          });
          setInBoxList(inBoxDataTemp);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching InboxMessages: ", error);
      }
    }
  };

  useEffect(() => {
    fetchInboxMessage();
  }, [roomIdList, roomId]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    const filteredInbox = inBoxList.filter((inBox) => inBox.roomId === roomId);
    setRoomMessageList(filteredInbox);
  }, [inBoxList]);

  const inBoxUsersList = useMemo(() => {
    let inBoxUserListId = [];
    allRoomList.forEach((room) => {
      if (
        room.userId === userId &&
        !inBoxUserListId.includes(room.contactUserId)
      ) {
        inBoxUserListId.push(room.contactUserId);
      } else if (
        room.contactUserId === userId &&
        !inBoxUserListId.includes(room.userId)
      ) {
        inBoxUserListId.push(room.userId);
      }
    });

    let inBoxUserListTemp = [];
    inBoxUserListId.forEach((inBoxuserId) => {
      allUserList.filter((user) => {
        if (user.id === inBoxuserId) {
          inBoxUserListTemp.push(user);
        }
        return inBoxUserListTemp;
      });
    });

    return inBoxUserListTemp;
  }, [allRoomList, inBoxList]);

  //Searched Users
  const handleSearch = useCallback(
    (username) => {
      setSearchTerm(username);
      const filteredUsers = allUserList.filter((user) => {
        const usernameDB = user.username.toLowerCase();
        return usernameDB.includes(username.toLowerCase()) && user.id !== userId;
      });
      setSearchedUsers(filteredUsers);
    },
    [allUserList, searchedUsers]
  );

  // User Select
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm("");
    setManualRoomId("");

    if (user && !inBoxUsersList.includes(user)) {
      inBoxUsersList.push(user);
    }

    if (user && user.id) {
      const selectedUserId = user.id;
      const selectedRoom = allRoomList.find((room) => {
        return (
          (room.userId === selectedUserId && room.contactUserId === userId) ||
          (room.userId === userId && room.contactUserId === selectedUserId)
        );
      });

      if (selectedRoom && selectedRoom != null) {
        const selectedRoomId = selectedRoom.id;
        const selectedInBoxList = inBoxList.filter(
          (inBox) => inBox.roomId === selectedRoomId
        );
        setRoomMessageList(selectedInBoxList);
        setRoomId(selectedRoomId);
      } else {
        setRoomId("");
      }
    }
  };

  const handleManualRoomIdSubmit = (input) => {
    const roomIdErrorMessage = validateRoomId(manualRoomIdValue);
    setErrorMessage(roomIdErrorMessage);

    if (roomIdErrorMessage.length === 0) {
      setError(false);
      setManualRoomId(input);
      setSearchTerm("");
      setRoomId(input);
      setSelectedUser(null);
      roomIdList.push(input);

      const selectedInBoxList = inBoxList.filter(
        (inBox) => inBox.roomId === input
      );

      if (selectedInBoxList && selectedInBoxList.length > 0) {
        const selectedRoom = selectedInBoxList[0];
        if (selectedRoom && selectedRoom != null) {
          setRoomId(selectedRoom.roomId);
        }
        setRoomMessageList(selectedInBoxList);
      }
    } else {
      setError(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let activeRoomId = roomId || uuidv4();

    if (manualRoomId && inBoxList && inBoxList.length <= 0) {
      activeRoomId = manualRoomId;
    }

    if (!roomId || roomId === "") {
      await addDoc(roomsCollection, {
        id: activeRoomId,
        userId: userId,
        contactUserId: selectedUser?.id || "",
        createdAt: serverTimestamp(),
      });
      roomIdList.push(activeRoomId);
    }

    if (message !== "" && (selectedUser || manualRoomId)) {
      await addDoc(msgCollection, {
        id: uuidv4(),
        senderId: userId,
        recepientId: selectedUser?.id || "",
        roomId: activeRoomId,
        text: message,
        createdAt: serverTimestamp(),
      });
      setMessage("");
    }
    setRoomId(activeRoomId);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    cookies.remove("auth-cookie");
    cookies.remove("room-id");
    cookies.remove("userId");
    setUserId("");
    setIsAuth(false);
    navigate("/");
  };

  // console.log("AllUsers ", allUserList);
  console.log("AllRooms ", allRoomList);
  console.log("inBoxUsersList ", inBoxUsersList);
  console.log("inBoxList ", inBoxList);
  // console.log("userId ", userId);
  console.log("manualRoomId ", manualRoomId);
  console.log("roomMessageList", roomMessageList);

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
                    <h2
                      className="headerFont"
                      style={{ padding: "0px", margin: "0px" }}>
                      Chats
                    </h2>
                    <ChatIcon style={{ fontSize: "20px", color: "#888" }} />
                  </div>
                  <TextField
                    fullWidth
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
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
                  {(searchTerm ? searchedUsers : inBoxUsersList).map((user) => (
                    <Paper
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      elevation={3}
                      style={{
                        padding: "10px",
                        cursor: "pointer",
                        background:
                          selectedUser?.id === user.id
                            ? "linear-gradient(-135deg, #69A9E9 25%, #3472F9 100%)"
                            : "#fff",
                        color: selectedUser?.id === user.id ? "#fff" : "#000",
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
                        <span
                          style={{ fontWeight: "bold" }}
                          className="headerFont">
                          {user.username}
                        </span>

                        {/* Last Message */}
                        {inBoxList &&
                          inBoxList
                            .filter(
                              (message) =>
                                (message?.senderId === user.id ||
                                  message?.recepientId === user.id) &&
                                message.recepientId !== ""
                            )
                            .slice(-1)
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
                                      selectedUser?.id === user.id
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
                                      selectedUser?.id === user.id
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
                  {inBoxList && inBoxList.length <= 0 &&(
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                      display:
                        (isSmallScreen && (selectedUser || manualRoomId)) ||
                        !isSmallScreen
                          ? "none"
                          : "flex",
                    }}>
                    <div
                      style={{
                        width: "250px",
                        height: "350px",
                        
                      display:
                      (isSmallScreen && (selectedUser || manualRoomId)) ||
                      !isSmallScreen
                        ? "none"
                        : "flex",
                        flexDirection: "column",
                        background:
                          "linear-gradient(to right bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))",
                        borderRadius: "20px",
                        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.5)",
                        marginTop:"5rem"
                      }}>
                      {/* Select User or Enter ROom Id */}
                      <LottieAnimation
                        animationList={[
                          chatLottieAnimation,
                          relaxedEmojiAnimation,
                        ]}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0",
                          marginTop: "-30px",
                        }}>
                        {allUserList
                          .slice(0, 3)
                          .filter(
                            (user) =>
                              user.id !== currentUser.id &&
                              user.profileImg.length > 0
                          )
                          .map((user) => (
                            <li
                              key={user.id}
                              style={{
                                listStyle: "none",
                                marginLeft: "-10px",
                              }}>
                              <IconButton
                                style={{ padding: "0" }}
                                onClick={() => handleUserSelect(user)}>
                                <Avatar src={user.profileImg} />
                              </IconButton>
                            </li>
                          ))}

                        {allUserList.length > 3 && (
                          <li
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginLeft: "-10px",
                            }}>
                            <Avatar sx={{ background: "#8eb9fe" }}>
                              <span>...</span>
                            </Avatar>
                            <span>+{allUserList.length - 3} more</span>
                          </li>
                        )}
                      </div>
                      <p
                        className="headerFont"
                        style={{
                          textAlign: "center",
                          color: "rgba(255, 215, 0, 1)",
                          fontWeight: "bold",
                          fontSize: "20px",
                          textShadow: "2px 1.2px 2px rgba(255, 0, 0, 1)",
                        }}>
                        Select Users to Chat !
                      </p>
                    </div>
                  </div>
                  )}
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
                    justifyContent: "space-around",
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
                    onClick={() => {
                      setSelectedUser(null);
                      setManualRoomId("");
                    }}
                    startIcon={<ArrowBackIcon />}></Button>
                  {/* Image , selected User*/}
                  {selectedUser && (
                    <Avatar
                      alt={selectedUser.username}
                      src={selectedUser.profileImg}
                    />
                  )}

                  {/* Centered Title, Room */}
                  <h2 className="chatHeader headerFont">
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
                      ref={containerRef}
                      sx={{ flexGrow: 1, overflowY: "auto", padding: "10px" }}
                      className="scrollBar">
                      {roomMessageList && roomMessageList.length > 0 ? (
                        roomMessageList
                          .filter((inBox) => inBox.roomId === roomId)
                          .map((msg, index) => {
                            const user =
                              allUserList.find(
                                (user) => user.id === msg.senderId
                              ) || {};

                            return (
                              <div
                                key={index}
                                style={{
                                  display: "flex",
                                  justifyContent:
                                    user.id === currentUser.id
                                      ? "flex-end"
                                      : "flex-start",
                                  marginBottom: "10px",
                                }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexDirection:
                                      user.id === currentUser.id
                                        ? "row-reverse"
                                        : "row",
                                  }}>
                                  <Avatar
                                    sx={{ boxShadow: "0px 2px 4px #00000057" }}
                                    alt={
                                      msg.senderId === currentUser.id
                                        ? currentUser.username
                                        : user.username
                                    }
                                    src={
                                      msg.senderId === currentUser.id
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
                                          msg.senderId === currentUser.id
                                            ? "linear-gradient(-135deg, #004dff 25%, #4968ff 100%)"
                                            : "#fff",
                                        color:
                                          msg.senderId === currentUser.id
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
                                          msg.senderId === currentUser.id
                                            ? "10px"
                                            : "0px",
                                        marginLeft:
                                          msg.senderId === currentUser.id
                                            ? "0px"
                                            : "12px",
                                        textAlign:
                                          msg.senderId === currentUser.id
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
                              height: "400px",
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
                      }}>
                      <div
                        style={{
                          width: "300px",
                          height: "400px",
                          display: "flex",
                          flexDirection: "column",
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
                        />
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0",
                            marginTop: "-30px",
                          }}>
                          {allUserList
                            .slice(0, 3)
                            .filter(
                              (user) =>
                                user.id !== currentUser.id &&
                                user.profileImg.length > 0
                            )
                            .map((user) => (
                              <li
                                key={user.id}
                                style={{
                                  listStyle: "none",
                                  marginLeft: "-10px",
                                }}>
                                <IconButton
                                  style={{ padding: "0" }}
                                  onClick={() => handleUserSelect(user)}>
                                  <Avatar src={user.profileImg} />
                                </IconButton>
                              </li>
                            ))}

                          {allUserList.length > 3 && (
                            <li
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginLeft: "-10px",
                              }}>
                              <Avatar sx={{ background: "#8eb9fe" }}>
                                <span>...</span>
                              </Avatar>
                              <span>+{allUserList.length - 3} more</span>
                            </li>
                          )}
                        </div>
                        <p
                          className="headerFont"
                          style={{
                            textAlign: "center",
                            color: "rgba(255, 215, 0, 1)",
                            fontWeight: "bold",
                            fontSize: "20px",
                            textShadow: "2px 1.2px 2px rgba(255, 0, 0, 1)",
                          }}>
                          Select Users to Chat !
                        </p>
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
