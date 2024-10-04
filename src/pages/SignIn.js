import * as React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import GoogleIcon from "@mui/icons-material/Google";
import {
  addDoc,
  and,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db, provider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import Cookies from "universal-cookie";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: "100%",
  padding: 4,
  backgroundImage:
    "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
  backgroundRepeat: "no-repeat",
  ...theme.applyStyles("dark", {
    backgroundImage:
      "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
  }),
}));

const cookies = new Cookies();

export function generateUserId(username) {
  let userId = username.replaceAll(/\s/g,'');

  const remainingLength = 24 - username.length;
  if (remainingLength > 0) {
    userId += uuidv4().replace(/-/g, "").slice(0, remainingLength);
  }

  return userId;
}

export default function SignIn(props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [isUserCreated, setIsUserCreated] = useState(false);
  // const navigate = useNavigate();

  const { setIsAuth } = props;
  const { setUserId } = props;


  const userCollection = collection(db, "Users");

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Sign in result:", result);
      if (result.user) {
        cookies.set("auth-cookie", result.user.refreshToken);
        setIsAuth(true);

        const userEmail = result.user.email;
        const userQuery = query(
          userCollection,
          where("email", "==", userEmail)
        );

        console.log("1 - Querying Firestore");
        const querySnapshot = await getDocs(userQuery);
        let userList = [];

        querySnapshot.forEach((doc) => {
          userList.push({ ...doc.data(), id: doc.id });
        });

        if (userList.length > 0) {
          console.log("Existing User");

          const userDetail = userList[0];
          
          cookies.set("auth-cookie", result.user.refreshToken);
          cookies.set("userId", userDetail.userId);
          setUserId(userDetail.userId);
          setIsAuth(true);

        } else {
          console.log("New User");

          const docUserRef = await addDoc(userCollection, {
            userId: generateUserId(result.user.displayName),
            username: result.user.displayName,
            email: userEmail,
            profileImg: result.user.photoURL,
            createAt: serverTimestamp(),
          });

          console.log("Document written with ID: ", docUserRef.id);
          if (docUserRef.id != "") {
            setIsAuth(true);

            const userSnapshot = await getDoc(docUserRef);
            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              cookies.set("userId", userData.userId);
              setUserId(userData.userId);
            } else {
              console.log("No such document!");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error signing in: ", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const userQuery = query(userCollection, where("email", "==", email));

    try {
      console.log("1 - Querying Firestore");

      const querySnapshot = await getDocs(userQuery);
      let userList = [];

      querySnapshot.forEach((doc) => {
        userList.push({ ...doc.data(), id: doc.id });
      });

      if (userList.length > 0) {
        const userDetail = userList[0];
        const userEmail = userDetail.email;
        const userPassword = userDetail.password;

        if (
          userEmail === email &&
          email.length > 0 &&
          userPassword === password &&
          userPassword.length > 0
        ) {
          //   cookies.set("auth-cookie", userRoomId);
          console.log("Correct");
          cookies.set("userId", userDetail.userId);
          setUserId(userDetail.userId);
          setIsAuth(true);
          console.log("User authenticated, roomId set.");
        } else {
          setEmailError("error");
          setEmailErrorMessage("Credential Doesn't Match");
          setPasswordError("error");
          setPasswordErrorMessage("Credential Doesn't Match");
          console.error("Credentials don't match.");
        }
      } else {
        setEmailError("error");
        setEmailErrorMessage("Email Doesn't Exist");
        console.error("User Does Not Exist.");
      }
    } catch (error) {
      console.error("Error signing in: ", error);
    }
  };

  //Validations
  const validateInputs = () => {
    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    return isValid;
  };

  return (
    <>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Stack
          sx={{
            justifyContent: "center",
            height: "100dvh",
            p: 2,
          }}>
          <Card variant="outlined">
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}>
              Sign In
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl>
                <FormLabel htmlFor="email">Email</FormLabel>
                <TextField
                  required
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
                  required
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
                onClick={validateInputs}>
                Sign in
              </Button>
              <Typography sx={{ textAlign: "center" }}>
                Don't have an account?{" "}
                <span>
                  <Link href="/" variant="body2" sx={{ alignSelf: "center" }}>
                    Sign up
                  </Link>
                </span>
              </Typography>
            </Box>
            <Divider>
              <Typography sx={{ color: "text.secondary" }}>or</Typography>
            </Divider>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                type="submit"
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={signInWithGoogle}>
                Sign in with Google
              </Button>
            </Box>
          </Card>
        </Stack>
      </SignUpContainer>
    </>
  );
}
