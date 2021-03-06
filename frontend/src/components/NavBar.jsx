import React, { Component } from 'react';
import { Navbar, Nav, NavItem, MenuItem, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './NavBar.css';

class NavBar extends Component {
  render() {
    if (this.props.userID) {
      return (
        <div className="Bar">
          <Navbar fixedTop>
            <Navbar.Header>
              <Navbar.Brand>
                <h1>
                  <Link to="/">Ludus</Link>
                </h1>
              </Navbar.Brand>
            </Navbar.Header>
            {/* <Navbar.Collapse> */}
            <div>
              <Link to="/profile">Profile</Link> <br />
              <Link to="/bookmarks">Bookmarks</Link> &nbsp;
            </div>
            {/* </Navbar.Collapse> */}
          </Navbar>
        </div>
      );
    } else {
      return (
        <div className="Bar">
          <Navbar fixedTop>
            <Navbar.Header>
              <Navbar.Brand>
                <Link to="/">Ludus</Link>
              </Navbar.Brand>
            </Navbar.Header>
            {/* <Navbar.Collapse> */}
            <Nav>
              <NavItem eventKey={1} href="#">
                <Link to="/signup">Sign Up</Link> <br />
              </NavItem>
              <NavItem eventKey={2} href="#">
                <Link to="/login">Log In</Link>
              </NavItem>
            </Nav>
            {/* </Navbar.Collapse> */}
          </Navbar>
        </div>
      );
    }
  }
}

export default NavBar;
