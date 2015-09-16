app.controller('HomeCtrl', function($scope, $http, nemSimpleLogger, uiGmapGoogleMapApi, $state, $rootScope, PrivatePubServices, $window, $cordovaGeolocation, $timeout){
  nemSimpleLogger.doLog = true; 
  nemSimpleLogger.currentLevel = nemSimpleLogger.LEVELS.debug

  var posOptions = {timeout: 10000, enableHighAccuracy: false};
  $cordovaGeolocation
    .getCurrentPosition(posOptions)
    .then(function (position) {
      console.log(position)
      var lat  = position.coords.latitude
      var long = position.coords.longitude
      console.log(lat + long)
      $timeout(function(){
        $scope.drawSelfMap(position);
      });
    }, function(err) {
      
    });

  $scope.myLocation = {
    lng : '',
    lat: ''
  };

  PrivatePubServices.subscribe('/valet/new');
  PrivatePubServices.logMessages('/valet/new');

  $scope.drawSelfMap = function(position) {
    console.log("testing", position);
    $scope.$apply(function() {
      $scope.validateUser();
      $scope.myLocation.lng = position.coords.longitude;
      $scope.myLocation.lat = position.coords.latitude;

      $scope.marker = {
        id: "you",
        coords: {
          latitude: $scope.myLocation.lat,
          longitude: $scope.myLocation.lng
        },
        options: {
            animation: google.maps.Animation.DROP,
            icon: 'img/man.png'
        }
      };

      $scope.allMarkers =[];
      var newMarker = {};

      var createDirectionsService = function(originLoc, destinationLoc, mode){
        var directionsService = new google.maps.DirectionsService();
        var directionsDisplay = new google.maps.DirectionsRenderer();

        var request = {
          origin : originLoc,
          destination : destinationLoc,
          travelMode : mode
        };

        directionsService.route(request, function(response, status) {
          if (status == google.maps.DirectionsStatus.OK) {
              directionsDisplay.setDirections(response);

            $scope.path_coords = response.routes[0].overview_path
            $scope.polylines = [
              {
                id: 888,
                path: $scope.path_coords,
                stroke: {
                    color: 'blue',
                    weight: 2
                },
                editable: false,
                draggable: false,
                geodesic: false,
                visible: true,
                icons: [{
                    icon: {
                    },
                    offset: '25px',
                    repeat: '50px'
                }]
              }
            ];
          }
          $scope.$apply();
        });
      };

      var createPickUpMarker = function(title, id, userName, userPic, transmission, userPhoneNum, latitude, longitude, address, distanceEST, timeEST, icon){
        newMarker =  {
          title:        title,
          id:           id,
          name:         userName,
          picture:      userPic,
          transmission: transmission,
          phone:        userPhoneNum,
          latitude:     latitude,
          longitude:    longitude,
          location:     address,
          distanceEST:  distanceEST,
          timeEST:      timeEST,
          icon:         icon,
          show:         false,
          clickPin: function() {
            $scope.currentLocation = this
            console.log(this)
            $scope.selfLocation   = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude)
            $scope.destination    = new google.maps.LatLng(this.latitude, this.longitude)

            createDirectionsService($scope.selfLocation, $scope.destination, google.maps.TravelMode.WALKING);
          }
        }
      };

      var createCarParkMarker = function(title, latitude, longitude, address, p_icon){
        return $scope.carParkmarker =  {
          id: "carpark",
          coords: {
            latitude: latitude,
            longitude: longitude
          },
          options:{
            animation: google.maps.Animation.DROP,
            icon: p_icon
          }
        }
      };

      var createDropOffMarker = function(title, id, userName, userPic, transmission, userPhoneNum, p_latitude, p_longitude, p_address, latitude, longitude, address, distanceEST, timeEST, icon){
        newMarker =  {
          title:        title,
          id:           id,
          name:         userName,
          picture:      userPic,
          transmission: transmission,
          phone:        userPhoneNum,
          p_latitude:   p_latitude,
          p_longitude:  p_longitude,
          p_location:   p_address,
          latitude:     latitude,
          longitude:    longitude,
          location:     address,
          distanceEST:  distanceEST,
          timeEST:      timeEST,
          icon:         icon,
          show:         false,
          clickPin: function() {
            $scope.currentLocation = this
            console.log(this)
            
            $scope.parkLocation   = new google.maps.LatLng(this.p_latitude, this.p_longitude)
            $scope.destination    = new google.maps.LatLng(this.latitude, this.longitude)

            createDirectionsService($scope.parkLocation, $scope.destination, google.maps.TravelMode.DRIVING);

            createCarParkMarker("Car Park", p_latitude, p_longitude, p_address, 'img/parkinglot.png');
          }
        }
      };


      var runPickUpMarker = function(indexElement, title, iconURL){

        var title           = title
        var user            = indexElement.user;
        var sourceLocation  = indexElement.source_location;
        var id              = indexElement.id;

        var userName        = user.name;
        var userPic         = user.profile_picture;
        var transmission    = user.transmission;
        var userPhoneNum    = user.phone_number;

        var address         = sourceLocation.address;
        var latitude        = sourceLocation.latitude;
        var longitude       = sourceLocation.longitude;

        var myCurLoc        = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude)
        var myDestination   = new google.maps.LatLng(latitude, longitude)
        var iconURL         = iconURL

        var distanceEST;
        var timeEST;

        var matrixService   = new google.maps.DistanceMatrixService();

        var durationDistance = {
          origins:      [myCurLoc],
          destinations: [myDestination],
          travelMode : google.maps.TravelMode.WALKING
        }

        matrixService.getDistanceMatrix(durationDistance, function(responseD, status){
          if (status == google.maps.DistanceMatrixStatus.OK){
            distanceEST = responseD.rows[0].elements[0].distance.text;
            timeEST     = responseD.rows[0].elements[0].duration.text;

            createPickUpMarker(title, id, userName, userPic, transmission, userPhoneNum, latitude, longitude, address, distanceEST, timeEST, iconURL)

            $scope.allMarkers.push(newMarker)
          }
        })
      };

      var runDropOffMarker = function(indexElement, title, iconURL){

        var title                 = title
        var user                  = indexElement.user;
        var parkingLocation       = indexElement.parking_location;
        var destinationLocation   = indexElement.destination_location;
        var id                    = indexElement.id;

        var userName              = user.name;
        var userPic               = user.profile_picture;
        var transmission          = user.transmission;
        var userPhoneNum          = user.phone_number;

        var parkingAddress        = parkingLocation.address;
        var parkingLatitude       = parkingLocation.latitude;
        var parkingLongitude      = parkingLocation.longitude;

        var destinationAddress    = destinationLocation.address;
        var destinationLatitude   = destinationLocation.latitude;
        var destinationLongitude  = destinationLocation.longitude;


        var myCarPark       = new google.maps.LatLng(parkingLatitude, parkingLongitude)
        var myDestination   = new google.maps.LatLng(destinationLatitude, destinationLongitude)
        var iconURL         = iconURL

        var distanceEST;
        var timeEST


        var matrixService   = new google.maps.DistanceMatrixService();

        //checking how to implement two way points
        var durationDistance = {
          origins:      [myCarPark],
          destinations: [myDestination],
          travelMode : google.maps.TravelMode.DRIVING
        }

        matrixService.getDistanceMatrix(durationDistance, function(responseDrop, status){
          if (status == google.maps.DistanceMatrixStatus.OK){
            distanceEST = responseDrop.rows[0].elements[0].distance.text;
            timeEST     = responseDrop.rows[0].elements[0].duration.text;

            createDropOffMarker(title, id, userName, userPic, transmission, userPhoneNum, parkingLatitude, parkingLongitude, parkingAddress, destinationLatitude, destinationLongitude, destinationAddress, distanceEST, timeEST, iconURL)

            $scope.allMarkers.push(newMarker)
          }
        // console.log($scope.allMarkers)
        })
      };

      var AddPickUpMarker = function(data, title, iconURL){

        var title           = title
        var request         = data.request;

        var id              = request.id;
        var userName        = request.name;
        var userPic         = request.picture;
        var transmission    = request.transmission;
        var userPhoneNum    = request.phone;

        var address         = request.location;
        var latitude        = request.latitude;
        var longitude       = request.longitude;

        var myCurLoc        = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude)
        var myDestination   = new google.maps.LatLng(latitude, longitude)
        var iconURL         = iconURL

        var distanceEST;
        var timeEST

        var matrixService   = new google.maps.DistanceMatrixService();

        var durationDistance = {
          origins:      [myCurLoc],
          destinations: [myDestination],
          travelMode : google.maps.TravelMode.WALKING
        }

        matrixService.getDistanceMatrix(durationDistance, function(responseDrop, status){
          if (status == google.maps.DistanceMatrixStatus.OK){
            distanceEST = responseDrop.rows[0].elements[0].distance.text;
            timeEST     = responseDrop.rows[0].elements[0].duration.text;

            transmission = transmission ? 'manual' : 'automatic';

            createPickUpMarker(title, id, userName, userPic, transmission, userPhoneNum, latitude, longitude, address, distanceEST, timeEST, iconURL)

            $scope.allMarkers.push(newMarker)
            $scope.$apply();
          }
        })
      };

      var AddDropOffMarker = function(data, title, iconURL){

        var title           = title
        var request         = data.request;

        var id              = request.id;
        var userName        = request.name;
        var userPic         = request.picture;
        var transmission    = request.transmission;
        var userPhoneNum    = request.phone;

        var address         = request.destination_location;
        var latitude        = request.destination_latitude;
        var longitude       = request.destination_longitude;

        var p_address         = request.parking_location_location;
        var p_latitude        = request.parking_location_latitude;
        var p_longitude       = request.parking_location_longitude;

        var parkLocation   = new google.maps.LatLng(p_latitude, p_longitude)
        var myDestination     = new google.maps.LatLng(latitude, longitude)
        var iconURL           = iconURL

        var distanceEST;
        var timeEST

        var matrixService   = new google.maps.DistanceMatrixService();

        var durationDistance = {
          origins:      [parkLocation],
          destinations: [myDestination],
          travelMode : google.maps.TravelMode.DRIVING
        }

        matrixService.getDistanceMatrix(durationDistance, function(responseD, status){
          if (status == google.maps.DistanceMatrixStatus.OK){
            distanceEST = responseD.rows[0].elements[0].distance.text;
            timeEST     = responseD.rows[0].elements[0].duration.text;

            transmission = transmission ? 'manual' : 'automatic';

            createDropOffMarker(title, id, userName, userPic, transmission, userPhoneNum, p_latitude, p_longitude, p_address, latitude, longitude, address, distanceEST, timeEST, iconURL)

            $scope.allMarkers.push(newMarker)
            $scope.$apply();
          }
        })
      };

      PrivatePub.subscribe('/valet/new', function(data, channel) {

        if (data.request.type == 'pick_up'){
          AddPickUpMarker(data, "Pick up ticket", 'img/blue-dot.png')
        } else if (data.request.type == 'drop_off'){
          AddDropOffMarker(data, "Drop off ticket", 'img/red-dot.png')
        }
      });

      $http.get($scope.rootURL + "api/v1/requests/pickup").success(function(indexPickups){
        for (var num = 0; num < indexPickups.length; num++){
          runPickUpMarker(indexPickups[num],"Pick up ticket", 'img/blue-dot.png');
        };
      }).error(function(indexPickups){
        console.log(indexPickups);
      })

      $http.get($scope.rootURL + "api/v1/requests/dropoff").success(function(indexDropoffs){
        for (var num = 0; num < indexDropoffs.length; num++){
          runDropOffMarker(indexDropoffs[num], "Drop off ticket", 'img/red-dot.png');
        }

        $scope.map = {
          center: {
            latitude: $scope.myLocation.lat,
            longitude: $scope.myLocation.lng
          },
          zoom: 14,
          pan: 3
        };

      }).error(function(indexDropoffs){
        console.log(indexDropoffs);
      })
    });
  };



  $scope.valetReply = function(){
    var valetID = $scope.currentUser.id;
    var requestID = this.currentLocation.id

    var url = $scope.rootURL + "api/v1/valets/" + valetID + "/requests/" + requestID + "/valet_pick_up"

    $http.patch(url).success(function(response){

      console.log(response);

      $scope.currentTicket = $window.localStorage.setItem('current-ticket', JSON.stringify(response));

      $state.go('app.pickup');

    }).error(function(response){
      console.log(response)
    })
  };

  $scope.valetReplyDrop = function(){
    console.log('drop off ticket accept')
    var valetID = $scope.currentUser.id;
    var requestID = this.currentLocation.id;

    var url = $scope.rootURL + "api/v1/valets/" + valetID + "/requests/" + requestID + "/valet_drop_off"

    $http.patch(url).success(function(response){

      console.log(response);

      $scope.currentTicket = $window.localStorage.setItem('current-ticket', JSON.stringify(response));

      $state.go('app.dropoff');

    }).error(function(response){
      console.log(response)
    })

  }


})

