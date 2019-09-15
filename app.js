var mainApp = angular.module("mainApp", ['ngSanitize']);
         
  
mainApp.controller('QueryBuilderController', function($scope) {
   $scope.conditions = Array.from(['Endswith','Startswith','==','<=','>=','IsNull','IsNotNull'],function(v,i){return {name:v}});
    $scope.operators = Array.from(["AND","OR"],function(v,i){return {name:v}});
    var data = '{"group": {"operator": "AND","rules": []}}';
    
    $scope.filterData = {};
    $scope.queryfields = [{
      name:'a'
    },{
      name:'b'
    }];

    function htmlEntities(str) {
        return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function compute(group) {
        if (!group) return "";
        for (var str = "(", i = 0; i < group.rules.length; i++) {
            i > 0 && (str += " <strong>" + group.operator + "</strong> ");
            str += group.rules[i].group ?
                compute(group.rules[i].group) :
                group.rules[i].field + " " + htmlEntities(group.rules[i].condition) + " " + group.rules[i].data;
        }

        return str + ")";
    }
    
    function craeteJsonObject(obj,data) {
        angular.forEach(obj,function(v,k){
            if(v.group){
                if(angular.isArray(data)){
                    var tempObj = {};
                    tempObj[v.group.operator] = [];
                    data.push(tempObj);
                    craeteJsonObject(v.group.rules,data[data.length - 1][v.group.operator]);
                }else{
                    data[v.group.operator] = [];
                    craeteJsonObject(v.group.rules,data[v.group.operator]);
                }

            }else{
                
                data.push($scope.formatJson(v,v.condition));
            }
        });
        return data
    }
    $scope.formatJson = function(data,operator){
       
        var obj = {
            "attribute": $scope.queryfields[$scope.queryfields.findIndex(function(val){ return val.name === data.field})].value, 
            "condition":'',
            "value":data.data
        };
    
        switch(operator){
            case 'Endswith': obj.condition = 'iendswith';
                break ;
            case 'Startswith': obj.condition = 'istartswith';
                break ;
            case '==': obj.condition = 'equal';
                break ;
            case '<=': obj.condition = 'lte';
                break ;
            case '>=': obj.condition = 'gte';
                break ;
            case 'IsNull': obj.condition = 'isnull';
                obj.value = true;
                break ;
            case 'IsNotNull': obj.condition = 'isnull';
                obj.value = false;
                break ;
        }
        return obj
    }

    $scope.buildQueryString = function(){
        $scope.filterData = {};
        $scope.filterData =  angular.copy(craeteJsonObject([JSON.parse($scope.json)],$scope.filterData));
    }


    $scope.json = null;
    $scope.filter = JSON.parse(data);

    $scope.$watch('filter', function (newValue) {
        console.log($scope.filter);
        $scope.json = JSON.stringify(newValue, null, 2);
        $scope.output = compute(newValue.group);
        console.log($scope.output,'output adasdas');
    }, true);
    
    /**** End: Query Builder Section ***/
});

mainApp.directive('queryBuilder', queryBuilder);

function queryBuilder($compile) {
    var directive = {
        restrict: 'E',
        scope: {
            group: '=',
            operators: '=',
            fields: '=',
            conditions: '=',
            hideGroup: '=?'
        },
        templateUrl: 'query-builder.html',
        
        compile:compile
    };
    return directive;
    function compile(element, attrs) {
        var content, directive;
        content = element.contents().remove();
        return function (scope, element, attrs) {
            
            scope.addCondition = function () {
                scope.group.rules.push({
                    condition: scope.conditions[0].name,
                    field: scope.fields[0].name,
                    data: ''
                });
            };

            scope.removeCondition = function (index) {
                scope.group.rules.splice(index, 1);
            };

            scope.addGroup = function () {
                scope.group.rules.push({
                    group: {
                        operator: 'AND',
                        rules: []
                    }
                });
            };

            scope.removeGroup = function () {
                "group" in scope.$parent && scope.$parent.group.rules.splice(scope.$parent.$index, 1);
            };

            directive || (directive = $compile(content));

            element.append(directive(scope, function ($compile) {
                return $compile;
            }));
        }
    }
};