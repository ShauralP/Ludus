import React, { Component } from 'react';
import Header from './Header';
//import NotificationList from './NotificationList';
import UserInfoContainer from './UserInfoContainer';
import LpInfoContainer from './LpInfoContainer';
import NavBar from '../NavBar';
import './fullpage.css';

class ProfilePage extends Component {
  render() {
    return (
      <div className="fullPage">
        <NavBar /> <Header /> <UserInfoContainer /> <LpInfoContainer />
      </div>
    );
  }
}
export default ProfilePage;