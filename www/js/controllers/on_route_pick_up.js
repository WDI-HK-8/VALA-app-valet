app.controller('OnRoutePickUpCtrl', function($scope, $http, nemSimpleLogger, uiGmapGoogleMapApi, $rootScope, $state, PrivatePubServices, $window, $ionicPopup){
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
        zoom: 14,
        pan: 3
      };

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

      $scope.currentTicket = JSON.parse($window.localStorage.getItem('current-ticket'))
      console.log($scope.currentTicket);


      $scope.validateUser();

      var targetLat = $scope.currentTicket.source_location.latitude;
      var targetLng = $scope.currentTicket.source_location.longitude;
      var selfLocation   = new google.maps.LatLng($scope.marker.coords.latitude, $scope.marker.coords.longitude);

      var targetDestination = new google.maps.LatLng(targetLat, targetLng);

      var targetCarParkLat  = $scope.currentTicket.parking_location.latitude;
      var targetCarParkLng  = $scope.currentTicket.parking_location.longitude;

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
    var valetID = this.currentTicket.valet_id_pick_up;
    var requestID = this.currentTicket.request_id;
    console.log($scope.currentTicket)

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
