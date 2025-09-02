import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { ClearSearch, logoutUser } from '../actions/auth';
import searchUsers from '../actions/Search';

// Importing icons from the library we just installed
import { FaUserCircle, FaSearch,FaUserFriends, FaBars  } from 'react-icons/fa'; 
import { FiSettings, FiLogOut, FiLogIn, FiUserPlus } from 'react-icons/fi';

import gif from './img/chat_gif.gif';
import images from './img/images.png';

const API_ROOT_URL = 'https://chat-website-backend-4y4d.onrender.com';

const Navbar = (props) => {
  // State to manage the dropdown menu's visibility
  const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isFriendsMenuOpen, setIsFriendsMenuOpen] = useState(false); // We can remove this if you want
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Function to log the user out
  const logOut = () => {
    localStorage.removeItem('token');
    props.dispatch(logoutUser());
  };

  // Function to handle search input changes
  const handleSearch = (e) => {
    const searchText = e.target.value;
    props.dispatch(searchUsers(searchText));
  };
  
  // Function to clear search results and input
  const handleClearSearch = () => {
    props.dispatch(ClearSearch());
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };
  
  const { auth, results} = props;
  const friends=props.friends;
  console.log("props: ",friends);

  const searchInputJsx = (
    <>
      <FaSearch className="search-icon" />
      <input
        placeholder="Search"
        onChange={handleSearch}
        ref={searchInputRef}
      />
      {results.length > 0 && (
        <div className="search-results">
          <ul>
            {results.map((user) => (
              <li
                className="search-results-row"
                key={user.id}
                onClick={handleClearSearch}
              >
                <Link to={`/user/${user.id}`}>
                  <img src={user.avatar ? `${API_ROOT_URL}/${user.avatar}` : images} alt="user-dp" className="avatar" />
                  <span>{user.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  return (
    <>
     {/* ✅ NEW: Overlay that closes the sidebar when clicked */}
      {auth.isLoggedin&&isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* ✅ NEW: The Sidebar Navigation itself */}
      <div className={`sidebar-nav ${isSidebarOpen ? 'open' : ''}`}>
        <h3>Friends</h3>
        {friends && friends.length > 0 ? (
          <ul>
            {friends.map((friend) => (
              <li key={friend.id}>
                <Link
                  to={`/user/${friend.id}`}
                  onClick={() => setIsSidebarOpen(false)} // Close sidebar on click
                >
                 <img src={friend.avatar ? `${API_ROOT_URL}/${friend.avatar}` : images} alt="friend-dp" className="avatar" />

                  <span>{friend.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-friends-sidebar">No friends to show</div>
        )}
      </div>

   <nav className={`nav ${!auth.isLoggedin ? 'logged-out' : ''}`}>
      <div className="nav-top-row">
       {/* Left Section: Hamburger Menu */}
        {auth.isLoggedin && (
        <div className="nav-left">
          <FaUserFriends
            className="hamburger-menu"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>)}
      {/* Logo */}
      <div className="nav-center">
        <Link to="/">
          <img src={gif} alt="logo" />
        </Link>
      </div>

      {/* Search Bar */}
      {auth.isLoggedin && (
            <div className="search-container desktop-search">
                {searchInputJsx}
              </div>
      )}

      {/* Right Navigation */}
      <div className="nav-right">
        {/* User Profile and Dropdown Menu */}
        <div className="user-profile">
          {/* This is the icon you click */}
          <div className="profile-icon-container" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {auth.isLoggedin ? (
             
          <img src={auth.user.avatar ? `${API_ROOT_URL}/${auth.user.avatar}` : images} alt="user-dp" className="avatar" /> //
            ) : (
              <FaUserCircle className="guest-icon" />
            )}
            {/* <span>{auth.isLoggedin ? auth.user.name : 'Guest'}</span> */}
          </div>

          {/* This is the dropdown menu that appears on click */}
          {isMenuOpen && (
            <div className="profile-dropdown">
               {/* ✅ NEW: Header section for the dropdown */}
      {auth.isLoggedin && (
        <div className="dropdown-header">
          <span className="user-name">{auth.user.name}</span>
          <span className="user-email">{auth.user.email}</span>
        </div>
      )}
              <ul>
                {auth.isLoggedin ? (
                  <>
                    <li><Link to="/settings" onClick={() => setIsMenuOpen(false)}>
                    <FiSettings/><span>Settings</span></Link></li>
                    <li ><button onClick={logOut} className="logout-button">
                      <FiLogOut/><span>Log out</span>
                      </button>
                      </li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <FiLogIn/>
                    <span>Log In</span></Link></li>
                    <li><Link to="/signup" onClick={() => setIsMenuOpen(false)}><FiUserPlus/>
                    <span>Register</span></Link></li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
          </div>
      {/* This is the MOBILE search bar, now a direct child of nav */}
        {auth.isLoggedin && (
          <div className="search-container mobile-search">
            {searchInputJsx}
          </div>
        )}
    </nav>
    </>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  results: state.search.results,
  friends: state.friends
});

export default connect(mapStateToProps)(Navbar);