import React, { Component } from 'react';
import ReactDataGrid from 'react-data-grid';
import { WithContext as ReactTags } from 'react-tag-input';
import axios from 'axios';
import _ from 'lodash';

import GeoSuggest from './geoSuggest';
import industries from './industries';

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
  const filename = `EMPLOYMENT_${ 1900 + now.getYear() }-${ now.getMonth() }-${ now.getDate() }.csv`;
  return filename;
}

class Grid extends Component {
  constructor(props, context) {
    super(props, context);

    this._columns = [
      {
        key: 'survey_name',
        name: 'Survey Name',
        width: 160,
        resizable: true
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
        key: 'state',
        name: 'State',
        width: 160
      },
      {
        key: 'area_type',
        name: 'Area Type',
        width: 350
      },
      {
        key: 'employment_type',
        name: 'Employment Type',
        width: 160
      },
      {
        key: 'supersector',
        name: 'Supersector',
        width: 160
      },
      {
        key: 'industry',
        name: 'Industry',
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
    this.supersectors = [
      'Total Nonfarm',
      'Total Private',
      'Goods Producing',
      'Service-Providing',
      'Private Service Providing',
      'Mining and Logging',
      'Mining, Logging, and Construction',
      'Construction',
      'Manufacturing',
      'Durable Goods',
      'Non-Durable Goods',
      'Trade, Transportation, and Utilities',
      'Wholesale Trade',
      'Retail Trade',
      'Transportation and Utilities',
      'Information',
      'Financial Activities',
      'Professional and Business Services',
      'Education and Health Services',
      'Leisure and Hospitality',
      'Other Services',
      'Government'    ];
    this.industries = industries;

    this.state = {
      showFilters: false,
      rows: [],
      filters: {},
      tags: {}
    };
  }

  getFromServer( query, isForDownload ) {
    let path = `http://${ window.location.hostname }:4000/employ`;
    if ( isForDownload ) {
      path += '/download'
    }
    if ( query ) {
      path += query;
    }
    console.log('path', path);
    if ( isForDownload ) return;
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

    const isSupersector = this.supersectors.find( type => type === value );
    const isSeasonalityType = this.seasonalityEnums.find( type => type.key === value );
    const isIndustry = this.industries.find( type => type === value );
    if ( isSupersector ) {
      key = "supersector_type";
    } else if ( isSeasonalityType ) {
      key = "seasonality_enum";
    } else if ( isIndustry ) {
      key = "industry_type"
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
    if ( i === 'last' && key === 'area' ) {
      i = this.state.tags.area && this.state.tags.area.length - 1;
      if ( !i ) {
        return;
      }
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
    if (this._rows && this._rows.length === 0) {
      return (
        <button disabled>
          Unable to download current view.
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
              <this.DownloadButton />
            </div>
            {
              this.state.isWaitingForDownload ?
              <div style={{color: 'green'}}>&nbsp;Waiting for download...</div> :
              null
            }
          </div>
        </div>
      </div>
    );
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
            <section className="flex-column">
              <label>
                <b>State</b>
                <div>
                  <ReactTags
                    tags={this.state.tags.state}
                    handleDelete={e => this.handleTagDelete(e, 'state')}
                    handleAddition={e => this.handleTagAdd(e, 'state')}
                    delimiters={delimiters} />
                </div>
              </label>
            </section>
            <section className="flex-column">
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
            <section className="flex-column">
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
          </div>
          <div className="flex-container">
          <section className="flex-column">
            <b>Seasonality</b>
            { this.makeCheckboxes( 'seasonality_enum', this.seasonalityEnums ) }
            <b>Supersectors</b>
            { this.makeCheckboxes( 'supersector', this.supersectors ) }
          </section>
          <section className="flex-column">
            <b>Industries</b>
            <div className="industries-scrollbox">
              { this.makeCheckboxes( 'industry', this.industries ) }
            </div>
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
