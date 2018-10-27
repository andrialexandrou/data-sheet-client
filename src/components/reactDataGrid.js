import React, { Component } from 'react';
import ReactDataGrid from 'react-data-grid';
import axios from 'axios';

const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');

class Grid extends Component {
  constructor(props, context) {
    console.log('props', props);
    console.log('context', context);
    super(props, context);

    this._columns = [
      {
        key: 'area',
        name: 'Area',
        filterable: true,
        resizable: true
      },
      {
        key: 'area_type',
        name: 'Area Type',
        filterable: true,
        resizable: true
      },
      {
        key: 'measure_type',
        name: 'Measure Type',
        filterable: true,
        resizable: true
      },
      {
        key: 'period',
        name: 'Period',
        filterable: true,
        resizable: true
      },
      {
        key: 'seasonality_enum',
        name: 'Seasonality',
        filterable: true,
        resizable: true
      },
      {
        key: 'series_id',
        name: 'Series ID',
        filterable: true,
        resizable: true
      },
      {
        key: 'series_title',
        name: 'Series Title',
        filterable: true,
        resizable: true
      },
      {
        key: 'survey_name',
        name: 'Survey Name',
        filterable: true,
        resizable: true
      },
      {
        key: 'value',
        name: 'Value',
        filterable: true,
        resizable: true
      },
      {
        key: 'label',
        name: 'Label',
        filterable: true,
        resizable: true
      }
    ];

    this.state = {
      rows: [],
      filters: {}
    };
  }

  componentWillMount() {
    axios.get( 'http://127.0.0.1:4000/laus' )
      .then( response => {
        this._rows = response.data;
        console.log('response.data', response);
        const lastItem = response.data[response.data.length - 1];
        console.log('lastItem', lastItem);
        if ( lastItem.hasMoreResults ) {
          console.log('HELLO I HAVE MORE');
          
        }
        this.setState({rows: this._rows});
      })
      .catch( err => {
        console.log('dunno, maybe network down', err);
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
      return null;
    }
  }
}

export default Grid;
