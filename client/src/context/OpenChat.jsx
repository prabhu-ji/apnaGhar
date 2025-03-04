import { createContext, useContext, useState } from "react";
const OpenChatContext = createContext();

export const OpenChatContextProvider = ({ children }) => {
    const [openChat,setOpenChat]=useState({});
  return (
    <OpenChatContext.Provider value={{openChat,setOpenChat}}>
      {children}
    </OpenChatContext.Provider>
  );
};
export const useOpenChat =()=>{
    const context = useContext(OpenChatContext);
    if (!context) {
      throw new Error('useOpenChat must be used within an OpenChatContextProvider');
    }
    return context;
  };