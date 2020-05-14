import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import './bootstrap.min.css';

class App extends Component {
  render() {
    return (
      <div onClick={this.props.onClick}>Welcome to Gang Wars: {this.props.clicks}</div>
    );
  }
}

export default App;
