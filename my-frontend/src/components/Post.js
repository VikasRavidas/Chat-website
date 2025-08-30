import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Comment from './Comment';
import { createComment } from '../actions/posts';
import image from '../components/img/images.png';
import like_icon from '../components/img/love.jpeg';
import comment_icon from '../components/img/comment_icon.png';
import { addLike } from '../actions/posts';
import { fetchUserProfile } from '../actions/profile';

class Post extends Component {
  constructor(props) {
    super(props);
    this.state = {
      comment: '',
      postUser: null,
    };
  }

  componentDidMount() {
    // Fetch user details when component mounts
    this.fetchPostUser();
  }

  componentDidUpdate(prevProps) {
    // Fetch user details if post user ID changes
    if (prevProps.post.user.id !== this.props.post.user.id) {
      this.fetchPostUser();
    }
  }

  fetchPostUser = () => {
    const { post } = this.props;
    if (post.user.id) {
      this.props.dispatch(fetchUserProfile(post.user.id));
    }
  };

  handleAddComment = (e) => {
    const { comment } = this.state;
    const { post } = this.props;

    if (e.key === 'Enter') {
      this.props.dispatch(createComment(comment, post.id));
      this.setState({ comment: '' });
    }
  };

  handleOnCommentChange = (e) => {
    this.setState({ comment: e.target.value });
  };

  handlePostLike = () => {
    const { post, user } = this.props;
    this.props.dispatch(addLike(post.id, 'post', user.id));
  };

  render() {
    const { post, user, profile } = this.props;
    const { comment } = this.state;
    const isPostLikedByUser = post.likes.includes(user.id);
    const postUser = post.user || { name: 'Loading...' };

    return (
      <div className="post-wrapper" key={post.id}>
        <div className="post-header">
          <div className="post-avatar">
            <Link to={`/user/${post.user.id}`}>
              <img src={image} alt="user-pic" />
            </Link>
            <div>
              <span className="post-author">{postUser.name}</span>
              <span className="post-time">a minute ago</span>
            </div>
          </div>
          <div className="post-content">{post.content}</div>

          <div className="post-actions">
            <button className="post-like no-btn" onClick={this.handlePostLike}>
              {isPostLikedByUser ? (
                <img src={like_icon} alt="like post" />
              ) : (
                <img src={like_icon} alt="likes-icon" />
              )}
              <span>{post.likes.length}</span>
            </button>

            <div className="post-comments-icon">
              <img src={comment_icon} alt="comments-icon" />
              <span>{post.comments.length}</span>
            </div>
          </div>
          <div className="post-comment-box">
            <input
              placeholder="Start typing a comment"
              onChange={this.handleOnCommentChange}
              onKeyPress={this.handleAddComment}
              value={comment}
            />
          </div>

          <div className="post-comments-list">
            {post.comments.map((comment) => (
              <Comment comment={comment} key={comment.id} postId={post.id} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

Post.propTypes = {
  post: PropTypes.object.isRequired,
};

function mapStateToProps({ auth, profile }) {
  return {
    user: auth.user,
    profile,
  };
}

export default connect(mapStateToProps)(Post);
