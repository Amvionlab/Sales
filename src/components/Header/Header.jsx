import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  faKey,
  faBell,
  faSearch,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UserContext } from "../UserContext/UserContext";
import { Tooltip, tooltipClasses } from "@mui/material";
import { styled } from '@mui/system';

function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [isInputVisible, setInputVisible] = useState(false);
  const handleIconClick = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    
    window.location.reload();
  };
  const PurpleTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: 'purple',
      color: 'white',
      fontSize: '0.875rem',
    },
    [`& .${tooltipClasses.arrow}`]: {
      color: 'purple',
    },
  });
  const handleSettingsClick = () => {
    navigate("/password-change");
  };

  const toggleSidebar = () => {
    setOpen(!open);
  };

  const { user } = useContext(UserContext);

  return (
    <header className="border-b-2  fixed bg-box top-0 right-0 h-14 w-full flex justify-between items-center">
      {/* Desktop Logo and Search */}
      <div className="hidden sm:flex items-center">
        {/* <div
          className={`hidden sm:flex lg:flex absolute left-52 text-prime  rounded-full items-center justify-between transition-all duration-300 ${
            isInputVisible ? "w-[13vw] scale-80" : "w-10 scale-80"
          }`}
        >
          <FontAwesomeIcon
            className="text-sm text-prime font-bold cursor-pointer mr-2 hover:text-flo"
            icon={faSearch}
            onClick={() => setInputVisible(!isInputVisible)}
          />
          <div
            className={
              isInputVisible
                ? "p-1 rounded-full text-xs shadow-inner bg-second"
                : "bg-transparent"
            }
          >
            <input
              type="text"
              className={`bg-transparent text-prime outline-none text-xs ml-3 transition-all duration-300 transform ${
                isInputVisible
                  ? "scale-100 opacity-100 w-full"
                  : "scale-0 opacity-0 w-0"
              }`}
              placeholder="Search Your Asset"
              style={{ transformOrigin: "left center" }}
              autoFocus={isInputVisible}
            />
          </div>
        </div> */}
      </div>

      {/* Desktop Icons for Settings, Notifications, and User */}
      <div className="text-white text-base flex gap-6 mr-2 my-auto">
        {/* Settings */}
        <PurpleTooltip 
               title="Change Password" 
               arrow 
             >
        <div
          
          className="cursor-pointer text-prime hover:text-flo flex text-sm items-center justify-center"
          onClick={handleSettingsClick}
        >
          <FontAwesomeIcon icon={faKey} />
        </div>
        </PurpleTooltip>
        {/* Notifications */}
       
        <div className="cursor-pointer text-prime hover:text-flo flex text-sm items-center justify-center"
          >
          <FontAwesomeIcon icon={faBell} />
         
        </div>
        
        <PurpleTooltip 
               title="Log out"
               arrow 
             >
        <div
          className="cursor-pointer text-prime hover:text-flo flex text-sm items-center justify-center"
          
          onClick={handleIconClick}
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
        </div>
        </PurpleTooltip>
      </div>
    </header>
  );
}

export default Header;
