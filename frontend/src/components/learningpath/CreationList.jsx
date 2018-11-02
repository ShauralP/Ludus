import React, { Component } from 'react';
import Class from '../class/Class';

class CreationList extends Component {
  handleRemoveButton = e => {
    this.props.callback(e.target.value);
  };

  createClasslist = () => {
    let classlist = this.props.classIDs;
    var classes = [];
    for (let id in classlist) {
      if (classlist[id] === undefined) return;
      classes.push(
        <div key={classlist[id]} className="ClassObject">
          {<Class classID={classlist[id]} />}
          <span className="Highlight">
            <button onClick={this.handleRemoveButton} value={classlist[id]}>
              Remove
            </button>{' '}
          </span>
        </div>
      );
    }

    return classes;
  };

  render() {
    return <div className="Classlist">{this.createClasslist()}</div>;
  }
}

export default CreationList;