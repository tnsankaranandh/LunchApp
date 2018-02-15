var app = angular.module('lunchApp');

app.controller('UserMasterController', function ($http) {
    var vm = this;
    var page = 1;
    var limit = 50;
    vm.isQuerying = false;
    vm.hasMoreData = true;

    function updateList() {
        if (page === 1) {
            vm.users = [];
        }
        vm.isQuerying = true;
        $http
            .post('/user/getList', {
                page: page,
                limit: limit
            })
            .then(function (successResponse) {
                vm.isQuerying = false;
                var currentData = !!successResponse && !!successResponse.data && !!successResponse.data.users && successResponse.data.users || [];
                vm.hasMoreData = currentData.length === limit;
                vm.users = vm.users.concat(currentData);
            }, function (errorResponse) {
                vm.isQuerying = false;
                console.log(errorResponse);
                alert('Error while getting Users.');
            });
    };
    updateList();

    vm.loadNextPage = function () {
        if (!!vm.users[(vm.users.length || 1) - 1].isInEditMode || !!vm.users[0].isInEditMode) {
            return;
        }
        page++;
        updateList();
    };

    vm.addUser = function () {
        vm.users.unshift({
            name: '',
            isInEditMode: true
        });
    };

    vm.saveUser = function (u) {
        var url = '/user/create';
        if (!!u._id) { url = '/user/update'; }
        delete u.isInEditMode;
        $http
            .post(url, u)
            .then(function (successResponse) {
                console.log(successResponse);
                u._id = successResponse.data.uid;
            }, function (errorResponse) {
                console.log(errorResponse);
                alert('Error while saving User.');
            });
    };
});