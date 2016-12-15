'use strict';
/*
Version: 1.0.9

Documentation: http://baymard.com/labs/country-selector#documentation

Copyright (C) 2011 by Jamie Appleseed, Baymard Institute (baymard.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

	(function($){
	  var settings = {
		'sort': false,
		'sort-attr': 'data-priority',
		'sort-desc': false,
		'autoselect': true,
		'alternative-spellings': true,
		'alternative-spellings-attr': 'data-alternative-spellings',
		'remove-valueless-options': true,
		'copy-attributes-to-text-field': true,
		'autocomplete-plugin': 'jquery_ui',
		'relevancy-sorting': true,
		'relevancy-sorting-partial-match-value': 1,
		'relevancy-sorting-strict-match-value': 5,
		'relevancy-sorting-booster-attr': 'data-relevancy-booster',
		'minLength': 0,
		  'delay': 0,
		'autoFocus': true,
		handle_invalid_input: function( context ) {
		  var selected_finder = 'option:selected:first';
		  if ( context.settings['remove-valueless-options'] ) {
			selected_finder = 'option:selected[value!=""]:first';
		  }
		  context.$text_field.val( context.$select_field.find( selected_finder ).text() );
		},
		handle_select_field: function( $select_field ) {
		  return $select_field.hide();
		},
		insert_text_field: function( context ) {
		  var $text_field = $( '<input type="text"></input>' );
		  if ( settings['copy-attributes-to-text-field'] ) {
			var attrs = {};
			var raw_attrs = context.$select_field[0].attributes;
			for (var i=0; i < raw_attrs.length; i++) {
			  var key = raw_attrs[i].nodeName;
			  var value = raw_attrs[i].nodeValue;
			  if ( key !== 'name' && key !== 'id' && typeof context.$select_field.attr(key) !== 'undefined' ) {
				attrs[key] = value;
			  }
			};
			$text_field.attr( attrs );
		  }
		  $text_field.blur(function() {
			var valid_values = context.$select_field.find('option').map(function(i, option) { return $(option).text(); });
			if ( ($.inArray($text_field.val(), valid_values) < 0) && typeof settings['handle_invalid_input'] === 'function' ) {
			  settings['handle_invalid_input'](context);
			}
		  });
		  // give the input box the ability to select all text on mouse click
		  if ( context.settings['autoselect'] ) {
			 $text_field.click( function() {
				 this.select();
				});
		  }
		  var selected_finder = 'option:selected:first';
		  if ( context.settings['remove-valueless-options'] ) {
			selected_finder = 'option:selected[value!=""]:first';
		  }
		  return $text_field.val( context.$select_field.find( selected_finder ).text() )
			.insertAfter( context.$select_field );
		},
		extract_options: function( $select_field ) {
		  var options = [];
		  var $options = $select_field.find('option');
		  var number_of_options = $options.length;
		  
		  // go over each option in the select tag
		  $options.each(function(){
			var $option = $(this);
			var option = {
			  'real-value': $option.attr('value'),
			  'label': $option.text()
			}
			if ( settings['remove-valueless-options'] && option['real-value'] === '') {
			  // skip options without a value
			} else {
			  // prepare the 'matches' string which must be filtered on later
			  option['matches'] = option['label'];
			  var alternative_spellings = $option.attr( settings['alternative-spellings-attr'] );
			  if ( alternative_spellings ) {
				option['matches'] += ' ' + alternative_spellings;
			  }
			  // give each option a weight paramter for sorting
			  if ( settings['sort'] ) {
				var weight = parseInt( $option.attr( settings['sort-attr'] ), 10 );
				if ( weight ) {
				  option['weight'] = weight;
				} else {
				  option['weight'] = number_of_options;
				}
			  }
			  // add relevancy score
			  if ( settings['relevancy-sorting'] ) {
				option['relevancy-score'] = 0;
				option['relevancy-score-booster'] = 1;
				var boost_by = parseFloat( $option.attr( settings['relevancy-sorting-booster-attr'] ) );
				if ( boost_by ) {
				  option['relevancy-score-booster'] = boost_by;
				}
			  }
			  // add option to combined array
			  options.push( option );
			}
		  });
		  // sort the options based on weight
		  if ( settings['sort'] ) {
			if ( settings['sort-desc'] ) {
			  options.sort( function( a, b ) { return b['weight'] - a['weight']; } );
			} else {
			  options.sort( function( a, b ) { return a['weight'] - b['weight']; } );
			}
		  }
		  
		  // return the set of options, each with the following attributes: real-value, label, matches, weight (optional)
		  return options;
		}
	  };
	  
	  var public_methods = {
		init: function( customizations ) {
		  
		  if ( /msie/.test(navigator.userAgent.toLowerCase()) && parseInt(navigator.appVersion,10) <= 6) {
			
			return this;
			
		  } else {
			
			settings = $.extend( settings, customizations );

			return this.each(function(){
			  var $select_field = $(this);
			  
			  var context = {
				'$select_field': $select_field,
				'options': settings['extract_options']( $select_field ),
				'settings': settings
			  };

			  context['$text_field'] = settings['insert_text_field']( context );
			  
			  settings['handle_select_field']( $select_field );
			  
			  if ( typeof settings['autocomplete-plugin'] === 'string' ) {
				adapters[settings['autocomplete-plugin']]( context );
			  } else {
				settings['autocomplete-plugin']( context );
			  }
			});
			
		  }
		  
		}
	  };
	  
	  var adapters = {
		jquery_ui: function( context ) {
		  // loose matching of search terms
		  var filter_options = function( term ) {
			var split_term = term.split(' ');
			var matchers = [];
			for (var i=0; i < split_term.length; i++) {
			  if ( split_term[i].length > 0 ) {
				var matcher = {};
				matcher['partial'] = new RegExp( $.ui.autocomplete.escapeRegex( split_term[i] ), "i" );
				if ( context.settings['relevancy-sorting'] ) {
				  matcher['strict'] = new RegExp( "^" + $.ui.autocomplete.escapeRegex( split_term[i] ), "i" );
				}
				matchers.push( matcher );
			  }
			};
			
			return $.grep( context.options, function( option ) {
			  var partial_matches = 0;
			  if ( context.settings['relevancy-sorting'] ) {
				var strict_match = false;
				var split_option_matches = option.matches.split(' ');
			  }
			  for ( var i=0; i < matchers.length; i++ ) {
				if ( matchers[i]['partial'].test( option.matches ) ) {
				  partial_matches++;
				}
				if ( context.settings['relevancy-sorting'] ) {
				  for (var q=0; q < split_option_matches.length; q++) {
					if ( matchers[i]['strict'].test( split_option_matches[q] ) ) {
					  strict_match = true;
					  break;
					}
				  };
				}
			  };
			  if ( context.settings['relevancy-sorting'] ) {
				var option_score = 0;
				option_score += partial_matches * context.settings['relevancy-sorting-partial-match-value'];
				if ( strict_match ) {
				  option_score += context.settings['relevancy-sorting-strict-match-value'];
				}
				option_score = option_score * option['relevancy-score-booster'];
				option['relevancy-score'] = option_score;
			  }
			  return (!term || matchers.length === partial_matches );
			});
		  }
		  // update the select field value using either selected option or current input in the text field
		  var update_select_value = function( option ) {
			if ( option ) {
			  if ( context.$select_field.val() !== option['real-value'] ) {
				context.$select_field.val( option['real-value'] );
				context.$select_field.change();
			  }
			} else {
			  var option_name = context.$text_field.val().toLowerCase();
			  var matching_option = { 'real-value': false };
			  for (var i=0; i < context.options.length; i++) {
				if ( option_name === context.options[i]['label'].toLowerCase() ) {
				  matching_option = context.options[i];
				  break;
				}
			  };
			  if ( context.$select_field.val() !== matching_option['real-value'] ) {
				context.$select_field.val( matching_option['real-value'] || '' );
				context.$select_field.change();
			  }
			  if ( matching_option['real-value'] ) {
				context.$text_field.val( matching_option['label'] );
			  }
			  if ( typeof context.settings['handle_invalid_input'] === 'function' && context.$select_field.val() === '' ) {
				context.settings['handle_invalid_input']( context );
			  }
			}
		  }
		  // jQuery UI autocomplete settings & behavior
		  context.$text_field.autocomplete({
			'minLength': context.settings['minLength'],
			'delay': context.settings['delay'],
			'autoFocus': context.settings['autoFocus'],
			source: function( request, response ) {
			  var filtered_options = filter_options( request.term );
			  if ( context.settings['relevancy-sorting'] ) {
				filtered_options = filtered_options.sort( function( a, b ) { 
					if (b['relevancy-score'] == a['relevancy-score']) {
						return b['label'] < a['label'] ? 1 : -1;	
					} else {
						return b['relevancy-score'] - a['relevancy-score']; 
					}
				} );
			  }
			  response( filtered_options );
			},
			select: function( event, ui ) {
			  update_select_value( ui.item );
			},
			change: function( event, ui ) {
			  update_select_value( ui.item );
			}
		  });
		  // force refresh value of select field when form is submitted
		  context.$text_field.parents('form:first').submit(function(){
			update_select_value();
		  });
		  // select current value
		  update_select_value();
		}
	  };

	  $.fn.selectToAutocomplete = function( method ) {
		if ( public_methods[method] ) {
		  return public_methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
		  return public_methods.init.apply( this, arguments );
		} else {
		  $.error( 'Method ' +  method + ' does not exist on jQuery.fn.selectToAutocomplete' );
		}    
	  };
	  
	})(jQuery);
//var defaultSeries = [];
var defaultSeries = ["World", "Developing economies", "Developed economies", "Emerging economies", "European Union"];

var weso_Countries = [
{name:"World",data:[5.54,5.68,6.22,6.08,6.02,5.95,5.93,5.76,5.70,5.73,5.76,5.77]},
{name:"Developing economies",data:[5.79,5.60,5.56,5.58,5.61,5.45,5.38,5.41,5.46,5.56,5.55,5.54]},
{name:"Emerging economies",data:[5.47,5.61,5.82,5.58,5.58,5.50,5.50,5.42,5.49,5.61,5.69,5.71]},
{name:"Developed economies",data:[5.71,5.96,8.04,8.27,7.95,8.01,7.92,7.32,6.71,6.29,6.16,6.15]},
{name:"European Union",data:[7.16,7.00,8.91,9.57,9.64,10.45,10.85,10.19,9.37,8.60,8.34,8.19]},
{name:"Northern Africa",data:[11.19,10.79,10.56,10.34,11.80,12.28,12.26,12.47,12.37,12.11,11.99,11.87]},
{name:"Sub-Saharan Africa",data:[7.75,7.52,7.68,7.60,7.62,7.46,7.33,7.00,6.96,7.16,7.21,7.23]},
{name:"Latin America and the Caribbean",data:[8.22,7.72,8.23,7.65,7.15,6.79,6.68,6.50,6.98,8.06,8.44,8.47]},
{name:"Northern America",data:[4.75,5.83,9.19,9.44,8.75,8.01,7.37,6.28,5.47,5.14,5.14,5.26]},
{name:"Arab States",data:[10.10,9.95,9.41,9.83,10.65,10.58,10.56,10.60,10.79,10.73,10.60,10.52]},
{name:"Eastern Asia",data:[3.77,4.30,4.36,4.27,4.33,4.42,4.45,4.48,4.46,4.46,4.48,4.53]},
{name:"South-Eastern Asia and the Pacific",data:[5.27,4.98,4.98,4.62,4.54,4.01,4.11,3.96,3.97,3.78,3.84,3.87]},
{name:"Southern Asia",data:[4.19,4.37,4.49,4.26,4.25,4.29,4.22,4.13,4.14,4.13,4.10,4.08]},
{name:"Northern, Southern and Western Europe",data:[7.40,7.36,9.32,9.89,10.02,10.89,11.27,10.70,9.97,9.31,9.05,8.92]},
{name:"Eastern Europ",data:[6.46,6.14,8.03,7.80,7.32,6.79,6.80,6.60,6.47,6.18,6.12,5.98]},
{name:"Central and Western Asia",data:[9.00,9.20,10.45,9.57,8.65,8.33,8.47,8.82,8.86,8.91,9.17,9.29]},
{name:"Australia",data:[4.4,4.2,5.6,5.2,5.1,5.2,5.7,6.1,6.1,5.7,5.5,5.3]},
{name:"Austria",data:[4.9,4.1,5.3,4.8,4.6,4.9,5.3,5.6,5.7,6.1,6.2,6.2]},
{name:"Belgium",data:[7.5,7.0,7.9,8.3,7.1,7.5,8.4,8.5,8.5,8.3,8.3,8.3]},
{name:"Brazil",data:[10.9,9.6,9.7,8.5,7.8,7.4,7.1,6.8,8.5,11.5,12.4,12.4]},
{name:"Bulgaria",data:[6.9,5.6,6.8,10.3,11.3,12.3,12.9,11.4,9.1,8.0,8.1,8.2]},
{name:"Canada",data:[6.0,6.1,8.3,8.1,7.5,7.3,7.1,6.9,6.9,7.1,7.1,7.1]},
{name:"Chile",data:[7.1,7.8,9.7,8.1,7.1,6.4,5.9,6.4,6.2,6.6,6.8,6.8]},
{name:"Croatia",data:[9.9,8.5,9.2,11.6,13.7,15.9,17.3,17.3,16.3,13.5,11.7,10.9]},
{name:"Czech Republic",data:[5.3,4.4,6.7,7.3,6.7,7.0,7.0,6.1,5.0,4.0,3.9,4.4]},
{name:"Denmark",data:[3.8,3.4,6.0,7.5,7.6,7.5,7.0,6.6,6.2,6.1,6.0,6.0]},
{name:"Finland",data:[6.9,6.4,8.2,8.4,7.8,7.7,8.2,8.7,9.4,9.0,8.9,8.8]},
{name:"France",data:[8.1,7.5,9.1,9.3,9.2,9.8,10.4,10.3,10.4,10.0,9.8,9.8]},
{name:"Germany",data:[8.7,7.5,7.7,7.0,5.8,5.4,5.2,5.0,4.6,4.3,4.2,4.2]},
{name:"Hungary",data:[7.4,7.8,10.0,11.2,11.0,11.0,10.2,7.7,6.8,5.2,4.5,4.3]},
{name:"Ireland",data:[4.7,6.4,12.0,13.9,14.6,14.7,13.0,11.3,9.4,8.1,7.6,7.8]},
{name:"Italy",data:[6.1,6.7,7.7,8.4,8.4,10.7,12.1,12.7,11.9,11.5,11.4,11.1]},
{name:"Japan",data:[3.9,4.0,5.1,5.1,4.5,4.3,4.0,3.6,3.4,3.1,3.0,3.0]},
{name:"Korea, Republic of",data:[3.2,3.2,3.6,3.7,3.4,3.2,3.1,3.5,3.6,3.7,3.6,3.7]},
{name:"Malaysia",data:[3.2,3.3,3.7,3.4,3.1,3.0,3.1,2.9,3.1,3.3,3.3,3.3]},
{name:"Mexico",data:[3.6,3.9,5.4,5.3,5.2,4.9,4.9,4.8,4.3,4.0,4.0,4.2]},
{name:"Netherlands",data:[3.2,2.8,3.4,4.5,5.0,5.8,7.2,7.4,6.9,6.2,5.6,5.2]},
{name:"New Zealand",data:[3.6,4.0,5.8,6.1,6.0,6.4,5.8,5.4,5.4,5.2,5.5,5.5]},
{name:"Norway",data:[2.5,2.5,3.1,3.5,3.2,3.1,3.4,3.5,4.3,4.8,5.1,5.4]},
{name:"Philippines",data:[7.4,7.3,7.5,7.3,7.0,7.0,7.1,6.6,6.3,5.9,5.9,5.9]},
{name:"Poland",data:[9.6,7.1,8.2,9.6,9.6,10.1,10.3,9.0,7.5,6.2,5.3,4.8]},
{name:"Portugal",data:[8.0,7.6,9.4,10.8,12.7,15.5,16.2,13.9,12.4,11.2,10.5,10.4]},
{name:"Romania",data:[6.4,5.8,6.9,7.0,7.2,6.8,7.1,6.8,6.8,6.4,7.1,6.9]},
{name:"Russian Federation",data:[6.0,6.2,8.3,7.3,6.5,5.5,5.5,5.2,5.6,5.7,5.8,5.7]},
{name:"Singapore",data:[3.9,4.0,4.3,3.1,2.9,2.8,2.8,2.8,1.7,1.8,2.0,1.8]},
{name:"Slovakia",data:[11.1,9.5,12.0,14.4,13.6,14.0,14.2,13.2,11.5,10.0,9.9,9.9]},
{name:"South Africa",data:[22.5,22.4,23.5,24.7,24.6,24.7,24.6,24.9,25.1,25.9,26.0,26.3]},
{name:"Spain",data:[8.2,11.3,17.9,19.9,21.4,24.8,26.1,24.4,22.1,19.4,18.3,17.6]},
{name:"Sweden",data:[6.2,6.2,8.4,8.6,7.8,8.0,8.1,8.0,7.4,7.1,7.3,7.4]},
{name:"Thailand",data:[1.2,1.2,1.5,1.0,0.7,0.6,0.8,0.8,0.7,0.6,0.6,0.5]},
{name:"Turkey",data:[8.9,9.7,12.6,10.7,8.8,8.1,8.7,9.9,10.2,10.3,10.8,11.0]},
{name:"United Kingdom",data:[5.3,5.6,7.5,7.8,8.0,7.9,7.5,6.1,5.3,4.8,5.0,5.3]},
{name:"United States",data:[4.6,5.8,9.3,9.6,8.9,8.1,7.4,6.2,5.3,4.9,4.9,5.0]},
{name:"Venezuela, Bolivarian Republic of",data:[7.5,6.8,8.1,8.4,7.8,7.4,7.8,7.0,6.8,6.9,6.6,6.0]}
];


/**
  * @desc configure the Highcharts chart object and accompanying UI elements.
  * Wrapped in a function which is called by addScript after loading Highchart libs.
  * Includes code for the chart, country-selector form and buttons.
  * @author Justin Smith @justintemps
  * @required jquery, jquery-ui, jquery.select-to-autocomplete, data.js
*/

