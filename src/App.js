import React, { Component } from 'react';

import './App.css';
import Grid from "./components/reactDataGrid";

class App extends Component {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    return (
      <div>
        <div>
          HELLO WORLD
        </div>
        <Grid />
      </div>
    );
  }
}

export default App;
