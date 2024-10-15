import { Timestamp } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';


export function formatDate(timestamp) {
  if (timestamp instanceof Timestamp) {
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return "";
}

export function generateUserId(username) {
    let userId = username;
    userId = userId.replace(/\s/g, "");
    const remainingLength = 24 - userId.length;
    if (remainingLength > 0) {
      userId += uuidv4().replace(/-/g, '').slice(0, remainingLength);
    }
    return userId;
  }

export function validateRoomId(input){
    let errorMessage = "";
    if(!input || input.length <= 0){
        errorMessage = "Room Id is required"
    } else if (input.length <= 2) {
        errorMessage = "Room Id must be at least 3 characters long."
    } else if (input.length > 10) {
        errorMessage = "Room Id cannot be longer than 10 characters.";
    }
    return errorMessage;
}


export function validateName(input){
    let errorMessage = "";
    if(!input || input.length < 1){
        errorMessage = "Name is required"
    }
    return errorMessage;
}


export function validateEmail(input){
    let errorMessage = "";
    if(!input || input.length <= 0){
        errorMessage = "Email is required"
    } else if(!input || !/\S+@\S+\.\S+/.test(input)){
        errorMessage = "Please enter a valid email address."
    } 
    return errorMessage;
}


export function validatePassword(input){
    let errorMessage = "";
    if(!input || input.length <= 0){
        errorMessage = "Password is required"
    } else if (!input || input.length < 6){
        errorMessage = "Password must be at least 6 characters long."
    } 
    return errorMessage;
}


export const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    path: "/", 
    secure: true,
    sameSite: "Strict",
  };
