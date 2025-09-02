import {
  CLEAR_AUTH_STATE,
  CLEAR_SEARCH,
  EDIT_USER_FAILED,
  EDIT_USER_SUCCESSFUL,
  LOGIN_FAILED,
  LOGIN_START,
  LOGIN_SUCCESS,
  LOG_OUT,
} from './actionTypes';
import { APIUrls } from '../helpers/urls';
import { SIGNUP_START, SIGNUP_SUCCESS, SIGNUP_FAILED } from './actionTypes';
import { getAuthTokenFromLocalStorage } from '../helpers/utils';
import { fetchUserFriends } from './friends';

export function startLogin() {
  return { type: LOGIN_START };
}

export function loginFailed(errorMessage) {
  return { type: LOGIN_FAILED, error: errorMessage };
}

export function loginSuccess(user) {
  return { type: LOGIN_SUCCESS, user }; // ✅ Corrected to return user
}

function fetchWithTimeout(url, options, timeout = 10000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

export function login(email, password) {
  return (dispatch) => {
    dispatch(startLogin());
    
    fetchWithTimeout(APIUrls.login(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password },10000),
    })
    .then(async (response) => {
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log('Response data', data);
      
      const token = data.token;
      if (token) {
        localStorage.setItem('token', token);
        console.log('token: ', token);
      }
      
      dispatch(loginSuccess(data.user));
    })
    .catch((error) => {
      console.error('Login error:', error);
      dispatch(loginFailed(error.message || 'Network error, please try again!'));
    });
  };
}


export function startSignup() {
  return { type: SIGNUP_START };
}

export function signupSuccess(user) {
  return { type: SIGNUP_SUCCESS, user };
}

export function signupFailed(errorMessage) {
  return { type: SIGNUP_FAILED, error: errorMessage };
}

export function signup(name, email, password) {
  return async (dispatch) => {
    dispatch(startSignup());

    try {
      const response = await fetch(APIUrls.signup(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      const u = data.token;
      if (u) {
        console.log(u);
        localStorage.setItem('token', u);
      }
      dispatch(signupSuccess(data.user));
    } catch (error) {
      console.error('Signup error:', error);
      dispatch(
        signupFailed(error.message || 'Network error, please try again!'),
      );
    }
  };
}

export const authenticateUser = (user) => {
  return (dispatch) => {
    dispatch({
      type: 'AUTHENTICATE_USER',
      user,
    });

    // Fetch friends immediately after authentication
    if (user?.id) {
      dispatch(fetchUserFriends(user.id));
    }
  };
};

export function logoutUser() {
  return {
    type: LOG_OUT,
  };
}

export function clearAuthState() {
  return {
    type: CLEAR_AUTH_STATE,
  };
}

export function editUserSuccesful(user) {
  return { type: EDIT_USER_SUCCESSFUL, user };
}

export function editUserFailed(error) {
  return { type: EDIT_USER_FAILED, error };
}

export function editUser(id, name, password, confirmPassword) {
  return (dispatch) => {
    const url = APIUrls.editProfile();

    console.log('Edit User Request:', {
      id,
      name,
      password,
      confirmPassword,
    });

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthTokenFromLocalStorage()}`,
      },
      body: JSON.stringify({
        id: id.toString(), // Ensure ID is string
        name,
        password,
        confirmPassword,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        console.log('Edit Profile Response:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Invalid email or password');
        }

        const token = data.token;
        if (token) {
          localStorage.setItem('token', token);
        }

        console.log('Updated user:', data.user);
        dispatch(editUserSuccesful(data.user));
      })
      .catch((error) => {
        console.error('Edit profile error:', error);
        dispatch(editUserFailed(error.message));
      });
  };
}

export function ClearSearch() {
  return {
    type: CLEAR_SEARCH,
  };
}

export function uploadProfilePicture(formData) {
  console.log("got image upload data: ",formData);
  return (dispatch) => {
    const url = APIUrls.uploadDP();
    const token = getAuthTokenFromLocalStorage();

    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // DO NOT set 'Content-Type'. The browser sets it automatically
        // for FormData, including the required boundary.
      },
      body: formData,
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Dispatch success action to update the user in the Redux store
        dispatch(editUserSuccesful(data.user));
        return;
      }
      // Dispatch failure action
      dispatch(editUserFailed(data.error));
    });
  };
}

export function fetchLoggedInUser() {
  return (dispatch) => {
    const url = APIUrls.fetchMe();
    const token = getAuthTokenFromLocalStorage();

    if (!token) {
      dispatch(logoutUser());
      return;
    }

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        dispatch(authenticateUser(data.user));
        return;
      }
      dispatch(logoutUser());
    });
  };
}