angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $auth, $ionicPopup, $window, $log, $state, $http, $rootScope) {

  $scope.rootURL = "http://localhost:3000/"
  $scope.$on('pushChangesToAllNodes', function( event, message ){
    $scope.$broadcast( message.name, message.data );
  });  


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
  var url = $scope.rootURL + "api/v1/valets/" + valetID
  
  $http.get(url).success(function(response){
    
    $scope.valetInfo = response
  }).error(function(response){
    
  })

})

.controller('HomeCtrl', function($scope, $http, nemSimpleLogger, uiGmapGoogleMapApi, $ionicModal, $state, $rootScope){
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
            icon: 'http://labs.google.com/ridefinder/images/mm_20_black.png'            
        }
      };

      $scope.pickUpMarkers =[];
      var newMarker = {};

      var createDirectionsService = function(originLoc, destinationLoc){
        var directionsService = new google.maps.DirectionsService();
        var directionsDisplay = new google.maps.DirectionsRenderer();

        var request = {
          origin : originLoc,
          destination : destinationLoc,
          travelMode : google.maps.TravelMode.WALKING
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
      }

      var createMarker = function(title, id, userName, userPic, transmission, userPhoneNum, latitude, longitude, address, distanceEST, timeEST, icon){
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
            
            createDirectionsService($scope.selfLocation, $scope.destination)
          }
        }
      }

      var runMarker = function(indexElement, title, iconURL){
                 
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

            createMarker(title, id, userName, userPic, transmission, userPhoneNum, latitude, longitude, address, distanceEST, timeEST, iconURL)

            $scope.pickUpMarkers.push(newMarker)
          }
        console.log($scope.pickUpMarkers)
        })
      }


      $http.get($scope.rootURL + "api/v1/requests/pickup").success(function(indexPickups){
        for (var num = 0; num < indexPickups.length; num++){
          runMarker(indexPickups[num],"Pick up ticket", 'img/blue-dot.png');
        }
      }).error(function(indexPickups){
        console.log(indexPickups)
      })


      $scope.dropOffMarkers =[];

      $http.get($scope.rootURL + "api/v1/requests/dropoff").success(function(indexDropoffs){
        for (var num = 0; num < indexDropoffs.length; num++){
          runMarker(indexDropoffs[num], "Drop off ticket", 'img/red-dot.png')
        }
      }).error(function(indexDropoffs){
        console.log(indexDropoffs)
      })

    });
  }

  navigator.geolocation.getCurrentPosition($scope.drawSelfMap); 
  

  $scope.valetReply = function(){
    var valetID = $scope.currentUser.id;
    var requestID = this.currentLocation.id
    var url = $scope.rootURL + "api/v1/valets/" + valetID + "/requests/" + requestID + "/valet_pick_up"

    $http.patch(url).success(function(response){
      console.log(response);
      $state.go('app.pickup');
      $rootScope.$emit('userDetail', response);

    }).error(function(response){
      console.log(response)
    })
  }
})

.controller('OnRoutePickUpCtrl', function($scope, $http, nemSimpleLogger, uiGmapGoogleMapApi, $timeout, $rootScope){
  nemSimpleLogger.doLog = true; //default is true
  nemSimpleLogger.currentLevel = nemSimpleLogger.LEVELS.debug

  $scope.myLocation = {
    lng : '',
    lat: ''
  }

  $scope.pickUpMap = function(position){

    $scope.$apply(function() {
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
      }

      var createDirectionsService = function(destination, originLoc, destinationLoc){
        var directionsService = new google.maps.DirectionsService();
        var directionsDisplay = new google.maps.DirectionsRenderer();

        if(destination == "carpark"){
          var request = {
            origin : originLoc,
            destination : destinationLoc,
            travelMode : google.maps.TravelMode.DRIVING
          }

          directionsService.route(request, function(response, status) {
          if (status == google.maps.DirectionsStatus.OK) {
              directionsDisplay.setDirections(response);
          console.log(response)
            $scope.path_coords = response.routes[0].overview_path
            $scope.polylines_park = [
              {
                id: 888,
                path: $scope.path_coords, 
                stroke: {
                    color: 'green',
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

        } else {
          var request = {
            origin : originLoc,
            destination : destinationLoc,
            travelMode : google.maps.TravelMode.WALKING
          }
          directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
            console.log(response)
              $scope.path_coords = response.routes[0].overview_path
              $scope.polylines = [
                {
                  id: 999,
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
        }
      }


      $rootScope.$on('userDetail', function(event, data){
        
        var targetLat = data.source_location.latitude 
        var targetLng = data.source_location.longitude 
        var selfLocation   = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude)
        
        var targetDestination = new google.maps.LatLng(targetLat, targetLng) 

        var targetCarParkLat  = data.parking_location.latitude
        var targetCarParkLng  = data.parking_location.longitude

        var carParkDestination = new google.maps.LatLng(targetCarParkLat, targetCarParkLng) 


        createTarget(targetLat, targetLng, 'img/blue-dot.png')
        createDirectionsService("client", selfLocation, targetDestination)
        
        createTarget(targetCarParkLat, targetCarParkLng, 'img/parkinglot.png')
        createDirectionsService("carpark", targetDestination, carParkDestination)
        
      })




      






  

    })

  }
  navigator.geolocation.getCurrentPosition($scope.pickUpMap); 

})