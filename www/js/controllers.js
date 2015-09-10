angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $auth, $ionicPopup, $window, $log, $state, $http) {

  $scope.rootURL = "http://localhost:3000/"  

  var validateUser = function(){
    $scope.currentUser = JSON.parse($window.localStorage.getItem('current-user'))
    
  };

  // Form data for the login modal
  $scope.loginData = {};

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    
    $auth.submitLogin($scope.loginData).then(function(response){
      $window.localStorage.setItem('current-user', JSON.stringify(response));
      validateUser();
      

      $state.go('app.home');

      var valetID = response.id
      var url = $scope.rootURL + "api/v1/valets/" + valetID
      
      var data = {
        valet: {
          status: 'available'
        }
      }

      $http.patch(url, data).success(function(change_status){
       
      }).error(function(change_status){
        console.log(change_status)        
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
      validateUser();
 
      $state.go('app.home');
      // console.log(response);

    }).catch(function(response){
      // console.log(response)
    })
  }

  $scope.logout = function(){
    $window.localStorage.setItem('current-user', null)
    validateUser();

  };


})

.controller('ProfileCtrl', function($scope, $http){

  var valetID = $scope.currentUser.id
  console.log(valetID)
  var url = $scope.rootURL + "api/v1/valets/" + valetID
  
  $http.get(url).success(function(response){
    
    $scope.valetInfo = response
  }).error(function(response){
    
  })

})

