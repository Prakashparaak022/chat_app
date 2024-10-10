import { createContext, useContext, useState } from "react";


const AuthContext = createContext();
export const AuthProvider = ({children})=>{
  
  const [isAuth, setIsAuth] = useState(false);
  const [userId, setUserId] = useState("");

  return(
    <AuthContext.Provider value={{isAuth, setIsAuth, userId, setUserId}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = ()=> useContext(AuthContext);