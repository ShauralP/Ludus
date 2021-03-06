import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import NotificationList from './NotificationList';
import SimilarCompletedList from './DashboardLps/SimilarCompletedList';
import SimilarOthersList from './DashboardLps/SimilarOthersList';
import './Dashboard.css';

class Dashboard extends Component {
  render() {
    if (this.props.userID === '') {
      return <Redirect to={'/'} />;
    } else {
      return (
        <div>
          <h1>Dashboard</h1> <br />
          <div className="DashWrapper">
            <div className="Learn">
              <h3>Learn</h3>
              <Link to="/student-lplist">Enrolled Learning Paths</Link> <br />
              <Link to="/all-lp-list">Browse Learning Paths</Link> <br />
              <Link to="/class-search">Search Classes</Link> <br />
              <Link to="/bookmarks">Bookmarks</Link> <br />
            </div>
            <div className="Teach">
              <h3>Teach</h3>
              <Link to="/teacher-classlist">Your Classes</Link> <br />
              <Link to="/teacher-lplist">Learning Paths</Link> <br />
              <Link to="/classCreate">Create a Class</Link> <br />
              <Link to="/teacher-lp-create">Create a Learning Path</Link> <br />
            </div>
          </div>
          <div className="DashWrapper">
            <div className="Recommendations">
              <h3>Suggested Classes</h3>
            </div>
            <div className="Notifications">
              <h3>Notifications</h3>
              <NotificationList userID={this.props.userID} />
            </div>
          </div>
          <div className="DashWrapper">
            <div className="Recommendations">
              <h3>Similar Completed</h3>
              <SimilarCompletedList userID={this.props.userID} />
            </div>
            <div className="SimilarOthers">
              <h3>Similar to Others</h3>
              <SimilarOthersList userID={this.props.userID} />
            </div>
          </div>
        </div>
      );
    }
  }
}
export default Dashboard;
