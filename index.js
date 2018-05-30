
var MAP;


// Neighborhood names
var urlNbhoodNames = "https://data.cityofnewyork.us/api/views/xyye-rtrs/rows.json?accessType=DOWNLOAD";
var nbhoodNames = [];

// Crimes in NY
var crimes = [];

var moreSecure = [];

var locationsMoreSecure = [];
var locationELIU = [];


var markersELIU = [];
var markersCrimes = [];

var colors = ['red', 'blue', 'orange', 'white', 'purple'];

// function for change color navbar
function chgColorNavbar() {
	$(window).scroll(function() {
	    	if ($("#bar").offset().top > 631) {
	            $("#bar").addClass("bg-white");
	        }
	        else {
	            $("#bar").removeClass("bg-white");
	        }
	    });
}

// Function charge the map
function initMap() {
    MAP = new google.maps.Map(document.getElementById('map'), {
		zoom: 11,
		center: {lat: 40.730610, lng: -73.935242}
	});

	var contentString = '<h1 style="font-size: 20px; color: #027E94">NYU Stern School</h1>';

    var infowindow = new google.maps.InfoWindow({
      content: contentString,
      maxWidth: 200,
    });

    MAP.data.loadGeoJson('http://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson');

    MAP.data.setStyle(function(feature) {
	    var col = feature.getProperty('BoroCD');
	    
	    if (col > 100 && col < 200) {
	      color = colors[0];
	    }
	    else if (col > 200 && col < 300) {
	    	color = colors[1];
	    }
	    else if (col > 300 && col < 400) {
	    	color = colors[2];
	    }
	    else if (col > 400 && col < 500) {
	    	color = colors[3];
	    }
	    else {
	    	color = colors[4];
	    }
	    
	    return {
		    fillColor: color,
		    strokeWeight: 1
	    }
  	});

	var adrss = "NYU Stern School of Business";
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({'address' : adrss}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			var marker = new google.maps.Marker({
	          position: results[0].geometry.location,
	          map: MAP,
	          animation: google.maps.Animation.BOUNCE
	        });
	        marker.addListener('click', function() {
          		infowindow.open(MAP, marker);
        	});
		}
	});
}


// function that asks for the data ELIU (Extremely Low Income Units)
function getELIU() {
	$.ajax({
	    url: "https://data.cityofnewyork.us/resource/q3m4-ttp3.json?$select=borough,extremely_low_income_units,latitude,longitude&$where=extremely_low_income_units%20%3E%20160",
	    type: "GET",
	    data: {
	      "$limit" : 5000,
	    }
	})
		.done(function(data) {
			var latlng;

			var directionsService = new google.maps.DirectionsService();
        	var directionsDisplay = new google.maps.DirectionsRenderer();

        	directionsDisplay.setMap(MAP);

			for (var i = 0; i < data.length; i++) {
				latlng = new google.maps.LatLng(data[i].latitude, data[i].longitude);
				locationELIU.push(latlng.toJSON());
			}

			function addMarker(location) {
		        var marker = new google.maps.Marker({
		          	position: location,
		          	map: MAP
		        });

		        marker.addListener('click', function() {
			        var latlng = {lat: marker.getPosition().toJSON().lat, lng: marker.getPosition().toJSON().lng};
		        	var geocoder = new google.maps.Geocoder();
		        	var infowindow = new google.maps.InfoWindow({
		        		maxWidth: 200,
		        		zIndex: 200
		    		});	
		        	
		        	MAP.data.setStyle({visible: false});

		        	var service = new google.maps.DistanceMatrixService();
					service.getDistanceMatrix({
					    origins: [marker.getPosition()],
					    destinations: ["NYU Stern School of Business"],
					    travelMode: 'TRANSIT'
				  	}, callback);
					function callback(response, status) {
						if (status == 'OK') {
						    var origins = response.originAddresses;
						    var destinations = response.destinationAddresses;

						    for (var i = 0; i < origins.length; i++) {
						      	var results = response.rows[i].elements;
						      	for (var j = 0; j < results.length; j++) {
							        var element = results[j];
							        var distance = element.distance.text;
							        var duration = element.duration.text;
							        var from = origins[i];
							        var to = destinations[j];
							        						
						    		geocoder.geocode({'location': latlng}, function(results, status) {
									    if (status === 'OK') {
									      	infowindow.setContent("Neighborhood: " + results[0].address_components[2].long_name + "</br>Distance: " + distance);
									    } 
									    else {
								      		window.alert('Geocoder failed due to: ' + status);
									    }
									});
						      	}
						    }
						    infowindow.open(MAP, marker);
						}
					}
      				
      				directionsService.route({
			            origin: {lat: marker.getPosition().toJSON().lat, lng: marker.getPosition().toJSON().lng},
			            destination: "NYU Stern School of Business",
			            travelMode: 'TRANSIT',
			        }, 	function (response, status) {
			        		if (status === google.maps.DirectionsStatus.OK) {
				                directionsDisplay.setDirections(response);
				            } 
				            else {
				                window.alert(status);
				            }
        				});
        		});
		            
		        markersELIU.push(marker);
		        marker.setVisible(false);
	     	}

	     	for (var j = 0; j < locationELIU.length; j++) {
	     		addMarker(locationELIU[j]);
	     	}
		});
}


