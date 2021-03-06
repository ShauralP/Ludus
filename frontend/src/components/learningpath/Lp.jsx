import React, { Component } from 'react';
import './Lp.css';

class Lp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      Name: '',
      Owner: '',
      Mature: 'no',
      classlist: []
    };
  }

  render() {
    return <div>{this.fetchData(this.props.LearningPathID)}</div>;
  }

  fetchData(LearningPathID) {
    var index = this.props.i;
    var obj = this.props.LearningPathID[index];
    console.log(index);
    console.log('in child', obj);
    //TODO: API Call for info on the lp from database
    if (!obj) {
      return <text>empty</text>;
    }
    if (this.props.LearningPathID[index][1].Classes) {
      return (
        <span>
          <span className="lpInfo">
            <span>
              {'LearningPath:'} {this.props.LearningPathID[index][1].Name}
            </span>
            <div>Topic: {this.props.LearningPathID[index][1].Topic} </div>
            <div>
              First Class: {this.props.LearningPathID[index][1].Classes[0]}{' '}
            </div>
          </span>
        </span>
      );
    }
    if (!this.props.LearningPathID[index][1].Classes) {
      return (
        <span>
          <span className="lpInfo">
            <span>
              {'LearningPath:'} {this.props.LearningPathID[index][1].Name}
            </span>
            <div>Topic: {this.props.LearningPathID[index][1].Topic} </div>
            <div>First Class: {'No Classes in LP'} </div>
          </span>
        </span>
      );
    }
  }
}

export default Lp;
