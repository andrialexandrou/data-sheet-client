import React, { Component } from 'react';
import ReactDataGrid from 'react-data-grid';
import axios from 'axios';

const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');

class Grid extends Component {
  constructor(props, context) {
    super(props, context);

    this._columns = [
      {
        key: 'survey_name',
        name: 'Survey Name',
        filterable: true,
        resizable: true,
        index: 0
      },
      {
        key: 'series_title',
        name: 'Series Title',
        filterable: true,
        resizable: true,
        index: 1
      },
      {
        key: 'series_id',
        name: 'Series ID',
        filterable: true,
        resizable: true,
        index: 2
      },
      {
        key: 'period',
        name: 'Period',
        filterable: true,
        resizable: true,
        index: 3
      },
      {
        key: 'label',
        name: 'Label',
        filterable: true,
        resizable: true,
        index: 4
      },
      {
        key: 'seasonality_enum',
        name: 'Seasonality',
        filterable: true,
        resizable: true,
        index: 5
      },
      {
        key: 'area',
        name: 'Area',
        filterable: true,
        resizable: true,
        index: 6
      },
      {
        key: 'area_type',
        name: 'Area Type',
        filterable: true,
        resizable: true,
        index: 7
      },
      {
        key: 'measure_type',
        name: 'Measure Type',
        filterable: true,
        resizable: true,
        index: 8
      },
      {
        key: 'value',
        name: 'Value',
        filterable: true,
        resizable: true,
        index: 9
      }
    ];

    this.state = {
      rows: [],
      filters: {}
    };
  }

  componentWillMount() {
    axios.get( `http://${ window.location.hostname }:4000/laus` )
      .then( response => {
        this._rows = response.data;
        const lastItem = response.data[response.data.length - 1];
        if ( lastItem.hasMoreResults ) {

        }
        this.setState({rows: this._rows});
      })
      .catch( err => {
        console.log('It looks like something in the backend is down. Try restarting the server or the database server.\n', err);
      })
  }

  getSize = () => {
    return this.getRows().length;
  };

  getRows = () => {
    return Selectors.getRows(this.state);
  };

  rowGetter = (rowIdx) => {
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
      return null;
    }
  }
}

export default Grid;
