import React, { Component } from 'react';
import axios from 'axios';
import _ from 'lodash';

const Autosuggest = require('react-autosuggest');

class GeoSuggest extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      value: "",
      suggestions: []
    }
  }

  getFromServer = inputValue => {
    const dataSet = this.props.dataset;
    const path = `http://${ window.location.hostname }:4000/${ dataSet }/suggest?geo=${ inputValue }`;

    return new Promise( (resolve, reject) => {
      axios.get( path )
        .then( response => {
          resolve(response.data);
        } )
        .catch( err => {
          reject(err);
        } );

    });
  }

  onClear = () => {
    this.setState({
      suggestions: []
    })
  }

  onFetch = _.debounce( ({ value }) => {
    this.getFromServer( value )
      .then( suggestions => {
        const flatSuggestions = suggestions.map(obj => obj.area);
        this.setState({
          suggestions: flatSuggestions
        })
      });
  }, 500 );

  renderSuggestion = ( suggestion ) => {
    return <div>{ suggestion }</div>
  }

  onChange = (event, { newValue }) => {
    if (event.type === 'change' ) {
      this.setState({
        value: newValue
      });
    }
    if ( event.type === 'keydown' ) {
      const isDown = event.which === 40;
      const isUp = event.which === 38;

      const indexOfCurrentSelection = this.state.suggestions.indexOf( this.state.value );

      let valueToBe = this.state.value;
      if ( isUp ) {
        const isFirstIndex = indexOfCurrentSelection === 0;
        const previousValue = this.state.suggestions[ indexOfCurrentSelection - 1 ];
        valueToBe = isFirstIndex ? this.state.value : previousValue;
      }
      if ( isDown ) {
        const isLastIndex = indexOfCurrentSelection + 1 === this.state.suggestions.length;
        const nextValue = this.state.suggestions[ indexOfCurrentSelection + 1 ];
        valueToBe = isLastIndex ? this.state.value : nextValue;
      }

      this.setState({
        value: valueToBe
      })
    }
  }

  render() {
    const suggestions = this.state.suggestions;

    const inputProps = {
      value: this.state.value,
      onChange: this.onChange,
      onBlur: () => {},
      type: 'search',
      placeholder: 'location'
    };

    return (
      <Autosuggest
        suggestions={ suggestions }
        onSuggestionsFetchRequested={ this.onFetch }
        onSuggestionsClearRequested={ this.onClear }
        getSuggestionValue={ this.getFromServer }
        renderSuggestion={ this.renderSuggestion }
        inputProps={ inputProps }
      />
    );
  }
}

export default GeoSuggest;