function chartCallBack() {

	"use strict";

	//@desc Configure HighCharts chart object.
	$(function () {
		$('#container').highcharts({
			chart: {
				events: {
					load: function() {
						window.scrollTo(0,0);
					}
				}
			},
			title: {
				text: 'Where will unemployment rise next year?',
				style: {
					'color' : '#CE5C3C',
					'font-family' : '"FS Me Web Regular",Helvetica,Arial,Verdana,sans-serif',
					'font-size' : '1.5em',
					'font-weight' : '400',
					'paddingBottom': '10px'
				}
				
			},
			subtitle: {
				text: 'Enter country names to find out',
				style: {
					'font-family' : '"FS Me Web Regular",Helvetica,Arial,Verdana,sans-serif',
					'font-size' : '1.35em',
					'font-weight' : 'bold',
					'color' : '#37468E'
				}
			},
			tooltip: {
				headerFormat: '<span style="color: {series.color}; font-weight: 600;">{series.name} ({point.key})</span><br/>', 
				pointFormat: '<p style="line-height: 24px;">Unemployment: ' + '<span style="font-weight: 600; line-height: 200%;">{point.y:.1f}%</span></p>', 
			},
			plotOptions: {
				series: {
					events: {
						legendItemClick: function (event) {
							event.preventDefault();
							this.remove(true);
							return false;
						}
					},
					showInLegend: true
				}
			},
			xAxis: {
				categories: ['2007', '2008', '2009', '2010', '2011', '2012', '2013',
					'2014', '2015', '2016', '2017', '2018'],
				plotBands: {
					label: {
						text: 'Forecast',
						align: 'center',
						style: {
							color: '#CE5C3C'
						}
					},
					color: '#f6f6f6', 
					from: 9, to: 12
				}
			},
			yAxis: {
				title: {
					text: 'Unemployment Rate'
				},
				plotLines: [{
					value: 0,
					width: 1,
					color: '#808080'
				}],
				labels: {
					format: '{value} %'
				}
			},
			legend: {
				layout: 'horizontal',
				align: 'center',
				verticalAlign: 'bottom',
				borderWidth: 0
			}
		});
	});

	/** 
	  * @desc fetches series from data set, adds them to the chart and then redraws
	  * @param series [array] - list of countries to display
	  * @param dataSet [array of objs] - data for chart
	*/
	function addSeries(series, dataSet) {
		var chart = $('#container').highcharts();	
		for (var i = 0; i < series.length; i++) {
			for (var j = 0; j < dataSet.length; j++) {
				if (series[i] === dataSet[j].name) {
					//add series but don't redraw the chart yet
					chart.addSeries(dataSet[j], false);
				};
			};
		};
		//Now that all series have been added, redraw the chart
		chart.redraw();
	};

	//@desc Removes all series and then redraws.
	function clearChart() {
		var chart = $('#container').highcharts();
		while (chart.series.length > 0) {
			chart.series[0].remove(false);
		}
		chart.redraw();
	};

	//Initialize chart with default series
	$(document).ready( function() {
//		addSeries(["World", "Developing Economies", "Developed Economies", "Emerging Economies", "European Union"], weso_Countries);
		addSeries(defaultSeries, weso_Countries);
	});

	//Regions button
	$("#regions").click( function() {
		$("#regions")
			.removeClass("blue-unselected")
			.addClass("blue");
		$("#income")
			.removeClass("blue")
			.addClass("blue-unselected");
		clearChart();
		addSeries(["Northern Africa", "Sub-Saharan Africa", "Latin America and the Caribbean", "Northern America", "Arab States", "Eastern Asia", "South-Eastern Asia and the Pacific", "Southern Asia", "Northern, Southern and Western Europe", "Eastern Europe", "Central and Western Asia"], weso_Countries);
	});

	//Clear chart button
	$("#clear-data").click( function() {
		$("#regions")
			.removeClass("blue")
			.addClass("blue-unselected");
		$("#income")
			.removeClass("blue")
			.addClass("blue-unselected");
		clearChart();
	});
 
	//@desc Country selector, initialize with jquery.select-to-autocomplete
	(function($){

		$(function(){
			var chart = $('#container').highcharts();
			$('#countrySelectorField').selectToAutocomplete();
			$('#countrySelector').submit(function(e) {
				//Don't let form submit
				e.preventDefault();
				var country = $(".ui-autocomplete-input").val();
				var currentSeries = chart.series;
				var isAdded = false;
				var countryFound = false;
				//Dheck to see if entered country has already been added
				for (var j = 0; j < currentSeries.length; j++) {
					if (country === currentSeries[j].name) {
						isAdded = true;
					};
				};
				//Match country submitted with its dataset
				for (var i = 0; i < weso_Countries.length; i++) {
					if (country === weso_Countries[i].name && !isAdded) {
						chart.addSeries(weso_Countries[i]);
						$("#countrySelector")[0].reset();
						countryFound = true;
					}
					//Display an error message if the country is displayed already on the chart
					else if (country === weso_Countries[i].name && isAdded) {
						$("input").blur();
						$(".ui-autocomplete-input").addClass("errorText");
						$(".ui-autocomplete-input").val(weso_Countries[i].name + " has already been added");
						countryFound = true;
					}; 
				};
				//Display error message if new data found for country or region
				if (!countryFound) {
					$("input").blur();
					$(".ui-autocomplete-input").addClass("errorText");
					$(".ui-autocomplete-input").val("No data for that country or region");
				};
				//Clear the form on refocus if it's currently displaying an error message
				$(".ui-autocomplete-input").focus(function () {  
					if ( $(this).hasClass("errorText") ) {
						$(this).removeClass("errorText");
						$("#countrySelector")[0].reset();
					};
				});
				//Make really sure the form doesn't submit
				return false;
			});
		});
		
	})(jQuery);
};





