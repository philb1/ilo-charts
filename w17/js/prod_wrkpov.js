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
var defaultSeries = ["Total Emerging and Developing Countries","Developing economies","Emerging economies","Northern Africa","Sub-Saharan Africa","Latin America and the Caribbean","Arab States","Eastern Asia","Southern Asia","South-Eastern Asia and the Pacific","Eastern Europe","Central and Western Asia"];

var weso_Countries = [
{name:"Total Emerging and Developing Countries",data:[42.1,40.8,39.2,37.3,34.6,32.3,31.4,30.6,30.0,29.4,28.7,28.1]},
{name:"Developing economies",data:[78.9,77.9,77.2,75.7,74.2,72.8,71.8,70.7,70.0,69.0,67.9,66.7]},
{name:"Emerging economies",data:[38.6,37.2,35.5,33.5,30.6,28.2,27.2,26.3,25.6,25.0,24.3,23.7]},
{name:"Northern Africa",data:[29.7,28.3,27.8,27.2,25.8,24.5,24.2,24.2,24.1,24.0,23.6,23.2]},
{name:"Sub-Saharan Africa",data:[71.0,70.4,70.2,69.4,68.2,66.8,66.0,65.1,64.4,63.7,62.8,61.9]},
{name:"Latin America and the Caribbean",data:[12.1,10.8,10.3,9.6,9.0,8.4,8.2,8.0,8.1,8.0,7.9,7.8]},
{name:"Arab States",data:[21.4,20.4,19.8,19.3,19.9,19.1,18.7,19.0,22.1,21.4,20.9,20.4]},
{name:"Eastern Asia",data:[27.8,25.8,23.7,21.3,17.6,15.6,14.1,12.7,11.7,10.7,9.9,9.1]},
{name:"Southern Asia",data:[66.1,65.4,64.0,62.3,57.7,52.9,52.0,51.0,50.0,49.0,48.1,47.1]},
{name:"South-Eastern Asia and the Pacific",data:[45.7,44.0,39.8,34.7,33.0,31.1,29.5,27.7,26.2,24.8,23.4,22.0]},
{name:"Eastern Europe",data:[3.6,3.4,3.1,3.3,3.3,3.4,3.3,3.3,3.2,3.2,3.1,3.1]},
{name:"Central and Western Asia",data:[15.2,12.5,11.5,10.7,9.8,8.9,7.9,7.4,7.0,6.6,6.3,5.9]}
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
				text: 'title ?',
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
				pointFormat: '<p style="line-height: 24px;">Working Poverty: ' + '<span style="font-weight: 600; line-height: 200%;">{point.y:.1f}%</span></p>', 
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
					text: 'Working Poverty (%)'
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
