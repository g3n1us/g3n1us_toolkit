import React, { Component } from 'react';
import Async from 'react-promise';

import Field from './Field';
import RefreshableAsync from './RefreshableAsync';

import { ListItem } from './models/renders';

import * as schemas from './schemas';

const faker = require('faker');
const pluralize = require('pluralize');

import { url, config } from './helpers';


Async.defaultPending = (
  <span>loading...</span>
);


/**
  @extends Component
*/
class Model extends Component {

  static get defaultProps() {
    return {
      id: null,
      created_at: null,
      updated_at: null,
    };
  }


  /**
    @constructor
    @argument {Object} props An object received from a Django serializer representing a single model
  */
  constructor(props) {
    super(props);

    this._calculatedProperties = {
      endpoint: url(`/api/${this.constructor.plural}/`),
      api_url: url(`/api/${this.constructor.plural}/${this.props.id}/`),
      url: url(`/${this.constructor.plural}/${this.props.id}/`),
    };

    this.state = this.mutableState;
  }


  /** */
  get calculatedProperties() {
    return this._calculatedProperties;
  }


  /** */
  get url() {
    return this._calculatedProperties.url;
  }

  /** */
  get breadcrumbs() {
    const a = document.createElement('a');
    a.href = this._calculatedProperties.url;
    const segments = _.filter(a.pathname.split('/'));
    const reducer = (accumulator, currentValue) => {
      accumulator.push(_.flatten([...accumulator, currentValue]));
      return accumulator;
    };
    return segments.reduce(reducer, [[]])
      .map(s => `/${s.join('/')}`);
  }

  /**
    @todo Implement this as a way to add instantiation items
  */
  static boot() { }

  /**
 * (STATIC) - Query the data store and return the model with the supplied id
 * @static
 */
  static find(id) {
    this.refresher = React.createRef();

    return <RefreshableAsync ref={this.refresher} refresh_path={url(`/api/${this.plural}/${id}/`)} then={d => {
      const ThisModel = this;
      return <ThisModel {...d.data} key={`_${this.plural}_${id}`} />;
    }} />;
  }


  /**
   * (STATIC) - TODO -- Work in Progress -- DO NOT USE
   * @static
   */
  static where(a, b, c) {
    // WIP!!!
    let query = [].slice.call(arguments);

    this.refresher = React.createRef();
    return <RefreshableAsync ref={this.refresher} refresh_path={url(`/api/${this.plural}/`)} then={d => {
      const els = d.data.map((e) => {
        let ThisModel = this;
        return <ThisModel {...e} key={`_${this.plural}_${e.id}`} />;
      });
      return <div>{els}</div>;
    }} />;
  }


  /**
   * (STATIC) - Return all models from the data store
   * @static
   */
  static all(additional_props = {}) {
    this.refresher = React.createRef();
    this.refreshers = this.refreshers || [];
    this.refreshers.push(this.refresher);
    const callback = (d) => {
      let els = d.data.map(e => {
        let props = { ...e, ...additional_props };
        let ThisModel = this;
        return <ThisModel refresher={this.refresher} key={`${this.plural}${e.id}`} {...props} />;
      });

      return <div>{els}</div>;
    };

    return <RefreshableAsync ref={this.refresher} refresh_path={url(`/api/${this.plural}/`)} catch={console.error} then={callback} />;
  }

  /**
   * Return the stored model information retrieved from a OPTIONS request to the Django REST endpoint
   * This is used to calculate whether properties should be editable, and what their data type is to determine the type of editing interface to provide
   */
  get schema() {
    return schemas[this.singular || this.constructor.singular];
  }

  static get schema() {
    return schemas[this.singular || this.constructor.singular];
  }



  /**
   * Store the model's state back to the database
   */


  save(partial_data = {}) {
    return new Promise((resolve, reject) => {
        let updated_data = {...this.state};
        if(!_.isEmpty(partial_data)){
            updated_data = partial_data;
        }
      this.getRelations().forEach(rel => {
        if (_.isArray(updated_data[rel])){
          updated_data[rel] = updated_data[rel].map(val => typeof val === 'object' ? val.id : val);
        }
        // maybe put in something if it is not a many-to-many relation/array
      });
      axios.patch(url(this.calculatedProperties.api_url), updated_data)
        .then(response => {
          this.refresh_self();
          notification('Saved');
          resolve(response.data)
        })
        .catch(err => {
          console.error(err);
          notification({ text: 'An error occurred', level: 'danger' });
          reject(err);
        });
    });
  }

  /**
   * Create a new model instance and store it to the database
   * @todo complete this method
   */
  static create(initialProps = {}) {
    return new Promise((resolve, reject) => {
      axios.post(url(`/api/${this.plural}/`), initialProps)
        .then(response => {
          this.refresh_static();
          notification('Created');
          resolve(response.data);
        })
        .catch(err => {
          notification({ text: 'An error occurred', level: 'danger' });
          reject(err);
        });
    });
  }


