import React, { Component } from 'react';
import FollowBtn from './FollowBtn';
import UnfollowBtn from './UnfollowBtn';
import NotificationList from './NotificationList';
import profilePic from './profilePic.jpg';
import TeacherFollowingList from '../FollowingList/TeacherFollowingList'
import { Route, Link, Switch } from 'react-router-dom';
import './header.css';

const Axios =require('axios');

class Header extends Component {
constructor(props) {
  super(props);
  this.state = {
<<<<<<< HEAD
<<<<<<< HEAD
    Name: 'nametest',
=======
    Name: 'database_error_fetching_name',
>>>>>>> e20ba76b5e4740098f83b118d0aae7db7ca444fb
=======
    Name: 'null',
>>>>>>> 7696a881c63a2ae99149fdab7f27156367e7849c
    Email: 'emailtest',
    DoB: 'dobtest',
    data: []
  }
}

<<<<<<< HEAD
componentDidMount() {
  Axios.get(`https://us-central1-ludusfire.cloudfunctions.net/users/-LNVWR9kD2dvN8GLGFYE/`)
=======
//get Logged in State, in progress
/*getUser(){
  var uid;
  var user = firebase.auth().currentUser;
  if(user){
    uid = user.uid;
    console.log(uid);
  }else {
    console.log("no uid found");
    uid = "-LNVWR9kD2dvN8GLGFYE"
  }

}

*/

componentDidMount() {
  Axios.get(`https://us-central1-ludusfire.cloudfunctions.net/users/${this.props.userID}/`)
  //Axios.get(`https://us-central1-ludusfire.cloudfunctions.net/users/{uid}/`) getting logged in state in progress
>>>>>>> e20ba76b5e4740098f83b118d0aae7db7ca444fb
  .then(({ data }) => {
    this.setState({
      Name: data.Name,
      Email: data.Email,
      DoB: data.DoB
    });
  })
}
  render() {
    return <div>{this.fetchData(this.props.userID)}</div>;
  }

  fetchData(userID) {
    //TODO: API Call for info on the class from database
    //axios.get('https://us-central1-ludusfire.cloudfunctions.net/classes/', { params: this.props.classID }).then( function(response){ name, lpath, ctype, rating } = response.body;} );
    return (
      <container>
        <span className="headerBox">
          <span className="ProfileBox">
              <img class="image" src={profilePic}/>
          </span>
          <div className="nameText">
            {this.state.Name}
          </div>
          <div className="followerBtn">
          {<FollowBtn />}
          </div>
          <div className="UnfollowerBtn">
          {<UnfollowBtn />}
          </div>
          <div className="notifications">
            {<NotificationList />}
          </div>
        </span>
      </container>

    );
  }
}

export default Header;
