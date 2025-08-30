import { APIUrls } from '../helpers/urls';
import { getAuthTokenFromLocalStorage } from '../helpers/utils';
import {
  FETCH_FRIENDS_SUCCESS,
  ADD_FRIEND,
  REMOVE_FRIEND,
} from './actionTypes';



// Action creator for success
export function fetchFriendsSuccess(friends) {
  return {
    type: FETCH_FRIENDS_SUCCESS,
    friends,
  };
}

// Thunk to fetch friends from the API
export function fetchUserFriends() {
  return async (dispatch) => {
    const url = APIUrls.fetchFriends();
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthTokenFromLocalStorage()}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        dispatch(fetchFriendsSuccess(data.friends));
        return;
      }

      // Handle error case if needed
      dispatch(fetchFriendsSuccess([])); // Dispatch empty array on failure

    } catch (error) {
      console.error('Error fetching friends:', error);
      dispatch(fetchFriendsSuccess([])); // Dispatch empty array on error
    }
  };
}


export function addFriend(friend) {
  return {
    type: ADD_FRIEND,
    friend,
  };
}
export function removeFriend(id) {
  return {
    type: REMOVE_FRIEND,
    id,
  };
}
