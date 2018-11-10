import React, { Component } from 'react';
import ReactDataGrid from 'react-data-grid';
import axios from 'axios';

const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');

class Grid extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      rows: [],
      filters: {}
    };
  }

  componentWillMount() {
    axios.get( 'http://127.0.0.1:4000/unemp' )
      .then( response => {
        console.log('response', response);
      })
  }

  getSize = () => {
    return this.getRows().length;
  };

  getRows = () => {
    return Selectors.getRows(this.state);
  };

  rowGetter = (rowIdx) => {
    // return this._rows[ i ];
    let rows = this.getRows();
    return rows[rowIdx];
  };

  handleFilterChange = (filter) => {
    let newFilters = Object.assign({}, this.state.filters);
    if (filter.filterTerm) {
      newFilters[filter.column.key] = filter;
    } else {
      delete newFilters[filter.column.key];
    }
    // console.log('newFilters', newFilters);
    this.setState({ filters: newFilters });
  };

  onClearFilters = () => {
    // all filters removed
    this.setState({filters: {} });
  };

  render() {
    if ( this._rows ) {
      return  (
        <ReactDataGrid
          columns={this._columns}
          rowGetter={this.rowGetter}
          rowsCount={this.getSize()}
          minHeight={600}
          minColumnWidth={120}
          toolbar={<Toolbar enableFilter={ true } />}
          onAddFilter={this.handleFilterChange}
          onClearFilters={this.onClearFilters} />);
    } else {
      return 'Hi there';
    }
  }
}

export default Grid;