  /**
   * Delete a model
   */
  delete() {
    return axios.delete(this.calculatedProperties.api_url)
      .then(data => {
        // this.refresh(url('/'));
        notification('Deleted');
      })
      .catch(err => {
        console.error(err);
        notification({ text: 'An error occurred', level: 'danger' });
      });
  }

  refresh_self() {
    return axios.get(this.calculatedProperties.api_url).then(d => {
        if(this.isMounted){
            this.setState(this.filterMutable(d.data));
        }
        else{
            this.state = { ...this.state, ...this.filterMutable(d.data) };
        }
    }).catch(e => {
      console.error(e);
    });
  }

  refresh(redirectEndpoint) {
    const refresher = _.get(this.props, 'refresher.current.refresh');
    if (refresher) {
      refresher();
    } else if (redirectEndpoint) {
      window.location.assign(redirectEndpoint);
    } else if (this instanceof app.models.Model) {
      // Otherwise, make a call to the endpoint and set state from there to confirm the saved data is equal to what we already have set.
      this.refresh_self();
    }
  }

  static refresh_static() {
    const refresher = _.get(this.refresher, 'current.refresh');
    if (refresher) {
      refresher();
    }
  }



  /** */
  filterMutable(objectToFilter) {
    const valid_keys = _.keys(objectToFilter).filter(k => {
      const t = Field.field_type(k, this);
      return !t.schema.read_only;
    });
    return _.pick(objectToFilter, valid_keys);
  }

  /** */
  get mutableState() {
    return this.filterMutable(this.props);
  }


  /** */
  get plural() {
    return pluralize(_.snakeCase(this.constructor.name));
  }


  /** */
  static get plural() {
    return pluralize(_.snakeCase(this.name));
  }


  /** */
  get singular() {
    return _.snakeCase(this.constructor.name);
  }


  /** */
  static get singular() {
    return _.snakeCase(this.name);
  }

  /**
   * Returns the class properties that represent a relation to another model
   */
  getRelations() {
    return _(this.schema).toPairs().filter(o => o[1].type === "field").fromPairs().keys().value();
  }

  static getRelations() {
    return _(this.schema).toPairs().filter(o => o[1].type === "field").fromPairs().keys().value();
  }

  /**
  * Returns properties that exist via getters, or in the explicit object property: `this.calculatedProperties`
  *
  */
  getCalculatedProperties() {
    const p = Object.getPrototypeOf(this);
    const all_properties = Object.getOwnPropertyNames(p).concat(Object.getOwnPropertyNames(this.calculatedProperties));

    return all_properties.filter((q) => {
      if (q in p) {
        return Object.getOwnPropertyDescriptor(p, q).get;
      } else {
        return q in this.calculatedProperties;
      }
    });
  }

  /**
  * Returns explicitly ignored properties. These are not output as state in components.
  */
  getOmittedProperties() {
    return [...this.getRelations(), 'id', 'created_at', 'updated_at', 'schema', 'refresher'];
  }

  _(prop, content = null) {
    const current_value = this.state[prop] === null ? '' : this.state[prop];
    return <Field model={this} property={prop} edit_mode={this.state.edit_mode}> {content || current_value}</Field>
  }

  /** */
  render() {
    if (!this.props.renderAs) {
      return <ListItem model={this} />;
    }
    else {
      const renderAs = this.state.renderAs || this.props.renderAs;
      if (typeof this[renderAs] === 'function') {
        return this[renderAs]();
      }

      const Render = require(`./models/renders/${renderAs}`);
      return <Render.default model={this} />;
    }
  }



  static mock() {
    const fake_state = this.mergedMockProps();
    this.create(fake_state);
  }


  /** Below is for testing with mock data */
  /**
  * This will typically be overridden inside a Model instance. This provides a default.
  */
  static get mockProps() {
    return {};
  }

  /**

  */
  static mergedMockProps() {
    let props = _.keys(this.schema).map(key => this.getDefaultMockType(key));
    props = _.fromPairs(_.filter(props));
    props = _.assign(props, this.mockProps);
    return props;
  }


  static array_random(arr) {
    const random = Math.floor(Math.random() * arr.length);
    return arr[random];
  }

  /**

  */
  static getDefaultMockType(key) {

    const n = _.get(this.schema, key, { read_only: true });
    if (n.read_only) {
      return null;
    }

    const type_tests = [
      { faker: faker.lorem[this.array_random(_.keys(faker.lorem))], test: (n) => n.type === 'string' && n.max_length },
      { faker: faker.internet.email, test: (n) => n.type === 'email' && n.max_length },
      { faker: faker.random.boolean, test: (n) => n.type === 'boolean' },
      { faker: faker.random.number, test: (n) => n.type === 'integer' },
      { faker: () => moment(faker.date[this.array_random(_.keys(faker.date))]()).format('YYYY-MM-DDThh:mm'), test: (n) => n.type === 'datetime' },
      { faker: faker.lorem[this.array_random(_.keys(faker.lorem))], test: n => n.type === 'string' },
    ];
    const type = _.find(type_tests, t => {
      return t.test(n);
    });


    return type ? [key, type.faker()] : null;
  }

  // .format('YYYY-MM-DDThh:mm');
}

export default Model;
