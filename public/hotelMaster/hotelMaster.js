var app = angular.module('lunchApp');

app.controller('HotelMasterController', function ($http) {
    var vm = this;
    var page = 1;
    var limit = 50;
    vm.isQuerying = false;
    vm.hasMoreData = true;

    function updateList() {
        if (page === 1) {
            vm.hotels = [];
        }
        vm.isQuerying = true;
        $http
            .post('/hotel/getList', {
                page: page,
                limit: limit
            })
            .then(function (successResponse) {
                vm.isQuerying = false;
                var currentData = !!successResponse && !!successResponse.data && !!successResponse.data.hotels && successResponse.data.hotels || [];
                vm.hasMoreData = currentData.length === limit;
                vm.hotels = vm.hotels.concat(currentData);
            }, function (errorResponse) {
                vm.isQuerying = false;
                console.log(errorResponse);
                alert('Error while getting Hotels.');
            });
    };
    updateList();

    vm.loadNextPage = function () {
        if (!!vm.hotels[(vm.hotels.length || 1) - 1].isInEditMode || !!vm.hotels[0].isInEditMode) {
            return;
        }
        page++;
        updateList();
    };

    vm.addHotel = function () {
        vm.hotels.unshift({
            name: '',
            isInEditMode: true
        });
    };

    vm.saveHotel = function (h) {
        var url = '/hotel/create';
        if (!!h._id) { url = '/hotel/update'; }
        delete h.isInEditMode;
        $http
            .post(url, h)
            .then(function (successResponse) {
                console.log(successResponse);
                h._id = successResponse.data.uid;
            }, function (errorResponse) {
                console.log(errorResponse);
                alert('Error while saving Hotel.');
            });
    };
});