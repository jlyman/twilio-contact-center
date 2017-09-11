function AuthenticateController ($scope, $http) {

	$scope.reset = function () {
		$scope.loginForm.$setValidity('notFound', true);
		$scope.loginForm.$setValidity('serverError', true);
	};

	$scope.login = function () {
		var endpoint = navigator.userAgent.toLowerCase() + Math.floor((Math.random() * 1000) + 1);

		$http.post('/authenticate', { worker: $scope.worker, endpoint: endpoint })

			.then(function onSuccess (response) {
				window.location.replace('/');
			}, function onError (response) {

				if (response.status === 404) {
					$scope.loginForm.$setValidity('notFound', false);
				} else {
					$scope.loginForm.$setValidity('serverError', false);
				}

			});

	};

}

angular
	.module('callcenterApplication', ['ngMessages'])
	.controller('AuthenticateController', AuthenticateController);