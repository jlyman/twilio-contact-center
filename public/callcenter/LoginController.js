function LoginController ($scope, $http, $log) {

	// List of available workers
	$scope.workers = [];
	$scope.selectedWorker = '';

	/* UI */
	$scope.UI = { warning: { browser: null, worker: null}};

	$scope.init = function () {

		$http.get('/api/agents/list')
			.then(function onSuccess (response) {

				/* keep a local copy of the configuration and the worker */
				$scope.workers = response.data.workers.map(function (w) {
					return { friendlyName: w };
				});

			}, function onError (response) {
				/* session is not valid anymore */
				if (response.status === 403) {
					window.location.replace('/callcenter/');
				} else {
					$log.error(JSON.stringify(response));
					$scope.UI.warning.worker = JSON.stringify(response);
					$scope.$apply();
				}

			});
	};

	$scope.reset = function () {
		$scope.loginForm.$setValidity('notFound', true);
		$scope.loginForm.$setValidity('serverError', true);
	};

	$scope.login = function () {
		var endpoint = navigator.userAgent.toLowerCase() + Math.floor((Math.random() * 1000) + 1);

		$http.post('/api/agents/login', { worker: $scope.selectedWorker, endpoint: endpoint })

			.then(function onSuccess (response) {
				window.location.replace('/callcenter/workplace.html');
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
	.controller('LoginController', LoginController);