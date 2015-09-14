angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $auth, $ionicPopup, $window, $log, $state, $http, $rootScope) {

  $scope.rootURL = "http://vala-api.herokuapp.com/";

  $scope.validateUser = function(){
    $scope.currentUser = JSON.parse($window.localStorage.getItem('current-user'))
  };

  // Form data for the login modal
  $scope.loginData = {};

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {

    $auth.submitLogin($scope.loginData).then(function(response){
      $window.localStorage.setItem('current-user', JSON.stringify(response));
      $scope.validateUser();

      $state.go('app.home');

      var valetID = response.id;
      var url = $scope.rootURL + "api/v1/valets/" + valetID;

      var data = {
        valet: {
          status: 'available'
        }
      };

      $http.patch(url, data).success(function(change_status){

      }).error(function(change_status){
        console.log(change_status);
      })

    }).catch(function(response){

      $ionicPopup.alert({
        title: 'Wrong password',
        template: 'Try again'
      })
    })
  };

  //sign up
  $scope.registrationForm = {};

  $scope.doSignup = function(){
    $auth.submitRegistration($scope.registrationForm).then(function(response){
      $window.localStorage.setItem('current-user', JSON.stringify(response.data.data));
      $scope.validateUser();

      $state.go('app.home');

    }).catch(function(response){
    })
  };

  $scope.logout = function(){
    $window.localStorage.setItem('current-user', null);
    $scope.validateUser();
  };
})

.controller('ProfileCtrl', function($scope, $http){

  $scope.validateUser();
  var valetID = $scope.currentUser.id;
  var url = $scope.rootURL + "api/v1/valets/" + valetID;

  $http.get(url).success(function(response){

    $scope.valetInfo = response;
  }).error(function(response){

  })

})

.controller('HomeCtrl', function($scope, $http, nemSimpleLogger, uiGmapGoogleMapApi, $state, $rootScope, PrivatePubServices, $window){
  nemSimpleLogger.doLog = true; //default is true
  nemSimpleLogger.currentLevel = nemSimpleLogger.LEVELS.debug


  $scope.myLocation = {
    lng : '',
    lat: ''
  };

  PrivatePubServices.subscribe('/valet/new');
  PrivatePubServices.logMessages('/valet/new');

  $scope.drawSelfMap = function(position) {
    //$scope.$apply is needed to trigger the digest cycle when the geolocation arrives and to update all the watchers
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
            animation: google.maps.Animation.BOUNCE,
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

            createDirectionsService($scope.selfLocation, $scope.destination, google.maps.TravelMode.WALKING)
          }
        }
      };

      var createCarParkMarker = function(title, latitude, longitude, address, p_icon){
        $scope.carParkmarker =  {
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

            createDirectionsService($scope.parkLocation, $scope.destination, google.maps.TravelMode.DRIVING)

            createCarParkMarker("Car Park", p_latitude, p_longitude, p_address, 'img/parkinglot.png')
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
        var timeEST

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
        // console.log($scope.allMarkers)
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

        matrixService.getDistanceMatrix(durationDistance, function(responseD, status){
          if (status == google.maps.DistanceMatrixStatus.OK){
            distanceEST = responseD.rows[0].elements[0].distance.text;
            timeEST     = responseD.rows[0].elements[0].duration.text;

            createDropOffMarker(title, id, userName, userPic, transmission, userPhoneNum, parkingLatitude, parkingLongitude, parkingAddress, destinationLatitude, destinationLongitude, destinationAddress, distanceEST, timeEST, iconURL)

            $scope.allMarkers.push(newMarker)
          }
        console.log($scope.allMarkers)
        })
      };

      $http.get($scope.rootURL + "api/v1/requests/pickup").success(function(indexPickups){
      for (var num = 0; num < indexPickups.length; num++){
        runPickUpMarker(indexPickups[num],"Pick up ticket", 'img/blue-dot.png');
      };

      }).error(function(indexPickups){
        console.log(indexPickups);
      })

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

        matrixService.getDistanceMatrix(durationDistance, function(responseD, status){
          if (status == google.maps.DistanceMatrixStatus.OK){
            distanceEST = responseD.rows[0].elements[0].distance.text;
            timeEST     = responseD.rows[0].elements[0].duration.text;

            transmission = transmission ? 'manual' : 'automatic';

            createPickUpMarker(title, id, userName, userPic, transmission, userPhoneNum, latitude, longitude, address, distanceEST, timeEST, iconURL)

            $scope.allMarkers.push(newMarker)
          }
        // console.log($scope.allMarkers)
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

        var address         = request.location;
        var latitude        = request.latitude;
        var longitude       = request.longitude;

        var p_address         = request.location;
        var p_latitude        = request.latitude;
        var p_longitude       = request.longitude;

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
          }
        // console.log($scope.allMarkers)
        })
      };


      $scope.dropOffMarkers =[];

      $http.get($scope.rootURL + "api/v1/requests/dropoff").success(function(indexDropoffs){
        for (var num = 0; num < indexDropoffs.length; num++){
          runDropOffMarker(indexDropoffs[num], "Drop off ticket", 'img/red-dot.png');
        }

        $scope.map = {
          center: {
            latitude: $scope.myLocation.lat,
            longitude: $scope.myLocation.lng
          },
          zoom: 15,
          pan: 2
        };
      }).error(function(indexDropoffs){
        console.log(indexDropoffs);
      })

      PrivatePub.subscribe('/valet/new', function(data, channel) {
        console.log(data);

        if (data.request.type == 'pick_up'){
          AddPickUpMarker(data, "Pick up ticket", 'img/blue-dot.png')
        } else{
          AddDropOffMarker(data, "Drop off ticket", 'img/red-dot.png')
        }
      });


    });
  };

  navigator.geolocation.getCurrentPosition($scope.drawSelfMap);



  $scope.valetReply = function(){
    var valetID = $scope.currentUser.id;
    var requestID = this.currentLocation.id

    var url = $scope.rootURL + "api/v1/valets/" + valetID + "/requests/" + requestID + "/valet_pick_up"

    $http.patch(url).success(function(response){

      console.log(response);

      $scope.currentPickUp = $window.localStorage.setItem('current-pickup', JSON.stringify(response));

      $state.go('app.pickup');

    }).error(function(response){
      console.log(response)
    })
  };
})

