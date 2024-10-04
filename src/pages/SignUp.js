import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import GoogleIcon from '@mui/icons-material/Google';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, db, provider } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import { setUserId } from 'firebase/analytics';
import { useNavigate } from 'react-router-dom';
import Cookies from 'universal-cookie';



const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: '100%',
  padding: 4,
  backgroundImage:
    'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
  backgroundRepeat: 'no-repeat',
  ...theme.applyStyles('dark', {
    backgroundImage:
      'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
  }),
}));

const cookies = new Cookies();

export function generateUserId(username) {
  let userId = username;
  const remainingLength = 24 - username.length;
  if (remainingLength > 0) {
    userId += uuidv4().replace(/-/g, '').slice(0, remainingLength);
  }

  return userId;
}

export default function SignUp(props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [nameError, setNameError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState('');
  // const navigate = useNavigate();


  const{ setIsAuth } = props;

  const userCollection = collection(db, "Users"); 

  const signInWithGoogle = async () => {
    
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("Sign in result:", result);
        if (result.user) {
            cookies.set('auth-cookie', result.user.refreshToken);

            const userEmail = result.user.email;
            const userQuery = query(
              userCollection,
              where("email", "==", userEmail),
              orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(userQuery);

            if (querySnapshot.empty) {
              
              const docUserRef = await addDoc(userCollection, {
                  userId: generateUserId(result.user.displayName),
                  username: result.user.displayName,
                  email: userEmail,
                  profileImg: result.user.photoURL,
                  createAt: serverTimestamp()

              });
        
              console.log("Document written with ID: ", docUserRef.id);
              if(docUserRef.id != "") {
                setIsAuth(true);
              }
          } else {
            console.log("Existing User " + result);

            const userDoc = querySnapshot.docs[0];
            console.log("userDoc " + userDoc);

            const userData = userDoc.data();
            console.log("userData " + userData);
          }
        }
    } catch (error) {
        console.error("Error signing in: ", error);
    }
};

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Entered");

    const userQuery = query(
      userCollection,
      where("email", "==", email),
      orderBy("createdAt", "desc"));

      console.log("email " + email);

      const querySnapshot = await getDocs(userQuery);
      
      const userDoc = querySnapshot.docs[0];
      console.log("userDoc " + userDoc);

      if(querySnapshot.empty){

        try {
          
          const docRef = await addDoc(userCollection, {
            userId: generateUserId(name),
            username: name,
            email: email,
            password: password,
            createAt: serverTimestamp()
          });
      
          setEmail("");
          setName("");
          setPassword("");

          if(docRef.id != "") {
            // navigate('/signIn');  
          }

        } catch (error) {
          console.error("Error adding document: ", error);
        }
        setEmailError('error')
        setEmailErrorMessage("Email Already Exists") 
        console.error("User Already Exists");
  }

  };


  //Validations
  
  const validateInputs = () => {
    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    if (!name || name.length < 1) {
      setNameError(true);
      setNameErrorMessage('Name is required.');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    return isValid;
  };


  return (
      <>
        <CssBaseline enableColorScheme />
        <SignUpContainer direction="column" justifyContent="space-between">
          <Stack
            sx={{
              justifyContent: 'center',
              height: '100dvh',
              p: 2,
            }}
          >
            <Card variant="outlined">
              <Typography
                component="h1"
                variant="h4"
                sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
              >
                Sign up
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <FormControl>
                  <FormLabel htmlFor="name">User name</FormLabel>
                  <TextField
                    autoComplete="name"
                    name="name"
                    required
                    fullWidth
                    id="name"
                    placeholder="Jon Snow"
                    onChange={(e)=> setName(e.currentTarget.value)}
                    value={name}
                    error={nameError}
                    helperText={nameErrorMessage}
                    color={nameError ? 'error' : 'primary'}
                  />
                </FormControl>
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
                    onChange={(e)=> setEmail(e.currentTarget.value)}
                    value={email}
                    error={emailError}
                    helperText={emailErrorMessage}
                    color={emailError ? 'error' : 'primary'}
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
                    onChange={(e)=> setPassword(e.currentTarget.value)}
                    value={password}
                    error={passwordError}
                    helperText={passwordErrorMessage}
                    color={passwordError ? 'error' : 'primary'}
                  />
                </FormControl>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  onClick={validateInputs}
                >
                  Sign up
                </Button>
                <Typography sx={{ textAlign: 'center' }}>
                  Already have an account?{' '}
                  <span>
                    <Link
                      href="/"
                      variant="body2"
                      sx={{ alignSelf: 'center' }}
                    >
                      Sign in
                    </Link>
                  </span>
                </Typography>
              </Box>
              <Divider>
                <Typography sx={{ color: 'text.secondary' }}>or</Typography>
              </Divider>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={signInWithGoogle}
                >
                  Sign up with Google
                </Button>
              </Box>
            </Card>
          </Stack>
        </SignUpContainer>
      </>
  );
}