// function that asks for the data Neighborhood Names 
function getNbhoodNames(url) {
	var dt = $.get(url, function(){})

		.done(function() {
			var dts = dt.responseJSON.data;
			for (var i = 0; i < dts.length; i++) {
				nbhoodNames.push([dts[i][10], dts[i][9], dts[i][16]]);
			}
		});
}

// function that asks for the data Crimes in NY 
function getCrimes() {
	$.ajax({
	    url: "https://data.cityofnewyork.us/resource/9s4h-37hy.json?$select=boro_nm,addr_pct_cd,cmplnt_fr_dt,ofns_desc,lat_lon&$where=within_circle(lat_lon, 40.730610, -73.935242, 100000)&cmplnt_fr_dt=2015-12-31",
	    type: "GET",
	    data: {
	      "$limit" : 5000,
	    }
	})
		.done(function(data) {
			var latlng;
			var directionsService = new google.maps.DirectionsService();
        	var directionsDisplay = new google.maps.DirectionsRenderer();
        	
			for(i = 0; i < data.length; i++) {
				latlng = new google.maps.LatLng(data[i].lat_lon.coordinates[1], data[i].lat_lon.coordinates[0]);
				crimes.push([data[i].boro_nm, data[i].addr_pct_cd, data[i].cmplnt_fr_dt, latlng.toJSON(), data[i].ofns_desc]);
			}
			crimes.sort(); 

			var indices = new Array(124); 
			indices.fill(0);

			for (var i = 1; i <= indices.length; i++) {
		        for (var j = 0; j < crimes.length; j++) {
			        if (i == crimes[j][1]) {
			      	    indices[i] = indices[i] + 1;
			    	} 
			  	} 
			}
			
			var arr = [];
			for (var i = 0; i < indices.length; i++) {
				if (indices[i] != 0 && indices[i] < 7 && indices[i] > 1) {
				   arr.push(i);
				}
			}
			for (var i = 0; i < arr.length; i++) {
				for (var j = 0; j < crimes.length; j++) {
					if (arr[i] == crimes[j][1]) {
						moreSecure.push([crimes[j][0], crimes[j][1], crimes[j][3], crimes[j][4]]);
					}
				}
			}		

			for (var i = 0; i < moreSecure.length; i++) {
				locationsMoreSecure.push(moreSecure[i][2]);
			}
			
			function addMarker(location) {
		        var marker = new google.maps.Marker({
		          	position: location,
		          	map: MAP
		        });

		        marker.addListener('click', function() {
			        var latlng = {lat: marker.getPosition().toJSON().lat, lng: marker.getPosition().toJSON().lng};
		        	var geocoder = new google.maps.Geocoder;
		        	var infowindow = new google.maps.InfoWindow({
		        		maxWidth: 200,
		        		zIndex: 200
		    		});	
		        	
		        	MAP.data.setStyle({visible: false});

		        	var service = new google.maps.DistanceMatrixService();
					service.getDistanceMatrix({
					    origins: [marker.getPosition()],
					    destinations: ["NYU Stern School of Business"],
					    travelMode: 'TRANSIT'
				  	}, callback);
					function callback(response, status) {
						if (status == 'OK') {
						    var origins = response.originAddresses;
						    var destinations = response.destinationAddresses;

						    for (var i = 0; i < origins.length; i++) {
						      	var results = response.rows[i].elements;
						      	for (var j = 0; j < results.length; j++) {
							        var element = results[j];
							        var distance = element.distance.text;
							        var duration = element.duration.text;
							        var from = origins[i];
							        var to = destinations[j];
							        						
						    		geocoder.geocode({'location': latlng}, function(results, status) {
									    if (status === 'OK') {
									      	infowindow.setContent("Neighborhood: " + results[0].address_components[2].long_name + "</br>Distance: " + distance);
									    } 
									    else {
								      		window.alert('Geocoder failed due to: ' + status);
									    }
									});
						      	}
						    }
						    infowindow.open(MAP, marker);
						}
					}
      				
      				directionsService.route({
			            origin: {lat: marker.getPosition().toJSON().lat, lng: marker.getPosition().toJSON().lng},
			            destination: "NYU Stern School of Business",
			            travelMode: 'TRANSIT',
			        }, 	function (response, status) {
			        		if (status === google.maps.DirectionsStatus.OK) {
				                directionsDisplay.setDirections(response);
				            } 
				            else {
				                window.alert(status);
				            }
        				});
    		    });
	            
		        markersCrimes.push(marker);
		        marker.setVisible(false);
	     	}

	     	for (var j = 0; j < locationsMoreSecure.length; j++) {
	     		addMarker(locationsMoreSecure[j]);
	     	}

		});	
}

