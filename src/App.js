import React, { Component } from 'react';

import './App.css';
import LaborGrid from "./components/laborStatistics";
import UnemploymentGrid from "./components/unemployment";

class App extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
      grid: 'unemployment'
    };

    this.handleClick = this.handleClick.bind(this);
    this.showGrid = this.showGrid.bind(this);
  }

  handleClick( prompt ) {
    this.setState({
      grid: prompt
    })
  }

  showGrid() {
    if ( this.state.grid === 'labor' ) {
      return <LaborGrid />
    } else if ( this.state.grid === 'unemployment' ) {
      return <UnemploymentGrid />
    }
  }

  render() {
    return (
      <div>
        <button onClick={() => this.handleClick('labor')}>
          National and Local Labor Force Statistics
        </button>
        <button onClick={() => this.handleClick('unemployment')}>
          Current Employment
        </button>
        { this.showGrid() }
      </div>
    );
  }
}

export default App;
