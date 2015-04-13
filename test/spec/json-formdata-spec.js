/*global describe:false */
/*global beforeEach:false */
/*global it:false */
/*global expect:false */
/*global jasmine:false */
/*global JSONFormData:false */

describe('JSONFormData', function() {
  'use strict';

  var formFixture = '';


  beforeEach(function() {
    formFixture = document.createElement('form');
    formFixture.method = 'POST';
    formFixture.enctype = 'application/json';
  });


  it('Supports append syntax', function() {

    formFixture.innerHTML =
      '<input name=\'highlander[]\' value=\'one\'>' +
      '<input type=\'submit\' value=\'Test\'>';

    var formData = new JSONFormData(formFixture).formData;

    expect(formData).toEqual(jasmine.objectContaining({ highlander: [ 'one' ] }));
  });


  it('Supports basic keys', function() {

    formFixture.innerHTML =
        '<input name=\'name\' value=\'Bender\'>' +
        '<select name=\'hind\'>' +
        '<option selected>Bitable</option>' +
        '<option>Kickable</option>' +
        '</select>' +
        '<input type=\'checkbox\' name=\'shiny\' checked>' +
        '<input type=\'submit\' value=\'Test\'>';

    var formData = new JSONFormData(formFixture).formData;

    expect(formData).toEqual(jasmine.objectContaining({ name: 'Bender', hind: 'Bitable', shiny: 'on' }));
  });


  it('Supports deeper structures', function() {

    formFixture.innerHTML =
      '<input name=\'pet[species]\' value=\'Dahut\'>' +
      '<input name=\'pet[name]\' value=\'Hypatia\'>' +
      '<input name=\'kids[1]\' value=\'Thelma\'>' +
      '<input name=\'kids[0]\' value=\'Ashley\'>' +
      '<input type=\'submit\' value=\'Test\'>';

    var formData = new JSONFormData(formFixture).formData;

    expect(formData).toEqual(jasmine.objectContaining({
      pet: {
        species: 'Dahut',
        name: 'Hypatia' },
      kids: [ 'Ashley', 'Thelma' ]
    }));
  });


  it('Supports even deeper structures', function() {

    formFixture.innerHTML =
      '<input name=\'pet[0][species]\' value=\'Dahut\'>' +
      '<input name=\'pet[0][name]\' value=\'Hypatia\'>' +
      '<input name=\'pet[1][species]\' value=\'Felis Stultus\'>' +
      '<input name=\'pet[1][name]\' value=\'Billie\'>' +
      '<input type=\'submit\' value=\'Test\'>';

    var formData = new JSONFormData(formFixture).formData;

    expect(formData).toEqual(jasmine.objectContaining({ pet:
      [
        { species: 'Dahut', name: 'Hypatia' },
        { species: 'Felis Stultus', name: 'Billie' }
      ]
    }));
  });


  // Not sure how to support file uploads in the test yet
  /*
    it('Supports files', function() {
    });
  */


  it('Supports merge behaviors', function() {

    formFixture.innerHTML =
      '<input name=\'mix\' value=\'scalar\'>' +
      '<input name=\'mix[0]\' value=\'array 1\'>' +
      '<input name=\'mix[2]\' value=\'array 2\'>' +
      '<input name=\'mix[key]\' value=\'key key\'>' +
      '<input name=\'mix[car]\' value=\'car key\'>' +
      '<input type=\'submit\' value=\'Test\'>';

    var formData = new JSONFormData(formFixture).formData;

    expect(formData).toEqual(jasmine.objectContaining({
      'mix': {
        '0': 'array 1',
        '2': 'array 2',
        '': 'scalar',
        'key': 'key key',
        'car': 'car key'
      }
    }));
  });

  it('Supports multiple values', function() {

    formFixture.innerHTML =
      '<input type=\'number\' name=\'bottle-on-wall\' value=\'1\'>' +
      '<input type=\'number\' name=\'bottle-on-wall\' value=\'2\'>' +
      '<input type=\'number\' name=\'bottle-on-wall\' value=\'3\'>' +
      '<input type=\'submit\' value=\'Test\'>';

    var formData = new JSONFormData(formFixture).formData;

    expect(formData).toEqual(jasmine.objectContaining({ 'bottle-on-wall': [ 1, 2, 3 ] }));
  });


  it('Supports sparse arrays', function() {

    formFixture.innerHTML =
      '<input name=\'heartbeat[0]\' value=\'thunk\'>' +
      '<input name=\'heartbeat[2]\' value=\'thunk\'>' +
      '<input type=\'submit\' value=\'Test\'>';

    var formData = new JSONFormData(formFixture).formData;

    var expected = {
      'heartbeat': [
        'thunk'
      ]
    };

    expected.heartbeat[2] = 'thunk';
    expect(formData).toEqual(jasmine.objectContaining(expected));
  });


  it('Supports such deep nesting', function() {

    formFixture.innerHTML =
      '<input name=\'wow[such][deep][3][much][power][!]\' value=\'Amaze\'>' +
      '<input type=\'submit\' value=\'Test\'>';

    var formData = new JSONFormData(formFixture).formData;

    var expected = {
      'wow': {
        'such': {
          'deep': [

          ]
        }
      }
    };

    expected.wow.such.deep[3] = {
      'much': {
        'power': {
          '!': 'Amaze'
        }
      }
    };

    expect(formData).toEqual(jasmine.objectContaining(expected));
  });
});