function updateTable() {
	var tableReference = $("#mainTableBody")[0];
	var newRow, borough, precinct, crime, location;

	for(var i = 0; i < moreSecure.length; i++) {
		latlng = [crimes[i][3].lat, crimes[i][3].lng];
		newRow = tableReference.insertRow(tableReference.rows.length);
		borough = newRow.insertCell(0);
		precinct = newRow.insertCell(1);
		location = newRow.insertCell(2)
		crime = newRow.insertCell(3);

		borough.innerHTML = moreSecure[i][0]
		precinct.innerHTML = moreSecure[i][1];
		location.innerHTML = latlng;
		crime.innerHTML = moreSecure[i][3];
	}
}


function showMarkers(arr) {
    for (var i = 0; i < arr.length; i++) {
    	arr[i].setMap(MAP);
    	arr[i].setVisible(true);
    }
}

function hideMarkers(arr) {
	for (var i = 0; i < arr.length; i++) {
    	arr[i].setMap(null);
    }
}

//function for popovers
$(function () {
  $('[data-toggle="popover"]').popover({
      placement: 'top',
      trigger: 'hover',
      delay: 300
  })
})

$(document).ready(function() {
	getELIU();
	getCrimes();
	getNbhoodNames(urlNbhoodNames);
	$("#btnUpdate").on("click", updateTable);
	$("#btnAfford").on({
		click: function() {
			var infowindow = new google.maps.InfoWindow({
				content: "Click on any marker",
				maxWidth: 200,
				position: MAP.getCenter(),
				zIndex: 200
			});
			infowindow.open(MAP);
			hideMarkers(markersCrimes);
			showMarkers(markersELIU);
		}, 
		dblclick: function() {
			hideMarkers(markersELIU);
		}
	}); 
	$("#btnSafety").on({
	    click: function() {
    	    hideMarkers(markersELIU);
    		showMarkers(markersCrimes);
    		MAP.setZoom(10);
    		MAP.data.setStyle(function(feature) {
    		    var col = feature.getProperty('BoroCD');
    		    if (col > 100 && col < 200) {
    		      color = colors[0];
    		    }
    		    else if (col > 200 && col < 300) {
    		    	color = colors[1];
    		    }
    		    else if (col > 300 && col < 400) {
    		    	color = colors[2];
    		    }
    		    else if (col > 400 && col < 500) {
    		    	color = colors[3];
    		    }
    		    else {
    		    	color = colors[4];
    		    }
    		    
    		    return {
    			    fillColor: color,
    			    strokeWeight: 1
    		    }
      		});
	    },
  		dblclick: function() {
		    hideMarkers(markersCrimes);
	    }
    });
	chgColorNavbar();	
});

