import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  addDoc,
  collection,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db, provider } from "../firebaseConfig";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Cookies from "universal-cookie";
import {
  generateUserId,
  validateEmail,
  validateName,
  validatePassword,
} from "../Utils/utils";
import { Avatar, Grid2 as Grid, Paper, useTheme } from "@mui/material";

import celebrateEmojiAnimation from "../Assets/own_lottie_Json/celebrate_emoji.json";
import starEyeEmojiAnimation from "../Assets/own_lottie_Json/star_eye_emoji.json";
import angelFaceEmojiAnimation from "../Assets/own_lottie_Json/angel_face.json";
import cloudChatAnimation from "../Assets/own_lottie_Json/cloud_chat.json";
import { LottieAnimation } from "./LottieAnimation";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Element from "./Element";
import { useAuth } from "../AuthProvider";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [nameError, setNameError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const cookies = new Cookies();
  const navigate = useNavigate();

  const { setIsAuth, setUserId } = useAuth();
  // const { setIsAuth } = props;
  // const { setUserId } = props;

  const userCollection = collection(db, "Users");

  const signUpWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        const userEmail = result.user.email;
        const userQuery = query(
          userCollection,
          where("email", "==", userEmail),
          orderBy("createdAt", "desc")
        );

        let userList = [];
        const querySnapshot = await getDocs(userQuery);
        querySnapshot.forEach((doc) => {
          userList.push({ ...doc.data(), docId: doc.id });
        });

        if (!userList || userList.length <= 0) {
          const docUserRef = await addDoc(userCollection, {
            id: generateUserId(result.user.displayName),
            username: result.user.displayName,
            email: userEmail,
            password: "",
            profileImg: result.user.photoURL,
            createdAt: serverTimestamp(),
          });

          console.log("User Created !");
          if (docUserRef.id !== "") {
            const userSnapshot = await getDoc(docUserRef);
            if (userSnapshot.exists()) {
              const userDetail = userSnapshot.data();
              cookies.set("auth-cookie", result.user.accessToken);
              cookies.set("userId", userDetail.id);
              setUserId(userDetail.id);
              setIsAuth(true);
              setAuthenticated(true);
            } else {
              console.log("No such Record!");
            }
          }
        } else {
          console.log("Existing User ");
          const userDetail = userList[0];
          cookies.set("auth-cookie", result.user.accessToken);
          cookies.set("userId", userDetail.id);
          setUserId(userDetail.id);
          setIsAuth(true);
          setAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Error signing in: ", error);
    }
  };

  //Validations
  const validateInputs = () => {
    let isValid = true;

    const emailValidation = validateEmail(email);
    if (!emailValidation) {
      setEmailError(false);
      setEmailErrorMessage("");
    } else {
      setEmailError(true);
      setEmailErrorMessage(emailValidation);
      isValid = false;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation) {
      setPasswordError(false);
      setPasswordErrorMessage("");
    } else {
      setPasswordError(true);
      setPasswordErrorMessage(passwordValidation);
      isValid = false;
    }

    const nameValidation = validateName(name);
    if (!nameValidation) {
      setNameError(false);
      setNameErrorMessage("");
    } else {
      setNameError(true);
      setNameErrorMessage(nameValidation);
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isValid = validateInputs();
    if (isValid) {
      const userQuery = query(
        userCollection,
        where("email", "==", email),
        orderBy("createdAt", "desc")
      );

      let userList = [];
      const querySnapshot = await getDocs(userQuery);
      querySnapshot.forEach((doc) => {
        userList.push({ ...doc.data(), docId: doc.id });
      });

      if (!userList || userList.length <= 0) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          const user = userCredential.user;

          const docUserRef = await addDoc(userCollection, {
            id: generateUserId(name),
            username: name,
            email: email,
            password: password,
            profileImg: "",
            createdAt: serverTimestamp(),
          });

          setEmail("");
          setName("");
          setPassword("");

          if (docUserRef.id !== "") {
            const userSnapshot = await getDoc(docUserRef);
            if (userSnapshot.exists()) {
              const userDetail = userSnapshot.data();
              cookies.set("auth-cookie", user.accessToken);
              cookies.set("userId", userDetail.id);
              setIsAuth(true);
              setUserId(userDetail.id);
              setAuthenticated(true);
              console.log("User authenticated.");
            } else {
              console.log("No such Record!");
            }
          }
        } catch (error) {
          console.error("Error adding document: ", error);
          if (error.code === "auth/email-already-in-use") {
            setEmailError(true);
            setEmailErrorMessage("Email Already Exists");
            console.error("User Already Exists");
          }
        }
      } else {
        setEmailError(true);
        setEmailErrorMessage("Email Already Exists");
        console.error("User Already Exists");
      }
    }
  };

  useEffect(() => {
    if (authenticated) {
      navigate("/chat");
    }
  }, [authenticated, navigate]);

  const theme = useTheme();

  return (
    <>
      <Paper
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "transparent",
        }}>
        <Element />
        <Grid
          container
          component={Paper}
          elevation={12}
          sx={{
            height: { xs: "100vh", sm: "650px" },
            width: { xs: "100%", sm: "80%" },
            padding: { xs: "0px", sm: "10px" },
            display: { xs: "flex", sm: "flex" },
            // padding:{xs : "0px", sm : "50px"},
            flexDirection: { sm: "column" },
            alignItems: { sm: "center" },
            justifyContent: { sm: "center" },
            borderRadius: "15px",
          }}>
          <Grid
            size={{ xs: 0, sm: 4, md: 6 }}
            sx={{
              height: "100vh",
              background: "#800080",
              display: { xs: "none", sm: "flex" },
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "15px",
            }}>
            <Box
              sx={{
                height: "60%",
                width: "60%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "0px",
              }}>
              <LottieAnimation
                animationList={[
                  celebrateEmojiAnimation,
                  starEyeEmojiAnimation,
                  angelFaceEmojiAnimation,
                  cloudChatAnimation,
                ]}
                animationText={
                  "Get started! Create an acoount and start connecting with friends."
                }
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 8, md: 6 }}>
            <Box
              sx={{
                margin: { xs: "40px 40px", sm: "50px" },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.shape.borderRadius,
              }}>
              <Avatar
                sx={{
                  margin: theme.spacing(1),
                  backgroundColor: theme.palette.secondary.main,
                  display: { xs: "none", sm: "flex" },
                }}>
                <LockOutlinedIcon />
              </Avatar>
              <Box
                sx={{
                  width: "100px",
                  height: "100px",
                  display: { xs: "block", sm: "none" },
                }}>
                <LottieAnimation
                  animationList={[
                    celebrateEmojiAnimation,
                    starEyeEmojiAnimation,
                    angelFaceEmojiAnimation,
                    cloudChatAnimation,
                  ]}
                />
              </Box>

              <Typography
                component="h1"
                variant="h4"
                sx={{
                  width: "100%",
                  textAlign: "center",
                  fontWeight: "bold",
                }}>
                Sign up
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  width: "100%",
                  marginTop: theme.spacing(1),
                }}>
                <FormControl>
                  <FormLabel htmlFor="name">User name</FormLabel>
                  <TextField
                    autoComplete="name"
                    name="name"
                    fullWidth
                    id="name"
                    placeholder="username"
                    onChange={(e) => setName(e.currentTarget.value)}
                    value={name}
                    error={nameError}
                    helperText={nameErrorMessage}
                    color={nameError ? "error" : "primary"}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <TextField
                    fullWidth
                    id="email"
                    placeholder="your@email.com"
                    name="email"
                    autoComplete="email"
                    variant="outlined"
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    value={email}
                    error={emailError}
                    helperText={emailErrorMessage}
                    color={emailError ? "error" : "primary"}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <TextField
                    fullWidth
                    name="password"
                    placeholder="••••••"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    variant="outlined"
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    value={password}
                    error={passwordError}
                    helperText={passwordErrorMessage}
                    color={passwordError ? "error" : "primary"}
                  />
                </FormControl>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    background:
                      "linear-gradient(-135deg, #69A9E9 25%, #3472F9 100%)",
                  }}>
                  Sign up
                </Button>
                <Typography sx={{ textAlign: "center" }}>
                  Already have an account?{" "}
                  <span>
                    <Link href="/" variant="body2" sx={{ alignSelf: "center" }}>
                      Sign in
                    </Link>
                  </span>
                </Typography>
                <Divider>
                  <Typography sx={{ color: "text.secondary" }}>or</Typography>
                </Divider>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  width: "100%",
                  mt: 2,
                }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="outlined"
                  startIcon={
                    <img
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0xNy42NCA5LjIwNWMwLS42MzktLjA1Ny0xLjI1Mi0uMTY0LTEuODQxSDl2My40ODFoNC44NDRhNC4xNCA0LjE0IDAgMCAxLTEuNzk2IDIuNzE2djIuMjU5aDIuOTA4YzEuNzAyLTEuNTY3IDIuNjg0LTMuODc1IDIuNjg0LTYuNjE1eiIgZmlsbD0iIzQyODVGNCIgZmlsbC1ydWxlPSJub256ZXJvIj48L3BhdGg+PHBhdGggZD0iTTkgMThjMi40MyAwIDQuNDY3LS44MDYgNS45NTYtMi4xOGwtMi45MDgtMi4yNTljLS44MDYuNTQtMS44MzcuODYtMy4wNDguODYtMi4zNDQgMC00LjMyOC0xLjU4NC01LjAzNi0zLjcxMUguOTU3djIuMzMyQTguOTk3IDguOTk3IDAgMCAwIDkgMTh6IiBmaWxsPSIjMzRBODUzIiBmaWxsLXJ1bGU9Im5vbnplcm8iPjwvcGF0aD48cGF0aCBkPSJNMy45NjQgMTAuNzFBNS40MSA1LjQxIDAgMCAxIDMuNjgyIDljMC0uNTkzLjEwMi0xLjE3LjI4Mi0xLjcxVjQuOTU4SC45NTdBOC45OTYgOC45OTYgMCAwIDAgMCA5YzAgMS40NTIuMzQ4IDIuODI3Ljk1NyA0LjA0MmwzLjAwNy0yLjMzMnoiIGZpbGw9IiNGQkJDMDUiIGZpbGwtcnVsZT0ibm9uemVybyI+PC9wYXRoPjxwYXRoIGQ9Ik05IDMuNThjMS4zMjEgMCAyLjUwOC40NTQgMy40NCAxLjM0NWwyLjU4Mi0yLjU4QzEzLjQ2My44OTEgMTEuNDI2IDAgOSAwQTguOTk3IDguOTk3IDAgMCAwIC45NTcgNC45NThMMy45NjQgNy4yOUM0LjY3MiA1LjE2MyA2LjY1NiAzLjU4IDkgMy41OHoiIGZpbGw9IiNFQTQzMzUiIGZpbGwtcnVsZT0ibm9uemVybyI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDBoMTh2MThIMHoiPjwvcGF0aD48L2c+PC9zdmc+"
                      height="17"
                      width="17"
                      className="googleIcon_XkVP+"
                      alt="Google"
                    />
                  }
                  onClick={signUpWithGoogle}>
                  Sign up with Google
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
}
