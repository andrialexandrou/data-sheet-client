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

    this.seasonalityEnums = [ 'S', 'U' ];
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
    this.setState({filters: {} }, this.requestFromAPI);
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
    const isSeasonalityType = this.seasonalityEnums.find( type => type === value );
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
    }, this.requestFromAPI);
  }

  handleTagDelete = (i, key) => {
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
    }, this.requestFromAPI);
  };

  handleTagAdd = (tag, category) => {
    const { filters, tags } = this.state;
    filters[ category ] = ( filters[ category ] || [] ).concat( tag.text );
    tags[ category ] = ( tags[ category ] || [] ).concat( tag );
    this.setState({
      filters: filters,
      tags: tags
    }, this.requestFromAPI);
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

  makeCheckboxes = names => {
    const rows = [];
    let count = 0;
    names.forEach( valName => {
      rows.push(<div key={ count }>
          <label>
          <input
            name={ valName }
            type="checkbox"
            onChange={this.handleChange} />
            &nbsp;{ valName }
        </label>
      </div>);
      count++
    } );

    return <div>{ rows }</div>
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
          <section>
            <label>
              <b>Area</b>
              <div>
                <ReactTags
                  tags={this.state.tags.area}
                  handleDelete={e => this.handleTagDelete(e, 'area')}
                  handleAddition={e => this.handleTagAdd(e, 'area')}
                  delimiters={delimiters} />
              </div>
            </label>
          </section>
          <section>
            <label>
              <b>Period</b>
              <div>
                <ReactTags
                  tags={this.state.tags.period}
                  handleDelete={e => this.handleTagDelete(e, 'period')}
                  handleAddition={e => this.handleTagAdd(e, 'period')}
                  delimiters={delimiters} />
              </div>
            </label>
          </section>
          <section>
            <label>
              <b>Label</b>
              <div>
                <ReactTags
                  tags={this.state.tags.label}
                  handleDelete={e => this.handleTagDelete(e, 'label')}
                  handleAddition={e => this.handleTagAdd(e, 'label')}
                  delimiters={delimiters} />
              </div>
            </label>
          </section>
          <section>
            <b>Area Types</b>
            { this.makeCheckboxes( this.areaTypes ) }
          </section>
          <section>
            <b>Measure Types</b>
            { this.makeCheckboxes( this.measureTypes ) }
          </section>
          <section>
            <b>Seasonality</b>
            { this.makeCheckboxes( this.seasonalityEnums ) }
          </section>
        </form>
      </div>
    );
  }

  render() {
    if ( this._rows ) {
      return  (
        <div>
          <this.DownloadButton />
          {
            this.state.isWaitingForDownload ?
              <span style={{color: 'green'}}>&nbsp;Waiting for download...</span> :
              null
          }

          <div className="filter-trigger">
            <button
              onClick={this.openFilters}>
              Apply Filters
            </button>
            {
              this.state.showFilters && <this.FilterForm />
            }
          </div>

          <div style={{
            position: 'absolute',
            left: '0',
            width: '100%'
            }}>
            { !_.isEmpty( this.state.filters ) ?
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
                  <button
                    onClick={this.onClearFilters}>
                    Clear Filters
                  </button>
                </div>
                :
                null
            }

            <GeoSuggest dataset="laus" />
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
