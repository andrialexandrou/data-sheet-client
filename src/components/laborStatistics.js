import React, { Component } from 'react';
import ReactDataGrid from 'react-data-grid';
import { WithContext as ReactTags } from 'react-tag-input';
import axios from 'axios';
import _ from 'lodash';

import GeoSuggest from './geoSuggest';

const {
  Toolbar,
  Data: { Selectors }
} = require('react-data-grid-addons');

function buildQueryString( filters ) {
  let query = '?';
  _.forEach(filters, (filter, key) => {
    var filterLabel = key;
    var filterValue = filter.join('|');
    const thisQuery = `${ filterLabel }=${ filterValue }&`;
    query += thisQuery;
  });
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
        width: 160
      },
      {
        key: 'series_title',
        name: 'Series Title',
        width: 160
      },
      {
        key: 'series_id',
        name: 'Series ID',
        width: 200
      },
      {
        key: 'period',
        name: 'Period',
        width: 150
      },
      {
        key: 'label',
        name: 'Label',
        width: 150
      },
      {
        key: 'seasonality_enum',
        name: 'Seasonality',
        width: 100
      },
      {
        key: 'area',
        name: 'Area',
        width: 350
      },
      {
        key: 'area_type',
        name: 'Area Type',
        width: 160
      },
      {
        key: 'measure_type',
        name: 'Measure Type',
        width: 160
      },
      {
        key: 'value',
        name: 'Value',
        width: 200
      }
    ];

    this.seasonalityEnums = [ {
      key: 'S',
      note: '(seasonally adjusted)'
    }, {
      key: 'U',
      note: '(not adjusted)'
    }];
    this.areaTypes = [
      'National',
      'Statewide',
      'Metropolitan areas',
      'Metropolitan divisions',
      'Micropolitan areas',
      'Combined areas',
      'Counties and equivalents',
      'Cities and towns above 25,000 population',
      'Cities and towns below 25,000 population in New England',
      'Parts of cities that cross county boundaries',
      'Multi-entity small labor market areas',
      'Intrastate parts of interstate areas',
      'Balance of state areas',
      'Census regions',
      'Census divisions'
    ];
    this.measureTypes = [
      'Unemployment Rate',
      'Unemployment',
      'Employment',
      'Labor Force'
    ];

    this.state = {
      showFilters: false,
      rows: [],
      filters: {},
      tags: {}
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
          this.setState({isWaitingForDownload: false})
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

  onClearFilters = () => {
    // all filters removed
    this.setState({
      filters: {},
      tags: {}
    }, this.requestFromAPI);
  };

  download = () => {
    this.setState({isWaitingForDownload:true});
    this.requestFromAPI( true );
  };

  pleaseHold = () => {
    alert('Still in development! Come back in a few days?')
  };

  handleClick = e => {
    // return;
    const isInside = e.target.offsetParent && e.target.offsetParent.className === 'filter-pane'
    if ( isInside ) {
      return;
    }
    this.closeFilters();
  };

  closeFilters = () => {
    document.removeEventListener('mousedown', this.handleClick, false);
    this.setState({
      showFilters: false
    })
  };

  openFilters = () => {
    document.addEventListener('mousedown', this.handleClick, false);
    this.setState({
      showFilters: true
    });
  };

  findKey = ( value ) => {
    let key = "";

    const isMeasureType = this.measureTypes.find( type => type === value );
    const isSeasonalityType = this.seasonalityEnums.find( type => type.key === value );
    const isAreaType = this.areaTypes.find( type => type === value );
    if ( isMeasureType ) {
      key = "measure_type";
    } else if ( isSeasonalityType ) {
      key = "seasonality_enum";
    } else if ( isAreaType ) {
      key = "area_type"
    }
    return key;
  }

  handleChange = event => {
    const { filters } = this.state;
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    if ( target.type === "checkbox" ) {
      const key = this.findKey( name );

      if ( value ) {
        // being checked
        filters[ key ] = _.uniq( ( filters[ key ] || [] ).concat( name ) );
      } else {
        // being unchecked
        filters[ key ] = _.uniq( filters[ key ].filter( index => index !== name ) );
        if ( filters[ key ].length === 0 ) {
          // to disable the download button.
          delete filters[ key ];
        }
      }
    }

    this.setState({
      filters: filters
    });
  }

  handleTagDelete = (i, key) => {
    if ( !this.state.tags.area || this.state.tags.area.length === 0 ) {
      return;
    }

    if ( i === 'last' && key === 'area' ) {
      i = this.state.tags.area.length - 1;
    }
    const { filters, tags } = this.state;
    if ( !filters[ key ] ) {
      return;
    }
    filters[ key ] = filters[key].filter((tag, index) => index !== i);
    if ( filters[ key ].length === 0 ) {
      // to disable the download button.
      delete filters[ key ];
    }
    tags[ key ] = tags[key].filter((tag, index) => index !== i);
    this.setState({
      filters: filters,
      tags: tags
    });
  };

  handleTagAdd = (tag, category) => {
    const { filters, tags } = this.state;
    filters[ category ] = ( filters[ category ] || [] ).concat( tag.text );
    tags[ category ] = ( tags[ category ] || [] ).concat( tag );
    this.setState({
      filters: filters,
      tags: tags
    });
  };

  DownloadButton = () => {
    if ( _.isEmpty( this.state.filters ) ) {
      return (
        <button disabled>
          Select some stuff below and then you can download.
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

  isChecked = (key, name) => {
    return this.state.filters[key] &&
      this.state.filters[key].includes(name);
  }

  makeCheckboxes = (key, names) => {
    const rows = [];
    let count = 0;
    names.forEach( value => {
      let name = '';
      let supplemental = '';

      if ( typeof value == 'object' ) {
        name = value.key;
        supplemental = value.note;
      } else {
        name = value;
      }

      rows.push(<div key={ count }>
          <label>
          <input
            name={ name }
            type="checkbox"
            checked={this.isChecked( key, name )}
            onChange={this.handleChange} />
            &nbsp;{ name } { supplemental }
        </label>
      </div>);
      count++
    } );

    return <div>{ rows }</div>
  }

  FormButtons = () => {
    return (
      <div>
        <div>
          Meets criteria:
          <ul>
            {
              Object.keys( this.state.filters ).map( (filterName, i) => {
                const isLastItem = i + 1 === _.size( this.state.filters );
                const filter = this.state.filters[ filterName ];
                let string = filter.join(' OR ');
                if ( !isLastItem ) {
                  string += ' AND'
                }
                return (
                  <li key={ i }>{ string }</li>
                )
              })
            }
          </ul>
          <div className="flex-container">
            <div className="flex-column">
              <button
                style={{
                  backgroundColor: 'green',
                  color: 'white',
                  fontWeight: '800'
                }}
                onClick={ () => this.requestFromAPI( false )}>
                Preview Results
              </button>
            </div>
            <div className="flex-column">
              <button
                onClick={this.onClearFilters}>
                Clear Filters
              </button>
            </div>
            <div className="flex-column">
              <this.DownloadButton className="flex-column" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  FilterForm = () => {
    const KeyCodes = {
      comma: 188, // some of the values include commas. therefore, exclude
      enter: 13,
      tab: 9
    };

    const delimiters = [KeyCodes.tab, KeyCodes.enter];

    return (
      <div className="filter-pane">
        <form>
          <div className="disclaimer">
            At the moment, text values inserted here must match upper/lowercase and punctuation of the target search field.
          </div>
          <div className="flex-container">
            <label
              className="flex-column hide-input">
              <b>Area</b>
              <div>
                <ReactTags
                  tags={this.state.tags.area}
                  handleDelete={() => {}}
                  handleAddition={() => {}}
                  delimiters={delimiters} />
                <GeoSuggest
                  dataset="laus"
                  add={ this.handleTagAdd }
                  remove={ this.handleTagDelete }/>
              </div>
            </label>
            <label className="flex-column">
              <b>Period</b>
              <div>
                <ReactTags
                  tags={this.state.tags.period}
                  handleDelete={e => this.handleTagDelete(e, 'period')}
                  handleAddition={e => this.handleTagAdd(e, 'period')}
                  delimiters={delimiters} />
              </div>
            </label>
            <label className="flex-column">
              <b>Label</b>
              <div>
                <ReactTags
                  tags={this.state.tags.label}
                  handleDelete={e => this.handleTagDelete(e, 'label')}
                  handleAddition={e => this.handleTagAdd(e, 'label')}
                  delimiters={delimiters} />
              </div>
            </label>
          </div>
          <div className="flex-container">
            <section className="flex-column">
              <b>Area Types</b>
              { this.makeCheckboxes( 'area_type', this.areaTypes ) }
            </section>
            <section className="flex-column">
              <b>Measure Types</b>
              { this.makeCheckboxes( 'measure_type', this.measureTypes ) }
            </section>
            <section className="flex-column">
              <b>Seasonality</b>
              { this.makeCheckboxes( 'seasonality_enum', this.seasonalityEnums ) }
            </section>
          </div>
        </form>
        <this.FormButtons />
      </div>
    );
  }

  render() {
    if ( this._rows ) {
      return  (
        <div>
          {
            this.state.isWaitingForDownload
              ? <div className="is-downloading">
                <div>Your file is downloading...</div>
              </div>
              : null
          }
          <this.FilterForm />
          <div style={{
            position: 'absolute',
            left: '0',
            width: '100%'
            }}>
            <ReactDataGrid
              columns={this._columns}
              rowGetter={this.rowGetter}
              rowsCount={this.getSize()}
              minHeight={600}
              minColumnWidth={120}
              toolbar={<Toolbar />}
              />
            <div className="disclaimer">
              Data above is only the first 100 rows. If you choose to download your current filter, it will provide the full dataset as stored in the database.
            </div>

          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}

export default Grid;