.controller('OnRoutePickUpCtrl', function($scope, $http, nemSimpleLogger, uiGmapGoogleMapApi, $rootScope, $state, PrivatePubServices, $window, $ionicPopup){
  nemSimpleLogger.doLog = true; //default is true
  nemSimpleLogger.currentLevel = nemSimpleLogger.LEVELS.debug;

  $scope.validateUser();
  $scope.myLocation = {
    lng : '',
    lat: ''
  };

  $scope.pickUpMap = function(position){

    $scope.$apply(function() {

      var createTarget = function(targetLat, targetLng, iconURL){
        tempTarget = {
          id: "Target",
          coords: {
            latitude: targetLat,
            longitude: targetLng
          },
          options: {
            animation: google.maps.Animation.DROP,
            icon: iconURL
          }
        };
        if(tempTarget.options.icon =='img/blue-dot.png'){
          $scope.targetMarker = tempTarget
        } else{
          $scope.targetCarPark = tempTarget
        }
      };

      var polylineSpecification = function(id, path, color){
        myPolyLine = {
          id: id,
          path: path,
          stroke: {
              color: color,
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
        return myPolyLine;
      };

      var createDirectionsService = function(destination, originLoc, destinationLoc){
        var directionsService = new google.maps.DirectionsService();
        var directionsDisplay = new google.maps.DirectionsRenderer();

        if(destination == "carpark"){
          var request = {
            origin : originLoc,
            destination : destinationLoc,
            travelMode : google.maps.TravelMode.DRIVING
          };

          directionsService.route(request, function(response, status) {
          if (status == google.maps.DirectionsStatus.OK) {
              directionsDisplay.setDirections(response);
              $scope.path_coords = response.routes[0].overview_path
              var myPolyLine ={};

              $scope.polylines_park = [polylineSpecification(888, $scope.path_coords, 'green')]
              console.log($scope.polylines_park)

          }
        });

        } else {
          var request = {
            origin : originLoc,
            destination : destinationLoc,
            travelMode : google.maps.TravelMode.WALKING
          };
          directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
            console.log(response)
              $scope.path_coords = response.routes[0].overview_path
              var myPolyLine ={};

              $scope.polylines = [polylineSpecification(999, $scope.path_coords, 'blue')]
              console.log($scope.polylines)

            };
          });
        };
      };

      $scope.myLocation.lng = position.coords.longitude;
      $scope.myLocation.lat = position.coords.latitude;

      $scope.map = {
        center: {
          latitude: $scope.myLocation.lat,
          longitude: $scope.myLocation.lng
        },
        zoom: 15,
        pan: 2
      };

      $scope.marker = {
        id: "you",
        coords: {
          latitude: $scope.myLocation.lat,
          longitude: $scope.myLocation.lng
        },
        options: {
            animation: google.maps.Animation.BOUNCE,
            icon: 'img/man.png'
        }
      };

      $scope.currentPickUp = JSON.parse($window.localStorage.getItem('current-pickup'))
      console.log($scope.currentPickUp);


      $scope.validateUser();

      var targetLat = $scope.currentPickUp.source_location.latitude;
      var targetLng = $scope.currentPickUp.source_location.longitude;
      var selfLocation   = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude);

      var targetDestination = new google.maps.LatLng(targetLat, targetLng);

      var targetCarParkLat  = $scope.currentPickUp.parking_location.latitude;
      var targetCarParkLng  = $scope.currentPickUp.parking_location.longitude;

      var carParkDestination = new google.maps.LatLng(targetCarParkLat, targetCarParkLng);

      createTarget(targetLat, targetLng, 'img/blue-dot.png');
      createDirectionsService("client", selfLocation, targetDestination);

      createTarget(targetCarParkLat, targetCarParkLng, 'img/parkinglot.png');
      createDirectionsService("carpark", targetDestination, carParkDestination);


    })

  };
  navigator.geolocation.getCurrentPosition($scope.pickUpMap);

  $scope.parked = function(){
    console.log(this)
    var valetID = this.currentPickUp.valet_id_pick_up;
    var requestID = this.currentPickUp.request_id;
    console.log($scope.currentPickUp)

    var url = $scope.rootURL + "api/v1/valets/" + valetID + "/requests/" + requestID + "/car_parked";
    console.log(url)

    var data = {
      request: {
        bay_number: $scope.val
      }
    };

    $http.put(url, data).success(function(response){
      console.log(response);
      $state.go('app.home');

    }).error(function(response){
      console.log(response)
       $ionicPopup.alert({
        title: 'Error',
        template: 'Please contact HQ'
      });
    })
  };
})


