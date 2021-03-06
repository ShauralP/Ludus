import React, { Component } from 'react';
import Class from './Class';
const Axios = require('axios');

class ClassSearch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      owner: '',
      content: '',
      tag: '',
      mature: 'no',
      classList: [],
      classInfo: []
    };
    this.submitSearch = this.submitSearch.bind(this);
  }

  createClasslist = () => {
    let query = '?';
    let multi = 0;
    if (this.state.name.toString().length) {
      query += 'name=' + this.state.name;
      multi = 1;
    }
    if (this.state.owner.toString().length) {
      if (multi) query += '&';
      query += 'owner=' + this.state.owner;
      multi = 1;
    }
    if (this.state.content.toString().length) {
      if (multi) query += '&';
      query += 'content_type=' + this.state.content;
      multi = 1;
    }
    if (this.state.tag.toString().length) {
      if (multi) query += '&';
      query += 'tag=' + this.state.tag;
    }
    if (this.state.mature == 'yes') {
      if (multi) query += '&';
      query += 'mature=yes';
    }
    Axios.get(
      `https://us-central1-ludusfire.cloudfunctions.net/classes/search/${query}`
    )
      .then(response => {
        console.log(response);
        let classList = [];
        let classInfo = [];
        for (let id in response.data) {
          classList.push(response.data[id][0]);
          classInfo.push(response.data[id][1]);
        }
        this.setState({ classIDList: classList, classInfo: classInfo });
        this.submitSearch();
      })
      .catch(function(error) {
        console.log(error);
      });
    return;
  };

  submitSearch = () => {
    if (this.state.classIDList === undefined || !this.state.classIDList) return;
    let classes = [];
    for (let id in this.state.classIDList) {
      if (this.state.classIDList[id] === undefined) return;
      classes.push(
        <div className="ClassObject" key={id}>
          {
            <Class
              classID={this.state.classIDList[id]}
              classInfo={this.state.classInfo[id]}
            />
          }
        </div>
      );
    }
    return classes;
  };

  handleMatureCheck = event => {
    console.log(this.state.mature === 'no');
    if (event.target.checked) {
      this.setState({ mature: 'yes' });
    } else {
      this.setState({ mature: 'no' });
    }
    console.log(this.state.mature);
  };

  render() {
    return (
      <div>
        <h1>Search Classes...</h1> <br />
        <form className="SignUpForm">
          <br />
          By Name:&nbsp;
          {'\t\t'}
          <input
            className="inLine"
            type="text"
            onChange={event => this.setState({ name: event.target.value })}
          />
          <br /> <br />
          By Owner:&nbsp;
          <input
            className="inLine"
            type="text"
            onChange={event => this.setState({ owner: event.target.value })}
          />
          <br /> <br />
          By Content Type:&nbsp;
          <input
            className="inLine"
            type="text"
            onChange={event => this.setState({ content: event.target.value })}
          />
          <br /> <br />
          By Tag:&nbsp;
          <input
            className="inLine"
            type="text"
            onChange={event => this.setState({ tag: event.target.value })}
          />
          <br /> <br />
          Mature Content Filter:&nbsp;
          <input
            className="check"
            type="checkbox"
            onChange={event => this.handleMatureCheck(event)}
          />
          <br /> <br />
          <input
            className="centered"
            type="button"
            id="submitbutton"
            value="Search"
            onClick={this.createClasslist}
          />
        </form>
        {this.submitSearch()}
      </div>
    );
  }
}

export default ClassSearch;
