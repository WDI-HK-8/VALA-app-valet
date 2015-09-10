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

      $http.get($scope.rootURL + "api/v1/requests/pickup").success(function(indexPickups){
        
        for (var num = 0; num < indexPickups.length; num++){
          
          var userPickUp      = indexPickups[num].user;
          var sourceLocation  = indexPickups[num].source_location; 
          var id              = indexPickups[num].id;

          var userName        = userPickUp.name;
          var userPic         = userPickUp.profile_picture;
          var transmission    = userPickUp.transmission;
          var userPhoneNum    = userPickUp.phone_number;

          var address         = sourceLocation.address;
          var latitude        = sourceLocation.latitude;
          var longitude       = sourceLocation.longitude;
          
          var myCurLoc        = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude)
          var myDestination   = new google.maps.LatLng(latitude, longitude)

          var matrixService   = new google.maps.DistanceMatrixService();
          
          var durationDistance = {
            origins :       [myCurLoc],
            destinations :  [myDestination],
            travelMode : google.maps.TravelMode.WALKING
          }
            
          matrixService.getDistanceMatrix(durationDistance, function(response, status){
            if (status == google.maps.DistanceMatrixStatus.OK){

              var originAddress = response.originAddresses
              var destinationAddress = response.destinationAddresses

              $scope.distanceEST = response.rows[0].elements[0].distance.text;
              $scope.timeEST     = response.rows[0].elements[0].duration.text;
              
              // console.log(originAddress, destinationAddress, $scope.distanceEST, $scope.timeEST);
            }
          })
        

          $scope.pickUpMarker =  {
            id:           "Pick Up Ticket" + id,
            name:         userName,
            picture:      userPic,
            transmission: transmission, 
            phone:        userPhoneNum,
            latitude:     latitude,
            longitude:    longitude,
            location:     address,
            distanceEST:  $scope.distanceEST,
            timeEST:      $scope.timeEST,
            icon:         'http://labs.google.com/ridefinder/images/mm_20_blue.png',
            show:         false,
            clickPin: function() {
              var directionsService = new google.maps.DirectionsService();
              var directionsDisplay = new google.maps.DirectionsRenderer();
              
              $scope.selfLocation   = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude)
              $scope.destination    = new google.maps.LatLng(this.latitude, this.longitude) 
         
              var request = {
                origin : $scope.selfLocation,
                destination : $scope.destination,
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

          $scope.pickUpMarkers.push($scope.pickUpMarker)
          console.log($scope.pickUpMarker)

        }
      }).error(function(indexPickups){
        console.log(indexPickups)
      })


      $scope.dropOffMarkers =[];

      $http.get($scope.rootURL + "api/v1/requests/dropoff").success(function(indexDropoffs){
        
        for (var num = 0; num < indexDropoffs.length; num++){
          
          var userDropOff     = indexDropoffs[num].user;
          var sourceLocation  = indexDropoffs[num].source_location; 
          var id              = indexDropoffs[num].id;

          var userName        = userDropOff.name;
          var userPic         = userDropOff.profile_picture;
          var transmission    = userDropOff.transmission;
          var userPhoneNum    = userDropOff.phone_number;

          var address         = sourceLocation.address;
          var latitude        = sourceLocation.latitude;
          var longitude       = sourceLocation.longitude;
          
          var myCurLoc        = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude)
          var myDestination   = new google.maps.LatLng(latitude, longitude)

          var matrixService   = new google.maps.DistanceMatrixService();
          
          var durationDistance = {
            origins :       [myCurLoc],
            destinations :  [myDestination],
            travelMode : google.maps.TravelMode.DRIVING
          }
            
          matrixService.getDistanceMatrix(durationDistance, function(response, status){
            if (status == google.maps.DistanceMatrixStatus.OK){

              var originAddress = response.originAddresses
              var destinationAddress = response.destinationAddresses

              $scope.distanceEST = response.rows[0].elements[0].distance.text;
              $scope.timeEST     = response.rows[0].elements[0].duration.text;
              
              // console.log(originAddress, destinationAddress, $scope.distanceEST, $scope.timeEST);
            }
          })
        

          $scope.dropOffMarker =  {
            id:           "Drop Off Ticket" + id,
            name:         userName,
            picture:      userPic,
            transmission: transmission, 
            phone:        userPhoneNum,
            latitude:     latitude,
            longitude:    longitude,
            location:     address,
            distanceEST:  $scope.distanceEST,
            timeEST:      $scope.timeEST,
            icon:         'http://labs.google.com/ridefinder/images/mm_20_red.png',
            show:         false,
            clickPin: function() {
              var directionsService = new google.maps.DirectionsService();
              var directionsDisplay = new google.maps.DirectionsRenderer();
              
              $scope.selfLocation   = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude)
              $scope.destination    = new google.maps.LatLng(this.latitude, this.longitude) 
         
              var request = {
                origin : $scope.selfLocation,
                destination : $scope.destination,
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
            }
          }

          $scope.dropOffMarkers.push($scope.dropOffMarker)
          console.log($scope.dropOffMarker)

        }
      }).error(function(indexDropoffs){
        console.log(indexDropoffs)
      })


        
    });
  }

  navigator.geolocation.getCurrentPosition($scope.drawSelfMap); 
  
  $scope.valetReply = function(){
    console.log("hello")
    var valetID = $scope.currentUser.id;
    var requestID = this.id
    var url = $scope.rootURL + "api/v1/valets/" + valetID + "/requests/" + requestID + "/valet_pick_up"
    console.log(requestID)

    $http.patch(url).success(function(response){
      console.log(response)
    }).error(function(response){
      console.log(response)
    })
  }

  $scope.closeInfoWindow = function(){
    infowindow.close();
  }


})