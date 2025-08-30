import { FETCH_SEARCH_RESULTS_SUCCESS } from './actionTypes';
import { getAuthTokenFromLocalStorage } from '../helpers/utils';
import { APIUrls } from '../helpers/urls';

// This is the main search thunk that gets dispatched
export default function searchUsers(searchText) {
  return (dispatch) => {
    // ✅ CORRECTED: Pass the search text to build the proper URL
    const url = APIUrls.userSearch(searchText);

    // ✅ CORRECTED: Removed method and body, fetch defaults to GET
    fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthTokenFromLocalStorage()}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('SEARCH data', data);
        if (data.success) {
          // The backend returns { data: { users: [...] } }
          dispatch(searchResultsSuccess(data.data.users));
        } else {
          dispatch(searchResultsSuccess([]));
        }
      })
      .catch((error) => {
        console.log('search error: ', error);
        dispatch(searchResultsSuccess([])); // Also clear on error
      });
  };
}

// This is the success action creator
export function searchResultsSuccess(users) {
  return {
    type: FETCH_SEARCH_RESULTS_SUCCESS,
    users,
  };
}
