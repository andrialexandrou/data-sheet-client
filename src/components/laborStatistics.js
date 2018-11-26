import React, { Component } from 'react';
import ReactDataGrid from 'react-data-grid';
import axios from 'axios';
import _ from 'lodash';

const {
  Toolbar,
  Data: { Selectors },
  Filters
} = require('react-data-grid-addons');

const {
  // NumericFilter,
  // AutoCompleteFilter,
  // MultiSelectFilter,
  SingleSelectFilter
} = Filters;

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

function createFilename() {
  const now = new Date();
  const filename = `LAUS_${ 1900 + now.getYear() }-${ now.getMonth() }-${ now.getDate() }.csv`;
  return filename;
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
        width: 160,
        index: 0
      },
      {
        key: 'series_title',
        name: 'Series Title',
        filterable: false,
        resizable: true,
        width: 160,
        index: 1
      },
      {
        key: 'series_id',
        name: 'Series ID',
        filterable: true,
        resizable: true,
        width: 200,
        index: 2
      },
      {
        key: 'period',
        name: 'Period',
        filterable: true,
        resizable: true,
        width: 150,
        index: 3
      },
      {
        key: 'label',
        name: 'Label',
        filterable: true,
        resizable: true,
        width: 150,
        index: 4
      },
      {
        key: 'seasonality_enum',
        name: 'Seasonality',
        filterable: true,
        filterRenderer: SingleSelectFilter,
        resizable: true,
        width: 100,
        index: 5
      },
      {
        key: 'area',
        name: 'Area',
        filterable: true,
        resizable: true,
        width: 350,
        index: 6
      },
      {
        key: 'area_type',
        name: 'Area Type',
        filterable: true,
        filterRenderer: SingleSelectFilter,
        resizable: true,
        width: 160,
        index: 7
      },
      {
        key: 'measure_type',
        name: 'Measure Type',
        filterable: true,
        filterRenderer: SingleSelectFilter,
        resizable: true,
        width: 160,
        index: 8
      },
      {
        key: 'value',
        name: 'Value',
        filterable: true,
        resizable: true,
        width: 200,
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
      path += '/download'
    }
    if ( query ) {
      path += query;
    }

    axios.get( path )
      .then( response => {
        if ( isForDownload ) {
          var headers = response.headers;
          var blob = new Blob([response.data],{type:headers['content-type']});
          var link = document.createElement('a');
          link.style.display = 'none';
          link.href = window.URL.createObjectURL(blob);
          link.download = createFilename();
          link.click();
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

  getValidFilterValues = (rows, columnId) => {
    const stuff = [];
    switch( columnId ) {
      case 'seasonality_enum':
        stuff.push('S');
        stuff.push('U');
        break;
      case 'area_type':
        stuff.push('Statewide');
        stuff.push('Metropolitan areas');
        stuff.push('Metropolitan divisions');
        stuff.push('Micropolitan areas');
        stuff.push('Combined areas');
        stuff.push('Counties and equivalents');
        stuff.push('Cities and towns above 25,000 population');
        stuff.push('Cities and towns below 25,000 population in New England');
        stuff.push('Parts of cities that cross county boundaries');
        stuff.push('Multi-entity small labor market areas');
        stuff.push('Intrastate parts of interstate areas');
        stuff.push('Balance of state areas');
        stuff.push('Census regions');
        stuff.push('Census divisions');
        break;
      case 'measure_type':
        stuff.push('Unemployment Rate');
        stuff.push('Unemployment');
        stuff.push('Employment');
        stuff.push('Labor Force');
        break;
      default:
        break;
    }
    return stuff;
  };

  handleFilterChange = _.debounce( (filter) => {
    let newFilters = Object.assign({}, this.state.filters);

    if ( !filter.filterTerm ) {
      delete newFilters[filter.column.key];
    } else {
      const columnKey = filter.column.key;
      const value = filter.filterTerm.value || filter.filterTerm;
      newFilters[ columnKey ] = {
        column: filter.column,
        filterTerm: value
      };
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
        <button onClick={ this.download }>
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
            getValidFilterValues={columnKey => this.getValidFilterValues(null, columnKey)}
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