/**
	* @desc adds scripts to the document head and loads them in order, but only if they're
	* not already there. Resolves conflict with jPanelMenu.
	* @todo refactor this as utility code that can be reused.
	* @author Justin Smith @justintemps
*/

(function addScript() {

  var head = document.getElementsByTagName("head")[0];
  var allScripts = document.getElementsByTagName("script");
  var newScript = document.createElement("script");
  var scriptAdded = false;
  
  //Get the scripts in order and then call the chart
  function add_scripts_then_chart() {
	$.getScript("https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js", function() {
		$.getScript("https://code.highcharts.com/highcharts.js", function () {		
			$.getScript("https://code.highcharts.com/modules/exporting.js", chartCallBack);
		});
	});
  };
  
 //Add one script to the head which gets all the scripts and execute as soon as it's added.
  newScript.text = '(' + add_scripts_then_chart + ')();';
  newScript.className = 'chart_script';
  newScript.type = "text/javascript";
  
  //Check to see if the script is already in the head. If it's not, add it.
  for (var i = 0; i < allScripts.length; i++) {
    if (allScripts[i].className == 'chart_script') {
      scriptAdded = true;
      console.log("The script has already been added.");
    };
  };
  if (!scriptAdded) {
    head.appendChild(newScript);
  };
})();
/**
	* @desc Force window to open at the top of the page instead of the chart.
*/

//Firefox
$(window).load(function(){
    setTimeout(function() {
        $('html, body').scrollTop(0);
    }, 10);
});

//Chrome
$(document).load().scrollTop(0);
