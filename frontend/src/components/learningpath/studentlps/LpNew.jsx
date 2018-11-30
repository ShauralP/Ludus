import React, { Component } from 'react';
import '../Lp.css';
const Axios = require('axios');


class LpNew extends Component {
  constructor(props) {
    super(props);
    this.state = {
      length: 0,
      topic: 'no topic',
      name: 'error',
      data: []
    };
  }
  render() {
    return <div>{this.fetchData(this.props.LearningPathID)}</div>;
  }

  componentDidMount() {
  	 Axios.get(`https://us-central1-ludusfire.cloudfunctions.net/learningPath/${this.props.LearningPathID}`)
     .then(({ data }) => {
        console.log(data);
        this.setState({
          data: data,
          name: data.Name,
          topic: data.Topic
  			 });
         if(this.data.Classes.length){
           this.setState({
             length: data.Classes.length
           })
           .catch(function(err){
             console.log(err);
           });
         }
  	  })
      .catch(function(err){
        console.log(err);
      });
  	}

  fetchData(LearningPathID) {
		var index = this.props.i;
    var obj = this.props.LearningPathID;
    console.log(index);
    console.log('in child', obj);
    //TODO: API Call for info on the lp from database
    if (!obj) {
      return <text>empty</text>;
    }
    if (this.state.length > 0) {
      return (
        <container>
          <span className="lpInfo">
            <span>
              {'LearningPath:'} {this.state.name}
            </span>
            <div>Topic: {this.state.topic} </div>
            <div>
              First Class: {this.state.data.Classes[0]}{' '}
            </div>
          </span>
        </container>
      );
    }
    if (this.state.length === 0) {
      return (
        <container>
          <span className="lpInfo">
            <span>
              {'LearningPath:'} {this.state.name}
            </span>
            <div>Topic: {this.state.topic} </div>
            <div>First Class: {'No Classes in LP'} </div>
          </span>
        </container>
      );
    }
  }
}

export default LpNew;
