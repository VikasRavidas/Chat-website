import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { ClearSearch, logoutUser } from '../actions/auth';
import searchUsers from '../actions/Search';

// Importing icons from the library we just installed
import { FaUserCircle, FaSearch } from 'react-icons/fa'; 

import gif from './img/chat_gif.gif';
import images from './img/images.png';

const Navbar = (props) => {
  // State to manage the dropdown menu's visibility
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  
  const { auth, results } = props;

  return (
    <nav className="nav">
      {/* Logo */}
      <div className="left-div">
        <Link to="/">
          <img src={gif} alt="logo" />
        </Link>
      </div>

      {/* Search Bar */}
      {auth.isLoggedin && (
        <div className="search-container">
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
                      <img src={images} alt="user-dp" />
                      <span>{user.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Right Navigation */}
      <div className="right-nav">
        {/* User Profile and Dropdown Menu */}
        <div className="user-profile">
          {/* This is the icon you click */}
          <div className="profile-icon-container" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {auth.isLoggedin ? (
              <img src={images} alt="user-dp" id="user-dp" />
            ) : (
              <FaUserCircle className="guest-icon" />
            )}
            <span>{auth.isLoggedin ? auth.user.name : 'Guest'}</span>
          </div>

          {/* This is the dropdown menu that appears on click */}
          {isMenuOpen && (
            <div className="profile-dropdown">
              <ul>
                {auth.isLoggedin ? (
                  <>
                    <li><Link to="/settings" onClick={() => setIsMenuOpen(false)}>Settings</Link></li>
                    <li onClick={logOut}>Log out</li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login" onClick={() => setIsMenuOpen(false)}>Log In</Link></li>
                    <li><Link to="/signup" onClick={() => setIsMenuOpen(false)}>Register</Link></li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  results: state.search.results,
});

export default connect(mapStateToProps)(Navbar);