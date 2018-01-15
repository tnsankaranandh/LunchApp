var app = angular.module('lunchApp');

app.controller('ItemMasterController', function ($http, $q, $timeout) {
    var vm = this;
    vm.items = [];
    var page = 1;
    var limit = 50;
    vm.isQuerying = false;
    vm.hasMoreData = true;

    function updateList() {
        if (page === 1) {
            vm.items = [];
        }
        vm.isQuerying = true;
        $http
            .post('/item/getList', {
                page: page,
                limit: limit
            })
            .then(function (successResponse) {
                vm.isQuerying = false;
                var currentData = !!successResponse && !!successResponse.data && !!successResponse.data.items && successResponse.data.items || [];
                vm.hasMoreData = currentData.length === limit;
                vm.items = vm.items.concat(currentData);
            }, function (errorResponse) {
                vm.isQuerying = false;
                console.log(errorResponse);
                alert('Error while getting Items.');
            });
    };
    updateList();

    vm.loadNextPage = function () {
        if (!!vm.items[(vm.items.length || 1) - 1].isInEditMode || !!vm.items[0].isInEditMode) {
            return;
        }
        page++;
        updateList();
    };

    vm.addItem = function () {
        vm.items.unshift({
            name: '',
            hotelUid: { _id: '', name: '' },
            rate: 0,
            isInEditMode: true
        });
        vm.enableTypeAhead(0);
    };

    vm.saveItem = function (i) {
        var url = '/item/create';
        if (!!i._id) { url = '/item/update'; }
        var savingI = angular.copy(i);
        delete savingI.isInEditMode;
        savingI.hotelUid = savingI.hotelUid._id;
        $http
            .post(url, i)
            .then(function (successResponse) {
                i._id = successResponse.data.uid;
            }, function (errorResponse) {
                console.log(errorResponse);
                alert('Error while saving Item.');
            });
    };


    vm.enableTypeAhead = function (index) {
        $timeout(function () {
            $('#hotelTypeAhead' + index).typeahead({
                source: function (sh, process) {
                    $http
                        .post('/hotel/getList', {
                            name: sh
                        })
                        .then(function (successResponse) {
                            process(!!successResponse && !!successResponse.data && successResponse.data.hotels || []);
                        }, function (errorResponse) {
                            console.log(errorResponse);
                            alert('Error while searching Hotels');
                        });
                },
                afterSelect: function (selectedHotel) {
                    $timeout(function () { vm.items[index].hotelUid = selectedHotel; });
                }
            });
        });
    };
});