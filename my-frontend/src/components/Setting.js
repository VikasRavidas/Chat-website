import image from '../components/img/images.png';
import React, { Component } from 'react';
import { connect } from 'react-redux';
// ✅ Import the new action we created
import { editUser, clearAuthState, uploadProfilePicture } from '../actions/auth';

// ✅ Define the root URL ONLY for displaying images from the backend.
// This should match the root URL of your backend server.
const API_ROOT_URL = 'https://chat-website-backend-4y4d.onrender.com';

class Settings extends Component {
  constructor(props) {
    super(props);

    // ✅ Correctly get the user from props to initialize state
    const { user } = this.props.auth;
    console.log("user of setting: ",user);
    // ✅ Correctly initialize all state properties
    this.state = {
      // User profile fields
      name: user.name || '',
      password: '',
      confirmPassword: '',
      editMode: false,

      // State for file upload
      file: null,
      previewUrl: user.avatar
        ? `${API_ROOT_URL}/${user.avatar.replace(/\\/g, '/')}`
        : image, 
      originalUrl: user.avatar
        ? `${API_ROOT_URL}/${user.avatar.replace(/\\/g, '/')}`
        : image,
    };
  }

  // ✅ ADDED: Handler for when a user selects a new file
  handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      this.setState({
        file: selectedFile,
        previewUrl: URL.createObjectURL(selectedFile), // Create a temporary URL for instant preview
      });
    }
  };

  // ✅ ADDED: Handler for cancelling the file selection
  handleCancelUpload = () => {
    this.setState({
      file: null,
      previewUrl: this.state.originalUrl, // Revert to the original image
    });
  };

  // ✅ ADDED: Handler for dispatching the upload action
  handlePictureSave = () => {
    const { file } = this.state;
    console.log("file: ",file);
    if (!file) return;

    const formData = new FormData();
    // 'profilePicture' MUST match the name in the backend route
    formData.append('profilePicture', file);
    for (let pair of formData.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
  }
    console.log("formdata before dispatch: ",formData);
    this.props.dispatch(uploadProfilePicture(formData));

    // After dispatching, reset the file state to hide the save/cancel buttons
    this.setState({ file: null });
  };

  // Handler for text input changes
  handleChange = (fieldName, val) => {
    this.setState({
      [fieldName]: val,
    });
  };

  // Handler for saving name/password changes
  handleSave = () => {
    const { name, password, confirmPassword } = this.state;
    const { user } = this.props.auth;
    this.props.dispatch(editUser(user.id, name, password, confirmPassword));
  };

  componentWillUnmount() {
    this.props.dispatch(clearAuthState());
  }

  render() {
    // ✅ Correctly destructure all needed variables from props and state
    const { user, error, inProgress } = this.props.auth;
    const { editMode, previewUrl, file } = this.state;

    return (
      <div className="settings">
        <div className="img-container">
          <label htmlFor="file-input">
            <img
              src={previewUrl}
              alt="user-dp"
              className="profile-avatar"
            />
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/png, image/jpeg"
            style={{ display: 'none' }}
            onChange={this.handleFileChange}
          />
        </div>

        {/* Conditionally show upload/cancel buttons */}
        {file && (
          <div className="btn-grp">
            <button
              className="button save-btn"
              onClick={this.handlePictureSave}
              disabled={inProgress}
            >
              {inProgress ? 'Uploading...' : 'Save Picture'}
            </button>
            <div className="go-back" onClick={this.handleCancelUpload}>
              Cancel
            </div>
          </div>
        )}

        {error && <div className="alert error-dailog">{error}</div>}
        {error === false && (
          <div className="alert success-dailog">
            Successfully updated profile!
          </div>
        )}
        <div className="field">
          <div className="field-label">Email</div>
          <div className="field-value">{user.email}</div>
        </div>

        <div className="field">
          <div className="field-label">Name</div>
          {editMode ? (
            <input
              type="text"
              onChange={(e) => this.handleChange('name', e.target.value)}
              value={this.state.name}
            />
          ) : (
            <div className="field-value">{user.name}</div>
          )}
        </div>

        {editMode && (
          <div className="field">
            <div className="field-label">New password</div>
            <input
              type="password"
              onChange={(e) => this.handleChange('password', e.target.value)}
              value={this.state.password}
            />
          </div>
        )}

        {editMode && (
          <div className="field">
            <div className="field-label">Confirm password</div>
            <input
              type="password"
              onChange={(e) =>
                this.handleChange('confirmPassword', e.target.value)
              }
              value={this.state.confirmPassword}
            />
          </div>
        )}

        <div className="btn-grp">
          {editMode ? (
            <button
              className="button save-btn"
              onClick={this.handleSave}
              disabled={inProgress}
            >
              {inProgress ? 'Saving...' : 'Save'}
            </button>
          ) : (
            <button
              className="button edit-btn"
              onClick={() => this.handleChange('editMode', true)}
            >
              Edit Profile
            </button>
          )}

          {editMode && (
            <div
              className="go-back"
              onClick={() => this.handleChange('editMode', false)}
            >
              Go back
            </div>
          )}
        </div>
      </div>
    );
  }
}

function mapStateToProps({ auth }) {
  return {
    auth,
  };
}
export default connect(mapStateToProps)(Settings);