.controller('HomeCtrl', function($scope, $http, nemSimpleLogger, uiGmapGoogleMapApi){
  nemSimpleLogger.doLog = true; //default is true
  nemSimpleLogger.currentLevel = nemSimpleLogger.LEVELS.debug

  $scope.myLocation = {
    lng : '',
    lat: ''
  }

  $scope.drawSelfMap = function(position) { 
    //$scope.$apply is needed to trigger the digest cycle when the geolocation arrives and to update all the watchers
    $scope.$apply(function() {
      $scope.myLocation.lng = position.coords.longitude;
      $scope.myLocation.lat = position.coords.latitude;
 
      $scope.map = {
        center: {
          latitude: $scope.myLocation.lat,
          longitude: $scope.myLocation.lng
        },
        zoom: 18,
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
            icon: 'http://labs.google.com/ridefinder/images/mm_20_black.png'            
        }
      };

      $scope.pickUpMarkers =[
        {
          id: "a",
          title: "pick up 1",
          latitude: $scope.myLocation.lat+0.002,
          longitude: $scope.myLocation.lng+0.002,
          location: "fasfdasf",
          car_make: "safdsfda",
          name: "asdfsd",
          icon: 'http://labs.google.com/ridefinder/images/mm_20_blue.png',
          show: false,
          clickPin: function(){
            this;
            var directionsService = new google.maps.DirectionsService();
            var directionsDisplay = new google.maps.DirectionsRenderer();
            var matrixService     = new google.maps.DistanceMatrixService();
            
            var selfLocation      = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude)
            var destination       = new google.maps.LatLng(this.latitude, this.longitude) 
       

            var request = {
              origin : selfLocation,
              destination : destination,
              travelMode : google.maps.TravelMode.DRIVING
            }      
            
            directionsService.route(request, function(response, status) {
              if (status == google.maps.DirectionsStatus.OK) {
                  directionsDisplay.setDirections(response);
              
                $scope.path_coords = response.routes[0].overview_path
                $scope.polylines = [
                  {
                    id: 888,
                    path: $scope.path_coords, 
                    stroke: {
                        color: 'red',
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

            var durationDistance = {
              origins : [selfLocation],
              destinations : [destination],
              travelMode : google.maps.TravelMode.DRIVING
            } 
            matrixService.getDistanceMatrix(durationDistance, function(response, status){
              if (status == google.maps.DistanceMatrixStatus.OK){

                var originAddress = response.originAddresses
                var destinationAddress = response.destinationAddresses

                var distanceEST = response.rows[0].elements[0].distance.text
                var timeEST     = response.rows[0].elements[0].duration.text

                console.log(originAddress, destinationAddress, distanceEST, timeEST)
              }
            })  
          }
        },
        {
          id: "b",
          title: "pick up 2", 
          latitude: $scope.myLocation.lat+0.001,
          longitude: $scope.myLocation.lng+0.001,
          location: "fasfdasf",
          car_make: "safdsfda",
          name: "asdfsd",
          icon: 'http://labs.google.com/ridefinder/images/mm_20_blue.png',
          show: false,
          clickPin: function(){
            this;
            var directionsService = new google.maps.DirectionsService();
            var directionsDisplay = new google.maps.DirectionsRenderer();
            var matrixService     = new google.maps.DistanceMatrixService();
            
            var selfLocation      = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude)
            var destination       = new google.maps.LatLng(this.latitude, this.longitude) 
       
            // console.log(selfLocation, destination)
            
            var request = {
              origin : selfLocation,
              destination : destination,
              travelMode : google.maps.TravelMode.DRIVING
            }      
            
            directionsService.route(request, function(response, status) {
              if (status == google.maps.DirectionsStatus.OK) {
                  directionsDisplay.setDirections(response);
              
                $scope.path_coords = response.routes[0].overview_path
                $scope.polylines = [
                  {
                    id: 888,
                    path: $scope.path_coords, 
                    stroke: {
                        color: 'red',
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

            var durationDistance = {
              origins : [selfLocation],
              destinations : [destination],
              travelMode : google.maps.TravelMode.DRIVING
            } 
            matrixService.getDistanceMatrix(durationDistance, function(response, status){
              
              if (status == google.maps.DistanceMatrixStatus.OK){
                // console.log(response, status)
                var originAddress = response.originAddresses
                var destinationAddress = response.destinationAddresses

                var distanceEST = response.rows[0].elements[0].distance.text
                var timeEST     = response.rows[0].elements[0].duration.text

                console.log(originAddress, destinationAddress, distanceEST, timeEST)
              }
            })  
          }
        }
      ]

      $scope.dropOffMarkers =[
        {
          id: "a",
          title: "drop off 1",
          latitude: $scope.myLocation.lat+0.0002,
          longitude: $scope.myLocation.lng+0.0002,
          location: "fasfdasf",
          car_make: "safdsfda",
          name: "asdfsd",
          icon: 'http://labs.google.com/ridefinder/images/mm_20_red.png',
          show: false,
          clickPin: function(){
            this;
            var directionsService = new google.maps.DirectionsService();
            var directionsDisplay = new google.maps.DirectionsRenderer();
            var matrixService     = new google.maps.DistanceMatrixService();
            
            var selfLocation      = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude)
            var destination       = new google.maps.LatLng(this.latitude, this.longitude) 
       

            var request = {
              origin : selfLocation,
              destination : destination,
              travelMode : google.maps.TravelMode.DRIVING
            }      
            
            directionsService.route(request, function(response, status) {
              if (status == google.maps.DirectionsStatus.OK) {
                  directionsDisplay.setDirections(response);
              
                $scope.path_coords = response.routes[0].overview_path
                $scope.polylines = [
                  {
                    id: 888,
                    path: $scope.path_coords, 
                    stroke: {
                        color: 'red',
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

            var durationDistance = {
              origins : [selfLocation],
              destinations : [destination],
              travelMode : google.maps.TravelMode.DRIVING
            } 
            matrixService.getDistanceMatrix(durationDistance, function(response, status){
              if (status == google.maps.DistanceMatrixStatus.OK){

                var originAddress = response.originAddresses
                var destinationAddress = response.destinationAddresses

                var distanceEST = response.rows[0].elements[0].distance.text
                var timeEST     = response.rows[0].elements[0].duration.text

                console.log(originAddress, destinationAddress, distanceEST, timeEST)
              }
            })  
          }
        },
        {
          id: "b",
          title: "drop off 2", 
          latitude: $scope.myLocation.lat+0.0001,
          longitude: $scope.myLocation.lng+0.0001,
          location: "fasfdasf",
          car_make: "safdsfda",
          name: "asdfsd",
          icon: 'http://labs.google.com/ridefinder/images/mm_20_red.png',
          show: false,
          clickPin: function(){
            this;
            var directionsService = new google.maps.DirectionsService();
            var directionsDisplay = new google.maps.DirectionsRenderer();
            var matrixService     = new google.maps.DistanceMatrixService();
            
            var selfLocation      = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude)
            var destination       = new google.maps.LatLng(this.latitude, this.longitude) 

            var request = {
              origin : selfLocation,
              destination : destination,
              travelMode : google.maps.TravelMode.DRIVING
            }      
            
            directionsService.route(request, function(response, status) {
              if (status == google.maps.DirectionsStatus.OK) {
                  directionsDisplay.setDirections(response);
              
                $scope.path_coords = response.routes[0].overview_path
                $scope.polylines = [
                  {
                    id: 888,
                    path: $scope.path_coords, 
                    stroke: {
                        color: 'red',
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

            var durationDistance = {
              origins : [selfLocation],
              destinations : [destination],
              travelMode : google.maps.TravelMode.DRIVING
            } 
            matrixService.getDistanceMatrix(durationDistance, function(response, status){
              if (status == google.maps.DistanceMatrixStatus.OK){

                var originAddress = response.originAddresses
                var destinationAddress = response.destinationAddresses

                var distanceEST = response.rows[0].elements[0].distance.text
                var timeEST     = response.rows[0].elements[0].duration.text

                console.log(originAddress, destinationAddress, distanceEST, timeEST)
              }
            })  
          }
        }
      ]
        
    });
  }



  navigator.geolocation.getCurrentPosition($scope.drawSelfMap); 
  

})