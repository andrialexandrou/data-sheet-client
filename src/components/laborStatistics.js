import React, { Component } from 'react';
import ReactDataGrid from 'react-data-grid';
import axios from 'axios';
import _ from 'lodash';

const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');

function buildQueryString( filters ) {
  let query = '?';
  _.forEach(filters, filter => {
    var filterLabel = filter.column.key;
    var filterValue = filter.filterTerm;
    const thisQuery = `${ filterLabel }=${ filterValue }&`;
    query += thisQuery;
  })
  return query;
}

class Grid extends Component {
  constructor(props, context) {
    super(props, context);

    this._columns = [
      {
        key: 'survey_name',
        name: 'Survey Name',
        filterable: false,
        resizable: true,
        index: 0
      },
      {
        key: 'series_title',
        name: 'Series Title',
        filterable: false,
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

  getFromServer( query, isForDownload ) {
    let path = `http://${ window.location.hostname }:4000/laus`;
    if ( isForDownload ) {
      return;
    }
    if ( query ) {
      path += query;
    }

    axios.get( path )
      .then( response => {
        if ( isForDownload ) {
          // do nthing
          // document.getElementById('howdy').src
        } else {
          this._rows = response.data;
          const lastItem = response.data[response.data.length - 1];
          if ( lastItem && lastItem.hasMoreResults ) {

          }
          this.setState({rows: this._rows});
        }
      })
      .catch( err => {
        console.log('Resource not available.\n', err);
      })
  }

  componentWillMount() {
    this.getFromServer();
  }

  requestFromAPI = ( isForDownload ) => {
    const queryString = buildQueryString( this.state.filters );
    this.getFromServer( queryString, isForDownload );
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

  handleFilterChange = _.debounce( (filter) => {
    let newFilters = Object.assign({}, this.state.filters);
    if (filter.filterTerm) {
      newFilters[filter.column.key] = filter;
    } else {
      delete newFilters[filter.column.key];
    }

    this.setState({ filters: newFilters }, this.requestFromAPI);
  }, 500 );

  onClearFilters = () => {
    // all filters removed
    this.setState({filters: {} }, this.requestFromAPI);
  };

  download = () => {
    this.requestFromAPI( true );
  };

  pleaseHold = () => {
    alert('Still in development! Come back in a few days?')
  };

  Test = () => {
    if ( _.isEmpty( this.state.filters ) ) {
      return (
        <button disabled>
          Please select some stuff and then you can download
        </button>
      );
    } else {
      return (
        <button onClick={ this.pleaseHold }>
          Download current view.
        </button>
      );
    }
  }

  render() {
    if ( this._rows ) {
      return  (
        <div>
          <this.Test />


          <ReactDataGrid
            columns={this._columns}
            rowGetter={this.rowGetter}
            rowsCount={this.getSize()}
            minHeight={600}
            minColumnWidth={120}
            toolbar={<Toolbar enableFilter={ true } />}
            onAddFilter={this.handleFilterChange}
            onClearFilters={this.onClearFilters} />
          </div>
      );
    } else {
      return null;
    }
  }
}

export default Grid;
